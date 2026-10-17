import { useRef, useState } from 'react';
import { getTimeReport } from '../../../../libs/date_time/calculate_time.js';
import { exceedsLimit } from '../../../../libs/date_time/timeLimit.js';
import { shiftOfTime } from '../../../../libs/date_time/operationalDay.js';
import { isTakeOut } from '../../../../libs/tickets/tableRecords.js';
import { recoveredMissing } from '../../../../libs/tickets/recoveredRotation.js';
import { SAVED_GRID, SAVED_COLUMNS, cellTint } from './RegisterSavedRow.jsx';
import { Sun, Moon } from './ShiftToggle.jsx';
import RecoveredTimeCell from './RecoveredTimeCell.jsx';


/*  UNA ROTACIÓN NUEVA, ANOTADA A MANO EN «REGISTROS»
 *
 *      Nueva │ Mesa │ Ocupa │ 1ra Atención │ Desocupa │ Limpieza │ T. 1ra atención │ T. limpieza │ ☀ Diurno ☾ Nocturno │ Cancelar Guardar
 *
 *  La que no se guardó en su momento desde Mesas y se apunta después (pedido del usuario): va a la API con
 *  recovered: true (libs/tickets/recoveredRotation.js). Es una fila más de la lista, con la misma rejilla
 *  (SAVED_GRID) y los mismos colores, encima de las guardadas, para que se vea dónde va a caer cada dato.
 *
 *      · la mesa se escribe; con '#' delante es un pedido para llevar, y sus horas van tachadas
 *      · las horas se escriben (RecoveredTimeCell): ya pasaron, no se estampan con la hora de ahora
 *      · los dos tiempos se calculan mientras se escribe, en rojo si pasan del límite del local
 *      · el turno empieza en el de la barra y, mientras no se toque, sigue a la hora de Ocupa (shiftOfTime)
 *      · los procesos no se anotan aquí; los toques, una vez guardada, con su cápsula, como en las demás
 *
 *  Guardar pide lo mismo que el disquete de Mesas —la mesa y, si no es para llevar, la Ocupa—, y mientras
 *  la API no contesta se apaga. Si falla, el porqué sale debajo de la fila y lo escrito se queda. Enter en
 *  la mesa guarda; Escape cancela. Su aspecto, en las clases 'register-new…' de registers.css.
 */


// TIME_LABELS = «cómo se llama cada hora», para los lectores de pantalla
const TIME_LABELS = { hourOccupies: 'Ocupa', hourFirstAttention: 'Primera atención', breakUp: 'Desocupa', tableCleaning: 'Limpieza' };

// EMPTY_TIMES = «las cuatro horas, sin ninguna»
const EMPTY_TIMES = { hourOccupies: '', hourFirstAttention: '', breakUp: '', tableCleaning: '' };

// SHIFT_CHOICES = «los dos turnos», como se eligen
const SHIFT_CHOICES = [
    { id: 'day', label: 'Diurno', icon: <Sun /> },
    { id: 'night', label: 'Nocturno', icon: <Moon /> },
];


/*  @param {string}   defaultShift    el turno de la barra (ShiftToggle): con él empieza
 *  @param {string}   attentionLimit  el límite de primera atención del local, 'HH:MM:SS'
 *  @param {string}   cleaningLimit   el límite de limpieza del local, 'HH:MM:SS'
 *  @param {function} onSave          guarda: ({ tableNumber, times, shift }) => Promise (addRecovered, en useSavedRotations)
 *  @param {function} onClose         cierra la fila: al guardarla o al cancelar
 */
export default function RegisterSavedNew({ defaultShift, attentionLimit, cleaningLimit, onSave, onClose }) {

    // tableNumber / times = «la mesa» y «sus cuatro horas», como se van escribiendo
    const [tableNumber, setTableNumber] = useState('');
    const [times, setTimes] = useState(EMPTY_TIMES);

    // shift / shiftChosen = «el turno» y «se eligió a mano»: mientras no, sigue a la hora de Ocupa
    const [shift, setShift] = useState(defaultShift === 'night' ? 'night' : 'day');
    const [shiftChosen, setShiftChosen] = useState(false);

    // saving / notice = «esperando a la API» y «por qué no se guardó» ('' si nada)
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState('');

    // tableInputRef = «el campo de la mesa»: el cursor empieza ahí, y vuelve si falta
    const tableInputRef = useRef(null);

    // takeOut = «es un pedido para llevar»: con '#' delante. No lleva horas de mesa.
    const takeOut = isTakeOut({ tableNumber: tableNumber.trim() });

    // writeTime = «anotar una hora». La de Ocupa mueve el turno, si no se eligió a mano.
    const writeTime = (field) => (value) => {
        setTimes(current => ({ ...current, [field]: value }));
        setNotice('');
        if (field === 'hourOccupies' && !shiftChosen) setShift(current => shiftOfTime(value) ?? current);
    };

    // attention / cleaning = «los dos tiempos», cuando ya están sus dos horas
    const attention = times.hourOccupies && times.hourFirstAttention ? getTimeReport(times.hourOccupies, times.hourFirstAttention, attentionLimit) : null;
    const cleaning = times.breakUp && times.tableCleaning ? getTimeReport(times.breakUp, times.tableCleaning, cleaningLimit) : null;

    // save = «guardarla»: primero lo que falta; luego la API, y al guardarse se cierra la fila
    const save = (event) => {
        event.preventDefault();
        if (saving) return;

        // sent = «lo que se manda»: las horas de un pedido para llevar no viajan
        const sent = { tableNumber: tableNumber.trim(), times: takeOut ? EMPTY_TIMES : times, shift };

        const missing = recoveredMissing(sent);
        if (missing.length > 0) {
            if (!sent.tableNumber) tableInputRef.current?.focus();
            return setNotice(`Falta ${missing.join(' y ')}`);
        }

        setSaving(true);
        setNotice('');
        onSave(sent)
            .then(() => onClose())
            .catch(error => {
                setSaving(false);
                setNotice(error?.message ?? 'No se pudo guardar la rotación');
            });
    };

    // cancelOnEscape = «Escape cancela», salvo el de un campo de hora abierto, que solo descarta esa hora
    const cancelOnEscape = (event) => {
        if (event.key === 'Escape' && !event.defaultPrevented && !saving) onClose();
    };

    return (
        <form
            className='register-saved-row register-new'
            style={SAVED_GRID}
            onSubmit={save}
            onKeyDown={cancelOnEscape}
            aria-label='Agregar una rotación recuperada'
            aria-busy={saving}
        >
            <div className='register-saved-cell' title='Rotación anotada a mano: se guarda como recuperada'>
                <span className='register-new-tag'>Nueva</span>
            </div>

            {/*  La mesa y las cuatro horas, con el color de su columna, como las guardadas  */}
            {
                SAVED_COLUMNS.map(column => {
                    if (column.id === 'tableNumber') return (
                        <div key={column.id} className='register-saved-cell text-[14px] font-bold' style={{ backgroundColor: cellTint(column) }}>
                            <input
                                ref={tableInputRef}
                                className='register-saved-input'
                                type='text'
                                value={tableNumber}
                                onChange={event => { setTableNumber(event.target.value); setNotice(''); }}
                                placeholder='Mesa'
                                aria-label='Número de mesa, o #ticket para un pedido para llevar'
                                autoFocus
                                disabled={saving}
                            />
                        </div>
                    );

                    if (takeOut) return (
                        <div key={column.id} className='register-saved-cell register-cell--na' style={{ backgroundColor: cellTint(column) }} title='Pedido para llevar: no lleva esta hora' />
                    );

                    return (
                        <div key={column.id} className='register-saved-cell' style={{ backgroundColor: cellTint(column) }}>
                            <RecoveredTimeCell value={times[column.id]} onChange={writeTime(column.id)} label={TIME_LABELS[column.id]} />
                        </div>
                    );
                })
            }

            {/*  Los dos tiempos, calculados mientras se escribe  */}
            {
                takeOut ? (
                    <>
                        <div className='register-saved-cell register-saved-cell--cycle register-cell--na' />
                        <div className='register-saved-cell register-saved-cell--cycle register-cell--na' />
                    </>
                ) : (
                    <>
                        <div className='register-saved-cell register-saved-cell--cycle'>
                            <span className={`register-saved-chip ${attention && exceedsLimit(attention.timeTotal, attentionLimit) ? 'register-saved-chip--late' : 'register-saved-chip--attention'}`}>{attention ? attention.timeTotal : '-'}</span>
                        </div>
                        <div className='register-saved-cell register-saved-cell--cycle'>
                            <span className={`register-saved-chip ${cleaning && exceedsLimit(cleaning.timeTotal, cleaningLimit) ? 'register-saved-chip--late' : 'register-saved-chip--cleaning'}`}>{cleaning ? cleaning.timeTotal : '-'}</span>
                        </div>
                    </>
                )
            }

            {/*  El turno: dos botones, el elegido marcado  */}
            <div className='register-saved-cell register-saved-cell--cycle' style={{ gridColumn: 'span 2' }}>
                <div className='register-new-shift' role='group' aria-label='Turno de la rotación'>
                    {
                        SHIFT_CHOICES.map(choice => (
                            <button
                                key={choice.id}
                                type='button'
                                aria-pressed={shift === choice.id}
                                onClick={() => { setShift(choice.id); setShiftChosen(true); }}
                                disabled={saving}
                            >
                                {choice.icon}
                                {choice.label}
                            </button>
                        ))
                    }
                </div>
            </div>

            {/*  Cancelar y Guardar  */}
            <div className='register-saved-cell register-saved-cell--cycle gap-2' style={{ gridColumn: 'span 2' }}>
                <button type='button' className='register-new-cancel' onClick={onClose} disabled={saving}>Cancelar</button>
                <button type='submit' className='register-new-save' disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
            </div>

            {/*  Por qué no se guardó, debajo y a lo ancho de la fila  */}
            {
                notice && (
                    <p className='register-new-notice' role='alert' style={{ gridColumn: '1 / -1' }}>{notice}</p>
                )
            }
        </form>
    );
}
