import { WrapperText } from '../../../cells/GridCells.jsx';
import { DISH_TYPES } from '../../../../libs/tickets/tableRecords.js';
import SavedTextInput from './SavedTextInput.jsx';


/*  LOS PROCESOS DE UNA ROTACIÓN GUARDADA, DESPLEGADOS (pestaña «Registros»)
 *
 *      # Ticket │ Tipo de plato │ Toma de orden │ Listo en tablet │ Listo en cocina │ Entrega
 *
 *  Se abren con la cápsula «N procesos» de su fila (RegisterSavedRow). Todo se corrige como en la pestaña
 *  Mesas: el número escribiéndolo, el tipo en su select y las horas con doble clic. Cada cambio sale por
 *  'onEdit' con el _id del proceso.
 *
 *  Un proceso guardado antes de que la API les diera _id no se puede señalar: se lee y no se corrige.
 */


// HOURS = «las horas de un proceso», en su orden
const HOURS = [
    { id: 'orderTaking',         title: 'Toma de orden' },
    { id: 'markedReadyOnTablet', title: 'Listo en tablet' },
    { id: 'readyInTheKitchen',   title: 'Listo en cocina' },
    { id: 'dishDelivery',        title: 'Entrega' },
];


/*  @param {Array}    processes  los procesos de la rotación, como los devuelve la API
 *  @param {function} onEdit     corrige un dato: (data, id) — ver editSaved en Registers
 */
export default function RegisterSavedProcesses({ processes, onEdit }) {
    return (
        <div className='register-saved-processes' aria-label='Procesos de esta mesa'>

            <div className='register-saved-processes__row register-saved-processes__head'>
                <span># Ticket</span>
                <span>Tipo de plato</span>
                {HOURS.map(hour => <span key={hour.id}>{hour.title}</span>)}
            </div>

            {
                processes.map((process, position) => {

                    // edit = «corregir un dato de este proceso» (null si no tiene _id)
                    const edit = process._id ? (field) => (value) => onEdit({ [field]: value }, process._id) : null;

                    return (
                        <div key={process._id ?? position} className='register-saved-processes__row'>
                            <SavedTextInput value={process.ticketNumber} onCommit={edit?.('ticketNumber')} label='Número de ticket' />

                            <select
                                className='register-saved-input'
                                value={process.dishType}
                                disabled={!edit}
                                onChange={event => edit('dishType')(event.target.value)}
                                aria-label='Tipo de plato'
                            >
                                <option value=''>-</option>
                                {DISH_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>

                            {HOURS.map(hour => <WrapperText key={hour.id} value={process[hour.id]} updateValue={edit?.(hour.id)} />)}
                        </div>
                    );
                })
            }
        </div>
    );
}
