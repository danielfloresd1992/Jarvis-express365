import { useCallback, useContext, useMemo, useState } from 'react';
import { ReactReduxContext } from 'react-redux';
import { showBoxModal } from '../../../store/slices/boxModal.js';
import { isStaleRecord, recordDay, staleSaveProblem, dayText, daysBetween } from '../../../libs/tickets/staleRecords.js';


/*  LAS ROTACIONES DE DÍAS ANTERIORES, EN MESAS (propuesta «B · Pendientes aparte», elegida por el usuario)
 *
 *  Las rotaciones que se quedaron sin guardar en un día operativo que ya pasó (staleRecords.js) están bloqueadas:
 *  no se modifican, solo se guardan o se eliminan. Este hook dice cuáles son y hace las dos cosas, de una en una o
 *  todas a la vez; lo visible es RegisterStaleBlock.
 *
 *      guardar    como el disquete (store.closeRecord): sube CERRADA por la cola de la subida en vivo y su fila se
 *                 limpia ya, también sin internet. La API la guarda en SU día operativo y la marca como abandonada
 *                 ('abandoned'); cuando contesta, entra en Registros. Si no la acepta, vuelve a Mesas.
 *                 Una a la que le falta la mesa o la hora de Ocupa no se puede guardar: ya no se puede escribir.
 *      eliminar   su fila de Mesas queda en blanco, sin guardarse. Se pregunta antes: no se puede deshacer.
 *
 *  Se pregunta con el BoxModal de la aplicación; en la ventana flotante, que no monta Redux, con window.confirm.
 */


// plural = «una o varias rotaciones»
const plural = (count) => (count === 1 ? 'la rotación' : `las ${count} rotaciones`);


/*  @param {Array}    records          las rotaciones de Mesas (store.records)
 *  @param {string}   today            el día operativo de hoy, 'AAAA-MM-DD' (useOperationalDay)
 *  @param {string}   establishmentId  el _id del local, para guardarlas
 *  @param {function} closeRecord      guardarla, como el disquete (store.closeRecord): false si no se pudo
 *  @param {function} clearRecord      dejar una fila en blanco (store.clearRecord)
 */
export default function useStaleRotations({ records, today, establishmentId, closeRecord, clearRecord }) {

    const reduxStore = useContext(ReactReduxContext)?.store ?? null;

    // stale = «las rotaciones de días anteriores», en el orden de Mesas; ids, para apartarlas de la tabla
    const stale = useMemo(() => records.filter(record => isStaleRecord(record, today)), [records, today]);
    const ids = useMemo(() => new Set(stale.map(record => record.id)), [stale]);

    // days = «de qué días son», del más viejo al más nuevo
    const days = useMemo(() => [...new Set(stale.map(recordDay))].sort(), [stale]);

    // busy = «se está guardando»: con la cola no se espera a la API, así que las teclas nunca se quedan quietas.
    // Se sigue devolviendo para RegisterStaleBlock. notice = «lo que no salió»
    const busy = false;
    const [notice, setNotice] = useState('');


    // ask = «preguntar antes de hacer algo que no se deshace»
    const ask = useCallback((title, message, acceptLabel, onAccept) => {
        if (!reduxStore) {
            if (window.confirm(`${message}\n\n¿Seguir?`)) onAccept();
            return;
        }
        reduxStore.dispatch(showBoxModal({ tone: 'warning', title, message, onAccept, acceptLabel, cancelLabel: 'Cancelar' }));
    }, [reduxStore]);


    // save = «guardar estas rotaciones», como el disquete: se cierran por la cola y sus filas se limpian ya (optimista).
    // Las que no se pueden guardar se cuentan y se dicen. Cómo va la subida lo dice la barra (SyncStatus).
    const save = useCallback((list) => {
        if (!establishmentId) return setNotice('Elige primero el local');

        const savable = list.filter(record => !staleSaveProblem(record));
        const skipped = list.length - savable.length;
        const failed = savable.filter(record => !closeRecord(record)).length;

        setNotice([
            failed > 0 ? `${failed === 1 ? 'Una no se pudo guardar' : `${failed} no se pudieron guardar`}: falta el local` : '',
            skipped > 0 ? `${skipped === 1 ? 'Una no se pudo guardar' : `${skipped} no se pudieron guardar`}: les falta la mesa o la hora de Ocupa, solo se pueden eliminar` : '',
        ].filter(Boolean).join(' · '));
    }, [establishmentId, closeRecord]);

    // remove = «quitar estas rotaciones de Mesas, sin guardarlas»
    const remove = useCallback((list) => {
        setNotice('');
        for (const record of list) clearRecord(record.id);
    }, [clearRecord]);


    // saveOne / saveAll = «guardar una / todas». Todas, se pregunta: es mucho de una vez.
    const saveOne = useCallback((record) => save([record]), [save]);
    const saveAll = useCallback(() => {
        if (stale.length === 0) return;
        const late = days.length === 1 ? ` del ${dayText(days[0])}, ${daysBetween(days[0], today)} ${daysBetween(days[0], today) === 1 ? 'día' : 'días'} tarde` : ' de días anteriores';
        ask(
            'Guardar rotaciones de días anteriores',
            `Se van a guardar ${plural(stale.length)}${late}. Cada una va a Registros de su día, marcada como abandonada: no se guardó a tiempo.\n\nLas que no tengan mesa u hora de Ocupa no se pueden guardar.`,
            'Guardar',
            () => save(stale),
        );
    }, [stale, days, today, ask, save]);

    // deleteOne / deleteAll = «eliminar una / todas», preguntando antes
    const deleteOne = useCallback((record) => {
        ask(
            'Eliminar una rotación de otro día',
            `Se elimina de Mesas la rotación de la mesa ${record.tableNumber || 'sin número'} del ${dayText(recordDay(record))}, sin guardarse.\n\nNo se puede deshacer.`,
            'Eliminar',
            () => remove([record]),
        );
    }, [ask, remove]);
    const deleteAll = useCallback(() => {
        if (stale.length === 0) return;
        ask(
            'Eliminar rotaciones de días anteriores',
            `Se eliminan de Mesas ${plural(stale.length)} de días anteriores, sin guardarse.\n\nNo se puede deshacer.`,
            'Eliminar',
            () => remove(stale),
        );
    }, [stale, ask, remove]);


    return useMemo(
        () => ({ records: stale, ids, days, today, busy, notice, saveOne, saveAll, deleteOne, deleteAll }),
        [stale, ids, days, today, busy, notice, saveOne, saveAll, deleteOne, deleteAll]
    );
}
