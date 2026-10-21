import { WrapperCell, WrapperText } from '../../../cells/GridCells.jsx';
import { getTimeReport } from '../../../../libs/date_time/calculate_time.js';
import { recordDay, dayText, shortDayText, staleSaveProblem } from '../../../../libs/tickets/staleRecords.js';


/*  UNA ROTACIÓN DE OTRO DÍA, EN EL BLOQUE DE PENDIENTES (RegisterStaleBlock)
 *
 *  Las mismas columnas que una fila de Mesas, pero de solo lectura: las horas sin reloj ni ✕ y sin doble clic
 *  (WrapperText sin 'updateValue'), la mesa sin campo, sin gerentes ni procesos que tocar. En amarillo pálido, como
 *  el bloque. Solo dos teclas, en los sitios de siempre: la papelera en el del «+» y el disquete, amarillo, en el
 *  suyo. En la celda de los gerentes, el candado de «Solo lectura»; cuántos toques tenía, al pasar el ratón.
 *
 *  Su aspecto va en las clases 'register-stale-…' de registers.css.
 */


// duration = «una duración de la rotación», o '—' si le falta una de sus dos horas
const duration = (start, end) => (start && end ? getTimeReport(start, end).timeTotal : '—');

// LockIcon = «el candado»
function LockIcon({ size = 12 }) {
    return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
            <rect x='5' y='11' width='14' height='10' rx='2' />
            <path d='M8 11V7a4 4 0 0 1 8 0v4' />
        </svg>
    );
}


/*  @param {object}   record        la rotación
 *  @param {object}   grid          la rejilla de la tabla (tableGrid), para que cuadre con sus columnas
 *  @param {boolean}  hasManagers   el local tiene gerentes: hay columna de gerentes
 *  @param {boolean}  showDay       el bloque tiene rotaciones de varios días: cada una dice el suyo
 *  @param {boolean}  busy          se está guardando: las teclas se quedan quietas
 *  @param {function} onSave        guardarla
 *  @param {function} onDelete      eliminarla
 */
export default function RegisterStaleRow({ record, grid, hasManagers, showDay, busy, onSave, onDelete }) {

    const takeOut = record.takeOut === true;
    const problem = staleSaveProblem(record);
    const day = recordDay(record);
    const table = record.tableNumber || 'sin número';

    // times = «las seis celdas de la mesa», en el orden de las columnas
    const times = takeOut
        ? ['—', '—', '—', '—', '—', '—']
        : [
            record.hourOccupies,
            record.hourFirstAttention,
            duration(record.hourOccupies, record.hourFirstAttention),
            record.breakUp,
            record.tableCleaning,
            duration(record.breakUp, record.tableCleaning),
        ];

    return (
        <div className='register-stale-row' style={grid} title={`Rotación del ${day ? dayText(day) : 'otro día'}: no se puede modificar, solo guardar o eliminar`}>

            {/*  La papelera, en el sitio del «+»  */}
            <WrapperCell classStyles='register-stale-row__cell cursor-default'>
                <button type='button' className='register-stale-icon register-stale-icon--delete' onClick={() => onDelete(record)} disabled={busy} aria-label={`Eliminar la rotación de la mesa ${table}`} title='Eliminar esta rotación, sin guardarla'>
                    <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                        <path d='M3 6h18' />
                        <path d='M8 6V4h8v2' />
                        <path d='M6 6l1 14h10l1-14' />
                    </svg>
                </button>
            </WrapperCell>

            <WrapperCell classStyles='register-stale-row__cell register-stale-row__table gap-1.5'>
                <span>{record.tableNumber || '-'}</span>
                {showDay && day && <span className='register-stale-day'>{shortDayText(day)}</span>}
            </WrapperCell>

            {
                times.map((value, index) => (
                    <WrapperCell key={index} classStyles='register-stale-row__cell'>
                        <WrapperText value={value ?? ''} />
                    </WrapperCell>
                ))
            }

            {
                hasManagers && (
                    <WrapperCell classStyles='register-stale-row__cell register-stale-row__lock gap-1.5' titulo={`Solo lectura · ${record.touch.length === 0 ? 'sin toques de gerente' : `${record.touch.length} ${record.touch.length === 1 ? 'toque' : 'toques'} de gerente`}`}>
                        <LockIcon />
                        <span>Solo lectura</span>
                    </WrapperCell>
                )
            }

            {/*  El disquete, amarillo: guardarla como abandonada  */}
            <WrapperCell classStyles='register-stale-row__cell cursor-default'>
                <button type='button' className='register-stale-icon register-stale-icon--save' onClick={() => onSave(record)} disabled={busy || Boolean(problem)} aria-label={`Guardar la rotación de la mesa ${table}`} title={problem || 'Guardar en Registros de su día, marcada como abandonada'}>
                    <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                        <path d='M5 3h11l3 3v15H5z' />
                        <path d='M8 3v5h7V3' />
                        <path d='M8 21v-6h8v6' />
                    </svg>
                </button>
            </WrapperCell>

        </div>
    );
}

export { LockIcon };
