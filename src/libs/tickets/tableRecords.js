/*  ══════════════════════════════════════════════════════════════════════════════════════
 *  EL REGISTRO DE LAS MESAS
 *
 *  Lo que se pinta en el register y lo que se guarda en el equipo: una lista de ROTACIONES —una mesa
 *  desde que se ocupa hasta que se limpia— y, en cada una, sus PROCESOS, uno por pedido. Una misma
 *  mesa puede salir varias veces en un turno: una rotación por cada vez que se ocupa. Rotación y
 *  Procesos eran dos tablas sueltas; ahora son esta sola estructura:
 *
 *      [{
 *          date,                 cuándo se abrió el registro de la mesa (una Date)
 *          tableNumber,          la mesa: puede llevar letras ('B3') o, sin mesa, el ticket ('#91')
 *          takeOut,              pedido para llevar: la mesa es un '#ticket'. Una rotación hueca, que solo
 *                                contiene el proceso: no lleva horas de la mesa ni toques. Sale de tableNumber
 *                                cada vez que cambia, nunca se escribe a mano (withTable)
 *          shift,                el turno: 'day' o 'night' (SHIFTS). Se le pone al nacer, con el del
 *                                toggle de la barra (stampShift), y ya no cambia. null en las de antes
 *          hourOccupies,         'HH:MM:SS'  se ocupa
 *          hourFirstAttention,   'HH:MM:SS'  primera atención
 *          process: [{
 *              ticketNumber,         número de ticket ('102')             ┐
 *              dishType,             tipo de plato (dishTypes.js)         │
 *              orderTaking,          'HH:MM:SS'  toma de orden            ├ las lee la IA
 *              markedReadyOnTablet,  'HH:MM:SS'  marcado listo en tablet  ┘
 *              readyInTheKitchen,    'HH:MM:SS'  listo en cocina          ┐ a mano: la tablet
 *              dishDelivery,         'HH:MM:SS'  entrega del plato        ┘ no las muestra
 *              preparationDelay,     la demora de preparación reportada: el ObjectId de su novedad, o null
 *          }],
 *          breakUp,              'HH:MM:SS'  se desocupa
 *          tableCleaning,        'HH:MM:SS'  se limpia
 *      }]
 *
 *  Y tres datos que no se pintan, porque sin ellos no funcionaría:
 *
 *      id      mesas y procesos   su identidad. React la necesita para no perder lo que se está
 *                                 escribiendo, y las funciones de abajo para saber qué cambiar.
 *      key     procesos           el pedido de la tablet del que sale ('tk-102·appetizer'), o ''
 *                                 si se anotó a mano. Así cada lectura nueva va al mismo proceso.
 *      edited  procesos           lo de la tablet que alguien corrigió a mano: eso la IA ya no lo
 *                                 toca.
 *
 *  TODO AQUÍ ES PURO: cada función devuelve una lista nueva y no toca la que recibe. Si nada cambia,
 *  devuelve LA MISMA lista, para que no se repinte ni se guarde nada de más. Lo único que sale de
 *  aquí es readRecords y writeRecords, que usan el almacenamiento del navegador.
 *  ══════════════════════════════════════════════════════════════════════════════════════ */

import { esMesaDeVerdad } from './claveDeTicket.js';
import { DELAY_FIELDS, WARNING_FIELDS, isObjectId } from './reportedDelay.js';
import { isStaleRecord } from './staleRecords.js';
import { operationalDay } from '../date_time/operationalDay.js';
import { createDishTypes } from './dishTypes.js';



// RECORD_TIMES = «las horas de la mesa»
export const RECORD_TIMES = ['hourOccupies', 'hourFirstAttention', 'breakUp', 'tableCleaning'];

// OPEN_LISTS = «las listas que se despliegan en una fila de Mesas»: la de procesos y la de toques de gerente.
// Son de uso interno de Mesas, no datos de la mesa. Se guardan en el equipo con ella, para que al volver a
// abrir la app cada fila esté como se dejó. A la API viajan con el disquete, pero su validación las descarta
// (stripUnknown) y el modelo no las tiene.
export const OPEN_LISTS = ['processesOpen', 'touchesOpen'];

// SHIFTS = «los turnos de una rotación»: de día o de noche. Los mismos que acepta la API (rotation.schema.js).
export const SHIFTS = ['day', 'night'];

// PROCESS_FIELDS = «lo que se anota de un proceso», en su orden: su número, su tipo de plato y sus cuatro horas.
// Las dos duraciones de la línea (listo en tablet − toma de orden, entrega − listo en cocina) no se guardan: se calculan al pintar.
export const PROCESS_FIELDS = ['ticketNumber', 'dishType', 'orderTaking', 'markedReadyOnTablet', 'readyInTheKitchen', 'dishDelivery'];

// TABLET_FIELDS = «lo que lee la IA». Listo en cocina y entrega se anotan a mano: la tablet no las muestra.
export const TABLET_FIELDS = ['ticketNumber', 'dishType', 'orderTaking', 'markedReadyOnTablet'];

// NEVER_RETRACTED = «lo de la tablet que una lectura vacía no borra»: lo que DESCRIBE al pedido. Las horas
// sí se pueden retirar ('Listo en tablet' se quita si el pedido vuelve a aparecer).
const NEVER_RETRACTED = ['ticketNumber', 'dishType'];


// FIXED_DISH_TYPE = «el tipo de plato de un pedido con la lista de siempre» (dishTypes.js), el de un local sin carta
const FIXED_DISH_TYPE = createDishTypes([]).fromOrder;


// BLANK_RECORDS = «cuántas mesas en blanco quedan siempre al final», para anotar a mano.
// Son mesas de verdad, con su identidad, y no huecos que se conviertan en mesa al escribir: así, al
// escribir el primer carácter, la fila sigue siendo la misma y no se pierde lo que se está tecleando.
const BLANK_RECORDS = 30;

// STORAGE_PREFIX = «el principio de la llave donde se guarda cada local»: 'mesas:<_id del local>'
const STORAGE_PREFIX = 'mesas';

// MAX_RECORDS = «cuántas mesas se guardan como mucho». Las más recientes.
const MAX_RECORDS = 400;

// MAX_ROW = «la fila más alta que se acepta al leer». Un número de fila roto (1e9) no puede crear millones de
// filas en blanco: lo que pase de aquí va detrás, como si no trajera fila.
const MAX_ROW = 2000;


// isEmpty = «no tiene nada escrito»
const isEmpty = (value) => String(value ?? '').trim() === '';


// createProcess = «un proceso nuevo», vacío salvo lo que se le pase. Su id es un UUIDv4.
export function createProcess(fields = {}) {
    return {
        id: crypto.randomUUID(),
        key: '',
        edited: [],
        ticketNumber: '',
        dishType: '',
        orderTaking: '',
        markedReadyOnTablet: '',
        readyInTheKitchen: '',
        dishDelivery: '',
        preparationDelay: null,
        ...fields,
    };
}


// createRecord = «una rotación nueva», vacía salvo lo que se le pase. Su id es un UUIDv4.
export function createRecord(fields = {}) {
    return {
        id: crypto.randomUUID(),
        date: null,
        tableNumber: '',
        takeOut: false,
        shift: null,
        hourOccupies: '',
        hourFirstAttention: '',
        process: [],
        breakUp: '',
        tableCleaning: '',
        touch: [],      //  los toques de gerente: [{ id (UUIDv4), ref (ObjectId del gerente), name, hourTouch 'HH:MM:SS', hourTouchFinish, createdAt }]
                        //  hourTouchFinish: cuándo terminó el toque, 'HH:MM:SS': de 5 segundos a un minuto después de
                        //  hourTouch, al azar (libs/date_time/touchFinish.js). '' en los de antes de existir.
                        //  createdAt: de uso interno, el momento en que se creó el toque (ISO). No se ve ni se edita:
                        //  'hourTouch' sí se corrige a mano, y esto no.
        processesOpen: false,   //  de uso interno de Mesas (OPEN_LISTS): la lista de procesos está desplegada
        touchesOpen: false,     //  de uso interno de Mesas (OPEN_LISTS): la lista de toques de gerente está desplegada
        firstAttentionDelay: null,  //  el ObjectId de la novedad que reportó su demora de primera atención, o null
        cleaningDelay: null,        //  el de su demora de limpieza (los dos: libs/tickets/reportedDelay.js). Van a la API
                                    //  con el disquete, y el modelo de la rotación los referencia a 'Noveltie'.
        firstAttentionWarning: null,    //  el ObjectId del AVISO que se envió mientras seguía sin primera atención, o null
        cleaningWarning: null,          //  el del aviso mientras seguía sin limpiar (los dos, como las demoras)
        ...fields,
    };
}



// isBlankProcess = «el proceso está en blanco»: ni número, ni tipo, ni una hora, ni un pedido de la tablet detrás
export const isBlankProcess = (process) => isEmpty(process.key) && PROCESS_FIELDS.every(field => isEmpty(process[field]));

// isBlankRecord = «la mesa está en blanco»: ni número, ni horas, ni procesos con algo, ni toques
export const isBlankRecord = (record) => isEmpty(record.tableNumber)
    && RECORD_TIMES.every(field => isEmpty(record[field]))
    && record.process.every(isBlankProcess)
    && record.touch.length === 0;


// sameTable = «es la misma mesa». Sin distinguir espacios ni mayúsculas: 'b3 ' es 'B3'.
const sameTable = (one, other) => !isEmpty(one) && String(one).trim().toLowerCase() === String(other ?? '').trim().toLowerCase();

// isTicketPlaceholder = «la rotación no tiene mesa: en su lugar lleva el ticket» ('#142')
// Es la regla del pedido para llevar, la misma de isTakeOutTable en la API (rotation.lib.js).
const isTicketPlaceholder = (tableNumber) => String(tableNumber ?? '').trim().startsWith('#');

// isTakeOut = «es un pedido para llevar»: NO cuenta como rotación, porque no hubo mesa ocupada; solo es
// el proceso de un pedido. Vale para las rotaciones de aquí y para las guardadas (las devuelve la API con
// 'takeOut'); a una guardada antes de que la API diera el campo le falta, y entonces lo dice su '#ticket'.
export const isTakeOut = (record) => record?.takeOut ?? isTicketPlaceholder(record?.tableNumber);

// withTable = «la rotación con esta mesa». takeOut va siempre con ella: así no se pueden contradecir.
const withTable = (record, tableNumber) => ({ ...record, tableNumber, takeOut: isTicketPlaceholder(tableNumber) });

// ticketOfTable = «el número de ticket de una mesa para llevar»: '#14' → '14'. '' si no es un '#' seguido de cifras.
const ticketOfTable = (tableNumber) => String(tableNumber ?? '').trim().match(/^#\s*(\d+)$/)?.[1] ?? '';

// holdsOnlyTicket = «el proceso no tiene nada más que su número»: ni pedido de la tablet detrás, ni tipo, ni horas
const holdsOnlyTicket = (process) => isEmpty(process.key) && PROCESS_FIELDS.every(field => field === 'ticketNumber' || isEmpty(process[field]));


/*  withTicketProcess = «el proceso del ticket de un pedido para llevar, al día con su mesa»
 *
 *  Al escribir '#14' en la mesa, la rotación es el pedido para llevar del ticket 14, y ese pedido es su
 *  proceso: se crea solo, con ese número. Como la mesa se escribe tecla a tecla ('#1', '#14'), el proceso
 *  SIGUE a la mesa: el que se creó con '#1' pasa a ser el de '#14', y no quedan dos. El que sigue a la mesa
 *  es el de a mano (sin 'key') que lleva el número de antes.
 *
 *  Si el ticket ya tiene su proceso —lo leyó la IA, o ya se anotó—, no se crea otro. Y si la mesa deja de ser
 *  '#N' —se borra el número, o se corrige a una mesa de verdad—, el proceso se quita, pero solo si no tiene
 *  nada más que el número: lo que se anotó en él no se pierde.
 *
 *  Recibe: record (la rotación con la mesa nueva) y previousTable (la mesa que tenía).
 */
function withTicketProcess(record, previousTable) {

    const before = ticketOfTable(previousTable);
    const after = ticketOfTable(record.tableNumber);
    if (before === after) return record;

    // follower = «el proceso que sigue a la mesa»: el de a mano con el número de antes
    const follower = before ? record.process.find(process => isEmpty(process.key) && process.ticketNumber === before) : undefined;

    // alreadyThere = «el ticket nuevo ya tiene su proceso»
    const alreadyThere = after !== '' && record.process.some(process => process.ticketNumber === after);

    //  Sin ticket, o con el suyo ya puesto: sobra el que seguía a la mesa, si no tiene nada más que el número
    if (after === '' || alreadyThere) {
        return follower && holdsOnlyTicket(follower)
            ? { ...record, process: record.process.filter(process => process !== follower) }
            : record;
    }

    if (follower) return { ...record, process: record.process.map(process => (process === follower ? { ...process, ticketNumber: after } : process)) };

    return { ...record, process: [...record.process, createProcess({ ticketNumber: after })] };
}



// withBlankRows = «con las filas en blanco del final»: que la lista termine en BLANK_RECORDS rotaciones
// en blanco, para anotar a mano. Se llama después de cada cambio.
export function withBlankRows(records) {

    // trailing = «cuántas rotaciones en blanco hay ya al final»
    const trailing = records.length - firstTrailingBlank(records);
    if (trailing >= BLANK_RECORDS) return records;

    return [...records, ...Array.from({ length: BLANK_RECORDS - trailing }, () => createRecord())];
}


// firstTrailingBlank = «dónde empiezan las mesas en blanco del final». Lo nuevo se mete ahí, delante.
function firstTrailingBlank(records) {
    let index = records.length;
    while (index > 0 && isBlankRecord(records[index - 1])) index--;
    return index;
}



// setRecordField = «anotar un dato de una mesa»
// La mesa recibe su fecha la primera vez que se le escribe algo: hasta entonces era una fila en blanco.
// Al escribir la mesa se decide también si es para llevar: con '#' delante, sí (withTable), y entonces su
// ticket tiene su proceso (withTicketProcess).
export function setRecordField(records, recordId, field, value, now = new Date()) {

    const index = records.findIndex(record => record.id === recordId);
    if (index === -1 || records[index][field] === value) return records;

    const record = field === 'tableNumber'
        ? withTicketProcess(withTable(records[index], value), records[index].tableNumber)
        : { ...records[index], [field]: value };

    const next = [...records];
    next[index] = { ...record, date: records[index].date ?? now };
    return next;
}


// setProcessField = «anotar un dato de un proceso»: su tipo de plato o una de sus horas
// Si es una de las que lee la IA, queda marcada como corregida a mano: la IA ya no la vuelve a pisar.
export function setProcessField(records, recordId, processId, field, value, now = new Date()) {

    const recordIndex = records.findIndex(record => record.id === recordId);
    if (recordIndex === -1) return records;

    const record = records[recordIndex];
    const processIndex = record.process.findIndex(process => process.id === processId);
    if (processIndex === -1 || record.process[processIndex][field] === value) return records;

    const process = record.process[processIndex];

    // fromTabletByHand = «se corrige a mano un dato que había puesto la tablet»
    const fromTabletByHand = !isEmpty(process.key) && TABLET_FIELDS.includes(field) && !process.edited.includes(field);

    const lines = [...record.process];
    lines[processIndex] = { ...process, [field]: value, edited: fromTabletByHand ? [...process.edited, field] : process.edited };

    const next = [...records];
    next[recordIndex] = { ...record, process: lines, date: record.date ?? now };
    return next;
}



/*  applyTabletOrders = «meter en su mesa lo que lee la IA»
 *
 *  Recibe los pedidos que publica el seguimiento (useProcessTracking: las filas de
 *  libs/inference/processGrid.js) y, por cada uno:
 *
 *      · si ya está en una mesa (por su 'key'), le pone al día su número, su tipo de plato y sus dos horas
 *        —salvo lo corregido a mano—. La tablet afina la toma de orden con cada lectura, y 'Listo en tablet' se puede
 *        retirar si el pedido vuelve a aparecer.
 *      · si es nuevo, se asigna SOLO a la rotación ABIERTA de su número de mesa: la última con ese
 *        número que todavía no se ha desocupado. Si no hay ninguna, se abre una rotación nueva con
 *        ese número, delante de las filas en blanco.
 *
 *  Un pedido sin mesa (para llevar, Uber…) trae en 'mesa' su ticket con '#', así que va a su propia
 *  rotación: '#91'.
 *
 *  Pero una tarjeta que asoma CORTADA por el borde tampoco enseña su mesa, y llega igual, con '#'. Por eso:
 *
 *      · antes de abrir una '#142' se busca otro curso de ese mismo ticket que ya esté en una mesa de verdad:
 *        el número de ticket es único, así que es la misma mesa (tableOfTicket).
 *      · y si la rotación se abrió como '#142' y una lectura posterior trae la mesa, la rotación la toma
 *        (claimTable). Antes se quedaba con el '#142' para siempre aunque la parrilla ya supiera que era la 28.
 *
 *  acceptNewOrder (opcional) decide si un pedido NUEVO entra: recibe el pedido y devuelve true o false. Lo
 *  pone la ventana para preguntar por los tickets que ya se guardaron hoy (ver Registers). Sin él, entran
 *  todos. A los que ya están en una mesa no se les pregunta: solo se ponen al día.
 *
 *  dishTypeOf (opcional) da el tipo de plato de un pedido: el de la carta del local (createDishTypes, en
 *  dishTypes.js). Sin él, el de la lista de siempre.
 */
export function applyTabletOrders(records, orders, now = new Date(), acceptNewOrder = () => true, dishTypeOf = FIXED_DISH_TYPE) {

    if (!orders || orders.length === 0) return records;

    // isOpenToday = «la rotación sigue abierta para recibir pedidos»: no se ha desocupado y es de HOY. Una de un día
    // operativo anterior está bloqueada (staleRecords.js): sin esto, una mesa 30 abandonada hace días se tragaba
    // los pedidos de hoy de la mesa 30.
    const today = operationalDay(now);
    const isOpenToday = (record) => isEmpty(record.breakUp) && !isStaleRecord(record, today);

    // next = «la lista que se devuelve». Se copia la primera vez que algo cambia, no antes.
    let next = records;
    const change = (index, record) => {
        if (next === records) next = [...records];
        next[index] = record;
    };

    // tableOf = «en qué mesa está ya cada pedido»: key → id de la mesa
    const tableOf = new Map();
    for (const record of records) {
        for (const process of record.process) if (!isEmpty(process.key)) tableOf.set(process.key, record.id);
    }

    // claimTable = «la rotación sin mesa del índice toma su mesa de verdad»
    // Si esa mesa ya tiene OTRA rotación abierta, la '#142' era esa misma ocupación vista antes de saber dónde:
    // sus procesos pasan a la abierta y ella desaparece. Solo si no tiene nada más que sus procesos —ni horas ni
    // toques—: lo anotado a mano no se mezcla, y entonces solo se le pone la mesa.
    const claimTable = (index, table) => {
        const placeholder = next[index];

        // openIndex = «la otra rotación abierta de esa mesa»
        let openIndex = -1;
        for (let i = next.length - 1; i >= 0 && openIndex === -1; i--) {
            if (i !== index && sameTable(next[i].tableNumber, table) && isOpenToday(next[i])) openIndex = i;
        }

        // onlyProcesses = «no tiene nada anotado aparte de sus procesos»
        const onlyProcesses = RECORD_TIMES.every(field => isEmpty(placeholder[field])) && placeholder.touch.length === 0;

        if (openIndex === -1 || !onlyProcesses) {
            change(index, withTable(placeholder, table));
            return;
        }

        change(openIndex, { ...next[openIndex], process: [...next[openIndex].process, ...placeholder.process] });
        for (const process of placeholder.process) if (!isEmpty(process.key)) tableOf.set(process.key, next[openIndex].id);
        next.splice(index, 1);
    };

    for (const order of orders) {
        if (isEmpty(order.clave)) continue;

        // fromTablet = «lo que lee la tablet ahora»: el número de ticket, el tipo de plato y las dos horas
        const fromTablet = {
            ticketNumber: order.ticket ?? '',
            dishType: dishTypeOf(order),
            orderTaking: order.tomaOrden ?? '',
            markedReadyOnTablet: order.listoTablet ?? '',
        };

        // table = «la mesa de verdad que trae la lectura», o '' si no la trae (sin mesa, o aún sin leer)
        const table = esMesaDeVerdad(order.mesa) ? String(order.mesa).trim() : '';

        //  1. YA ESTÁ EN UNA MESA
        if (tableOf.has(order.clave)) {
            const index = next.findIndex(record => record.id === tableOf.get(order.clave));
            const updated = updateFromTablet(next[index], order.clave, fromTablet);
            if (updated !== next[index]) change(index, updated);

            //  Estaba en una rotación sin mesa ('#142') y por fin se lee la suya: la rotación la toma.
            if (table && isTicketPlaceholder(next[index].tableNumber)) claimTable(index, table);
            continue;
        }

        //  2. ES NUEVO, salvo que no se acepte (un ticket que ya se guardó, y el operador dijo que no)
        if (!acceptNewOrder(order)) continue;

        const process = createProcess({ key: order.clave, ...fromTablet });
        const tableNumber = table
            || tableOfTicket(next, fromTablet.ticketNumber, isOpenToday)
            || order.mesa
            || (order.ticket ? `#${order.ticket}` : '');

        // openIndex = «la mesa abierta con ese número», de hoy
        let openIndex = -1;
        for (let index = next.length - 1; index >= 0 && openIndex === -1; index--) {
            if (sameTable(next[index].tableNumber, tableNumber) && isOpenToday(next[index])) openIndex = index;
        }

        if (openIndex !== -1) {
            change(openIndex, { ...next[openIndex], process: [...next[openIndex].process, process] });
            tableOf.set(order.clave, next[openIndex].id);
            continue;
        }

        const record = withTable(createRecord({ date: now, process: [process] }), tableNumber);
        if (next === records) next = [...records];
        next.splice(firstTrailingBlank(next), 0, record);
        tableOf.set(order.clave, record.id);
    }

    return next;
}


// tableOfTicket = «la mesa de verdad donde ya está ese ticket», o '' si no está en ninguna
// El número de ticket es único: otro curso del mismo ticket es la misma mesa. Solo cuenta una rotación abierta
// (isOpen: la de applyTabletOrders, que además deja fuera las de días anteriores).
function tableOfTicket(records, ticketNumber, isOpen) {

    const ticket = String(ticketNumber ?? '').trim();
    if (ticket === '') return '';

    for (let index = records.length - 1; index >= 0; index--) {
        const record = records[index];
        if (!isOpen(record) || !esMesaDeVerdad(record.tableNumber)) continue;
        if (record.process.some(process => String(process.ticketNumber).trim() === ticket)) return String(record.tableNumber).trim();
    }
    return '';
}


// updateFromTablet = «poner al día lo que lee la tablet de un proceso». Lo corregido a mano no se toca.
function updateFromTablet(record, key, fromTablet) {

    const index = record.process.findIndex(process => process.key === key);
    const process = record.process[index];

    // changes = «lo que cambia»
    const changes = {};
    for (const field of TABLET_FIELDS) {
        if (process.edited.includes(field) || process[field] === fromTablet[field]) continue;

        //  'Listo en tablet' se retira si el pedido reaparece, pero el número y el tipo de plato no se
        //  retiran nunca: una lectura que todavía no los trae no borra los que ya tenía.
        if (NEVER_RETRACTED.includes(field) && isEmpty(fromTablet[field])) continue;

        changes[field] = fromTablet[field];
    }

    if (Object.keys(changes).length === 0) return record;

    const lines = [...record.process];
    lines[index] = { ...process, ...changes };
    return { ...record, process: lines };
}


/*  stampShift = «a las rotaciones que acaban de nacer, el turno de ahora»
 *
 *  Una rotación nace cuando recibe su fecha: la primera vez que se le escribe algo, o cuando la IA abre una
 *  nueva. En ese momento toma el turno del toggle de la barra (ShiftToggle), y con ese se queda: cambiar el
 *  toggle después solo cuenta para las que nazcan desde entonces. Las que ya tenían fecha —también las que
 *  vuelven de lo guardado sin turno, de antes de existir— no se tocan.
 *
 *  Recibe: previous (la lista de antes del cambio), next (la de después) y shift ('day' | 'night').
 *  Devuelve next, la MISMA si ninguna acaba de nacer.
 */
export function stampShift(previous, next, shift) {

    if (!SHIFTS.includes(shift)) return next;

    // dated = «las que ya habían nacido antes del cambio»
    const dated = new Set(previous.filter(record => record.date).map(record => record.id));

    let changed = false;
    const stamped = next.map(record => {
        if (!record.date || record.shift || dated.has(record.id)) return record;
        changed = true;
        return { ...record, shift };
    });

    return changed ? stamped : next;
}


// setListOpen = «desplegar o plegar una lista de una mesa»: la de procesos o la de toques (OPEN_LISTS)
// No es escribirle a la mesa: no le da fecha ni la hace nacer, como sí hace setRecordField.
export function setListOpen(records, recordId, list, open) {

    const index = records.findIndex(record => record.id === recordId);
    if (index === -1 || !OPEN_LISTS.includes(list) || records[index][list] === Boolean(open)) return records;

    const next = [...records];
    next[index] = { ...records[index], [list]: Boolean(open) };
    return next;
}


// appendBlankProcess = «añadir a una rotación un proceso en blanco», para anotarlo a mano
// Es lo que hace el botón «+» de la fila: un pedido que la tablet no vio, o que la IA no supo leer.
// En blanco no se guarda (withRows): si nadie le escribe nada, al recargar ya no está.
export function appendBlankProcess(records, recordId) {

    const index = records.findIndex(record => record.id === recordId);
    if (index === -1) return records;

    const next = [...records];
    next[index] = { ...records[index], process: [...records[index].process, createProcess()] };
    return next;
}



//  ── GUARDARLO EN EL EQUIPO ────────────────────────────────────────────────────────────
//  Una llave por local: dos establecimientos no comparten nada.


// storageKey = «la llave de este local». Sin local no hay llave: lo que no se sabe de quién es no se guarda.
const storageKey = (localId) => (localId ? `${STORAGE_PREFIX}:${localId}` : '');


// readRecords = «leer las mesas guardadas de un local», cada una en la fila que ocupaba (placeInRows)
// NUNCA lanza: sin nada guardado, o con el almacenamiento bloqueado, devuelve una lista vacía.
// Vuelven TODAS, también las de días anteriores: antes, las de más de 16 horas desaparecían sin guardarse. Ahora
// Mesas las bloquea y las sube a un bloque aparte, hasta que alguien las guarde o las elimine (staleRecords.js).
export function readRecords(localId, now = new Date()) {

    const key = storageKey(localId);
    if (!key) return [];

    try {
        const saved = JSON.parse(localStorage.getItem(key));
        if (!Array.isArray(saved)) return [];

        //  La fila va aparte y no dentro de la rotación: en memoria la fila es su sitio en la lista, y así
        //  tampoco viaja a la API al guardarla con el disquete.
        const rows = saved.map(item => ({ record: reviveRecord(item, now), row: item?.row }));

        return placeInRows(rows);
    }
    catch {
        return [];
    }
}


// writeRecords = «guardar las mesas de un local»: las que tienen algo, cada una con su fila (withRows), y
// las MAX_RECORDS más recientes.
// NUNCA lanza: si el almacenamiento está lleno o bloqueado devuelve false.
export function writeRecords(localId, records) {

    const key = storageKey(localId);
    if (!key) return false;

    try {
        //  La fecha se guarda como texto (JSON no tiene fechas) y reviveRecord la vuelve a hacer Date.
        localStorage.setItem(key, JSON.stringify(withRows(records).slice(-MAX_RECORDS)));
        return true;
    }
    catch (error) {
        console.log(error);
        return false;
    }
}


/*  LA FILA DE CADA MESA
 *
 *  Una rotación que se guarda en la API queda EN BLANCO EN SU SITIO (clearRecord), y las de debajo no se
 *  mueven. Pero lo guardado en el equipo no lleva las filas en blanco, así que al recargar ese hueco
 *  desaparecía y todas las de debajo subían una fila: la mesa que estaba en la 5 volvía en la 2.
 *
 *  Por eso cada rotación se guarda con su número de fila ('row', su posición en la lista, contando los
 *  huecos) y al leerla vuelve a ella. Las dos mitades son withRows, al guardar, y placeInRows, al leer.
 */

// withRows = «las rotaciones que tienen algo, cada una con la fila que ocupa»: lo que se guarda en el equipo
// Fuera las mesas y los procesos en blanco, sin perder dónde estaba cada una.
export function withRows(records) {
    return records
        .map((record, row) => ({ record, row }))
        .filter(({ record }) => !isBlankRecord(record))
        .map(({ record, row }) => ({ ...record, process: record.process.filter(process => !isBlankProcess(process)), row }));
}


// placeInRows = «cada rotación en la fila que ocupaba», y los huecos de entre medias en blanco
// Recibe: rows, [{ record, row }] tal como se leyeron. Devuelve la lista de rotaciones, sin las filas en
// blanco del final (eso lo pone withBlankRows).
// Las que no traen fila —guardadas antes de que existiera—, la traen repetida o fuera de rango van detrás de
// las colocadas, en su orden: nada se pierde por no saber dónde iba.
export function placeInRows(rows) {

    // placed = «las filas ya ocupadas»: el índice es la fila
    const placed = [];

    // rest = «las que no tienen una fila válida y libre»
    const rest = [];

    for (const { record, row } of rows) {
        if (Number.isInteger(row) && row >= 0 && row <= MAX_ROW && placed[row] === undefined) placed[row] = record;
        else rest.push(record);
    }

    //  Array.from recorre también los huecos del array (undefined), que se rellenan con rotaciones en blanco
    return [...Array.from(placed, record => record ?? createRecord()), ...rest];
}


// reviveRecord = «una mesa leída del almacenamiento, otra vez con su forma»
// No se fía de lo guardado: cada campo se rellena aunque falte, y la fecha vuelve a ser una Date.
function reviveRecord(saved, now) {

    const record = createRecord();
    if (typeof saved?.id === 'string') record.id = saved.id;

    for (const field of ['tableNumber', ...RECORD_TIMES]) record[field] = String(saved?.[field] ?? '');

    //  No se lee lo guardado: sale de la mesa, y así las de antes de existir el campo también lo tienen.
    record.takeOut = isTicketPlaceholder(record.tableNumber);

    //  El turno sí se lee: se puso al nacer y no se deduce de nada. Uno que no sea de SHIFTS no vale.
    record.shift = SHIFTS.includes(saved?.shift) ? saved.shift : null;

    const date = new Date(saved?.date ?? now);
    record.date = Number.isFinite(date.getTime()) ? date : now;

    record.process = (Array.isArray(saved?.process) ? saved.process : []).map(reviveProcess);

    record.touch = (Array.isArray(saved?.touch) ? saved.touch : []).map(touch => ({
        id: typeof touch?.id === 'string' ? touch.id : crypto.randomUUID(),
        ref: touch?.ref ?? null,
        name: String(touch?.name ?? ''),
        hourTouch: String(touch?.hourTouch ?? ''),
        hourTouchFinish: String(touch?.hourTouchFinish ?? ''),                       //  los de antes de existir no lo tienen
        createdAt: typeof touch?.createdAt === 'string' ? touch.createdAt : null,   //  los de antes de existir no lo tienen
    }));

    //  Las listas desplegadas, como se dejaron. Las de antes de existir el campo vuelven plegadas.
    for (const list of OPEN_LISTS) record[list] = saved?.[list] === true;

    //  Las demoras ya reportadas y los avisos ya enviados: el ObjectId de su novedad, si es uno de verdad
    for (const field of [...Object.values(DELAY_FIELDS), ...Object.values(WARNING_FIELDS)]) record[field] = isObjectId(saved?.[field]) ? saved[field] : null;
    return record;
}


// reviveProcess = «un proceso leído del almacenamiento, otra vez con su forma»
function reviveProcess(saved) {

    const process = createProcess();
    if (typeof saved?.id === 'string') process.id = saved.id;

    process.key = String(saved?.key ?? '');
    process.edited = Array.isArray(saved?.edited) ? saved.edited.filter(field => TABLET_FIELDS.includes(field)) : [];

    for (const field of PROCESS_FIELDS) process[field] = String(saved?.[field] ?? '');

    //  La demora de preparación ya reportada: el ObjectId de su novedad, si es uno de verdad
    process.preparationDelay = isObjectId(saved?.preparationDelay) ? saved.preparationDelay : null;
    return process;
}
