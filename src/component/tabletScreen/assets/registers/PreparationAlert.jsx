/*  EL PEDIDO PASÓ DE SU TIEMPO DE PREPARACIÓN (pedido del usuario)
 *
 *  Va en la Duración de la tablet de un proceso de Mesas (RegisterProcessLine): de la toma de orden a listo en
 *  tablet, contra lo que puede tardar SU plato en cocina en el turno de la rotación (timeLimit.day o .night del
 *  plato de la carta del local; dishTypes.js). Sale en dos momentos:
 *
 *      esperando   todavía no está listo en tablet, y desde la toma de orden ya pasó el tiempo (lo mira el bucle de
 *                  la rotación, useRotationLoop);
 *      pasada      ya está listo en tablet, y la duración pasó del tiempo.
 *
 *  Un plato de cocina tapado (la campana), blanco sobre un círculo rojo, que titila. Al pulsarlo se abre «Demoras» en
 *  el formulario «Tablet» —la demora de preparación— con el ticket, la mesa, el plato y todas sus horas puestas hasta
 *  listo en cocina (askForPreparation en RegisterRecordRow). Si falta alguna de esas horas, la fila dice cuál.
 *  Enviado, en su lugar queda la bandera de «Reportada» (ReportedFlag).
 *
 *  Su aspecto va en 'register-kitchen' de registers.css: la regla global 'button {}' gana a Tailwind.
 */


import { getTimeReport } from '../../../../libs/date_time/calculate_time.js';
import { exceedsLimit } from '../../../../libs/date_time/timeLimit.js';


// isPreparationLate = «el pedido pasó de su tiempo de preparación ('limit')»: con la toma de orden y listo en tablet,
// por su duración; sin listo en tablet, lo que diga el bucle de la rotación ('waitingTooLong'). Sin tiempo, nunca.
export function isPreparationLate(process, limit, waitingTooLong = false) {
    if (!limit) return false;
    if (process.orderTaking && process.markedReadyOnTablet) return exceedsLimit(getTimeReport(process.orderTaking, process.markedReadyOnTablet).timeTotal, limit);
    return waitingTooLong === true;
}


// REPORT_TIMES = «las horas que tiene que tener un proceso para reportar su demora de preparación»: todas hasta
// listo en cocina (pedido del usuario). La entrega se lleva si ya está; si no, se escribe en el formulario.
const REPORT_TIMES = [
    { field: 'orderTaking', name: 'Toma de orden' },
    { field: 'markedReadyOnTablet', name: 'Listo en tablet' },
    { field: 'readyInTheKitchen', name: 'Listo en cocina' },
];

// missingForPreparation = «las horas que le faltan a un proceso para reportar su demora», dichas para leer
// ('Listo en tablet y Listo en cocina'), o '' si están todas
export function missingForPreparation(process) {
    const names = REPORT_TIMES.filter(time => String(process?.[time.field] ?? '').trim() === '').map(time => time.name);
    return names.length > 1 ? `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}` : names.join('');
}


/*  @param {string}   dish      el plato, para decir cuál
 *  @param {string}   limit     lo que puede tardar en este turno, 'HH:MM:SS'
 *  @param {boolean}  waiting   todavía no está listo en tablet: el tiempo se pasó esperándolo
 *  @param {string}   missing   las horas que faltan para poder reportarla ('' si están todas)
 *  @param {function} onReport  pedir el reporte
 */
export default function PreparationAlert({ dish, limit, waiting, missing, onReport }) {

    const what = waiting
        ? `${dish || 'El plato'} lleva más de ${limit} en cocina sin marcarse listo en tablet`
        : `${dish || 'El plato'} pasó de su tiempo de preparación (${limit}) hasta listo en tablet`;

    const how = missing ? `Para reportarla falta ${missing}` : 'Pulsa para reportar la demora de preparación';

    return (
        <button type='button' className='register-kitchen' onClick={onReport} title={`${what}. ${how}`} aria-label={`${what}. ${how}`}>
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2'
                 strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <path d='M4 17a8 8 0 0 1 16 0' />
                <path d='M2 17h20' />
                <path d='M12 9V7' />
                <path d='M10 7h4' />
                <path d='M5 20h14' />
            </svg>
        </button>
    );
}
