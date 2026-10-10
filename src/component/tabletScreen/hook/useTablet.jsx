import { useState, useRef, useEffect } from 'react';
import { Adb, AdbDaemonTransport } from '@yume-chan/adb';
import { AdbDaemonWebUsbDeviceManager } from '@yume-chan/adb-daemon-webusb';
import AdbWebCredentialStore from '@yume-chan/adb-credential-web';
import { getTabletImage } from '../../../libs/inference/tabletImage.js';
import { SIMULACION_DISPONIBLE } from '../../../simulador/disponible.js';
import { registroDeInferencia, TIPO } from '../../../libs/tickets/registroDeInferencia.js';


/*  LA TABLET: CONECTARLA Y ESPEJARLA
 *
 *  Todo lo que habla con el aparato vive aquí: conectar por USB, conectar con la tablet de
 *  mentira, desconectar, y el espejo (STEP 1 de la lectura: una captura cada medio segundo).
 *
 *  Lo que NO vive aquí es la lectura por IA. El espejo solo deja la última captura en
 *  'captureRef', y de ahí la toma quien la necesite: el bucle de lectura (useTicketReading), el
 *  envío a Jarvis (useSendCapture) y el botón de guardar la captura.
 */



// createFrameStore = «crear el almacén del espejo»
// LA IMAGEN DEL ESPEJO NO PASA POR EL ESTADO DEL CONTROLADOR. Cambia dos veces por segundo, y en el
// estado repintaría la ventana entera —los dos registers incluidos— en cada fotograma. Va en este
// almacén mínimo, que solo escucha el componente que la pinta (TabletMirror, con
// 'useSyncExternalStore'). Es el mismo patrón del registro de la inferencia: leer, suscribirse, avisar.
// Devuelve: { read, subscribe, show }
function createFrameStore() {

    // url = «la dirección de la captura que se está enseñando». null = no hay ninguna.
    let url = null;

    // listeners = «quién la está pintando»
    const listeners = new Set();

    return {
        read: () => url,

        subscribe: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },

        show: (nextUrl) => {
            url = nextUrl;
            for (const listener of listeners) listener();
        },
    };
}



// useTablet = «la tablet»
// Recibe: { refreshMs = 500 }  cada cuánto se pide una captura nueva: el ritmo del ESPEJO, no el de la
//         lectura por IA. Bajarlo hace el vídeo más suave, no los datos más frescos.
// Devuelve:
//   connected, connecting    está conectada · se está conectando ahora mismo
//   simulated                lo conectado es una tablet de mentira
//   failed                   el último intento de conexión falló
//   statusText               cómo está la tablet, para la barra
//   hasCapture               ya llegó la primera captura de esta sesión
//   frames                   el almacén de la imagen, para TabletMirror
//   captureRef, captureAtRef la última captura y cuándo llegó, en refs, para quien lee sin pintar
//   connectUsb, connectSimulator, disconnect, saveCapture
function useTablet({ refreshMs = 500 } = {}) {

    //  ESTADO DE CONEXIÓN
    const [connected, setConnected] = useState(false);
    const [statusText, setStatusText] = useState('Sin conectar');

    //  Un intento de conexión en curso. El estado pinta el botón girando; la ref es el cerrojo,
    //  porque dos clics en el mismo fotograma verían los dos el estado viejo y abrirían dos
    //  conexiones sobre el mismo USB.
    const [connecting, setConnecting] = useState(false);
    const connectingRef = useRef(false);

    // adbRef = «la tablet conectada», la de verdad o la simulada. null = no hay ninguna.
    const adbRef = useRef(null);


    //  EL ESPEJO

    // framesRef = «el almacén de la imagen». Se crea una vez y dura lo que la ventana.
    const framesRef = useRef(null);
    if (framesRef.current === null) framesRef.current = createFrameStore();

    // hasCapture = «ya hay una captura que leer». En el estado porque arranca y para el bucle de lectura.
    const [hasCapture, setHasCapture] = useState(false);

    // hasCaptureRef = lo mismo, para no pedirle a React un pintado por cada captura que NO lo cambia.
    const hasCaptureRef = useRef(false);

    // captureRef = «la última captura del espejo»: { png, blob, time } de getTabletImage.
    // De aquí lee el bucle de lectura y de aquí sale lo que se manda a Jarvis.
    const captureRef = useRef(null);

    // captureAtRef = «cuándo llegó la última captura» (Date.now()). Con la tablet muerta deja de avanzar.
    const captureAtRef = useRef(0);

    // mirrorTimerRef = «el temporizador de la captura siguiente»
    const mirrorTimerRef = useRef(null);

    // lastUrlRef = «la dirección de la captura anterior», para soltar su memoria al llegar la siguiente
    const lastUrlRef = useRef(null);


    // showFrame = «enseñar una captura en el espejo» (null la retira)
    const showFrame = (url) => {
        framesRef.current.show(url);

        if (hasCaptureRef.current === (url !== null)) return;

        hasCaptureRef.current = url !== null;
        setHasCapture(url !== null);
    };



    // connectUsb = «conectar con la tablet por USB»
    // Tiene que ejecutarse dentro de un clic: el navegador solo deja pedir un dispositivo USB como
    // respuesta a un gesto de quien usa la página.
    const connectUsb = async () => {
        if (connectingRef.current) return;
        connectingRef.current = true;
        setConnecting(true);

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
            connectingRef.current = false;
            setConnecting(false);
        }
    };



    // connectSimulator = «conectar con una tablet de mentira»
    // En lugar del USB se engancha al simulador de Toast. Lo que se guarda en 'adbRef' tiene la misma
    // forma que un Adb de verdad, así que de aquí para abajo NADA sabe que es una simulación: el espejo,
    // el bucle de lectura y los registers son los de siempre. El simulador solo PINTA; leer, lee la IA.
    // Se carga con import() para que no pese al abrir la ventana: solo se descarga si alguien lo pulsa.
    const connectSimulator = async () => {
        if (!SIMULACION_DISPONIBLE || connectingRef.current) return;
        connectingRef.current = true;
        setConnecting(true);

        try {
            setStatusText('Buscando el simulador de Toast…');

            const { conectarConSimulador } = await import('../../../simulador/adbSimulado.js');

            adbRef.current = await conectarConSimulador({ alAvisar: setStatusText });

            setConnected(true);
            setStatusText(`SIMULACIÓN · ${adbRef.current.nombre}`);

            registroDeInferencia.apuntar(TIPO.TABLET, `Conectada a la pantalla de Toast simulada («${adbRef.current.nombre}»)`);
        }
        catch (error) {
            console.log(error);
            setStatusText('Error: ' + error.message);

            registroDeInferencia.apuntar(TIPO.FALLO, `No se pudo conectar con el simulador: ${error.message}`);
        }
        finally {
            connectingRef.current = false;
            setConnecting(false);
        }
    };



    // disconnect = «desconectar»
    // Cierra la conexión y retira el espejo. Lo que se había LEÍDO en la sesión no es de aquí: eso lo
    // borra el controlador justo después (ver 'disconnectTablet' en register.controller.jsx).
    const disconnect = async () => {
        try {
            if (mirrorTimerRef.current) clearTimeout(mirrorTimerRef.current);

            if (adbRef.current) await adbRef.current.close();
        }
        catch (error) { console.log(error); }
        finally {
            adbRef.current = null;
            setConnected(false);
            showFrame(null);
            setStatusText('Sin conectar');

            registroDeInferencia.apuntar(TIPO.TABLET, 'Tablet desconectada: se borra lo leído en esta sesión');

            //  La sesión nueva empieza con una captura nueva.
            captureRef.current = null;
        }
    };



    // captureScreen = «capturar la pantalla»
    // STEP 1 · EL ESPEJO: una captura de la pantalla, con la hora que marcaba la tablet.
    // Solo guarda y pinta la captura. NO dispara lecturas: de eso se encarga el bucle de lectura.
    const captureScreen = async () => {
        try {
            // adb = «la tablet a la que se le pide la captura»
            const adb = adbRef.current;
            if (!adb) return;

            // capture = «la captura»: { png, blob, time }
            const capture = await getTabletImage(adb);

            //  Desconectaron mientras llegaba: es una captura de la sesión anterior (a veces a medias)
            //  y no se guarda. Guardada, el bucle la leía al volver a conectar.
            if (adbRef.current !== adb) return;

            captureRef.current = capture;
            captureAtRef.current = Date.now();

            // url = «la dirección de la captura, para pintarla»
            const url = URL.createObjectURL(capture.blob);

            if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);   // libera la imagen anterior
            lastUrlRef.current = url;

            showFrame(url);
        }
        catch (error) {
            console.log(error);
        }
    };


    //  EL CICLO DEL ESPEJO, mientras esté conectada. Se reprograma solo en vez de usar setInterval:
    //  así se espera SIEMPRE a que termine una captura antes de pedir la siguiente, y nunca hay dos
    //  'screencap' a la vez contra el mismo ADB (lo atascan). Se descuenta lo que tardó la captura,
    //  para que entre imagen e imagen pase el intervalo real.
    useEffect(() => {
        if (!connected) return;

        // alive = «este ciclo sigue en marcha»
        let alive = true;

        const cycle = async () => {
            const startedAt = Date.now();

            await captureScreen();

            //  Puede haberse desconectado mientras se esperaba la captura.
            if (!alive) return;

            const wait = Math.max(0, refreshMs - (Date.now() - startedAt));
            mirrorTimerRef.current = setTimeout(cycle, wait);
        };

        cycle();   //  la primera, sin esperar

        return () => {
            alive = false;
            clearTimeout(mirrorTimerRef.current);
        };
    }, [connected, refreshMs]);


    //  LIMPIEZA AL CERRAR LA VENTANA
    useEffect(() => {
        return () => {
            if (mirrorTimerRef.current) clearTimeout(mirrorTimerRef.current);
            if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
            if (adbRef.current) adbRef.current.close();
        };
    }, []);



    // saveCapture = «guardar la captura» — para el banco de pruebas
    // Es exactamente la imagen que recibe el modelo en marcha: la captura entera, tal cual.
    const saveCapture = () => {
        const blob = captureRef.current?.blob;
        if (!blob) return setStatusText('Todavía no hay ninguna captura');

        // stamp = «el sello de la captura»: su fecha y hora, para ordenarlas por nombre
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

        // link = «el enlace de descarga»
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${stamp}-captura.png`;
        link.click();
        URL.revokeObjectURL(link.href);

        setStatusText(`Guardada: ${stamp}-captura.png`);
    };



    return {
        connected,
        connecting,

        //  Una simulación se distingue DE UN VISTAZO en la barra, y además bloquea todo lo que SALE
        //  de esta ventana hacia Jarvis: enviar la captura, reportar una demora, guardar el registro.
        simulated: connected && Boolean(adbRef.current?.simulado),

        //  Se deduce del texto del estado: los tres caminos que fallan lo dejan empezando por 'Error'.
        failed: statusText.startsWith('Error'),

        statusText,
        hasCapture,
        frames: framesRef.current,

        captureRef,
        captureAtRef,

        connectUsb,
        connectSimulator,
        disconnect,
        saveCapture,
    };
}



export { useTablet };
