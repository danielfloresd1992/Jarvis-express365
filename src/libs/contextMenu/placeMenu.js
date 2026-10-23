/*  DÓNDE SE ABRE UN MENÚ CONTEXTUAL PARA QUE QUEPA ENTERO
 *
 *  El menú se pinta con 'position: fixed', así que todo va en coordenadas de la VENTANA (clientX / clientY), y
 *  desplazar la tabla no lo mueve: por eso, mientras está abierto, un desplazamiento lo cierra (useContextMenu).
 *
 *  Dos formas de abrirlo:
 *
 *      con el ratón     en el punto del clic: el menú cae hacia abajo y a la derecha del puntero
 *      con el teclado   pegado a la celda elegida ('anchor', su getBoundingClientRect): debajo de ella y alineado a
 *                       su izquierda, como un desplegable
 *
 *  Si no cabe, se da la vuelta: si se sale por la derecha se abre hacia la izquierda del punto (o del borde derecho
 *  de la celda); si se sale por abajo, hacia arriba. Si tampoco cabe dado la vuelta (una ventana muy pequeña), se
 *  pega al borde con un margen. Y si es más alto que la ventana, se recorta con 'maxHeight' y se desplaza por dentro.
 *
 *  Devuelve también hacia dónde se abrió ('originX', 'originY'): la animación de entrada crece desde esa esquina, la
 *  que está pegada al puntero.
 *
 *  PURA: sin DOM ni React. La usa useContextMenu después de medir el menú.
 */


// MENU_MARGIN = «cuánto se separa el menú de los bordes de la ventana», en píxeles
export const MENU_MARGIN = 8;


/*  @param {number} x, y            el punto del clic, en coordenadas de la ventana
 *  @param {object} anchor          con teclado: el rectángulo de la celda { left, top, right, bottom }; si no, null
 *  @param {number} width, height   lo que mide el menú (medido ya pintado)
 *  @param {number} viewportWidth, viewportHeight   lo que mide la ventana
 *  @param {number} margin          la separación con los bordes
 *  @returns {{ left, top, maxHeight, originX: 'left'|'right', originY: 'top'|'bottom' }}
 */
export function placeMenu({ x = 0, y = 0, anchor = null, width, height, viewportWidth, viewportHeight, margin = MENU_MARGIN }) {

    // start = «el punto de partida»: el clic, o la esquina de abajo a la izquierda de la celda
    const startX = anchor ? anchor.left : x;
    const startY = anchor ? anchor.bottom : y;

    // flipX / flipY = «hacia dónde se abre si se da la vuelta»: a la izquierda del punto (o del borde derecho de la
    // celda), y por encima del punto (o del borde de arriba de la celda)
    const flipX = (anchor ? anchor.right : x) - width;
    const flipY = (anchor ? anchor.top : y) - height;

    let left = startX;
    let originX = 'left';
    if (startX + width > viewportWidth - margin) {
        if (flipX >= margin) {
            left = flipX;
            originX = 'right';
        }
        else {
            left = viewportWidth - margin - width;
        }
    }

    let top = startY;
    let originY = 'top';
    if (startY + height > viewportHeight - margin) {
        if (flipY >= margin) {
            top = flipY;
            originY = 'bottom';
        }
        else {
            top = viewportHeight - margin - height;
        }
    }

    // maxHeight = «lo más alto que puede ser»: la ventana menos los dos márgenes
    const maxHeight = Math.max(0, viewportHeight - margin * 2);

    return {
        left: Math.round(Math.max(margin, left)),
        top: Math.round(Math.max(margin, top)),
        maxHeight,
        originX,
        originY,
    };
}
