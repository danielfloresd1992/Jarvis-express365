import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { placeMenu } from '../libs/contextMenu/placeMenu.js';


/*  EL MENÚ CONTEXTUAL: CUÁNDO SE ABRE, DÓNDE Y CUÁNDO SE CIERRA
 *
 *  Un hook para cualquier zona que quiera su propio menú de clic derecho (la tabla de Mesas, la primera). Se encarga
 *  de los eventos y de la posición; qué opciones lleva el menú lo decide quien lo usa, según 'target'.
 *
 *      const menu = useContextMenu({ resolveTarget: menuTargetOf });
 *      <div onContextMenu={menu.onContextMenu}> … </div>
 *      <ContextMenu menu={menu} items={…según menu.target…} />
 *
 *  ABRIR
 *      clic derecho                 en el punto del clic
 *      tecla Menú o Mayús+F10       pegado a la celda elegida (la que tiene el foco), como un desplegable: así se
 *                                   abre sin ratón, que es como se trabaja con la cruceta (gridNav.js)
 *  'resolveTarget(elemento)' dice sobre qué se abrió; si devuelve null, sale el menú del sistema de siempre.
 *
 *  POSICIÓN (placeMenu.js)
 *      El menú se pinta primero invisible, se mide, y entonces se coloca donde quepa entero (dándose la vuelta si se
 *      sale por la derecha o por abajo). Todo en un useLayoutEffect, antes de que la pantalla se pinte: no se ve saltar.
 *
 *  CERRAR
 *      Escape · un clic fuera · desplazar la página o la tabla · cambiar el tamaño de la ventana · que la ventana
 *      pierda el foco · elegir una opción. Otro clic derecho lo vuelve a abrir en el sitio nuevo.
 *      Al cerrarse con el teclado, el foco vuelve a la celda desde la que se abrió.
 *
 *  @param {function} resolveTarget  (elemento) => lo que se pulsó, o null (sin menú propio). Por defecto, el elemento
 *  @returns {{ isOpen, target, via, onContextMenu, openAt, close, menuRef, style, placement }}
 *      via        'pointer' | 'keyboard': cómo se abrió (el menú da el foco a su primera opción si fue con teclado)
 *      menuRef    va en el elemento del menú: se mide y se usa para saber qué es «fuera»
 *      style      el estilo del menú: posición fija, recorte y origen de la animación
 *      placement  { originX, originY }, por si el diseño quiere una flecha o una sombra hacia el puntero
 */


// HIDDEN = «el estilo antes de medir»: pintado pero transparente, en la esquina, para leer su tamaño. Con 'opacity' y
// no con 'visibility': 'visibility' se hereda, y al quitarla Chromium dejaba a las opciones de dentro como escondidas
// (no recibían el foco, y el teclado del menú no andaba). Dura un solo paso: se coloca antes de pintar.
const HIDDEN = { position: 'fixed', left: 0, top: 0, opacity: 0, pointerEvents: 'none' };


export default function useContextMenu({ resolveTarget = (element) => ({ element }) } = {}) {

    // opened = «lo que se abrió»: { x, y, anchor, target, via }, o null cerrado
    const [opened, setOpened] = useState(null);

    // placement = «dónde quedó», ya medido: lo que devuelve placeMenu
    const [placement, setPlacement] = useState(null);

    const menuRef = useRef(null);

    // returnFocusRef = «el elemento que tenía el foco al abrir»: vuelve a él al cerrar con el teclado
    const returnFocusRef = useRef(null);

    const close = useCallback(({ restoreFocus = false } = {}) => {
        setOpened(null);
        setPlacement(null);
        if (restoreFocus) returnFocusRef.current?.focus?.({ preventScroll: true });
    }, []);

    // openAt = «abrir el menú a mano»: en un punto, o pegado a un elemento (con teclado)
    const openAt = useCallback(({ x = 0, y = 0, anchorElement = null, target, via = 'pointer' }) => {
        returnFocusRef.current = document.activeElement;
        setPlacement(null);
        setOpened({ x, y, anchor: anchorElement?.getBoundingClientRect?.() ?? null, target, via });
    }, []);

    //  El clic derecho, o la tecla Menú. El teclado también dispara 'contextmenu', pero con el botón 0 (el ratón
    //  derecho es el 2): entonces el menú se pega a la celda elegida, porque el punto que trae el evento no sirve.
    const onContextMenu = useCallback((event) => {
        const fromKeyboard = event.button !== 2;
        const source = fromKeyboard ? (document.activeElement ?? event.target) : event.target;
        const target = resolveTarget(source);
        if (!target) return;

        event.preventDefault();
        event.stopPropagation();
        openAt({
            x: event.clientX,
            y: event.clientY,
            anchorElement: fromKeyboard ? (target.element ?? source) : null,
            target,
            via: fromKeyboard ? 'keyboard' : 'pointer',
        });
    }, [resolveTarget, openAt]);

    //  Medir y colocar, antes de pintar. Se repite si cambia lo abierto (otro clic derecho en otro sitio).
    useLayoutEffect(() => {
        if (!opened || !menuRef.current) return;
        const { offsetWidth, offsetHeight } = menuRef.current;
        setPlacement(placeMenu({
            x: opened.x,
            y: opened.y,
            anchor: opened.anchor,
            width: offsetWidth,
            height: offsetHeight,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
        }));
    }, [opened]);

    //  Lo que lo cierra mientras está abierto
    useEffect(() => {
        if (!opened) return undefined;

        const onPointerDown = (event) => {
            if (!menuRef.current?.contains(event.target)) close();
        };
        const onKeyDown = (event) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            event.stopPropagation();
            close({ restoreFocus: true });
        };
        //  Un desplazamiento DENTRO del menú (si es más alto que la ventana) no lo cierra
        const onScroll = (event) => {
            if (!menuRef.current?.contains(event.target)) close();
        };
        const onResize = () => close();
        const onBlur = () => close();

        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('keydown', onKeyDown, true);
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onResize);
        window.addEventListener('blur', onBlur);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown, true);
            document.removeEventListener('keydown', onKeyDown, true);
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('blur', onBlur);
        };
    }, [opened, close]);

    // style = «dónde se pinta»: invisible hasta medirlo; luego en su sitio, creciendo desde la esquina del puntero
    const style = !placement ? HIDDEN : {
        position: 'fixed',
        left: placement.left,
        top: placement.top,
        maxHeight: placement.maxHeight,
        transformOrigin: `${placement.originY} ${placement.originX}`,
    };

    return {
        isOpen: Boolean(opened),
        target: opened?.target ?? null,
        via: opened?.via ?? null,
        placed: Boolean(placement),
        onContextMenu,
        openAt,
        close,
        menuRef,
        style,
        placement,
    };
}
