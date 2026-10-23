import { CELL_SELECTOR } from './gridNav.js';


/*  SOBRE QUÉ SE ABRIÓ EL MENÚ CONTEXTUAL DEL REGISTER
 *
 *  El menú ofrece cosas distintas según dónde se haga clic derecho (pedido del usuario). Aquí se averigua, mirando
 *  las marcas que ya llevan los elementos de la tabla:
 *
 *      data-grid-cell, data-row, data-col   una celda (gridNav.js): data-row es el id de la rotación, o 'p:<id>' en
 *                                           las líneas de procesos
 *      data-record-id                       la rotación entera (la raíz de RegisterRecordRow)
 *      data-process-id                      una línea de proceso (la raíz de RegisterProcessLine)
 *
 *  Y devuelve una de tres:
 *
 *      { kind: 'cell',     recordId, processId, column, element }   una celda; si es de un proceso, con su processId
 *      { kind: 'process',  recordId, processId, element }           una línea de proceso, fuera de sus celdas
 *      { kind: 'rotation', recordId, element }                      la fila de la rotación, fuera de sus celdas
 *
 *  o null si el clic no fue en la tabla: entonces sale el menú del sistema, como siempre. También dentro de una ventana
 *  que flota sobre la fila ('role="dialog"', como la lista de toques de gerente): no es la fila.
 */


// PROCESS_ROW = «el prefijo de las filas de procesos» en data-row
const PROCESS_ROW = 'p:';


export function menuTargetOf(element) {
    if (!element || typeof element.closest !== 'function') return null;

    const rotation = element.closest('[data-record-id]');
    if (!rotation) return null;

    //  Una ventana dentro de la fila (la lista de toques): su clic derecho no es de la fila
    const dialog = element.closest('[role="dialog"]');
    if (dialog && rotation.contains(dialog)) return null;

    const recordId = rotation.dataset.recordId;
    const processLine = element.closest('[data-process-id]');
    const processId = processLine?.dataset.processId ?? null;
    const cell = element.closest(CELL_SELECTOR);

    if (cell) {
        const row = cell.dataset.row ?? '';
        return {
            kind: 'cell',
            recordId,
            processId: row.startsWith(PROCESS_ROW) ? row.slice(PROCESS_ROW.length) : processId,
            column: cell.dataset.col ?? '',
            element: cell,
        };
    }

    if (processLine) return { kind: 'process', recordId, processId, element: processLine };

    return { kind: 'rotation', recordId, element: rotation };
}
