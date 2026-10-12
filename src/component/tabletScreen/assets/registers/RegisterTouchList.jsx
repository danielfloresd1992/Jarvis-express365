import { WrapperText } from '../../../cells/GridCells.jsx';
import { groupTouches } from './managers.js';


/*  LOS TOQUES DE GERENTE DE UNA ROTACIÓN, FLOTANDO DEBAJO DE SU FILA
 *
 *  El diseño «A · Lista compacta», elegido por el usuario: arriba la mesa y cuántos toques lleva, con su
 *  botón de cerrar; debajo, una línea por toque con la placa del gerente (G1, A2…), su nombre, la hora y
 *  la ✕ de borrar, que se aviva al pasar el ratón.
 *
 *  AGRUPADOS POR GERENTE (pedido del usuario): en el orden de sus botones y, dentro de cada uno, por
 *  hora. Cada línea lleva su placa y su nombre; la primera de cada gerente, una raya más marcada encima.
 *
 *  Va 'absolute', pegado a la derecha y justo debajo de la fila: flota encima de las de abajo sin
 *  empujarlas. 'z-[5]' lo pone encima de ellas pero debajo de la cabecera fija (z-10).
 *
 *  La hora se corrige como las de los procesos (WrapperText): dos clics abren el campo.
 */


/*  @param {string}   tableNumber  la mesa de la rotación
 *  @param {Array}    touches      sus toques: [{ id, ref, name, hourTouch }]
 *  @param {Array}    managers     los botones de los gerentes (managers.js): de ellos salen el orden y la placa
 *  @param {function} onWrite      corrige la hora de un toque (id del toque, hora)
 *  @param {function} onDelete     borra un toque (id del toque)
 *  @param {function} onClose      cierra la lista
 */
export default function RegisterTouchList({ tableNumber, touches, managers, onWrite, onDelete, onClose }) {

    // grouped = «los toques en su orden»: por gerente y, dentro de cada uno, por hora (groupTouches)
    const grouped = groupTouches(touches, managers);

    return (
        <div
            className='register-process-card absolute right-0 top-full z-[5]'
            style={{ width: 280, marginTop: 4, boxShadow: '0 12px 28px rgb(47 42 30 / 0.18)' }}
        >

            <div className='flex items-center justify-between' style={{ padding: '6px 8px 6px 12px' }}>
                <div className='flex items-baseline gap-1.5'>
                    <span className='text-[13px] font-bold text-jx-tinta'>Mesa {tableNumber}</span>
                    <span className='text-[12px] text-jx-tinta2'>{touches.length} {touches.length === 1 ? 'toque' : 'toques'}</span>
                </div>
                <button type='button' className='register-touch-delete register-touch-close' onClick={onClose} aria-label='Cerrar la lista de toques' title='Cerrar'>
                    <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' aria-hidden='true'>
                        <path d='M6 6l12 12' />
                        <path d='M18 6 6 18' />
                    </svg>
                </button>
            </div>

            {
                grouped.map(touch => (
                    <div key={touch.id} className={`register-touch-row ${touch.startsGroup ? 'register-touch-row--group' : ''}`}>

                        {/*  La placa y el nombre, en todas las líneas (pedido del usuario)  */}
                        {
                            touch.label
                                ? <span className={`register-touch-label register-manager--${touch.label.startsWith('A') ? 'a' : 'g'}`}>{touch.label}</span>
                                : <span />
                        }
                        <span className='min-w-0 truncate text-[13px] text-jx-tinta'>{touch.name}</span>

                        <span className='text-[13px] text-jx-tinta' title='Doble clic para corregir la hora'>
                            <WrapperText value={touch.hourTouch} updateValue={hourTouch => onWrite(touch.id, hourTouch)} />
                        </span>

                        <button type='button' className='register-touch-delete' onClick={() => onDelete(touch.id)} aria-label={`Borrar el toque de las ${touch.hourTouch}`} title='Borrar este toque'>
                            <svg width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.6' strokeLinecap='round' aria-hidden='true'>
                                <path d='M6 6l12 12' />
                                <path d='M18 6 6 18' />
                            </svg>
                        </button>
                    </div>
                ))
            }

        </div>
    );
}
