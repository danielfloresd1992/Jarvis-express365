import { useState, useRef, useEffect } from 'react';
import { Adb, AdbDaemonTransport } from '@yume-chan/adb';
import { AdbDaemonWebUsbDeviceManager } from '@yume-chan/adb-daemon-webusb';
import AdbWebCredentialStore from '@yume-chan/adb-credential-web';
import axios from 'axios';
import { enviarImagenToastPos } from '../../libs/fetch_data/noveltyFecth.js';


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


export function TabletScreen({ refreshMs = 1000 }) {

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


    //  RECORRIDO DE LA PANTALLA POR CUADRANTES
    //
    //  La pantalla entera lleva unos 30 tickets con letra minúscula, y el
    //  modelo la encoge antes de mirarla: el texto se pierde. Mandando un
    //  cuarto cada vez, cada ticket ocupa el cuádruple y sí se lee.
    //
    //  Se va rotando 0 → 1 → 2 → 3 → 0…, así que cada minuto (4 × 15 s) se ha
    //  recorrido la pantalla completa.
    const CUADRICULA = 2;                        //  2 × 2 = cuatro cuadrantes
    const TOTAL_CUADRANTES = CUADRICULA * CUADRICULA;

    const cuadranteRef = useRef(0);

    //  Los tickets vistos, guardados por número de mesa. Como cada lectura solo
    //  ve un cuarto de pantalla, hay que ir juntándolos: si se reemplazara la
    //  lista entera en cada vuelta, solo quedarían los del último cuadrante.
    const ticketsPorMesaRef = useRef(new Map());

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
    //  Gemma E4B es un modelo pequeño: responde bien a instrucciones cortas con un
    //  ejemplo exacto, y mal a párrafos largos. Por eso se le pide una sola cosa,
    //  se le enseña el formato literal y se le dice qué hacer cuando no ve nada.
    //
    //  Solo se le piden datos que ESTÁN en la imagen. Pedirle una hora que la
    //  pantalla no muestra lo llevaría a inventarla.
    const prompt = [
        'Mira esta captura de una pantalla de cocina con tickets.',
        'Responde UNICAMENTE con un array JSON. Sin explicaciones, sin texto antes ni despues.',
        '',
        'Un objeto por cada ticket visible, con exactamente estas tres claves:',
        '',
        '"mesa": SOLO EL NUMERO, sin la palabra "Table" y sin el simbolo "#".',
        '        Si pone "Table 28" escribe "28". Si pone "#26" escribe "26".',
        '        Si el ticket no es de una mesa (Take Out, Uber Eats, Online',
        '        Ordering) escribe ese nombre tal cual.',
        '',
        '"tiempo": el tiempo del ticket copiado EXACTAMENTE como se ve, sin',
        '          cambiar ni un digito. Si pone 1:37:06 escribe "1:37:06".',
        '          No lo reformatees ni le añadas ceros.',
        '',
        '"rojo": true si ese tiempo esta escrito en rojo, false si no.',
        '',
        'Formato exacto de la respuesta:',
        '[{"mesa":"26","tiempo":"2:23:01","rojo":true},{"mesa":"22","tiempo":"1:58:36","rojo":false}]',
        '',
        'Si no ves ningun ticket responde: []'
    ].join('\n');




    //  CONECTAR CON LA TABLET (debe ejecutarse dentro de un click del usuario)
    const handdlerConnect = async () => {
        try {
            setStatusText('Solicitando dispositivo...');

            const manager = AdbDaemonWebUsbDeviceManager.BROWSER;
            if (!manager) return setStatusText('Este navegador no soporta WebUSB (usa Chrome/Edge)');
            const UNISOC_ADB_VID = 0x18d1;
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
    };




    //  DESCONECTAR
    const handdlerDisconnect = async () => {
        try {
            if (intervalRef.current) clearTimeout(intervalRef.current);
            if (adbRef.current) await adbRef.current.close();
        }
        catch (error) { console.log(error); }
        finally {
            adbRef.current = null;
            setConnected(false);
            setImgUrl(null);
            setStatusText('Sin conectar');
        }
    };




    //  CAPTURAR LA PANTALLA ('screencap -p' devuelve un PNG por la salida del proceso)
    const capturarPantalla = async () => {
        try {
            if (!adbRef.current) return;

            const png = await adbRef.current.subprocess.noneProtocol.spawnWait(['screencap', '-p']);
            const blob = new Blob([png], { type: 'image/png' });

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

            //  La captura corre cada segundo (espejo fluido), pero a la IA
            //  solo se le manda una imagen cada 15 s: es cara y lenta.
            const ahora = Date.now();
            if (ahora - ultimoEnvioRef.current >= 15000) {
                ultimoEnvioRef.current = ahora;

                //  Le toca a un cuadrante distinto cada vez
                const cuadrante = cuadranteRef.current;
                cuadranteRef.current = (cuadrante + 1) % TOTAL_CUADRANTES;

                //  SIN `await`: la lectura por IA es lo que rompía el segundo.
                //
                //  Recortar el cuadrante y mandarlo al modelo tarda lo suyo, y
                //  esperarlo aquí dentro congelaba el espejo hasta que el
                //  modelo contestara. Cada quince segundos la imagen se quedaba
                //  clavada un rato — justo mientras se leía «Leyendo cuadrante
                //  N de 4… (puede tardar un minuto)».
                //
                //  Soltándolo, la captura sigue su ritmo y la lectura avanza
                //  por su cuenta. `sendImg` ya se protege de solaparse consigo
                //  misma con `enVueloRef`.
                recortar(blob, CUADRICULA, CUADRICULA, cuadrante)
                    .then(recorte => sendImg(recorte, cuadrante))
                    .catch(error => console.log(error));
            }
        }
        catch (error) {
            console.log(error);
        }
    };





    const sendImg = async (img, cuadrante = 0) => {
        if (enVueloRef.current) return;
        enVueloRef.current = true;
        setConsultando(true);      //  para que la ventana no se quede muda mientras espera

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
            const url = `${import.meta.env.VITE_AI_URL}/api/v1/chat`;
            const response = await axios.post(url, body);
            setInferenceTime(((performance.now() - start) / 1000).toFixed(1));

            //  La API propia devuelve la respuesta en `output`, no en `choices`
            const content = response?.data?.output?.[0]?.content ?? '';

            const pensados = response?.data?.stats?.reasoning_output_tokens ?? 0;
            const cortado = false;   //  sin razonamiento ya no se queda a medias

            console.log(`[IA] ${response?.data?.stats?.total_output_tokens ?? '?'} tokens · razonó ${pensados}`);
            console.log(content);

            const tickets = parseTickets(content);

            //  Esta lectura solo vio un cuarto de pantalla. Se van juntando por
            //  número de mesa: los de este cuadrante se actualizan, y los de los
            //  otros tres se conservan de las vueltas anteriores.
            const acumulado = ticketsPorMesaRef.current;

            //  Primero se quitan los que este mismo cuadrante había traído antes:
            //  si una mesa terminó su pedido, su ticket ya no está en pantalla y
            //  tiene que desaparecer, no quedarse pegado para siempre.
            for (const [mesa, t] of acumulado) {
                if (t.cuadrante === cuadrante) acumulado.delete(mesa);
            }

            tickets.forEach(t => {
                //  'table' es el nombre que pedía el prompt anterior. Se acepta
                //  también para no descartar una lectura por un cambio de nombre.
                const mesa = normalizarMesa(t?.mesa ?? t?.table);
                if (mesa) acumulado.set(mesa, { ...t, mesa, cuadrante });
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

            //  Se manda SIEMPRE la lista completa, aunque este cuadrante no haya
            //  traído nada: si una mesa terminó su pedido, Jarvis tiene que
            //  enterarse de que ya no está.
            //
            //  Dentro de un navegador normal window.electronAPI no existe, así
            //  que esta línea simplemente no hace nada.
            window.electronAPI?.enviarTickets?.(todos);
        }
        catch (error) {
            console.log(error);

            //  El motivo real suele venir dentro de la respuesta del servidor;
            //  error.message a secas solo diría "Request failed with status code 400"
            //  y no se sabría si fue el contexto, el modelo o la red.
            const motivo = error?.response?.data?.error?.message
                ?? error?.response?.data?.error
                ?? error?.message
                ?? 'error desconocido';

            setUltimoError(String(motivo));
            setTicketsLeidos(null);
        }
        finally {
            enVueloRef.current = false;
            setConsultando(false);
        }
    };




    //  ══════════════════════════════════════════════════════════════════
    //  REFRESCO AUTOMÁTICO MIENTRAS ESTÉ CONECTADO
    //  ══════════════════════════════════════════════════════════════════
    //  Un ciclo que se reprograma solo, en lugar de `setInterval`.
    //
    //  `setInterval` dispara cada segundo MIRE O NO si la vuelta anterior
    //  terminó. Pedirle una captura a la tablet por USB puede pasar del
    //  segundo —pantalla grande, cable con ruido, equipo cargado—, y entonces
    //  las llamadas se pisan: se le mandan dos `screencap` a la vez al mismo
    //  ADB, que no está para eso. El resultado son tirones y capturas perdidas,
    //  justo lo contrario de un espejo fluido.
    //
    //  Así se espera SIEMPRE a que termine una antes de programar la siguiente,
    //  y no puede haber dos en vuelo.
    //
    //  Además se descuenta lo que tardó la captura, para que entre imagen e
    //  imagen pase un segundo REAL. Con `setTimeout(ciclo, 1000)` a secas, el
    //  ritmo sería un segundo MÁS lo que tarde cada captura: con 400 ms de
    //  captura, una imagen cada 1,4 s en vez de cada segundo.
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




    //  DATOS ANALÍTICOS derivados de los tickets
    console.log(responseRerenceState);




    //  'fixed inset-0' y no 'w-full h-full': el panel se ancla a la VENTANA,
    //  no a lo que midan sus padres.
    //
    //  Con `w-full h-full` el tamaño se pedía en porcentaje, y un porcentaje
    //  hay que medirlo contra alguien. La cadena era html → body → #root, y el
    //  `body` de esta aplicación lleva `display: flex; place-items: center`
    //  —herencia de la plantilla de Vite—, así que #root no ocupaba la ventana:
    //  se encogía hasta el tamaño de su contenido y quedaba centrado.
    //
    //  El resultado engañaba, porque dependía de lo que hubiera dentro. Con la
    //  tablet conectada, la captura es ancha, estiraba el panel y parecía que
    //  todo estaba bien. Sin conectar solo quedan la barra y el texto, el panel
    //  se encogía a su ancho, y aparecían dos bandas oscuras a los lados.
    //
    //  Un elemento fijo se mide contra la ventana y le da igual el `display` de
    //  sus padres. Así el panel llena siempre, haya imagen o no.
    return (
        <div className='fixed inset-0 flex flex-col overflow-hidden rounded-xl border border-[#0a3a66] bg-[#01122c]'>



            {/*  BARRA SUPERIOR (estado + botón)
                 La ventana flotante no tiene marco, así que esta barra hace de barra
                 de título: 'drag' le dice a Electron que arrastrando aquí se mueve
                 la ventana entera. Los botones llevan 'no-drag' porque dentro de una
                 zona arrastrable dejarían de responder al clic.  */}
            <div
                className='sticky top-0 z-10 flex items-center justify-between gap-2 px-3 py-2 bg-[#021a38] border-b border-[#0a3a66] cursor-move select-none'
                style={{ WebkitAppRegion: 'drag' }}
            >

                {/*  'min-w-0' es imprescindible: sin él un hijo de flex no baja de su
                     ancho natural, así que este texto empujaría los botones fuera de
                     la ventana en lugar de recortarse con puntos suspensivos.  */}
                <span className='min-w-0 flex-1 text-[11px] font-bold uppercase tracking-[0.6px] text-[#5e7ba0] truncate'>
                    {statusText}
                </span>

                <div className='flex-none flex items-center gap-1.5' style={{ WebkitAppRegion: 'no-drag' }}>

                    {/*  ENVIAR LA CAPTURA A LA BANDEJA DE JARVIS

                         Solo aparece con la tablet conectada: sin conexión no hay
                         nada que mandar, y un botón que solo sabe dar error es
                         peor que no tenerlo.

                         Es un ícono de cámara y no un texto porque la barra es
                         estrecha y ya carga el estado, «Desconectar» y la ✕;
                         una palabra más empujaría todo fuera. El `title` dice
                         qué hace al pasar el ratón.  */}
                    {connected && (
                        <button
                            className='flex-none w-7 h-7 flex items-center justify-center rounded-md text-[#aecbf0] bg-[#0a3a66]/50 hover:bg-[#066ca8] hover:text-white disabled:opacity-40 disabled:hover:bg-[#0a3a66]/50'
                            onClick={enviarCaptura}
                            disabled={envio === 'enviando'}
                            title='Enviar esta captura a la bandeja de Jarvis'
                        >
                            {
                                envio === 'enviando' ?
                                    //  Anillo girando: sin él, en una conexión lenta
                                    //  no habría forma de saber si el clic entró.
                                    <svg className='w-4 h-4 animate-spin' viewBox='0 0 24 24' fill='none'>
                                        <circle cx='12' cy='12' r='9' stroke='currentColor' strokeWidth='2.5' opacity='0.25' />
                                        <path d='M21 12a9 9 0 0 0-9-9' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' />
                                    </svg>
                                    :
                                    <svg className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor'
                                        strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
                                        <path d='M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2l1.2-2h8.2l1.2 2h2.2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z' />
                                        <circle cx='12' cy='13' r='3.4' />
                                    </svg>
                            }
                        </button>
                    )}

                    {
                        !connected ?
                            <button className='px-2.5 py-1 rounded-md text-[11px] font-bold text-white bg-[#066ca8] hover:bg-[#0890c0]' onClick={handdlerConnect}>
                                Conectar
                            </button>
                            :
                            <button className='px-2.5 py-1 rounded-md text-[11px] font-bold text-white bg-[#7a1f2b] hover:bg-[#9a2533]' onClick={handdlerDisconnect}>
                                Desconectar
                            </button>
                    }

                    {/*  Cerrar la propia ventana flotante  */}
                    <button
                        className='flex-none w-6 h-6 flex items-center justify-center rounded-md text-[15px] font-bold text-[#5e7ba0] hover:text-white hover:bg-[#7a1f2b]'
                        onClick={() => window.electronAPI?.closeTabletWindow?.()}
                        title='Cerrar'
                    >
                        ✕
                    </button>
                </div>

            </div>


            {/*  RESULTADO DEL ENVÍO

                 Va SUPERPUESTO, no dentro del flujo. En una ventana de 400×300
                 una banda que aparece y desaparece empujaría la imagen hacia
                 abajo y de vuelta cada vez, y ese salto se nota más que el
                 propio aviso.

                 Se coloca contra el panel —que es `fixed inset-0`, o sea que ya
                 sirve de referencia— justo debajo de la barra superior.

                 `pointer-events-none` para que no se coma un clic sobre la
                 imagen si el aviso cae encima de algo que se quería arrastrar.  */}
            {
                envio && envio !== 'enviando' && (
                    <div className={`absolute top-11 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-md text-[11px] font-bold shadow-lg pointer-events-none flex items-center gap-1.5 max-w-[92%]
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
                 'overflow-auto' es lo que permite moverse por la imagen cuando el
                 zoom la hace más grande que la ventana. Sin eso, al ampliar solo
                 se vería el centro y el resto quedaría cortado sin poder alcanzarlo.  */}
            <div
                ref={contenedorImgRef}
                onMouseDown={empezarArrastre}
                className={`w-full flex-1 min-h-0 overflow-auto flex items-center justify-center border-b border-[#0a3a66] bg-black/20 ${arrastrando ? 'cursor-grabbing select-none' : sePuedeMover ? 'cursor-grab' : ''}`}
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
                        <p className='text-[12px] text-[#33486a] px-4 text-center'>Conecta la tablet para ver su pantalla</p>
                }
            </div>


            {/*  Aquí iba la barra de estado de la lectura por IA — «Leyendo
                 cuadrante N de 4… (puede tardar un minuto)», el tamaño de la
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


            {/*  BARRA DE ZOOM  */}
            <div
                className='flex items-center justify-center gap-2 px-3 py-1 bg-[#021a38] select-none'
                style={{ WebkitAppRegion: 'no-drag' }}
            >

                <svg className='w-3.5 h-3.5 text-[#5e7ba0]' viewBox='0 0 24 24' fill='none'
                     stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' aria-hidden='true'>
                    <circle cx='11' cy='11' r='7' />
                    <line x1='16.5' y1='16.5' x2='21' y2='21' />
                </svg>

                {/*  El glifo se centra con flex, no con line-height: así queda igual
                     de centrado sean cuales sean el tipo de letra y el símbolo.  */}
                <button
                    className='w-6 h-6 flex items-center justify-center rounded-md text-[16px] font-bold text-[#aecbf0] bg-[#0a3a66]/50 hover:bg-[#0a3a66] disabled:opacity-30 disabled:hover:bg-[#0a3a66]/50'
                    onClick={() => cambiarZoom(-ZOOM_PASO)}
                    disabled={zoom <= ZOOM_MIN}
                    title='Alejar'
                >
                    <span className='block -mt-0.5'>−</span>
                </button>

                {/*  Un clic en el número vuelve al 100 %  */}
                <button
                    className='min-w-[52px] text-[11px] font-mono tabular-nums text-[#5e7ba0] hover:text-white'
                    onClick={() => setZoom(100)}
                    title='Volver al 100 %'
                >
                    {zoom} %
                </button>

                <button
                    className='w-6 h-6 flex items-center justify-center rounded-md text-[16px] font-bold text-[#aecbf0] bg-[#0a3a66]/50 hover:bg-[#0a3a66] disabled:opacity-30 disabled:hover:bg-[#0a3a66]/50'
                    onClick={() => cambiarZoom(ZOOM_PASO)}
                    disabled={zoom >= ZOOM_MAX}
                    title='Acercar'
                >
                    <span className='block -mt-0.5'>+</span>
                </button>

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
function normalizarMesa(valor) {
    if (valor === null || valor === undefined) return '';

    const texto = String(valor)
        .replace(/table/gi, '')     //  "Table 28" -> " 28"
        .replace(/#/g, '')          //  "#26"      -> "26"
        .trim();

    return texto;
}




/*  Recorta un trozo de la captura y lo devuelve listo para mandar.
 *
 *  La pantalla se divide en una cuadrícula de `columnas` × `filas`, y se
 *  devuelve el trozo número `indice`, contando de izquierda a derecha y de
 *  arriba abajo:
 *
 *      recortar(blob, 2, 2, 0)  →  ┌───┬───┐   0 = arriba izquierda
 *                                  │ 0 │ 1 │
 *                                  ├───┼───┤
 *                                  │ 2 │ 3 │
 *                                  └───┴───┘
 *
 *  Se mantiene el tamaño original del recorte: no se reduce nada. La ganancia
 *  está en que el modelo, al encoger, parte de una imagen con menos contenido,
 *  así que a cada letra le tocan más píxeles.
 */
async function recortar(blob, columnas, filas, indice) {
    const bitmap = await createImageBitmap(blob);

    const ancho = Math.floor(bitmap.width / columnas);
    const alto = Math.floor(bitmap.height / filas);
    const columna = indice % columnas;
    const fila = Math.floor(indice / columnas);

    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;

    lienzo.getContext('2d').drawImage(
        bitmap,
        columna * ancho, fila * alto, ancho, alto,   //  de dónde se recorta
        0, 0, ancho, alto                             //  dónde se pega
    );

    bitmap.close();   //  sin esto la memoria del mapa de bits no se libera

    return lienzo.toDataURL('image/png');
}




//  Convierte un tiempo "mm:ss" / "h:mm:ss" / "0.24" a segundos (para ordenar)
function toSeconds(t) {
    if (!t) return 0;
    const clean = String(t).replace('#', '').replace('.', ':').trim();
    const parts = clean.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return Number(clean) || 0;
}




//  Extrae el array de tickets del texto markdown que devuelve el modelo
function parseTickets(content) {
    try {
        const match = content.match(/```json\s*([\s\S]*?)```/);
        const raw = match ? match[1] : content.slice(content.indexOf('['), content.lastIndexOf(']') + 1);
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    }
    catch (error) {
        console.log('No se pudo parsear la respuesta:', error);
        return [];
    }
}