import { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import { handleGridKey, neighbor, focusCell } from '../../libs/tickets/gridNav.js';


/*  LA NAVEGACIÓN POR TECLADO DE UNA TABLA DE CELDAS
 *
 *  La tabla (RegisterTable) envuelve sus filas con <GridNavProvider> y le da a su contenedor el 'ref' y el
 *  'onKeyDown' que devuelve useGridNavigation. Con eso las flechas mueven la celda elegida (gridNav.js). Las celdas
 *  que quieren moverse por su cuenta —la de hora, al guardar con Enter, baja a la siguiente como en Excel— usan
 *  useGridNav().move.
 *
 *  Sin proveedor (una celda fuera de una tabla con navegación) 'move' no hace nada: la celda sigue funcionando.
 */


// GridNavContext = «lo que una celda puede pedirle a su tabla»: { move(cell, direction) }
const GridNavContext = createContext({ move: () => false });


// useGridNavigation = «la navegación de una tabla»: devuelve { containerRef, onKeyDown, nav } para el contenedor y el proveedor
export function useGridNavigation() {
    const containerRef = useRef(null);

    const onKeyDown = useCallback((event) => { handleGridKey(event, containerRef.current); }, []);

    // move = «mover la elección desde una celda»: a la vecina en esa dirección o, si no hay, se queda en ella
    const move = useCallback((cell, direction) => {
        const next = neighbor(containerRef.current, cell, direction);
        return focusCell(next ?? cell);
    }, []);

    const nav = useMemo(() => ({ move }), [move]);

    return { containerRef, onKeyDown, nav };
}


export function GridNavProvider({ nav, children }) {
    return <GridNavContext.Provider value={nav}>{children}</GridNavContext.Provider>;
}


// useGridNav = «la navegación de la tabla en la que estoy», desde una celda
export const useGridNav = () => useContext(GridNavContext);
