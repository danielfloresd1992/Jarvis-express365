import { useState, useRef, useEffect } from 'react';
import { registroDeInferencia, TIPO } from '../../../libs/tickets/registroDeInferencia.js';
import { checkAiServer } from '../../../libs/inference/aiServer.js';
import { readAiSettings, subscribeToAiSettings, maskApiKey } from '../../../libs/inference/aiSettings.js';


/*  EL SERVIDOR DE IA
 *
 *  STEP 0 de la lectura: al abrir la ventana se le pregunta si está activo y qué modelo tiene, y la
 *  respuesta se guarda. YA NO se le pregunta en cada lectura.
 *
 *  Su DIRECCIÓN y su CLAVE no están en el '.env': las escribe el usuario en «Opciones → Servidor
 *  de IA», en la ventana principal, y se guardan en este equipo (libs/inference/aiSettings.js). El
 *  '.env' se horneaba al construir, así que en la aplicación instalada del restaurante nadie podía
 *  cambiar de servidor sin volver a compilar; desde el menú, sí.
 *
 *  Y el MODELO no va en ningún sitio: se le pregunta al servidor.
 */



// CHECK_RETRY_MS = «cada cuánto se vuelve a consultar un servidor que no está activo, en milisegundos»
const CHECK_RETRY_MS = 10000;

// CHECK_AGAIN_DELAY_MS = «cuánto se espera antes de volver a consultarlo tras una lectura fallida»
const CHECK_AGAIN_DELAY_MS = 5000;

// MAX_CHECK_AGAIN_DELAY_MS = «lo máximo que se espera antes de volver a consultarlo»
const MAX_CHECK_AGAIN_DELAY_MS = 60000;

// CAUSES_WITHOUT_RETRY = «las causas por las que NO se vuelve a preguntar cada 10 segundos»
// Un servidor apagado puede encenderse solo; una clave rechazada o una dirección que falta, no: eso
// se arregla en «Opciones → Servidor de IA». Insistir cada 10 s no lo arreglaría y llenaría el
// registro del mismo fallo. Se queda quieto y lo dice en la barra hasta que cambien los ajustes.
// 'https-not-supported' va aquí por lo mismo que 'no-url': hasta que alguien cambie la dirección en
// Opciones, volver a preguntar cada 10 s solo repite la misma sonda contra el mismo servidor.
const CAUSES_WITHOUT_RETRY = ['auth', 'no-url', 'https-not-supported'];

// NO_ANSWER_CAUSES = «las causas en las que NADIE contestó»
// Solo esas son «sin conexión». Un 404 o un 401 son el servidor CONTESTANDO, y llamarlos «sin
// conexión» mandaba a revisar el cable y el certificado cuando lo que fallaba era el modelo montado
// o la clave: tres averías distintas en pantalla donde había una.
const NO_ANSWER_CAUSES = ['network', 'cors', 'timeout'];



// describeAiFailure = «describir el fallo de la IA»
// PURA. Cómo se nombra un servidor que no está activo, igual en la barra que en el registro.
// Con la clave rechazada o sin dirección NO falta la conexión —contestar, contesta—: falta algo que
// solo se arregla en «Opciones → Servidor de IA», y el aviso que trae aiServer.js ya lo dice entero.
// Recibe: server (lo que contestó checkAiServer, con active: false).
// Devuelve: 'IA sin conexión: servidor apagado…'  o  'IA: clave rechazada (401)…'
function describeAiFailure(server) {

    if (NO_ANSWER_CAUSES.includes(server?.cause)) return `IA sin conexión: ${server?.error}`;

    return `IA: ${server?.error}`;
}



// describeAiServer = «describir el estado del servidor de IA»
// PURA. Lo que dice la barra de título: con qué modelo se lee, o por qué no se está leyendo.
// Recibe: server (lo que contestó checkAiServer; null = todavía no ha contestado).
function describeAiServer(server) {

    if (server?.active === true) return `IA: ${server.model}`;
    if (server?.active === false) return describeAiFailure(server);

    return 'IA: consultando el servidor…';
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
// PURA. Un modelo rechazado una y otra vez no puede costar una captura subida cada 5 s: la espera crece.
// Recibe: rejectionsInARow (cuántas veces seguidas ha rechazado el servidor el modelo).
// Devuelve: 5 s hasta el primer rechazo; desde el segundo, 5 s más por cada uno (10, 15, 20…), hasta un minuto.
function getCheckAgainDelayMs(rejectionsInARow) {
    if (rejectionsInARow <= 1) return CHECK_AGAIN_DELAY_MS;

    return Math.min(MAX_CHECK_AGAIN_DELAY_MS, CHECK_AGAIN_DELAY_MS * rejectionsInARow);
}



// useAiServer = «el servidor de IA»
// Devuelve:
//   server           lo que contestó checkAiServer, para pintarlo. null = todavía no ha contestado
//   serverRef        lo mismo, en una ref, para que el bucle de lectura lea siempre el último
//   settingsRef      la dirección, la clave y el modelo elegido, como están guardados ahora
//   requestRef       el cancelador de la solicitud en vuelo (lo pone el bucle de lectura en cada vuelta)
//   cancelRequest    aborta esa solicitud
//   markInactive     da el servidor por no activo tras una lectura fallida, y vuelve al STEP 0
//   clearRejections  una lectura buena: lo que hubiera rechazado el modelo hasta ahora ya no cuenta
function useAiServer() {

    // server = «el servidor de IA»: lo que contestó checkAiServer (STEP 0). null = todavía no ha contestado.
    // Va en un estado para pintarlo en la barra, y en una ref para que el bucle lea siempre el último.
    const [server, setServer] = useState(null);
    const serverRef = useRef(null);

    // checkNumber = «el número de la consulta al servidor»: cuando cambia, se le vuelve a consultar
    const [checkNumber, setCheckNumber] = useState(0);

    // settingsRef = «la dirección y la clave del servidor de IA», como están guardadas en este equipo.
    // Van en una ref y no en el estado porque no se pintan —la clave menos que nada—: las leen el STEP 0
    // y cada vuelta del bucle, justo cuando las usan. Se leen una vez al abrir la ventana; a partir de
    // ahí las refresca sola la suscripción de más abajo.
    const settingsRef = useRef(null);
    if (settingsRef.current === null) settingsRef.current = readAiSettings();

    // nextCheckDelayRef = «lo que se espera antes de la consulta siguiente, en milisegundos»
    // Lo pone quien la pide: al abrir la ventana y al cambiar los ajustes, nada (se quiere ver el
    // resultado ya); tras una vuelta fallida, unos segundos, porque un fallo que se repite daría
    // vueltas sin freno. Va en una ref: cambiarlo NO tiene que volver a pintar la ventana.
    const nextCheckDelayRef = useRef(0);

    // modelRejectionsRef = «las veces seguidas que el servidor ha rechazado el modelo». Una vuelta buena la pone a cero.
    const modelRejectionsRef = useRef(0);

    // requestRef = «el cancelador de la solicitud en vuelo». Sin cancelarla, una lectura lanzada justo
    // antes de desconectar llegaba después y volvía a llenar el register recién vaciado.
    const requestRef = useRef(null);


    // cancelRequest = «abortar la solicitud en vuelo»
    const cancelRequest = () => {
        requestRef.current?.abort();
        requestRef.current = null;
    };



    //  STEP 0 · LA PRIMERA CONEXIÓN AL SERVIDOR DE IA
    //  Si no está activo, se reintenta cada 10 s hasta que lo esté, SALVO con la clave rechazada o sin
    //  dirección (CAUSES_WITHOUT_RETRY): eso no se arregla insistiendo, sino en «Opciones → Servidor
    //  de IA», así que se queda quieto hasta que cambien los ajustes.
    useEffect(() => {

        // controller = «el cancelador de la consulta», por si la ventana se cierra a mitad
        const controller = new AbortController();

        // timer = «el temporizador de la consulta siguiente»
        let timer = null;

        // askServer = «preguntar al servidor»
        const askServer = async () => {

            // settings = «la dirección, la clave y el modelo elegido», como estén guardados ahora
            const settings = settingsRef.current;

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
            const previous = serverRef.current;

            if (result.active && previous?.model !== result.model) {

                //  Que el modelo elegido ya no esté se DICE. Leer con otro sin avisar es lo que
                //  haría que nadie entendiera por qué lee distinto de lo que puso en Opciones.
                //  Un preferido ausente o ciego se apunta con el que se usa DE VERDAD, que es lo que
                //  luego va en cada lectura. (Que ninguno vea ya no llega aquí: checkAiServer lo devuelve
                //  como no activo y sale por la rama de FALLO de abajo, sin arrancar el bucle.)
                // text = «lo que se apunta en el registro»
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

            //  EL MODELO SE GUARDA: la ref para el bucle, el estado para pintarlo en la barra.
            serverRef.current = result;
            setServer(result);

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
    }, [checkNumber]);



    //  LOS AJUSTES CAMBIARON EN «OPCIONES → SERVIDOR DE IA»
    //  El menú vive en la ventana principal, que es OTRA ventana: subscribeToAiSettings se entera igual
    //  (por el evento 'storage' del navegador) y por eso no hace falta reabrir esta para cambiar de
    //  servidor o de clave. Se vuelve al STEP 0 con los ajustes nuevos, y la solicitud que estuviera
    //  en vuelo se aborta: iba con la dirección y la clave viejas.
    //
    //  Guardar SIN cambiar nada también avisa, a propósito: es el «vuelve a intentarlo ahora» del
    //  operador cuando la barra dice que la clave no vale y el bucle está quieto esperando.
    useEffect(() => {

        // stopListening = «dejar de escuchar los ajustes» (se llama al cerrar la ventana)
        const stopListening = subscribeToAiSettings((settings) => {

            settingsRef.current = settings;

            cancelRequest();

            //  EL SERVIDOR ANTERIOR DEJA DE VALER AQUÍ MISMO, antes de preguntarle al nuevo.
            //  Sin esto, entre el guardado y la respuesta del STEP 0 el bucle seguía vivo con
            //  server.active todavía en true, y mandaba una captura a la dirección NUEVA con el
            //  modelo de la VIEJA: una lectura que no podía salir bien y una foto de la tablet
            //  entregada a un servidor que aún no había contestado quién es. De paso la barra
            //  dejaba de enseñar el servidor anterior como si siguiera conectado.
            serverRef.current = null;
            setServer(null);

            //  Otro servidor: lo que hubiera rechazado el modelo hasta ahora ya no cuenta, y se le
            //  pregunta sin esperar.
            modelRejectionsRef.current = 0;
            nextCheckDelayRef.current = 0;

            setCheckNumber(number => number + 1);
        });

        return stopListening;
    }, []);



    // markInactive = «dar el servidor por no activo»
    // Puede que el servidor ya no esté, o que le hayan cambiado el modelo: se vuelve al STEP 0.
    // Hasta que conteste, el servidor no cuenta como activo y el bucle de lectura se para.
    // Recibe: result (el resultado de la vuelta fallida: { cause, error }).
    const markInactive = (result) => {

        //  Un modelo rechazado varias veces seguidas alarga la espera de la consulta siguiente (getCheckAgainDelayMs).
        if (result.cause === 'model-rejected') modelRejectionsRef.current = modelRejectionsRef.current + 1;

        //  Y esa espera se deja puesta aquí, que es donde se sabe por qué se vuelve a preguntar. Sin
        //  ella, un fallo que se repite daría vueltas sin freno.
        nextCheckDelayRef.current = getCheckAgainDelayMs(modelRejectionsRef.current);

        // inactiveServer = «el servidor, dado por no activo»
        const inactiveServer = { active: false, cause: result.cause, error: result.error, ms: 0 };

        serverRef.current = inactiveServer;
        setServer(inactiveServer);
        setCheckNumber(number => number + 1);
    };


    // clearRejections = «olvidar los rechazos del modelo»
    const clearRejections = () => {
        modelRejectionsRef.current = 0;
    };



    return { server, serverRef, settingsRef, requestRef, cancelRequest, markInactive, clearRejections };
}



export { useAiServer, describeAiServer };
