import { useState } from 'react';
import './formFields.css';


/*  EL RECORRIDO: LAS HORAS DE UN FORMULARIO, EN SU ORDEN (propuesta «C · Línea de tiempo», elegida por el usuario)
 *
 *  Una fila por hora: un punto en la raya del recorrido, el nombre, el campo de la hora y, a la derecha, una nota
 *  —lo que tardó hasta ella, lo que falta—. El tramo que llega a una hora marcada como 'late' va en rojo, y su punto
 *  también. Un punto hueco es una hora que todavía no está.
 *
 *  La hora se escribe con cifras y los dos puntos se ponen solos ('101008' → '10:10:08'); pegar '10:10:08' también
 *  vale. Al salir del campo, si no es una hora de 00:00:00 a 23:59:59, se pone en rojo y dice cómo se escribe. El
 *  'pattern' sigue ahí: el formulario no se envía con una hora mal escrita.
 *
 *  Solo pinta: cada formulario guarda sus horas y calcula sus tiempos, y los pasa en 'steps'.
 */


// CLOCK = «una hora 'HH:MM:SS' de verdad», de 00:00:00 a 23:59:59
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

// CLOCK_PATTERN = «lo mismo, para el atributo 'pattern'» (el que ya usaban los formularios)
export const CLOCK_PATTERN = '^(([0-1]\\d)|(2[0-3]))(:[0-5]\\d){2}$';

// isClock = «es una hora 'HH:MM:SS' de verdad»
export const isClock = (value) => CLOCK.test(String(value ?? ''));


// typedClock = «lo que se teclea, como hora»: solo cifras, hasta seis, con los dos puntos puestos solos.
// Una hora entera pegada tal cual se respeta.
export function typedClock(text) {
    const raw = String(text ?? '');
    if (CLOCK.test(raw)) return raw;

    const digits = raw.replace(/\D/g, '').slice(0, 6);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}:${digits.slice(4)}`;
}


/*  TrackNote = «la nota de una hora»: lo que tardó hasta ella
 *
 *  @param {string} tone      'plain' (por defecto) | 'late' (pasó del límite: píldora roja) | 'ok' (en tiempo: verde) |
 *                            'pending' (todavía no hay con qué calcular)
 *  @param {string} duration  opcional. La duración, 'HH:MM:SS': va delante, en monoespaciada
 */
export function TrackNote({ tone = 'plain', duration, children }) {
    return (
        <span className={`ff-note ff-note--${tone}`}>
            {duration && <b className='ff-mono'>{duration}</b>}
            {duration && children ? ' ' : null}
            {children}
        </span>
    );
}


/*  UNA HORA DEL RECORRIDO
 *
 *  @param {object}  step      { id, label, value, onChange, note, late, required }
 *  @param {boolean} first     es la primera: sin raya por arriba
 *  @param {boolean} last      es la última: sin raya por abajo
 *  @param {boolean} nextLate  la siguiente pasó de su límite: el tramo de aquí a ella, en rojo
 */
function TimeStep({ step, first, last, nextLate }) {

    // touched = «ya se salió del campo alguna vez»: antes no se marca como mal escrita, que se está escribiendo
    const [touched, setTouched] = useState(false);

    const value = String(step.value ?? '');
    const invalid = touched && value !== '' && !CLOCK.test(value);
    const node = step.late ? 'late' : CLOCK.test(value) ? 'done' : 'empty';
    const noteId = `${step.id}-nota`;

    return (
        <div className={`ff-step ${invalid ? 'ff-step--invalid' : ''}`}>
            <span className='ff-step__rail' aria-hidden='true'>
                {!first && <span className={`ff-step__line ff-step__line--top ${step.late ? 'ff-step__line--late' : ''}`} />}
                {!last && <span className={`ff-step__line ff-step__line--bottom ${nextLate ? 'ff-step__line--late' : ''}`} />}
                <span className={`ff-step__node ff-step__node--${node}`} />
            </span>

            <label className='ff-step__label' htmlFor={step.id}>{step.label}</label>

            <input
                id={step.id}
                className='ff-time'
                type='text'
                inputMode='numeric'
                autoComplete='off'
                placeholder='HH:MM:SS'
                maxLength={8}
                pattern={CLOCK_PATTERN}
                required={step.required !== false}
                value={value}
                onChange={event => step.onChange(typedClock(event.target.value))}
                onBlur={() => setTouched(true)}
                aria-invalid={invalid || undefined}
                aria-describedby={noteId}
            />

            <span className='ff-step__note' id={noteId}>
                {
                    invalid ? (
                        <span className='ff-error'>
                            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' aria-hidden='true'>
                                <circle cx='12' cy='12' r='9' />
                                <path d='M12 8v5' />
                                <path d='M12 16h.01' />
                            </svg>
                            Escribe la hora como HH:MM:SS
                        </span>
                    ) : step.note
                }
            </span>
        </div>
    );
}


/*  @param {string} title  el nombre del recorrido: 'Recorrido del pedido', 'Recorrido de la mesa'…
 *  @param {Array}  steps  las horas, en su orden: { id, label, value, onChange(hora), note, late, required }
 *                           id        el del campo (único en la página)
 *                           note      lo que va a la derecha (TrackNote)
 *                           late      el tramo que llega a esta hora pasó de su límite: en rojo
 *                           required  false si se puede enviar sin ella (por defecto, se pide)
 */
export default function TimeTrack({ title = 'Recorrido', steps }) {
    return (
        <fieldset className='ff-track'>
            <legend className='ff-track__title'>{title} <span>· HH:MM:SS, 24 h</span></legend>
            {
                steps.map((step, index) => (
                    <TimeStep
                        key={step.id}
                        step={step}
                        first={index === 0}
                        last={index === steps.length - 1}
                        nextLate={steps[index + 1]?.late === true}
                    />
                ))
            }
        </fieldset>
    );
}
