import { SHIFTS } from './tableRecords.js';
import { getTimeReport } from '../date_time/calculate_time.js';
import { exceedsLimit } from '../date_time/timeLimit.js';
import { clockDuration, waitingSeconds } from '../date_time/waitingTime.js';
import { shiftOfTime } from '../date_time/operationalDay.js';


/*  BUSCAR, MOSTRAR Y ORDENAR LAS FILAS DE MESAS (pedido del usuario; propuesta «A · Barra de herramientas»)
 *
 *  La barra de encima de la tabla (RegisterToolbar) tiene tres mandos, siempre a la vista:
 *
 *      buscar    una mesa por su número: solo cifras, hasta 4. Sale toda mesa que las lleve («2» → 20, 21, 12).
 *      mostrar   Todas │ En curso │ Terminadas │ Con demora, cada una con cuántas hay.
 *      ordenar   Llegada │ 1 → 9 │ 9 → 1.
 *
 *  Buscar manda sobre mostrar: mientras se busca, se ven TODAS las mesas que coinciden, estén como estén, y elegir
 *  qué mostrar borra la búsqueda.
 *
 *  «Llegada» es el orden de siempre, el del registro, tal cual: también las filas libres que quedan en medio al
 *  guardar una. Si se movieran al final, la fila libre en la que se empieza a escribir saltaría a su sitio en mitad de
 *  la tabla. En «1 → 9» y «9 → 1» van primero las mesas por su número, luego los pedidos para llevar por su ticket,
 *  luego las filas en uso que aún no tienen número y, siempre al final, las libres. A igual número, por llegada.
 *
 *  PURA: no lee el reloj ni la pantalla. La hora de ahora y los tiempos de referencia los pone quien llama
 *  (useTableView). Se prueba en Node.
 */


// SHOW_OPTIONS = «qué filas se pueden mostrar», en el orden de la barra. 'dot' = lleva el punto rojo.
export const SHOW_OPTIONS = [
    { id: 'all',      label: 'Todas' },
    { id: 'open',     label: 'En curso' },
    { id: 'finished', label: 'Terminadas' },
    { id: 'late',     label: 'Con demora', dot: true },
];

// SORT_OPTIONS = «cómo se pueden ordenar», en el orden de la barra. 'title' es lo que se lee al pasar el ratón.
export const SORT_OPTIONS = [
    { id: 'arrival', label: 'Llegada', title: 'Como fueron llegando las mesas', words: 'En el orden en que llegaron' },
    { id: 'asc',     label: '1 → 9',   title: 'Nº de mesa, de menor a mayor',   words: 'Nº de mesa de menor a mayor' },
    { id: 'desc',    label: '9 → 1',   title: 'Nº de mesa, de mayor a menor',   words: 'Nº de mesa de mayor a menor' },
];

// DEFAULT_VIEW = «cómo se ve Mesas sin tocar nada»: todas, en el orden de siempre
export const DEFAULT_VIEW = { query: '', show: 'all', sort: 'arrival' };

// QUERY_LENGTH = «cuántas cifras admite el buscador»
export const QUERY_LENGTH = 4;

// cleanQuery = «lo escrito en el buscador, solo con cifras y hasta QUERY_LENGTH»: 'm 2a05x7' → '2057'
export const cleanQuery = (text) => String(text ?? '').replace(/\D/g, '').slice(0, QUERY_LENGTH);


// isFree = «la fila está libre»: nadie la ha usado todavía (sin 'date', ver tableRecords.js)
export const isFree = (record) => !record.date;

// isFinished = «la rotación ya terminó»: la mesa se limpió; un pedido para llevar, cuando se entregaron todos sus
// platos. Es la marca ✓ de la celda Mesa y el disquete en verde (RegisterRecordRow).
export const isFinished = (record) => (record.takeOut === true
    ? record.process.length > 0 && record.process.every(process => process.dishDelivery !== '')
    : record.tableCleaning !== '');


/*  ¿CON DEMORA?
 *
 *  Lo que la fila ya pinta en rojo o con bandera, con las mismas reglas:
 *      · la Duración de la primera atención o de la limpieza pasó del tiempo del local;
 *      · la mesa lleva esperando la primera atención o la limpieza más de ese tiempo (el triángulo);
 *      · un pedido pasó de su tiempo de preparación, ya listo en tablet o todavía esperando (la campana);
 *      · o alguna de esas demoras o esperas ya se reportó o se avisó (la bandera).
 *  Un pedido con «Marcada antes de estar listo» reportada no cuenta por su preparación: su hora en la tablet no es
 *  la real (RegisterRecordRow). Un pedido para llevar no tiene horas de mesa: solo cuentan sus pedidos.
 */

// durationLate = «de 'start' a 'end' pasó más de 'limit'», con las dos horas puestas
const durationLate = (start, end, limit) => start !== '' && end !== '' && exceedsLimit(getTimeReport(start, end).timeTotal, limit);

// waitingLate = «desde 'since' hasta 'now' pasó más de 'limit'», sin que haya llegado lo que se espera
const waitingLate = (since, now, limit) => {
    const seconds = waitingSeconds(since, now);
    return seconds !== null && exceedsLimit(clockDuration(seconds), limit);
};

// shiftOf = «el turno con que se mide la preparación de sus platos»: el de la rotación o, en una sin turno, el que
// dice la hora; en los cambios de turno, el de día. La misma regla que RegisterRecordRow.
const shiftOf = (record, now) => (SHIFTS.includes(record.shift) ? record.shift : shiftOfTime(now) ?? 'day');

// preparationLate = «el pedido pasó de su tiempo de preparación ('limit')»: la regla de isPreparationLate
// (PreparationAlert.jsx), con la espera medida aquí con 'now' en lugar del bucle de la fila
const preparationLate = (process, limit, now) => {
    if (!limit) return false;
    if (process.orderTaking && process.markedReadyOnTablet) return durationLate(process.orderTaking, process.markedReadyOnTablet, limit);
    return process.markedReadyOnTablet === '' && waitingLate(process.orderTaking, now, limit);
};

/*  @param {object} record   la rotación
 *  @param {object} context  { attentionLimit, cleaningLimit, dishTypes, now }
 *                             attentionLimit / cleaningLimit  los tiempos de referencia del local, 'HH:MM:SS'
 *                             dishTypes                       el tipo de plato del local (createDishTypes): limitOf
 *                             now                             la hora del equipo, 'HH:MM:SS'
 */
export function hasDelay(record, { attentionLimit = '', cleaningLimit = '', dishTypes = null, now = '' } = {}) {
    if (isFree(record)) return false;

    const reported = record.firstAttentionDelay || record.cleaningDelay || record.firstAttentionWarning || record.cleaningWarning
        || record.process.some(process => process.preparationDelay);
    if (reported) return true;

    if (record.takeOut !== true) {
        if (durationLate(record.hourOccupies, record.hourFirstAttention, attentionLimit)) return true;
        if (durationLate(record.breakUp, record.tableCleaning, cleaningLimit)) return true;
        if (record.hourFirstAttention === '' && waitingLate(record.hourOccupies, now, attentionLimit)) return true;
        if (record.tableCleaning === '' && waitingLate(record.breakUp, now, cleaningLimit)) return true;
    }

    const shift = shiftOf(record, now);
    return record.process.some(process => !process.earlyMarkDelay
        && preparationLate(process, dishTypes?.limitOf(process.dishType, shift) ?? '', now));
}


// matchOf = «cómo coincide la mesa con lo buscado»: 'exact' (es esa mesa), 'partial' (lleva esas cifras) o '' (no).
// Un pedido para llevar ('#14') coincide por su ticket, pero nunca es «esa mesa».
export function matchOf(record, query) {
    if (!query) return '';
    const table = String(record.tableNumber ?? '').trim();
    if (!table.replace(/\D/g, '').includes(query)) return '';
    return table === query ? 'exact' : 'partial';
}


//  EL ORDEN POR NÚMERO
// GROUPS = «en qué tanda va cada fila»: primero las mesas con número, luego los pedidos para llevar, luego las que
// están en uso sin número, y las libres al final
const GROUPS = { table: 0, takeOut: 1, noNumber: 2, free: 3 };

// sortKey = «la tanda de la fila y su número»: '20' → mesa 20; '20A' → mesa 20; '#14' → para llevar, 14
const sortKey = (record) => {
    if (isFree(record)) return { group: GROUPS.free, number: 0 };
    const digits = String(record.tableNumber ?? '').trim().match(/\d+/)?.[0];
    if (record.takeOut === true) return { group: GROUPS.takeOut, number: Number(digits ?? 0) };
    return digits === undefined ? { group: GROUPS.noNumber, number: 0 } : { group: GROUPS.table, number: Number(digits) };
};

// sortRecords = «las filas en el orden pedido». 'arrival' las deja como están. A igual número, por llegada.
export function sortRecords(records, sort) {
    if (sort !== 'asc' && sort !== 'desc') return records;
    const direction = sort === 'desc' ? -1 : 1;
    return records
        .map((record, index) => ({ record, index, key: sortKey(record) }))
        .sort((first, second) => (first.key.group - second.key.group)
            || ((first.key.number - second.key.number) * direction)
            || (first.index - second.index))
        .map(entry => entry.record);
}


/*  arrangeRecords = «lo que enseña Mesas»
 *
 *  @param {Array}  records  las filas de hoy, en el orden del registro (sin las de días anteriores)
 *  @param {object} view     { query, show, sort } (DEFAULT_VIEW)
 *  @param {object} context  lo que necesita hasDelay: { attentionLimit, cleaningLimit, dishTypes, now }
 *  @returns {{ rows, counts, shown, inUse }}
 *           rows    las filas que se enseñan, ya ordenadas
 *           counts  cuántas rotaciones en uso hay de cada clase: { all, open, finished, late }
 *           shown   cuántas de las que se enseñan están en uso (las libres no cuentan)
 *           inUse   cuántas hay en uso
 */
export function arrangeRecords(records, view = DEFAULT_VIEW, context = {}) {
    const query = cleanQuery(view.query);

    // used = «las rotaciones en uso, cada una con lo que es»
    const used = records.filter(record => !isFree(record)).map(record => ({
        record,
        finished: isFinished(record),
        late: hasDelay(record, context),
    }));

    const counts = {
        all: used.length,
        open: used.filter(entry => !entry.finished).length,
        finished: used.filter(entry => entry.finished).length,
        late: used.filter(entry => entry.late).length,
    };

    // keep = «las que se quedan», por lo buscado o por lo que se muestra
    const byRecord = new Map(used.map(entry => [entry.record, entry]));
    const keep = (record) => {
        const entry = byRecord.get(record);
        if (query) return Boolean(entry) && matchOf(record, query) !== '';
        if (view.show === 'open') return Boolean(entry) && !entry.finished;
        if (view.show === 'finished') return Boolean(entry) && entry.finished;
        if (view.show === 'late') return Boolean(entry) && entry.late;
        return true;
    };

    const filtered = query || view.show !== 'all' ? records.filter(keep) : records;
    const rows = sortRecords(filtered, view.sort);

    return { rows, counts, shown: rows.filter(record => !isFree(record)).length, inUse: used.length };
}


// isDefaultView = «Mesas se ve como sin tocar nada»: sin buscar, todas y por llegada
export const isDefaultView = (view) => cleanQuery(view.query) === '' && view.show === DEFAULT_VIEW.show && view.sort === DEFAULT_VIEW.sort;


// rowsText = «unas filas, dicho para leer»: 1 → '1 fila', 3 → '3 filas'
const rowsText = (count) => `${count} ${count === 1 ? 'fila' : 'filas'}`;

// viewSummary = «lo que dice el pie de Mesas» (RegisterViewSummary), en partes: cuántas se ven, en qué orden y, si se
// ordena por número, dónde van las libres. Recibe lo que devuelve arrangeRecords: { shown, inUse }.
export function viewSummary(view, { shown, inUse }) {
    const query = cleanQuery(view.query);
    const howMany = query
        ? (shown === 0 ? `Ninguna fila con «${query}» en el número de mesa` : `${rowsText(shown)} con «${query}» en el número de mesa`)
        : view.show !== DEFAULT_VIEW.show ? `Mostrando ${shown} de ${rowsText(inUse)} en uso` : `${rowsText(inUse)} en uso`;
    const order = SORT_OPTIONS.find(option => option.id === view.sort)?.words ?? '';
    return [howMany, order, view.sort !== 'arrival' ? 'Las filas libres van siempre al final' : ''].filter(Boolean);
}

// emptyViewText = «qué dice la tabla cuando lo buscado o lo mostrado no deja ninguna fila»
export function emptyViewText(view) {
    const query = cleanQuery(view.query);
    if (query) return `Ninguna mesa tiene «${query}» en su número`;
    return { open: 'Ninguna mesa en curso', finished: 'Ninguna mesa terminada todavía', late: 'Ninguna mesa con demora' }[view.show] ?? 'Ninguna fila';
}
