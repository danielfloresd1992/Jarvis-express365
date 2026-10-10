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
 *          hourOccupies,         'HH:MM:SS'  se ocupa
 *          hourFirstAttention,   'HH:MM:SS'  primera atención
 *          process: [{
 *              ticketNumber,         número de ticket ('102')             ┐
 *              dishType,             tipo de plato: una de DISH_TYPES     │
 *              orderTaking,          'HH:MM:SS'  toma de orden            ├ las lee la IA
 *              markedReadyOnTablet,  'HH:MM:SS'  marcado listo en tablet  ┘
 *              readyInTheKitchen,    'HH:MM:SS'  listo en cocina          ┐ a mano: la tablet
 *              dishDelivery,         'HH:MM:SS'  entrega del plato        ┘ no las muestra
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



// RECORD_TIMES = «las horas de la mesa»
export const RECORD_TIMES = ['hourOccupies', 'hourFirstAttention', 'breakUp', 'tableCleaning'];

// PROCESS_FIELDS = «lo que se anota de un proceso», en su orden: su número, su tipo de plato y sus cuatro horas.
// Las dos duraciones de la línea (listo en tablet − toma de orden, entrega − listo en cocina) no se guardan: se calculan al pintar.
export const PROCESS_FIELDS = ['ticketNumber', 'dishType', 'orderTaking', 'markedReadyOnTablet', 'readyInTheKitchen', 'dishDelivery'];

// TABLET_FIELDS = «lo que lee la IA». Listo en cocina y entrega se anotan a mano: la tablet no las muestra.
export const TABLET_FIELDS = ['ticketNumber', 'dishType', 'orderTaking', 'markedReadyOnTablet'];

// NEVER_RETRACTED = «lo de la tablet que una lectura vacía no borra»: lo que DESCRIBE al pedido. Las horas
// sí se pueden retirar ('Listo en tablet' se quita si el pedido vuelve a aparecer).
const NEVER_RETRACTED = ['ticketNumber', 'dishType'];


// DISH_TYPES = «los tipos de plato», las opciones del select. Son las del formato del Excel (FORMATO NUEVO 2.3).
export const DISH_TYPES = ['APPETIZER', 'ENTREE', 'DESSER', 'SALAD', 'ENTRADA 6', 'ENTRADA 7', 'ENTRADA 8', 'ENTRADA 9', 'PF', 'POSTRE', 'DRINKS', 'DRINKS BAR', 'TAKE OUT', 'PICK UP', 'UBER EATS', 'DOORDASH'];

// DISH_TYPE_FROM_READING = «el tipo que resuelve la lectura (libs/tickets/tipoDePlato.js), en su opción de la lista»
// Lo que no tiene opción en la lista —'Online Ordering', 'Delivery', 'Grubhub' o un tipo sin resolver— se queda
// vacío para elegirlo a mano.
const DISH_TYPE_FROM_READING = {
    'Entrada': 'APPETIZER',
    'Plato fuerte': 'PF',
    'Postre': 'POSTRE',
    'Bebida': 'DRINKS',
    'Take Out': 'TAKE OUT',
    'Pick Up': 'PICK UP',
    'Uber Eats': 'UBER EATS',
    'DoorDash': 'DOORDASH',
};


// BLANK_RECORDS = «cuántas mesas en blanco quedan siempre al final», para anotar a mano.
// Son mesas de verdad, con su identidad, y no huecos que se conviertan en mesa al escribir: así, al
// escribir el primer carácter, la fila sigue siendo la misma y no se pierde lo que se está tecleando.
const BLANK_RECORDS = 15;

// STORAGE_PREFIX = «el principio de la llave donde se guarda cada local»: 'mesas:<_id del local>'
const STORAGE_PREFIX = 'mesas';

// MAX_RECORDS = «cuántas mesas se guardan como mucho». Las más recientes.
const MAX_RECORDS = 400;

// RECORD_HOURS = «cuántas horas vale una mesa guardada»
// Lo bastante para un turno entero, incluido uno que cruce la medianoche, y no tanto como para
// mezclar las mesas de ayer con las de hoy.
const RECORD_HOURS = 16;



// isEmpty = «no tiene nada escrito»
const isEmpty = (value) => String(value ?? '').trim() === '';


// lastId = «el último número de identidad repartido en esta ventana»
let lastId = 0;

// createId = «una identidad nueva». Lleva la hora para no repetirse entre recargas.
function createId(prefix) {
    lastId += 1;
    return `${prefix}-${Date.now().toString(36)}-${lastId}`;
}



// createProcess = «un proceso nuevo», vacío salvo lo que se le pase
export function createProcess(fields = {}) {
    return {
        id: createId('proceso'),
        key: '',
        edited: [],
        ticketNumber: '',
        dishType: '',
        orderTaking: '',
        markedReadyOnTablet: '',
        readyInTheKitchen: '',
        dishDelivery: '',
        ...fields,
    };
}


// createRecord = «una rotación nueva», vacía salvo lo que se le pase
export function createRecord(fields = {}) {
    return {
        id: createId('mesa'),
        date: null,
        tableNumber: '',
        hourOccupies: '',
        hourFirstAttention: '',
        process: [],
        breakUp: '',
        tableCleaning: '',
        ...fields,
    };
}



// isBlankProcess = «el proceso está en blanco»: ni número, ni tipo, ni una hora, ni un pedido de la tablet detrás
export const isBlankProcess = (process) => isEmpty(process.key) && PROCESS_FIELDS.every(field => isEmpty(process[field]));

// isBlankRecord = «la mesa está en blanco»: ni número, ni horas, ni procesos con algo
export const isBlankRecord = (record) => isEmpty(record.tableNumber)
    && RECORD_TIMES.every(field => isEmpty(record[field]))
    && record.process.every(isBlankProcess);


// sameTable = «es la misma mesa». Sin distinguir espacios ni mayúsculas: 'b3 ' es 'B3'.
const sameTable = (one, other) => !isEmpty(one) && String(one).trim().toLowerCase() === String(other ?? '').trim().toLowerCase();



// withBlankRows = «con las filas en blanco del final»: que la lista termine en BLANK_RECORDS rotaciones
// en blanco, para anotar a mano. Se llama después de cada cambio.
export function withBlankRows(records) {

    // trailing = «cuántas rotaciones en blanco hay ya al final»
    const trailing = records.length - firstTrailingBlank(records);
    if (trailing >= BLANK_RECORDS) return records;

    return [...records, ...Array.from({ length: BLANK_RECORDS - trailing }, () => createRecord())];
}


// withoutBlankRows = «solo lo que tiene algo»: lo que se guarda y lo que se exporta
export function withoutBlankRows(records) {
    return records
        .filter(record => !isBlankRecord(record))
        .map(record => ({ ...record, process: record.process.filter(process => !isBlankProcess(process)) }));
}


// firstTrailingBlank = «dónde empiezan las mesas en blanco del final». Lo nuevo se mete ahí, delante.
function firstTrailingBlank(records) {
    let index = records.length;
    while (index > 0 && isBlankRecord(records[index - 1])) index--;
    return index;
}



// setRecordField = «anotar un dato de una mesa»
// La mesa recibe su fecha la primera vez que se le escribe algo: hasta entonces era una fila en blanco.
export function setRecordField(records, recordId, field, value, now = new Date()) {

    const index = records.findIndex(record => record.id === recordId);
    if (index === -1 || records[index][field] === value) return records;

    const next = [...records];
    next[index] = { ...records[index], [field]: value, date: records[index].date ?? now };
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
 */
export function applyTabletOrders(records, orders, now = new Date()) {

    if (!orders || orders.length === 0) return records;

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

    for (const order of orders) {
        if (isEmpty(order.clave)) continue;

        // fromTablet = «lo que lee la tablet ahora»: el número de ticket, el tipo de plato y las dos horas
        const fromTablet = {
            ticketNumber: order.ticket ?? '',
            dishType: DISH_TYPE_FROM_READING[order.tipo] ?? '',
            orderTaking: order.tomaOrden ?? '',
            markedReadyOnTablet: order.listoTablet ?? '',
        };

        //  1. YA ESTÁ EN UNA MESA
        if (tableOf.has(order.clave)) {
            const index = next.findIndex(record => record.id === tableOf.get(order.clave));
            const updated = updateFromTablet(next[index], order.clave, fromTablet);
            if (updated !== next[index]) change(index, updated);
            continue;
        }

        //  2. ES NUEVO
        const process = createProcess({ key: order.clave, ...fromTablet });
        const tableNumber = order.mesa || (order.ticket ? `#${order.ticket}` : '');

        // openIndex = «la mesa abierta con ese número»
        let openIndex = -1;
        for (let index = next.length - 1; index >= 0 && openIndex === -1; index--) {
            if (sameTable(next[index].tableNumber, tableNumber) && isEmpty(next[index].breakUp)) openIndex = index;
        }

        if (openIndex !== -1) {
            change(openIndex, { ...next[openIndex], process: [...next[openIndex].process, process] });
            tableOf.set(order.clave, next[openIndex].id);
            continue;
        }

        const record = createRecord({ date: now, tableNumber, process: [process] });
        if (next === records) next = [...records];
        next.splice(firstTrailingBlank(next), 0, record);
        tableOf.set(order.clave, record.id);
    }

    return next;
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


// appendBlankProcess = «añadir a una rotación un proceso en blanco», para anotarlo a mano
// Es lo que hace el botón «+» de la fila: un pedido que la tablet no vio, o que la IA no supo leer.
// En blanco no se guarda (withoutBlankRows): si nadie le escribe nada, al recargar ya no está.
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


// readRecords = «leer las mesas guardadas de un local»
// NUNCA lanza: sin nada guardado, o con el almacenamiento bloqueado, devuelve una lista vacía.
// Las mesas de más de RECORD_HOURS no vuelven: son de otro turno.
export function readRecords(localId, now = new Date()) {

    const key = storageKey(localId);
    if (!key) return [];

    try {
        const saved = JSON.parse(localStorage.getItem(key));
        if (!Array.isArray(saved)) return [];

        return saved
            .map(item => reviveRecord(item, now))
            .filter(record => now - record.date < RECORD_HOURS * 3600 * 1000);
    }
    catch {
        return [];
    }
}


// writeRecords = «guardar las mesas de un local». Sin las filas en blanco, y las MAX_RECORDS más recientes.
// NUNCA lanza: si el almacenamiento está lleno o bloqueado devuelve false.
export function writeRecords(localId, records) {

    const key = storageKey(localId);
    if (!key) return false;

    try {
        //  La fecha se guarda como texto (JSON no tiene fechas) y reviveRecord la vuelve a hacer Date.
        localStorage.setItem(key, JSON.stringify(withoutBlankRows(records).slice(-MAX_RECORDS)));
        return true;
    }
    catch (error) {
        console.log(error);
        return false;
    }
}


// reviveRecord = «una mesa leída del almacenamiento, otra vez con su forma»
// No se fía de lo guardado: cada campo se rellena aunque falte, y la fecha vuelve a ser una Date.
function reviveRecord(saved, now) {

    const record = createRecord();
    if (typeof saved?.id === 'string') record.id = saved.id;

    for (const field of ['tableNumber', ...RECORD_TIMES]) record[field] = String(saved?.[field] ?? '');

    const date = new Date(saved?.date ?? now);
    record.date = Number.isFinite(date.getTime()) ? date : now;

    record.process = (Array.isArray(saved?.process) ? saved.process : []).map(reviveProcess);
    return record;
}


// reviveProcess = «un proceso leído del almacenamiento, otra vez con su forma»
function reviveProcess(saved) {

    const process = createProcess();
    if (typeof saved?.id === 'string') process.id = saved.id;

    process.key = String(saved?.key ?? '');
    process.edited = Array.isArray(saved?.edited) ? saved.edited.filter(field => TABLET_FIELDS.includes(field)) : [];

    for (const field of PROCESS_FIELDS) process[field] = String(saved?.[field] ?? '');
    return process;
}
