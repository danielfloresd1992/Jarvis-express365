import { Fragment } from 'react';
import { WrapperText } from '../../../cells/GridCells.jsx';
import { groupTouches } from './managers.js';
import RegisterTouchManual from './RegisterTouchManual.jsx';
import { touchDurationSeconds, formatDuration } from '../../../../libs/date_time/touchFinish.js';


/*  LOS TOQUES DE GERENTE DE UNA ROTACIÓN, FLOTANDO DEBAJO DE SU FILA
 *
 *  La propuesta «B · Por gerente, con subtotales», elegida por el usuario: arriba la mesa y cuántos toques
 *  lleva, con su botón de cerrar; debajo una tablita con Inicio, Fin y lo que duró cada toque.
 *
 *  AGRUPADOS POR GERENTE (pedido del usuario), en el orden de sus botones: cada gerente con su cabecera —su
 *  placa, su nombre, cuántos toques dio y lo que suman— y debajo sus toques por hora. Al pie, el total de la
 *  mesa. Las duraciones salen de 'hourTouch' y 'hourTouchFinish' (libs/date_time/touchFinish.js); un toque de
 *  antes de existir la hora de fin no tiene duración, enseña '-' y no cuenta en las sumas.
 *
 *  Va 'absolute', pegado a la derecha y justo debajo de la fila: flota encima de las de abajo sin
 *  empujarlas. 'z-[5]' lo pone encima de ellas pero debajo de la cabecera fija (z-10). Su aspecto va en las
 *  clases 'register-touch-…' de registers.css; 'register-process-card' es la que lo libra de las reglas de
 *  las celdas de la fila, de la que es hijo.
 *
 *  Las dos horas se corrigen como las de los procesos (WrapperText): dos clics abren el campo. La de fin,
 *  vacía, no se estampa con un clic: en un toque viejo «ahora» no es su fin.
 *
 *  LA PRIMERA FILA ES EL MODO MANUAL (pedido del usuario, RegisterTouchManual): una fila en blanco para
 *  apuntar un toque escribiendo sus horas, con el botón «Crear». Solo sale si se puede apuntar ('onCreate'):
 *  un pedido para llevar no lleva toques.
 */


// shownName = «el nombre que se lee de un gerente»: el suyo; o, si su nombre es la placa misma (los botones
// que salen de las cantidades del local se llaman 'G1', 'A2'…), lo que dice su botón: «Gerente 1».
const shownName = (touch, manager) => (touch.name && touch.name !== touch.label ? touch.name : manager?.title || touch.name || 'Sin gerente');

// sumOf = «lo que suman las duraciones que se conocen», o null si no se conoce ninguna
const sumOf = (touches) => {
    const known = touches.filter(touch => touch.seconds !== null);
    return known.length > 0 ? known.reduce((total, touch) => total + touch.seconds, 0) : null;
};

// touchGroups = «los toques, un grupo por gerente»: cada uno { key, label, name, touches, seconds }, con lo
// que duró cada toque ('seconds', null si no se sabe). Parte de groupTouches, que ya los ordena y marca dónde
// empieza cada gerente ('startsGroup').
function touchGroups(touches, managers) {
    const groups = [];

    groupTouches(touches, managers).forEach(touch => {
        if (touch.startsGroup || groups.length === 0) {
            const manager = touch.label ? managers.find(button => button.label === touch.label) : undefined;
            groups.push({ key: touch.id, label: touch.label, name: shownName(touch, manager), touches: [] });
        }
        groups[groups.length - 1].touches.push({ ...touch, seconds: touchDurationSeconds(touch.hourTouch, touch.hourTouchFinish) });
    });

    return groups.map(group => ({ ...group, seconds: sumOf(group.touches) }));
}

// lasted = «lo que se lee en la columna Duró», con su clase y su porqué cuando no hay duración
const lasted = (touch) => {
    if (touch.seconds !== null) return { text: formatDuration(touch.seconds), look: '', why: undefined };
    if (!touch.hourTouchFinish) return { text: '-', look: 'register-touch-line__lasted--none', why: 'Toque de antes de existir la hora de fin' };
    return { text: '-', look: 'register-touch-line__lasted--wrong', why: 'La hora de fin queda antes de la del toque: corrígela con doble clic' };
};


/*  @param {string}   tableNumber  la mesa de la rotación
 *  @param {Array}    touches      sus toques: [{ id, ref, name, hourTouch, hourTouchFinish }]
 *  @param {Array}    managers     los botones de los gerentes (managers.js): de ellos salen el orden, la placa y el nombre
 *  @param {function} onWrite      corrige una hora de un toque (id del toque, 'hourTouch' o 'hourTouchFinish', hora)
 *  @param {function} onDelete     borra un toque (id del toque)
 *  @param {function} onClose      cierra la lista
 *  @param {function} onCreate     opcional. Apunta un toque escrito a mano: (gerente, { hourTouch, hourTouchFinish }).
 *                                 Sin él no sale la fila manual.
 */
export default function RegisterTouchList({ tableNumber, touches, managers, onWrite, onDelete, onClose, onCreate }) {

    // groups = «los toques por gerente», con sus duraciones
    const groups = touchGroups(touches, managers);

    // tableSeconds = «lo que suman todos los toques de la mesa» (null si no se sabe de ninguno)
    const tableSeconds = sumOf(groups.flatMap(group => group.touches));

    return (
        <div className='register-process-card register-touch-card absolute right-0 top-full z-[5]' role='dialog' aria-label={`Toques de gerente de la mesa ${tableNumber}`}>

            <div className='register-touch-card__head'>
                <span className='register-touch-card__title'>Mesa {tableNumber}</span>
                <span className='register-touch-card__count'>{touches.length} {touches.length === 1 ? 'toque' : 'toques'}</span>
                <button type='button' className='register-touch-delete register-touch-close' onClick={onClose} aria-label='Cerrar la lista de toques' title='Cerrar'>
                    <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' aria-hidden='true'>
                        <path d='M6 6l12 12' />
                        <path d='M18 6 6 18' />
                    </svg>
                </button>
            </div>

            <div className='register-touch-grid register-touch-grid--columns' aria-hidden='true'>
                <span />
                <span>Inicio</span>
                <span>Fin</span>
                <span>Duró</span>
                <span />
            </div>

            {/*  La primera fila: apuntar un toque a mano  */}
            {onCreate && managers.length > 0 && <RegisterTouchManual managers={managers} onCreate={onCreate} />}

            {touches.length === 0 && <div className='register-touch-empty'>Todavía no hay toques en esta mesa</div>}

            {
                groups.map(group => (
                    <Fragment key={group.key}>

                        {/*  La cabecera del gerente: placa, nombre, cuántos toques y lo que suman  */}
                        <div className='register-touch-group'>
                            {
                                group.label
                                    ? <span className={`register-touch-label register-manager--${group.label.startsWith('A') ? 'a' : 'g'}`}>{group.label}</span>
                                    : <span className='register-touch-label register-touch-label--none' aria-hidden='true'>?</span>
                            }
                            <span className='register-touch-group__name' title={group.name}>{group.name}</span>
                            <span className='register-touch-group__count'>{group.touches.length} {group.touches.length === 1 ? 'toque' : 'toques'}</span>
                            <span className='register-touch-group__total'>{group.seconds === null ? '-' : formatDuration(group.seconds)}</span>
                        </div>

                        {
                            group.touches.map((touch, index) => {
                                const lastedCell = lasted(touch);
                                return (
                                    <div key={touch.id} className='register-touch-grid register-touch-line'>
                                        <span className='register-touch-line__order'>{index + 1}.º</span>

                                        <span className='register-touch-line__time' title='Doble clic para corregir la hora del toque'>
                                            <WrapperText value={touch.hourTouch} updateValue={value => onWrite(touch.id, 'hourTouch', value)} />
                                        </span>

                                        <span className='register-touch-line__time' title='Doble clic para corregir la hora de fin'>
                                            <WrapperText value={touch.hourTouchFinish ?? ''} updateValue={value => onWrite(touch.id, 'hourTouchFinish', value)} stampOnClick={false} />
                                        </span>

                                        <span className={`register-touch-line__lasted ${lastedCell.look}`} title={lastedCell.why}>{lastedCell.text}</span>

                                        <button type='button' className='register-touch-delete' onClick={() => onDelete(touch.id)} aria-label={`Borrar el toque de las ${touch.hourTouch}`} title='Borrar este toque'>
                                            <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                                                <path d='M3 6h18' />
                                                <path d='M8 6V4h8v2' />
                                                <path d='M6 6l1 14h10l1-14' />
                                            </svg>
                                        </button>
                                    </div>
                                );
                            })
                        }

                    </Fragment>
                ))
            }

            {/*  El total de la mesa: lo que suman los toques que tienen hora de fin  */}
            <div className='register-touch-card__total'>
                <span className='register-touch-card__total-label'>
                    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                        <circle cx='12' cy='12' r='9' />
                        <path d='M12 7v5l3 2' />
                    </svg>
                    Total de la mesa
                </span>
                <span className='register-touch-card__total-value'>{tableSeconds === null ? '-' : formatDuration(tableSeconds)}</span>
            </div>

        </div>
    );
}
