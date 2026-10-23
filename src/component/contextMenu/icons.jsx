/*  LOS ICONOS DEL MENÚ CONTEXTUAL, en trazo y con el color del texto (currentColor)
 *
 *  Se piden por su nombre (MenuIcon name='clock'): así quien arma las opciones (rowMenu.js) no lleva JSX y se puede
 *  probar sin navegador. Uno por cada cosa que se puede hacer desde el register.
 *
 *  Dos tamaños: 16 px en la lista y 18 en los botones de la barra rápida (propuesta «C · Barra rápida»).
 */


// SHAPES = «el dibujo de cada icono», sobre una rejilla de 24
const SHAPES = {
    // clock = «poner la hora de ahora»
    clock: <><circle cx='12' cy='12' r='9' /><path d='M12 7v5l3 2' /></>,
    // pencil = «editar»
    pencil: <><path d='M4 20h4L19 9l-4-4L4 16z' /><path d='M14 6l4 4' /></>,
    // copy = «copiar»
    copy: <><rect x='9' y='9' width='11' height='11' rx='2' /><path d='M5 15V5a2 2 0 0 1 2-2h8' /></>,
    // paste = «pegar»
    paste: <><rect x='6' y='4' width='12' height='17' rx='2' /><path d='M9 4V3h6v1' /><path d='M9 11h6M9 15h4' /></>,
    // eraser = «borrar el valor de la celda»
    eraser: <><path d='M7 20h13' /><path d='M5 15l9-9 5 5-8 8H8z' /><path d='M10 10l5 5' /></>,
    // plus = «añadir»
    plus: <path d='M12 5v14M5 12h14' />,
    // list = «los procesos de la rotación»
    list: <><path d='M9 6h11M9 12h11M9 18h11' /><circle cx='4.5' cy='6' r='1' /><circle cx='4.5' cy='12' r='1' /><circle cx='4.5' cy='18' r='1' /></>,
    // hand = «los toques de gerente»
    hand: <><path d='M7 11V7a2 2 0 0 1 4 0v4' /><path d='M11 9V5a2 2 0 0 1 4 0v6' /><path d='M15 9a2 2 0 0 1 4 0v5a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3.4L3.3 14a2 2 0 0 1 3.4-2L7 13' /></>,
    // flag = «reportar una demora»
    flag: <><path d='M5 21V4' /><path d='M5 4h11l-2 4 2 4H5' /></>,
    // tap = «marcada antes de estar listo»: un dedo sobre la pantalla de la tablet (el botón de Demoras lleva lo mismo)
    tap: <><path d='M8 14H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-1' /><path d='M11 21v-8.5a1.5 1.5 0 0 1 3 0V17l2.6.5a1.6 1.6 0 0 1 1.3 1.8L17.5 21' /><path d='M9.5 8a3.5 3.5 0 0 1 6 0' /></>,
    // cloche = «la demora de preparación» (el icono de cocina de los procesos)
    cloche: <><path d='M3 17h18' /><path d='M5 17a7 7 0 0 1 14 0' /><path d='M12 10V8' /></>,
    // save = «guardar la rotación» (el disquete)
    save: <><path d='M5 3h11l3 3v15H5z' /><path d='M8 3v5h8V3' /><rect x='8' y='13' width='8' height='6' /></>,
    // broom = «limpiar la fila»
    broom: <><path d='M14 3l-4 9' /><path d='M6 12h8l2 9H4z' /><path d='M8 16v5M12 16v5' /></>,
    // trash = «borrar el proceso»
    trash: <><path d='M3 6h18' /><path d='M8 6V4h8v2' /><path d='M6 6l1 14h10l1-14' /><path d='M10 11v5M14 11v5' /></>,
};


/*  @param {string} name  el nombre del icono (SHAPES). Uno que no exista no pinta nada.
 *  @param {number} size  el lado, en px
 */
export default function MenuIcon({ name, size = 16 }) {
    const shape = SHAPES[name];
    if (!shape) return null;
    return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
            {shape}
        </svg>
    );
}
