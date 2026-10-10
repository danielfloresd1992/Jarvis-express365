import { WrapperCell, WrapperText } from '../../../cells/GridCells.jsx';
import { getTimeReport } from '../../../../libs/date_time/calculate_time.js';
import { PROCESS_GRID } from './columns.js';
import { ALARM_COLOR } from './alarm.js';
import { DISH_TYPES } from '../../../../libs/tickets/tableRecords.js';


/*  UNA LÍNEA DE PROCESO: un pedido de la rotación
 *
 *      # Ticket │ Tipo de plato │ Toma de orden │ Listo en tablet │ Duración │ Listo en cocina │ Entrega de plato │ Duración
 *
 *  El número, el tipo, la toma de orden y Listo en tablet los pone la IA; Listo en cocina y Entrega de
 *  plato se anotan a mano. Todo se puede corregir —el número escribiéndolo, el tipo en su select, las
 *  horas con doble clic—, y lo corregido a mano la IA ya no lo pisa.
 *
 *  Las dos DURACIONES no se guardan: se calculan aquí, con la misma cuenta que las de la rotación.
 *  La primera es lo que tardó en salir en la tablet (listo en tablet − toma de orden), y la segunda
 *  lo que tardó en llegar a la mesa una vez listo (entrega de plato − listo en cocina).
 *
 *  Las horas van en tinta secundaria, un tono más suave que las de su rotación: son su detalle.
 *
 *  LO DE COLOR SALE DE LA LECTURA EN VIVO ('live': lo que dice ahora mismo el seguimiento de este
 *  pedido), no del registro: la raya de la izquierda es la alarma de tiempo (ver alarm.js), la línea
 *  se atenúa cuando el pedido ya salió de la pantalla, y la toma de orden va en ámbar cuando es una
 *  estimación. Un proceso anotado a mano, o uno de una sesión anterior, no tiene lectura en vivo y se
 *  pinta sin nada de eso.
 */


// durationBetween = «el tiempo entre dos horas del proceso». null si falta alguna: no hay nada que calcular.
const durationBetween = (from, to) => (from && to ? getTimeReport(from, to).timeTotal : null);


/*  @param {object}   process  el proceso: { ticketNumber, dishType, orderTaking, markedReadyOnTablet, readyInTheKitchen, dishDelivery, edited… }
 *  @param {object}   live     lo que dice ahora mismo el seguimiento de ese pedido, o undefined
 *  @param {function} onWrite  anota (campo, valor)
 */
export default function RegisterProcessLine({ process, live, onWrite }) {

    // write = «anotar un dato de esta línea»
    const write = (field) => (value) => onWrite(field, value);

    // stripe = «la raya de color de la izquierda»
    const stripe = ALARM_COLOR[live?.color];

    // estimated = «la toma de orden es una estimación»: el ticket se vio por primera vez ya despachado,
    // y su contador podía llevar un rato parado. Salvo que alguien la haya corregido a mano.
    const estimated = Boolean(live?.tomaOrdenAproximada) && !process.edited.includes('orderTaking');

    // tabletDuration / deliveryDuration = «las dos duraciones de la línea» (null = falta alguna de sus horas)
    const tabletDuration = durationBetween(process.orderTaking, process.markedReadyOnTablet);
    const deliveryDuration = durationBetween(process.readyInTheKitchen, process.dishDelivery);

    return (
        <div
            className={`register-process-line w-full ${live?.cerrado ? 'opacity-60' : ''}`}
            style={stripe ? { ...PROCESS_GRID, boxShadow: `inset 3px 0 0 ${stripe}` } : PROCESS_GRID}
        >
            {/*  El número de ticket: lo pone la IA, o se escribe en un proceso a mano  */}
            <WrapperCell classStyles='text-jx-tinta2'>
                <input
                    className='w-full h-full text-center bg-transparent tabular-nums'
                    type='text'
                    value={process.ticketNumber}
                    onChange={event => write('ticketNumber')(event.target.value)}
                    placeholder='-'
                    aria-label='Número de ticket'
                />
            </WrapperCell>

            {/*  El tipo de plato, con las opciones del formato del Excel (DISH_TYPES)  */}
            <WrapperCell classStyles='text-jx-tinta2'>
                <select
                    className='w-full h-full text-center bg-transparent cursor-pointer'
                    value={process.dishType}
                    onChange={event => write('dishType')(event.target.value)}
                    aria-label='Tipo de plato'
                >
                    <option value=''>-</option>
                    {DISH_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
            </WrapperCell>

            <WrapperCell
                classStyles={estimated ? 'text-jx-ocre-texto italic' : 'text-jx-tinta2'}
                titulo={estimated ? 'Hora estimada: el ticket ya estaba despachado cuando se le vio, y su contador podía estar parado' : undefined}
            >
                <WrapperText value={process.orderTaking} updateValue={write('orderTaking')} />
            </WrapperCell>

            <WrapperCell classStyles='text-jx-tinta2'>
                <WrapperText value={process.markedReadyOnTablet} updateValue={write('markedReadyOnTablet')} />
            </WrapperCell>

            {/*  DURACIÓN en la tablet: de la toma de orden a «listo en tablet». Calculada: sin 'updateValue'.  */}
            <WrapperCell>
                <WrapperText classStyles={tabletDuration ? 'text-jx-tinta2' : 'text-jx-tinta3'} value={tabletDuration ?? '00:00:00'} />
            </WrapperCell>

            <WrapperCell classStyles='text-jx-tinta2'>
                <WrapperText value={process.readyInTheKitchen} updateValue={write('readyInTheKitchen')} />
            </WrapperCell>

            <WrapperCell classStyles='text-jx-tinta2'>
                <WrapperText value={process.dishDelivery} updateValue={write('dishDelivery')} />
            </WrapperCell>

            {/*  DURACIÓN de la entrega: de «listo en cocina» a la mesa. Calculada: sin 'updateValue'.  */}
            <WrapperCell>
                <WrapperText classStyles={deliveryDuration ? 'text-jx-tinta2' : 'text-jx-tinta3'} value={deliveryDuration ?? '00:00:00'} />
            </WrapperCell>
        </div>
    );
}
