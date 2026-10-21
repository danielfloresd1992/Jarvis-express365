import { WrapperCell, WrapperText } from '../../../cells/GridCells.jsx';
import { getTimeReport } from '../../../../libs/date_time/calculate_time.js';
import { PROCESS_GRID } from './columns.js';
import { ALARM_COLOR } from './alarm.js';
import { DISH_TYPES, optionsWith } from '../../../../libs/tickets/dishTypes.js';
import PreparationAlert, { missingForPreparation, isPreparationLate } from './PreparationAlert.jsx';
import ReportedFlag from './ReportedFlag.jsx';


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
 *  Los datos van en la tinta principal, como los de su rotación (pedido del usuario: en tinta secundaria,
 *  y más con la línea atenuada, no se leían). Solo lo vacío —una duración sin sus dos horas— va suave.
 *
 *  LO DE COLOR SALE DE LA LECTURA EN VIVO ('live': lo que dice ahora mismo el seguimiento de este
 *  pedido), no del registro: la raya de la izquierda es la alarma de tiempo (ver alarm.js), la línea
 *  se atenúa un poco cuando el pedido ya salió de la pantalla (al 75 %: al 60 % el texto quedaba
 *  ilegible), y la toma de orden va en ámbar cuando es una
 *  estimación. Un proceso anotado a mano, o uno de una sesión anterior, no tiene lectura en vivo y se
 *  pinta sin nada de eso.
 *
 *  LA DEMORA DE PREPARACIÓN (pedido del usuario), en la primera Duración: si el plato tiene tiempo en la carta del
 *  local para el turno de la rotación ('limit'), la duración se compara con él, como las de primera atención y
 *  limpieza: en tiempo va en verde; pasada —o pasado el tiempo sin estar listo en tablet todavía ('waitingTooLong',
 *  del bucle de la rotación)—, la celda va en rojo con el marco que late y el icono de cocina que titila
 *  (PreparationAlert); reportada ('preparationDelay'), en rojo claro con la bandera de «Reportada».
 */


// durationBetween = «el tiempo entre dos horas del proceso». null si falta alguna: no hay nada que calcular.
const durationBetween = (from, to) => (from && to ? getTimeReport(from, to).timeTotal : null);


/*  @param {object}   process  el proceso: { ticketNumber, dishType, orderTaking, markedReadyOnTablet, readyInTheKitchen, dishDelivery, edited… }
 *  @param {object}   live     lo que dice ahora mismo el seguimiento de ese pedido, o undefined
 *  @param {function} onWrite  anota (campo, valor)
 *  @param {function} onDelete borra este proceso
 *  @param {Array}    dishOptions     las opciones del tipo de plato: la carta del local o, sin ella, la lista de siempre (dishTypes.js)
 *  @param {string}   limit           lo que puede tardar su plato en cocina en el turno de la rotación, 'HH:MM:SS'; '' = sin tiempo
 *  @param {boolean}  waitingTooLong  sin listo en tablet todavía, y desde la toma de orden ya pasó 'limit' (useRotationLoop)
 *  @param {function} onReportPreparation  pedir el reporte de su demora de preparación
 */
export default function RegisterProcessLine({ process, live, onWrite, onDelete, dishOptions = DISH_TYPES, limit = '', waitingTooLong = false, onReportPreparation }) {

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

    // preparationReported = «su demora de preparación ya se reportó» (la novedad, en 'preparationDelay')
    const preparationReported = Boolean(process.preparationDelay);

    // preparationLate = «pasó de su tiempo de preparación»: con las dos horas, la duración; sin listo en tablet, el bucle
    const preparationLate = isPreparationLate(process, limit, waitingTooLong);

    // tabletLook / tabletText = «cómo va la primera Duración»: como las de la rotación (durationLook en RegisterRecordRow)
    const tabletLook = preparationReported ? 'register-cell--reported' : preparationLate ? 'register-cell--late register-cell--alert' : '';
    const tabletText = !tabletDuration ? 'text-jx-tinta3'
        : preparationReported ? 'text-jx-tinta font-bold'
            : preparationLate ? 'text-jx-critico-texto font-bold'
                : limit ? 'text-jx-verde-texto' : 'text-jx-tinta';

    return (
        <div
            className={`register-process-line w-full ${live?.cerrado ? 'opacity-75' : ''}`}
            style={stripe ? { ...PROCESS_GRID, boxShadow: `inset 3px 0 0 ${stripe}` } : PROCESS_GRID}
        >
            {/*  El número de ticket: lo pone la IA, o se escribe en un proceso a mano  */}
            <WrapperCell classStyles='text-jx-tinta'>
                <input
                    className='w-full h-full text-center bg-transparent tabular-nums'
                    type='text'
                    value={process.ticketNumber}
                    onChange={event => write('ticketNumber')(event.target.value)}
                    placeholder='-'
                    aria-label='Número de ticket'
                />
            </WrapperCell>

            {/*  El tipo de plato: los platos de la carta del local o, si no tiene, los del formato del Excel (dishTypes.js).
                 Uno que ya no esté entre ellos se sigue viendo (optionsWith).  */}
            <WrapperCell classStyles='text-jx-tinta'>
                <select
                    className='w-full h-full text-center bg-transparent cursor-pointer'
                    value={process.dishType}
                    onChange={event => write('dishType')(event.target.value)}
                    title={process.dishType || undefined}
                    aria-label='Tipo de plato'
                >
                    <option value=''>-</option>
                    {optionsWith(dishOptions, process.dishType).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
            </WrapperCell>

            <WrapperCell
                classStyles={estimated ? 'text-jx-ocre-texto italic' : 'text-jx-tinta'}
                titulo={estimated ? 'Hora estimada: el ticket ya estaba despachado cuando se le vio, y su contador podía estar parado' : undefined}
            >
                <WrapperText value={process.orderTaking} updateValue={write('orderTaking')} />
            </WrapperCell>

            <WrapperCell classStyles='text-jx-tinta'>
                <WrapperText value={process.markedReadyOnTablet} updateValue={write('markedReadyOnTablet')} />
            </WrapperCell>

            {/*  DURACIÓN en la tablet: de la toma de orden a «listo en tablet». Calculada: sin 'updateValue'. Contra el
                 tiempo de su plato: el icono de cocina si se pasó, la bandera si ya se reportó.  */}
            <WrapperCell
                classStyles={`gap-1.5 px-1 ${tabletLook}`}
                titulo={preparationReported ? 'Demora de preparación reportada' : limit ? `Tiempo de preparación de ${process.dishType}: ${limit}` : undefined}
            >
                <WrapperText classStyles={tabletText} value={tabletDuration ?? '—'} />
                {
                    preparationReported
                        ? <ReportedFlag kind='preparación' />
                        : preparationLate && (
                            <PreparationAlert
                                dish={process.dishType}
                                limit={limit}
                                waiting={!tabletDuration}
                                missing={missingForPreparation(process)}
                                onReport={onReportPreparation}
                            />
                        )
                }
            </WrapperCell>

            <WrapperCell classStyles='text-jx-tinta'>
                <WrapperText value={process.readyInTheKitchen} updateValue={write('readyInTheKitchen')} />
            </WrapperCell>

            <WrapperCell classStyles='text-jx-tinta'>
                <WrapperText value={process.dishDelivery} updateValue={write('dishDelivery')} />
            </WrapperCell>

            {/*  DURACIÓN de la entrega: de «listo en cocina» a la mesa. Calculada: sin 'updateValue'.  */}
            <WrapperCell>
                <WrapperText classStyles={deliveryDuration ? 'text-jx-tinta' : 'text-jx-tinta3'} value={deliveryDuration ?? '—'} />
            </WrapperCell>

            {/*  Borrar el proceso: la papelera, en rojo (pedido del usuario: la ✕ gris no se veía ni se entendía).
                El aspecto va en registers.css ('register-process-delete'): la regla global 'button {}' gana a Tailwind.  */}
            <WrapperCell>
                <button
                    type='button'
                    className='register-process-delete'
                    onClick={onDelete}
                    title='Borrar este proceso'
                    aria-label='Borrar este proceso'
                >
                    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                        <path d='M3 6h18' />
                        <path d='M8 6V4h8v2' />
                        <path d='M6 6l1 14h10l1-14' />
                        <path d='M10 11v5' />
                        <path d='M14 11v5' />
                    </svg>
                </button>
            </WrapperCell>
        </div>
    );
}
