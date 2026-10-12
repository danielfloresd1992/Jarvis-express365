import { COLUMNS, PROCESS_COLUMNS } from './columns.js';
import SavedPerson from './SavedPerson.jsx';


/*  LOS CAMBIOS DE UNA ROTACIÓN GUARDADA, DESPLEGADOS (pestaña «Registros»)
 *
 *      Quién │ Hora │ Qué │ Antes │ Después
 *
 *  Se abren con la persona de la columna «Edición» (RegisterSavedRow). Es 'changes' de la rotación, que
 *  escribe la API en cada corrección, del más nuevo al más viejo. «Qué» es el nombre de la propiedad, el
 *  mismo título que tiene su columna, y dónde fue: la mesa, uno de sus procesos (por su número) o un
 *  toque (por su gerente). Solo se lee.
 */


// LABELS = «el nombre de cada propiedad que se corrige»: el título de su columna (la clave, si no tiene)
// 'touch' es un toque añadido (antes '-') o quitado (después '-'): la API lo anota así, con el toque en una línea.
const LABELS = Object.fromEntries(
    [...COLUMNS, ...PROCESS_COLUMNS, { id: 'hourTouch', title: 'Hora del toque' }, { id: 'touch', title: 'Toque' }].map(column => [column.id, column.title])
);

// clock = «una fecha como hora HH:MM de este equipo»
const clock = (date) => new Date(date).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });

// shown = «un valor como se enseña»: '-' si estaba vacío
const shown = (value) => (value === '' || value == null ? '-' : String(value));

// placeOf = «en qué parte de la rotación fue el cambio»: '' si en la mesa misma
function placeOf(rotation, target) {
    const position = (rotation.process ?? []).findIndex(item => item._id === target);
    if (position !== -1) return `Proceso ${position + 1}`;

    const touch = (rotation.touch ?? []).find(item => item._id === target);
    return touch ? `Toque de ${touch.name || 'gerente'}` : '';
}


/*  @param {object} rotation  la rotación, como la devuelve la API: de ella salen 'changes' y dónde fue cada uno
 */
export default function RegisterSavedChanges({ rotation }) {

    // changes = «los cambios, del más nuevo al más viejo»
    const changes = [...(rotation.changes ?? [])].reverse();

    return (
        <div className='register-saved-changes' aria-label='Cambios de esta mesa'>

            <div className='register-saved-changes__row register-saved-changes__head'>
                <span>Quién</span>
                <span>Hora</span>
                <span>Qué</span>
                <span>Antes</span>
                <span>Después</span>
            </div>

            {
                changes.map((change, position) => {
                    const place = placeOf(rotation, change.target);
                    return (
                        <div key={position} className='register-saved-changes__row'>
                            <SavedPerson user={change.user} />
                            <span className='font-mono tabular-nums text-jx-tinta2'>{clock(change.changedAt)}</span>
                            <span className='min-w-0 truncate' title={change.property}>
                                {LABELS[change.property] || change.property}
                                {place && <span className='text-jx-tinta3'> · {place}</span>}
                            </span>
                            <span className='register-saved-changes__old'>{shown(change.oldValue)}</span>
                            <span className='register-saved-changes__new'>{shown(change.newValue)}</span>
                        </div>
                    );
                })
            }
        </div>
    );
}
