import { useEffect, useMemo, useRef } from 'react';
import { inShift } from '../../../../libs/export/customerServiceWorkbook.js';
import { SHIFT_FOLDERS } from '../../../../libs/export/nasFolder.js';
import { isTakeOut } from '../../../../libs/tickets/tableRecords.js';
import { Sun, Moon } from './ShiftToggle.jsx';


/*  QUÉ TURNO SE EXPORTA: el menú del botón «Exportar»
 *
 *      EXPORTAR EL TURNO
 *      ▦  Todas      5 rotaciones · 1 para llevar
 *      ☀  Diurno     3 rotaciones
 *      ☾  Nocturno   2 rotaciones · 1 para llevar
 *      ─────────────────────────────────────────
 *      1 sin turno: solo sale en «Todas»
 *
 *  Cada opción dice qué lleva, contado como en la cabecera de Registros: las rotaciones aparte de los
 *  pedidos para llevar (isTakeOut). La que no tiene nada sale apagada: un Excel vacío no sirve.
 *
 *  Una rotación sin turno no se le adivina (ver inShift, en libs/export/customerServiceWorkbook.js): solo
 *  sale en «Todas», y la nota del pie dice cuántas son, para que no falten sin saber por qué.
 *
 *  Con la aplicación de escritorio el Excel va a su carpeta del NAS (libs/export/deliverWorkbook.js), y
 *  «Todas» a la del turno de la barra: otra nota del pie lo dice, con el nombre de esa carpeta.
 *
 *  Al abrirse, el cursor va a la primera opción que se puede elegir, y las flechas pasan de una a otra.
 *  Cerrarlo (Escape o un clic fuera) es cosa del botón. Su aspecto va en las clases 'register-export-menu…'
 *  de registers.css.
 */


// CalendarIcon = «el día entero»: el icono de «Todas»
const CalendarIcon = () => (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
        <rect x='3' y='5' width='18' height='16' rx='2' />
        <path d='M3 10h18M8 3v4M16 3v4' />
    </svg>
);

// CHOICES = «las opciones del menú», en su orden. 'id' es lo que se exporta (EXPORT_SHIFTS).
const CHOICES = [
    { id: 'all',   label: 'Todas',    icon: <CalendarIcon /> },
    { id: 'day',   label: 'Diurno',   icon: <Sun /> },
    { id: 'night', label: 'Nocturno', icon: <Moon /> },
];


// countShift = «qué lleva la exportación de un turno»: { rotations, takeOuts }
function countShift(rotations, shift) {
    const picked = rotations.filter(rotation => inShift(rotation, shift));
    const takeOuts = picked.filter(isTakeOut).length;
    return { rotations: picked.length - takeOuts, takeOuts };
}

// describe = «lo que lleva, en palabras»: '3 rotaciones · 1 para llevar', o 'nada'
function describe({ rotations, takeOuts }) {
    const parts = [
        rotations > 0 && `${rotations} ${rotations === 1 ? 'rotación' : 'rotaciones'}`,
        takeOuts > 0 && `${takeOuts} para llevar`,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(' · ') : 'nada';
}


/*  @param {Array}    rotations    las rotaciones guardadas del día, como las enseña Registers
 *  @param {function} onPick       recibe el turno elegido: 'all' | 'day' | 'night'
 *  @param {string}   folderShift  el turno de la barra ('day' | 'night'): la carpeta del NAS de «Todas»
 */
export default function ExportShiftMenu({ rotations, onPick, folderShift }) {

    // allFolder = «la carpeta del NAS a la que va "Todas"», si el Excel va al NAS (hay aplicación de escritorio que sabe)
    const allFolder = globalThis.window?.electronAPI?.nasGuardar ? SHIFT_FOLDERS[folderShift] : null;

    // choices = «cada opción, con lo que lleva y si se puede elegir»
    const choices = useMemo(() => CHOICES.map(choice => {
        const count = countShift(rotations, choice.id);
        return { ...choice, count, empty: count.rotations + count.takeOuts === 0 };
    }), [rotations]);

    // unassigned = «las que no tienen turno»: solo salen en «Todas»
    const unassigned = rotations.filter(rotation => rotation.shift !== 'day' && rotation.shift !== 'night').length;

    // menuRef = «el menú», para mover el cursor entre sus opciones
    const menuRef = useRef(null);

    // enabledItems = «las opciones que se pueden elegir», en su orden
    const enabledItems = () => [...(menuRef.current?.querySelectorAll('[role="menuitem"]:not(:disabled)') ?? [])];

    //  Al abrirse, el cursor a la primera que se puede elegir
    useEffect(() => {
        enabledItems()[0]?.focus();
    }, []);

    // moveFocus = «las flechas pasan de una opción a otra», dando la vuelta al llegar al final
    const moveFocus = (event) => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();

        const items = enabledItems();
        if (items.length === 0) return;

        const current = items.indexOf(document.activeElement);
        const step = event.key === 'ArrowDown' ? 1 : -1;
        items[(current + step + items.length) % items.length].focus();
    };

    return (
        <div ref={menuRef} role='menu' aria-label='Qué turno exportar' className='register-export-menu' onKeyDown={moveFocus}>
            <p className='register-export-menu__title' aria-hidden='true'>Exportar el turno</p>

            {
                choices.map(choice => (
                    <button
                        key={choice.id}
                        type='button'
                        role='menuitem'
                        className='register-export-menu__item'
                        disabled={choice.empty}
                        onClick={() => onPick(choice.id)}
                    >
                        <span className='register-export-menu__icon'>{choice.icon}</span>
                        <span className='register-export-menu__label'>{choice.label}</span>
                        <span className='register-export-menu__count'>{describe(choice.count)}</span>
                    </button>
                ))
            }

            {
                unassigned > 0 && (
                    <p className='register-export-menu__note'>
                        {unassigned} sin turno: solo {unassigned === 1 ? 'sale' : 'salen'} en «Todas»
                    </p>
                )
            }

            {
                allFolder && (
                    <p className='register-export-menu__note'>
                        «Todas» se guarda en la carpeta {allFolder}, el turno de la barra
                    </p>
                )
            }
        </div>
    );
}
