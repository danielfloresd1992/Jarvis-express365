import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import MenuIcon from './icons.jsx';
import './contextMenu.css';


/*  EL MENÚ CONTEXTUAL (propuesta «C · Barra rápida», elegida por el usuario)
 *
 *  Solo pinta y maneja el teclado de dentro: cuándo se abre, dónde y cuándo se cierra lo decide useContextMenu, que
 *  llega en 'menu'. Va con un portal en <body>, fijo a la ventana, para que ningún contenedor con 'overflow' lo corte.
 *
 *      ┌──────────────────────────────┐
 *      │  ✎      ⏱      ⧉      📋     │   ← 'quick': lo que se pulsó, en botones grandes
 *      │ Editar Ahora  Copiar Pegar   │
 *      │ ──────────────────────────── │
 *      │ TICKET 4821                  │   ← 'items': { type: 'section', label }
 *      │ ⌫ Borrar la hora   Retroceso │   ← una opción: icono, texto y atajo
 *      │ ──────────────────────────── │   ← { type: 'separator' }
 *      │ ● Mesa 12 · Ocupa · 13:58:04 │   ← 'footer': dónde se abrió
 *      └──────────────────────────────┘
 *
 *  UNA OPCIÓN (en la barra o en la lista)
 *      id, label      su nombre entero: lo leen los lectores de pantalla y la letra de búsqueda
 *      short          en la barra, el nombre corto bajo el icono (si no, 'label')
 *      icon           el nombre de un icono (icons.jsx) o un elemento
 *      shortcut       la tecla que hace lo mismo fuera del menú, a la derecha (en la barra, en el 'title')
 *      note           en la lista, una nota corta a la derecha: por qué está apagada
 *      hint           el 'title' al pasar el ratón
 *      tone           'report' (ocre) · 'go' (verde, solo el icono de la barra)
 *      danger         en rojo: destruye algo
 *      confirm        el texto que pide el segundo clic: la primera vez no hace nada, cambia a este texto
 *      dot            un punto rojo en el icono de la barra: algo pide atención
 *      disabled       apagada: no se elige ni recibe el foco
 *      onSelect       lo que hace, con lo que se pulsó (menu.target)
 *
 *  CON EL TECLADO (como un menú del sistema)
 *      ↑ ↓          de fila en fila: la barra entera cuenta como una fila, y cada opción de la lista como otra
 *      ← →          de botón en botón dentro de la barra
 *      Inicio / Fin la primera / la última
 *      una letra    la siguiente opción que empieza por ella
 *      Enter / espacio   elige
 *      Escape       cierra y vuelve a la celda (lo hace el hook) · Tab cierra
 *  Abierto con el teclado, el foco va a la primera opción; con el ratón, al menú (y ↓ entra en las opciones).
 *
 *  Al elegir, el menú se cierra, el foco vuelve a donde estaba y se llama a 'onSelect(target)' de la opción.
 *  Su aspecto, en 'context-menu…' de contextMenu.css.
 *
 *  @param {object} menu    lo que devuelve useContextMenu
 *  @param {Array}  quick   los botones de la barra (opciones; sin separadores ni secciones)
 *  @param {Array}  items   la lista: opciones, { type: 'separator' } y { type: 'section', label }
 *  @param {object} footer  el pie, opcional: { text, color }
 *  @param {node}   header  un título arriba, opcional
 *  @param {string} label   el nombre del menú para los lectores de pantalla
 */
export default function ContextMenu({ menu, quick = [], items = [], footer = null, header = null, label = 'Opciones' }) {

    // nodesRef = «los botones de las opciones», por su llave: 'q<posición>' en la barra, 'l<posición>' en la lista
    const nodesRef = useRef(new Map());

    // quickColumnRef = «el último botón de la barra en que estuvo el foco»: al volver a la barra con ↑ ↓, va a él
    const quickColumnRef = useRef(0);

    // confirming = «la llave de la opción que espera su segundo clic», o null
    const [confirming, setConfirming] = useState(null);

    // rows = «las filas del teclado»: la barra entera es una (sus botones que se pueden elegir), y cada opción de la
    // lista que se puede elegir, otra
    const quickKeys = quick.map((item, index) => (isChoosable(item) ? `q${index}` : null)).filter(Boolean);
    const rows = [
        ...(quickKeys.length ? [quickKeys] : []),
        ...items.map((item, index) => (isOption(item) && isChoosable(item) ? [`l${index}`] : null)).filter(Boolean),
    ];

    //  Cada vez que se abre (o se abre en otro sitio), sin ninguna opción esperando confirmación
    useEffect(() => {
        setConfirming(null);
        quickColumnRef.current = 0;
    }, [menu.isOpen, menu.target]);

    //  El foco, al quedar colocado: a la primera opción si se abrió con el teclado; al menú si fue con el ratón
    useEffect(() => {
        if (!menu.isOpen || !menu.placed) return;
        if (menu.via === 'keyboard' && rows.length) nodesRef.current.get(rows[0][0])?.focus({ preventScroll: true });
        else menu.menuRef.current?.focus({ preventScroll: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [menu.isOpen, menu.placed, menu.via]);

    if (!menu.isOpen) return null;

    const focusKey = (key) => nodesRef.current.get(key)?.focus({ preventScroll: true });

    // position = «dónde está el foco»: { row, column } en 'rows', o null si está en el menú
    const position = () => {
        const active = document.activeElement;
        for (let row = 0; row < rows.length; row++) {
            const column = rows[row].findIndex(key => nodesRef.current.get(key) === active);
            if (column !== -1) return { row, column };
        }
        return null;
    };

    // stepRow = «a la fila de abajo o de arriba», dando la vuelta. En la barra, al botón en que se estuvo.
    const stepRow = (delta) => {
        if (!rows.length) return;
        const here = position();
        const row = here === null ? (delta > 0 ? 0 : rows.length - 1) : (here.row + delta + rows.length) % rows.length;
        const keys = rows[row];
        focusKey(keys[Math.min(quickColumnRef.current, keys.length - 1)]);
    };

    // stepColumn = «al botón de al lado», dentro de la barra y dando la vuelta. En la lista no hace nada.
    const stepColumn = (delta) => {
        const here = position();
        if (!here || rows[here.row].length < 2) return;
        const keys = rows[here.row];
        const column = (here.column + delta + keys.length) % keys.length;
        quickColumnRef.current = column;
        focusKey(keys[column]);
    };

    // labelOf = «el nombre de una opción por su llave»
    const labelOf = (key) => String((key.startsWith('q') ? quick : items)[Number(key.slice(1))]?.label ?? '');

    // typeahead = «la siguiente opción que empieza por esa letra», a partir de la que tiene el foco
    const typeahead = (letter) => {
        const all = rows.flat();
        const active = all.findIndex(key => nodesRef.current.get(key) === document.activeElement);
        const ordered = [...all.slice(active + 1), ...all.slice(0, active + 1)];
        const found = ordered.find(key => labelOf(key).trim().toLowerCase().startsWith(letter));
        if (found) focusKey(found);
    };

    const onKeyDown = (event) => {
        const handlers = {
            ArrowDown: () => stepRow(1),
            ArrowUp: () => stepRow(-1),
            ArrowRight: () => stepColumn(1),
            ArrowLeft: () => stepColumn(-1),
            Home: () => rows.length && focusKey(rows[0][0]),
            End: () => rows.length && focusKey(rows[rows.length - 1].at(-1)),
            Tab: () => menu.close({ restoreFocus: true }),
        };
        if (handlers[event.key]) {
            event.preventDefault();
            handlers[event.key]();
            return;
        }
        if (event.key.length === 1 && /\S/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            typeahead(event.key.toLowerCase());
        }
    };

    // choose = «elegir una opción»: se cierra, el foco vuelve a su sitio, y luego se hace lo que pide. Si pide
    // confirmación, el primer clic solo la pide.
    const choose = (item, key) => {
        if (item.disabled) return;
        if (item.confirm && confirming !== key) {
            setConfirming(key);
            return;
        }
        const target = menu.target;
        menu.close({ restoreFocus: true });
        item.onSelect?.(target);
    };

    // optionProps = «lo que llevan todos los botones de opción» (la 'key' de React va aparte: no se puede esparcir)
    const optionProps = (item, key) => ({
        ref: (element) => {
            if (element) nodesRef.current.set(key, element);
            else nodesRef.current.delete(key);
        },
        type: 'button',
        role: 'menuitem',
        tabIndex: -1,
        disabled: item.disabled,
        'aria-disabled': item.disabled || undefined,
        onClick: () => choose(item, key),
        onMouseEnter: (event) => { if (!item.disabled) event.currentTarget.focus({ preventScroll: true }); },
        //  Si el foco se va a otra opción, la que esperaba confirmación deja de esperarla
        onBlur: () => { if (confirming === key) setConfirming(null); },
    });

    return createPortal(
        <div
            ref={menu.menuRef}
            role='menu'
            aria-label={label}
            tabIndex={-1}
            className={`context-menu ${menu.placed ? 'context-menu--placed' : ''}`}
            style={menu.style}
            onKeyDown={onKeyDown}
            onContextMenu={event => event.preventDefault()}
        >
            {header && <div className='context-menu__header'>{header}</div>}

            {
                quick.length > 0 && (
                    <div className='context-menu__quick' role='group' aria-label='Acciones rápidas' style={{ '--quick-count': quick.length }}>
                        {quick.map((item, index) => {
                            const key = `q${index}`;
                            return (
                                <button
                                    key={key}
                                    {...optionProps(item, key)}
                                    aria-label={item.label}
                                    title={titleOf(item)}
                                    className={`context-menu__quick-item ${item.tone ? `context-menu__quick-item--${item.tone}` : ''}`}
                                    onFocus={() => { quickColumnRef.current = Math.max(0, quickKeys.indexOf(key)); }}
                                >
                                    <span className='context-menu__quick-icon' aria-hidden='true'>
                                        {iconOf(item.icon, 18)}
                                        {item.dot && <span className='context-menu__dot' />}
                                    </span>
                                    <span className='context-menu__quick-label'>{item.short ?? item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                )
            }

            {quick.length > 0 && items.length > 0 && <div role='separator' className='context-menu__separator' />}

            {items.map((item, index) => {
                if (item.type === 'separator') return <div key={`separator-${index}`} role='separator' className='context-menu__separator' />;
                if (item.type === 'section') return <div key={`section-${index}`} role='presentation' className='context-menu__section'>{item.label}</div>;

                const key = `l${index}`;
                const waiting = confirming === key;
                return (
                    <button
                        key={key}
                        {...optionProps(item, key)}
                        title={item.hint}
                        className={[
                            'context-menu__item',
                            item.danger && 'context-menu__item--danger',
                            item.tone && `context-menu__item--${item.tone}`,
                            waiting && 'context-menu__item--confirming',
                        ].filter(Boolean).join(' ')}
                    >
                        <span className='context-menu__icon' aria-hidden='true'>{iconOf(item.icon, 16)}</span>
                        <span className='context-menu__label' aria-live={item.confirm ? 'polite' : undefined}>{waiting ? item.confirm : item.label}</span>
                        {item.note && !waiting && <span className='context-menu__note'>{item.note}</span>}
                        {item.shortcut && !waiting && <kbd className='context-menu__shortcut'>{item.shortcut}</kbd>}
                    </button>
                );
            })}

            {
                footer && (
                    <div className='context-menu__footer'>
                        <span className='context-menu__footer-dot' style={{ background: footer.color ?? 'var(--color-jx-tinta3)' }} aria-hidden='true' />
                        <span className='context-menu__footer-text' title={footer.text}>{footer.text}</span>
                    </div>
                )
            }
        </div>,
        document.body,
    );
}


// isOption = «es una opción que se elige», no un separador ni un título de sección
const isOption = (item) => item && item.type !== 'separator' && item.type !== 'section';

// isChoosable = «se puede elegir»: no está apagada
const isChoosable = (item) => item && !item.disabled;

// iconOf = «el icono de una opción»: por su nombre (icons.jsx) o el elemento que trae
const iconOf = (icon, size) => (typeof icon === 'string' ? <MenuIcon name={icon} size={size} /> : icon ?? null);

// titleOf = «lo que dice un botón de la barra al pasar el ratón»: su nombre entero, su tecla y su nota
const titleOf = (item) => [
    item.shortcut ? `${item.label} (${item.shortcut})` : item.label,
    item.hint,
].filter(Boolean).join(' · ');
