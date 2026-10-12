import { useState, useRef, useEffect } from 'react';
import { registroDeInferencia } from '../../../libs/tickets/registroDeInferencia.js';
import { getTimeoutMs } from '../../../libs/inference/aiServer.js';
import { runInferenceOnce, startInferenceLoop } from '../../../libs/inference/inferenceLoop.js';
import { updateScreenTickets } from '../../../libs/inference/screenTickets.js';


/*  LA LECTURA DE TICKETS: EL BUCLE DE INFERENCIA
 *
 *  En cada vuelta se le manda al modelo la ÚLTIMA captura de la pantalla, ENTERA.
 *
 *      STEP 2  toDataUrl             ┐
 *      STEP 3  requestInference      ├─ runInferenceOnce: UNA vuelta del bucle
 *      STEP 4  parseModelResponse    ┘
 *      STEP 5  updateScreenTickets   los tickets de esa lectura pasan a ser los de la pantalla
 *
 *  Lo que sale de aquí —tickets, tabletTime, fromReading y diagnosis— es lo que recibe el STEP 6
 *  (useProcessTracking), que sigue cada pedido; de ahí cada uno va a su mesa del registro.
 */



// MODE_IA_KEY = «la llave donde se recuerda si la lectura está activada»
const MODE_IA_KEY = 'tablet:modo-ia';

// AI_TIMEOUT_MS = «tiempo máximo que se espera al modelo por cada lectura, en milisegundos»
// Del '.env' solo queda esto: VITE_AI_TIMEOUT_S, cuántos segundos se le espera por lectura (opcional).
const AI_TIMEOUT_MS = getTimeoutMs(import.meta.env.VITE_AI_TIMEOUT_S);

// PAUSE_BETWEEN_ROUNDS_MS = «pausa entre dos vueltas buenas, en milisegundos». Es el ritmo del espejo: así cada
// vuelta ve una captura nueva. Con un servidor que tarda 45 s por lectura no se nota; con uno rápido evita 5 lecturas por segundo.
const PAUSE_BETWEEN_ROUNDS_MS = 500;

// MAX_CAPTURE_AGE_MS = «la edad máxima de una captura ya leída para volver a leerla, en milisegundos»
const MAX_CAPTURE_AGE_MS = 15000;

// SILENT_TABLET_ERROR = «el aviso de que la tablet dejó de mandar capturas»
const SILENT_TABLET_ERROR = 'la tablet no manda capturas desde hace más de 15 s: desconéctala y vuelve a conectarla';

// CAUSES_TO_CHECK_AGAIN = «las causas de fallo que obligan a volver a consultar el servidor»
// Con las tres primeras puede que el servidor ya no esté, o que le hayan cambiado el modelo.
// Con 'auth' y 'no-url' se vuelve a consultar por lo contrario: para PARAR el bucle. Seguir mandando
// capturas con una clave que no vale solo gasta el servidor, y la consulta deja el aviso en la barra.
const CAUSES_TO_CHECK_AGAIN = ['network', 'cors', 'model-rejected', 'auth', 'no-url'];



// readSavedModeIA = «leer si la lectura quedó activada»
// Sin nada guardado, activada: es como funcionaba antes de existir el botón.
function readSavedModeIA() {
    try { return localStorage.getItem(MODE_IA_KEY) !== '0'; }
    catch { return true; }
}



// buildDiagnosis = «armar el diagnóstico»
// PURA. Cómo fue una vuelta: se pinta en la barra del registro (ReadingStatus) y, simulando, viaja al simulador.
// Recibe: result (el resultado de runInferenceOnce).
// Devuelve: { modelo, leidos, descartados, segundos, error }
// 'leidos' son los objetos que devolvió el modelo; 'descartados', los que no llegaron a ser un ticket.
function buildDiagnosis(result) {
    return {
        modelo: result.model,
        leidos: result.tickets.length + result.discarded.length,
        descartados: result.discarded.length,
        segundos: result.seconds,
        error: result.error,
    };
}



// buildSilentTabletResult = «armar el resultado de una tablet que no contesta»
// PURA. La vuelta que NO se da porque la tablet dejó de mandar capturas. Con las claves de runInferenceOnce.
// Recibe: capture (la última captura que llegó) y model (el modelo).
// Devuelve: { ok: false, time, model, seconds, tickets, discarded, error, cause: 'silent-tablet' }
function buildSilentTabletResult(capture, model) {
    return {
        ok: false,
        time: capture.time,
        model: model,
        seconds: 0,
        tickets: [],
        discarded: [],
        error: SILENT_TABLET_ERROR,
        cause: 'silent-tablet',
    };
}



// useTicketReading = «la lectura de tickets»
// Recibe: { tablet   lo que devuelve useTablet (usa connected, hasCapture, captureRef y captureAtRef)
//           ai }     lo que devuelve useAiServer (usa server, serverRef, settingsRef, requestRef, markInactive y clearRejections)
// Devuelve:
//   modeIA, toggleModeIA   la lectura está activada · activarla o pausarla
//   readingTime            la hora de la captura que se mandó al modelo en la última vuelta (null: ninguna)
//   lastError              qué falló en la última vuelta, si falló
//   tickets                todos los tickets de la pantalla, los de la última lectura
//   tabletTime             la hora que marcaba la tablet en la última lectura ('HH:MM:SS')
//   fromReading            'tickets' sale de una lectura. false = no hubo lectura (el arranque, o una desconexión)
//   diagnosis              cómo fue la última vuelta (ver buildDiagnosis). null = todavía ninguna
//   clearSession           borra lo leído en esta sesión (al desconectar)
function useTicketReading({ tablet, ai }) {

    //  MODO IA. Es una de las cuatro condiciones del bucle: en pausa, el bucle se para. Con la IA en
    //  pausa el espejo sigue vivo y se puede enviar la captura; lo único que deja de hacerse es mandar
    //  capturas al modelo. Se recuerda por máquina, como el zoom.
    const [modeIA, setModeIA] = useState(readSavedModeIA);

    useEffect(() => {
        try { localStorage.setItem(MODE_IA_KEY, modeIA ? '1' : '0'); }
        catch { /* es una comodidad: sin almacenamiento, vale para esta sesión */ }
    }, [modeIA]);


    //  LO QUE SE PINTA DE LA LECTURA, en la barra de arriba
    const [lastError, setLastError] = useState(null);           // qué falló en la última vuelta, si falló
    const [readingTime, setReadingTime] = useState(null);       // la hora de la captura que se mandó al modelo


    //  LO QUE ENTREGA LA LECTURA, hacia el seguimiento de los pedidos

    //  Todos los tickets de la pantalla. De la lectura solo salen los PROCESOS de cada mesa (toma de
    //  orden y listo en tablet); lo demás de la mesa se anota a mano.
    const [tickets, setTickets] = useState([]);

    //  La hora que marcaba la tablet en la última lectura. Con ella se calcula cuánto lleva vivo cada
    //  pedido — tiene que ser SU reloj, no el del equipo.
    const [tabletTime, setTabletTime] = useState('');

    //  Si la lista de 'tickets' sale de una lectura. false = no hubo lectura (el arranque, o una
    //  desconexión): ahí el seguimiento no cuenta nada, ni da por desaparecido a nadie.
    const [fromReading, setFromReading] = useState(false);

    //  Cómo fue la última vuelta: cuántos objetos trajo, cuántos se descartaron por no ser tickets
    //  y si falló.
    const [diagnosis, setDiagnosis] = useState(null);


    // screenTicketsRef = «los tickets de la última lectura, por su clave» (Map clave → ticket).
    // La lectura siguiente los mira para que una mesa mal leída no pise a una buena (updateScreenTickets).
    const screenTicketsRef = useRef(new Map());

    // lastReadCaptureRef = «la última captura que leyó el bucle», para saber si la que hay ya se leyó.
    const lastReadCaptureRef = useRef(null);



    // isTabletSilent = «¿la tablet dejó de mandar capturas?»
    // Cable suelto, simulador cerrado…: el espejo ya no trae capturas nuevas, y la que hay ya se leyó y es vieja.
    // Recibe: capture (la última captura del espejo). Devuelve: true / false.
    const isTabletSilent = (capture) => {

        // captureAge = «la edad de la captura, en milisegundos»
        const captureAge = Date.now() - tablet.captureAtRef.current;

        return capture === lastReadCaptureRef.current && captureAge > MAX_CAPTURE_AGE_MS;
    };



    // reportSilentTablet = «avisar de que la tablet no manda capturas»
    // La vuelta NO se da, pero el fallo sube: a la barra de arriba y al diagnóstico (los tickets no se tocan).
    // Recibe: capture (la última captura) y model (el del servidor activo, leído por quien llama: aquí no se
    //         vuelve a mirar la ref, que puede haberse puesto a null entre medias si cambiaron los ajustes).
    // Devuelve: el resultado de la vuelta fallida ({ ok: false, … }), para el bucle.
    const reportSilentTablet = (capture, model) => {

        // silentResult = «el resultado de la vuelta que no se dio»
        const silentResult = buildSilentTabletResult(capture, model);

        setLastError(silentResult.error);
        setDiagnosis(buildDiagnosis(silentResult));

        return silentResult;
    };



    // readScreen = «leer la pantalla»
    // UNA VUELTA DEL BUCLE: manda la última captura al modelo y entrega sus tickets.
    // Devuelve: el resultado de runInferenceOnce ({ ok, … }). Con ok: false el bucle espera unos segundos antes de seguir.
    const readScreen = async () => {

        //  De la ÚLTIMA captura del espejo. No se le pide otra al ADB: dos 'screencap' a la vez lo atascan.
        // capture = «la captura que se va a leer»
        const capture = tablet.captureRef.current;
        if (!capture) return { ok: false };

        // server = «el servidor de IA, tal como contestó la última consulta»
        // Se lee UNA vez y se comprueba: al guardar ajustes en la otra ventana, la ref se pone a null
        // hasta que el servidor nuevo conteste, y una vuelta que arrancara justo entonces leería
        // '.model' de null y reventaría. Sin servidor activo no hay vuelta que dar.
        const server = ai.serverRef.current;
        if (!server?.active) return { ok: false };

        //  Releer sin fin la misma foto gastaría el servidor de IA en el pasado: la vuelta es fallida, y el fallo sube.
        if (isTabletSilent(capture)) return reportSilentTablet(capture, server.model);

        lastReadCaptureRef.current = capture;

        // controller = «el cancelador de esta vuelta»: desconectar, pausar la IA o cambiar los ajustes la abortan
        const controller = new AbortController();
        ai.requestRef.current = controller;

        setReadingTime(capture.time ?? '');

        // note = «apuntar en el registro de la inferencia»: todos los apuntes de esta vuelta van juntos
        const note = registroDeInferencia.abrirLectura();

        // settings = «la dirección y la clave», como estén guardadas en este momento. Se leen en CADA
        // vuelta y no una sola vez: cambiarlas en Opciones tiene que notarse en la vuelta siguiente.
        const settings = ai.settingsRef.current;

        //  STEP 2 · toDataUrl, STEP 3 · requestInference y STEP 4 · parseModelResponse
        //  La clave entra en 'server' y de ahí a la cabecera Authorization. El bucle NO la apunta en el
        //  registro: sus apuntes escriben el servidor campo a campo, nunca el objeto entero.
        // result = «el resultado de la vuelta»: { ok, time, model, seconds, tickets, discarded, error, cause }
        const result = await runInferenceOnce({
            capture: capture,
            server: { baseUrl: settings.url, apiKey: settings.apiKey, model: server.model, reasoningOff: server.reasoningOff },
            timeoutMs: AI_TIMEOUT_MS,
            signal: controller.signal,
            note: note,
        });

        //  Vuelta cancelada: no es un fallo y no se entrega nada.
        if (result.cause === 'cancelled' || controller.signal.aborted) return result;

        ai.requestRef.current = null;

        // roundDiagnosis = «cómo fue esta vuelta»: { modelo, leidos, descartados, segundos, error }
        const roundDiagnosis = buildDiagnosis(result);

        //  VUELTA FALLIDA: los tickets NO se tocan, pero el fallo sí sube. Callarlo hacía imposible
        //  distinguir «no hay novedades» de «lleva diez minutos sin entender una respuesta». Tampoco se
        //  toca la hora: al cambiar sola volvía a disparar el seguimiento sobre la lista vieja como si
        //  fuera una lectura nueva.
        if (!result.ok) {
            setLastError(result.error);
            setDiagnosis(roundDiagnosis);

            if (CAUSES_TO_CHECK_AGAIN.includes(result.cause)) ai.markInactive(result);

            return result;
        }

        setLastError(null);
        ai.clearRejections();

        //  STEP 5 · los tickets de esta lectura pasan a ser los de la pantalla
        // screen = «la pantalla, ya leída»: { byKey: Map nuevo, all: todos sus tickets }
        const screen = updateScreenTickets(screenTicketsRef.current, result.tickets);
        screenTicketsRef.current = screen.byKey;

        //  HACIA EL STEP 6. Aquí solo se ENTREGA: quien analiza, compara y sigue cada pedido es
        //  useProcessTracking, con updateProcessGrid (libs/inference/processGrid.js).
        //  Se entrega SIEMPRE la lista, aunque venga vacía: si un pedido terminó, quien lo mire tiene
        //  que enterarse. La hora es la de la FOTO (result.time), no la de cuando contestó el modelo.
        //  Todo junto: React lo aplica en el mismo pintado, así que el seguimiento recibe la lista y su
        //  hora de una sola vez.
        setDiagnosis(roundDiagnosis);
        setTickets(screen.all);
        setFromReading(true);
        if (result.time) setTabletTime(result.time);

        //  Y a la ventana principal, si hay carcasa de escritorio (en un navegador electronAPI no existe).
        window.electronAPI?.enviarTickets?.(screen.all);

        return result;
    };



    //  EL BUCLE (recursivo: cada vuelta empieza cuando ha contestado la anterior).
    //  Arranca cuando hay tablet conectada, con su primera captura, servidor de IA activo y modo IA
    //  encendido, y se para en cuanto falta cualquiera de los cuatro. El ritmo lo pone el servidor,
    //  no un reloj.

    // serverIsActive = «el servidor de IA está activo»
    const serverIsActive = ai.server?.active === true;

    useEffect(() => {
        if (!tablet.connected || !tablet.hasCapture || !serverIsActive || !modeIA) return;

        // loop = «el bucle»: { stop, getRounds }
        const loop = startInferenceLoop({ runOnce: readScreen, pauseBetweenRoundsMs: PAUSE_BETWEEN_ROUNDS_MS });

        return () => {
            loop.stop();

            //  La vuelta en vuelo se aborta: nunca puede haber dos a la vez si el bucle vuelve a arrancar.
            ai.cancelRequest();
        };
    }, [tablet.connected, tablet.hasCapture, serverIsActive, modeIA]);



    // clearSession = «borrar lo leído en esta sesión»
    // Sin esto, al volver a conectar el register enseñaba los tickets de la vez anterior hasta la
    // primera lectura nueva.
    const clearSession = () => {
        screenTicketsRef.current = new Map();
        lastReadCaptureRef.current = null;

        setReadingTime(null);
        setLastError(null);

        //  La lista se vacía, pero al seguimiento se le dice que NO hubo lectura (fromReading false). Una
        //  lista vacía a secas es lo que manda una pantalla sin tickets, y el seguimiento daría todos los
        //  pedidos abiertos por desaparecidos, sellándoles un «Listo en tablet» con la hora en que
        //  alguien soltó el cable.
        setTickets([]);
        setFromReading(false);
        setDiagnosis(null);
    };



    return {
        modeIA,
        toggleModeIA: () => setModeIA(active => !active),

        readingTime,
        lastError,

        tickets,
        tabletTime,
        fromReading,
        diagnosis,

        clearSession,
    };
}



export { useTicketReading };
