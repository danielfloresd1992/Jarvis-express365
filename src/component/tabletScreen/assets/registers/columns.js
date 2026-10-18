/*  LAS COLUMNAS DEL REGISTER
 *
 *  Dos tablas, una dentro de otra:
 *
 *      la de las ROTACIONES   una fila por mesa, desde que se ocupa hasta que se limpia
 *      la de los PROCESOS     los pedidos de esa rotación; se despliega debajo de su fila con la flecha
 *
 *  Las columnas de cada una las comparten su cabecera y sus filas, que tienen que medir lo mismo o
 *  dejan de cuadrar. 'width' es lo que mide cada columna respecto a las demás. 'fromTablet' marca lo
 *  que lee la IA —el número de ticket, el tipo de plato y dos horas—, y 'computed' lo que se calcula:
 *  lo demás se anota a mano.
 */


// COLUMNS = «las columnas de una rotación», en su orden: el de la vida de la mesa
// color = «el color con que se reconoce la columna» (ver columnStripes). Las dos duraciones comparten
// el suyo: las dos dicen cuánto tardó algo.
// Las cinco de una hora miden un 5 % menos que antes (0,95; pedido del usuario), y lo que sueltan se lo lleva la
// Duración de la limpieza (1 → 1,25): con «Reportar» al lado, el tiempo no cabía y se cortaba por la izquierda. La
// suma sigue en 7,35, así que las demás no se mueven.
export const COLUMNS = [
    { id: 'tableNumber',        title: 'Mesa',             width: 0.95, color: '#d9a441' },   //  oro
    { id: 'hourOccupies',       title: 'Ocupa',            width: 0.95, color: '#4a90d9' },   //  azul
    { id: 'hourFirstAttention', title: 'Primera atención', width: 0.95, color: '#22a39f' },   //  turquesa
    { id: 'attentionDuration',  title: 'Duración',         width: 1.35, color: '#8b6fd6' },   //  violeta; lleva además el botón de reportar
    { id: 'breakUp',            title: 'Desocupa',         width: 0.95, color: '#e07b39' },   //  naranja
    { id: 'tableCleaning',      title: 'Limpieza',         width: 0.95, color: '#d65d9a' },   //  rosa
    { id: 'cleaningDuration',   title: 'Duración',         width: 1.25, color: '#8b6fd6' },   //  violeta; lleva también el botón de reportar
];


// PROCESS_COLUMNS = «las columnas de un proceso», en su orden. El número y las duraciones llevan poco
// texto y van más estrechas; el tipo de plato, el que más, va más ancho.
// color = «el color con que se reconoce la columna» (ver processStripes). NINGUNO es de la rotación: los
// procesos van dentro de su fila y tienen que distinguirse de ella. Salen de los huecos que deja la paleta de
// COLUMNS, y las columnas vecinas quedan lejos entre sí. Las dos duraciones comparten el suyo, como allá.
export const PROCESS_COLUMNS = [
    { id: 'ticketNumber',        title: '# Ticket',         width: 0.8,  fromTablet: true, color: '#6f7d8c' },   //  pizarra
    { id: 'dishType',            title: 'Tipo de plato',    width: 1.25, fromTablet: true, color: '#a3a32e' },   //  oliva
    { id: 'orderTaking',         title: 'Toma de orden',    width: 1,    fromTablet: true, color: '#5560c4' },   //  índigo
    { id: 'markedReadyOnTablet', title: 'Listo en tablet',  width: 1,    fromTablet: true, color: '#3f9d5a' },   //  verde hoja
    { id: 'tabletDuration',      title: 'Duración',         width: 0.9,  computed: true,   color: '#a855c2' },   //  orquídea; listo en tablet − toma de orden
    { id: 'readyInTheKitchen',   title: 'Listo en cocina',  width: 1,                      color: '#c9444f' },   //  granate
    { id: 'dishDelivery',        title: 'Entrega de plato', width: 1,                      color: '#8c6e54' },   //  sepia
    { id: 'deliveryDuration',    title: 'Duración',         width: 0.9,  computed: true,   color: '#a855c2' },   //  orquídea; entrega de plato − listo en cocina
    { id: 'delete',              title: '',                 width: 0.35 },                                        //  el botón de borrar el proceso: sin color
];


// ADD_WIDTH = «lo que mide la columna del «+»», a la izquierda de la fila. La flecha que despliega los
// procesos no tiene columna propia: va dentro de la celda «Mesa» (en las filas sin procesos esa columna
// se quedaba vacía).
export const ADD_WIDTH = 34;

// SAVE_WIDTH = «lo que mide la columna del disquete», la última de la fila (SaveRecordButton)
export const SAVE_WIDTH = 34;

// MANAGER_BUTTON_SPACE = «lo que ocupa cada botón de gerente», con el hueco hasta el siguiente (ManagerButtons):
// 30 px de tecla y 8 de hueco, que es por donde asoma la burbuja con sus toques.
const MANAGER_BUTTON_SPACE = 38;

// TOUCHES_SPACE = «lo que ocupa el botón de la lista de toques», con la raya que lo separa de los gerentes
// (TouchToggle). Está siempre, también sin toques, así que la columna no cambia de ancho.
const TOUCHES_SPACE = 60;

// managersWidth = «lo que mide la columna de los gerentes», a la derecha de la fila, para 'count' botones.
// 0 = el local no tiene gerentes y la columna no se pinta. Nunca menos de lo que pide su título, «Gerentes».
export const managersWidth = (count) => (count > 0 ? Math.max(count * MANAGER_BUTTON_SPACE + 10 + TOUCHES_SPACE, 84) : 0);


/*  LA REJILLA, y no filas flexibles, es lo que hace que cuadren
 *
 *  Con 'flex' el borde y el relleno de cada celda entraban en lo que mide: la Duración de las filas
 *  lleva relleno para el botón y la de la cabecera no, y las columnas de la derecha se corrían hasta
 *  7 px. En una rejilla el ancho de cada columna lo dice la plantilla y nada más: 'minmax(0, …fr)'
 *  reparte el ancho que haya sin mirar lo que lleva dentro cada celda.
 */

// tableGrid = «la rejilla de las rotaciones»: el «+», las siete columnas, los gerentes si el local tiene,
// y el disquete. Es una función porque la columna de los gerentes mide según cuántos tenga el local.
// Recibe: widthOfManagers (lo que mide esa columna, de managersWidth; 0 = no se pinta).
export const tableGrid = (widthOfManagers) => ({
    display: 'grid',
    gridTemplateColumns: [
        `${ADD_WIDTH}px`,
        ...COLUMNS.map(column => `minmax(0, ${column.width}fr)`),
        ...(widthOfManagers > 0 ? [`${widthOfManagers}px`] : []),
        `${SAVE_WIDTH}px`,
    ].join(' '),
});

// PROCESS_GRID = «la rejilla de los procesos»: una columna por cada dato del proceso, cada una con su 'width'
export const PROCESS_GRID = {
    display: 'grid',
    gridTemplateColumns: PROCESS_COLUMNS.map(column => `minmax(0, ${column.width}fr)`).join(' '),
};


/*  LOS COLORES DE LAS COLUMNAS
 *
 *  Cada columna de la rotación se reconoce por su color: su cabecera va teñida de él y, debajo, baja una
 *  franja del mismo color que se apaga hacia abajo.
 *
 *  Las franjas son el fondo de la zona que se desplaza, no de cada celda: así cada una es continua, y las
 *  filas no llevan fondo propio. Cada borde se calcula como lo reparte tableGrid: lo que dejan el «+», los
 *  gerentes y el disquete, en proporción a 'width'.
 *
 *  Son dos capas: las franjas, y encima un velo del color del lienzo, transparente arriba y casi opaco
 *  abajo, que es el que las apaga. El velo va quieto ('scroll') y las franjas se desplazan con las filas
 *  ('local'): un fondo quieto Chrome lo mide CON la barra de desplazamiento, y las franjas acababan 15 px
 *  corridas respecto a las columnas; uno 'local' mide el contenido, que es lo que mide la rejilla.
 */

// TINT_BOOST = «cuánto se refuerzan los colores del ciclo de la rotación» (pedido del usuario: un 30 % más). Multiplica
// la parte de color de la cabecera (headerTint), de las franjas (columnStripes) y de las celdas de Registros (cellTint,
// en RegisterSavedRow.jsx): 30 % → 39 %, 20 % → 26 %, 16 % → 21 %. Las cabeceras llevan el texto en 'tinta' para
// seguir leyéndose sobre el color más cargado (8,4 : 1 la que menos).
export const TINT_BOOST = 1.3;

// tintPercent = «una proporción de color, ya reforzada»: 20 → '26%'
export const tintPercent = (percent) => `${Math.round(percent * TINT_BOOST)}%`;

// headerTint = «el fondo de la cabecera de una columna»: su color, más fuerte que el de su franja
export const headerTint = (column) => `color-mix(in srgb, ${column.color} ${tintPercent(30)}, var(--color-jx-tarjeta))`;

// columnStripes = «el fondo de la tabla»: las franjas de color de las columnas, apagándose hacia abajo
// Recibe: widthOfManagers (lo que mide la columna de los gerentes; 0 = no hay).
export const columnStripes = (widthOfManagers) => {

    // total = «lo que suman los anchos»: el ancho que dejan las columnas fijas se reparte en esa proporción
    const total = COLUMNS.reduce((sum, column) => sum + column.width, 0);

    // rightWidth = «lo que miden las columnas fijas de la derecha»: los gerentes y el disquete
    const rightWidth = widthOfManagers + SAVE_WIDTH;

    // edge = «dónde cae un borde» cuando quedan a su izquierda 'before' de ancho
    const edge = (before) => `calc(${ADD_WIDTH}px + (100% - ${ADD_WIDTH + rightWidth}px) * ${before / total})`;

    let before = 0;
    const stripes = COLUMNS.map(column => {
        const stripe = `color-mix(in srgb, ${column.color} ${tintPercent(20)}, var(--color-jx-lienzo)) ${edge(before)} ${edge(before + column.width)}`;
        before += column.width;
        return stripe;
    });

    return {
        backgroundColor: 'var(--color-jx-lienzo)',
        backgroundImage: [
            'linear-gradient(to bottom, transparent, color-mix(in srgb, var(--color-jx-lienzo) 75%, transparent))',
            `linear-gradient(to right, var(--color-jx-lienzo) ${ADD_WIDTH}px, ${stripes.join(', ')}, var(--color-jx-lienzo) calc(100% - ${rightWidth}px))`,
        ].join(', '),
        backgroundAttachment: 'scroll, local',
    };
};


// PROCESS_STRIPES = «el fondo de la tarjeta de los procesos»: una franja del color de cada columna
// Como las de la rotación, pero sin apagarse hacia abajo: la tarjeta es corta. Y sin columnas fijas que
// descontar, así que cada borde es la parte de 'width' que queda a su izquierda. Una columna sin color
// (la de borrar) se queda en el color del lienzo.
// El color va al 29 %: era el 14 %, y el usuario pidió 15 puntos más de opacidad.
export const PROCESS_STRIPES = (() => {

    // total = «lo que suman los anchos»
    const total = PROCESS_COLUMNS.reduce((sum, column) => sum + column.width, 0);

    let before = 0;
    const stripes = PROCESS_COLUMNS.map(column => {
        const color = column.color ? `color-mix(in srgb, ${column.color} 29%, var(--color-jx-lienzo))` : 'var(--color-jx-lienzo)';
        const stripe = `${color} ${(before / total) * 100}% ${((before + column.width) / total) * 100}%`;
        before += column.width;
        return stripe;
    });

    return { backgroundImage: `linear-gradient(to right, ${stripes.join(', ')})` };
})();
