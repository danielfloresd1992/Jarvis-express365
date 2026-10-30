import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { arrangeRecords, cleanQuery, emptyViewText, DEFAULT_VIEW } from '../../../libs/tickets/tableView.js';
import { clockNow } from '../../../libs/date_time/waitingTime.js';


/*  LA VISTA DE MESAS: QUÉ FILAS SE VEN Y EN QUÉ ORDEN (pedido del usuario; propuesta «A · Barra de herramientas»)
 *
 *  Guarda lo que se eligió en la barra de herramientas (RegisterToolbar) —lo buscado, qué se muestra y el orden— y
 *  arma con ello las filas que pinta la tabla. Las reglas están en libs/tickets/tableView.js, que es puro.
 *
 *  No toca el registro: las rotaciones siguen guardadas en su orden de siempre. Solo cambia lo que se ve, y vuelve a
 *  como estaba al recargar la página.
 *
 *  «Con demora» incluye las mesas que llevan esperando de más, y eso cambia con el reloj aunque no cambie ninguna
 *  fila: cada CLOCK_TICK_MS se vuelve a mirar la hora.
 */


// CLOCK_TICK_MS = «cada cuánto se vuelve a mirar la hora», para la cuenta de «Con demora»
const CLOCK_TICK_MS = 5000;

// sameRows = «las dos listas tienen las mismas filas, en el mismo orden»
const sameRows = (previous, next) => previous.length === next.length && previous.every((record, index) => record === next[index]);


/*  @param {Array}  records         las rotaciones (useRegisterStore), con las filas en blanco del final
 *  @param {Set}    staleIds        opcional. Los ids de las rotaciones de días anteriores: van aparte (RegisterStaleBlock)
 *  @param {string} attentionLimit  el tiempo de referencia de primera atención del local
 *  @param {string} cleaningLimit   el de limpieza
 *  @param {object} dishTypes       el tipo de plato del local (createDishTypes): el tiempo de cada plato
 *  @returns {object}
 *           view                       { query, show, sort }: lo elegido en la barra
 *           rows                       las filas que se enseñan, ya ordenadas. La MISMA lista mientras no cambie
 *                                      ninguna: la tabla va con 'memo' y no se repinta con cada vuelta del reloj.
 *           counts                     cuántas rotaciones en uso hay de cada clase: { all, open, finished, late }
 *           shown / inUse              cuántas en uso se enseñan, y cuántas hay
 *           filtering                  se está buscando o mostrando solo una parte
 *           emptyText                  qué dice la tabla si lo buscado o lo mostrado no deja ninguna fila
 *           setQuery(texto)            buscar (se queda con las cifras)
 *           clearQuery()               dejar de buscar
 *           setShow(id) / setSort(id)  elegir qué mostrar (borra la búsqueda) / cómo ordenar
 *           resetFilters()             quitar la búsqueda y lo que se muestra; el orden se queda
 */
export default function useTableView({ records, staleIds, attentionLimit, cleaningLimit, dishTypes }) {

    const [view, setView] = useState(DEFAULT_VIEW);

    // now = «la hora del equipo», que avanza cada CLOCK_TICK_MS
    const [now, setNow] = useState(() => clockNow());

    useEffect(() => {
        const timer = setInterval(() => setNow(clockNow()), CLOCK_TICK_MS);
        return () => clearInterval(timer);
    }, []);

    // current = «las rotaciones de hoy, y las filas en blanco»: las de días anteriores van aparte, en su bloque
    const current = useMemo(() => (staleIds?.size > 0 ? records.filter(record => !staleIds.has(record.id)) : records), [records, staleIds]);

    const arranged = useMemo(
        () => arrangeRecords(current, view, { attentionLimit, cleaningLimit, dishTypes, now }),
        [current, view, attentionLimit, cleaningLimit, dishTypes, now]
    );

    // rowsRef = «la lista que tiene la tabla»: solo se cambia si cambian sus filas o su orden
    const rowsRef = useRef(arranged.rows);
    if (!sameRows(rowsRef.current, arranged.rows)) rowsRef.current = arranged.rows;

    const setQuery = useCallback((text) => setView(previous => ({ ...previous, query: cleanQuery(text) })), []);
    const clearQuery = useCallback(() => setView(previous => ({ ...previous, query: '' })), []);
    const setShow = useCallback((show) => setView(previous => ({ ...previous, show, query: '' })), []);
    const setSort = useCallback((sort) => setView(previous => ({ ...previous, sort })), []);
    const resetFilters = useCallback(() => setView(previous => ({ ...previous, query: '', show: DEFAULT_VIEW.show })), []);

    return {
        view,
        rows: rowsRef.current,
        counts: arranged.counts,
        shown: arranged.shown,
        inUse: arranged.inUse,
        filtering: view.query !== '' || view.show !== DEFAULT_VIEW.show,
        emptyText: emptyViewText(view),
        setQuery,
        clearQuery,
        setShow,
        setSort,
        resetFilters,
    };
}
