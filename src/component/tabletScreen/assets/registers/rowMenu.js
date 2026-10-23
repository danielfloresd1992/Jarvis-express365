import { COLUMNS, PROCESS_COLUMNS } from './columns.js';
import { getTimeReport } from '../../../../libs/date_time/calculate_time.js';


/*  LO QUE OFRECE EL CLIC DERECHO EN UNA FILA DE MESAS (propuesta «C · Barra rápida», elegida por el usuario)
 *
 *  Las tres partes del menú (ContextMenu.jsx) tienen cada una su regla:
 *
 *      la barra   lo que se pulsó, en botones grandes: la celda, la mesa o el proceso
 *      la lista   lo demás; lo que destruye, al final y en rojo
 *      el pie     dónde se abrió, con el color de su columna
 *
 *  SEGÚN DÓNDE (menuTargetOf, en libs/tickets/menuTarget.js)
 *
 *      una hora, de la rotación o de un proceso   Editar · Ahora · Copiar · Pegar       │ Borrar la hora
 *      el ticket o el tipo de plato               Editar · Copiar · Pegar               │ Vaciar la celda
 *      una duración (se calcula: no se escribe)   —                                     │ Copiar · Reportar su demora
 *      la mesa, o la fila fuera de sus celdas     Proceso · Procesos · Toques · Guardar │ Reportar demora · Limpiar la fila
 *      un proceso, fuera de sus celdas            Listo en cocina · Entrega · Reportar  │ Marcada antes de estar listo ·
 *                                                                                         Borrar el proceso
 *
 *  Una celda de un proceso añade al final lo de su proceso: reportar su demora de preparación, «Marcada antes de estar
 *  listo» y borrarlo.
 *
 *  Lo que no se puede hacer sale apagado, con el porqué en su nota o al pasar el ratón: así se aprende dónde está
 *  cada cosa aunque hoy no toque. «Limpiar la fila» borra sin guardar, y pide un segundo clic.
 *
 *  Es una función pura: recibe lo que la fila sabe ('facts') y lo que sabe hacer ('actions') y devuelve las opciones.
 *  La llama useRowMenu (tabletScreen/hook), y la prueba va sin navegador.
 */


// CELLS = «cada celda del register»: su nombre para leer y de qué clase es
//   time      una hora: se edita, se pone la de ahora, se copia, se pega y se borra
//   text      un texto (el ticket, el tipo de plato): se edita, se copia, se pega y se vacía
//   duration  se calcula con dos horas: solo se copia (y su demora se reporta)
const CELLS = {
    hourOccupies:        { title: 'Ocupa', kind: 'time' },
    hourFirstAttention:  { title: 'Primera atención', kind: 'time' },
    attentionDuration:   { title: 'Duración de la primera atención', kind: 'duration' },
    breakUp:             { title: 'Desocupa', kind: 'time' },
    tableCleaning:       { title: 'Limpieza', kind: 'time' },
    cleaningDuration:    { title: 'Duración de la limpieza', kind: 'duration' },
    ticketNumber:        { title: 'Número de ticket', kind: 'text', edit: 'Editar el número de ticket' },
    dishType:            { title: 'Tipo de plato', kind: 'text', edit: 'Editar el tipo de plato' },
    orderTaking:         { title: 'Toma de orden', kind: 'time' },
    markedReadyOnTablet: { title: 'Listo en tablet', kind: 'time' },
    tabletDuration:      { title: 'Duración en tablet', kind: 'duration' },
    readyInTheKitchen:   { title: 'Listo en cocina', kind: 'time' },
    dishDelivery:        { title: 'Entrega de plato', kind: 'time' },
    deliveryDuration:    { title: 'Duración de la entrega', kind: 'duration' },
};

// CONFIRM_CLEAR = «lo que dice "Limpiar la fila" mientras espera el segundo clic»
const CONFIRM_CLEAR = '¿Seguro? Pulsa otra vez';

// ROTATION_COLOR / PROCESS_COLOR = «el punto del pie» de la mesa (su columna, oro) y de un proceso (el ticket, pizarra)
const ROTATION_COLOR = COLUMNS.find(column => column.id === 'tableNumber')?.color;
const PROCESS_COLOR = PROCESS_COLUMNS.find(column => column.id === 'ticketNumber')?.color;


// cellKindOf = «de qué clase es una celda»: 'time' | 'text' | 'duration'. Una que no esté en CELLS, texto.
export const cellKindOf = (column) => CELLS[column]?.kind ?? 'text';

// colorOf = «el color de una columna», de la rotación o de un proceso (columns.js)
const colorOf = (column) => [...COLUMNS, ...PROCESS_COLUMNS].find(item => item.id === column)?.color;

// join = «las partes del pie, separadas por puntos», sin las vacías
const join = (parts) => parts.filter(part => part !== '' && part !== null && part !== undefined && part !== false).join(' · ');

// plural = «un número con su palabra»: 1 proceso, 3 procesos
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

// durationBetween = «el tiempo entre dos horas», como lo calcula la línea de proceso; '' si falta alguna
const durationBetween = (from, to) => (from && to ? getTimeReport(from, to).timeTotal : '');

// tableName = «cómo se llama la fila en el pie»
const tableName = (record, facts) => (
    facts.free ? 'Fila libre'
        : facts.takeOut ? `Para llevar ${record.tableNumber}`
            : facts.noTable ? 'Mesa sin número'
                : `Mesa ${record.tableNumber}`
);

// ticketName = «cómo se llama un proceso en el pie y en su sección»
const ticketName = (process) => (String(process.ticketNumber ?? '').trim() ? `Ticket ${process.ticketNumber}` : 'Ticket sin número');


/*  rowMenuOf = «el menú de una fila, según dónde se abrió»
 *
 *  @param {object} target   lo que se pulsó (menuTargetOf): { kind, recordId, processId, column, element }
 *  @param {object} record   la rotación
 *  @param {object} facts    lo que la fila ya calculó:
 *      free, noTable, takeOut, finished, processesOpen, hasManagers   (booleans)
 *      attention, cleaning   { duration ('' sin calcular), late, reported }: sus dos demoras
 *      preparationOf(proceso) → { late, reported, limit, earlyMark }: la demora de preparación de un proceso ('earlyMark':
 *                            ya se reportó «Marcada antes de estar listo», y la de preparación no se pide)
 *  @param {object} actions  lo que la fila sabe hacer:
 *      editCell(target) · stamp(target) · copy(texto) · paste(target, clase) · clearCell(target)
 *      addProcess() · toggleProcesses() · openTouches() · save() · reportAttention() · reportCleaning() · clearRow()
 *      markProcess(proceso, campo) · reportPreparation(proceso) · reportEarlyMark(proceso) · deleteProcess(proceso)
 *  @returns {{ label, quick, items, footer }} lo que pinta ContextMenu, o null sin target
 */
export function rowMenuOf({ target, record, facts, actions }) {
    if (!target || !record) return null;

    // process = «el proceso de lo que se pulsó», si es de uno (y sigue existiendo)
    const process = target.processId ? record.process.find(item => item.id === target.processId) ?? null : null;

    //  La celda de la mesa es la rotación misma: su menú es el de la fila
    if (target.kind === 'cell' && target.column !== 'tableNumber' && (process || !target.processId)) {
        return cellMenu({ target, record, process, facts, actions });
    }

    if (target.kind === 'process' && process) return processMenu({ process, facts, actions });

    return rotationMenu({ record, facts, actions });
}


/*  LA FILA (la mesa, o cualquier sitio de la fila que no sea una celda)  */
function rotationMenu({ record, facts, actions }) {

    // count = «cuántos procesos tiene»
    const count = record.process.length;

    const quick = [
        {
            id: 'add-process', label: 'Añadir proceso', short: 'Proceso', icon: 'plus', tone: 'go',
            hint: facts.noTable ? 'Antes pide el número de mesa' : undefined,
            onSelect: () => actions.addProcess(),
        },
        {
            id: 'processes', label: facts.processesOpen ? 'Ocultar los procesos' : 'Ver los procesos', short: 'Procesos', icon: 'list',
            disabled: count === 0,
            hint: count === 0 ? 'Todavía no tiene procesos' : plural(count, 'proceso', 'procesos'),
            onSelect: () => actions.toggleProcesses(),
        },
        //  Sin gerentes en el local no hay toques; un pedido para llevar no los lleva
        ...(facts.hasManagers && !facts.takeOut ? [{
            id: 'touches', label: 'Ver los toques de gerente', short: 'Toques', icon: 'hand',
            disabled: facts.noTable,
            hint: facts.noTable ? 'Falta el número de mesa' : plural(record.touch?.length ?? 0, 'toque', 'toques'),
            onSelect: () => actions.openTouches(),
        }] : []),
        {
            id: 'save', label: 'Guardar la rotación', short: 'Guardar', icon: 'save', tone: facts.finished ? 'go' : undefined,
            disabled: facts.free,
            hint: facts.free ? 'La fila está libre: no hay nada que guardar' : facts.finished ? 'Terminada: es la que toca guardar' : undefined,
            onSelect: () => actions.save(),
        },
    ];

    const items = [
        //  Un pedido para llevar no tiene primera atención ni limpieza
        ...(facts.takeOut ? [] : [
            { type: 'section', label: 'Reportar demora' },
            reportItem('report-attention', 'De primera atención', facts.attention, actions.reportAttention),
            reportItem('report-cleaning', 'De limpieza', facts.cleaning, actions.reportCleaning),
            { type: 'separator' },
        ]),
        {
            id: 'clear-row', label: 'Limpiar la fila', icon: 'broom', danger: true, confirm: CONFIRM_CLEAR,
            disabled: facts.free,
            hint: facts.free ? 'La fila ya está libre' : 'La rotación se borra sin guardarse, con sus procesos y sus toques. No se puede deshacer.',
            onSelect: () => actions.clearRow(),
        },
    ];

    const footer = {
        color: ROTATION_COLOR,
        text: join([
            tableName(record, facts),
            record.hourOccupies && `ocupa ${String(record.hourOccupies).slice(0, 5)}`,
            count > 0 && plural(count, 'proceso', 'procesos'),
        ]),
    };

    return { label: `Opciones de la fila: ${tableName(record, facts)}`, quick, items, footer };
}


/*  UN PROCESO, fuera de sus celdas (la papelera, el icono de cocina, los huecos de la línea)  */
function processMenu({ process, facts, actions }) {

    // preparation = «cómo va su demora de preparación»
    const preparation = facts.preparationOf(process);

    const quick = [
        markItem('kitchen', 'Marcar listo en cocina', 'Listo en cocina', process, 'readyInTheKitchen', actions),
        markItem('delivery', 'Marcar entrega de plato', 'Entrega', process, 'dishDelivery', actions),
        { ...preparationItem(process, preparation, actions), short: 'Reportar', dot: preparation.late && !preparation.reported },
    ];

    const items = [
        earlyMarkItem(process, actions),
        { type: 'separator' },
        deleteProcessItem(process, actions),
    ];

    const footer = { color: PROCESS_COLOR, text: join([ticketName(process), process.dishType, process.orderTaking]) };

    return { label: `Opciones del proceso: ${ticketName(process)}`, quick, items, footer };
}


/*  UNA CELDA: una hora, el ticket, el tipo de plato o una duración  */
function cellMenu({ target, record, process, facts, actions }) {

    const cell = CELLS[target.column] ?? { title: target.column, kind: 'text' };
    const value = valueOf(target.column, record, process, facts);
    const empty = value === '';

    // where = «de quién es la celda»: su mesa o su ticket
    const where = process ? ticketName(process) : tableName(record, facts);

    const footer = { color: colorOf(target.column), text: join([where, cell.title, empty ? 'vacía' : value]) };
    const label = `Opciones de la celda: ${cell.title}`;

    // processItems = «lo de su proceso», al final de la lista, si la celda es de uno
    const processItems = process ? [
        { type: 'separator' },
        { type: 'section', label: ticketName(process) },
        preparationItem(process, facts.preparationOf(process), actions),
        earlyMarkItem(process, actions),
        deleteProcessItem(process, actions),
    ] : [];

    //  Una duración no se escribe: solo se copia, y desde ella se reporta su demora
    if (cell.kind === 'duration') {
        const items = [
            {
                id: 'copy', label: 'Copiar la duración', icon: 'copy', shortcut: 'Ctrl+C',
                disabled: empty, note: empty ? 'sin duración' : undefined,
                onSelect: () => actions.copy(value),
            },
            ...(target.column === 'attentionDuration' ? [reportItem('report-attention', 'Reportar la demora', facts.attention, actions.reportAttention)] : []),
            ...(target.column === 'cleaningDuration' ? [reportItem('report-cleaning', 'Reportar la demora', facts.cleaning, actions.reportCleaning)] : []),
            ...processItems,
        ];
        return { label, quick: [], items, footer };
    }

    // time = «es una hora»: lleva «Ahora», y sus atajos son los de la celda de hora (GridCells.jsx)
    const time = cell.kind === 'time';

    const quick = [
        {
            id: 'edit', label: cell.edit ?? 'Editar la hora', short: 'Editar', icon: 'pencil',
            shortcut: time && !empty ? 'Intro' : undefined,
            onSelect: () => actions.editCell(target),
        },
        ...(time ? [{
            id: 'now', label: 'Poner la hora de ahora', short: 'Ahora', icon: 'clock',
            shortcut: empty ? 'Intro' : undefined,
            hint: empty ? undefined : `Cambia ${value} por la hora de ahora`,
            onSelect: () => actions.stamp(target),
        }] : []),
        {
            id: 'copy', label: 'Copiar', short: 'Copiar', icon: 'copy', shortcut: 'Ctrl+C',
            disabled: empty, hint: empty ? 'La celda está vacía' : undefined,
            onSelect: () => actions.copy(value),
        },
        {
            id: 'paste', label: 'Pegar', short: 'Pegar', icon: 'paste', shortcut: 'Ctrl+V',
            hint: time ? 'Una hora copiada: 13:58:04, 9:05 o 135804' : undefined,
            onSelect: () => actions.paste(target, cell.kind),
        },
    ];

    const items = [
        {
            id: 'clear', label: time ? 'Borrar la hora' : 'Vaciar la celda', icon: 'eraser', danger: true,
            shortcut: time ? 'Retroceso' : undefined,
            disabled: empty,
            onSelect: () => actions.clearCell(target),
        },
        ...processItems,
    ];

    return { label, quick, items, footer };
}


// valueOf = «lo que dice una celda»: el dato de la rotación o del proceso, o la duración calculada. '' si está vacía.
function valueOf(column, record, process, facts) {
    if (column === 'attentionDuration') return facts.attention?.duration ?? '';
    if (column === 'cleaningDuration') return facts.cleaning?.duration ?? '';
    if (column === 'tabletDuration') return durationBetween(process?.orderTaking, process?.markedReadyOnTablet);
    if (column === 'deliveryDuration') return durationBetween(process?.readyInTheKitchen, process?.dishDelivery);
    return String((process ?? record)?.[column] ?? '');
}


// reportItem = «reportar la demora de primera atención o de limpieza»: solo si pasó del tiempo y no se ha reportado
function reportItem(id, label, state = {}, action) {
    const open = Boolean(state.late) && !state.reported;
    return {
        id, label, icon: 'flag', tone: 'report',
        disabled: !open,
        note: state.reported ? 'reportada' : state.late ? undefined : state.duration ? 'en tiempo' : 'sin duración',
        hint: open ? `Pasó del tiempo de referencia: ${state.duration}` : undefined,
        onSelect: () => action?.(),
    };
}

// markItem = «poner la hora de ahora en una hora de un proceso» (listo en cocina, entrega). Si ya tiene, apagada:
// para cambiarla está la celda
function markItem(id, label, short, process, field, actions) {
    const time = process[field] ?? '';
    return {
        id, label, short, icon: 'clock',
        disabled: time !== '',
        hint: time !== '' ? `Ya tiene hora: ${time}` : 'Con la hora de ahora',
        onSelect: () => actions.markProcess(process, field),
    };
}

// preparationItem = «reportar la demora de preparación de un proceso»: solo si pasó de su tiempo y no se ha reportado.
// Con «Marcada antes de estar listo» reportada ('earlyMark') ya no se pide: su tiempo en la tablet no es el real.
function preparationItem(process, preparation, actions) {
    const open = Boolean(preparation.late) && !preparation.reported;
    return {
        id: 'report-preparation', label: 'Reportar demora de preparación', icon: 'cloche', tone: 'report',
        disabled: !open,
        note: preparation.reported ? 'reportada'
            : preparation.earlyMark ? 'marcada antes'
                : preparation.late ? undefined : preparation.limit ? 'en tiempo' : 'sin tiempo',
        hint: preparation.reported ? 'Ya está reportada'
            : preparation.earlyMark ? 'Ya se reportó «Marcada antes de estar listo»: el tiempo de la tablet no es el real'
                : open ? 'Pasó de su tiempo de preparación'
                    : preparation.limit ? `Va en tiempo: su plato tiene ${preparation.limit}` : 'Su plato no tiene tiempo de preparación',
        onSelect: () => actions.reportPreparation(process),
    };
}

// earlyMarkItem = «reportar que el pedido se marcó en la tablet antes de estar listo en cocina» (pedido del usuario): el
// formulario «Marcada antes de estar listo» de Demoras, con el ticket, la mesa, el plato y las horas del proceso. Se
// puede mientras no esté reportada ('earlyMarkDelay'): la hora que le falte se escribe en el formulario.
function earlyMarkItem(process, actions) {
    const reported = Boolean(process.earlyMarkDelay);
    return {
        id: 'report-early-mark', label: 'Marcada antes de estar listo', icon: 'tap', tone: 'report',
        disabled: reported,
        note: reported ? 'reportada' : undefined,
        hint: reported ? 'Ya está reportada: lleva la bandera pirata en su duración'
            : 'Se sacó de la pantalla de la tablet antes de estar listo en cocina: abre su reporte con el ticket y las horas',
        onSelect: () => actions.reportEarlyMark(process),
    };
}

// deleteProcessItem = «borrar el proceso», como la papelera de su línea (que no pregunta)
function deleteProcessItem(process, actions) {
    return { id: 'delete-process', label: 'Borrar el proceso', icon: 'trash', danger: true, onSelect: () => actions.deleteProcess(process) };
}
