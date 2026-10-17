import { WrapperText } from '../../../cells/GridCells.jsx';
import { groupTouches } from './managers.js';
import ManagerButtons from './ManagerButtons.jsx';


/*  LOS TOQUES DE UNA ROTACIÓN GUARDADA, DESPLEGADOS (pestaña «Registros»)
 *
 *  Se abren con la cápsula «N toques» de su fila (RegisterSavedRow). Una línea por toque —la placa del
 *  gerente, su nombre, la hora y la ✕ que lo quita—, agrupados por gerente como en la pestaña Mesas
 *  (groupTouches).
 *
 *  Arriba, los botones de los gerentes del local: cada clic apunta un toque nuevo, con la hora del clic,
 *  igual que en Mesas ('onAdd'). No salen en un pedido para llevar, que no lleva toques.
 *
 *  Un toque recuperado (recovered: true: se apuntó después, aquí en Registros) va en gris.
 *
 *  La hora se corrige con doble clic, como las demás, y el cambio sale por 'onEdit' con el _id del toque.
 *  Un toque guardado antes de que la API les diera _id no se puede señalar: se lee, pero no se corrige ni
 *  se quita.
 */


/*  @param {Array}    touches   los toques de la rotación, como los devuelve la API: [{ _id, ref, name, hourTouch }]
 *  @param {Array}    managers  los botones de los gerentes del local: de ellos salen el orden y la placa
 *  @param {function} onEdit    corrige un dato: (data, id) — ver editSaved en Registers
 *  @param {function} onAdd     apunta un toque del gerente que recibe; sin ella no se puede añadir
 *  @param {function} onDelete  quita un toque: (id del toque)
 */
export default function RegisterSavedTouches({ touches, managers, onEdit, onAdd, onDelete }) {

    const grouped = groupTouches(touches, managers);

    return (
        <div className='register-saved-touches' aria-label='Toques de gerente de esta mesa'>

            {
                onAdd && (
                    <div className='register-saved-touches__add'>
                        <span className='text-jx-tinta3'>Apuntar un toque:</span>
                        <ManagerButtons managers={managers} dimmed={false} onTouch={onAdd} />
                    </div>
                )
            }

            <div role='list'>
                {
                    grouped.length === 0 && (
                        <div className='register-saved-touches__row register-saved-touches__row--empty text-jx-tinta3'>
                            Sin toques todavía{onAdd ? ': pulsa un gerente para apuntar uno' : ''}
                        </div>
                    )
                }

                {
                    grouped.map((touch, position) => (
                        <div
                            key={touch._id ?? position}
                            role='listitem'
                            className={`register-saved-touches__row ${touch.startsGroup ? 'register-saved-touches__row--group' : ''} ${touch.recovered === true ? 'register-saved-touches__row--recovered' : ''}`}
                            title={touch.recovered === true ? 'Toque recuperado: se apuntó después, en Registros' : undefined}
                        >
                            {
                                touch.label
                                    ? <span className={`register-touch-label register-manager--${touch.label.startsWith('A') ? 'a' : 'g'}`}>{touch.label}</span>
                                    : <span />
                            }
                            <span className='min-w-0 truncate'>{touch.name || 'Sin nombre'}</span>
                            <span className='min-w-[72px]' title={touch._id ? 'Doble clic para corregir la hora' : undefined}>
                                <WrapperText value={touch.hourTouch} updateValue={touch._id ? hourTouch => onEdit({ hourTouch }, touch._id) : undefined} />
                            </span>
                            {
                                touch._id && onDelete
                                    ? (
                                        <button
                                            type='button'
                                            className='register-touch-delete'
                                            onClick={() => onDelete(touch._id)}
                                            title={`Quitar este toque de ${touch.name || 'gerente'}`}
                                            aria-label={`Quitar el toque de ${touch.name || 'gerente'} de las ${touch.hourTouch || 'sin hora'}`}
                                        >
                                            ✕
                                        </button>
                                    )
                                    : <span />
                            }
                        </div>
                    ))
                }
            </div>
        </div>
    );
}
