import { useState, useRef, useEffect } from 'react';
import { Adb, AdbDaemonTransport } from '@yume-chan/adb';
import { AdbDaemonWebUsbDeviceManager } from '@yume-chan/adb-daemon-webusb';
import AdbWebCredentialStore from '@yume-chan/adb-credential-web';
import { enviarImagenToastPos } from '../../libs/fetch_data/noveltyFecth.js';
import { TIRAS_DE_LECTURA, SOLAPE_DE_LECTURA, tirasParaElAncho } from '../../libs/tickets/configLectura.js';
import { SIMULACION_DISPONIBLE } from '../../simulador/disponible.js';
import { registroDeInferencia, TIPO } from '../../libs/tickets/registroDeInferencia.js';
import { getTimeoutMs, checkAiServer } from '../../libs/inference/aiServer.js';
import { readAiSettings, subscribeToAiSettings, maskApiKey } from '../../libs/inference/aiSettings.js';
import { getTabletImage, cropStrip } from '../../libs/inference/tabletImage.js';
import { runInferenceOnce, startInferenceLoop } from '../../libs/inference/inferenceLoop.js';
import { mergeStripTickets } from '../../libs/inference/mergeStrips.js';




import TabletContainer from './assets/TabletContainer.jsx';
import TabletRender from './assets/TabletRender.jsx';
import ZoomBar, { ZOOM_MIN, ZOOM_MAX } from './assets/ZoomBar.jsx';




//  ══════════════════════════════════════════════════════════════════════
//  EL LOCAL QUE SE ESTÁ MONITOREANDO
//  ══════════════════════════════════════════════════════════════════════
//  Esta ventana NO tiene el store de Redux: main.jsx la monta sola, sin
//  `Provider`, para no levantar Jarvis entero dentro de un recuadro de 400×300.
//  Así que `state.establishment` no existe acá y hay que leerlo de donde Home lo
//  deja al elegir local.
//
//  Funciona porque las dos ventanas cargan la MISMA dirección
//  (`http://localhost:5173`) en la misma sesión de Electron: mismo origen,
//  mismo `localStorage`. Elegir el local en la ventana principal se ve desde
//  esta sin hacer nada.
//
//  Devuelve null si todavía no hay local elegido, que es un estado normal —
//  la flotante se puede abrir antes de entrar a un establecimiento.
const localEnCurso = () => {
    try {
        return JSON.parse(localStorage.getItem('local_appExpress'))?.[0] ?? null;
    }
    catch { return null; }
};


const CLAVE_ZOOM = 'tablet:zoom';


//  Último zoom que usó esta máquina. Si no hay nada guardado, o el valor quedó
//  corrupto o fuera de rango, se vuelve al 100 % en vez de arrastrar el error.
function leerZoomGuardado() {
    try {
        const guardado = Number(localStorage.getItem(CLAVE_ZOOM));
        if (Number.isFinite(guardado) && guardado >= ZOOM_MIN && guardado <= ZOOM_MAX) return guardado;
    }
    catch { /* sin acceso al almacenamiento: se usa el valor por defecto */ }

    return 100;
}


//  MODO IA: si la lectura de tickets está activada. Con la IA en pausa el espejo sigue
//  vivo y se puede enviar la captura; lo único que deja de hacerse es mandar tiras al
//  modelo. Se recuerda por máquina, como el zoom. Sin nada guardado, activado: es como
//  funcionaba antes de existir el botón.
const CLAVE_MODO_IA = 'tablet:modo-ia';

function leerModoIAGuardado() {
    try { return localStorage.getItem(CLAVE_MODO_IA) !== '0'; }
    catch { return true; }
}


//  EL SERVIDOR DE IA. Su DIRECCIÓN y su CLAVE ya no están en el '.env': las escribe el usuario en
//  «Opciones → Servidor de IA», en la ventana principal, y se guardan en este equipo (aiSettings.js).
//  El '.env' se horneaba al construir, así que en la aplicación instalada del restaurante nadie podía
//  cambiar de servidor sin volver a compilar; desde el menú, sí.
//
//  Esta ventana los lee con readAiSettings() y se queda escuchando con subscribeToAiSettings(): al
//  guardarlos en la otra ventana, esta vuelve a consultar el servidor sola. NO hay que reabrirla.
//
//  Del '.env' solo queda cuánto se le espera:
//      VITE_AI_TIMEOUT_S  cuántos segundos se le espera por tira (opcional)
//  Y el MODELO no va en ningún sitio: se le pregunta al servidor al abrir la ventana (STEP 0).

// AI_TIMEOUT_MS = «tiempo máximo que se espera al modelo por cada tira, en milisegundos»
const AI_TIMEOUT_MS = getTimeoutMs(import.meta.env.VITE_AI_TIMEOUT_S);

// CHECK_RETRY_MS = «cada cuánto se vuelve a consultar un servidor que no está activo, en milisegundos»
const CHECK_RETRY_MS = 10000;

// CHECK_AGAIN_DELAY_MS = «cuánto se espera antes de volver a consultarlo tras una inferencia fallida»
const CHECK_AGAIN_DELAY_MS = 5000;

// MAX_CHECK_AGAIN_DELAY_MS = «lo máximo que se espera antes de volver a consultarlo»
const MAX_CHECK_AGAIN_DELAY_MS = 60000;

// PAUSE_BETWEEN_ROUNDS_MS = «pausa entre dos vueltas buenas, en milisegundos». Es el ritmo del espejo: así cada
// vuelta ve una captura nueva. Con un servidor que tarda 45 s por tira no se nota; con uno rápido evita 5 lecturas por segundo.
const PAUSE_BETWEEN_ROUNDS_MS = 500;

// MAX_CAPTURE_AGE_MS =«la edad máxima de una captura ya leída para volver a leerla, en milisegundos»
const MAX_CAPTURE_AGE_MS = 15000;

// SILENT_TABLET_ERROR = «el aviso de que la tablet dejó de mandar capturas»
const SILENT_TABLET_ERROR = 'la tablet no manda capturas desde hace más de 15 s: desconéctala y vuelve a conectarla';

// CAUSES_TO_CHECK_AGAIN = «las causas de fallo que obligan a volver a consultar el servidor»
// Con las tres primeras puede que el servidor ya no esté, o que le hayan cambiado el modelo.
// Con 'auth' y 'no-url' se vuelve a consultar por lo contrario: para PARAR el bucle. Seguir mandando
// tiras con una clave que no vale solo gasta el servidor, y la consulta deja el aviso en la barra.
const CAUSES_TO_CHECK_AGAIN = ['network', 'cors', 'model-rejected', 'auth', 'no-url'];

// CAUSES_WITHOUT_RETRY = «las causas por las que NO se vuelve a preguntar cada 10 segundos»
// Un servidor apagado puede encenderse solo; una clave rechazada o una dirección que falta, no: eso
// se arregla en «Opciones → Servidor de IA». Insistir cada 10 s no lo arreglaría y llenaría el
// registro del mismo fallo. Se queda quieto y lo dice en la barra hasta que cambien los ajustes.
// 'https-not-supported' va aquí por lo mismo que 'no-url': hasta que alguien cambie la dirección en
// Opciones, volver a preguntar cada 10 s solo repite la misma sonda contra el mismo servidor.
const CAUSES_WITHOUT_RETRY = ['auth', 'no-url', 'https-not-supported'];



// buildDiagnosis = «armar el diagnóstico»
// PURA. Cómo fue una vuelta: viaja con cada entrega, y VentanaTablet lo pinta junto a las pestañas.
// Recibe: result (el resultado de runInferenceOnce).
// Devuelve: { tira, tiras, modelo, leidos, descartados, segundos, error }
// 'leidos' son los objetos que devolvió el modelo; 'descartados', los que no llegaron a ser un ticket.
function buildDiagnosis(result) {
    return {
        tira: result.strip,
        tiras: result.strips,
        modelo: result.model,
        leidos: result.tickets.length + result.discarded.length,
        descartados: result.discarded.length,
        segundos: result.seconds,
        error: result.error,
    };
}



// buildSilentTabletResult = «armar el resultado de una tablet que no contesta»
// PURA. La vuelta que NO se da porque la tablet dejó de mandar capturas. Con las claves de runInferenceOnce.
// Recibe: capture (la última captura que llegó), strip, strips (la tira que tocaba, y de cuántas) y model (el modelo).
// Devuelve: { ok: false, strip, strips, time, model, seconds, tickets, discarded, error, cause: 'silent-tablet' }
function buildSilentTabletResult(capture, strip, strips, model) {
    return {
        ok: false,
        strip: strip,
        strips: strips,
        time: capture.time,
        model: model,
        seconds: 0,
        tickets: [],
        discarded: [],
        error: SILENT_TABLET_ERROR,
        cause: 'silent-tablet',
    };
}



// describeAiFailure = «describir el fallo de la IA»
// PURA. Cómo se nombra un servidor que no está activo, igual en la barra que en el registro.
// Con la clave rechazada o sin dirección NO falta la conexión —contestar, contesta—: falta algo que
// solo se arregla en «Opciones → Servidor de IA», y el aviso que trae aiServer.js ya lo dice entero.
// Recibe: server (lo que contestó checkAiServer, con active: false).
// Devuelve: 'IA sin conexión: servidor apagado…'  o  'IA: clave rechazada (401)…'
// NO_ANSWER_CAUSES = «las causas en las que NADIE contestó»
// Solo esas son «sin conexión». Un 404 o un 401 son el servidor CONTESTANDO, y llamarlos «sin
// conexión» mandaba a revisar el cable y el certificado cuando lo que fallaba era el modelo montado
// o la clave: tres averías distintas en pantalla donde había una.
const NO_ANSWER_CAUSES = ['network', 'cors', 'timeout'];

function describeAiFailure(server) {

    if (NO_ANSWER_CAUSES.includes(server?.cause)) return `IA sin conexión: ${server?.error}`;

    return `IA: ${server?.error}`;
}



// describeApiKey = «describir la clave»
// PURA. Lo ÚNICO que se puede apuntar de la clave en el registro de la inferencia, que se enseña en
// pantalla y se copia al portapapeles: si la hay y cuál es, tapada. Nunca la clave entera.
// Recibe: apiKey (la de los ajustes). Devuelve: 'sk-abc…c4f2', o '(sin clave)' si no hay ninguna.
function describeApiKey(apiKey) {

    // masked = «la clave tapada». maskApiKey devuelve '' cuando no hay clave guardada.
    const masked = maskApiKey(apiKey);

    if (masked === '') return '(sin clave)';

    return masked;
}



// getCheckAgainDelayMs = «obtener la espera antes de volver a consultar el servidor»
// PURA. Un modelo rechazado una y otra vez no puede costar una tira subida cada 5 s: la espera crece.
// Recibe: rejectionsInARow (cuántas veces seguidas ha rechazado el servidor el modelo).
// Devuelve: 5 s hasta el primer rechazo; desde el segundo, 5 s más por cada uno (10, 15, 20…), hasta un minuto.
function getCheckAgainDelayMs(rejectionsInARow) {
    if (rejectionsInARow <= 1) return CHECK_AGAIN_DELAY_MS;

    return Math.min(MAX_CHECK_AGAIN_DELAY_MS, CHECK_AGAIN_DELAY_MS * rejectionsInARow);
}


/*  @param {function} onTickets  por aquí salen los tickets hacia la parrilla que
 *                               vive debajo, en la misma ventana. Sin esta función el
 *                               componente sigue funcionando igual: solo deja de
 *                               entregar lo que lee.
 *  @param {function} onCerrar / onArrastrarBarra  solo hacen falta fuera de Electron,
 *                               donde la ventana no se cierra ni se mueve sola.
 *  @param {string}   nombreLocal  para que la barra diga de qué local es esta tablet.
 *  @param {function} onSimulacion  recibe true al engancharse a la pantalla de Toast
 *                               simulada y false al desconectar. Es lo ÚNICO que sale de
 *                               aquí sobre la simulación: la lectura no sabe nada de ella.
 */
/*  'refreshMs' es cada cuánto se pide una captura nueva a la tablet: el ritmo del ESPEJO,
 *  no el de la lectura por IA. Bajarlo hace el vídeo más suave, no los datos más frescos:
 *  el ritmo de la lectura lo pone el servidor de IA (cada vuelta empieza al contestar la anterior).
 */
function TabletScreen({ refreshMs = 500, onTickets, onCerrar, onArrastrarBarra, nombreLocal, onSimulacion }) {

    //  LA ÚLTIMA VERSIÓN DE 'onTickets'. El bucle de inferencia se arma una vez y se queda con las
    //  funciones de ese render: llamando a la prop directamente seguiría usando la primera versión.
    //  Esta referencia se actualiza en cada render, así que el bucle lee siempre la buena.
    const onTicketsRef = useRef(onTickets);
    useEffect(() => { onTicketsRef.current = onTickets; }, [onTickets]);

    //  Lo mismo con 'onSimulacion': la desconexión también puede dispararla el bucle.
    const onSimulacionRef = useRef(onSimulacion);
    useEffect(() => { onSimulacionRef.current = onSimulacion; }, [onSimulacion]);


    //  De qué local es esta tablet. Manda lo que pase quien nos monte; si no pasa
    //  nada, se resuelve solo desde donde la ventana principal deja el local elegido.
    const nombreDelLocal = nombreLocal ?? localEnCurso()?.name ?? '';


    //  ESTADO DE CONEXIÓN
    const [connected, setConnected] = useState(false);
    const [statusText, setStatusText] = useState('Sin conectar');
    const [imgUrl, setImgUrl] = useState(null);

    //  LO QUE SE PINTA DE LA LECTURA, en la barra de arriba
    const [ultimoError, setUltimoError] = useState(null);       // qué falló en la última vuelta, si falló
    const [consultando, setConsultando] = useState(false);      // hay una vuelta en curso ahora mismo
    const [tiraEnLectura, setTiraEnLectura] = useState(null);   // la última tira que se mandó al modelo

    // aiServer = «el servidor de IA»: lo que contestó checkAiServer (STEP 0). null = todavía no ha contestado.
    // Va en un estado para pintarlo en la barra, y en una ref para que el bucle lea siempre el último.
    const [aiServer, setAiServer] = useState(null);

    // aiServerRef = «el servidor de IA, para el bucle»
    const aiServerRef = useRef(null);

    // serverCheckNumber = «el número de la consulta al servidor»: cuando cambia, se le vuelve a consultar
    const [serverCheckNumber, setServerCheckNumber] = useState(0);

    // aiSettingsRef = «la dirección y la clave del servidor de IA», como están guardadas en este equipo.
    // Van en una ref y no en el estado porque no se pintan —la clave menos que nada—: las leen el STEP 0
    // y cada vuelta del bucle, justo cuando las usan. Se leen una vez al abrir la ventana; a partir de
    // ahí las refresca sola la suscripción de más abajo.
    const aiSettingsRef = useRef(null);
    if (aiSettingsRef.current === null) aiSettingsRef.current = readAiSettings();

    // nextCheckDelayRef = «lo que se espera antes de la consulta siguiente, en milisegundos»
    // Lo pone quien la pide: al abrir la ventana y al cambiar los ajustes, nada (se quiere ver el
    // resultado ya); tras una vuelta fallida, unos segundos, porque un fallo que se repite daría
    // vueltas sin freno. Va en una ref: cambiarlo NO tiene que volver a pintar la ventana.
    const nextCheckDelayRef = useRef(0);


    //  Un intento de conexión en curso. El estado pinta el botón girando; la ref es el
    //  cerrojo, porque dos clics en el mismo fotograma verían los dos el estado viejo y
    //  abrirían dos conexiones sobre el mismo USB.
    const [conectando, setConectando] = useState(false);
    const conectandoRef = useRef(false);


    //  MODO IA. Es una de las tres condiciones del bucle de inferencia: en pausa, el bucle se para.
    const [modoIA, setModoIA] = useState(leerModoIAGuardado);

    useEffect(() => {
        try { localStorage.setItem(CLAVE_MODO_IA, modoIA ? '1' : '0'); }
        catch { /* es una comodidad: sin almacenamiento, vale para esta sesión */ }
    }, [modoIA]);


    //  EL RECORRIDO DE LA PANTALLA POR TIRAS
    //  La pantalla entera lleva unos 30 tickets con letra minúscula, y el modelo la encoge antes de
    //  mirarla: se le manda una tira cada vez, por turno (el porqué largo está en configLectura.js).

    // stripRef = «la tira que toca leer»
    const stripRef = useRef(0);

    // stripsRef = «en cuántas tiras se corta ESTA pantalla». Depende de su ancho: se sabe con la primera captura.
    const stripsRef = useRef(TIRAS_DE_LECTURA);

    //  Lo mismo que 'stripsRef', como estado, para pintar las marcas de la barra.
    const [tiras, setTiras] = useState(TIRAS_DE_LECTURA);

    // accumulatedRef = «el acumulado»: los tickets de TODAS las tiras (Map clave → ticket).
    // Cada vuelta solo ve una tira: sin juntarlos, en la parrilla solo quedarían los de la última.
    const accumulatedRef = useRef(new Map());

    //  ZOOM de la imagen, en porcentaje. 100 = la pantalla entera cabe en la ventana.
    //  Arranca con el último valor que usó esta máquina, para no tener que volver
    //  a ajustarlo cada vez que se abre la ventana.
    const [zoom, setZoom] = useState(leerZoomGuardado);


    //  Se guarda en cuanto cambia. El navegador lo conserva aunque se apague el
    //  equipo, así que sobrevive a cierres accidentales y a reinicios.
    useEffect(() => {
        try { localStorage.setItem(CLAVE_ZOOM, String(zoom)); }
        catch { /* en modo privado puede fallar: no es motivo para romper nada */ }
    }, [zoom]);


    //  Se mantiene siempre entre el mínimo y el máximo: así los botones nunca
    //  dejan el zoom en un valor absurdo por mucho que se pulsen.
    const cambiarZoom = (delta) => {
        setZoom(actual => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, actual + delta)));
    };


    //  GUARDA LA CAPTURA ACTUAL Y LAS TIRAS QUE SE LE MANDAN AL MODELO — para el banco de pruebas.
    //  Se guardan las TIRAS y no solo la pantalla completa para que el banco mande al modelo exactamente
    //  la misma imagen que recibe en marcha: recortando por su cuenta compararía imágenes distintas.
    const guardarCapturaYTiras = async () => {
        const captura = lastCaptureRef.current?.blob;
        if (!captura) return setStatusText('Todavía no hay ninguna captura');

        //  Un sello por captura, para que las tiras de una misma foto queden juntas al ordenar por nombre.
        const sello = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

        const bajar = (dato, nombre) => {
            const enlace = document.createElement('a');
            enlace.href = dato;
            enlace.download = nombre;
            enlace.click();
        };

        const urlCompleta = URL.createObjectURL(captura);
        bajar(urlCompleta, `${sello}-completa.png`);
        URL.revokeObjectURL(urlCompleta);

        for (let i = 0; i < stripsRef.current; i++) {
            bajar(await cropStrip(captura, stripsRef.current, SOLAPE_DE_LECTURA, i), `${sello}-tira${i}.png`);
        }

        setStatusText(`Guardadas: completa + ${stripsRef.current} tiras (${sello})`);
    };


    //  ARRASTRE DE LA IMAGEN con el ratón (para moverse por ella cuando hay zoom)
    const contenedorImgRef = useRef(null);
    const inicioArrastreRef = useRef(null);     //  dónde empezó el arrastre y en qué punto estaba
    const [arrastrando, setArrastrando] = useState(false);


    //  ¿Hay algo fuera de la vista que valga la pena mover?
    const sePuedeArrastrar = () => {
        const cont = contenedorImgRef.current;
        if (!cont) return false;
        return cont.scrollWidth > cont.clientWidth || cont.scrollHeight > cont.clientHeight;
    };


    //  Lo mismo, pero guardado, porque el CURSOR lo necesita al pintar y la
    //  función de arriba mide el DOM —eso no se puede consultar en mitad de un
    //  render y esperar que se refresque solo.
    //
    //  Antes el cursor de mano aparecía solo con el zoom por encima de 100. Era
    //  una aproximación razonable mientras la imagen se encajaba entera dentro
    //  de la ventana, pero ya no: al 100 % ocupa todo el ancho y, si la pantalla
    //  de la tablet es más alargada que el hueco, sobra alto y hay que
    //  desplazarse. El arrastre siempre funcionó —lo decide `sePuedeArrastrar`
    //  al empezar—, pero el cursor decía que no había nada que mover, y con eso
    //  nadie lo intenta.
    //
    //  Se recalcula en los dos únicos momentos en que la medida cambia: al
    //  tocar el zoom, y cuando termina de cargar cada captura nueva. En el
    //  segundo hay que esperar a `onLoad` de verdad: con el alto en `auto`, una
    //  imagen sin decodificar todavía mide cero y daría siempre que no.
    const [sePuedeMover, setSePuedeMover] = useState(false);

    useEffect(() => {
        setSePuedeMover(sePuedeArrastrar());
    }, [zoom]);


    const empezarArrastre = (e) => {
        if (!sePuedeArrastrar()) return;        //  al 100 % no hay nada que arrastrar
        e.preventDefault();                     //  evita que el navegador seleccione la imagen

        const cont = contenedorImgRef.current;
        inicioArrastreRef.current = {
            x: e.clientX,
            y: e.clientY,
            scrollLeft: cont.scrollLeft,
            scrollTop: cont.scrollTop,
        };
        setArrastrando(true);
    };


    //  Los oyentes van en 'window', no en el contenedor: así el arrastre sigue
    //  funcionando aunque el ratón se salga de la imagen, y se suelta bien aunque
    //  levantes el botón fuera de la ventana.
    useEffect(() => {
        if (!arrastrando) return;

        const mover = (e) => {
            const cont = contenedorImgRef.current;
            const inicio = inicioArrastreRef.current;
            if (!cont || !inicio) return;

            //  Se resta: al mover el ratón a la derecha, el contenido va a la derecha,
            //  y para eso hay que desplazarse hacia la izquierda.
            cont.scrollLeft = inicio.scrollLeft - (e.clientX - inicio.x);
            cont.scrollTop = inicio.scrollTop - (e.clientY - inicio.y);
        };

        const soltar = () => {
            inicioArrastreRef.current = null;
            setArrastrando(false);
        };

        window.addEventListener('mousemove', mover);
        window.addEventListener('mouseup', soltar);

        return () => {
            window.removeEventListener('mousemove', mover);
            window.removeEventListener('mouseup', soltar);
        };
    }, [arrastrando]);

    //  REFS (cosas que NO disparan render: la conexión, el timer del espejo y la url anterior)
    const adbRef = useRef(null);
    const intervalRef = useRef(null);
    const lastUrlRef = useRef(null);

    // lastCaptureRef = «la última captura del espejo»: { png, blob, time, width } de getTabletImage.
    // De aquí lee el bucle de inferencia y de aquí sale lo que se manda a Jarvis. Va en una ref y no en el
    // estado porque cambia dos veces por segundo y no se pinta: en el estado sería un render de más cada vez.
    const lastCaptureRef = useRef(null);

    // lastCaptureAtRef = «cuándo llegó la última captura» (Date.now()). Con la tablet muerta deja de avanzar.
    const lastCaptureAtRef = useRef(0);

    // lastReadCaptureRef = «la última captura que leyó el bucle», para saber si la que hay ya se leyó.
    const lastReadCaptureRef = useRef(null);

    // modelRejectionsRef = «las veces seguidas que el servidor ha rechazado el modelo». Una vuelta buena la pone a cero.
    const modelRejectionsRef = useRef(0);

    // roundControllerRef = «el cancelador de la vuelta en vuelo». Sin cancelarla, una lectura lanzada justo
    // antes de desconectar llegaba después y volvía a llenar la parrilla recién vaciada.
    const roundControllerRef = useRef(null);


    //  ══════════════════════════════════════════════════════════════════
    //  ENVIAR LA CAPTURA A LA BANDEJA DE JARVIS
    //  ══════════════════════════════════════════════════════════════════
    //  Manda el fotograma que se está viendo al MISMO sitio donde caen las
    //  imágenes que suben las tabletas: la bandeja del Toast POS del local.
    //  Es el endpoint que ya usaba el formulario «Subir imagen a mi Jarvis».
    //
    //  Al terminar, jarvis_api emite `fileLoader` por el socket y la bandeja
    //  aparece sola en la ventana principal. Desde acá no hay que avisar a
    //  nadie — y no se podría, porque cada ventana de Electron tiene su propio
    //  contexto y no se hablan directamente.
    //
    //  Quién la envía NO viaja en la petición: el servidor lo saca de la sesión.
    //
    //  'envio' tiene tres estados y cada uno dice algo distinto:
    //    null       · en reposo, el botón invita a pulsar
    //    'enviando' · hay una petición en curso, el botón se bloquea
    //    { ok, texto } · el resultado, que se borra solo a los pocos segundos
    const [envio, setEnvio] = useState(null);
    const avisoTimerRef = useRef(null);

    //  Si la ventana se cierra con un aviso pendiente, el temporizador seguiría
    //  vivo e intentaría escribir en un componente que ya no existe.
    useEffect(() => () => clearTimeout(avisoTimerRef.current), []);


    const mostrarAviso = (ok, texto) => {
        setEnvio({ ok, texto });
        clearTimeout(avisoTimerRef.current);
        //  El acierto se va solo; el error se queda más rato, porque hay algo
        //  que leer y probablemente que hacer.
        avisoTimerRef.current = setTimeout(() => setEnvio(null), ok ? 3000 : 6000);
    };


    const enviarCaptura = async () => {
        //  Doble clic o pulsación mantenida: sin esto se subirían dos imágenes
        //  iguales y quedarían las dos en la bandeja.
        if (envio === 'enviando') return;

        //  EN SIMULACIÓN NO SE ENVÍA NADA A JARVIS. La captura sería la de una tablet
        //  de mentira, y acabaría en la bandeja REAL del local, a la vista de todos los
        //  que lo monitorean, como si fuera de su cocina.
        if (adbRef.current?.simulado) {
            return mostrarAviso(false, 'En simulación no se envía nada a Jarvis');
        }

        const local = localEnCurso();
        if (!local?._id) {
            return mostrarAviso(false, 'Elige primero un local en la ventana de Jarvis');
        }

        //  Es exactamente el fotograma que se está mirando: lo que la persona cree estar mandando.
        const captura = lastCaptureRef.current?.blob;
        if (!captura) {
            return mostrarAviso(false, 'Todavía no hay ninguna captura que enviar');
        }

        setEnvio('enviando');

        try {
            const respuesta = await enviarImagenToastPos(local._id, captura);

            //  Se comprueba el código de verdad y no solo que la promesa no
            //  reventara: axios da por buena cualquier respuesta 2xx-3xx, y un
            //  302 a la pantalla de inicio de sesión llegaría hasta acá como si
            //  todo hubiera ido bien.
            if (respuesta?.status === 200 || respuesta?.status === 201) {
                mostrarAviso(true, `Enviado a ${local.name}`);
            }
            else {
                mostrarAviso(false, `Respuesta inesperada del servidor (${respuesta?.status ?? '?'})`);
            }
        }
        catch (error) {
            //  `instanceAxios` ya cambió el mensaje de axios por el que manda
            //  jarvis_api, así que esto suele ser una frase legible y no un
            //  "Request failed with status code 409".
            console.log(error);
            mostrarAviso(false, error?.message ?? 'No se pudo enviar la captura');
        }
    };



    //  CONECTAR CON LA TABLET (debe ejecutarse dentro de un click del usuario)
    const handdlerConnect = async () => {
        if (conectandoRef.current) return;
        conectandoRef.current = true;
        setConectando(true);

        try {
            setStatusText('Solicitando dispositivo...');

            const manager = AdbDaemonWebUsbDeviceManager.BROWSER;
            if (!manager) return setStatusText('Este navegador no soporta WebUSB (usa Chrome/Edge)');
            const device = await manager.requestDevice();
            if (!device) return setStatusText('No se seleccionó ningún dispositivo');

            const connection = await device.connect();

            setStatusText('Autorizando... acepta el aviso en la tablet');

            const transport = await AdbDaemonTransport.authenticate({
                serial: device.serial,
                connection,
                credentialStore: new AdbWebCredentialStore(),
            });

            adbRef.current = new Adb(transport);

            setConnected(true);
            setStatusText('Conectado');

            registroDeInferencia.apuntar(TIPO.TABLET, 'Tablet conectada por USB', { serie: device.serial });
        }
        catch (error) {
            console.log(error);
            setStatusText('Error: ' + error.message);

            registroDeInferencia.apuntar(TIPO.FALLO, `No se pudo conectar con la tablet: ${error.message}`);
        }
        finally {
            conectandoRef.current = false;
            setConectando(false);
        }
    };




    //  CONECTAR CON UNA TABLET DE MENTIRA — solo en desarrollo
    //  En lugar del USB se engancha al simulador de Toast. Lo que se guarda en 'adbRef' tiene la misma
    //  forma que un Adb de verdad, así que de aquí para abajo NADA sabe que es una simulación: el espejo,
    //  el bucle de inferencia y las parrillas son los de siempre. El simulador solo PINTA; leer, lee la IA.
    //  Se carga con import() y detrás de la constante para que no entre en el paquete publicado.
    const conectarSimulador = async () => {
        if (!SIMULACION_DISPONIBLE || conectandoRef.current) return;
        conectandoRef.current = true;
        setConectando(true);

        try {
            setStatusText('Buscando el simulador de Toast…');

            const { conectarConSimulador } = await import('../../simulador/adbSimulado.js');

            adbRef.current = await conectarConSimulador({ alAvisar: setStatusText });

            setConnected(true);
            setStatusText(`SIMULACIÓN · ${adbRef.current.nombre}`);

            //  A quien nos monta: lo que venga a partir de ahora no es de ninguna cocina.
            onSimulacionRef.current?.(true);

            registroDeInferencia.apuntar(TIPO.TABLET, `Conectada a la pantalla de Toast simulada («${adbRef.current.nombre}»)`);
        }
        catch (error) {
            console.log(error);
            setStatusText('Error: ' + error.message);

            registroDeInferencia.apuntar(TIPO.FALLO, `No se pudo conectar con el simulador: ${error.message}`);
        }
        finally {
            conectandoRef.current = false;
            setConectando(false);
        }
    };




    //  DESCONECTAR
    const handdlerDisconnect = async () => {
        try {
            if (intervalRef.current) clearTimeout(intervalRef.current);

            //  La vuelta en vuelo se aborta ANTES de cerrar: su respuesta ya no tiene dónde caer, y
            //  cancelarla es además la única forma de que el servidor deje de calcularla.
            roundControllerRef.current?.abort();
            roundControllerRef.current = null;

            if (adbRef.current) await adbRef.current.close();
        }
        catch (error) { console.log(error); }
        finally {
            adbRef.current = null;
            setConnected(false);
            setImgUrl(null);
            setStatusText('Sin conectar');

            registroDeInferencia.apuntar(TIPO.TABLET, 'Tablet desconectada: se borra lo leído en esta sesión');

            //  SE BORRA LO LEÍDO EN ESTA SESIÓN. Sin esto, al volver a conectar la parrilla enseñaba los
            //  tickets de la vez anterior hasta que cada tira volviera a pasar. La sesión nueva empieza
            //  por la primera tira y con una captura nueva.
            accumulatedRef.current = new Map();
            stripRef.current = 0;
            lastCaptureRef.current = null;
            lastReadCaptureRef.current = null;

            setTiraEnLectura(null);
            setUltimoError(null);
            setConsultando(false);

            //  Vacía la parrilla de abajo, pero avisando de que es una DESCONEXIÓN. Una lista vacía a secas
            //  es lo que manda una pantalla sin tickets, y el seguimiento daría todos los pedidos abiertos
            //  por desaparecidos, sellándoles un «Listo en tablet» con la hora en que alguien soltó el cable.
            onTicketsRef.current?.([], '', { desconexion: true });
            onSimulacionRef.current?.(false);            //  la próxima tablet puede ser la de verdad
            window.electronAPI?.enviarTickets?.([]);     //  y la de la ventana principal, si la hay
        }
    };




    //  ══════════════════════════════════════════════════════════════════════════════════════
    //  LA LECTURA DE TICKETS, PASO A PASO
    //
    //    STEP 0  checkAiServer        al abrir la ventana: ¿está activo el servidor de IA? ¿qué modelo tiene?
    //    STEP 1  getTabletImage       el espejo: una captura de la tablet cada medio segundo
    //    STEP 2  cropStrip            ┐
    //    STEP 3  requestInference     ├─ runInferenceOnce: UNA vuelta del bucle de inferencia
    //    STEP 4  parseModelResponse   ┘
    //    STEP 5  mergeStripTickets    los tickets de esa tira se juntan con los de las demás
    //    STEP 6  updateProcessGrid    la parrilla de procesos (la llama useSeguimientoTickets al recibir 'onTickets')
    //  ══════════════════════════════════════════════════════════════════════════════════════


    //  STEP 0 · LA PRIMERA CONEXIÓN AL SERVIDOR DE IA
    //  Al abrir la ventana se le pregunta si está activo y qué modelo tiene, y la respuesta se guarda.
    //  YA NO se le pregunta en cada lectura. Si no está activo, se reintenta cada 10 s hasta que lo esté,
    //  SALVO con la clave rechazada o sin dirección (CAUSES_WITHOUT_RETRY): eso no se arregla insistiendo,
    //  sino en «Opciones → Servidor de IA», así que se queda quieto hasta que cambien los ajustes.
    useEffect(() => {

        // controller = «el cancelador de la consulta», por si la ventana se cierra a mitad
        const controller = new AbortController();

        // timer = «el temporizador de la consulta siguiente»
        let timer = null;

        // askServer = «preguntar al servidor»
        const askServer = async () => {

            // settings = «la dirección, la clave y el modelo elegido», como estén guardados ahora
            const settings = aiSettingsRef.current;

            // result = «lo que contestó»: { active: true, model, models, ms, missingPreferred }  o  { active: false, cause, error, ms }
            // El modelo elegido en Opciones va aquí y no en la lectura: checkAiServer es quien tiene
            // delante la lista del servidor, así que es el único sitio donde se puede saber si el
            // elegido sigue cargado. Lo que devuelva en 'model' es con lo que se lee.
            const result = await checkAiServer({
                baseUrl: settings.url,
                apiKey: settings.apiKey,
                preferred: settings.model,
                signal: controller.signal
            });

            if (controller.signal.aborted) return;

            //  Al registro de la inferencia solo va lo que CAMBIA: con el servidor caído se pregunta
            //  cada 10 s, y el mismo fallo repetido llenaría el panel.
            //  LA CLAVE NO SE APUNTA: solo tapada (describeApiKey). El registro se ve en pantalla y se copia.
            // previous = «lo que había contestado la vez anterior»
            const previous = aiServerRef.current;

            if (result.active && previous?.model !== result.model) {

                //  Que el modelo elegido ya no esté se DICE. Leer con otro sin avisar es lo que
                //  haría que nadie entendiera por qué lee distinto de lo que puso en Opciones.
                // text = «lo que se apunta en el registro»
                //  Un preferido ausente o ciego se apunta con el que se usa DE VERDAD, que es lo que
                //  luego va en cada tira. (Que ninguno vea ya no llega aquí: checkAiServer lo devuelve
                //  como no activo y sale por la rama de FALLO de abajo, sin arrancar el bucle.)
                let text = `El servidor de IA está activo: se leerá con «${result.model}»`;
                if (result.missingPreferred) text = `El servidor de IA está activo, pero «${result.missingPreferred}» ya no está cargado: se leerá con «${result.model}»`;
                if (result.blindPreferred) text = `El servidor de IA está activo, pero «${result.blindPreferred}» no mira imágenes: se leerá con «${result.model}»`;

                registroDeInferencia.apuntar(TIPO.SERVIDOR, text, {
                    direccion: settings.url,
                    clave: describeApiKey(settings.apiKey),
                    modelo: result.model,
                    elegido: settings.model === '' ? '(el que elija el servidor)' : settings.model,
                    modelos: result.models,
                    milisegundos: result.ms,
                });
            }

            if (!result.active && previous?.error !== result.error) {
                //  Con 'no-vision-model' el resultado trae las listas: van al apunte, que es donde
                //  quien mira va a querer saber QUÉ hay montado. En las demás causas quedan undefined.
                registroDeInferencia.apuntar(TIPO.FALLO, describeAiFailure(result), {
                    direccion: settings.url,
                    clave: describeApiKey(settings.apiKey),
                    causa: result.cause,
                    modelos: result.models,
                    venImagenes: result.visionModels,
                });
            }

            //  EL MODELO SE GUARDA EN UNA VARIABLE: la ref para el bucle, el estado para pintarlo en la barra.
            aiServerRef.current = result;
            setAiServer(result);

            if (!result.active && !CAUSES_WITHOUT_RETRY.includes(result.cause)) timer = setTimeout(askServer, CHECK_RETRY_MS);
        };

        //  Con setTimeout también la primera: si el efecto se desmonta al momento (StrictMode lo hace
        //  en desarrollo), la pregunta ni llega a salir. Cuánto se espera lo dejó puesto quien pidió
        //  la consulta; al abrir la ventana, nada.
        timer = setTimeout(askServer, nextCheckDelayRef.current);

        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [serverCheckNumber]);



    //  LOS AJUSTES CAMBIARON EN «OPCIONES → SERVIDOR DE IA»
    //  El menú vive en la ventana principal, que es OTRA ventana: subscribeToAiSettings se entera igual
    //  (por el evento 'storage' del navegador) y por eso no hace falta reabrir esta para cambiar de
    //  servidor o de clave. Se vuelve al STEP 0 con los ajustes nuevos, y la vuelta que estuviera en
    //  vuelo se aborta: iba con la dirección y la clave viejas.
    //
    //  Guardar SIN cambiar nada también avisa, a propósito: es el «vuelve a intentarlo ahora» del
    //  operador cuando la barra dice que la clave no vale y el bucle está quieto esperando.
    useEffect(() => {

        // stopListening = «dejar de escuchar los ajustes» (se llama al cerrar la ventana)
        const stopListening = subscribeToAiSettings((settings) => {

            aiSettingsRef.current = settings;

            roundControllerRef.current?.abort();
            roundControllerRef.current = null;

            //  EL SERVIDOR ANTERIOR DEJA DE VALER AQUÍ MISMO, antes de preguntarle al nuevo.
            //  Sin esto, entre el guardado y la respuesta del STEP 0 el bucle seguía vivo con
            //  aiServer.active todavía en true, y mandaba una tira a la dirección NUEVA con el
            //  modelo de la VIEJA: una lectura que no podía salir bien y una foto de la tablet
            //  entregada a un servidor que aún no había contestado quién es. De paso la barra
            //  dejaba de enseñar el servidor anterior como si siguiera conectado.
            aiServerRef.current = null;
            setAiServer(null);

            //  Otro servidor: lo que hubiera rechazado el modelo hasta ahora ya no cuenta, y se le
            //  pregunta sin esperar.
            modelRejectionsRef.current = 0;
            nextCheckDelayRef.current = 0;

            setServerCheckNumber(number => number + 1);
        });

        return stopListening;
    }, []);




    // captureScreen = «capturar la pantalla»
    //  STEP 1 · EL ESPEJO: una captura de la pantalla, con la hora que marcaba la tablet.
    //  Solo guarda y pinta la captura. YA NO dispara lecturas: de eso se encarga el bucle de inferencia.
    const captureScreen = async () => {
        try {
            // adb = «la tablet a la que se le pide la captura»
            const adb = adbRef.current;
            if (!adb) return;

            // capture = «la captura»: { png, blob, time, width }
            const capture = await getTabletImage(adb);

            //  Desconectaron mientras llegaba: es una captura de la sesión anterior (a veces a medias) y no se guarda.
            //  Guardada, el bucle la leía al volver a conectar.
            if (adbRef.current !== adb) return;

            //  El ancho de la captura decide en cuántas tiras se lee. Si cambia (otra tablet, o la misma
            //  girada) el recorrido vuelve a empezar por la primera.
            // screenStrips = «las tiras de esta pantalla»
            const screenStrips = tirasParaElAncho(capture.width);

            if (screenStrips !== stripsRef.current) {
                stripsRef.current = screenStrips;
                stripRef.current = 0;
                setTiras(screenStrips);
            }

            lastCaptureRef.current = capture;
            lastCaptureAtRef.current = Date.now();

            // url =«la dirección de la captura, para pintarla»
            const url = URL.createObjectURL(capture.blob);

            if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);   // libera la imagen anterior
            lastUrlRef.current = url;

            setImgUrl(url);
        }
        catch (error) {
            console.log(error);
        }
    };


    //  EL CICLO DEL ESPEJO, mientras esté conectado. Se reprograma solo en vez de usar setInterval:
    //  así se espera SIEMPRE a que termine una captura antes de pedir la siguiente, y nunca hay dos
    //  'screencap' a la vez contra el mismo ADB (lo atascan). Se descuenta lo que tardó la captura,
    //  para que entre imagen e imagen pase el intervalo real.
    useEffect(() => {
        if (!connected) return;

        let vivo = true;

        const ciclo = async () => {
            const inicio = Date.now();

            await captureScreen();

            //  Puede haberse desconectado mientras se esperaba la captura.
            if (!vivo) return;

            const espera = Math.max(0, refreshMs - (Date.now() - inicio));
            intervalRef.current = setTimeout(ciclo, espera);
        };

        ciclo();   //  la primera, sin esperar

        return () => {
            vivo = false;
            clearTimeout(intervalRef.current);
        };
    }, [connected, refreshMs]);




    // markServerAsInactive = «dar el servidor por no activo»
    // Puede que el servidor ya no esté, o que le hayan cambiado el modelo: se vuelve al STEP 0.
    // Hasta que conteste, el servidor no cuenta como activo y el bucle se para.
    // Recibe: result (el resultado de la vuelta fallida).
    const markServerAsInactive = (result) => {

        //  Un modelo rechazado varias veces seguidas alarga la espera de la consulta siguiente (getCheckAgainDelayMs).
        if (result.cause === 'model-rejected') modelRejectionsRef.current = modelRejectionsRef.current + 1;

        //  Y esa espera se deja puesta aquí, que es donde se sabe por qué se vuelve a preguntar. Sin
        //  ella, un fallo que se repite daría vueltas sin freno.
        nextCheckDelayRef.current = getCheckAgainDelayMs(modelRejectionsRef.current);

        // inactiveServer = «el servidor, dado por no activo»
        const inactiveServer = { active: false, cause: result.cause, error: result.error, ms: 0 };

        aiServerRef.current = inactiveServer;
        setAiServer(inactiveServer);
        setServerCheckNumber(number => number + 1);
    };



    // isTabletSilent = «¿la tablet dejó de mandar capturas?»
    // Cable suelto, simulador cerrado…: el espejo ya no trae capturas nuevas, y la que hay ya se leyó y es vieja.
    // Recibe: capture (la última captura del espejo). Devuelve: true / false.
    const isTabletSilent = (capture) => {

        // captureAge = «la edad de la captura, en milisegundos»
        const captureAge = Date.now() - lastCaptureAtRef.current;

        return capture === lastReadCaptureRef.current && captureAge > MAX_CAPTURE_AGE_MS;
    };



    // reportSilentTablet = «avisar de que la tablet no manda capturas»
    // La vuelta NO se da, pero el fallo sube: a la barra de arriba y, por 'onTickets', a la ventana (los tickets no se tocan).
    // Recibe: capture (la última captura), strip y strips (la tira que tocaba, y de cuántas), y model
    //         (el del servidor activo, leído por quien llama: aquí no se vuelve a mirar la ref, que
    //         puede haberse puesto a null entre medias si cambiaron los ajustes).
    // Devuelve: el resultado de la vuelta fallida ({ ok: false, … }), para el bucle.
    const reportSilentTablet = (capture, strip, strips, model) => {

        // silentResult = «el resultado de la vuelta que no se dio»
        const silentResult = buildSilentTabletResult(capture, strip, strips, model);

        setUltimoError(silentResult.error);
        onTicketsRef.current?.(null, silentResult.time, buildDiagnosis(silentResult));

        return silentResult;
    };



    // readNextStrip = «leer la tira siguiente»
    // UNA VUELTA DEL BUCLE DE INFERENCIA: lee una tira, junta sus tickets con los demás y los entrega.
    // Devuelve: el resultado de runInferenceOnce ({ ok, … }). Con ok: false el bucle espera unos segundos antes de seguir.
    const readNextStrip = async () => {

        //  De la ÚLTIMA captura del espejo. No se le pide otra al ADB: dos 'screencap' a la vez lo atascan.
        // capture = «la captura que se va a leer»
        const capture = lastCaptureRef.current;
        if (!capture) return { ok: false };

        // server = «el servidor de IA, tal como contestó la última consulta»
        // Se lee UNA vez y se comprueba: al guardar ajustes en la otra ventana, aiServerRef se pone a
        // null hasta que el servidor nuevo conteste, y una vuelta que arrancara justo entonces leería
        // '.model' de null y reventaría. Sin servidor activo no hay vuelta que dar.
        const server = aiServerRef.current;
        if (!server?.active) return { ok: false };

        // strip = «la tira que toca»  ·  strips = «de cuántas»
        const strip = stripRef.current;
        const strips = stripsRef.current;

        //  Releer sin fin la misma foto gastaría el servidor de IA en el pasado: la vuelta es fallida, y el fallo sube.
        if (isTabletSilent(capture)) return reportSilentTablet(capture, strip, strips, server.model);

        lastReadCaptureRef.current = capture;

        // controller = «el cancelador de esta vuelta»: desconectar o pausar la IA la abortan
        const controller = new AbortController();
        roundControllerRef.current = controller;

        setTiraEnLectura(strip);
        setConsultando(true);      //  para que la barra lata mientras se espera al modelo

        // note = «apuntar en el registro de la inferencia»: todos los apuntes de esta vuelta van juntos
        const note = registroDeInferencia.abrirLectura();

        // settings = «la dirección y la clave», como estén guardadas en este momento. Se leen en CADA
        // vuelta y no una sola vez: cambiarlas en Opciones tiene que notarse en la vuelta siguiente.
        const settings = aiSettingsRef.current;

        //  STEP 2 · cropStrip, STEP 3 · requestInference y STEP 4 · parseModelResponse
        //  La clave entra en 'server' y de ahí a la cabecera Authorization. El bucle NO la apunta en el
        //  registro: sus apuntes escriben el servidor campo a campo, nunca el objeto entero.
        // result = «el resultado de la vuelta»: { ok, strip, strips, time, model, seconds, tickets, discarded, error, cause }
        const result = await runInferenceOnce({
            capture: capture,
            strip: strip,
            strips: strips,
            overlap: SOLAPE_DE_LECTURA,
            server: { baseUrl: settings.url, apiKey: settings.apiKey, model: server.model },
            timeoutMs: AI_TIMEOUT_MS,
            signal: controller.signal,
            note: note,
        });

        //  Vuelta cancelada: no es un fallo, no se entrega nada y la tira no avanza (se leerá al reanudar).
        if (result.cause === 'cancelled' || controller.signal.aborted) return result;

        roundControllerRef.current = null;
        setConsultando(false);

        //  Le toca a la tira siguiente (salvo que la pantalla haya cambiado de ancho a mitad: ahí se empieza de cero).
        if (stripsRef.current === strips) stripRef.current = (strip + 1) % strips;

        // diagnostico = «cómo fue esta vuelta»: { tira, tiras, modelo, leidos, descartados, segundos, error }
        const diagnostico = buildDiagnosis(result);

        //  VUELTA FALLIDA: los tickets NO se tocan (se entrega null), pero el fallo sí sube. Callarlo hacía
        //  imposible distinguir «no hay novedades» de «lleva diez minutos sin entender una respuesta».
        if (!result.ok) {
            setUltimoError(result.error);
            onTicketsRef.current?.(null, result.time, diagnostico);

            if (CAUSES_TO_CHECK_AGAIN.includes(result.cause)) markServerAsInactive(result);

            return result;
        }

        setUltimoError(null);
        modelRejectionsRef.current = 0;

        //  STEP 5 · los tickets de esta tira se juntan con los que se conservan de las demás
        // merged = «lo juntado»: { accumulated: Map nuevo, all: todos los tickets de la pantalla }
        const merged = mergeStripTickets(accumulatedRef.current, result.tickets, strip);
        accumulatedRef.current = merged.accumulated;

        //  Al registro de la inferencia: cuántos tickets hay ya en TODA la pantalla, con sus claves.
        note(TIPO.RESULTADO, `${merged.all.length} tickets en toda la pantalla`, { enTodaLaPantalla: merged.all.map(ticket => ticket.clave) });

        //  STEP 6 · updateProcessGrid NO se llama aquí: aquí solo se ENTREGA la lista. El camino es
        //  onTickets → VentanaTablet.jsx (la guarda) → useSeguimientoTickets.jsx → updateProcessGrid (processGrid.js),
        //  que ANALIZA, COMPARA y ACTUALIZA la parrilla de procesos.
        //  Se manda SIEMPRE la lista completa, aunque esta tira no trajera nada: si un pedido terminó, quien lo
        //  mire tiene que enterarse. La hora es la de la FOTO (result.time), no la de cuando contestó el modelo.
        onTicketsRef.current?.(merged.all, result.time, diagnostico);

        //  Y a la ventana principal, si hay carcasa de escritorio (en un navegador electronAPI no existe).
        window.electronAPI?.enviarTickets?.(merged.all);

        return result;
    };


    //  EL BUCLE DE INFERENCIA (recursivo: cada vuelta empieza cuando ha contestado la anterior).
    //  Arranca cuando hay tablet conectada (con su primera captura) + servidor de IA activo + modo IA encendido,
    //  y se para en cuanto falta cualquiera de los tres. El ritmo lo pone el servidor, no un reloj.

    // hasCapture = «ya hay una captura que leer»
    const hasCapture = imgUrl !== null;

    // serverIsActive = «el servidor de IA está activo»
    const serverIsActive = aiServer?.active === true;

    useEffect(() => {
        if (!connected || !hasCapture || !serverIsActive || !modoIA) return;

        // loop = «el bucle»: { stop, getRounds }
        const loop = startInferenceLoop({ runOnce: readNextStrip, pauseBetweenRoundsMs: PAUSE_BETWEEN_ROUNDS_MS });

        return () => {
            loop.stop();

            //  La vuelta en vuelo se aborta: nunca puede haber dos a la vez si el bucle vuelve a arrancar.
            roundControllerRef.current?.abort();
            roundControllerRef.current = null;
            setConsultando(false);
        };
    }, [connected, hasCapture, serverIsActive, modoIA]);




    //  LIMPIEZA AL DESMONTAR EL COMPONENTE
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearTimeout(intervalRef.current);
            if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
            if (adbRef.current) adbRef.current.close();
        };
    }, []);




    //  Una simulación se distingue DE UN VISTAZO: punto y texto en violeta, un color que
    //  la ventana no usa para nada más. Lo que sale en las parrillas es de mentira, y
    //  nadie debería tener que leer la barra para darse cuenta.
    const simulando = connected && Boolean(adbRef.current?.simulado);




    //  EL ALTO LO MANDA LA CARCASA (assets/TabletContainer.jsx), que llena a su panel
    //  sin anclarse a la ventana. Aquí ya no hay raíz propia: lo que sigue son sus hijos.
    return (
        /*  LA CARCASA: la barra de título con el estado y los botones, y el aviso del
         *  envío. Está en assets/TabletContainer.jsx, que solo pinta: todo lo que sabe
         *  se lo pasamos aquí, y todo lo que pasa nos lo devuelve por una función.
         *
         *  Debajo, de children, van el espejo y la barra de zoom.  */
        <TabletContainer
            nameEstablishment={nombreDelLocal}
            statusText={statusText}
            connected={connected}
            loadingUsbState={conectando}
            sendFrameStop={envio}
            simulatorIsActive={simulando}

            aiServer={aiServer}
            modeIA={modoIA}
            strips={tiras}
            stripReading={tiraEnLectura}
            waitingIA={consultando}
            lastError={ultimoError}
            simulationAvailable={SIMULACION_DISPONIBLE}

            onMouseEvent={onArrastrarBarra}

            toggleModeIACallback={() => setModoIA(activo => !activo)}
            getScreenShotCallback={enviarCaptura}
            simulateCallback={conectarSimulador}
            connectTabletCallback={handdlerConnect}
            disconnectTabletCallback={handdlerDisconnect}
            closeCallback={() => (onCerrar ?? window.electronAPI?.closeTabletWindow)?.()}

            describeAiFailure={describeAiFailure}
        >

                {/*  IMAGEN DE LA TABLET
                 'overflow-auto' es lo que permite moverse por la imagen cuando el
                 zoom la hace más grande que la ventana. Sin eso, al ampliar solo
                 se vería el centro y el resto quedaría cortado sin poder alcanzarlo.  */}
            <TabletRender
                img={imgUrl}
                zoom={zoom}
                isDragging={arrastrando}
                canMove={sePuedeMover}
                onMouseEvent={empezarArrastre}
                loadEvent={() => setSePuedeMover(sePuedeArrastrar())}
                ref={contenedorImgRef}
            />





            {/*  LA BARRA DE ZOOM, debajo del espejo. Está en assets/ZoomBar.jsx, y de allí
                 salen también los límites del zoom.  */}
            <ZoomBar
                zoom={zoom}
                canMove={sePuedeMover}
                connected={connected}
                zoomCallback={cambiarZoom}
                resetZoomCallback={() => setZoom(100)}
                saveFramesCallback={guardarCapturaYTiras}
            />


        </TabletContainer>
    );
}




export { TabletScreen };
