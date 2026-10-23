import { useCallback } from 'react';
import useContextMenu from '../../../hook/useContextMenu.js';
import { menuTargetOf } from '../../../libs/tickets/menuTarget.js';
import { cellOf, editCell } from '../../../libs/tickets/gridNav.js';
import { copyText, readText, toTime } from '../../../libs/tickets/cellClipboard.js';
import { getCurrentTime } from '../../cells/GridCells.jsx';
import { rowMenuOf } from '../assets/registers/rowMenu.js';


/*  EL MENÚ DEL CLIC DERECHO DE UNA FILA DE MESAS (pedido del usuario; propuesta «C · Barra rápida»)
 *
 *  Cada fila lleva el suyo: así cada opción hace lo mismo que el botón de la fila que ya existe (el «+», el
 *  disquete, «Reportar», la papelera del proceso…), con sus mismas comprobaciones y sus mismos avisos. Solo puede
 *  haber uno abierto: abrir otro cierra el anterior (un clic fuera, en useContextMenu).
 *
 *  Qué opciones salen lo decide rowMenuOf (rowMenu.js); aquí se juntan las de la fila ('actions') con las de una
 *  celda, que son iguales en todas:
 *
 *      Editar   abre la celda como el doble clic (editCell, gridNav.js)
 *      Ahora    pone la hora de ahora, como el reloj
 *      Copiar   al portapapeles (cellClipboard.js)
 *      Pegar    lo copiado; en una hora, solo si es una hora. Si no, lo dice el aviso de la fila
 *      Borrar   deja la celda en blanco, como la ✕
 *
 *  Un clic derecho en una celda la elige antes (el marco verde), como en Excel: el menú es de esa celda, y al cerrarse
 *  el foco vuelve a ella.
 *
 *  @param {object}   record        la rotación
 *  @param {object}   facts         lo que la fila ya calculó (ver rowMenuOf)
 *  @param {object}   actions       lo que la fila sabe hacer (ver rowMenuOf)
 *  @param {function} writeRecord   anota (id de la rotación, campo, valor)
 *  @param {function} writeProcess  anota (id de la rotación, id del proceso, campo, valor)
 *  @param {function} setNotice     el aviso de la fila, para decir por qué no se pegó algo
 *  @returns {{ menu, content, onContextMenu }}  'menu' y 'content' van a ContextMenu; 'onContextMenu', a la raíz de la fila
 */
export default function useRowMenu({ record, facts, actions, writeRecord, writeProcess, setNotice }) {

    const menu = useContextMenu({ resolveTarget: menuTargetOf });

    // writeCell = «anotar en la celda que se pulsó»: en la rotación, o en su proceso
    const writeCell = (target, value) => (
        target.processId
            ? writeProcess(record.id, target.processId, target.column, value)
            : writeRecord(record.id, target.column, value)
    );

    // paste = «pegar lo copiado en la celda». En una hora, solo una hora ('9:05' → '09:05:00'); un texto, tal cual.
    const paste = async (target, kind) => {
        const text = String(await readText()).trim();
        if (text === '') return setNotice('No hay nada copiado para pegar');

        const value = kind === 'time' ? toTime(text) : text;
        if (value === null) return setNotice(`Lo copiado no es una hora: «${text.slice(0, 24)}»`);

        writeCell(target, value);
    };

    // cellActions = «lo que se hace con una celda», igual en todas las filas
    const cellActions = {
        editCell: (target) => editCell(target.element),
        stamp: (target) => writeCell(target, getCurrentTime()),
        copy: (text) => copyText(text),
        paste,
        clearCell: (target) => writeCell(target, ''),
        markProcess: (process, field) => writeProcess(record.id, process.id, field, getCurrentTime()),
    };

    // onContextMenu = «el clic derecho en la fila»: si fue en una celda, la elige primero (como Excel)
    const openMenu = menu.onContextMenu;
    const onContextMenu = useCallback((event) => {
        if (event.button === 2) {
            const cell = cellOf(event.target);
            if (cell && menuTargetOf(cell)) cell.focus({ preventScroll: true });
        }
        openMenu(event);
    }, [openMenu]);

    // content = «las opciones», solo con el menú abierto
    const content = menu.isOpen
        ? rowMenuOf({ target: menu.target, record, facts, actions: { ...actions, ...cellActions } })
        : null;

    return { menu, content, onContextMenu };
}
