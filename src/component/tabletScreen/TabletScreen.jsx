import { useState, useRef, useEffect } from 'react';
import { Adb, AdbDaemonTransport } from '@yume-chan/adb';
import { AdbDaemonWebUsbDeviceManager } from '@yume-chan/adb-daemon-webusb';
import AdbWebCredentialStore from '@yume-chan/adb-credential-web';
import axios from 'axios';
import { enviarImagenToastPos } from '../../libs/fetch_data/noveltyFecth.js';
import { TIRAS_DE_LECTURA, SOLAPE_DE_LECTURA, INTERVALO_LECTURA_MS, tirasParaElAncho } from '../../libs/tickets/configLectura.js';
import { aSegundosDeCronometro, bandaPorEspera } from '../../libs/tickets/cronometro.js';
import { PROMPT_DE_LECTURA, ETIQUETAS_DE_PANTALLA, leerCabecera, extraerTickets } from '../../libs/tickets/lecturaDeTickets.js';
import { claveDeTicket } from '../../libs/tickets/claveDeTicket.js';
import { SIMULACION_DISPONIBLE } from '../../simulador/disponible.js';


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





//  El prompt, las etiquetas de pantalla y el parseo de la respuesta viven en
//  libs/tickets/lecturaDeTickets.js. No es código de React y tiene un segundo
//  cliente: el banco de pruebas que compara modelos los importa de allí, para medir
//  exactamente lo que corre en esta ventana y no una copia parecida.


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


//  Cuánto se espera a que el modelo conteste una tira. El porqué del número está
//  junto a la petición, en sendImg. Va en una constante porque el mensaje de error
//  lo cita: «la IA tardó más de 120 s».
const TIEMPO_LIMITE_IA_MS = 120000;


/*  @param {function} onTickets  por aquí salen los tickets hacia la parrilla que
 *                               vive debajo, en la misma ventana. Sin esta función el
 *                               componente sigue funcionando igual: solo deja de
 *                               entregar lo que lee.
 *  @param {function} onCerrar / onArrastrarBarra  solo hacen falta fuera de Electron,
 *                               donde la ventana no se cierra ni se mueve sola.
 *  @param {string}   nombreLocal  para que la barra diga de qué local es esta tablet.
 */
/*  'refreshMs' es cada cuánto se pide una captura nueva a la tablet — el ritmo del
 *  ESPEJO, no el de la lectura por IA.
 *
 *  A 500 ms la pantalla se ve más fluida. El ciclo se reprograma solo y descuenta lo
 *  que tardó la captura, así que si `screencap` pasa de medio segundo simplemente va
 *  tan rápido como pueda: nunca se apilan dos peticiones contra el mismo ADB.
 *
 *  OJO con lo que NO cambia: los tickets de las parrillas llegan al ritmo que marca
 *  configLectura.js, no este. Bajar esto hace el vídeo más suave,
 *  no los datos más frescos.
 */
export function TabletScreen({ refreshMs = 500, onTickets, onCerrar, onArrastrarBarra, nombreLocal }) {

    /*  LA ÚLTIMA VERSIÓN DE 'onTickets'
     *
     *  El bucle de captura se arma una vez, al conectar, y se queda con las funciones
     *  que existían en ese render. Si llamara a la prop directamente, seguiría usando
     *  la primera versión aunque el padre pasara otra después.
     *
     *  Esta referencia se actualiza en cada render, así que el bucle lee siempre la
     *  buena.
     */
    const onTicketsRef = useRef(onTickets);
    useEffect(() => { onTicketsRef.current = onTickets; }, [onTickets]);


    //  De qué local es esta tablet. Manda lo que pase quien nos monte; si no pasa
    //  nada, se resuelve solo desde donde la ventana principal deja el local elegido.
    const nombreDelLocal = nombreLocal ?? localEnCurso()?.name ?? '';


    //  ESTADO DE CONEXIÓN
    const [connected, setConnected] = useState(false);
    const [statusText, setStatusText] = useState('Sin conectar');
    const [imgUrl, setImgUrl] = useState(null);

    const [responseRerenceState, setResponseRerenceState] = useState([]);
    const [inferenceTime, setInferenceTime] = useState(null);   // segundos que tardó la última inferencia
    const [ultimoError, setUltimoError] = useState(null);       // qué falló en la última lectura, si falló
    const [ticketsLeidos, setTicketsLeidos] = useState(null);   // cuántos vio la IA la última vez
    const [respuestaCruda, setRespuestaCruda] = useState('');   // lo que contestó, para cuando no se entiende
    const [tamanoImagen, setTamanoImagen] = useState('');       // DIAGNÓSTICO: cuánta imagen se está mandando
    const [consultando, setConsultando] = useState(false);      // hay una lectura en curso ahora mismo
    const [tiraEnLectura, setTiraEnLectura] = useState(null);   // la última tira que se mandó al modelo, para la barra

    //  Un intento de conexión en curso. El estado pinta el botón girando; la ref es el
    //  cerrojo, porque dos clics en el mismo fotograma verían los dos el estado viejo y
    //  abrirían dos conexiones sobre el mismo USB.
    const [conectando, setConectando] = useState(false);
    const conectandoRef = useRef(false);


    //  MODO IA. El bucle de captura se arma al conectar y conserva las funciones de ese
    //  render, así que lee el interruptor por la ref, que siempre tiene el valor actual.
    const [modoIA, setModoIA] = useState(leerModoIAGuardado);
    const modoIARef = useRef(modoIA);

    useEffect(() => {
        modoIARef.current = modoIA;
        try { localStorage.setItem(CLAVE_MODO_IA, modoIA ? '1' : '0'); }
        catch { /* es una comodidad: sin almacenamiento, vale para esta sesión */ }
    }, [modoIA]);


    //  RECORRIDO DE LA PANTALLA POR CUADRANTES
    //
    //  La pantalla entera lleva unos 30 tickets con letra minúscula, y el
    //  modelo la encoge antes de mirarla: el texto se pierde. Mandando un trozo
    //  cada vez, a cada ticket le tocan muchos más píxeles y sí se lee.
    //
    //  Los tiras se van turnando en orden y vuelven al primero, así que
    //  cada RECORRIDO_COMPLETO_MS se ha mirado la pantalla entera.
    //  La cuadrícula y el intervalo viven juntos en configLectura.js: si se cambia uno
    //  sin el otro, el recorrido de la pantalla se alarga sin que nadie lo note.

    const tiraRef = useRef(0);

    //  En cuántas tiras se corta ESTA pantalla. Depende de su ancho y se sabe al llegar
    //  la primera captura: una tablet de 1024 px se corta en menos que una pantalla
    //  ancha (el porqué, en configLectura.js). La ref es para el bucle de captura; el
    //  estado, para pintar las marcas de la barra.
    const tirasRef = useRef(TIRAS_DE_LECTURA);
    const [tiras, setTiras] = useState(TIRAS_DE_LECTURA);

    //  Los tickets vistos, guardados por número de mesa. Como cada lectura solo
    //  ve un cuarto de pantalla, hay que ir juntándolos: si se reemplazara la
    //  lista entera en cada vuelta, solo quedarían los del último tira.
    const ticketsPorMesaRef = useRef(new Map());

    //  La hora que marcaba la tablet en la última captura. Con ella se calcula el
    //  tiempo de vida de cada pedido.
    const horaTabletRef = useRef('');

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


    /*  GUARDA LA CAPTURA ACTUAL Y LAS TIRAS QUE SE LE MANDAN AL MODELO
     *
     *  Para el banco de pruebas. Guardar las TIRAS y no solo la pantalla completa no es
     *  un capricho: el banco tiene que mandarle al modelo exactamente la misma imagen
     *  que recibe en marcha. Si el banco recortara por su cuenta compararía modelos
     *  sobre imágenes parecidas pero distintas, y el resultado no serviría para decidir.
     *
     *  Así el banco no necesita ninguna librería de imagen: lee PNG y los manda.
     */
    const guardarCapturaYTiras = async () => {
        const captura = ultimaCapturaRef.current;
        if (!captura) return setStatusText('Todavía no hay ninguna captura');

        //  Un sello por captura, para que las tiras de una misma foto queden juntas al
        //  ordenar por nombre y no se mezclen con las de otra.
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

        for (let i = 0; i < tirasRef.current; i++) {
            bajar(await recortarTira(captura, tirasRef.current, SOLAPE_DE_LECTURA, i), `${sello}-tira${i}.png`);
        }

        setStatusText(`Guardadas: completa + ${tirasRef.current} tiras (${sello})`);
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

    //  REFS (cosas que NO disparan render: la conexión, el timer y la url anterior)
    const adbRef = useRef(null);
    const intervalRef = useRef(null);
    const lastUrlRef = useRef(null);
    const enVueloRef = useRef(false);
    const ultimoEnvioRef = useRef(0);
    const ultimaCapturaRef = useRef(null);   //  el PNG que se está viendo, para mandarlo a Jarvis

    //  La petición a la IA que está en curso, para poder cancelarla al desconectar.
    //  Sin esto, una lectura lanzada justo antes de desconectar llegaba después y
    //  volvía a llenar la parrilla recién vaciada.
    const lecturaEnVueloRef = useRef(null);


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

        const captura = ultimaCapturaRef.current;
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



    //  PROMPT
    //
    //  El texto vive en libs/tickets/lecturaDeTickets.js, junto al parser de lo que
    //  conteste. Están juntos porque cambian juntos: tocar el prompt sin tocar el
    //  parser es el camino más corto a leer bien y entender mal.
    const prompt = PROMPT_DE_LECTURA;




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
        }
        catch (error) {
            console.log(error);
            setStatusText('Error: ' + error.message);
        }
        finally {
            conectandoRef.current = false;
            setConectando(false);
        }
    };




    /*  CONECTAR CON UNA TABLET DE MENTIRA — solo en desarrollo
     *
     *  En lugar del USB, se engancha al simulador de Toast: otra ventana que pinta una
     *  pantalla de cocina y la sirve como si fuera el 'screencap'. Lo que se guarda en
     *  'adbRef' tiene la misma forma que un Adb de verdad, así que de aquí para abajo
     *  NADA sabe que es una simulación: el bucle de captura, las tiras, la lectura, el
     *  acumulado y las parrillas son los de siempre. Es justo lo que se quiere probar.
     *
     *  Se carga con import() y detrás de la constante para que el simulador no entre
     *  en el paquete de la versión publicada.
     */
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
        }
        catch (error) {
            console.log(error);
            setStatusText('Error: ' + error.message);
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

            //  Se cancela la lectura en vuelo ANTES de cerrar: su respuesta ya no
            //  tiene dónde caer, y cancelarla es además la única forma de que el
            //  servidor deje de calcularla.
            lecturaEnVueloRef.current?.abort();
            lecturaEnVueloRef.current = null;

            if (adbRef.current) await adbRef.current.close();
        }
        catch (error) { console.log(error); }
        finally {
            adbRef.current = null;
            setConnected(false);
            setImgUrl(null);
            setStatusText('Sin conectar');

            /*  Y SE BORRA LO LEÍDO EN ESTA SESIÓN
             *
             *  Sin esto, al volver a conectar la parrilla seguía enseñando los tickets
             *  de la vez anterior —mesas que hace rato que se fueron— hasta que cada
             *  tira volviera a pasar. Es decir, hasta un minuto mostrando el
             *  estado de otro momento como si fuera el de ahora.
             *
             *  El contador de tiras y el reloj también vuelven a cero, para que la
             *  sesión nueva empiece por el primer tira y lea de inmediato.
             */
            ticketsPorMesaRef.current.clear();
            tiraRef.current = 0;
            ultimoEnvioRef.current = 0;
            setTiraEnLectura(null);

            setResponseRerenceState([]);
            setTicketsLeidos(null);
            setUltimoError(null);
            setRespuestaCruda('');

            //  Vacía la parrilla de abajo — pero avisando de que es una DESCONEXIÓN. Una
            //  lista vacía a secas es lo mismo que manda una pantalla sin tickets, y el
            //  seguimiento daría todos los pedidos abiertos por desaparecidos, sellándoles
            //  un «Listo en tablet» con la hora en que alguien soltó el cable.
            onTicketsRef.current?.([], '', { desconexion: true });
            window.electronAPI?.enviarTickets?.([]);     //  y la de la ventana principal, si la hay
        }
    };




    //  CAPTURAR LA PANTALLA ('screencap -p' devuelve un PNG por la salida del proceso)
    const capturarPantalla = async () => {
        try {
            if (!adbRef.current) return;

            const png = await adbRef.current.subprocess.noneProtocol.spawnWait(['screencap', '-p']);

            /*  Y DE PASO, LA HORA DE LA TABLET
             *
             *  El tiempo de vida de un pedido es la hora de la tablet menos la hora a
             *  la que entró el ticket. Tiene que ser la hora de la TABLET, no la del
             *  equipo: son dos relojes distintos y basta un minuto de diferencia para
             *  que todas las cuentas salgan torcidas.
             *
             *  Se pide junto con la captura, en la misma vuelta: así las dos cosas
             *  corresponden al mismo instante.
             */
            horaTabletRef.current = await leerHoraDeLaTablet(adbRef.current);
            const blob = new Blob([png], { type: 'image/png' });

            //  El ancho de la captura decide en cuántas tiras se lee. Si cambia —otra
            //  tablet, o la misma girada— el recorrido vuelve a empezar por la primera.
            const tirasDeEstaPantalla = tirasParaElAncho(anchoDelPng(png));
            if (tirasDeEstaPantalla !== tirasRef.current) {
                tirasRef.current = tirasDeEstaPantalla;
                tiraRef.current = 0;
                setTiras(tirasDeEstaPantalla);
            }

            //  Se guarda la última captura para el botón de enviar a Jarvis.
            //  Va en una `ref` y no en el estado a propósito: cambia una vez por
            //  segundo y no se pinta en ningún sitio, así que meterla en el
            //  estado provocaría un render por segundo sin que se vea nada
            //  distinto. Es exactamente el fotograma que se está mirando, que es
            //  lo que la persona cree estar mandando cuando pulsa.
            ultimaCapturaRef.current = blob;
            const url = URL.createObjectURL(blob);


            if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);   // libera la imagen anterior
            lastUrlRef.current = url;

            setImgUrl(url);

            //  La captura corre a 500 ms (espejo fluido), pero a la IA solo se
            //  le manda un tira cada INTERVALO_LECTURA_MS: es cara y lenta.
            //
            //  Con el modo IA en pausa no se manda nada y el turno no avanza: al
            //  reanudar, la lectura sigue por la tira que tocaba.
            const ahora = Date.now();
            if (modoIARef.current && !enVueloRef.current && ahora - ultimoEnvioRef.current >= INTERVALO_LECTURA_MS) {
                ultimoEnvioRef.current = ahora;

                //  Le toca a un tira distinto cada vez
                const tira = tiraRef.current;
                tiraRef.current = (tira + 1) % tirasRef.current;
                setTiraEnLectura(tira);

                //  SIN `await`: la lectura por IA es lo que rompía el segundo.
                //
                //  Recortar el tira y mandarlo al modelo tarda lo suyo, y
                //  esperarlo aquí dentro congelaba el espejo hasta que el
                //  modelo contestara. En cada turno de lectura la imagen se
                //  quedaba clavada un rato — justo mientras se leía «Leyendo
                //  tira N… (puede tardar un minuto)».
                //
                //  Soltándolo, la captura sigue su ritmo y la lectura avanza
                //  por su cuenta. `sendImg` ya se protege de solaparse consigo
                //  misma con `enVueloRef`.
                //  La hora se apunta AHORA, con la foto: es la de esta captura, no la que
                //  marque el reloj cuando el modelo termine de leerla.
                const horaDeLaCaptura = horaTabletRef.current;

                recortarTira(blob, tirasRef.current, SOLAPE_DE_LECTURA, tira)
                    .then(recorte => sendImg(recorte, tira, horaDeLaCaptura))
                    .catch(error => console.log(error));
            }
        }
        catch (error) {
            console.log(error);
        }
    };





    /*  @param {string} horaDeLaCaptura  la hora de la tablet CUANDO SE HIZO LA FOTO que se
     *                                   manda a leer. Es la que acompaña al resultado.
     *
     *  No vale leer el reloj al terminar. La toma de orden es «hora − cronómetro», y el
     *  cronómetro es el de la foto: restárselo a la hora de cuando CONTESTA el modelo
     *  retrasa todas las tomas de orden justo lo que tarde la lectura. Con un modelo
     *  que responde en 5 s son 5 s de error en cada fila; con uno que tarda 3 minutos,
     *  3 minutos. Y lo mismo le pasaba a «Listo en tablet», que se sella con esta hora.
     */
    const sendImg = async (img, tira = 0, horaDeLaCaptura = horaTabletRef.current) => {
        if (enVueloRef.current) return;
        enVueloRef.current = true;
        setConsultando(true);      //  para que la ventana no se quede muda mientras espera

        //  Fuera del 'try' porque también la usa el 'catch', para decir a qué servidor
        //  no se pudo llegar.
        const url = `${import.meta.env.VITE_AI_URL}/api/v1/chat`;

        //  Lo que viaja en cada entrega además de los tickets. 'simulacion' avisa a la
        //  ventana de que esto NO es la cocina de verdad: con ella bloquea lo que
        //  saldría hacia Jarvis, como reportar una demora.
        const diagnostico = (datos) => ({ tira, simulacion: Boolean(adbRef.current?.simulado), ...datos });

        try {
            //  Se usa la API PROPIA de LM Studio (/api/v1/chat), no la compatible
            //  con OpenAI, por un motivo concreto: es la única que deja apagar el
            //  razonamiento del modelo.
            //
            //  Este modelo "piensa" antes de responder, y ese pensamiento gasta
            //  tiempo y presupuesto. Con la otra API tardaba 29 segundos por
            //  lectura y a veces se quedaba sin tokens antes de contestar.
            //  Con reasoning en "off": 0,7 segundos y cero tokens desperdiciados.
            //
            //  Para leer tickets no hace falta que razone — solo que copie lo
            //  que ve.
            const body = {
                model: 'google/gemma-4-e4b',
                input: [
                    { type: 'text', content: prompt },
                    { type: 'image', data_url: img }
                ],
                reasoning: 'off',
                temperature: 0
            };

            //  DIAGNÓSTICO TEMPORAL: cuánta imagen se está mandando de verdad.
            //  El servidor acepta hasta 4 MB sin problema (probado), así que si
            //  el modelo dice que no recibe imagen, el fallo está de este lado.
            const kb = Math.round((img?.length ?? 0) / 1024);
            const cabecera = String(img).slice(0, 30);
            console.log(`[IA] mandando imagen: ${kb} KB — empieza por "${cabecera}"`);
            setTamanoImagen(`${kb} KB`);

            const start = performance.now();
            /*  CON TIEMPO LÍMITE, Y NO ES OPCIONAL
             *
             *  Sin él, una conexión que se queda colgada —el servidor de la IA cae, la
             *  red se va a medias— deja 'enVueloRef' en true para siempre. Y ese
             *  cerrojo es justo el que impide lanzar la siguiente lectura: la ventana
             *  se queda mirando la tablet sin volver a leer nada, sin error y sin más
             *  salida que desconectar y conectar otra vez.
             *
             *  EL NÚMERO SUBIÓ DE 60 A 120 SEGUNDOS, y no por capricho.
             *
             *  Con los cuadrantes pequeños una lectura tardaba 0,7 s y 60 sobraban. Al
             *  pasar a tiras de altura completa entran seis tarjetas por imagen, y al
             *  pedir la cabecera transcrita cada una genera bastante texto: el modelo
             *  local se pasaba de los 60 y la vuelta se perdía ENTERA.
             *
             *  Perder la vuelta es lo peor que puede pasar: se tira el trabajo ya hecho
             *  y esa parte de la pantalla se queda sin mirar hasta el recorrido
             *  siguiente. Vale más esperar de más que descartar.
             *
             *  Sigue habiendo límite porque sin él una conexión colgada dejaría
             *  'enVueloRef' en true para siempre, y ese cerrojo es el que impide lanzar
             *  la siguiente lectura: la ventana se quedaría mirando la tablet sin leer
             *  nada, sin error y sin más salida que desconectar y volver a conectar.
             */
            const control = new AbortController();
            lecturaEnVueloRef.current = control;

            /*  ¿QUIÉN LEE ESTA TIRA?
             *
             *  Con la tablet de verdad, siempre el servidor de IA. Con la simulada lo
             *  decide el panel del simulador: puede mandarla al servidor igualmente —y
             *  entonces 'lecturaSimulada' devuelve null y se sigue por el camino de
             *  siempre— o contestar él mismo, para probar todo lo que viene después de
             *  la lectura cuando el servidor está lento o caído.
             *
             *  Lo que devuelve es TEXTO con el formato del modelo, no tickets ya hechos:
             *  pasa por el mismo extraerTickets y el mismo leerCabecera que la respuesta
             *  real. Si el parser se rompe, la simulación también lo enseña.
             */
            const simulada = await adbRef.current?.lecturaSimulada?.({
                tira,
                tiras: tirasRef.current,
                solape: SOLAPE_DE_LECTURA,
                esperaMs: TIEMPO_LIMITE_IA_MS,
                senal: control.signal,
            });

            const response = simulada ? null : await axios.post(url, body, { timeout: TIEMPO_LIMITE_IA_MS, signal: control.signal });

            const segundos = (performance.now() - start) / 1000;
            setInferenceTime(segundos.toFixed(1));

            //  La API propia devuelve la respuesta en `output`, no en `choices`
            const content = simulada ? simulada.contenido : response?.data?.output?.[0]?.content ?? '';

            const pensados = response?.data?.stats?.reasoning_output_tokens ?? 0;
            const cortado = false;   //  sin razonamiento ya no se queda a medias

            console.log(simulada ? '[IA] lectura simulada' : `[IA] ${response?.data?.stats?.total_output_tokens ?? '?'} tokens · razonó ${pensados}`);
            console.log(content);

            const tickets = extraerTickets(content);

            /*  LECTURA ILEGIBLE: SE DESCARTA LA VUELTA ENTERA
             *
             *  'null' quiere decir que el modelo contestó algo que no se entiende. Eso
             *  NO es lo mismo que una pantalla vacía, y tratarlo igual hacía daño: más
             *  abajo se borran los tickets de este tira para que los pedidos
             *  terminados desaparezcan, y con una respuesta ilegible esa limpieza se
             *  llevaba por delante las mesas que seguían en pantalla.
             *
             *  Desaparecían de la parrilla hasta la vuelta siguiente de este tira
             *  —un minuto— y la vuelta se marcaba además como buena, así que no quedaba
             *  ni rastro de que algo había fallado.
             *
             *  Se sale sin tocar el acumulado y sin entregar nada: la lista anterior
             *  sigue siendo la mejor que hay. Lo único que se hace es dejar constancia.
             */
            if (tickets === null) {
                setUltimoError('respuesta ilegible, se descarta esta vuelta');
                setTicketsLeidos(null);
                setRespuestaCruda(content.trim().slice(0, 200) || 'respuesta vacía');

                //  Los tickets NO se tocan —esta vuelta se descarta entera—, pero el fallo
                //  sí sube: callarlo es lo que hacía imposible distinguir «no hay novedades»
                //  de «lleva diez minutos sin entender una sola respuesta».
                onTicketsRef.current?.(null, horaDeLaCaptura, diagnostico({ leidos: 0, descartados: 0, error: 'respuesta ilegible' }));
                return;
            }

            //  Esta lectura solo vio un cuarto de pantalla. Se van juntando por
            //  número de mesa: los de este tira se actualizan, y los de los
            //  otros tres se conservan de las vueltas anteriores.
            const acumulado = ticketsPorMesaRef.current;

            //  Una foto de cómo estaba ANTES de limpiar. La regla de «una lectura dudosa
            //  no pisa a una buena» tiene que comparar contra lo que había, y si mirara
            //  el acumulado ya limpio no encontraría nada: la mesa buena leída por esta
            //  misma tira la vuelta anterior se acababa de borrar, y la mala entraba.
            const previos = new Map(acumulado);

            //  Primero se quitan los que este mismo tira había traído antes:
            //  si una mesa terminó su pedido, su ticket ya no está en pantalla y
            //  tiene que desaparecer, no quedarse pegado para siempre.
            for (const [mesa, t] of acumulado) {
                if (t.tira === tira) acumulado.delete(mesa);
            }

            /*  LOS PEDIDOS QUE NO SON DE MESA NECESITAN CLAVE PROPIA
             *
             *  La clave era el número de mesa, y con las mesas funciona: son únicas.
             *  Pero el prompt pide que, cuando el ticket no es de una mesa, se escriba
             *  el nombre tal cual — "Take Out", "Uber Eats", "Online Ordering"—. Y ahí
             *  la clave deja de ser única: dos Take Out a la vez comparten texto, el
             *  segundo pisa al primero en el Map y en la parrilla aparece UNO SOLO.
             *
             *  Para esos, la clave lleva además el tira y un contador dentro de
             *  la lectura, así que dos pedidos iguales son dos filas.
             *
             *  La clave viaja dentro del ticket porque la parrilla la necesita para
             *  identificar la fila: si allí volviera a usar la mesa, los juntaría otra
             *  vez justo después de haberlos separado aquí.
             */
            const repetidos = new Map();

            //  Cuántos objetos de esta lectura NO llegaron a ser un ticket. Se enseña en la
            //  barra de estado: sin este número, "0 pedidos" no distingue entre una
            //  pantalla sin novedades y un filtro que se está comiendo todo.
            let descartados = 0;

            tickets.forEach(t => {
                /*  LO QUE MANDA ES LA CABECERA TRANSCRITA
                 *
                 *  De ella salen mesa, número y cronómetro, los tres del MISMO texto, que
                 *  es lo que impide que se crucen entre tarjetas.
                 *
                 *  Los campos sueltos quedan de respaldo por dos motivos: si el modelo
                 *  vuelve al formato anterior la ventana sigue funcionando, y si una
                 *  cabecera sale ilegible todavía se puede aprovechar lo que venga
                 *  aparte. Nunca pisan a la cabecera: solo rellenan lo que falte.
                 */
                const cabecera = leerCabecera(t?.cabecera);

                //  La mesa de la cabecera se usa TAL CUAL: ya viene resuelta, y cuando el
                //  pedido no tiene mesa es el ticket con su '#'. Pasarla por
                //  normalizarMesa le quitaría ese '#' y un «#34» sin mesa se confundiría
                //  con la mesa 34.
                //
                //  Los campos sueltos son de prompts viejos (.table. el más antiguo). Se
                //  aceptan para no descartar una lectura por un cambio de nombre.
                const mesa = cabecera?.mesa || normalizarMesa(t?.mesa ?? t?.table);
                if (!mesa) { descartados++; return; }

                /*  ─────────────────────────────────────────────────────────────────
                 *  DOS PUERTAS QUE SEPARAN UN TICKET DE UN TROZO DE PANTALLA
                 *
                 *  Un recorte puede caer entre dos tarjetas y dejar renglones de
                 *  producto sin cabecera. El prompt ya pide no contestar en ese caso,
                 *  pero pedirlo no es garantizarlo: en la parrilla llegaron a salir
                 *  mesas llamadas «Arepa Llanera», «Nestea Limon» y «FIRE».
                 *
                 *  1. TIENE QUE TRAER CRONÓMETRO. Es lo que mejor distingue una
                 *     cabecera de todo lo demás: toda tarjeta lleva uno y ningún
                 *     renglón de producto lo tiene. Además, sin él no hay ni tiempo de
                 *     vida ni toma de orden, así que la fila no valdría para nada.
                 *
                 *  2. NO PUEDE SER UNA ETIQUETA DE LA PANTALLA. 'FIRE' encabeza el
                 *     cronómetro de cada tarjeta, y 'DRINKS' y 'ENTREE' separan
                 *     secciones dentro de un ticket. Son las que más se han colado.
                 *  ───────────────────────────────────────────────────────────────── */
                const espera = aSegundosDeCronometro(cabecera?.tiempo || t?.tiempo);
                if (espera === null) { descartados++; return; }

                if (ETIQUETAS_DE_PANTALLA.has(mesa.trim().toUpperCase())) { descartados++; return; }

                /*  LA IDENTIDAD DE UN PEDIDO
                 *
                 *  Manda el NÚMERO DE TICKET, que es lo que Toast imprime en cada
                 *  tarjeta y lo único verdaderamente único: una mesa puede tener tres
                 *  pedidos, y con la mesa por clave los tres se pisaban entre sí en el
                 *  Map — quedaba uno solo, y sus tiempos saltaban de un pedido a otro.
                 *
                 *  Es además una identidad ESTABLE entre lecturas, y eso es lo que
                 *  permite ver que un ticket cambió de color y estampar la hora. Con
                 *  una clave que depende del texto del plato, una errata del modelo
                 *  partía el mismo pedido en dos filas.
                 *
                 *  Si la pantalla no muestra número —o el modelo no lo lee— se cae a lo
                 *  de antes: la mesa, y para los pedidos que no son de mesa una clave
                 *  con el tira y un contador, para que dos «Take Out» simultáneos
                 *  no se fundan en uno.
                 */
                const numeroTicket = textoLimpio(cabecera?.ticket || t?.ticket);

                let clave;

                if (numeroTicket) {
                    //  Con el curso dentro: en la pantalla del expedidor un mismo ticket
                    //  sale en varias tarjetas, una por curso. El porqué largo está en
                    //  claveDeTicket.js.
                    clave = claveDeTicket(numeroTicket, t?.tipo);
                }
                else if (/^\d+$/.test(mesa)) {
                    //  Una mesa de verdad es solo dígitos.
                    clave = mesa;
                }
                else {
                    const n = (repetidos.get(mesa) ?? 0) + 1;
                    repetidos.set(mesa, n);
                    clave = `${mesa}·c${tira}·${n}`;
                }

                /*  EL COLOR NO SE PREGUNTA: SE DEDUCE
                 *
                 *  La cabecera es amarilla o roja según lo que lleve esperando, y nada
                 *  más. Teniendo el cronómetro, calcularlo aquí sale gratis y no falla
                 *  nunca — mientras que preguntárselo al modelo costaba un campo de la
                 *  lectura y acertaba a medias.
                 *
                 *  'rojo' se conserva porque la parrilla de rotación ordena por
                 *  urgencia con él.
                 */
                const color = bandaPorEspera(espera);

                /*  UNA LECTURA DUDOSA NO PISA A UNA BUENA
                 *
                 *  El mismo ticket se lee desde DOS tiras —para eso está el solape—, y
                 *  en una de ellas puede caer cortado por el borde. Ahí el modelo
                 *  transcribe "6 #34 …" en vez de "Table 16 #34 …", y como las tiras se
                 *  recorren en orden, la mala llegaba DESPUÉS y sobrescribía a la buena.
                 *  Así aparecía en la parrilla una mesa «6» que no existe en pantalla.
                 *
                 *  Ahora la mesa solo se reemplaza si la nueva lectura es al menos tan
                 *  fiable como la que ya había. El resto de campos sí se refrescan: de
                 *  ellos no sabemos cuál es mejor, y el más reciente es el más probable.
                 */
                const previo = previos.get(clave);
                const conservarMesa = previo?.mesaFiable && !cabecera?.mesaFiable;

                acumulado.set(clave, {
                    ...t,
                    mesa: conservarMesa ? previo.mesa : mesa,
                    mesaFiable: conservarMesa ? true : Boolean(cabecera?.mesaFiable),
                    clave,
                    tira,
                    ticket: textoLimpio(cabecera?.ticket || t?.ticket),

                    /*  EL CRONÓMETRO TAMBIÉN SE COPIA DE LA CABECERA, Y ES OBLIGATORIO.
                     *
                     *  Faltaba, y costó las dos columnas de tiempo. Al dejar de pedirle
                     *  'tiempo' al modelo —ahora va dentro de 'cabecera'—, 't.tiempo'
                     *  quedó en undefined, así que el seguimiento no encontraba ningún
                     *  cronómetro y se saltaba entero el cálculo. Las filas SÍ salían,
                     *  porque el filtro de aquí arriba sí mira la cabecera, y por eso el
                     *  fallo no se parecía a lo que era: parecía un problema del reloj.
                     *
                     *  Regla para no repetirlo: lo que se saque de la cabecera hay que
                     *  ponerlo AQUÍ. Lo que no se ponga, aguas abajo no existe.
                     */
                    tiempo: cabecera?.tiempo || textoLimpio(t?.tiempo),

                    plato: textoLimpio(t?.plato),
                    tipo: textoLimpio(t?.tipo),

                    //  De qué canal es el pedido, si la cabecera lo delataba. Ya no va en
                    //  'mesa', pero el tipo de plato lo sigue aprovechando.
                    canal: cabecera?.canal ?? '',

                    listo: t?.listo === true,
                    color,
                    rojo: color === 'rojo',
                });
            });

            const todos = [...acumulado.values()];

            setUltimoError(null);              //  esta vuelta salió bien
            setTicketsLeidos(tickets.length);

            //  Si no se entendió nada, guardamos lo que dijo para poder verlo en la
            //  ventana: sin esto, "0 tickets" no distingue entre "la pantalla estaba
            //  vacía" y "contestó en prosa y el parser no encontró el JSON".
            setRespuestaCruda(
                tickets.length > 0 ? ''
                    : cortado ? `se quedó sin tokens pensando (${pensados} razonando)`
                        : content.trim().slice(0, 200) || 'respuesta vacía'
            );

            setResponseRerenceState(todos);

            /*  ENTREGA DE LA LECTURA
             *
             *  Se manda SIEMPRE la lista completa, aunque este tira no haya
             *  traído nada: si una mesa terminó su pedido, quien la esté mirando
             *  tiene que enterarse de que ya no está.
             *
             *  A la parrilla de abajo, que está en esta misma ventana. Se llama a
             *  través de la referencia y no a la prop directamente porque el bucle de
             *  captura se creó en el primer render y conserva las funciones de aquel
             *  momento: usar la prop aquí congelaría la primera versión para siempre.
             */
            onTicketsRef.current?.(todos, horaDeLaCaptura, diagnostico({
                leidos: tickets.length,
                descartados,
                segundos,
                error: null,
            }));

            //  Y a la ventana principal, si hay carcasa de escritorio y también
            //  quiere verlos. En un navegador window.electronAPI no existe, así que
            //  esta línea simplemente no hace nada. Los de una simulación no salen de
            //  esta ventana: no son de ninguna cocina.
            if (!adbRef.current?.simulado) window.electronAPI?.enviarTickets?.(todos);
        }
        catch (error) {
            //  Cancelada desde handdlerDisconnect: no es un fallo y no hay a quién
            //  avisar, la parrilla ya se vació. ('AbortError' es como cancela el
            //  lector simulado, que no pasa por axios.)
            if (axios.isCancel(error) || error?.name === 'AbortError') return;

            console.log(error);

            //  En la barra se lee un motivo en español y no el mensaje de axios:
            //  «timeout of 120000ms exceeded» o «Network Error» no le dicen a quien
            //  mira la ventana si la IA está lenta, apagada o rechazada.
            const motivo = explicarFalloDeIA(error, url);

            setUltimoError(motivo);
            setTicketsLeidos(null);

            onTicketsRef.current?.(null, horaDeLaCaptura, diagnostico({ leidos: 0, descartados: 0, error: motivo }));
        }
        finally {
            lecturaEnVueloRef.current = null;
            enVueloRef.current = false;
            setConsultando(false);
        }
    };




    //  ══════════════════════════════════════════════════════════════════
    //  REFRESCO AUTOMÁTICO MIENTRAS ESTÉ CONECTADO
    //  ══════════════════════════════════════════════════════════════════
    //  Un ciclo que se reprograma solo, en lugar de `setInterval`.
    //
    //  `setInterval` dispara a su ritmo MIRE O NO si la vuelta anterior
    //  terminó. Pedirle una captura a la tablet por USB puede pasar del medio
    //  segundo —pantalla grande, cable con ruido, equipo cargado—, y entonces
    //  las llamadas se pisan: se le mandan dos `screencap` a la vez al mismo
    //  ADB, que no está para eso. El resultado son tirones y capturas perdidas,
    //  justo lo contrario de un espejo fluido.
    //
    //  Así se espera SIEMPRE a que termine una antes de programar la siguiente,
    //  y no puede haber dos en vuelo.
    //
    //  Además se descuenta lo que tardó la captura, para que entre imagen e
    //  imagen pase el intervalo REAL. Con `setTimeout(ciclo, refreshMs)` a
    //  secas, el ritmo sería ese intervalo MÁS lo que tarde cada captura: con
    //  400 ms de captura, una imagen cada 900 ms en vez de cada 500.
    useEffect(() => {
        if (!connected) return;

        let vivo = true;

        const ciclo = async () => {
            const inicio = Date.now();

            await capturarPantalla();

            //  Puede haberse desconectado mientras se esperaba la captura.
            //  Sin esto se programaría una vuelta más sobre una conexión que
            //  ya no existe.
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
                    <span className={`min-w-0 text-[11px] truncate ${colorDelEstado}`}>
                        {statusText}
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


            {/*  Aquí iba la barra de estado de la lectura por IA — «Leyendo
                 tira N… (puede tardar un minuto)», el tamaño de la
                 imagen, los tokens y los segundos que tardó.

                 Se retiró: era información de diagnóstico, escrita mientras se
                 ajustaba el modelo, y en una ventana de 400×300 se comía una
                 franja permanente para decir algo que a quien monitorea no le
                 sirve. La lectura sigue corriendo igual y sus resultados siguen
                 viajando a Jarvis; lo único que se quitó es el cartel.

                 Si vuelve a hacer falta para depurar, el estado que lo
                 alimentaba —`consultando`, `ultimoError`, `ticketsLeidos`,
                 `respuestaCruda`, `tamanoImagen`, `inferenceTime`— sigue vivo, y
                 todo eso se registra además en la consola.  */}


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




/*  Deja el número de mesa en una sola forma.
 *
 *  El modelo devuelve lo que ve, y en la pantalla la misma mesa aparece escrita
 *  de varias maneras: "Table 28", "#26", "34". Sin unificarlo, una mesa leída
 *  dos veces con distinto formato contaría como dos mesas distintas.
 *
 *  Los tickets que no son de mesa (Take Out, Uber Eats) se dejan con su nombre.
 */
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




/*  Qué le pasó a la petición a la IA, dicho para quien mira la ventana.
 *
 *  Tres casos, y se distinguen porque piden cosas distintas:
 *
 *    · Se agotó el tiempo: el servidor está vivo pero el modelo va lento. Se cita el
 *      tope para que se entienda que no es un fallo de red.
 *    · Contestó con error: el servidor sí llegó a responder, y su mensaje suele
 *      decir qué pasó (modelo no cargado, petición mal formada).
 *    · No hubo respuesta ninguna: el navegador ni siquiera pudo hablar con él. Es
 *      el servidor apagado, la dirección mal puesta o un certificado que el
 *      navegador no acepta — desde aquí no se puede saber cuál, así que se
 *      nombran los tres.
 */
function explicarFalloDeIA(error, url) {
    const seAgotoElTiempo = error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message ?? '');
    if (seAgotoElTiempo) {
        return `la IA tardó más de ${Math.round(TIEMPO_LIMITE_IA_MS / 1000)} s en contestar`;
    }

    const respuesta = error?.response;
    if (respuesta) {
        const detalle = respuesta.data?.error?.message ?? respuesta.data?.error ?? respuesta.statusText ?? '';
        return `la IA respondió ${respuesta.status}${detalle ? `: ${String(detalle).slice(0, 120)}` : ''}`;
    }

    let servidor = '';
    try { servidor = new URL(url).host; } catch { /* la dirección viene de .env y puede estar vacía */ }

    return `no se pudo conectar con la IA${servidor ? ` en ${servidor}` : ''}: servidor apagado, dirección incorrecta o certificado no aceptado`;
}




/*  El ancho en píxeles de un PNG, leído de su cabecera y sin decodificar la imagen.
 *
 *  Un PNG empieza siempre igual: ocho bytes de firma y, acto seguido, el bloque IHDR con
 *  el ancho en los bytes 16 a 19. Devuelve 0 si eso no es un PNG — y con 0 quien llama
 *  se queda con el número de tiras de siempre.
 */
function anchoDelPng(bytes) {
    if (!bytes || bytes.length < 24) return 0;
    if (bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4E || bytes[3] !== 0x47) return 0;

    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(16);
}




//  Un campo de texto de la lectura, dejado en algo con lo que se pueda trabajar. El
//  modelo a veces devuelve null y a veces un número: de aquí sale siempre texto.
function textoLimpio(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor).trim();
}


/*  La hora que marca la tablet, en 'HH:MM:SS'.
 *
 *  Se le pregunta a ella y no al equipo porque el tiempo de vida de un pedido se
 *  calcula contra las horas que aparecen en SU pantalla. Dos relojes que difieran en
 *  un minuto darían un minuto de error en cada fila.
 *
 *  Si falla, devuelve '' y quien lo use se las arregla con el reloj del equipo: es
 *  peor no calcular nada que calcularlo con un minuto de desfase.
 */
async function leerHoraDeLaTablet(adb) {
    try {
        const salida = await adb.subprocess.noneProtocol.spawnWait(['date', '+%H:%M:%S']);
        const texto = new TextDecoder().decode(salida).trim();

        /*  Se BUSCA la hora dentro de la salida en vez de exigir que sea toda ella.
         *
         *  Antes se comparaba el texto entero contra el patrón, y bastaba cualquier
         *  cosa alrededor —un aviso del shell, un salto raro, una variante de `date`
         *  que devuelva la fecha completa— para que se descartara. El resultado era
         *  una hora vacía y, sin decir nada, todas las filas se sellaban con el reloj
         *  del equipo: dos horas de diferencia con la tablet.
         */
        const encontrada = texto.match(/\b(\d{1,2}:\d{2}:\d{2})\b/);

        if (!encontrada) {
            console.log('[HORA] la tablet no devolvió una hora reconocible:', JSON.stringify(texto.slice(0, 80)));
            return '';
        }

        return encontrada[1];
    }
    catch (error) {
        console.log('[HORA] no se pudo leer el reloj de la tablet:', error?.message ?? error);
        return '';
    }
}




function normalizarMesa(valor) {
    if (valor === null || valor === undefined) return '';

    const texto = String(valor)
        .replace(/table/gi, '')     //  "Table 28" -> " 28"
        .replace(/#/g, '')          //  "#26"      -> "26"
        .trim();

    return texto;
}




/*  Recorta una TIRA VERTICAL de la captura y la devuelve lista para mandar.
 *
 *  La pantalla se corta en `tiras` franjas de arriba abajo y se devuelve la número
 *  `indice`, contando de izquierda a derecha:
 *
 *      recortarTira(blob, 4, 0.4, 1)  →  ┌──┬──┬──┬──┐
 *                                        │  │▓▓│  │  │   cada tira va de arriba
 *                                        │  │▓▓│  │  │   abajo, entera
 *                                        └──┴──┴──┴──┘
 *
 *  Antes esto cortaba en cuadrícula, y ahí estaba el fallo: una cuadrícula parte las
 *  tarjetas por la mitad y deja recortes con renglones de producto y ninguna cabecera.
 *  Como las tarjetas se apilan en columnas, una tira de altura completa las contiene
 *  enteras. El porqué largo está en configLectura.js.
 *
 *  `solape` ensancha cada tira hacia sus vecinas —en fracción de su propio ancho— para
 *  que una tarjeta a caballo entre dos aparezca completa al menos en una. En los bordes
 *  de la pantalla se recorta contra el límite, así que las tiras de los extremos salen
 *  algo más estrechas; no importa, ahí no hay nada que se pueda partir.
 *
 *  No se reduce nada de tamaño: el modelo encoge lo que le llega, y cuanto menos
 *  contenido traiga la imagen, más píxeles le tocan a cada letra.
 */
async function recortarTira(blob, tiras, solape, indice) {
    const bitmap = await createImageBitmap(blob);

    const paso = bitmap.width / tiras;
    const margen = paso * solape;

    //  Los bordes se pegan al límite de la imagen: sin esto, la primera y la última
    //  tira pedirían píxeles que no existen y el lienzo saldría con una banda vacía.
    const desde = Math.max(0, Math.floor(indice * paso - margen));
    const hasta = Math.min(bitmap.width, Math.ceil((indice + 1) * paso + margen));

    const ancho = Math.max(1, hasta - desde);
    const alto = bitmap.height;

    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;

    lienzo.getContext('2d').drawImage(
        bitmap,
        desde, 0, ancho, alto,   //  de dónde se recorta
        0, 0, ancho, alto        //  dónde se pega
    );

    bitmap.close();   //  sin esto la memoria del mapa de bits no se libera

    return lienzo.toDataURL('image/png');
}





