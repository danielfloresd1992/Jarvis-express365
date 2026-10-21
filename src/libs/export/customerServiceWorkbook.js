import { isTakeOut } from '../tickets/tableRecords.js';
import { deliverWorkbook } from './deliverWorkbook.js';


/*  LA HOJA DE CÁLCULO DE ATENCIÓN AL CLIENTE
 *
 *  Pasa lo que enseña la pestaña «Registros» —las rotaciones guardadas de UN día operativo, con sus
 *  procesos y sus toques de gerente— al Excel con el que se monitoreaba a mano («FORMATO NUEVO 2.3»),
 *  con SU MISMO ASPECTO: los mismos anchos, altos, fuentes, rellenos, bordes y celdas combinadas que
 *  «RF58-D-10-09-26 VERIFICADO.xlsm», de donde se copiaron celda a celda.
 *
 *      «Datos Atencion al Cliente»   la tabla DtAtenClient: una fila por mesa, por proceso y por toque
 *      «Resumen»                     la plantilla verde del original, con fórmulas sobre esa tabla
 *
 *  ══ DE PRINCIPIO A FIN ═════════════════════════════════════════════════════════════════════════════
 *
 *  Todo empieza en exportCustomerServiceWorkbook, al final del archivo, que da estos pasos en orden:
 *
 *      STEP 0  pickShift(rotations, shift)         las del turno elegido: todas, diurno o nocturno PURA
 *      STEP 1  buildDataRows(rotations, context)   las rotaciones → las filas, en palabras     PURA
 *                ├─ rotationRow                      la de la mesa (un pedido para llevar no la lleva)
 *                ├─ processRows                      una por proceso
 *                └─ touchRows                        una por toque: PT el primero, OT los demás
 *      STEP 2  buildTable(rows)                    las filas → los valores de Excel             PURA
 *      STEP 3  buildSummary(table, context)        la tabla → las cifras del Resumen, por celda PURA
 *      STEP 4  buildWorkbook(table, summary, …)    todo → el libro, con el aspecto del original  ExcelJS
 *                ├─ addDataSheet                     «Datos Atencion al Cliente»
 *                └─ addSummarySheet                  «Resumen»: la plantilla y, encima, las cifras
 *      STEP 5  finishWorkbook(workbook)            el libro → el archivo, con lo que ExcelJS no sabe hacer:
 *                                                  las filas sobrantes del Resumen ocultas y las columnas
 *                                                  calculadas de la tabla
 *      STEP 6  buildFileName(context)              'Atencion al cliente - <local> - <día>[ - <turno>][ - <quién>].xlsx' PURA
 *      STEP 7  deliverWorkbook(buffer, name, …)    el archivo, a su carpeta del NAS (con la aplicación de
 *                                                  escritorio: nasFolder.js la busca) o, si no, descargado
 *
 *  ══ LO QUE HAY QUE SABER ═══════════════════════════════════════════════════════════════════════════
 *
 *  · DtAtenClient conserva las 27 columnas del Excel, con sus nombres, su orden y su aspecto: así sus
 *    filas se pueden pegar en el libro de siempre. Detrás van cuatro nuevas —Ticket, Fila, Turno y
 *    Fecha—: el Excel no tenía fecha ni turno, y sin ellas los días se mezclaban.
 *
 *  · PT Y OT. La aplicación no pregunta el tipo de cada toque, pero el original deja claro qué es: un
 *    OT siempre sigue a un PT en la misma mesa (la 10: PT a las 12:20, OT a las 12:28 y a las 12:53).
 *    PT es el PRIMER toque de la rotación y OT cada uno de los siguientes, y así se escribe (touchRows).
 *
 *  · LOS RESALTADOS. En los datos se pinta lo que en el original pintaba a mano quien lo verificaba: el
 *    PT en amarillo, el OT en púrpura oscuro con la letra blanca, y en azul la «Ocupada» de la mesa que no
 *    tuvo ningún toque de gerente (TONES). Lo decide el STEP 1 ('tone' de cada fila) y lo pinta el STEP 4.
 *
 *  · LO RECUPERADO. Lo que se anotó a mano después, en la pestaña Registros (la propiedad 'recovered' de la
 *    API), va en gris de punta a punta de la fila (RECOVERED_FILL): las filas de una rotación
 *    recuperada —la de la mesa, las de sus procesos y las de sus toques— y la de cada toque recuperado.
 *    Los resaltados van encima: un PT recuperado sigue con su «Toque» en amarillo.
 *
 *  · EN VIVO (pedido del usuario). El Resumen son fórmulas sobre la tabla, así que corregir un dato de
 *    «Datos» lo cambia al momento. Para que también cuente las filas que se AÑADEN a mano, «Fila» y las
 *    duraciones son COLUMNAS CALCULADAS de la tabla: Excel copia su fórmula en cada fila nueva. «Fila» dice
 *    qué es la fila por lo que tiene escrito (ROW_KIND_SOURCES), y las duraciones restan sus dos horas.
 *    ExcelJS no escribe columnas calculadas: las pone el STEP 5 en la definición de la tabla.
 *
 *  · LAS PLACAS. El Resumen cuenta los toques por placa (G1…G6, A1…A4). Un toque guarda el nombre de su
 *    gerente; la placa es la de su botón en el local (managers, los de managerButtons).
 *
 *  · Las duraciones y el Resumen son FÓRMULAS, como en el Excel, y cada una lleva ya su resultado
 *    calculado aquí: Excel abre en vista protegida lo que se descarga, y ahí no calcula.
 *
 *  · Se corrigen los fallos del original sin tocar su forma: las duraciones que cruzan la medianoche
 *    ya no se pierden (MOD); «Duracion TM» tiene fórmula; los límites son los del local; las demoras en
 *    limpieza miran la Demora y no la Espera; una mesa con B en medio (16B) ya no desaparece; Entrada
 *    cuenta también APPETIZER; y el Total suma las seis líneas, no cuatro.
 *
 *  · EL TURNO. Se exporta el día entero ('all') o un solo turno ('day', 'night'), y entonces el Resumen
 *    cuenta solo ese turno y el archivo lleva su nombre detrás. Una rotación sin turno —la API lo deja en
 *    null hasta que se dice— no se le adivina: solo sale con 'all'.
 *
 *  · ExcelJS y JSZip se cargan la primera vez que alguien exporta: quien nunca exporta no paga su peso.
 */



// ═══════════════════════════════════════ LO COMÚN ═══════════════════════════════════════

// DATA_SHEET / SUMMARY_SHEET = «los nombres de las dos hojas», los del Excel (sin tilde, como allí)
const DATA_SHEET = 'Datos Atencion al Cliente';
const SUMMARY_SHEET = 'Resumen';

// DATA_TABLE = «el nombre de la tabla de datos», el del Excel: así sus fórmulas sirven tal cual
const DATA_TABLE = 'DtAtenClient';

// ROW_KIND = «qué es cada fila de la tabla»: lo que va en la columna «Fila»
const ROW_KIND = { rotation: 'Rotación', process: 'Proceso', touch: 'Toque' };

// TOUCH_KIND = «el tipo de un toque», como en el original: el primero de la rotación y los siguientes
const TOUCH_KIND = { first: 'PT', other: 'OT' };

// SHIFT_NAMES = «el turno, como se lee»
const SHIFT_NAMES = { day: 'Diurno', night: 'Nocturno' };

// EXPORT_SHIFTS = «qué se puede exportar»: el día entero o uno de sus dos turnos
const EXPORT_SHIFTS = ['all', 'day', 'night'];

// inShift = «la rotación entra en la exportación de ese turno». Con 'all', todas; si no, las de ese turno.
const inShift = (rotation, shift) => shift === 'all' || rotation?.shift === shift;

// RESTROOM_LIMIT = «cuánto puede durar un uso de baño»: el del original (Resumen!C22)
const RESTROOM_LIMIT = '00:02:00';

// FALLBACK_LIMIT = «el límite si el local no trae el suyo»: el de primera atención del original
const FALLBACK_LIMIT = '00:03:00';

// XLSX_TYPE = «el tipo de archivo de un .xlsx»
const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// LOGO_URL = «el logo de Amazonas 365 del Resumen», el mismo de la plantilla (va junto a este archivo)
const LOGO_URL = new URL('./amazonas365.png', import.meta.url).href;



// ═══════════════════════════════════════ EL ASPECTO DEL ORIGINAL ═══════════════════════════════════════
//
//  Todo lo de aquí se copió de «RF58-D-10-09-26 VERIFICADO.xlsm». Los colores van en ARGB ('FF' delante).

// argb = «un color de Excel»: 'A9D18E' → { argb: 'FFA9D18E' }
const argb = (hex) => ({ argb: `FF${hex}` });

// solid = «un relleno de un color»
const solid = (hex) => ({ type: 'pattern', pattern: 'solid', fgColor: argb(hex), bgColor: argb(hex) });

// Las fuentes del original
const CALIBRI_11 = { name: 'Calibri', size: 11 };
const CALIBRI_15 = { name: 'Calibri', size: 15 };
const BOOKMAN_14 = { name: 'Bookman Old Style', size: 14 };
const CENTURY_15_BOLD = { name: 'Century Gothic', size: 15, bold: true };

// Las alineaciones
const CENTER = { horizontal: 'center', vertical: 'middle', wrapText: true };
const WRAP = { wrapText: true };

// Los formatos de número
const TIME_FORMAT = 'h:mm:ss;@';          // horas y duraciones de la tabla de datos
const SUMMARY_TIME_FORMAT = 'hh:mm:ss;@'; // los tiempos medios del Resumen
const DATE_FORMAT = 'dd/mm/yyyy';

// border = «un borde con un estilo por lado»: { top: 'thin', bottom: 'medium' } → lo que pide ExcelJS
const border = (sides) => Object.fromEntries(Object.entries(sides).map(([side, style]) => [side, { style }]));


/*  LA HOJA DE DATOS: un aspecto por grupo de columnas
 *
 *      rotation   Mesa … Operador          cabecera naranja; Bookman Old Style 14 sobre salmón
 *      process    Proceso … DemoraTotal    cabecera azul con letra blanca; Calibri 11 sobre gris
 *      touch      Toque … Duracion TG      cabecera dorada; Calibri 11 sobre amarillo
 *      restroom   InicioTM … Duracion TM   cabecera verde; Calibri 11 sobre gris
 *      zone       Zona                     cabecera negra; letra blanca en negrita sobre gris oscuro
 *      extra      Ticket, Fila, Turno, Fecha (las nuevas): cabecera gris; Calibri 11 sobre gris claro
 *
 *  Solo las cabeceras de rotación y de procesos ajustan el texto (headerWrap), como en el original: en
 *  las demás un título que no cabe se corta («Gerente», en su columna estrecha), en vez de partirse.
 */
const DATA_GROUPS = {
    rotation: { headerFill: 'ED7D31', headerColor: '000000', headerWrap: true, font: BOOKMAN_14, fill: 'F8CBAD', sides: { top: 'thin', left: 'thin', right: 'thin', bottom: 'thin' } },
    process: { headerFill: '4472C4', headerColor: 'FFFFFF', headerWrap: true, font: CALIBRI_11, fill: 'D9D9D9', sides: { left: 'thin', right: 'thin', bottom: 'thin' } },
    touch: { headerFill: 'FFC000', headerColor: '000000', font: CALIBRI_11, fill: 'FFE699', sides: { top: 'thin', left: 'thin', right: 'thin', bottom: 'thin' } },
    restroom: { headerFill: '70AD47', headerColor: '000000', font: CALIBRI_11, fill: 'D9D9D9', sides: { left: 'thin', right: 'thin', bottom: 'thin' } },
    zone: { headerFill: '000000', headerColor: 'FFFFFF', font: { ...CALIBRI_11, bold: true, color: argb('FFFFFF') }, fill: '808080', sides: {} },
    extra: { headerFill: '595959', headerColor: 'FFFFFF', font: CALIBRI_11, fill: 'F2F2F2', sides: { top: 'thin', left: 'thin', right: 'thin', bottom: 'thin' } },
};

/*  TONES = «los resaltados de la hoja de datos»: qué celda de la fila se pinta y de qué color
 *
 *      firstTouch   el primer toque de la mesa (PT)        «Toque» en amarillo
 *      otherTouch   cada toque después del primero (OT)    «Toque» en púrpura oscuro, con la letra blanca
 *      untouched    una mesa sin ningún toque de gerente   «Ocupada» en azul
 *
 *  Son los de la paleta estándar de Excel, y la celda conserva la fuente de su grupo: solo cambia el color.
 *  No son formatos condicionales: que una mesa no tuvo toques no se puede deducir de la tabla (una mesa
 *  puede tener varias rotaciones en el día, y un toque no dice de cuál es), así que se pinta al exportar.
 */
const TONES = {
    firstTouch: { column: 'Toque', fill: 'FFFF00', color: '000000' },
    otherTouch: { column: 'Toque', fill: '7030A0', color: 'FFFFFF' },
    untouched: { column: 'Ocupada', fill: '00B0F0', color: '000000' },
};

// RECOVERED_FILL = «el gris de lo recuperado»: la fila entera de una rotación o un toque que se anotó a mano
// después, en Registros ('recovered'). Es el «Gris claro, Fondo 2, Oscuro 10 %» de la paleta de Excel, un tono más
// oscuro que el «Fondo 2» (E7E6E6) que llevaba antes (pedido del usuario). Más oscuro que el gris de los procesos
// (D9D9D9) y que el de las columnas nuevas (F2F2F2), y con la letra negra de siempre.
const RECOVERED_FILL = 'D0CECE';

// DATA_FIRST_COLUMN = «dónde empieza la tabla»: en la B, como en el original (la A queda vacía)
const DATA_FIRST_COLUMN = 2;

// DATA_EMPTY_COLUMN_WIDTH = «el ancho de esa columna A vacía»
const DATA_EMPTY_COLUMN_WIDTH = 12.28515625;

// DATA_HIDDEN_WIDTH = «el ancho de las columnas ocultas a la derecha de la tabla», el del original
const DATA_HIDDEN_WIDTH = 11.42578125;

// LAST_EXCEL_COLUMN = «la última columna de una hoja de Excel» (XFD): hasta ahí se ocultan
const LAST_EXCEL_COLUMN = 16384;

// DATA_HEADER_HEIGHT / DATA_ROW_HEIGHT = «el alto de la cabecera y de cada fila», los del original
const DATA_HEADER_HEIGHT = 15.75;
const DATA_ROW_HEIGHT = 18;


/*  DATA_COLUMNS = «las columnas de DtAtenClient», en su orden
 *
 *      name        el título, tal cual en el Excel. Es también la clave de cada fila de buildDataRows.
 *      group       su grupo de DATA_GROUPS: de ahí salen su cabecera, su fuente, su relleno y sus bordes
 *      width       el ancho del original
 *      format      'time' (una hora), 'duration' (una resta, que es fórmula), 'kind' (qué es la fila, que
 *                  también es fórmula: ver ROW_KIND_SOURCES), 'date', o nada (texto). Las dos fórmulas son
 *                  columnas calculadas de la tabla: Excel las copia en cada fila que se añade.
 *      from/to     solo las duraciones: de qué columna a qué columna
 *      closes      la última de su grupo: el borde de la derecha de la cabecera va mediano
 *      hidden      oculta, como en el original (D y F). Oculta no deja de calcular: el Resumen la usa.
 */
const DATA_COLUMNS = [

    // ── La rotación de la mesa ──
    { name: 'Mesa', group: 'rotation', width: 7 },
    { name: 'Ocupada', group: 'rotation', width: 13.7109375, format: 'time' },
    { name: 'Protocolo', group: 'rotation', width: 13.7109375, hidden: true }, // «Ubicado_Host» (SI/NO): la aplicación no lo anota
    { name: 'Atencion', group: 'rotation', width: 13.7109375, format: 'time' },
    { name: 'Espera', group: 'rotation', width: 13.7109375, format: 'duration', from: 'Ocupada', to: 'Atencion', hidden: true },
    { name: 'Desocupa', group: 'rotation', width: 13.7109375, format: 'time' },
    { name: 'Despedida', group: 'rotation', width: 13.85546875 },             // «Despedido_Host» (SI/NO): tampoco se anota
    { name: 'Limpieza', group: 'rotation', width: 13.7109375, format: 'time' },
    { name: 'Demora', group: 'rotation', width: 13.7109375, format: 'duration', from: 'Desocupa', to: 'Limpieza' },
    // Más ancha que en el original (13,71): allí se escribía la inicial y aquí va el nombre y el apellido
    { name: 'Operador', group: 'rotation', width: 22, closes: true },

    // ── Un proceso: un pedido de la mesa ──
    { name: 'Proceso', group: 'process', width: 20.28515625 },
    { name: 'Orden', group: 'process', width: 13.7109375, format: 'time' },
    { name: 'Tablet', group: 'process', width: 13.7109375, format: 'time' },
    { name: 'Cocina', group: 'process', width: 13.7109375, format: 'time' },
    { name: 'Entrega', group: 'process', width: 13.7109375, format: 'time' },
    { name: 'Preparacion', group: 'process', width: 15.140625, format: 'duration', from: 'Orden', to: 'Tablet' },
    { name: 'TiempoEntrega', group: 'process', width: 19.28515625, format: 'duration', from: 'Cocina', to: 'Entrega' },
    { name: 'DemoraTotal', group: 'process', width: 15.5703125, format: 'duration', from: 'Orden', to: 'Entrega', closes: true },

    // ── Un toque de gerente ──
    { name: 'Toque', group: 'touch', width: 8.5703125 },                       // PT o OT (ver touchRows)
    { name: 'Gerente', group: 'touch', width: 5.28515625 },
    { name: 'InicioTG', group: 'touch', width: 13.7109375, format: 'time' },
    { name: 'FinalizoTG', group: 'touch', width: 13.7109375, format: 'time' }, // un toque de la aplicación tiene una sola hora
    { name: 'Duracion TG', group: 'touch', width: 15, format: 'duration', from: 'InicioTG', to: 'FinalizoTG', closes: true },

    // ── El uso de baño: la aplicación no lo anota; las columnas quedan para pegar en el Excel ──
    { name: 'InicioTM', group: 'restroom', width: 20.28515625, format: 'time' },
    { name: 'FinalizoTM', group: 'restroom', width: 13.7109375, format: 'time' },
    { name: 'Duracion TM', group: 'restroom', width: 11.42578125, format: 'duration', from: 'InicioTM', to: 'FinalizoTM' },
    { name: 'Zona', group: 'zone', width: 11.42578125 },                       // en el Excel nadie la rellenaba

    // ── Las nuevas: lo que el Excel no tenía ──
    { name: 'Ticket', group: 'extra', width: 11.42578125 },
    { name: 'Fila', group: 'extra', width: 11.42578125, format: 'kind' },      // ROW_KIND: Rotación, Proceso o Toque
    { name: 'Turno', group: 'extra', width: 11.42578125 },
    { name: 'Fecha', group: 'extra', width: 12, format: 'date' },             // el día operativo (de 08:00 a 07:00)
];


/*  EL RESUMEN: la plantilla del original, de A1 a P23
 *
 *      fondo         verde (SUMMARY_GREEN) y blanco (SUMMARY_WHITE), en Calibri 15
 *      recuadros     blanco, Century Gothic 15 en negrita, borde mediano por fuera y fino por dentro
 *      combinadas    las 16 del original (SUMMARY_MERGES)
 *      logo          Amazonas 365, de K10 a P23
 *      lo demás      de la Q en adelante y de la fila 24 en adelante, oculto (STEP 5)
 */

// SUMMARY_COLUMN_WIDTHS = «los anchos de la A a la P»
const SUMMARY_COLUMN_WIDTHS = [4.140625, 35.140625, 7.7109375, 29, 13.28515625, 2.28515625, 5.28515625, 6.85546875, 13.28515625, 4.140625, 19, 7.7109375, 7.42578125, 13.28515625, 21.85546875, 2.42578125];

// SUMMARY_HIDDEN_WIDTH = «el ancho de las columnas ocultas», el del original
const SUMMARY_HIDDEN_WIDTH = 2.42578125;

// SUMMARY_LAST_ROW / SUMMARY_ROW_HEIGHT / SUMMARY_TALL_ROWS = «hasta qué fila se ve», «su alto» y «las más altas»
const SUMMARY_LAST_ROW = 23;
const SUMMARY_ROW_HEIGHT = 20.1;
const SUMMARY_TALL_ROWS = { 18: 37.5, 19: 38.25, 21: 37.5, 22: 38.25 };

// GREEN = «el verde del fondo» (el acento 6 del tema, aclarado)
const GREEN = 'A9D18E';

// SUMMARY_GREEN / SUMMARY_WHITE = «lo que va de verde» y «lo que va de blanco, sin borde»
const SUMMARY_GREEN = ['A1:P1', 'A2:A23', 'J2:J23', 'B4:I4', 'B17:I17', 'B20:I20', 'B23:I23', 'K9:P9', 'P2:P8'];
const SUMMARY_WHITE = ['F2:I3', 'F18:I19', 'F21:I22', 'M2:M7'];

// SUMMARY_BOXES = «los recuadros»
const SUMMARY_BOXES = ['B2:C3', 'D2:E3', 'B5:E16', 'G5:I12', 'B18:C19', 'D18:E19', 'B21:C22', 'D21:E22', 'K2:L7', 'K8:L8', 'N2:O7'];

// SUMMARY_MERGES = «las celdas combinadas»
const SUMMARY_MERGES = ['D2:D3', 'E2:E3', 'B5:B16', 'C5:C6', 'C7:C8', 'C9:C10', 'C11:C12', 'C13:C14', 'C15:C16',
    'G5:G6', 'G7:G8', 'G9:G10', 'G11:G12', 'O2:O7', 'D21:D22', 'E21:E22'];

// LOGO_ANCHOR = «dónde va el logo»: de K10 a P23, con los desplazamientos del original (columna y fila desde 0)
const LOGO_ANCHOR = { tl: { col: 10.02, row: 9.48 }, br: { col: 15.62, row: 22.7 } };

// VERSION = «la versión del formato», la que dice el original en K9:L9
const VERSION = 2.3;

/*  MANAGER_GRID = «la cuadrícula de toques de gerente»: cada placa con su fila de PT (y debajo, la de OT)
 *  y sus tres columnas: la placa, el tipo y la cuenta. G1…G6 a la izquierda; A1…A4 a la derecha.  */
const MANAGER_GRID = [
    ...['G1', 'G2', 'G3', 'G4', 'G5', 'G6'].map((label, index) => ({ label, row: 5 + index * 2, columns: ['C', 'D', 'E'] })),
    ...['A1', 'A2', 'A3', 'A4'].map((label, index) => ({ label, row: 5 + index * 2, columns: ['G', 'H', 'I'] })),
];

/*  DISH_GROUPS = «las seis líneas de platos», en la fila del original, con los tipos de la aplicación que
 *  cuentan en cada una. El original solo miraba 'entrada*', 'pf', 'postre', 'drinks', 'take out' y 'pick
 *  up'; aquí entran también los demás tipos de la lista (DISH_TYPES, en libs/tickets/dishTypes.js), cada uno en la
 *  línea que le toca. Los platos de la carta de un local (dishes) no están en ninguna.  */
const DISH_GROUPS = [
    { row: 2, label: 'Entrada', types: ['APPETIZER', 'ENTRADA 6', 'ENTRADA 7', 'ENTRADA 8', 'ENTRADA 9', 'SALAD'] },
    { row: 3, label: 'Plato Fuerte', types: ['PF', 'ENTREE'] },
    { row: 4, label: 'Postre', types: ['POSTRE', 'DESSER'] },
    { row: 5, label: 'Drinks', types: ['DRINKS', 'DRINKS BAR'] },
    { row: 6, label: 'Take Out', types: ['TAKE OUT', 'UBER EATS', 'DOORDASH'] },
    { row: 7, label: 'Pick Up', types: ['PICK UP'] },
];

// summaryLabels = «los textos fijos del Resumen», cada uno en su celda (los del original, tal cual)
function summaryLabels() {
    const labels = {
        B2: 'Rotaciones evaluadas',
        B3: 'Rotaciones en barra',
        D2: 'Rotaciones totales',
        B5: 'TOQUES DE GERENTES ',
        B18: 'Cantidad de demoras en primera atencion',
        D18: 'Promedio de primera atencion',
        B19: 'Cantidad de demoras en Limpieza',
        D19: 'Promedio de Limpieza',
        B21: 'Cantidad de usos de baño',
        D21: 'Promedio de usos de baño',
        B22: 'Cantidad de demoras en uso de baño',
        O2: 'Tiempo Promedio',
        K8: 'Total  ',
    };

    for (const manager of MANAGER_GRID) {
        const [labelColumn, kindColumn] = manager.columns;
        labels[`${labelColumn}${manager.row}`] = manager.label;
        labels[`${kindColumn}${manager.row}`] = TOUCH_KIND.first;
        labels[`${kindColumn}${manager.row + 1}`] = TOUCH_KIND.other;
    }

    for (const group of DISH_GROUPS) {
        labels[`K${group.row}`] = group.label;
        labels[`M${group.row}`] = '--->';
    }

    return labels;
}



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

// byHour = «por la hora del día operativo»; lo que no dice cuándo, al final
const byHour = (getTime) => (first, second) => (operationalSeconds(getTime(first)) ?? Infinity) - (operationalSeconds(getTime(second)) ?? Infinity);

// startOf = «cuándo empezó una rotación»: la hora de Ocupa, o la toma de orden de su primer proceso si
// es un pedido para llevar (no tiene Ocupa)
const startOf = (rotation) => rotation.hourOccupies || rotation.process?.[0]?.orderTaking;

// managerLabel = «la placa del gerente de un toque» (G1, A2…): la de su botón en el local, buscado por su
// ObjectId o por su nombre, como en la pestaña Mesas (managers.js). Sin botón, su nombre.
function managerLabel(managers, touch) {
    const button = managers.find(manager => (touch.ref && manager.ref && String(manager.ref) === String(touch.ref)) || manager.name === touch.name);
    return button?.label || touch.name || '';
}

// valueOf = «lo que vale una celda de la tabla»: si es una fórmula, su resultado
const valueOf = (cell) => (cell !== null && typeof cell === 'object' && 'formula' in cell ? cell.result : cell);

// columnNumber / columnLetters = «la columna de una letra» y al revés: 'P' ↔ 16
const columnNumber = (letters) => [...letters].reduce((number, letter) => number * 26 + letter.charCodeAt(0) - 64, 0);
const columnLetters = (number) => (number <= 0 ? '' : columnLetters(Math.floor((number - 1) / 26)) + String.fromCharCode(65 + ((number - 1) % 26)));

// bounds = «los bordes de un rango»: 'B5:E16' → { top: 5, left: 2, bottom: 16, right: 5 }
function bounds(range) {
    const [start, end = start] = range.split(':');
    const [, startColumn, startRow] = /([A-Z]+)(\d+)/.exec(start);
    const [, endColumn, endRow] = /([A-Z]+)(\d+)/.exec(end);
    return { top: Number(startRow), left: columnNumber(startColumn), bottom: Number(endRow), right: columnNumber(endColumn) };
}

// eachCellIn = «cada celda de un rango», con su fila y su columna: para pintar la plantilla
function eachCellIn(sheet, range, paint) {
    const { top, left, bottom, right } = bounds(range);
    for (let row = top; row <= bottom; row += 1) {
        for (let column = left; column <= right; column += 1) {
            paint(sheet.getCell(row, column), { row, column, top, left, bottom, right });
        }
    }
}



// ═══════════════════════════════════════ STEP 0 · EL TURNO ═══════════════════════════════════════

// pickShift = «las rotaciones del turno elegido» (inShift): todas con 'all', o solo las de 'day' o 'night'
function pickShift(rotations, shift) {
    return (rotations ?? []).filter(rotation => inShift(rotation, shift));
}



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
 *  Además de sus columnas, una fila puede llevar 'tone': cómo se resalta en la hoja (TONES). Lo llevan
 *  los toques (PT o OT) y la mesa que no tuvo ninguno. Y 'recovered': va en gris (RECOVERED_FILL).
 *  Lo llevan todas las filas de una rotación recuperada y la de cada toque recuperado.
 *
 *  @param {Array}  rotations  las rotaciones, tal como las devuelve la API (GET /rotation)
 *  @param {object} context    { day: 'AAAA-MM-DD', managers: los botones de gerentes del local }
 *  @returns {Array} filas: [{ Mesa: '32', Fila: 'Rotación', Ocupada: '10:51:27', …, tone: 'untouched' }]
 */
function buildDataRows(rotations, context) {
    const managers = context.managers ?? [];
    const rows = [];

    for (const rotation of [...(rotations ?? [])].sort(byHour(startOf))) {

        // shared = «lo que llevan todas las filas de esta rotación»; si es recuperada, también eso
        const shared = {
            Mesa: rotation.tableNumber,
            Turno: SHIFT_NAMES[rotation.shift] ?? '',
            Fecha: String(rotation.operationalDate ?? context.day ?? '').slice(0, 10),
            ...(rotation.recovered === true && { recovered: true }),
        };

        if (!isTakeOut(rotation)) rows.push(rotationRow(rotation, shared));
        rows.push(...processRows(rotation, shared));
        rows.push(...touchRows(rotation, shared, managers));
    }

    return rows;
}

// rotationRow = «la fila de la mesa»: sus cuatro horas y quién la guardó. Sin ningún toque de gerente,
// se resalta ('untouched').
const rotationRow = (rotation, shared) => ({
    ...shared,
    Fila: ROW_KIND.rotation,
    Ocupada: rotation.hourOccupies,
    Atencion: rotation.hourFirstAttention,
    Desocupa: rotation.breakUp,
    Limpieza: rotation.tableCleaning,
    Operador: operatorName(rotation.createdBy),
    ...((rotation.touch ?? []).length === 0 && { tone: 'untouched' }),
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

// touchRows = «una fila por toque de gerente», por hora: el primero de la rotación es PT («primer toque») y
// los siguientes, OT («otro toque»), como en el original. Con la placa de su gerente (managerLabel), cada
// uno con su resaltado ('firstTouch' o 'otherTouch') y, si se apuntó después en Registros, 'recovered'.
const touchRows = (rotation, shared, managers) => [...(rotation.touch ?? [])]
    .sort(byHour(touch => touch.hourTouch))
    .map((touch, position) => ({
        ...shared,
        Fila: ROW_KIND.touch,
        Toque: position === 0 ? TOUCH_KIND.first : TOUCH_KIND.other,
        Gerente: managerLabel(managers, touch),
        InicioTG: touch.hourTouch,
        tone: position === 0 ? 'firstTouch' : 'otherTouch',
        ...(touch.recovered === true && { recovered: true }),
    }));



// ═══════════════════════════════════════ STEP 2 · LOS VALORES DE EXCEL ═══════════════════════════════════════

/*  buildTable = «las filas → los valores que van en cada celda de DtAtenClient»
 *
 *  Cada fila pasa a ser un objeto con una clave por columna (las de DATA_COLUMNS), con lo que Excel
 *  guarda: una hora, como fracción del día; un día, como Date; una mesa de solo cifras, como número; y
 *  una duración, como FÓRMULA con su resultado ya calculado ({ formula, result }). El resaltado de la
 *  fila ('tone') y si es recuperada ('recovered') pasan tal cual: no son celdas, y la tabla de Excel no los lleva.
 *
 *  @param {Array} rows  las de buildDataRows
 *  @returns {Array} [{ Mesa: 32, Ocupada: 0.452…, Espera: { formula: 'IF(…)', result: 0.0000… }, … }]
 */
function buildTable(rows) {
    return rows.map(row => {

        // cells = «las celdas de esta fila», columna a columna
        const cells = {};

        for (const column of DATA_COLUMNS) {
            cells[column.name] = column.format === 'duration' ? durationCell(column, cells)
                : column.format === 'kind' ? kindCell(cells)
                : plainCell(column, row[column.name]);
        }

        return { ...cells, ...(row.tone && { tone: row.tone }), ...(row.recovered === true && { recovered: true }) };
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
    const start = cells[column.from];
    const end = cells[column.to];
    const result = typeof start === 'number' && typeof end === 'number' ? (((end - start) % 1) + 1) % 1 : '';

    return { formula: durationFormula(column), result };
}

// durationFormula = «la fórmula de una duración», la misma en cada fila: es la de su columna calculada
function durationFormula(column) {
    const from = thisRowRef(column.from);
    const to = thisRowRef(column.to);
    return `IF(AND(ISNUMBER(${from}),ISNUMBER(${to})),MOD(${to}-${from},1),"")`;
}


/*  QUÉ ES CADA FILA: «Fila», una columna calculada
 *
 *  Una fila de DtAtenClient es de una mesa, de un proceso o de un toque, y el Resumen las cuenta por
 *  eso (ROW_KIND). En vez de escribirlo, se deduce de lo que la fila tiene escrito, con una fórmula: así
 *  una fila que se añade a mano en Excel se clasifica sola y el Resumen la cuenta al momento.
 *
 *  ROW_KIND_SOURCES = «qué columnas delatan cada clase de fila», en el orden en que se miran: manda la
 *  primera que tenga algo escrito en alguna de las suyas. Solo columnas que se ESCRIBEN, nunca una
 *  duración: su fórmula da "" en una fila sin horas, y COUNTA cuenta eso como escrito.
 */
const ROW_KIND_SOURCES = [
    { kind: ROW_KIND.rotation, columns: ['Ocupada', 'Atencion', 'Desocupa', 'Limpieza', 'Operador'] },
    { kind: ROW_KIND.process, columns: ['Proceso', 'Orden', 'Tablet', 'Cocina', 'Entrega', 'Ticket'] },
    { kind: ROW_KIND.touch, columns: ['Toque', 'Gerente', 'InicioTG', 'FinalizoTG'] },
];

// kindFormula = «la fórmula de "Fila"»: IF(COUNTA(horas de la mesa)>0,"Rotación",IF(COUNTA(…)>0,"Proceso",IF(…,"Toque","")))
const kindFormula = () => ROW_KIND_SOURCES.reduceRight(
    (otherwise, source) => `IF(COUNTA(${source.columns.map(thisRowRef).join(',')})>0,"${source.kind}",${otherwise})`,
    '""'
);

// kindCell = «la celda "Fila"»: su fórmula, y su resultado calculado aquí con la misma regla
// Como las columnas van en orden, las que mira ya están en 'cells' cuando se calcula.
const kindCell = (cells) => ({
    formula: kindFormula(),
    result: ROW_KIND_SOURCES.find(source => source.columns.some(name => !isBlank(valueOf(cells[name]))))?.kind ?? '',
});

// columnFormula = «la fórmula de una columna calculada» (las duraciones y «Fila»), o null si no es calculada
const columnFormula = (column) => (column.format === 'duration' ? durationFormula(column) : column.format === 'kind' ? kindFormula() : null);



// ═══════════════════════════════════════ STEP 3 · LAS CIFRAS DEL RESUMEN ═══════════════════════════════════════

/*  CÓMO SE ESCRIBE UNA CIFRA
 *
 *  Cada cifra se describe UNA vez, con criterios —[columna, regla, texto]—, y de esa descripción salen
 *  las dos cosas: la fórmula de Excel (COUNTIFS, SUMIFS…) y su resultado, calculado aquí sobre la misma
 *  tabla. Así no pueden decir cosas distintas.
 *
 *  RULES = «las reglas de un criterio»: cómo se escribe en la fórmula y cómo se comprueba aquí.
 */
const RULES = {
    is: { criterion: (text) => `"${escapeText(text)}"`, test: (value, text) => lower(value) === lower(text) },
    startsWith: { criterion: (text) => `"${escapeText(text)}*"`, test: (value, text) => lower(value).startsWith(lower(text)) },
    notStartsWith: { criterion: (text) => `"<>${escapeText(text)}*"`, test: (value, text) => !lower(value).startsWith(lower(text)) },
    isBlank: { criterion: () => '""', test: (value) => isBlank(value) },
};

// matching = «las filas de la tabla que cumplen todos los criterios»
const matching = (table, criteria) => table.filter(row => criteria.every(([name, rule, text]) => RULES[rule].test(valueOf(row[name]), text)));

// criteriaFormula = «los criterios, en el orden en que los pide COUNTIFS»: 'DtAtenClient[Fila],"Proceso",…'
const criteriaFormula = (criteria) => criteria.map(([name, rule, text]) => `${columnRef(name)},${RULES[rule].criterion(text)}`).join(',');

// numbersOf = «los números de una columna, en las filas dadas»: COUNT, AVERAGE y SUMIFS ignoran lo demás
const numbersOf = (rows, name) => rows.map(row => valueOf(row[name])).filter(value => typeof value === 'number');

// averageOr = «la media, o lo que diga el original cuando no hay ninguna» ('N/A' o ' ')
const averageOr = (numbers, empty) => (numbers.length > 0 ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : empty);


/*  measure = «las clases de cifra del Resumen», sobre una tabla. Cada una devuelve { formula, result }.
 *
 *      count(criterios)                       cuántas filas cumplen                    COUNTIFS
 *      countEach(columna, valores, criterios) cuántas tienen uno de esos valores       COUNTIFS + COUNTIFS…
 *      averageEach(medida, columna, valores)  la media de la medida (> 0) en esas      (SUMIFS + …) / (COUNTIFS + …)
 *      averagePositive(columna)               la media de lo que pasa de cero          AVERAGEIF(…, ">0")
 *      countAbove(columna, 'HH:MM:SS')        cuántas pasan del límite                 COUNTIF(…, ">"&TIMEVALUE(…))
 *      countNumbers(columna)                  cuántas tienen una hora                  COUNT
 */
function measure(table) {
    return {
        count: (criteria) => ({
            formula: `COUNTIFS(${criteriaFormula(criteria)})`,
            result: matching(table, criteria).length,
        }),

        countEach: (name, values, criteria) => ({
            formula: values.map(value => `COUNTIFS(${criteriaFormula([...criteria, [name, 'is', value]])})`).join('+'),
            result: values.reduce((total, value) => total + matching(table, [...criteria, [name, 'is', value]]).length, 0),
        }),

        averageEach: (target, name, values) => {
            const sums = values.map(value => `SUMIFS(${columnRef(target)},${criteriaFormula([[name, 'is', value]])},${columnRef(target)},">0")`).join('+');
            const counts = values.map(value => `COUNTIFS(${criteriaFormula([[name, 'is', value]])},${columnRef(target)},">0")`).join('+');
            const numbers = values.flatMap(value => numbersOf(matching(table, [[name, 'is', value]]), target)).filter(number => number > 0);
            return { formula: `IFERROR((${sums})/(${counts}),"N/A")`, result: averageOr(numbers, 'N/A') };
        },

        averagePositive: (name) => ({
            formula: `IFERROR(AVERAGEIF(${columnRef(name)},">0")," ")`,
            result: averageOr(numbersOf(table, name).filter(number => number > 0), ' '),
        }),

        countAbove: (name, limitText) => {
            const limit = timeValue(limitText) ?? timeValue(FALLBACK_LIMIT);
            return {
                formula: `COUNTIF(${columnRef(name)},">"&TIMEVALUE("${limitText || FALLBACK_LIMIT}"))`,
                result: numbersOf(table, name).filter(number => number > limit).length,
            };
        },

        countNumbers: (name) => ({
            formula: `COUNT(${columnRef(name)})`,
            result: numbersOf(table, name).length,
        }),
    };
}


/*  buildSummary = «la tabla → las cifras del Resumen», cada una en la celda del original
 *
 *  Devuelve { 'C2': { formula, result, format }, … }. Dónde va el resto —los textos, los recuadros, el
 *  verde— lo pone la plantilla (addSummarySheet).
 *
 *  @param {Array}  table    la de buildTable
 *  @param {object} context  { attentionLimit, cleaningLimit } — los límites del local, 'HH:MM:SS'
 */
function buildSummary(table, context) {
    const { count, countEach, averageEach, averagePositive, countAbove, countNumbers } = measure(table);

    // Los criterios que se repiten
    const isRotation = ['Fila', 'is', ROW_KIND.rotation];
    const isProcess = ['Fila', 'is', ROW_KIND.process];
    const isTouch = ['Fila', 'is', ROW_KIND.touch];

    const figures = {};

    //  Rotaciones: en sala (sin B delante), en barra (con B delante) y las dos juntas
    figures.C2 = count([isRotation, ['Mesa', 'notStartsWith', 'B']]);
    figures.C3 = count([isRotation, ['Mesa', 'startsWith', 'B']]);
    figures.E2 = { formula: 'SUM(C2:C3)', result: figures.C2.result + figures.C3.result, format: '0' };

    //  Toques de gerente: por placa y por tipo, con las celdas de la plantilla como criterio, como el original
    for (const manager of MANAGER_GRID) {
        const [labelColumn, kindColumn, countColumn] = manager.columns;

        for (const [offset, kind] of [[0, TOUCH_KIND.first], [1, TOUCH_KIND.other]]) {
            const row = manager.row + offset;
            figures[`${countColumn}${row}`] = {
                formula: `COUNTIFS(${criteriaFormula([isTouch])},${columnRef('Gerente')},$${labelColumn}$${manager.row},${columnRef('Toque')},${kindColumn}${row})`,
                result: matching(table, [isTouch, ['Gerente', 'is', manager.label], ['Toque', 'is', kind]]).length,
            };
        }
    }

    //  Platos: cuántos de cada línea y su tiempo medio de la orden a la entrega; y el total de las seis
    for (const group of DISH_GROUPS) {
        figures[`L${group.row}`] = countEach('Proceso', group.types, [isProcess]);
        figures[`N${group.row}`] = { ...averageEach('DemoraTotal', 'Proceso', group.types), format: SUMMARY_TIME_FORMAT };
    }
    figures.L8 = { formula: 'SUM(L2:L7)', result: DISH_GROUPS.reduce((total, group) => total + figures[`L${group.row}`].result, 0) };

    //  Demoras de primera atención y de limpieza, con los límites del local
    figures.C18 = countAbove('Espera', context.attentionLimit);
    figures.E18 = { ...averagePositive('Espera'), format: SUMMARY_TIME_FORMAT };
    figures.C19 = countAbove('Demora', context.cleaningLimit);
    figures.E19 = { ...averagePositive('Demora'), format: SUMMARY_TIME_FORMAT };

    //  Uso de baño (la aplicación no lo anota: quedan en cero, listas para lo que se pegue)
    figures.C21 = countNumbers('InicioTM');
    figures.C22 = countAbove('Duracion TM', RESTROOM_LIMIT);
    figures.E21 = { ...averagePositive('Duracion TM'), format: SUMMARY_TIME_FORMAT };

    return figures;
}



// ═══════════════════════════════════════ STEP 4 · EL LIBRO ═══════════════════════════════════════

/*  buildWorkbook = «todo → el libro de Excel», con sus dos hojas y el aspecto del original
 *
 *  Aquí ya no se decide nada de los datos: solo dónde va cada cosa y cómo se ve. ExcelJS se carga aquí,
 *  la primera vez que se exporta.
 *
 *  @param {Array}       table    la de buildTable
 *  @param {object}      summary  la de buildSummary
 *  @param {object}      context  { exportedAt }
 *  @param {ArrayBuffer} logo     opcional. El logo del Resumen; sin él, el Resumen sale sin logo.
 *  @returns {Promise<object>} el libro de ExcelJS
 */
async function buildWorkbook(table, summary, context, logo = null) {

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
    addSummarySheet(workbook, summary, logo);

    return workbook;
}


/*  addDataSheet = «la hoja de datos»: DtAtenClient en la B, con el aspecto de cada grupo de columnas
 *  (DATA_GROUPS), la cabecera fija arriba, sin cuadrícula y al 85 %, como el original.
 *  Una tabla de Excel no puede quedarse sin filas: si no hay ninguna, va una vacía.
 */
function addDataSheet(workbook, table) {
    const sheet = workbook.addWorksheet(DATA_SHEET, {
        views: [{ state: 'frozen', ySplit: 1, showGridLines: false, zoomScale: 85, zoomScaleNormal: 85 }],
        //  Al imprimir: apaisada y todas las columnas en el ancho de la hoja
        pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    const rows = table.length > 0 ? table : [{}];

    sheet.getColumn(1).width = DATA_EMPTY_COLUMN_WIDTH;

    sheet.addTable({
        name: DATA_TABLE,
        ref: `${columnLetters(DATA_FIRST_COLUMN)}1`,
        headerRow: true,
        style: { theme: 'TableStyleLight8', showRowStripes: true },
        columns: DATA_COLUMNS.map(column => ({ name: column.name, filterButton: true })),
        rows: rows.map(cells => DATA_COLUMNS.map(column => cells[column.name] ?? null)),
    });

    //  El aspecto, columna a columna: el de su grupo
    DATA_COLUMNS.forEach((column, index) => {
        const group = DATA_GROUPS[column.group];
        const sheetColumn = sheet.getColumn(DATA_FIRST_COLUMN + index);
        sheetColumn.width = column.width;
        sheetColumn.hidden = Boolean(column.hidden);

        sheetColumn.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
            if (rowNumber === 1) {
                cell.font = { ...CALIBRI_11, bold: true, color: argb(group.headerColor) };
                cell.fill = solid(group.headerFill);
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: Boolean(group.headerWrap) };
                cell.border = border({ top: 'medium', bottom: 'medium', left: 'thin', right: column.closes ? 'medium' : 'thin' });
                return;
            }

            cell.font = group.font;
            cell.fill = solid(group.fill);
            cell.alignment = column.group === 'rotation' ? CENTER : { horizontal: 'center', vertical: 'middle' };
            cell.border = border(column.closes && column.group === 'touch' ? { ...group.sides, right: 'medium' } : group.sides);
            if (column.format === 'time' || column.format === 'duration') cell.numFmt = TIME_FORMAT;
            if (column.format === 'date') cell.numFmt = DATE_FORMAT;
        });
    });

    //  Lo recuperado: la fila entera en gris (RECOVERED_FILL), con la letra de cada grupo. La fila 1
    //  es la cabecera, así que la fila 'index' de la tabla es la index + 2 de la hoja.
    table.forEach((cells, index) => {
        if (!cells.recovered) return;
        DATA_COLUMNS.forEach((column, position) => {
            sheet.getCell(index + 2, DATA_FIRST_COLUMN + position).fill = solid(RECOVERED_FILL);
        });
    });

    //  Los resaltados (TONES), DESPUÉS del gris: encima del aspecto del grupo, la celda de cada fila que lo lleva
    table.forEach((cells, index) => {
        const tone = TONES[cells.tone];
        if (!tone) return;

        const position = DATA_COLUMNS.findIndex(column => column.name === tone.column);
        const cell = sheet.getCell(index + 2, DATA_FIRST_COLUMN + position);
        cell.fill = solid(tone.fill);
        cell.font = { ...DATA_GROUPS[DATA_COLUMNS[position].group].font, color: argb(tone.color) };
    });

    //  Lo que queda a la derecha de la tabla, oculto, como en el original
    for (let number = DATA_FIRST_COLUMN + DATA_COLUMNS.length; number <= LAST_EXCEL_COLUMN; number += 1) {
        const column = sheet.getColumn(number);
        column.width = DATA_HIDDEN_WIDTH;
        column.hidden = true;
    }

    //  Los altos del original
    sheet.getRow(1).height = DATA_HEADER_HEIGHT;
    for (let rowNumber = 2; rowNumber <= rows.length + 1; rowNumber += 1) sheet.getRow(rowNumber).height = DATA_ROW_HEIGHT;
}


/*  addSummarySheet = «la hoja del Resumen»: la plantilla del original y, encima, las cifras (buildSummary)
 *
 *      1. columnas y filas: los anchos y altos del original; de la Q en adelante, ocultas
 *      2. las combinadas, ANTES de pintar: así cada celda conserva su propio borde
 *      3. el fondo verde y los blancos
 *      4. los recuadros: borde mediano por fuera, fino por dentro
 *      5. los textos fijos, la versión y las cifras
 *      6. el verde y el ámbar de PT y OT cuando pasan de cero (los «Bueno» y «Neutral» de Excel)
 *      7. el logo
 */
function addSummarySheet(workbook, summary, logo) {
    const sheet = workbook.addWorksheet(SUMMARY_SHEET, {
        views: [{ showGridLines: false, zoomScale: 85, zoomScaleNormal: 85 }],
        properties: { defaultRowHeight: SUMMARY_ROW_HEIGHT },
        pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    //  1. Columnas y filas
    SUMMARY_COLUMN_WIDTHS.forEach((width, index) => {
        const column = sheet.getColumn(index + 1);
        column.width = width;
        column.font = CALIBRI_15;
        column.alignment = WRAP;
    });
    for (let number = SUMMARY_COLUMN_WIDTHS.length + 1; number <= LAST_EXCEL_COLUMN; number += 1) {
        const column = sheet.getColumn(number);
        column.width = SUMMARY_HIDDEN_WIDTH;
        column.hidden = true;
    }
    for (let number = 1; number <= SUMMARY_LAST_ROW; number += 1) {
        sheet.getRow(number).height = SUMMARY_TALL_ROWS[number] ?? SUMMARY_ROW_HEIGHT;
    }

    //  2. Las combinadas
    for (const range of SUMMARY_MERGES) sheet.mergeCells(range);

    //  3. El fondo
    for (const range of SUMMARY_GREEN) {
        eachCellIn(sheet, range, (cell) => {
            cell.fill = solid(GREEN);
            cell.font = CALIBRI_15;
            cell.alignment = WRAP;
        });
    }
    for (const range of SUMMARY_WHITE) {
        eachCellIn(sheet, range, (cell) => {
            cell.fill = solid('FFFFFF');
            cell.font = CENTURY_15_BOLD;
            cell.alignment = CENTER;
        });
    }

    //  4. Los recuadros
    for (const range of SUMMARY_BOXES) {
        eachCellIn(sheet, range, (cell, { row, column, top, left, bottom, right }) => {
            cell.fill = solid('FFFFFF');
            cell.font = CENTURY_15_BOLD;
            cell.alignment = CENTER;
            cell.border = border({
                top: row === top ? 'medium' : 'thin',
                bottom: row === bottom ? 'medium' : 'thin',
                left: column === left ? 'medium' : 'thin',
                right: column === right ? 'medium' : 'thin',
            });
        });
    }

    //  5. Los textos, la versión y las cifras
    for (const [address, text] of Object.entries(summaryLabels())) sheet.getCell(address).value = text;

    const versionLabel = sheet.getCell('K9');
    versionLabel.value = 'Version:';
    versionLabel.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
    sheet.getCell('L9').value = VERSION;

    for (const [address, figure] of Object.entries(summary)) {
        const cell = sheet.getCell(address);
        cell.value = { formula: figure.formula, result: figure.result };
        if (figure.format) cell.numFmt = figure.format;
    }

    //  6. PT en verde y OT en ámbar cuando pasan de cero
    for (const manager of MANAGER_GRID) {
        const countColumn = manager.columns[2];
        addToneRule(sheet, `${countColumn}${manager.row}`, { font: '006100', fill: 'C6EFCE' });
        addToneRule(sheet, `${countColumn}${manager.row + 1}`, { font: '9C5700', fill: 'FFEB9C' });
    }

    //  7. El logo
    if (logo) {
        const image = workbook.addImage({ buffer: logo, extension: 'png' });
        sheet.addImage(image, { ...LOGO_ANCHOR, editAs: 'oneCell' });
    }
}

// addToneRule = «el color de una cuenta cuando pasa de cero» (formato condicional)
function addToneRule(sheet, address, tone) {
    sheet.addConditionalFormatting({
        ref: address,
        rules: [{
            type: 'cellIs',
            operator: 'greaterThan',
            formulae: ['0'],
            style: { font: { color: argb(tone.font) }, fill: { type: 'pattern', pattern: 'solid', bgColor: argb(tone.fill) } },
        }],
    });
}



// ═══════════════════════════════════════ STEP 5 · EL ARCHIVO ═══════════════════════════════════════

/*  finishWorkbook = «el libro → los bytes del .xlsx», con las filas sobrantes del Resumen ocultas
 *
 *  El original solo enseña A1:P23: las columnas de la Q en adelante ya van ocultas (addSummarySheet), y
 *  las filas de la 24 en adelante se ocultan de golpe con 'zeroHeight' en la hoja: «toda fila sin alto
 *  propio, oculta». ExcelJS no sabe escribir ese atributo, así que se le pone al archivo ya escrito, con
 *  JSZip (un .xlsx es un zip de XML). Solo esa hoja y solo ese atributo: nada más se toca.
 *
 *  @returns {Promise<Uint8Array>} los bytes del archivo
 */
async function finishWorkbook(workbook) {
    const buffer = await workbook.xlsx.writeBuffer();

    const loaded = await import('jszip');
    const JSZip = loaded.default ?? loaded;
    const zip = await JSZip.loadAsync(buffer);

    // summaryPath = «el XML de la hoja del Resumen»: se busca por su nombre en el libro, no se supone
    const workbookXml = await zip.file('xl/workbook.xml').async('string');
    const relationsXml = await zip.file('xl/_rels/workbook.xml.rels').async('string');
    const sheetId = new RegExp(`<sheet [^>]*name="${SUMMARY_SHEET}"[^>]*r:id="([^"]+)"`).exec(workbookXml)?.[1];
    const target = sheetId && new RegExp(`Id="${sheetId}"[^>]*Target="([^"]+)"`).exec(relationsXml)?.[1];
    const summaryPath = target && `xl/${target.replace(/^\/?xl\//, '')}`;

    if (summaryPath && zip.file(summaryPath)) {
        const sheetXml = await zip.file(summaryPath).async('string');
        zip.file(summaryPath, sheetXml.replace('<sheetFormatPr ', '<sheetFormatPr zeroHeight="1" '));
    }

    //  Las columnas calculadas de DtAtenClient (columnFormula): la tabla se busca por su nombre entre las del libro
    for (const path of Object.keys(zip.files).filter(name => /^xl\/tables\/[^/]+\.xml$/.test(name))) {
        const tableXml = await zip.file(path).async('string');
        if (tableXml.includes(`displayName="${DATA_TABLE}"`)) zip.file(path, withCalculatedColumns(tableXml));
    }

    return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', mimeType: XLSX_TYPE });
}


/*  withCalculatedColumns = «la definición de la tabla, con la fórmula de sus columnas calculadas»
 *
 *  ExcelJS escribe cada columna vacía —<tableColumn id="5" name="Espera" totalsRowFunction="none"/>— y aquí
 *  las calculadas (las duraciones y «Fila») pasan a llevar dentro su fórmula:
 *
 *      <tableColumn id="5" name="Espera" …><calculatedColumnFormula>IF(AND(…</calculatedColumnFormula></tableColumn>
 *
 *  Es lo que hace que Excel copie esa fórmula en cada fila que se añade a la tabla. Va sin '=' delante, como
 *  toda fórmula guardada, y con lo que XML no admite suelto (& < >) escapado.
 */
function withCalculatedColumns(tableXml) {
    const escapeXml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return DATA_COLUMNS.reduce((xml, column) => {
        const formula = columnFormula(column);
        if (!formula) return xml;

        const empty = new RegExp(`<tableColumn ([^>]*?)name="${escapeRegExp(column.name)}"([^>]*?)/>`);
        return xml.replace(empty, `<tableColumn $1name="${column.name}"$2><calculatedColumnFormula>${escapeXml(formula)}</calculatedColumnFormula></tableColumn>`);
    }, tableXml);
}



// ═══════════════════════════════════════ STEP 6 · EL NOMBRE ═══════════════════════════════════════

// buildFileName = «el nombre del archivo»: 'Atencion al cliente - Francisca Doral - 2026-10-15.xlsx'; con un solo
// turno, su nombre detrás ('… - Nocturno'), y luego quien lo exportó ('… - Nocturno - Daniel Flores.xlsx', pedido del
// usuario: en el NAS se ve de quién es cada copia). Sin los caracteres que Windows no deja.
function buildFileName(context) {
    const clean = (text) => String(text ?? '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim();
    const local = clean(context.establishmentName) || 'sin local';
    const shift = SHIFT_NAMES[context.shift] ? ` - ${SHIFT_NAMES[context.shift]}` : '';
    const exporter = clean(context.exporter) ? ` - ${clean(context.exporter)}` : '';
    return `Atencion al cliente - ${local} - ${context.day || 'sin fecha'}${shift}${exporter}.xlsx`;
}



// ═══════════════════════════════════════ STEP 7 · LA ENTREGA ═══════════════════════════════════════
//
//  deliverWorkbook (deliverWorkbook.js): a su carpeta del NAS con la aplicación de escritorio, o descargado.

// loadLogo = «el logo del Resumen, en bytes». Si no carga, el libro sale igual, sin logo.
async function loadLogo() {
    try {
        const response = await fetch(LOGO_URL);
        return response.ok ? await response.arrayBuffer() : null;
    }
    catch (error) {
        console.log(error);
        return null;
    }
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
 *  @param {Array}  managers           los botones de gerentes del local (managerButtons): de ahí las placas
 *  @param {string} shift              qué turno: 'all' (el día entero, por defecto), 'day' o 'night'
 *  @param {string} folderShift        con 'all', en la carpeta de qué turno del NAS va: el de la barra ('day' | 'night')
 *  @param {string} exporter           quién exporta ('Daniel Flores'): va en el nombre del archivo. Opcional.
 *  @param {boolean} download          descargarlo en el equipo y no guardarlo en el NAS (el botón «Descargar Excel»)
 *  @param {Date}   now                cuándo se exporta (para las pruebas; por defecto, ahora)
 *  @returns {Promise<{ fileName, rows, delivered }>} el nombre del archivo, cuántas filas lleva la tabla y
 *           dónde acabó (deliverWorkbook: en el NAS, donde se eligió, cancelado o descargado).
 *           Rechaza si algo falla (por ejemplo, si no carga ExcelJS): quien llama lo enseña.
 */
async function exportCustomerServiceWorkbook({ rotations, day, establishmentName, attentionLimit, cleaningLimit, managers = [], shift = 'all', folderShift, exporter = '', download = false, now = new Date() }) {

    // context = «lo que necesitan los pasos además de los datos». Un turno que no existe es el día entero.
    const context = { day, establishmentName, attentionLimit, cleaningLimit, managers, shift: EXPORT_SHIFTS.includes(shift) ? shift : 'all', folderShift, exporter, download, exportedAt: now };

    const picked = pickShift(rotations, context.shift);                        // STEP 0 · el turno
    const rows = buildDataRows(picked, context);                               // STEP 1 · las filas
    const table = buildTable(rows);                                            // STEP 2 · los valores de Excel
    const summary = buildSummary(table, context);                              // STEP 3 · las cifras del Resumen
    const workbook = await buildWorkbook(table, summary, context, await loadLogo());   // STEP 4 · el libro
    const buffer = await finishWorkbook(workbook);                             // STEP 5 · el archivo
    const fileName = buildFileName(context);                                   // STEP 6 · el nombre
    const delivered = await deliverWorkbook(buffer, fileName, context);        // STEP 7 · al NAS, o descargado

    return { fileName, rows: rows.length, delivered };
}



export { exportCustomerServiceWorkbook, pickShift, inShift, buildDataRows, buildTable, buildSummary, buildWorkbook, finishWorkbook, buildFileName, DATA_COLUMNS, EXPORT_SHIFTS };
