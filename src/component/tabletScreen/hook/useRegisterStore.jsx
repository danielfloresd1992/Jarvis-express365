import { useState, useEffect, useRef, useCallback } from 'react';
import { readRecords, writeRecords, withBlankRows, setRecordField, setProcessField, appendBlankProcess, applyTabletOrders, createRecord, stampShift } from '../../../libs/tickets/tableRecords.js';
import { getCurrentTime } from '../../cells/GridCells.jsx';


/*  EL REGISTRO DE LAS MESAS, EN LA VENTANA
 *
 *  La estructura y sus reglas están en libs/tickets/tableRecords.js. Aquí se tiene en React, se guarda
 *  en el equipo y se le dan las lecturas de la IA:
 *
 *      1. Al abrir, y al cambiar de local, se lee lo guardado de ESE local.
 *      2. Cada vez que el seguimiento publica pedidos, cada uno va a la rotación de su número de mesa
 *         (applyTabletOrders).
 *      3. Lo que se escribe a mano se guarda en cada tecla, y no cada pocos segundos: lo que se quiere
 *         evitar es justo perder lo último que se escribió al cerrar la ventana.
 *
 *  CON UNA SIMULACIÓN EN MARCHA se trabaja sobre una COPIA. Lo de la tablet de mentira se ve y se
 *  puede tocar, pero no se guarda nada, y al acabar la simulación vuelve el registro de verdad tal como
 *  estaba. Antes, al desconectar el simulador, sus pedidos inventados acababan en el registro real.
 */


// useRegisterStore = «el registro de las mesas»
// Recibe: { establishmentId   el _id del local: de quién es lo que se guarda
//           orders            los pedidos que se están siguiendo ahora (useProcessTracking)
//           simulating        hay una simulación en marcha
//           shift }           el turno del toggle de la barra: con él nacen las rotaciones (stampShift)
// Devuelve: { records, writeRecord, writeProcess, addProcess, deleteProcess, clearRecord, addTouch, writeTouch, deleteTouch, clear, setOrderGuard, reapplyOrders }
//   records                                          las rotaciones, con las filas en blanco del final
//   writeRecord(recordId, field, value)              anota un dato de una rotación
//   writeProcess(recordId, processId, field, value)  anota una hora de un proceso
//   addProcess(recordId)                             añade a una rotación un proceso en blanco (el «+»)
//   deleteProcess(recordId, processId)               borra un proceso de una rotación
//   clearRecord(recordId)                            deja la rotación en blanco, en su sitio (ya guardada en la API)
//   addTouch(recordId, manager)                      apunta un toque de gerente, con la hora del clic
//   writeTouch(recordId, touchId, hourTouch)         corrige la hora de un toque
//   deleteTouch(recordId, touchId)                   borra un toque
//   clear()                                          vacía el registro entero
//   setOrderGuard(guard)                             quién decide si entra un pedido nuevo de la IA: (pedido) => boolean
//   reapplyOrders()                                  vuelve a pasar los últimos pedidos (tras cambiar lo que decide quien decide)
function useRegisterStore({ establishmentId, orders, simulating, shift }) {

    const [records, setRecords] = useState(() => withBlankRows([]));

    // recordsRef = «las mesas, ya escritas». Se escribe en cada tecla, y la tecla siguiente tiene que
    // leer lo de la anterior sin esperar a que React vuelva a pintar.
    const recordsRef = useRef(records);

    // realRef = «el registro de verdad, apartado mientras se simula». null = no se está simulando.
    const realRef = useRef(null);

    //  Lo que necesitan las funciones de abajo, siempre al día. Va en refs para que esas funciones sean
    //  SIEMPRE LAS MISMAS: el register va con 'memo', y una función nueva en cada pintado lo repintaría.
    const establishmentRef = useRef(establishmentId);
    const simulatingRef = useRef(simulating);
    const shiftRef = useRef(shift);
    establishmentRef.current = establishmentId;
    simulatingRef.current = simulating;
    shiftRef.current = shift;


    // commit = «dejar puestas unas mesas»: se pintan y, si no se simula, se guardan
    // Por aquí pasa todo cambio, así que es aquí donde la rotación que acaba de nacer toma el turno (stampShift).
    const commit = useCallback((next) => {
        const withBlanks = withBlankRows(stampShift(recordsRef.current, next, shiftRef.current));
        if (withBlanks === recordsRef.current) return;

        recordsRef.current = withBlanks;
        setRecords(withBlanks);

        if (!simulatingRef.current) writeRecords(establishmentRef.current, withBlanks);
    }, []);


    //  1. AL ABRIR Y AL CAMBIAR DE LOCAL: lo guardado de ESE local. Si se está simulando, eso es lo que
    //     queda apartado, y la simulación sigue encima.
    useEffect(() => {
        const loaded = withBlankRows(readRecords(establishmentId));

        if (simulatingRef.current) realRef.current = loaded;

        recordsRef.current = loaded;
        setRecords(loaded);
    }, [establishmentId]);


    //  LA SIMULACIÓN: al empezar se aparta el registro de verdad; al acabar, vuelve tal cual.
    //  No hace falta copiarlo: tableRecords.js nunca cambia nada en su sitio, así que lo apartado no lo
    //  toca nadie.
    useEffect(() => {
        if (simulating) {
            realRef.current = recordsRef.current;
            return;
        }

        if (!realRef.current) return;

        const real = realRef.current;
        realRef.current = null;

        recordsRef.current = real;
        setRecords(real);
    }, [simulating]);


    // orderGuardRef = «quién decide si entra un pedido NUEVO de la IA» (el 4º parámetro de applyTabletOrders).
    // Lo pone la sesión con setOrderGuard (useSavedRotations): pregunta si el ticket ya se guardó hoy.
    // null = entran todos. Va en una ref: cambiarlo no tiene por qué repintar nada.
    const orderGuardRef = useRef(null);

    // ordersRef = «los últimos pedidos que publicó el seguimiento», para volver a pasarlos (reapplyOrders)
    const ordersRef = useRef(orders);
    ordersRef.current = orders;

    // applyOrders = «cada pedido a su mesa», preguntando a quien decide (orderGuardRef) por cada pedido nuevo.
    // También al simular: lo que se guarda con el disquete durante una simulación va a la API de verdad y
    // sale en «Registros», y el simulador repite números de ticket de una sesión a otra.
    const applyOrders = useCallback(() => {
        commit(applyTabletOrders(recordsRef.current, ordersRef.current, new Date(), orderGuardRef.current ?? undefined));
    }, [commit]);

    //  2. LO QUE LEE LA IA: cada vez que el seguimiento publica pedidos. Y también cuando lo pide quien
    //     decide (reapplyOrders): al aceptar un ticket ya guardado, entra en ese momento, sin esperar a la
    //     lectura siguiente.
    useEffect(() => {
        applyOrders();
    }, [orders, applyOrders]);

    // setOrderGuard = «poner (o quitar, con null) quién decide si entra un pedido nuevo»
    const setOrderGuard = useCallback((guard) => {
        orderGuardRef.current = guard;
    }, []);


    //  3. LO QUE SE ESCRIBE A MANO. Con useCallback: son SIEMPRE las mismas funciones (ver arriba).
    const writeRecord = useCallback((recordId, field, value) => {
        commit(setRecordField(recordsRef.current, recordId, field, value, new Date()));
    }, [commit]);

    const writeProcess = useCallback((recordId, processId, field, value) => {
        commit(setProcessField(recordsRef.current, recordId, processId, field, value, new Date()));
    }, [commit]);


    const addProcess = useCallback((recordId) => {
        commit(appendBlankProcess(recordsRef.current, recordId));
    }, [commit]);


    // deleteProcess = «borrar un proceso de una rotación»
    const deleteProcess = useCallback((recordId, processId) => {
        commit(recordsRef.current.map(record => (
            record.id === recordId ? { ...record, process: record.process.filter(process => process.id !== processId) } : record
        )));
    }, [commit]);


    // clearRecord = «dejar en blanco una rotación», en su sitio: lo que tenía ya está guardado en la API.
    // Vuelve con un id nuevo: el viejo ya lo tiene la API, y repetirlo daría «ya estaba guardada».
    const clearRecord = useCallback((recordId) => {
        commit(recordsRef.current.map(record => (record.id === recordId ? createRecord() : record)));
    }, [commit]);


    // changeTouches = «cambiar los toques de una rotación»: 'change' recibe su lista y devuelve la nueva
    const changeTouches = useCallback((recordId, change) => {
        commit(recordsRef.current.map(record => (
            record.id === recordId ? { ...record, touch: change(record.touch), date: record.date ?? new Date() } : record
        )));
    }, [commit]);

    // addTouch = «apuntar un toque de gerente en una rotación», con la hora del clic
    // Recibe: recordId y el botón del gerente ({ ref, name }, de managers.js).
    const addTouch = useCallback((recordId, manager) => {
        changeTouches(recordId, touches => [...touches, { id: crypto.randomUUID(), ref: manager.ref, name: manager.name, hourTouch: getCurrentTime(), createdAt: new Date().toISOString() }]);
    }, [changeTouches]);

    // writeTouch = «corregir la hora de un toque»
    const writeTouch = useCallback((recordId, touchId, hourTouch) => {
        changeTouches(recordId, touches => touches.map(touch => (touch.id === touchId ? { ...touch, hourTouch } : touch)));
    }, [changeTouches]);

    // deleteTouch = «borrar un toque»
    const deleteTouch = useCallback((recordId, touchId) => {
        changeTouches(recordId, touches => touches.filter(touch => touch.id !== touchId));
    }, [changeTouches]);


    // clear = «vaciar el registro entero». Preguntar antes no es cosa de aquí: lo hace la sesión.
    const clear = useCallback(() => commit([]), [commit]);


    return { records, writeRecord, writeProcess, addProcess, deleteProcess, clearRecord, addTouch, writeTouch, deleteTouch, clear, setOrderGuard, reapplyOrders: applyOrders };
}



export { useRegisterStore };
