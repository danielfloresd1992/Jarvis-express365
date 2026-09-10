import { useState, useRef, useEffect } from 'react';
import { Adb, AdbDaemonTransport } from '@yume-chan/adb';
import { AdbDaemonWebUsbDeviceManager } from '@yume-chan/adb-daemon-webusb';
import AdbWebCredentialStore from '@yume-chan/adb-credential-web';
import axios from 'axios';





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


/*  `onCerrar` y `onArrastrarBarra` solo se usan cuando esto vive dentro de un
 *  panel de la página, no en la ventana flotante de Electron.
 *
 *  En Electron la ventana se arrastra y se cierra sola: `-webkit-app-region` y
 *  `closeTabletWindow` lo resuelven a nivel del sistema. Un navegador no tiene
 *  nada de eso, así que quien envuelve al componente tiene que encargarse, y
 *  para eso necesita saber cuándo se agarra la barra y cuándo se pulsa la ✕.
 */
export function TabletScreen({ refreshMs = 1000, onCerrar, onArrastrarBarra, nombreLocal }) {

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
            if (intervalRef.current) clearInterval(intervalRef.current);
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

                const recorte = await recortar(blob, CUADRICULA, CUADRICULA, cuadrante);
                sendImg(recorte, cuadrante);
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




    //  REFRESCO AUTOMÁTICO MIENTRAS ESTÉ CONECTADO
    useEffect(() => {
        if (!connected) return;

        capturarPantalla();                                       // primera captura inmediata
        intervalRef.current = setInterval(capturarPantalla, refreshMs);

        return () => clearInterval(intervalRef.current);
    }, [connected, refreshMs]);




    //  LIMPIEZA AL DESMONTAR EL COMPONENTE
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
            if (adbRef.current) adbRef.current.close();
        };
    }, []);




    //  DATOS ANALÍTICOS derivados de los tickets
    console.log(responseRerenceState);




    return (
        <div className='w-full h-full flex flex-col overflow-hidden rounded-xl border border-[#0a3a66] bg-[#01122c]'>



            {/*  BARRA SUPERIOR (estado + botón)
                 La ventana flotante no tiene marco, así que esta barra hace de barra
                 de título: 'drag' le dice a Electron que arrastrando aquí se mueve
                 la ventana entera. Los botones llevan 'no-drag' porque dentro de una
                 zona arrastrable dejarían de responder al clic.  */}
            <div
                className='sticky top-0 z-10 flex items-center justify-between gap-2 px-3 py-2 bg-[#021a38] border-b border-[#0a3a66] cursor-move select-none'
                style={{ WebkitAppRegion: 'drag' }}
                onMouseDown={onArrastrarBarra}
            >

                {/*  Nombre del local arriba y estado debajo, en dos líneas.
                     En una sola, con la ventana estrecha, el nombre empujaba los
                     botones y la ✕ se salía por el borde.

                     'min-w-0' es imprescindible: sin él un hijo de flex no baja de
                     su ancho natural y recortar con puntos suspensivos no funciona.  */}
                <span className='min-w-0 flex-1 flex flex-col gap-0.5 leading-none'>
                    <span className='min-w-0 text-[11px] font-bold text-[#aecbf0] truncate' title={nombreLocal ?? ''}>
                        {nombreLocal || 'Tablet'}
                    </span>

                    <span className='flex items-center gap-1.5'>
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${connected ? 'bg-[#7fc79e]' : 'bg-[#33486a]'}`} />
                        <span className='min-w-0 text-[9px] font-bold uppercase tracking-[0.6px] text-[#5e7ba0] truncate'>
                            {statusText}
                        </span>
                    </span>
                </span>

                {/*  Los dos botones comparten alto (h-6) para que la barra quede
                     alineada: antes el de conectar se dibujaba con el alto de su
                     texto y el de cerrar con el suyo, y no cuadraban.  */}
                <div className='flex-none flex items-center gap-1' style={{ WebkitAppRegion: 'no-drag' }}>
                    <button
                        className={`h-6 px-2.5 flex items-center rounded-md text-[10px] font-bold uppercase tracking-[0.4px] text-white transition-colors ${connected ? 'bg-[#7a1f2b] hover:bg-[#9a2533]' : 'bg-[#066ca8] hover:bg-[#0890c0]'}`}
                        onClick={connected ? handdlerDisconnect : handdlerConnect}
                    >
                        {connected ? 'Desconectar' : 'Conectar'}
                    </button>

                    {/*  Cerrar la ventana.
                         Lleva fondo y borde propios: antes era solo el trazo sobre el
                         azul oscuro de la barra y apenas se distinguía.  */}
                    <button
                        className='h-6 w-6 shrink-0 flex items-center justify-center rounded-md border border-[#0a3a66] bg-[#0a3a66]/40 text-[#aecbf0] hover:border-[#9a2533] hover:bg-[#7a1f2b] hover:text-white transition-colors'
                        onClick={() => (onCerrar ?? window.electronAPI?.closeTabletWindow)?.()}
                        title='Cerrar'
                    >
                        <svg className='h-3.5 w-3.5' viewBox='0 0 24 24' fill='none' stroke='currentColor'
                             strokeWidth='3' strokeLinecap='round' aria-hidden='true'>
                            <line x1='6' y1='6' x2='18' y2='18' />
                            <line x1='18' y1='6' x2='6' y2='18' />
                        </svg>
                    </button>
                </div>

            </div>


            {/*  IMAGEN DE LA TABLET
                 'overflow-auto' es lo que permite moverse por la imagen cuando el
                 zoom la hace más grande que la ventana. Sin eso, al ampliar solo
                 se vería el centro y el resto quedaría cortado sin poder alcanzarlo.  */}
            <div
                ref={contenedorImgRef}
                onMouseDown={empezarArrastre}
                //  'items-start' y no 'items-center': un hijo centrado dentro de un
                //  contenedor con desplazamiento pierde la parte de arriba, y esa
                //  franja queda inalcanzable. El centrado se hace con 'margin:auto'
                //  en la imagen, que sí respeta el desplazamiento.
                className={`w-full flex-1 min-h-0 overflow-auto flex items-start justify-start border-b border-[#0a3a66] bg-black/20 ${arrastrando ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
            >

                {
                    imgUrl ?
                        <img
                            //  El zoom se aplica SOLO al ancho; el alto va libre para que
                            //  la imagen no se deforme. Al 100 % ocupa todo el ancho del
                            //  recuadro —sin bandas negras a los lados— y lo que sobre por
                            //  arriba o abajo se recorre con el ratón.
                            //
                            //  'flex: none' evita que flex la encoja y anule el zoom.
                            //  'maxWidth: none' quita el tope que Tailwind pone por defecto.
                            style={{ width: `${zoom}%`, height: 'auto', flex: 'none', maxWidth: 'none', margin: 'auto' }}
                            src={imgUrl}
                            alt='pantalla tablet'
                            draggable={false}
                        />
                        :
                        <p className='text-[12px] text-[#33486a] px-4 text-center'>Conecta la tablet para ver su pantalla</p>
                }
            </div>


            {/*  ESTADO DE LA LECTURA POR IA
                 Esta ventana no tiene consola a la vista, así que el resultado de la
                 última lectura se muestra aquí: si no, un fallo pasaría inadvertido.  */}
            {
                connected && (consultando || ultimoError || ticketsLeidos !== null) && (
                    <div className={`px-3 py-1 text-[10px] font-mono truncate border-t border-[#0a3a66] ${ultimoError ? 'text-[#f08a6a] bg-[#2a0f08]' : 'text-[#5e7ba0] bg-[#021a38]'}`}
                         title={ultimoError ?? ''}>
                        {
                            consultando
                                ? `Leyendo cuadrante ${cuadranteRef.current || TOTAL_CUADRANTES} de ${TOTAL_CUADRANTES}… (puede tardar un minuto)`
                                : ultimoError
                                    ? `IA: ${ultimoError}`
                                    : ticketsLeidos === 0 && respuestaCruda
                                        ? `[${tamanoImagen}] contestó: ${respuestaCruda}`
                                        : `[${tamanoImagen}] +${ticketsLeidos} · total ${responseRerenceState.length} mesas · ${inferenceTime}s`
                        }
                    </div>
                )
            }


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