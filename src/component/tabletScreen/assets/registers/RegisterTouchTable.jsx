import { Fragment } from 'react';
import { WrapperText } from '../../../cells/GridCells.jsx';
import { groupTouches } from './managers.js';
import { touchDurationSeconds, formatDuration } from '../../../../libs/date_time/touchFinish.js';


/*  LA TABLA DE LOS TOQUES DE UNA ROTACIÓN: Inicio, Fin y lo que duró cada uno
 *
 *  La propuesta «B · Por gerente, con subtotales», elegida por el usuario para Mesas, y la misma en Registros
 *  (pedido del usuario): por eso vive aparte y la usan las dos listas, RegisterTouchList (Mesas, flotando bajo su
 *  fila) y RegisterSavedTouches (Registros, desplegada bajo la rotación guardada).
 *
 *  AGRUPADOS POR GERENTE, en el orden de sus botones: cada gerente con su cabecera —su placa, su nombre, cuántos
 *  toques dio y lo que suman— y debajo sus toques por hora. Al pie, el total de la mesa. Las duraciones salen de
 *  'hourTouch' y 'hourTouchFinish' (libs/date_time/touchFinish.js); un toque de antes de existir la hora de fin no
 *  tiene duración, enseña '-' y no cuenta en las sumas.
 *
 *  Las dos horas se corrigen como las de los procesos (WrapperText): dos clics abren el campo. La de fin, vacía,
 *  no se estampa con un clic: en un toque viejo «ahora» no es su fin. Un toque sin id (en Registros, uno guardado
 *  antes de que la API les diera _id) se lee, pero no se corrige ni se quita.
 *
 *  Un toque recuperado (recovered: true: se apuntó después, en Registros) va en gris.
 *
 *  Su aspecto va en las clases 'register-touch-…' de registers.css; los colores de fondo, en '--touch-card', que
 *  pone cada lista.
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
// empieza cada gerente ('startsGroup'). 'idOf' dice cuál es el id de un toque.
function touchGroups(touches, managers, idOf) {
    const groups = [];

    groupTouches(touches, managers).forEach((touch, position) => {
        if (touch.startsGroup || groups.length === 0) {
            const manager = touch.label ? managers.find(button => button.label === touch.label) : undefined;
            groups.push({ key: idOf(touch) ?? `grupo-${position}`, label: touch.label, name: shownName(touch, manager), touches: [] });
        }
        groups[groups.length - 1].touches.push({ ...touch, key: idOf(touch) ?? `toque-${position}`, seconds: touchDurationSeconds(touch.hourTouch, touch.hourTouchFinish) });
    });

    return groups.map(group => ({ ...group, seconds: sumOf(group.touches) }));
}

// lasted = «lo que se lee en la columna Duró», con su clase y su porqué cuando no hay duración
const lasted = (touch) => {
    if (touch.seconds !== null) return { text: formatDuration(touch.seconds), look: '', why: undefined };
    if (!touch.hourTouchFinish) return { text: '-', look: 'register-touch-line__lasted--none', why: 'Toque de antes de existir la hora de fin' };
    return { text: '-', look: 'register-touch-line__lasted--wrong', why: 'La hora de fin queda antes de la del toque: corrígela con doble clic' };
};

// byId = «el id de un toque en Mesas»: 'id' (los de Registros, de la API, lo traen en '_id')
const byId = (touch) => touch.id;


/*  @param {Array}    touches    los toques: [{ id o _id, ref, name, hourTouch, hourTouchFinish, recovered? }]
 *  @param {Array}    managers   los botones de los gerentes (managers.js): de ellos salen el orden, la placa y el nombre
 *  @param {function} idOf       el id de un toque (por defecto, 'id'); sin id, el toque no se corrige ni se quita
 *  @param {function} onWrite    corrige una hora: (id del toque, 'hourTouch' o 'hourTouchFinish', hora)
 *  @param {function} onDelete   borra un toque: (id del toque). Sin ella no sale la papelera
 *  @param {string}   emptyText  lo que se lee sin toques
 *  @param {node}     children   lo que va justo debajo de la cabecera de columnas (en Mesas, la fila manual)
 */
export default function RegisterTouchTable({ touches, managers, idOf = byId, onWrite, onDelete, emptyText = 'Todavía no hay toques en esta mesa', children }) {

    // groups = «los toques por gerente», con sus duraciones
    const groups = touchGroups(touches, managers, idOf);

    // tableSeconds = «lo que suman todos los toques de la mesa» (null si no se sabe de ninguno)
    const tableSeconds = sumOf(groups.flatMap(group => group.touches));

    return (
        <>
            <div className='register-touch-grid register-touch-grid--columns' aria-hidden='true'>
                <span />
                <span>Inicio</span>
                <span>Fin</span>
                <span>Duró</span>
                <span />
            </div>

            {children}

            {touches.length === 0 && <div className='register-touch-empty'>{emptyText}</div>}

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
                                const id = idOf(touch);
                                const recovered = touch.recovered === true;

                                // write = «corregir esta hora», solo si el toque tiene id y la lista deja corregir
                                const write = (field) => (id && onWrite ? (value) => onWrite(id, field, value) : undefined);

                                return (
                                    <div
                                        key={touch.key}
                                        className={`register-touch-grid register-touch-line ${recovered ? 'register-touch-line--recovered' : ''}`}
                                        title={recovered ? 'Toque recuperado: se apuntó después, en Registros' : undefined}
                                    >
                                        <span className='register-touch-line__order'>{index + 1}.º</span>

                                        <span className='register-touch-line__time' title={write('hourTouch') ? 'Doble clic para corregir la hora del toque' : undefined}>
                                            <WrapperText value={touch.hourTouch ?? ''} updateValue={write('hourTouch')} />
                                        </span>

                                        <span className='register-touch-line__time' title={write('hourTouchFinish') ? 'Doble clic para corregir la hora de fin' : undefined}>
                                            <WrapperText value={touch.hourTouchFinish ?? ''} updateValue={write('hourTouchFinish')} stampOnClick={false} />
                                        </span>

                                        <span className={`register-touch-line__lasted ${lastedCell.look}`} title={lastedCell.why}>{lastedCell.text}</span>

                                        {
                                            id && onDelete
                                                ? (
                                                    <button type='button' className='register-touch-delete' onClick={() => onDelete(id)} aria-label={`Borrar el toque de las ${touch.hourTouch || 'sin hora'}`} title='Borrar este toque'>
                                                        <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                                                            <path d='M3 6h18' />
                                                            <path d='M8 6V4h8v2' />
                                                            <path d='M6 6l1 14h10l1-14' />
                                                        </svg>
                                                    </button>
                                                )
                                                : <span />
                                        }
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
        </>
    );
}
