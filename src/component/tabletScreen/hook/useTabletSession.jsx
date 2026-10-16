import { useState, useCallback, useEffect } from 'react';
import { SHIFTS } from '../../../libs/tickets/tableRecords.js';

import { useEstablishment } from './useEstablishment.jsx';
import { useTablet } from './useTablet.jsx';
import { useAiServer } from './useAiServer.jsx';
import { useTicketReading } from './useTicketReading.jsx';
import { useProcessTracking } from './useProcessTracking.jsx';
import { useRegisterStore } from './useRegisterStore.jsx';
import { useSavedRotations } from './useSavedRotations.jsx';
import { useSimulatorFeedback } from './useSimulatorFeedback.jsx';
import { useSendCapture } from './useSendCapture.jsx';
import { useZoom } from './useZoom.jsx';
import { useImageDrag } from './useImageDrag.jsx';

import { limiteDeAtencion, limiteDeLimpieza } from '../../../libs/limites/limitesDelLocal.js';


/*  ══════════════════════════════════════════════════════════════════════════════════════
 *  LA SESIÓN DE LA TABLET — toda la lógica, en un solo hook
 *
 *  Junta los hooks de esta carpeta y dice en qué orden pasan las cosas. No pinta nada: devuelve lo
 *  que hace falta para pintar. Lo usan los dos sitios donde puede vivir la tablet:
 *
 *      register.controller.jsx   la ventana flotante, la que abre «Sacar tablet»
 *      tablet.provider.jsx       la ventana principal: el espejo en la barra de la izquierda y los
 *                                registers en el centro de Home
 *
 *  Los dos montan la misma sesión y pintan las mismas piezas; solo cambia DÓNDE va cada una.
 *
 *
 *  LA LECTURA DE TICKETS, PASO A PASO, Y DÓNDE VIVE CADA PASO
 *
 *      STEP 0  checkAiServer        ¿está activo el servidor de IA? ¿qué modelo tiene?      → useAiServer
 *      STEP 1  getTabletImage       el espejo: una captura de la tablet cada medio segundo  → useTablet
 *      STEP 2  toDataUrl            ┐
 *      STEP 3  requestInference     ├─ una vuelta del bucle: la captura ENTERA, al modelo    → useTicketReading
 *      STEP 4  parseModelResponse   ┘
 *      STEP 5  updateScreenTickets  los tickets de esa lectura son los de la pantalla       → useTicketReading
 *      STEP 6  updateProcessGrid    el seguimiento de cada pedido                           → useProcessTracking
 *      STEP 7  applyTabletOrders    cada pedido, a su mesa del registro                     → useRegisterStore
 *
 *  El espejo y el registro son la MISMA sesión a propósito: los tickets que lee la IA bajan al
 *  registro como estado de React. No cruzan de ventana, no pasan por el puente de Electron, no se
 *  serializan. Un eslabón menos que se pueda romper — y funciona igual dentro de un navegador.
 *  ══════════════════════════════════════════════════════════════════════════════════════ */



/*  @param {function} onReportDelay      opcional. Qué hacer cuando se pide reportar una demora. Si no
 *                                       viene, se le pide a la ventana principal por el puente de Electron.
 *  @param {string}   establishmentName  opcional. Si no viene, se usa el del local en curso.
 *  @param {string}   attentionLimit     opcional. Si no viene, se deduce del nombre del local.
 *
 *  Devuelve:
 *      name, attention, cleaning                     el nombre del local y sus dos límites de tiempo
 *      tablet, ai, reading, tracking, store,         lo que devuelve cada hook, tal cual
 *      savedRotations, zoom, drag, capture
 *      shift, shiftLocked, toggleShift               el turno con que nacen las rotaciones, si la hora deja
 *                                                    cambiarlo, y cambiarlo
 *      disconnectTablet, clearRegister,              lo que pasa cuando se pulsa algo (ver abajo)
 *      reportDelay
 */


// SHIFT_KEY = «dónde se guarda el turno en el equipo»
const SHIFT_KEY = 'register:shift';

// savedShift = «el turno guardado», o 'day' si no hay ninguno (o el almacenamiento está bloqueado)
function savedShift() {
    try {
        const saved = localStorage.getItem(SHIFT_KEY);
        return SHIFTS.includes(saved) ? saved : 'day';
    }
    catch {
        return 'day';
    }
}

// shiftByClock = «el turno que impone la hora del equipo»: 'day' de 08:00:00 a 17:30:00, 'night' de 18:30:00
// a 07:00:00 del día siguiente, y null en los dos cambios de turno —entre 07:00 y 08:00 y entre 17:30 y
// 18:30—, que es cuando se elige con el toggle.
function shiftByClock(now = new Date()) {
    const seconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    if (seconds >= 8 * 3600 && seconds <= 17.5 * 3600) return 'day';
    if (seconds >= 18.5 * 3600 || seconds <= 7 * 3600) return 'night';
    return null;
}


function useTabletSession({ onReportDelay, establishmentName, attentionLimit } = {}) {


    //  ── 1 · EL LOCAL ──────────────────────────────────────────────────────────────────
    //  Va arriba del todo porque de él cuelgan los límites de tiempo y la carta de platos.

    const establishment = useEstablishment();

    // name = «el nombre del local». Manda lo que pase quien nos monte; si no pasa nada, el del local en curso.
    const name = establishmentName ?? establishment?.name ?? '';

    //  Los límites de ESTOS registers salen del nombre del local. Los formularios de novedades
    //  conservan su propia regla, escrita dentro de cada uno; unificarlas con limitesDelLocal.js está
    //  pendiente de aprobación.
    const attention = attentionLimit ?? limiteDeAtencion(name);
    const cleaning = limiteDeLimpieza(name);


    //  ── 2 · LA TABLET Y LA LECTURA ────────────────────────────────────────────────────

    const tablet = useTablet();                          //  conectar, simular, desconectar y el espejo
    const ai = useAiServer();                            //  el servidor de IA: si está activo y con qué modelo
    const reading = useTicketReading({ tablet, ai });    //  el bucle que lee la pantalla


    //  ── 3 · EL REGISTRO DE LAS MESAS ──────────────────────────────────────────────────

    // shift = «el turno con que nacen las rotaciones»: 'day' o 'night'. Cada rotación toma el de ese momento al
    // nacer y se queda con él (stampShift). shiftLocked = «la hora no deja cambiarlo»: el toggle va desactivado.
    // Empiezan así solo hasta que el efecto de abajo lea lo guardado y mire la hora, al abrir la app.
    const [shift, setShift] = useState('day');
    const [shiftLocked, setShiftLocked] = useState(true);

    // applyShift = «poner el turno»: el que impone la hora (shiftByClock) o, en los cambios de turno, el que se
    // pide. Lo deja guardado en el equipo.
    const applyShift = useCallback((wanted) => {
        const forced = shiftByClock();
        const next = forced ?? wanted;

        setShift(next);
        setShiftLocked(forced !== null);
        try { localStorage.setItem(SHIFT_KEY, next); } catch { /* sin almacenamiento, solo dura la sesión */ }
    }, []);

    //  Al abrir la app lee el turno guardado en el equipo (savedShift) y lo pone, si la hora lo deja: así se
    //  conserva al cerrar y volver a abrir. Luego vuelve a mirar cada minuto: con la ventana abierta de 17:00 a
    //  19:00, sin hacerlo el turno se quedaría en diurno —y el toggle bloqueado— pasadas las 18:30.
    //  applyShift es estable, así que este efecto corre una sola vez.
    useEffect(() => {
        applyShift(savedShift());
        const timer = setInterval(() => applyShift(savedShift()), 60_000);
        return () => clearInterval(timer);
    }, [applyShift]);

    // toggleShift = «mover el toggle»: pide el otro turno, y applyShift decide si la hora lo deja
    const toggleShift = useCallback(() => applyShift(shift === 'night' ? 'day' : 'night'), [applyShift, shift]);

    // clears = «cuántas veces se ha limpiado el registro». Entra en el 'resetKey' del seguimiento:
    // cuando cambia, se lleva por delante lo que esté siguiendo ahora.
    const [clears, setClears] = useState(0);

    //  Por aquí entra en el registro TODO lo que lee la IA. Saca el tipo de plato de la carta del local.
    //
    //  Empieza de cero al cambiar de local, al limpiar el registro y al pasar de la tablet de verdad a
    //  la simulada o al revés: lo que se siguió en una no puede seguir contando en la otra. Sin eso,
    //  al desconectar el simulador sus pedidos seguían en el seguimiento y entraban en el registro real.
    const tracking = useProcessTracking({
        tickets: reading.tickets,
        tabletTime: reading.tabletTime,
        resetKey: `${establishment?._id ?? ''}:${clears}:${tablet.simulated}`,
        dishes: establishment?.dishes,
        fromReading: reading.fromReading,
    });

    //  Las mesas con sus procesos: lo que lee la IA, lo anotado a mano y lo guardado en el equipo.
    const store = useRegisterStore({
        establishmentId: establishment?._id,
        orders: tracking.orders,
        simulating: tablet.simulated,
        shift,
    });

    //  Las rotaciones ya guardadas en la API (la pestaña «Registros») y la pregunta por los tickets que la IA
    //  lee otra vez después de guardarlos. Van aquí, en la sesión, y no en la pestaña: la IA lee se vea lo
    //  que se vea en Home, y la pregunta tiene que estar siempre (ver useSavedRotations).
    const savedRotations = useSavedRotations({ establishmentName: name, attention, cleaning, store });

    useSimulatorFeedback({
        simulating: tablet.simulated,
        orders: tracking.orders,
        diagnosis: reading.diagnosis,
        censusing: tracking.censusing,
        alreadyThere: tracking.alreadyThere,
    });


    //  ── 4 · EL ESPEJO Y EL ENVÍO ──────────────────────────────────────────────────────

    const zoom = useZoom();                              //  el zoom de la imagen
    const drag = useImageDrag(zoom.value);               //  arrastrar la imagen cuando se sale de la vista
    const capture = useSendCapture({ simulated: tablet.simulated, captureRef: tablet.captureRef });   //  mandarla a Jarvis



    //  ── LO QUE PASA CUANDO… ───────────────────────────────────────────────────────────


    // disconnectTablet = «…se desconecta la tablet»
    const disconnectTablet = async () => {

        //  La vuelta en vuelo se aborta ANTES de cerrar: su respuesta ya no tiene dónde caer, y
        //  cancelarla es además la única forma de que el servidor deje de calcularla.
        ai.cancelRequest();

        await tablet.disconnect();

        //  SE BORRA LO LEÍDO EN ESTA SESIÓN: la siguiente empieza sin tickets.
        reading.clearSession();

        //  Y lo de la ventana principal, si la hay.
        window.electronAPI?.enviarTickets?.([]);
    };


    // clearRegister = «…se vacía el registro»
    // Se pregunta antes: esto borra trabajo de alguien y no hay forma de deshacerlo.
    // Limpia las dos cosas, que si no reaparecería por algún lado: las mesas, con lo guardado en el
    // equipo (store.clear), y lo que el seguimiento tiene ahora mismo (una limpieza más).
    const clearRegister = () => {
        if (!window.confirm('Se va a borrar todo el registro —las rotaciones y sus procesos—, incluido lo escrito a mano. No se puede deshacer.\n\n¿Seguir?')) return;

        store.clear();
        setClears(count => count + 1);
    };


    /*  reportDelay = «…se pide reportar la demora de una mesa»
     *
     *  Devuelve lo que la fila tiene que saber: true si el reporte salió, false si no hay por dónde
     *  mandarlo, o un texto con el motivo si no se quiso mandar.
     *
     *  Va con useCallback porque se le pasa a cada mesa del register, que solo se repinta cuando cambia
     *  alguna de sus props (ver 'memo' en RegisterRecordRow.jsx).
     */
    const reportDelay = useCallback((data) => {

        //  De una simulación no se reporta nada: quien simula está probando, y el reporte abriría en
        //  Jarvis un formulario de verdad, con una mesa y unas horas de prueba, a un clic de enviarse.
        //  Se devuelve el motivo como texto y la fila lo enseña.
        if (tablet.simulated) return 'Es una simulación: no se reporta';

        //  Quien nos monta sabe resolverlo: en la ventana principal, el formulario está ahí mismo.
        if (onReportDelay) return onReportDelay(data);

        //  En la ventana flotante se le pide a la principal, que es la que tiene la sesión y el
        //  catálogo para abrir el formulario. Si la carcasa instalada todavía no expone
        //  'reportarDemora', se devuelve false para que la fila lo diga en vez de quedarse callada.
        if (!window.electronAPI?.reportarDemora) return false;

        window.electronAPI.reportarDemora(data);
        return true;
    }, [tablet.simulated, onReportDelay]);



    return {
        name, attention, cleaning, establishment,
        tablet, ai, reading, tracking, store, savedRotations,
        zoom, drag, capture,
        shift, shiftLocked, toggleShift,
        disconnectTablet, clearRegister, reportDelay,
    };
}



export { useTabletSession };
