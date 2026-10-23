import { Fragment, useEffect, useReducer, useRef } from 'react';
import { timeReducer, initialState, formatTime, SEGMENT_MAX, SEGMENT_LABELS } from './timeSegments.js';


/*  EL CAMPO DE HORA DE LAS CELDAS: HH:MM:SS sin teclear los «:»
 *
 *  Lo abren las celdas de hora (WrapperText, en GridCells.jsx) con el doble clic. Son tres bloques, y
 *  cada uno se anuncia a los lectores de pantalla como un selector numérico ('spinbutton').
 *
 *      0-9          escribe en el bloque; con dos cifras salta al siguiente
 *      ← →          cambia de bloque (la cruceta)
 *      ↑ ↓          sube o baja el bloque, y da la vuelta: 59 → 00
 *      : o espacio  salta al siguiente
 *      Retroceso    borra la última cifra; en un bloque vacío vuelve al anterior
 *      Enter        guarda
 *      Escape       descarta: la hora se queda como estaba
 *
 *  Salir del campo también guarda. Pegar «10:20:00» o «102000» rellena los tres bloques.
 *
 *  Lo que hace cada tecla está en timeSegments.js, sin React y con su prueba: aquí solo se pinta, se
 *  lleva el foco al bloque activo y se avisa a la celda.
 */


/*  @param {string}   value       la hora de la celda: 'HH:MM:SS', o '' si no tiene
 *  @param {function} onCommit    recibe la hora nueva ('' si se dejó sin ninguna cifra) y por qué se guardó:
 *                                'enter' o 'blur'. La celda baja a la siguiente solo con Enter (como en Excel)
 *  @param {function} onCancel    se descartó con Escape
 *  @param {string}   initialKey  una cifra con la que se abrió el campo (se escribió sobre la celda elegida, como en
 *                                Excel): entra como primera cifra, reemplazando lo que había
 */
export default function CellTimeInput({ value, onCommit, onCancel, initialKey = '' }) {

    const [state, dispatch] = useReducer(timeReducer, value, initialState);

    //  Abierto escribiendo una cifra: esa cifra ya cuenta, y reemplaza lo que había en el primer bloque
    useEffect(() => {
        if (/^\d$/.test(initialKey)) dispatch({ type: 'digit', digit: initialKey });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // inputsRef = «los campos de los tres bloques», para llevar el foco al activo
    const inputsRef = useRef([]);

    // doneRef = «ya se guardó o se descartó». Enter cierra el campo, y al desmontarse todavía puede llegar
    // un blur que guardaría otra vez.
    const doneRef = useRef(false);

    //  El foco sigue al bloque activo y, al entrar en él, su contenido queda seleccionado: se ve que lo
    //  siguiente que se escriba lo reemplaza.
    useEffect(() => {
        const input = inputsRef.current[state.active];
        if (!input) return;
        if (document.activeElement !== input) input.focus();
        if (state.fresh) input.select();
    });

    // finish = «cerrar el campo», guardando o no. Una sola vez. 'reason' dice por qué se cerró ('enter' | 'blur' |
    // 'escape'): la celda lo usa para decidir si baja a la siguiente.
    const finish = (save, reason) => {
        if (doneRef.current) return;
        doneRef.current = true;
        if (save) onCommit(formatTime(state.segments), reason);
        else onCancel(reason);
    };

    // keyAction = «lo que pide una tecla al reductor». null = no es del campo: Tab y las demás hacen lo de siempre.
    const keyAction = (key) => {
        if (/^\d$/.test(key)) return { type: 'digit', digit: key };
        if (key === 'ArrowRight' || key === ':' || key === ' ') return { type: 'move', to: state.active + 1 };
        if (key === 'ArrowLeft') return { type: 'move', to: state.active - 1 };
        if (key === 'ArrowUp') return { type: 'step', delta: 1 };
        if (key === 'ArrowDown') return { type: 'step', delta: -1 };
        if (key === 'Backspace') return { type: 'backspace' };
        return null;
    };

    //  Las teclas del campo no suben a la tabla: sus flechas cambian de bloque, no de celda (GridNav.jsx)
    const handleKeyDown = (event) => {
        event.stopPropagation();

        if (event.key === 'Enter' || event.key === 'Escape') {
            event.preventDefault();
            return finish(event.key === 'Enter', event.key === 'Enter' ? 'enter' : 'escape');
        }

        const action = keyAction(event.key);
        if (!action) return;
        event.preventDefault();
        dispatch(action);
    };

    //  Salir del campo guarda; pasar de un bloque a otro no es salir.
    const handleBlur = (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) finish(true, 'blur');
    };

    const handlePaste = (event) => {
        event.preventDefault();
        dispatch({ type: 'paste', text: event.clipboardData.getData('text') });
    };

    return (
        <div
            role='group'
            aria-label='Hora'
            className='w-full h-full flex items-center justify-center rounded font-mono tabular-nums shadow-[inset_0_0_0_1px_var(--color-jx-verde-barra)] bg-jx-tarjeta'
            onBlur={handleBlur}
            onPaste={handlePaste}
        >
            {
                state.segments.map((segment, index) => (
                    <Fragment key={SEGMENT_LABELS[index]}>
                        {index > 0 && <span aria-hidden='true' className='text-jx-tinta3 select-none'>:</span>}
                        <input
                            ref={element => { inputsRef.current[index] = element; }}
                            type='text'
                            inputMode='numeric'
                            role='spinbutton'
                            aria-label={SEGMENT_LABELS[index]}
                            aria-valuemin={0}
                            aria-valuemax={SEGMENT_MAX[index]}
                            aria-valuenow={segment === '' ? undefined : Number(segment)}
                            className='w-[2.2ch] p-0 text-center bg-transparent rounded-sm caret-transparent outline-none focus:bg-jx-arena selection:bg-jx-verde-texto selection:text-white placeholder:text-jx-tinta4 placeholder:not-italic'
                            value={segment}
                            placeholder='00'
                            onKeyDown={handleKeyDown}
                            onFocus={() => dispatch({ type: 'move', to: index })}
                            //  Lo escrito lo pone el teclado (handleKeyDown), no el campo: así no se cuela
                            //  nada que no sea una cifra.
                            onChange={() => {}}
                        />
                    </Fragment>
                ))
            }
        </div>
    );
}
