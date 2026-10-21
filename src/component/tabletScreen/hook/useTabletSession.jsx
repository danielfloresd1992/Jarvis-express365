import { useState, useCallback, useEffect, useContext, useMemo } from 'react';
import { ReactReduxContext } from 'react-redux';
import { SHIFTS } from '../../../libs/tickets/tableRecords.js';
import { showBoxModal } from '../../../store/slices/boxModal.js';

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

import { limitesDelLocal } from '../../../libs/limites/limitesDelLocal.js';
import { useTimeServices } from './useTimeServices.jsx';
import { useDishes } from './useDishes.jsx';
import { createDishTypes } from '../../../libs/tickets/dishTypes.js';
import { shiftOfTime } from '../../../libs/date_time/operationalDay.js';


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
 *  @param {string}   attentionLimit     opcional. Si no viene, el configurado en el local (firstAtenttion) o, sin
 *                                       él, el que se deduce de su nombre.
 *
 *  Devuelve:
 *      name, attention, cleaning                     el nombre del local y sus dos límites de tiempo
 *      attentionOrigin, cleaningOrigin               de dónde salió cada límite: 'local', 'lista' o 'fijo'
 *      tablet, ai, reading, tracking, store,         lo que devuelve cada hook, tal cual
 *      savedRotations, zoom, drag, capture
 *      shift, shiftLocked, toggleShift               el turno con que nacen las rotaciones, si la hora deja
 *                                                    cambiarlo, y cambiarlo
 *      dishTypes                                     el tipo de plato del local: sus opciones y cómo elige la IA
 *                                                    (createDishTypes, en libs/tickets/dishTypes.js)
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

// shiftByClock = «el turno que impone la hora del equipo» (shiftOfTime): 'day' de 08:00:00 hasta antes de las
// 17:00:00, 'night' de 18:30:00 a 07:00:00 del día siguiente, y null en los dos cambios de turno —de 07:00 a 08:00 y
// de 17:00 a 18:30—, que es cuando se elige con el toggle (SHIFT_TIMES, en operationalDay.js). toTimeString empieza
// por la hora local, 'HH:MM:SS'.
const shiftByClock = (now = new Date()) => shiftOfTime(now.toTimeString().slice(0, 8));


function useTabletSession({ onReportDelay, establishmentName, attentionLimit } = {}) {


    //  ── 1 · EL LOCAL ──────────────────────────────────────────────────────────────────
    //  Va arriba del todo porque de él cuelgan los límites de tiempo y la carta de platos.

    const establishment = useEstablishment();

    // name = «el nombre del local». Manda lo que pase quien nos monte; si no pasa nada, el del local en curso.
    const name = establishmentName ?? establishment?.name ?? '';

    //  Los límites de ESTOS registers salen de los tiempos que el local tiene configurados ('timeServices':
    //  firstAtenttion y TableCleaning, de Redux o de la API, useTimeServices); si no los tiene, del nombre del
    //  local (limitesDelLocal). Los formularios de novedades conservan su propia regla, escrita dentro de cada
    //  uno; unificarlas está pendiente de aprobación.
    const timeServices = useTimeServices(establishment?._id);
    const limits = limitesDelLocal(name, timeServices);
    const attention = attentionLimit ?? limits.atencion;
    const cleaning = limits.limpieza;

    //  La carta del local (useDishes): de ella salen las opciones del «Tipo de plato» de Mesas y Registros, y con
    //  ella elige la IA el de cada pedido. Sin platos, la lista de siempre (dishTypes.js).
    const dishes = useDishes(establishment?._id);
    const dishTypes = useMemo(() => createDishTypes(dishes), [dishes]);

    // attentionOrigin / cleaningOrigin = «de dónde sale cada tiempo de referencia»: 'local' (lo configurado en el
    // local), 'lista' (la lista de nombres, porque el local no lo tiene) o 'fijo' (lo pasó quien monta la sesión).
    // Lo enseña la celda en rojo al pasar el ratón: así se ve por qué una demora cuenta con un tiempo y no con otro.
    const attentionOrigin = attentionLimit ? 'fijo' : limits.origen.atencion;
    const cleaningOrigin = limits.origen.limpieza;

    //  Y en la consola, cada vez que cambian: el local, sus dos tiempos de referencia y de dónde salió cada uno
    useEffect(() => {
        if (!name) return;
        console.info(`[tiempos de referencia] ${name}: primera atención ${attention} (${attentionOrigin}), limpieza ${cleaning} (${cleaningOrigin}). Lo configurado en el local: ${timeServices ? `firstAtenttion ${timeServices.firstAtenttion ?? '-'}, TableCleaning ${timeServices.TableCleaning ?? '-'}` : 'no llegó'}`);
    }, [name, attention, cleaning, attentionOrigin, cleaningOrigin, timeServices]);


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
        dishTypeOf: dishTypes.fromOrder,
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


    // reduxStore = «el store de Redux de esta ventana», o null en la flotante, que no lo monta (ver main.jsx).
    // Con él se pregunta con el BoxModal; sin él, con window.confirm.
    const reduxStore = useContext(ReactReduxContext)?.store ?? null;

    // emptyRegister = «vaciar el registro», ya contestado que sí. Limpia las dos cosas, que si no
    // reaparecería por algún lado: las mesas, con lo guardado en el equipo (store.clear), y lo que el
    // seguimiento tiene ahora mismo (una limpieza más).
    const emptyRegister = () => {
        store.clear();
        setClears(count => count + 1);
    };

    // clearRegister = «…se vacía el registro» (la papelera de la barra, ClearButton)
    // Se pregunta antes: esto borra trabajo de alguien y no hay forma de deshacerlo. Con el BoxModal de la
    // aplicación (pedido del usuario), en tono de advertencia, con emptyRegister como lo que hace «Limpiar»;
    // el aviso dice cuántas rotaciones se pierden y que las de Registros no se tocan.
    const clearRegister = () => {

        // pending = «las filas de Mesas en uso»: lo que se pierde
        const pending = store.records.filter(record => record.date).length;

        const message = `Se van a borrar ${pending === 1 ? 'la rotación de Mesas que no se ha guardado' : `las ${pending} rotaciones de Mesas que no se han guardado`}, con sus procesos y sus toques de gerente, incluido lo escrito a mano.\n\nLas de Registros no se tocan. No se puede deshacer.`;

        //  En la flotante, sin Redux: window.confirm, que contesta en el acto
        if (!reduxStore) {
            if (window.confirm(`${message}\n\n¿Seguir?`)) emptyRegister();
            return;
        }

        reduxStore.dispatch(showBoxModal({
            tone: 'warning',
            title: 'Limpiar Mesas',
            message,
            onAccept: emptyRegister,
            acceptLabel: 'Limpiar',
            cancelLabel: 'Cancelar',
        }));
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
        name, attention, cleaning, attentionOrigin, cleaningOrigin, establishment,
        tablet, ai, reading, tracking, store, savedRotations,
        zoom, drag, capture,
        shift, shiftLocked, toggleShift, dishTypes,
        disconnectTablet, clearRegister, reportDelay,
    };
}



export { useTabletSession };
