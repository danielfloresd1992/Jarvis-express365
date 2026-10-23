/*  MOVERSE POR LAS CELDAS CON LA CRUCETA, COMO EN EXCEL (pedido del usuario)
 *
 *  En el register de Mesas hay una celda «elegida» (la que tiene el foco) y las flechas la mueven: ↑ ↓ a la misma
 *  columna de la fila de arriba o de abajo, ← → a la celda de al lado. Una celda se reconoce por tres atributos en
 *  su elemento:
 *
 *      data-grid-cell   es una celda por la que se puede pasar
 *      data-row         de qué fila es: las celdas de una fila comparten el valor (el id de la rotación, o el del
 *                       proceso en las líneas de procesos)
 *      data-col         de qué columna: el id de la columna (columns.js). Subir y bajar busca la misma columna en
 *                       la fila anterior o siguiente, en el orden en que están en la pantalla
 *
 *  Es lógica de DOM, sin React: la tabla la llama desde su 'onKeyDown' (GridNav.jsx). Pura salvo por mirar el
 *  documento, así que se prueba en un navegador con un trozo de HTML.
 */


// CELL_SELECTOR = «cómo se encuentra una celda»
export const CELL_SELECTOR = '[data-grid-cell]';

// DIRECTIONS = «qué tecla mueve hacia dónde»
const DIRECTIONS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };


// directionOf = «hacia dónde mueve una tecla», o null si no es una flecha
export const directionOf = (key) => DIRECTIONS[key] ?? null;

// cellOf = «la celda a la que pertenece un elemento» (él mismo o el ancestro marcado), o null
export const cellOf = (element) => (element && typeof element.closest === 'function' ? element.closest(CELL_SELECTOR) : null);


/*  neighbor = «la celda vecina en esa dirección», o null si no hay (es el borde)
 *
 *  Arriba y abajo: la celda anterior o siguiente CON LA MISMA COLUMNA, en el orden del documento. Así de «Ocupa» se
 *  baja a «Ocupa» de la siguiente rotación aunque en medio haya líneas de procesos, y de «Toma de orden» a la de la
 *  siguiente línea de proceso aunque sea de otra mesa.
 *  Izquierda y derecha: la celda anterior o siguiente DE LA MISMA FILA.
 */
export function neighbor(container, cell, direction) {
    if (!container || !cell) return null;

    const all = Array.from(container.querySelectorAll(CELL_SELECTOR));
    const vertical = direction === 'up' || direction === 'down';
    const attribute = vertical ? 'col' : 'row';
    const same = all.filter(element => element.dataset[attribute] === cell.dataset[attribute]);

    const index = same.indexOf(cell);
    if (index === -1) return null;

    const step = direction === 'down' || direction === 'right' ? 1 : -1;
    return same[index + step] ?? null;
}


// EDIT_EVENT = «el aviso de "abre tu campo"» que escucha una celda de hora (WrapperText, en GridCells.jsx). Lo manda
// el menú contextual («Editar»): la celda decide sola cómo se abre, como con el doble clic.
export const EDIT_EVENT = 'grid-cell:edit';


/*  editCell = «abrir una celda para corregirla», desde fuera de ella (el menú contextual)
 *
 *  Un campo de texto (la mesa, el ticket) recibe el foco con su texto seleccionado; un select, el foco y su lista
 *  abierta (showPicker, si el navegador lo tiene y hay un clic de por medio); una celda de hora, el aviso EDIT_EVENT.
 */
export function editCell(cell) {
    if (!cell) return false;

    if (cell.tagName === 'INPUT') {
        cell.focus({ preventScroll: true });
        cell.select?.();
        return true;
    }

    if (cell.tagName === 'SELECT') {
        cell.focus({ preventScroll: true });
        try {
            cell.showPicker?.();
        } catch {
            //  Sin un gesto del usuario de por medio el navegador no la abre: queda con el foco
        }
        return true;
    }

    cell.dispatchEvent(new CustomEvent(EDIT_EVENT));
    return true;
}


// focusCell = «elegir una celda»: le da el foco y la deja a la vista. Devuelve si pudo.
export function focusCell(cell) {
    if (!cell) return false;
    cell.focus({ preventScroll: true });
    cell.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    return true;
}


/*  wantsNavigation = «esta tecla, en esta celda, es para moverse»
 *
 *  En una celda de hora (un div), siempre. En un campo de texto (el número de mesa, el ticket), ↑ ↓ siempre, y ← →
 *  solo con el cursor en el borde: dentro del texto mueven el cursor, como en Excel al editar. En un select, las
 *  cuatro: el valor se cambia abriéndolo (espacio o Alt+↓) o escribiendo su inicial.
 */
export function wantsNavigation(cell, direction) {
    if (!cell) return false;
    const tag = cell.tagName;

    if (tag === 'INPUT') {
        if (direction === 'up' || direction === 'down') return true;
        const { selectionStart, selectionEnd, value } = cell;
        if (selectionStart === null || selectionStart !== selectionEnd) return false;
        return direction === 'left' ? selectionStart === 0 : selectionEnd === String(value ?? '').length;
    }

    return true;
}


/*  handleGridKey = «lo que hace una tecla pulsada dentro de la tabla»
 *
 *  Las flechas mueven (si la celda quiere); Enter en un campo de texto o un select baja a la siguiente celda (con
 *  Shift, sube), como en Excel; Escape deselecciona. Las celdas de hora manejan su Enter, sus cifras y su Retroceso
 *  ellas mismas (GridCells.jsx). Con Alt, Ctrl o Cmd no se hace nada: son atajos de otro.
 *
 *  @param {KeyboardEvent} event      el evento de teclado del contenedor
 *  @param {HTMLElement}   container  la tabla
 *  @returns {boolean} si se hizo algo (y el evento ya quedó consumido)
 */
export function handleGridKey(event, container) {
    if (event.altKey || event.ctrlKey || event.metaKey) return false;

    const cell = cellOf(event.target);
    if (!cell || !container?.contains(cell)) return false;

    const direction = directionOf(event.key);
    if (direction) {
        if (!wantsNavigation(cell, direction)) return false;
        event.preventDefault();
        focusCell(neighbor(container, cell, direction));
        return true;
    }

    if (event.key === 'Enter' && cell.tagName !== 'DIV') {
        event.preventDefault();
        focusCell(neighbor(container, cell, event.shiftKey ? 'up' : 'down'));
        return true;
    }

    //  Escape deselecciona la celda (pedido del usuario): el foco se va y el marco verde con él. El campo de hora
    //  abierto se queda con su propio Escape (cierra el campo) y no llega aquí.
    if (event.key === 'Escape') {
        event.preventDefault();
        cell.blur();
        return true;
    }

    return false;
}
