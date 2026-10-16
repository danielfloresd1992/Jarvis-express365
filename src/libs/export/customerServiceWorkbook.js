import { DISH_TYPES, isTakeOut } from '../tickets/tableRecords.js';


/*  LA HOJA DE CÁLCULO DE ATENCIÓN AL CLIENTE
 *
 *  Pasa lo que enseña la pestaña «Registros» —las rotaciones guardadas de UN día operativo, con sus
 *  procesos y sus toques de gerente— al Excel con el que se monitoreaba a mano («FORMATO NUEVO 2.3»),
 *  en un .xlsx de dos hojas:
 *
 *      «Datos Atencion al Cliente»   la tabla DtAtenClient: una fila por mesa, por proceso y por toque
 *      «Resumen»                     totales y promedios, con fórmulas sobre esa tabla
 *
 *  ══ DE PRINCIPIO A FIN ═════════════════════════════════════════════════════════════════════════════
 *
 *  Todo empieza en exportCustomerServiceWorkbook, al final del archivo. Da seis pasos, en orden, y cada
 *  uno recibe lo que devolvió el anterior:
 *
 *      STEP 1  buildDataRows(rotations, context)   las rotaciones → las filas, en palabras     PURA
 *                ├─ rotationRow                      la de la mesa (un pedido para llevar no la lleva)
 *                ├─ processRows                      una por proceso
 *                └─ touchRows                        una por toque de gerente
 *      STEP 2  buildTable(rows)                    las filas → los valores de Excel             PURA
 *                                                  (horas como fracción del día, duraciones como fórmula)
 *      STEP 3  buildSummary(table, context)        la tabla → las secciones del Resumen         PURA
 *      STEP 4  buildWorkbook(table, summary, …)    todo → el libro de Excel                     ExcelJS
 *                ├─ addDataSheet                     «Datos Atencion al Cliente»
 *                └─ addSummarySheet                  «Resumen»
 *      STEP 5  buildFileName(context)              'Atencion al cliente - <local> - <día>.xlsx' PURA
 *      STEP 6  downloadWorkbook(workbook, name)    el archivo, al navegador
 *
 *  Los pasos PUROS no tocan nada: reciben datos y devuelven datos, y se prueban solos (en Node).
 *
 *  ══ LO QUE HAY QUE SABER ═══════════════════════════════════════════════════════════════════════════
 *
 *  · DtAtenClient conserva las 27 columnas del Excel, con sus nombres y en su orden: así sus filas se
 *    pueden pegar en el libro de siempre. Las que la aplicación no anota van vacías (cada una dice por
 *    qué en DATA_COLUMNS). Detrás van cuatro nuevas —Ticket, Fila, Turno y Fecha—: el Excel no tenía
 *    fecha ni turno, y sin ellas los días se mezclaban.
 *
 *  · Las duraciones y el Resumen son FÓRMULAS, como en el Excel: si alguien corrige una hora, todo se
 *    recalcula. Y cada fórmula lleva ya su resultado calculado aquí (STEP 2 y STEP 3): Excel abre en
 *    vista protegida lo que se descarga, y ahí no calcula; sin el resultado, la hoja saldría en blanco.
 *
 *  · Se corrigen los fallos del Excel original: las duraciones que cruzan la medianoche ya no se pierden
 *    (MOD en vez de restar); «Duracion TM» tiene fórmula; los límites son los del local y no 3 y 4
 *    minutos fijos; la limpieza se mide con la Demora y no con la Espera; una mesa con B en medio
 *    (16B) ya no desaparece del recuento; y el total de platos cuenta todos los tipos.
 *
 *  · ExcelJS se carga en el STEP 4, la primera vez que alguien exporta: quien nunca exporta no paga
 *    su peso al abrir la aplicación.
 */



// ═══════════════════════════════════════ LA FORMA DEL LIBRO ═══════════════════════════════════════

// DATA_SHEET / SUMMARY_SHEET = «los nombres de las dos hojas», los del Excel (sin tilde, como allí)
const DATA_SHEET = 'Datos Atencion al Cliente';
const SUMMARY_SHEET = 'Resumen';

// DATA_TABLE = «el nombre de la tabla de datos», el del Excel: así sus fórmulas sirven tal cual
const DATA_TABLE = 'DtAtenClient';

// ROW_KIND = «qué es cada fila de la tabla»: lo que va en la columna «Fila»
const ROW_KIND = { rotation: 'Rotación', process: 'Proceso', touch: 'Toque' };

// SHIFT_NAMES = «el turno, como se lee»
const SHIFT_NAMES = { day: 'Diurno', night: 'Nocturno' };

// NUMBER_FORMATS = «cómo se ve cada tipo de número en Excel»
const NUMBER_FORMATS = {
    time: 'hh:mm:ss',
    duration: '[h]:mm:ss',
    date: 'dd/mm/yyyy',
    stamp: 'dd/mm/yyyy hh:mm',
    count: '0',
};

// Las letras: Arial en todo el libro
const FONT = { name: 'Arial', size: 10 };
const BOLD_FONT = { ...FONT, bold: true };
const HEADER_FONT = { ...FONT, bold: true, color: { argb: 'FFFFFFFF' } };
const TITLE_FONT = { name: 'Arial', size: 14, bold: true };

// SECTION_FILL = «el fondo de los títulos de sección del Resumen»
const SECTION_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDEBF7' } };

// DEFAULT_WIDTH = «el ancho de una columna de la tabla que no dice otro»
const DEFAULT_WIDTH = 11;

// LIMIT_CELLS = «dónde están los dos límites del local en el Resumen»: las fórmulas los miran ahí
// (ver addSummarySheet), así que cambiar un límite en la hoja recalcula sus «fuera de límite».
const LIMIT_CELLS = { attention: '$C$6', cleaning: '$C$7' };


/*  DATA_COLUMNS = «las columnas de DtAtenClient», en su orden
 *
 *      name      el título, tal cual en el Excel. Es también la clave de cada fila de buildDataRows.
 *      format    'time' (una hora), 'duration' (una resta, que es fórmula), 'date', o nada (texto)
 *      from/to   solo las duraciones: de qué columna a qué columna
 *      width     el ancho, si no es DEFAULT_WIDTH
 *      center    centrada: la mesa y el ticket mezclan números (32) y textos (16B, #14), y cada uno se
 *                alinearía a un lado
 */
const DATA_COLUMNS = [

    // ── La rotación de la mesa ──
    { name: 'Mesa', width: 9, center: true },
    { name: 'Ocupada', format: 'time' },
    { name: 'Protocolo', width: 10 },                    // «Ubicado_Host» (SI/NO): la aplicación no lo anota
    { name: 'Atencion', format: 'time' },
    { name: 'Espera', format: 'duration', from: 'Ocupada', to: 'Atencion' },
    { name: 'Desocupa', format: 'time' },
    { name: 'Despedida', width: 10 },                    // «Despedido_Host» (SI/NO): tampoco se anota
    { name: 'Limpieza', format: 'time' },
    { name: 'Demora', format: 'duration', from: 'Desocupa', to: 'Limpieza' },
    { name: 'Operador', width: 22 },

    // ── Un proceso: un pedido de la mesa ──
    { name: 'Proceso', width: 13 },
    { name: 'Orden', format: 'time' },
    { name: 'Tablet', format: 'time' },
    { name: 'Cocina', format: 'time' },
    { name: 'Entrega', format: 'time' },
    { name: 'Preparacion', format: 'duration', from: 'Orden', to: 'Tablet', width: 12 },
    { name: 'TiempoEntrega', format: 'duration', from: 'Cocina', to: 'Entrega', width: 14 },
    { name: 'DemoraTotal', format: 'duration', from: 'Orden', to: 'Entrega', width: 12 },

    // ── Un toque de gerente ──
    { name: 'Toque' },                                   // PT / OT: la aplicación no distingue el tipo
    { name: 'Gerente', width: 13 },
    { name: 'InicioTG', format: 'time' },
    { name: 'FinalizoTG', format: 'time' },              // un toque de la aplicación tiene una sola hora
    { name: 'Duracion TG', format: 'duration', from: 'InicioTG', to: 'FinalizoTG', width: 12 },

    // ── El uso de baño: la aplicación no lo anota; las columnas quedan para pegar en el Excel ──
    { name: 'InicioTM', format: 'time' },
    { name: 'FinalizoTM', format: 'time' },
    { name: 'Duracion TM', format: 'duration', from: 'InicioTM', to: 'FinalizoTM', width: 12 },
    { name: 'Zona' },                                    // en el Excel nadie la rellenaba

    // ── Las nuevas: lo que el Excel no tenía ──
    { name: 'Ticket', center: true },
    { name: 'Fila' },                                    // ROW_KIND: Rotación, Proceso o Toque
    { name: 'Turno' },
    { name: 'Fecha', format: 'date' },                   // el día operativo (de 08:00 a 07:00)
];



// ═══════════════════════════════════════ AYUDANTES ═══════════════════════════════════════

// timeValue = «una hora 'HH:MM:SS' como la guarda Excel»: la fracción del día (12:00:00 → 0,5).
// null si no hay hora, o si lo escrito no es una hora.
function timeValue(text) {
    const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(text ?? '').trim());
    if (!match) return null;

    const [, hours, minutes, seconds = '0'] = match;
    return (Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)) / 86400;
}

// dateValue = «un día 'AAAA-MM-DD' como Date»: la medianoche UTC, que ExcelJS escribe tal cual.
// null si no es un día.
function dateValue(day) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(day ?? ''));
    if (!match) return null;

    const [, year, month, date] = match;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(date)));
}

// wallClock = «la hora de este equipo, como la vería alguien mirando el reloj»
// ExcelJS escribe las fechas en UTC: sin esto, la hora de exportación saldría corrida 4 horas.
const wallClock = (date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));

// textOrNumber = «una mesa o un ticket como valor de Excel»: '32' → 32 (sin el aviso de «número
// guardado como texto»), '16B' y '#14' se quedan como texto
const textOrNumber = (value) => (/^\d+$/.test(String(value)) ? Number(value) : String(value));

// operatorName = «nombre y apellido de quien guardó la rotación»: '' si la API no lo trajo poblado
const operatorName = (user) => [user?.name, user?.surName].filter(Boolean).join(' ');

// lower = «un valor como texto en minúsculas»: COUNTIFS no distingue mayúsculas, y aquí tampoco
const lower = (value) => String(value ?? '').toLowerCase();

// isBlank = «la celda está vacía»
const isBlank = (value) => value === null || value === undefined || value === '';

// escapeText = «un texto dentro de una fórmula»: las comillas se doblan
const escapeText = (text) => String(text).replace(/"/g, '""');

// columnRef / thisRowRef = «una columna entera de la tabla» y «la celda de esta fila», en una fórmula
const columnRef = (name) => `${DATA_TABLE}[${name}]`;
const thisRowRef = (name) => `${DATA_TABLE}[[#This Row],[${name}]]`;

// operationalSeconds = «los segundos del día operativo de una hora», para ordenar: el día abre a las
// 08:00, así que lo de la madrugada va después de la noche. null si no hay hora.
function operationalSeconds(text) {
    const fraction = timeValue(text);
    if (fraction === null) return null;

    const seconds = Math.round(fraction * 86400);
    return seconds < 8 * 3600 ? seconds + 86400 : seconds;
}

// startOf = «cuándo empezó una rotación»: la hora de Ocupa, o la toma de orden de su primer proceso si
// es un pedido para llevar (no tiene Ocupa)
const startOf = (rotation) => operationalSeconds(rotation.hourOccupies) ?? operationalSeconds(rotation.process?.[0]?.orderTaking);

// sortByStart = «las rotaciones en el orden en que empezaron»; las que no dicen cuándo, al final
function sortByStart(rotations) {
    return [...rotations].sort((first, second) => (startOf(first) ?? Infinity) - (startOf(second) ?? Infinity));
}

// valueOf = «lo que vale una celda de la tabla»: si es una fórmula, su resultado
const valueOf = (cell) => (cell !== null && typeof cell === 'object' && 'formula' in cell ? cell.result : cell);



// ═══════════════════════════════════════ STEP 1 · LAS FILAS ═══════════════════════════════════════

/*  buildDataRows = «las rotaciones → las filas de DtAtenClient»
 *
 *  Por cada rotación, en el orden en que empezaron: su fila de mesa, una fila por proceso y una por
 *  toque. Como en el Excel, cada fila rellena solo su parte; todas llevan la mesa, y además el turno y
 *  el día (las columnas nuevas). Los valores van EN PALABRAS ('10:51:27'): el STEP 2 los pasa a Excel.
 *
 *  Un pedido para llevar no es una rotación —no hubo mesa ocupada—: no lleva fila de mesa, solo las de
 *  sus procesos, con el '#ticket' en «Mesa».
 *
 *  @param {Array}  rotations  las rotaciones, tal como las devuelve la API (GET /rotation)
 *  @param {object} context    { day: 'AAAA-MM-DD' } — el día operativo, por si una rotación no trae el suyo
 *  @returns {Array} filas: [{ Mesa: '32', Fila: 'Rotación', Ocupada: '10:51:27', … }]
 */
function buildDataRows(rotations, context) {
    const rows = [];

    for (const rotation of sortByStart(rotations ?? [])) {

        // shared = «lo que llevan todas las filas de esta rotación»
        const shared = {
            Mesa: rotation.tableNumber,
            Turno: SHIFT_NAMES[rotation.shift] ?? '',
            Fecha: String(rotation.operationalDate ?? context.day ?? '').slice(0, 10),
        };

        if (!isTakeOut(rotation)) rows.push(rotationRow(rotation, shared));
        rows.push(...processRows(rotation, shared));
        rows.push(...touchRows(rotation, shared));
    }

    return rows;
}

// rotationRow = «la fila de la mesa»: sus cuatro horas y quién la guardó
const rotationRow = (rotation, shared) => ({
    ...shared,
    Fila: ROW_KIND.rotation,
    Ocupada: rotation.hourOccupies,
    Atencion: rotation.hourFirstAttention,
    Desocupa: rotation.breakUp,
    Limpieza: rotation.tableCleaning,
    Operador: operatorName(rotation.createdBy),
});

// processRows = «una fila por proceso»: el tipo de plato, el ticket y sus cuatro horas
const processRows = (rotation, shared) => (rotation.process ?? []).map(process => ({
    ...shared,
    Fila: ROW_KIND.process,
    Ticket: process.ticketNumber,
    Proceso: process.dishType,
    Orden: process.orderTaking,
    Tablet: process.markedReadyOnTablet,
    Cocina: process.readyInTheKitchen,
    Entrega: process.dishDelivery,
}));

// touchRows = «una fila por toque de gerente»: su placa y su hora
const touchRows = (rotation, shared) => (rotation.touch ?? []).map(touch => ({
    ...shared,
    Fila: ROW_KIND.touch,
    Gerente: touch.name,
    InicioTG: touch.hourTouch,
}));



// ═══════════════════════════════════════ STEP 2 · LOS VALORES DE EXCEL ═══════════════════════════════════════

/*  buildTable = «las filas → los valores que van en cada celda de DtAtenClient»
 *
 *  Cada fila pasa a ser un objeto con una clave por columna (las de DATA_COLUMNS), con lo que Excel
 *  guarda: una hora, como fracción del día; un día, como Date; una mesa de solo cifras, como número; y
 *  una duración, como FÓRMULA con su resultado ya calculado ({ formula, result }).
 *
 *  @param {Array} rows  las de buildDataRows
 *  @returns {Array} [{ Mesa: 32, Ocupada: 0.452…, Espera: { formula: 'IF(…)', result: 0.0000… }, … }]
 */
function buildTable(rows) {
    return rows.map(row => {

        // cells = «las celdas de esta fila», columna a columna
        const cells = {};

        for (const column of DATA_COLUMNS) {
            cells[column.name] = column.format === 'duration'
                ? durationCell(column, cells)
                : plainCell(column, row[column.name]);
        }

        return cells;
    });
}

// plainCell = «lo que va en una celda que no es fórmula», según el formato de su columna
function plainCell(column, value) {
    if (isBlank(value)) return null;
    if (column.format === 'time') return timeValue(value) ?? String(value);   // una hora mal escrita se ve tal cual
    if (column.format === 'date') return dateValue(value);
    if (column.name === 'Mesa' || column.name === 'Ticket') return textOrNumber(value);
    return String(value);
}

/*  durationCell = «una duración»: la fórmula y su resultado
 *
 *      IF(AND(ISNUMBER(desde), ISNUMBER(hasta)), MOD(hasta − desde, 1), "")
 *
 *  Vacía si falta alguna de las dos horas. MOD y no la resta a secas: de 23:58 a 00:03 son 5 minutos,
 *  y en el Excel original (TiempoTotal) esa duración desaparecía. Como las columnas van en orden, las
 *  dos horas de la duración ya están en 'cells' cuando se calcula.
 */
function durationCell(column, cells) {
    const from = thisRowRef(column.from);
    const to = thisRowRef(column.to);

    const start = cells[column.from];
    const end = cells[column.to];
    const result = typeof start === 'number' && typeof end === 'number' ? (((end - start) % 1) + 1) % 1 : '';

    return { formula: `IF(AND(ISNUMBER(${from}),ISNUMBER(${to})),MOD(${to}-${from},1),"")`, result };
}



// ═══════════════════════════════════════ STEP 3 · EL RESUMEN ═══════════════════════════════════════

/*  CÓMO SE ESCRIBE UNA CIFRA DEL RESUMEN
 *
 *  Cada cifra se describe UNA vez, con criterios —[columna, regla, texto]—, y de esa descripción salen
 *  las dos cosas: la fórmula de Excel (COUNTIFS, AVERAGEIFS…) y su resultado, calculado aquí sobre la
 *  misma tabla. Así no pueden decir cosas distintas.
 *
 *  RULES = «las reglas de un criterio»: cómo se escribe en la fórmula y cómo se comprueba aquí.
 */
const RULES = {
    is: { criterion: (text) => `"${escapeText(text)}"`, test: (value, text) => lower(value) === lower(text) },
    startsWith: { criterion: (text) => `"${escapeText(text)}*"`, test: (value, text) => lower(value).startsWith(lower(text)) },
    notStartsWith: { criterion: (text) => `"<>${escapeText(text)}*"`, test: (value, text) => !lower(value).startsWith(lower(text)) },
    isBlank: { criterion: () => '""', test: (value) => isBlank(value) },
    notBlank: { criterion: () => '"<>"', test: (value) => !isBlank(value) },
};

// matching = «las filas de la tabla que cumplen todos los criterios»
const matching = (table, criteria) => table.filter(row => criteria.every(([name, rule, text]) => RULES[rule].test(valueOf(row[name]), text)));

// criteriaFormula = «los criterios, en el orden en que los pide COUNTIFS»: 'DtAtenClient[Fila],"Proceso",…'
const criteriaFormula = (criteria) => criteria.map(([name, rule, text]) => `${columnRef(name)},${RULES[rule].criterion(text)}`).join(',');

// numbersOf = «los números de una columna, en las filas dadas»: AVERAGE y COUNT ignoran lo demás
const numbersOf = (rows, name) => rows.map(row => valueOf(row[name])).filter(value => typeof value === 'number');

// average = «la media», o '-' si no hay ninguna (lo mismo que dice IFERROR en la fórmula)
const average = (numbers) => (numbers.length > 0 ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : '-');


/*  measure = «las cuatro clases de cifra del Resumen», sobre una tabla y con los límites del local
 *
 *      count(criterios)                     cuántas filas cumplen                 COUNTIFS
 *      countNumbers(columna)                cuántas filas tienen número ahí       COUNT
 *      averageOf(columna, criterios)        la media de la columna                AVERAGE / AVERAGEIFS
 *      countAbove(columna, límite)          cuántas pasan del límite del local    COUNTIF(…, ">"&límite)
 *
 *  Cada una devuelve una celda: { formula, result, format }.
 */
function measure(table, limits) {
    return {
        count: (criteria) => ({
            formula: `COUNTIFS(${criteriaFormula(criteria)})`,
            result: matching(table, criteria).length,
            format: 'count',
        }),

        countNumbers: (name) => ({
            formula: `COUNT(${columnRef(name)})`,
            result: numbersOf(table, name).length,
            format: 'count',
        }),

        averageOf: (name, criteria = []) => ({
            formula: criteria.length > 0
                ? `IFERROR(AVERAGEIFS(${columnRef(name)},${criteriaFormula(criteria)}),"-")`
                : `IFERROR(AVERAGE(${columnRef(name)}),"-")`,
            result: average(numbersOf(matching(table, criteria), name)),
            format: 'duration',
        }),

        countAbove: (name, limit) => ({
            formula: `COUNTIF(${columnRef(name)},">"&${LIMIT_CELLS[limit]})`,
            result: limits[limit] === null ? 0 : numbersOf(table, name).filter(value => value > limits[limit]).length,
            format: 'count',
        }),
    };
}


/*  buildSummary = «la tabla → las secciones del Resumen»
 *
 *  Cada sección: { title, header (los títulos de sus columnas de cifras, si tiene más de una), lines }
 *  y cada línea: { label, cells: [celda de measure, …] }. Dónde va cada cosa lo decide addSummarySheet.
 *
 *  @param {Array}  table    la de buildTable
 *  @param {object} context  { attentionLimit, cleaningLimit } — los límites del local, 'HH:MM:SS'
 */
function buildSummary(table, context) {

    const limits = { attention: timeValue(context.attentionLimit), cleaning: timeValue(context.cleaningLimit) };
    const { count, countNumbers, averageOf, countAbove } = measure(table, limits);

    // Los criterios que se repiten
    const isRotation = ['Fila', 'is', ROW_KIND.rotation];
    const isProcess = ['Fila', 'is', ROW_KIND.process];
    const isTouch = ['Fila', 'is', ROW_KIND.touch];

    // dishTypes = «los tipos de plato»: los de la lista de la aplicación y, detrás, cualquier otro que
    // venga en los datos (de antes de que la lista cambiara). Así la suma de las líneas da el total.
    const listed = new Set(DISH_TYPES.map(lower));
    const extraTypes = [...new Set(matching(table, [isProcess]).map(row => valueOf(row.Proceso)).filter(type => !isBlank(type) && !listed.has(lower(type))))];
    const dishTypes = [...DISH_TYPES, ...extraTypes];

    // managers = «los gerentes que tocaron alguna mesa», por su placa (G1, G2, A1…)
    const managers = [...new Set(matching(table, [isTouch]).map(row => String(valueOf(row.Gerente) ?? '')).filter(Boolean))]
        .sort((first, second) => first.localeCompare(second, 'es', { numeric: true }));

    // processLine = «la línea de un tipo de plato»: cuántos y sus tres tiempos medios
    const processLine = (label, criteria) => ({
        label,
        cells: [count(criteria), averageOf('Preparacion', criteria), averageOf('TiempoEntrega', criteria), averageOf('DemoraTotal', criteria)],
    });

    return [
        {
            title: 'Rotaciones',
            lines: [
                { label: 'En sala', cells: [count([isRotation, ['Mesa', 'notStartsWith', 'B']])] },
                { label: 'En barra (mesas que empiezan por B)', cells: [count([isRotation, ['Mesa', 'startsWith', 'B']])] },
                { label: 'Total de rotaciones', cells: [count([isRotation])] },
                { label: 'Procesos para llevar (no cuentan como rotación)', cells: [count([isProcess, ['Mesa', 'startsWith', '#']])] },
            ],
        },
        {
            title: 'Primera atención',
            lines: [
                { label: 'Mesas atendidas', cells: [countNumbers('Espera')] },
                { label: 'Tiempo medio de espera', cells: [averageOf('Espera')] },
                { label: 'Fuera del límite del local', cells: [countAbove('Espera', 'attention')] },
                { label: 'Rotaciones sin primera atención', cells: [count([isRotation, ['Atencion', 'isBlank']])] },
            ],
        },
        {
            title: 'Limpieza',
            lines: [
                { label: 'Mesas limpiadas', cells: [countNumbers('Demora')] },
                { label: 'Tiempo medio de limpieza', cells: [averageOf('Demora')] },
                { label: 'Fuera del límite del local', cells: [countAbove('Demora', 'cleaning')] },
                { label: 'Desocupadas sin limpiar', cells: [count([isRotation, ['Desocupa', 'notBlank'], ['Limpieza', 'isBlank']])] },
            ],
        },
        {
            title: 'Procesos por tipo de plato',
            header: ['Cantidad', 'Preparación', 'Entrega', 'Tiempo total'],
            lines: [
                ...dishTypes.map(type => processLine(type, [isProcess, ['Proceso', 'is', type]])),
                processLine('Sin tipo', [isProcess, ['Proceso', 'isBlank']]),
                processLine('Total', [isProcess]),
            ],
        },
        {
            title: 'Toques de gerente',
            lines: [
                ...managers.map(manager => ({ label: manager, cells: [count([isTouch, ['Gerente', 'is', manager]])] })),
                { label: 'Total', cells: [count([isTouch])] },
            ],
        },
    ];
}



// ═══════════════════════════════════════ STEP 4 · EL LIBRO ═══════════════════════════════════════

/*  buildWorkbook = «todo → el libro de Excel», con sus dos hojas
 *
 *  Aquí ya no se decide nada de los datos: solo dónde va cada cosa y cómo se ve. ExcelJS se carga aquí,
 *  la primera vez que se exporta.
 *
 *  @param {Array}  table    la de buildTable
 *  @param {Array}  summary  la de buildSummary
 *  @param {object} context  { establishmentName, day, attentionLimit, cleaningLimit, exportedAt }
 *  @returns {Promise<object>} el libro de ExcelJS, listo para escribirse
 */
async function buildWorkbook(table, summary, context) {

    // ExcelJS es CommonJS: según quién lo empaquete (Vite en desarrollo, Rollup al compilar, Node en las
    // pruebas) llega en 'default' o suelto. Se aceptan las dos formas.
    const loaded = await import('exceljs');
    const ExcelJS = loaded.default ?? loaded;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Jarvis Express';
    workbook.created = context.exportedAt;

    //  Las fórmulas llevan su resultado, pero que Excel las vuelva a calcular al abrir (fuera de la
    //  vista protegida): si alguien corrige una hora, que el resto se ponga al día.
    workbook.calcProperties.fullCalcOnLoad = true;

    addDataSheet(workbook, table);
    addSummarySheet(workbook, summary, context);

    return workbook;
}


/*  addDataSheet = «la hoja de datos»: la tabla DtAtenClient, con la cabecera fija arriba
 *
 *  Una tabla de Excel no puede quedarse sin filas: si no hay ninguna, va una vacía.
 */
function addDataSheet(workbook, table) {
    const sheet = workbook.addWorksheet(DATA_SHEET, {
        views: [{ state: 'frozen', ySplit: 1 }],
        //  Al imprimir: apaisada y todas las columnas en el ancho de la hoja
        pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    const rows = table.length > 0 ? table : [{}];

    sheet.addTable({
        name: DATA_TABLE,
        ref: 'A1',
        headerRow: true,
        style: { theme: 'TableStyleMedium2', showRowStripes: true },
        columns: DATA_COLUMNS.map(column => ({ name: column.name, filterButton: true })),
        rows: rows.map(cells => DATA_COLUMNS.map(column => cells[column.name] ?? null)),
    });

    //  Ancho, letra y formato, columna a columna
    DATA_COLUMNS.forEach((column, index) => {
        const sheetColumn = sheet.getColumn(index + 1);
        sheetColumn.width = column.width ?? DEFAULT_WIDTH;

        sheetColumn.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
            cell.font = rowNumber === 1 ? HEADER_FONT : FONT;
            if (rowNumber > 1 && NUMBER_FORMATS[column.format]) cell.numFmt = NUMBER_FORMATS[column.format];
            if (rowNumber > 1 && column.center) cell.alignment = { horizontal: 'center' };
        });
    });
}


/*  addSummarySheet = «la hoja del Resumen»
 *
 *      B1        el título
 *      B3:C7     el local, el día, cuándo se exportó y los dos límites del local (LIMIT_CELLS: las
 *                fórmulas de «fuera del límite» los leen de ahí)
 *      B9…       las secciones de buildSummary, una debajo de otra: su título, los títulos de sus
 *                columnas si tiene varias, y sus líneas (la etiqueta en B, las cifras desde C)
 */
function addSummarySheet(workbook, summary, context) {
    const sheet = workbook.addWorksheet(SUMMARY_SHEET, {
        //  Al imprimir: las cinco columnas en el ancho de la hoja
        pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    //  La C, más ancha que las otras cifras: lleva también la fecha y hora de la exportación
    sheet.getColumn(1).width = 2;
    sheet.getColumn(2).width = 46;
    sheet.getColumn(3).width = 18;
    for (const column of [4, 5, 6]) sheet.getColumn(column).width = 14;

    // put = «escribir una celda», con la letra de la hoja y, si lo tiene, su formato
    const put = (address, value, { font = FONT, format } = {}) => {
        const cell = sheet.getCell(address);
        cell.value = value;
        cell.font = font;
        if (format) cell.numFmt = NUMBER_FORMATS[format];
        return cell;
    };

    // La cabecera
    put('B1', 'Resumen de atención al cliente', { font: TITLE_FONT });
    put('B3', 'Local', { font: BOLD_FONT });
    put('C3', context.establishmentName || '(sin local)');
    put('B4', 'Día operativo (de 08:00 a 07:00)', { font: BOLD_FONT });
    put('C4', dateValue(context.day), { format: 'date' });
    put('B5', 'Exportado', { font: BOLD_FONT });
    put('C5', wallClock(context.exportedAt), { format: 'stamp' });
    put('B6', 'Límite de primera atención del local', { font: BOLD_FONT });
    put('C6', timeValue(context.attentionLimit), { format: 'time' });
    put('B7', 'Límite de limpieza del local', { font: BOLD_FONT });
    put('C7', timeValue(context.cleaningLimit), { format: 'time' });

    // Las secciones, una debajo de otra, con una fila en blanco entre ellas
    let rowNumber = 9;

    for (const section of summary) {

        const title = put(`B${rowNumber}`, section.title, { font: BOLD_FONT });
        title.fill = SECTION_FILL;
        (section.header ?? []).forEach((text, index) => {
            const cell = sheet.getCell(rowNumber, 3 + index);
            cell.value = text;
            cell.font = BOLD_FONT;
            cell.fill = SECTION_FILL;
        });
        rowNumber += 1;

        for (const line of section.lines) {
            put(`B${rowNumber}`, line.label);
            line.cells.forEach((cell, index) => {
                const target = sheet.getCell(rowNumber, 3 + index);
                target.value = { formula: cell.formula, result: cell.result };
                target.font = FONT;
                target.numFmt = NUMBER_FORMATS[cell.format];
                target.alignment = { horizontal: 'right' };
            });
            rowNumber += 1;
        }

        rowNumber += 1;
    }
}



// ═══════════════════════════════════════ STEP 5 · EL NOMBRE ═══════════════════════════════════════

// buildFileName = «el nombre del archivo»: 'Atencion al cliente - Francisca Doral - 2026-10-15.xlsx'
// Sin los caracteres que Windows no deja en un nombre de archivo.
function buildFileName(context) {
    const local = String(context.establishmentName || 'sin local').replace(/[\\/:*?"<>|]+/g, ' ').trim();
    return `Atencion al cliente - ${local} - ${context.day || 'sin fecha'}.xlsx`;
}



// ═══════════════════════════════════════ STEP 6 · LA DESCARGA ═══════════════════════════════════════

// XLSX_TYPE = «el tipo de archivo de un .xlsx»
const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// downloadWorkbook = «el libro → un archivo descargado»: se escribe en memoria y se descarga con un
// enlace que se pulsa solo (en la aplicación de escritorio va a la carpeta de descargas)
async function downloadWorkbook(workbook, fileName) {
    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buffer], { type: XLSX_TYPE }));

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();

    //  Se suelta en la vuelta siguiente: soltarla en el acto puede cortar la descarga
    setTimeout(() => URL.revokeObjectURL(url), 0);
}



// ═══════════════════════════════════════ EL PUNTO DE PARTIDA ═══════════════════════════════════════

/*  exportCustomerServiceWorkbook = «exportar a Excel lo de la pestaña Registros»
 *
 *  Lo llama el botón «Exportar» de esa pestaña (Registers → RegisterSaved → ExportExcelButton).
 *
 *  @param {Array}  rotations          las rotaciones guardadas del día, tal como las devuelve la API
 *  @param {string} day                el día operativo, 'AAAA-MM-DD'
 *  @param {string} establishmentName  el local
 *  @param {string} attentionLimit     su límite de primera atención, 'HH:MM:SS'
 *  @param {string} cleaningLimit      su límite de limpieza, 'HH:MM:SS'
 *  @param {Date}   now                cuándo se exporta (para las pruebas; por defecto, ahora)
 *  @returns {Promise<{ fileName, rows }>} el nombre del archivo y cuántas filas lleva la tabla.
 *           Rechaza si algo falla (por ejemplo, si no carga ExcelJS): quien llama lo enseña.
 */
async function exportCustomerServiceWorkbook({ rotations, day, establishmentName, attentionLimit, cleaningLimit, now = new Date() }) {

    // context = «lo que necesitan los pasos además de los datos»
    const context = { day, establishmentName, attentionLimit, cleaningLimit, exportedAt: now };

    const rows = buildDataRows(rotations, context);                  // STEP 1 · las filas
    const table = buildTable(rows);                                  // STEP 2 · los valores de Excel
    const summary = buildSummary(table, context);                    // STEP 3 · el Resumen
    const workbook = await buildWorkbook(table, summary, context);   // STEP 4 · el libro
    const fileName = buildFileName(context);                         // STEP 5 · el nombre

    await downloadWorkbook(workbook, fileName);                      // STEP 6 · la descarga

    return { fileName, rows: rows.length };
}



export { exportCustomerServiceWorkbook, buildDataRows, buildTable, buildSummary, buildWorkbook, buildFileName, DATA_COLUMNS };
