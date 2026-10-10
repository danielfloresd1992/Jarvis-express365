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
export const COLUMNS = [
    { id: 'tableNumber',        title: 'Mesa',             width: 1,    color: '#d9a441' },   //  oro
    { id: 'hourOccupies',       title: 'Ocupa',            width: 1,    color: '#4a90d9' },   //  azul
    { id: 'hourFirstAttention', title: 'Primera atención', width: 1,    color: '#22a39f' },   //  turquesa
    { id: 'attentionDuration',  title: 'Duración',         width: 1.35, color: '#8b6fd6' },   //  violeta; lleva además el botón de reportar
    { id: 'breakUp',            title: 'Desocupa',         width: 1,    color: '#e07b39' },   //  naranja
    { id: 'tableCleaning',      title: 'Limpieza',         width: 1,    color: '#d65d9a' },   //  rosa
    { id: 'cleaningDuration',   title: 'Duración',         width: 1,    color: '#8b6fd6' },   //  violeta
];


// PROCESS_COLUMNS = «las columnas de un proceso», en su orden. El número y las duraciones llevan poco
// texto y van más estrechas; el tipo de plato, el que más, va más ancho.
export const PROCESS_COLUMNS = [
    { id: 'ticketNumber',        title: '# Ticket',         width: 0.8,  fromTablet: true },
    { id: 'dishType',            title: 'Tipo de plato',    width: 1.25, fromTablet: true },
    { id: 'orderTaking',         title: 'Toma de orden',    width: 1,    fromTablet: true },
    { id: 'markedReadyOnTablet', title: 'Listo en tablet',  width: 1,    fromTablet: true },
    { id: 'tabletDuration',      title: 'Duración',         width: 0.9,  computed: true },   //  listo en tablet − toma de orden
    { id: 'readyInTheKitchen',   title: 'Listo en cocina',  width: 1 },
    { id: 'dishDelivery',        title: 'Entrega de plato', width: 1 },
    { id: 'deliveryDuration',    title: 'Duración',         width: 0.9,  computed: true },   //  entrega de plato − listo en cocina
    { id: 'delete',              title: '',                 width: 0.35 },                   //  el botón de borrar el proceso
];


// ADD_WIDTH = «lo que mide la columna del «+»», a la izquierda de la fila. La flecha que despliega los
// procesos no tiene columna propia: va dentro de la celda «Mesa» (en las filas sin procesos esa columna
// se quedaba vacía).
export const ADD_WIDTH = 34;

// MANAGER_BUTTON_SPACE = «lo que ocupa cada botón de gerente», con el hueco hasta el siguiente (ManagerButtons)
const MANAGER_BUTTON_SPACE = 30;

// TOUCH_TOGGLE_SPACE = «lo que ocupa la flecha de los toques», a la derecha de los botones. Se deja
// siempre, la haya o no, para que la columna no cambie de ancho al apuntar el primer toque.
export const TOUCH_TOGGLE_SPACE = 40;

// managersWidth = «lo que mide la columna de los gerentes», a la derecha de la fila, para 'count' botones.
// 0 = el local no tiene gerentes y la columna no se pinta. Nunca menos de lo que pide su título, «Gerentes».
export const managersWidth = (count) => (count > 0 ? Math.max(count * MANAGER_BUTTON_SPACE + 10 + TOUCH_TOGGLE_SPACE, 84) : 0);


/*  LA REJILLA, y no filas flexibles, es lo que hace que cuadren
 *
 *  Con 'flex' el borde y el relleno de cada celda entraban en lo que mide: la Duración de las filas
 *  lleva relleno para el botón y la de la cabecera no, y las columnas de la derecha se corrían hasta
 *  7 px. En una rejilla el ancho de cada columna lo dice la plantilla y nada más: 'minmax(0, …fr)'
 *  reparte el ancho que haya sin mirar lo que lleva dentro cada celda.
 */

// tableGrid = «la rejilla de las rotaciones»: el «+», las siete columnas y, si el local tiene, los gerentes.
// Es una función porque la columna de los gerentes mide según cuántos tenga el local.
// Recibe: widthOfManagers (lo que mide esa columna, de managersWidth; 0 = no se pinta).
export const tableGrid = (widthOfManagers) => ({
    display: 'grid',
    gridTemplateColumns: [
        `${ADD_WIDTH}px`,
        ...COLUMNS.map(column => `minmax(0, ${column.width}fr)`),
        ...(widthOfManagers > 0 ? [`${widthOfManagers}px`] : []),
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
 *  filas no llevan fondo propio. Cada borde se calcula como lo reparte tableGrid: lo que dejan el «+» y
 *  los gerentes, en proporción a 'width'.
 *
 *  Son dos capas: las franjas, y encima un velo del color del lienzo, transparente arriba y casi opaco
 *  abajo, que es el que las apaga. El velo va quieto ('scroll') y las franjas se desplazan con las filas
 *  ('local'): un fondo quieto Chrome lo mide CON la barra de desplazamiento, y las franjas acababan 15 px
 *  corridas respecto a las columnas; uno 'local' mide el contenido, que es lo que mide la rejilla.
 */

// headerTint = «el fondo de la cabecera de una columna»: su color, más fuerte que el de su franja
export const headerTint = (column) => `color-mix(in srgb, ${column.color} 30%, var(--color-jx-tarjeta))`;

// columnStripes = «el fondo de la tabla»: las franjas de color de las columnas, apagándose hacia abajo
// Recibe: widthOfManagers (lo que mide la columna de los gerentes; 0 = no hay).
export const columnStripes = (widthOfManagers) => {

    // total = «lo que suman los anchos»: el ancho que dejan las columnas fijas se reparte en esa proporción
    const total = COLUMNS.reduce((sum, column) => sum + column.width, 0);

    // edge = «dónde cae un borde» cuando quedan a su izquierda 'before' de ancho
    const edge = (before) => `calc(${ADD_WIDTH}px + (100% - ${ADD_WIDTH + widthOfManagers}px) * ${before / total})`;

    let before = 0;
    const stripes = COLUMNS.map(column => {
        const stripe = `color-mix(in srgb, ${column.color} 20%, var(--color-jx-lienzo)) ${edge(before)} ${edge(before + column.width)}`;
        before += column.width;
        return stripe;
    });

    return {
        backgroundColor: 'var(--color-jx-lienzo)',
        backgroundImage: [
            'linear-gradient(to bottom, transparent, color-mix(in srgb, var(--color-jx-lienzo) 75%, transparent))',
            `linear-gradient(to right, var(--color-jx-lienzo) ${ADD_WIDTH}px, ${stripes.join(', ')}, var(--color-jx-lienzo) calc(100% - ${widthOfManagers}px))`,
        ].join(', '),
        backgroundAttachment: 'scroll, local',
    };
};
