import { useState, useRef, useEffect } from 'react';
import { Adb, AdbDaemonTransport } from '@yume-chan/adb';
import { AdbDaemonWebUsbDeviceManager } from '@yume-chan/adb-daemon-webusb';
import AdbWebCredentialStore from '@yume-chan/adb-credential-web';
import { enviarImagenToastPos } from '../../libs/fetch_data/noveltyFecth.js';
import { TIRAS_DE_LECTURA, SOLAPE_DE_LECTURA, tirasParaElAncho } from '../../libs/tickets/configLectura.js';
import { SIMULACION_DISPONIBLE } from '../../simulador/disponible.js';
import { registroDeInferencia, TIPO } from '../../libs/tickets/registroDeInferencia.js';
import { getTimeoutMs, checkAiServer } from '../../libs/inference/aiServer.js';
import { getTabletImage, cropStrip } from '../../libs/inference/tabletImage.js';
import { runInferenceOnce, startInferenceLoop } from '../../libs/inference/inferenceLoop.js';
import { mergeStripTickets } from '../../libs/inference/mergeStrips.js';


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


//  Límites del zoom. Van fuera del componente porque el valor inicial se lee
//  antes de que el componente exista, y ahí dentro todavía no estarían definidos.
const ZOOM_MIN = 50;
const ZOOM_MAX = 400;
const ZOOM_PASO = 25;
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


//  EL SERVIDOR DE IA. El '.env' solo dice DÓNDE está y cuánto se le espera:
//      VITE_AI_URL        su dirección (con su http:// o https://, y su puerto)
//      VITE_AI_TIMEOUT_S  cuántos segundos se le espera por tira (opcional)
//  El MODELO no va ni ahí ni aquí: se le pregunta al servidor al abrir la ventana (STEP 0).

// AI_URL = «la dirección del servidor de IA»
const AI_URL = import.meta.env.VITE_AI_URL;

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
// Con cualquiera de ellas puede que el servidor ya no esté, o que le hayan cambiado el modelo.
const CAUSES_TO_CHECK_AGAIN = ['network', 'cors', 'model-rejected'];



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
    //  YA NO se le pregunta en cada lectura. Si no está activo, se reintenta cada 10 s hasta que lo esté.
    useEffect(() => {

        // controller = «el cancelador de la consulta», por si la ventana se cierra a mitad
        const controller = new AbortController();

        // timer = «el temporizador de la consulta siguiente»
        let timer = null;

        // askServer = «preguntar al servidor»
        const askServer = async () => {

            // result = «lo que contestó»: { active: true, model, models, ms }  o  { active: false, cause, error, ms }
            const result = await checkAiServer(AI_URL, controller.signal);

            if (controller.signal.aborted) return;

            //  Al registro de la inferencia solo va lo que CAMBIA: con el servidor caído se pregunta
            //  cada 10 s, y el mismo fallo repetido llenaría el panel.
            // previous = «lo que había contestado la vez anterior»
            const previous = aiServerRef.current;

            if (result.active && previous?.model !== result.model) {
                registroDeInferencia.apuntar(TIPO.SERVIDOR, `El servidor de IA está activo: se leerá con «${result.model}»`, {
                    direccion: AI_URL,
                    modelo: result.model,
                    modelos: result.models,
                    milisegundos: result.ms,
                });
            }

            if (!result.active && previous?.error !== result.error) {
                registroDeInferencia.apuntar(TIPO.FALLO, `IA sin conexión: ${result.error}`, { direccion: AI_URL, causa: result.cause });
            }

            //  EL MODELO SE GUARDA EN UNA VARIABLE: la ref para el bucle, el estado para pintarlo en la barra.
            aiServerRef.current = result;
            setAiServer(result);

            if (!result.active) timer = setTimeout(askServer, CHECK_RETRY_MS);
        };

        // firstDelay = «la espera antes de la primera pregunta». Al abrir la ventana, ninguna. Cuando se vuelve
        // a preguntar por una inferencia fallida, unos segundos: sin ellos, un fallo que se repite daría vueltas sin freno.
        let firstDelay = 0;
        if (serverCheckNumber > 0) firstDelay = getCheckAgainDelayMs(modelRejectionsRef.current);

        //  Con setTimeout también la primera: si el efecto se desmonta al momento (StrictMode lo hace
        //  en desarrollo), la pregunta ni llega a salir.
        timer = setTimeout(askServer, firstDelay);

        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [serverCheckNumber]);




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
    // Recibe: capture (la última captura), strip y strips (la tira que tocaba, y de cuántas).
    // Devuelve: el resultado de la vuelta fallida ({ ok: false, … }), para el bucle.
    const reportSilentTablet = (capture, strip, strips) => {

        // silentResult = «el resultado de la vuelta que no se dio»
        const silentResult = buildSilentTabletResult(capture, strip, strips, aiServerRef.current.model);

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

        // strip = «la tira que toca»  ·  strips = «de cuántas»
        const strip = stripRef.current;
        const strips = stripsRef.current;

        //  Releer sin fin la misma foto gastaría el servidor de IA en el pasado: la vuelta es fallida, y el fallo sube.
        if (isTabletSilent(capture)) return reportSilentTablet(capture, strip, strips);

        lastReadCaptureRef.current = capture;

        // controller = «el cancelador de esta vuelta»: desconectar o pausar la IA la abortan
        const controller = new AbortController();
        roundControllerRef.current = controller;

        setTiraEnLectura(strip);
        setConsultando(true);      //  para que la barra lata mientras se espera al modelo

        // note = «apuntar en el registro de la inferencia»: todos los apuntes de esta vuelta van juntos
        const note = registroDeInferencia.abrirLectura();

        //  STEP 2 · cropStrip, STEP 3 · requestInference y STEP 4 · parseModelResponse
        // result = «el resultado de la vuelta»: { ok, strip, strips, time, model, seconds, tickets, discarded, error, cause }
        const result = await runInferenceOnce({
            capture: capture,
            strip: strip,
            strips: strips,
            overlap: SOLAPE_DE_LECTURA,
            server: { baseUrl: AI_URL, model: aiServerRef.current.model },
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




    //  COLOR DEL ESTADO en la barra: el punto y el texto que lo acompaña.
    //  'Error' es el prefijo con el que handdlerConnect escribe sus fallos.
    const fallo = statusText.startsWith('Error');

    //  Una simulación se distingue DE UN VISTAZO: punto y texto en violeta, un color que
    //  la ventana no usa para nada más. Lo que sale en las parrillas es de mentira, y
    //  nadie debería tener que leer la barra para darse cuenta.
    const simulando = connected && Boolean(adbRef.current?.simulado);

    const claseDelPunto = simulando ? 'bg-[#b49cff] shadow-[0_0_0_3px_rgba(180,156,255,0.22)]'
        : connected ? 'bg-[#5fd29a] shadow-[0_0_0_3px_rgba(95,210,154,0.18)]'
            : conectando ? 'bg-[#f2b84b] shadow-[0_0_0_3px_rgba(242,184,75,0.2)]'
                : fallo ? 'bg-[#ff6b7a]'
                    : 'border-2 border-[#5e7ba0]';

    const colorDelEstado = simulando ? 'text-[#cdbcff] font-semibold'
        : fallo ? 'text-[#ffb3bc]'
            : conectando ? 'text-[#f2cf6b]'
                : 'text-[#8aa0bb]';


    //  EL ESTADO DE LA IA en la barra: con qué modelo se lee, o por qué no hay conexión (lo dijo el STEP 0).
    // aiStatusText = «el texto del estado de la IA»
    let aiStatusText = 'IA: consultando el servidor…';
    if (aiServer?.active === true) aiStatusText = `IA: ${aiServer.model}`;
    if (aiServer?.active === false) aiStatusText = `IA sin conexión: ${aiServer.error}`;

    // aiStatusColor = «el color del estado de la IA»: ámbar solo cuando no hay conexión
    let aiStatusColor = 'text-[#8aa0bb]';
    if (aiServer?.active === false) aiStatusColor = 'text-[#f2cf6b]';




    //  OJO CON EL ALTO, que aquí hubo un fallo difícil de ver.
    //
    //  Esto llevaba 'fixed inset-0' porque un alto en porcentaje hay que medirlo
    //  contra alguien, y la cadena html → body → #root no lo daba: el `body` lleva
    //  `display: flex; place-items: center` heredado de la plantilla de Vite, así que
    //  #root se encogía al tamaño de su contenido en vez de llenar la ventana.
    //
    //  Y engañaba, porque dependía de lo que hubiera dentro: con la tablet conectada
    //  la captura es ancha, estiraba el panel y todo parecía correcto; sin conectar
    //  solo quedaban la barra y el texto, y aparecían dos bandas oscuras a los lados.
    //
    //  Ahora quien se ancla a la ventana es VentanaTablet, y este componente llena a
    //  su panel. Que ese panel tenga un alto real es responsabilidad del contenedor.
    return (
        /*  Llena a su padre, que es el panel de arriba de la ventana dividida.
         *
         *  Antes era 'fixed inset-0' porque ocupaba la ventana entera él solo. Ahora
         *  eso lo haría salirse del panel y taparlo todo, incluida la parrilla.
         *
         *  Sin borde ni esquinas redondeadas propias: el marco lo pone el contenedor,
         *  y un segundo borde aquí dibujaría una línea doble justo sobre el divisor.
         */
        <div className='relative w-full h-full min-h-0 flex flex-col overflow-hidden bg-[#01122c]'>



            {/*  BARRA SUPERIOR
                 La ventana flotante no tiene marco, así que esta barra hace de barra
                 de título: 'drag' le dice a Electron que arrastrando aquí se mueve
                 la ventana entera. Los botones van en una zona 'no-drag' porque
                 dentro de una zona arrastrable dejarían de responder al clic.

                 TODOS LOS BOTONES SON ÍCONOS. La ventana abre a 400 px y con texto
                 no cabían: «Desconectar» empujaba la ✕ fuera del borde. Lo que hace
                 cada uno lo dice su `title` al pasar el ratón y su `aria-label` a un
                 lector de pantalla.

                 Su aspecto va en las clases `vt-icono` de index.css y no en
                 utilidades de Tailwind: la regla global `button {}` de index.css no
                 está en ninguna capa y les gana en relleno, borde, radio y letra.  */}
            <div
                className='sticky top-0 z-10 h-12 shrink-0 flex items-center gap-2.5 pl-3 pr-1.5 bg-[#021a38] border-b border-[#0a3a66] cursor-move select-none'
                style={{ WebkitAppRegion: 'drag' }}
                onMouseDown={onArrastrarBarra}
            >

                {/*  El punto dice el estado de un vistazo: verde conectada, ámbar
                     conectando, rojo si el último intento falló, hueco si no hay nada.  */}
                <span aria-hidden='true' className={`shrink-0 w-2.5 h-2.5 rounded-full ${claseDelPunto}`} />

                {/*  Nombre del local arriba y estado debajo, en dos líneas. En una
                     sola, con la ventana estrecha, el nombre empujaba los botones y
                     la ✕ se salía por el borde.

                     'min-w-0' es imprescindible: sin él un hijo de flex no baja de su
                     ancho natural, así que este texto empujaría los botones fuera de
                     la ventana en lugar de recortarse con puntos suspensivos.  */}
                <span className='min-w-0 flex-1 flex flex-col gap-[3px] leading-none'>
                    <span className='min-w-0 text-[13px] font-semibold text-[#e6eef9] truncate' title={nombreDelLocal}>
                        {nombreDelLocal || 'Tablet'}
                    </span>
                    {/*  El estado de la tablet y, a su lado, el de la IA. El de la IA es el que se recorta
                         si no cabe: entero va en su 'title', al pasar el ratón.  */}
                    <span className='min-w-0 flex gap-1.5 text-[11px]'>
                        <span className={`shrink-0 max-w-[70%] truncate ${colorDelEstado}`}>
                            {statusText}
                        </span>
                        <span className={`min-w-0 truncate ${aiStatusColor}`} title={aiStatusText}>
                            · {aiStatusText}
                        </span>
                    </span>
                </span>

                {/*  QUÉ ESTÁ LEYENDO LA IA
                     Una marca por tira, encendida la que se mandó al modelo; late
                     mientras se espera su respuesta. Solo desde 560 px: más estrecho
                     se come el nombre del local, y la barra de abajo ya dice cómo fue
                     la última lectura.  */}
                {
                    connected && (
                        <span
                            className={`hidden min-[560px]:flex shrink-0 items-center gap-2 h-[30px] px-2.5 rounded-[9px] border bg-[#01122c] font-mono text-[11px] ${ultimoError && modoIA ? 'border-[#6e5a1f] text-[#f2cf6b]' : 'border-[#0a3a66] text-[#8aa0bb]'}`}
                            title={!modoIA ? 'La lectura de tickets está en pausa' : ultimoError ? `La última lectura falló: ${ultimoError}` : 'Tira de la pantalla que está leyendo la IA'}
                        >
                            <Icono nombre={modoIA ? 'ia' : 'iaPausa'} tamano={15} />
                            {
                                modoIA ?
                                    <>
                                        <span className='flex gap-[3px]'>
                                            {
                                                Array.from({ length: tiras }, (_, i) => (
                                                    <span
                                                        key={i}
                                                        className={`w-2.5 h-1.5 rounded-full ${i === tiraEnLectura ? `bg-[#38b6e8] ${consultando ? 'animate-pulse' : ''}` : 'bg-[#1c3553]'}`}
                                                    />
                                                ))
                                            }
                                        </span>
                                        <span className='text-[#dbe7f7] tabular-nums'>
                                            {tiraEnLectura === null ? '–' : `${tiraEnLectura + 1}/${tiras}`}
                                        </span>
                                    </>
                                    :
                                    <span>IA en pausa</span>
                            }
                        </span>
                    )
                }

                <div className='flex-none flex items-center gap-1.5' style={{ WebkitAppRegion: 'no-drag' }}>

                    {/*  MODO IA
                         Activa o pausa la lectura de tickets. En pausa el espejo sigue
                         en vivo y la captura se puede enviar; solo se deja de mandar
                         la pantalla al modelo. Se ve pulsado mientras está activo.  */}
                    <button
                        type='button'
                        className={`vt-icono ${modoIA ? 'vt-icono--activo' : ''}`}
                        onClick={() => setModoIA(activo => !activo)}
                        aria-pressed={modoIA}
                        aria-label={modoIA ? 'Modo IA activado: pausar la lectura de tickets' : 'Modo IA en pausa: reanudar la lectura de tickets'}
                        title={modoIA ? 'Modo IA activado: la IA lee los tickets. Pulsa para pausarla.' : 'Modo IA en pausa: solo espejo. Pulsa para reanudar la lectura.'}
                    >
                        <Icono nombre={modoIA ? 'ia' : 'iaPausa'} />
                    </button>

                    {/*  ENVIAR LA CAPTURA A LA BANDEJA DE JARVIS
                         Solo con la tablet conectada: sin conexión no hay nada que
                         mandar, y un botón que solo sabe dar error es peor que no
                         tenerlo. Mientras sube, el ícono gira; al terminar bien, se
                         vuelve una palomita verde hasta que se va el aviso.  */}
                    {
                        connected && (
                            <button
                                type='button'
                                className={`vt-icono ${envio?.ok === true ? 'vt-icono--ok' : ''}`}
                                onClick={enviarCaptura}
                                disabled={envio === 'enviando'}
                                aria-label='Enviar esta captura a la bandeja de Jarvis'
                                title='Enviar esta captura a la bandeja de Jarvis'
                            >
                                {
                                    envio === 'enviando' ? <Icono nombre='girando' />
                                        : envio?.ok === true ? <Icono nombre='hecho' />
                                            : <Icono nombre='captura' />
                                }
                            </button>
                        )
                    }

                    {/*  SIMULAR — solo en desarrollo y solo sin tablet conectada.
                         Abre (o encuentra) el simulador de Toast y se conecta a él en
                         vez de al USB. En la versión publicada esta constante es false
                         y el botón no existe.  */}
                    {
                        SIMULACION_DISPONIBLE && !connected && (
                            <button
                                type='button'
                                className='vt-icono'
                                onClick={conectarSimulador}
                                disabled={conectando}
                                aria-label='Simular una tablet de Toast'
                                title='Simular: conecta con una tablet de Toast de mentira, para probar sin USB'
                            >
                                <Icono nombre='simular' />
                            </button>
                        )
                    }

                    {
                        connected ?
                            <button
                                type='button'
                                className='vt-icono vt-icono--peligro'
                                onClick={handdlerDisconnect}
                                aria-label='Desconectar la tablet'
                                title='Desconectar la tablet'
                            >
                                <Icono nombre='desconectar' />
                            </button>
                            :
                            <button
                                type='button'
                                className='vt-icono vt-icono--principal'
                                onClick={handdlerConnect}
                                disabled={conectando}
                                aria-label={conectando ? 'Conectando con la tablet' : 'Conectar la tablet por USB'}
                                title={conectando ? 'Conectando… acepta el aviso en la tablet' : 'Conectar la tablet por USB'}
                            >
                                <Icono nombre={conectando ? 'girando' : 'conectar'} />
                            </button>
                    }

                    <span aria-hidden='true' className='w-px h-6 mx-0.5 bg-[#0a3a66]' />

                    {/*  Cerrar la propia ventana flotante. Al pasar el ratón se pone
                         roja, como la ✕ de cualquier ventana de Windows.  */}
                    <button
                        type='button'
                        className='vt-icono vt-icono--fantasma'
                        onClick={() => (onCerrar ?? window.electronAPI?.closeTabletWindow)?.()}
                        aria-label='Cerrar la ventana de la tablet'
                        title='Cerrar'
                    >
                        <Icono nombre='cerrar' />
                    </button>
                </div>

            </div>


            {/*  RESULTADO DEL ENVÍO

                 Va SUPERPUESTO, no dentro del flujo. En una ventana de 400×300
                 una banda que aparece y desaparece empujaría la imagen hacia
                 abajo y de vuelta cada vez, y ese salto se nota más que el
                 propio aviso.

                 Se coloca contra la raíz de este panel —que lleva `relative`— justo
                 debajo de la barra superior, que mide 48 px.

                 `pointer-events-none` para que no se coma un clic sobre la
                 imagen si el aviso cae encima de algo que se quería arrastrar.  */}
            {
                envio && envio !== 'enviando' && (
                    <div
                        role={envio.ok ? 'status' : 'alert'}
                        className={`absolute top-[56px] left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-md text-[11px] font-bold shadow-lg pointer-events-none flex items-center gap-1.5 max-w-[92%]
                        ${envio.ok ? 'bg-[#0f5132] text-[#b7f7d0] border border-[#1a7a4c]' : 'bg-[#5c1a22] text-[#ffc9cf] border border-[#8a2a36]'}`}>
                        {
                            envio.ok ?
                                <svg className='w-3.5 h-3.5 flex-none' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round'>
                                    <polyline points='4 13 9 18 20 6' />
                                </svg>
                                :
                                <svg className='w-3.5 h-3.5 flex-none' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round'>
                                    <circle cx='12' cy='12' r='9' />
                                    <path d='M12 7v6M12 16.5v.01' />
                                </svg>
                        }
                        <span className='truncate'>{envio.texto}</span>
                    </div>
                )
            }


            {/*  IMAGEN DE LA TABLET
                 SIN BARRA DE DESPLAZAMIENTO HORIZONTAL. Al 100 % la imagen mide
                 justo el ancho de la ventana, así que no hay nada que desplazar a
                 los lados. Con zoom sí sobra imagen, pero a ella se llega
                 ARRASTRANDO: `overflow-x-hidden` quita la barra, no el
                 desplazamiento — el arrastre mueve scrollLeft igual.

                 'items-start justify-start' y no 'center': con la imagen más ancha
                 que el hueco, `justify-center` la desborda por los dos lados y la
                 parte izquierda queda fuera de alcance. El centrado, mientras cabe,
                 lo hace el `margin: auto` de la propia imagen.  */}
            <div
                ref={contenedorImgRef}
                onMouseDown={empezarArrastre}
                className={`w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex items-start justify-start border-b border-[#0a3a66] bg-black/20 ${arrastrando ? 'cursor-grabbing select-none' : sePuedeMover ? 'cursor-grab' : ''}`}
            >

                {
                    imgUrl ?
                        <img
                            //  EL ZOOM MANDA SOBRE EL ANCHO, Y EL ALTO SIGUE A LA IMAGEN
                            //
                            //  Antes iba `width: zoom%` Y `height: zoom%` a la vez, con
                            //  `object-contain`. Eso estiraba el HUECO a todo el
                            //  contenedor y después encajaba la foto dentro conservando
                            //  su proporción: como la pantalla de la tablet casi nunca
                            //  tiene la misma forma que la ventana, sobraba sitio a los
                            //  lados y quedaban esas dos franjas oscuras.
                            //
                            //  Con el alto en `auto` la imagen ya no vive dentro de una
                            //  caja mayor que ella: al 100 % ocupa el ancho completo y su
                            //  altura sale sola de su proporción. Sin franjas.
                            //
                            //  `object-contain` se cae porque ya no pinta nada: solo
                            //  tenía sentido cuando había una caja que rellenar.
                            //
                            //  'flex: none' evita que flex encoja la imagen y anule el zoom.
                            //  'maxWidth: none' quita el tope que trae Tailwind por defecto.
                            //
                            //  'margin: auto' la centra mientras quepa, PERO —y por esto
                            //  no se usa `items-center` para ella— cuando no cabe, los
                            //  márgenes se van a cero y se puede llegar al borde de
                            //  arriba desplazándose. Centrando con `align-items`, ese
                            //  trozo queda fuera de alcance: es un viejo defecto de
                            //  flexbox al desbordar, y con el zoom alto se nota enseguida.
                            style={{ width: `${zoom}%`, height: 'auto', flex: 'none', maxWidth: 'none', margin: 'auto' }}
                            src={imgUrl}
                            alt='pantalla tablet'
                            draggable={false}
                            onLoad={() => setSePuedeMover(sePuedeArrastrar())}
                        />
                        :
                        <p className='m-auto text-[12px] text-[#5e7ba0] px-4 text-center'>Conecta la tablet para ver su pantalla</p>
                }
            </div>




            {/*  BARRA DE ZOOM
                 Los tres controles van juntos en un grupo: alejar, el porcentaje (un
                 clic vuelve al 100 %) y acercar. A la derecha, la pista de arrastre
                 solo cuando de verdad hay imagen fuera de la vista.  */}
            <div
                className='h-10 shrink-0 flex items-center gap-2 px-2 bg-[#021a38] select-none'
                style={{ WebkitAppRegion: 'no-drag' }}
            >

                <div className='vt-zoom' role='group' aria-label='Zoom de la imagen'>
                    <button
                        type='button'
                        className='vt-zoom__paso'
                        onClick={() => cambiarZoom(-ZOOM_PASO)}
                        disabled={zoom <= ZOOM_MIN}
                        aria-label='Alejar'
                        title='Alejar'
                    >
                        <Icono nombre='alejar' tamano={16} />
                    </button>

                    <button
                        type='button'
                        className='vt-zoom__valor'
                        onClick={() => setZoom(100)}
                        title='Volver al 100 %'
                    >
                        {zoom} %
                    </button>

                    <button
                        type='button'
                        className='vt-zoom__paso'
                        onClick={() => cambiarZoom(ZOOM_PASO)}
                        disabled={zoom >= ZOOM_MAX}
                        aria-label='Acercar'
                        title='Acercar'
                    >
                        <Icono nombre='acercar' tamano={16} />
                    </button>
                </div>

                {
                    sePuedeMover && (
                        <span className='hidden min-[480px]:flex items-center gap-1.5 text-[11px] text-[#8aa0bb]'>
                            <Icono nombre='mover' tamano={14} />
                            Arrastra la imagen para moverte
                        </span>
                    )
                }

                {/*  GUARDAR LA CAPTURA Y SUS TIRAS
                     Solo en desarrollo: es una herramienta para comparar modelos, no
                     algo que el monitorista necesite ver.  */}
                {
                    import.meta.env.DEV && (
                        <button
                            type='button'
                            className='vt-icono vt-icono--pequeno ml-auto'
                            onClick={guardarCapturaYTiras}
                            disabled={!connected}
                            aria-label='Guardar la captura y sus tiras'
                            title='Guarda el PNG completo y las tiras tal como se le mandan al modelo, para el banco de pruebas'
                        >
                            <Icono nombre='guardar' tamano={16} />
                        </button>
                    )
                }

            </div>


        </div>
    );
}




/*  LOS ÍCONOS DE LA VENTANA
 *
 *  Todos del mismo dibujo: caja de 24, trazo de 1,8, puntas redondeadas y sin
 *  relleno. Van aquí dentro y no en una librería porque son pocos y así el trazo es
 *  el mismo en todos. Toman el color del texto del botón (`currentColor`), y el
 *  tamaño va en atributos para que ninguna clase de Tailwind compita con él.
 */
const TRAZOS = {
    //  Enchufe: conectar la tablet por USB.
    conectar: <><path d='M9 3v4M15 3v4' /><path d='M6.5 7h11v3.5a5.5 5.5 0 0 1-11 0z' /><path d='M12 16v5' /></>,

    //  El mismo enchufe, tachado.
    desconectar: <><path d='M9 3v4M15 3v4' /><path d='M6.5 7h11v3.5a5.5 5.5 0 0 1-11 0z' /><path d='M12 16v5' /><line x1='3' y1='3' x2='21' y2='21' /></>,

    //  Cámara con una flecha hacia arriba: mandar esta captura a Jarvis.
    captura: <><path d='M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2l1.2-2h8.2l1.2 2h2.2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z' /><path d='M12 16.5v-6' /><polyline points='9.3 13 12 10.3 14.7 13' /></>,

    //  Destellos: el modo IA. Tachados cuando está en pausa.
    ia: <><path d='M11 3.5l1.7 4.6 4.6 1.7-4.6 1.7L11 16.1l-1.7-4.6-4.6-1.7 4.6-1.7z' /><path d='M18 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z' /></>,
    iaPausa: <><path d='M11 3.5l1.7 4.6 4.6 1.7-4.6 1.7L11 16.1l-1.7-4.6-4.6-1.7 4.6-1.7z' /><path d='M18 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z' /><line x1='3' y1='3' x2='21' y2='21' /></>,

    cerrar: <><line x1='6' y1='6' x2='18' y2='18' /><line x1='18' y1='6' x2='6' y2='18' /></>,
    hecho: <polyline points='5 12.5 10 17 19 7' />,
    acercar: <><circle cx='11' cy='11' r='7' /><line x1='16.5' y1='16.5' x2='21' y2='21' /><line x1='8' y1='11' x2='14' y2='11' /><line x1='11' y1='8' x2='11' y2='14' /></>,
    alejar: <><circle cx='11' cy='11' r='7' /><line x1='16.5' y1='16.5' x2='21' y2='21' /><line x1='8' y1='11' x2='14' y2='11' /></>,
    mover: <><polyline points='5 9 2 12 5 15' /><polyline points='9 5 12 2 15 5' /><polyline points='15 19 12 22 9 19' /><polyline points='19 9 22 12 19 15' /><line x1='2' y1='12' x2='22' y2='12' /><line x1='12' y1='2' x2='12' y2='22' /></>,
    guardar: <><path d='M12 4v11' /><polyline points='7.5 10.5 12 15 16.5 10.5' /><path d='M5 20h14' /></>,

    //  Un matraz: probar con una tablet de mentira.
    simular: <><path d='M9.5 3h5' /><path d='M10.5 3v6.2L5.2 18a2 2 0 0 0 1.7 3h10.2a2 2 0 0 0 1.7-3l-5.3-8.8V3' /><path d='M7.6 15h8.8' /></>,
};


function Icono({ nombre, tamano = 18 }) {
    //  El anillo que gira mientras algo está en curso.
    if (nombre === 'girando') return (
        <svg className='animate-spin' width={tamano} height={tamano} viewBox='0 0 24 24' fill='none' aria-hidden='true'>
            <circle cx='12' cy='12' r='8.5' stroke='currentColor' strokeWidth='2.5' opacity='0.25' />
            <path d='M20.5 12a8.5 8.5 0 0 0-8.5-8.5' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' />
        </svg>
    );

    return (
        <svg width={tamano} height={tamano} viewBox='0 0 24 24' fill='none' stroke='currentColor'
             strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
            {TRAZOS[nombre]}
        </svg>
    );
}



export { TabletScreen };
