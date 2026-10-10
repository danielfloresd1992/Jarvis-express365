import { useState, useEffect, useRef, useCallback } from 'react';
import { readRecords, writeRecords, withBlankRows, setRecordField, setProcessField, appendBlankProcess, applyTabletOrders } from '../../../libs/tickets/tableRecords.js';


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
//           simulating }      hay una simulación en marcha
// Devuelve: { records, writeRecord, writeProcess, addProcess, clear }
//   records                                          las rotaciones, con las filas en blanco del final
//   writeRecord(recordId, field, value)              anota un dato de una rotación
//   writeProcess(recordId, processId, field, value)  anota una hora de un proceso
//   addProcess(recordId)                             añade a una rotación un proceso en blanco (el «+»)
//   clear()                                          vacía el registro entero
function useRegisterStore({ establishmentId, orders, simulating }) {

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
    establishmentRef.current = establishmentId;
    simulatingRef.current = simulating;


    // commit = «dejar puestas unas mesas»: se pintan y, si no se simula, se guardan
    const commit = useCallback((next) => {
        const withBlanks = withBlankRows(next);
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


    //  2. LO QUE LEE LA IA: cada pedido a su mesa.
    useEffect(() => {
        commit(applyTabletOrders(recordsRef.current, orders, new Date()));
    }, [orders, commit]);


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


    // clear = «vaciar el registro entero». Preguntar antes no es cosa de aquí: lo hace la sesión.
    const clear = useCallback(() => commit([]), [commit]);


    return { records, writeRecord, writeProcess, addProcess, clear };
}



export { useRegisterStore };
