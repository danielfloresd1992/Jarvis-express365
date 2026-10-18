import { useState } from 'react';
import CellTimeInput from '../../../cells/CellTimeInput.jsx';
import { randomTouchFinish, touchDurationSeconds } from '../../../../libs/date_time/touchFinish.js';


/*  APUNTAR UN TOQUE A MANO — la primera fila de la lista de toques (RegisterTouchList)
 *
 *  El «modo manual» que pidió el usuario: una fila en blanco con el gerente, la hora del toque, la de fin
 *  y el botón «Crear». Es para el toque que no se marcó en su momento con la tecla del gerente.
 *
 *      la hora del toque   hace falta; sin ella «Crear» avisa
 *      la hora de fin      puede quedar vacía: entonces se pone sola, de 5 segundos a un minuto después,
 *                          como en los toques de la tecla (randomTouchFinish)
 *
 *  Las horas se escriben con el mismo campo de las celdas (CellTimeInput): un clic lo abre, y al salir de
 *  él la hora queda puesta. Al crear, las dos horas se vacían y el gerente se queda, por si hay otro.
 */


// optionName = «cómo se lee un gerente en la lista desplegable»: su nombre o, si su nombre es la placa misma
// (los botones de las cantidades del local), lo que dice su botón: «Gerente 1»
const optionName = (manager) => (manager.name && manager.name !== manager.label ? manager.name : manager.title);


/*  TimeField = «una hora de la fila manual»: cerrada, un hueco para escribir; abierta, el campo de las celdas
 *
 *  @param {string}   value        la hora puesta, 'HH:MM:SS', o ''
 *  @param {function} onChange     recibe la hora nueva
 *  @param {string}   placeholder  lo que se lee mientras está vacía
 *  @param {string}   label        qué hora es, para los lectores de pantalla
 *  @param {string}   hint         lo que se lee al pasar el ratón
 */
function TimeField({ value, onChange, placeholder, label, hint }) {
    const [editing, setEditing] = useState(false);

    return (
        <span className='register-touch-manual__slot'>
            {
                editing ? (
                    <CellTimeInput
                        value={value}
                        onCommit={time => { setEditing(false); onChange(time); }}
                        onCancel={() => setEditing(false)}
                    />
                ) : (
                    <button
                        type='button'
                        className={`register-touch-manual__time ${value ? '' : 'register-touch-manual__time--empty'}`}
                        onClick={() => setEditing(true)}
                        aria-label={`${label}: ${value || 'sin poner'}`}
                        title={hint}
                    >
                        {value || placeholder}
                    </button>
                )
            }
        </span>
    );
}


/*  @param {Array}    managers  los botones de los gerentes (managers.js)
 *  @param {function} onCreate  apunta el toque: (gerente, { hourTouch, hourTouchFinish })
 */
export default function RegisterTouchManual({ managers, onCreate }) {

    const [managerId, setManagerId] = useState(managers[0]?.id ?? '');
    const [start, setStart] = useState('');
    const [finish, setFinish] = useState('');

    // problem = «por qué no se pudo crear», o '' si nada
    const [problem, setProblem] = useState('');

    // manager = «el gerente elegido»; si ya no está entre los botones, el primero
    const manager = managers.find(button => button.id === managerId) ?? managers[0];

    // create = «apuntar el toque». Valida, y la hora de fin vacía se pone sola (randomTouchFinish).
    const create = () => {
        if (!manager) return;
        if (!start) return setProblem('Falta la hora del toque');
        if (finish && touchDurationSeconds(start, finish) === null) return setProblem('La hora de fin queda antes de la del toque');

        onCreate(manager, { hourTouch: start, hourTouchFinish: finish || randomTouchFinish(start) });
        setStart('');
        setFinish('');
        setProblem('');
    };

    return (
        <>
            <div className='register-touch-grid register-touch-manual'>
                <select
                    className='register-touch-manual__manager'
                    value={manager?.id ?? ''}
                    onChange={event => setManagerId(event.target.value)}
                    aria-label='Gerente del toque'
                    title='El gerente del toque'
                >
                    {managers.map(button => <option key={button.id} value={button.id}>{button.label} · {optionName(button)}</option>)}
                </select>

                <TimeField
                    value={start}
                    onChange={time => { setStart(time); setProblem(''); }}
                    placeholder='--:--:--'
                    label='Hora del toque'
                    hint='La hora del toque: un clic para escribirla'
                />

                <TimeField
                    value={finish}
                    onChange={time => { setFinish(time); setProblem(''); }}
                    placeholder='auto'
                    label='Hora de fin'
                    hint='La hora de fin. Vacía, se pone sola: de 5 segundos a un minuto después del toque'
                />

                <button type='button' className='register-touch-manual__create' onClick={create} title='Apuntar este toque en la mesa'>
                    <svg width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round' aria-hidden='true'>
                        <path d='M12 5v14' />
                        <path d='M5 12h14' />
                    </svg>
                    Crear
                </button>
            </div>

            {problem && <div className='register-touch-manual__problem' role='alert'>{problem}</div>}
        </>
    );
}
