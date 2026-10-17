import { createRecord, setRecordField, RECORD_TIMES, isTakeOut } from './tableRecords.js';
import { atOperationalTime } from '../date_time/operationalDay.js';


/*  UNA ROTACIÓN ANOTADA A MANO EN «REGISTROS»: RECUPERADA
 *
 *  La que no se guardó en su momento desde Mesas y se apunta después, desde la pestaña Registros (pedido
 *  del usuario). Va a la API como cualquier otra (POST /rotation), con dos diferencias:
 *
 *      · recovered: true   la marca de lo que se anotó después de que pasara. También la llevan los toques
 *                          que se apuntan en Registros (addSavedTouch, en useSavedRotations).
 *      · su 'date'         no es el momento de escribirla, sino el de su Ocupa DENTRO DEL DÍA OPERATIVO que
 *                          enseña Registros (atOperationalTime): así la API la guarda en ese día, y una mesa
 *                          de las 02:00 es de la madrugada y no de la mañana.
 *
 *  Se arma como en Mesas (createRecord y setRecordField, de tableRecords.js), así que sigue sus reglas: una
 *  mesa '#14' es un pedido para llevar y nace con el proceso de su ticket.
 */


// recoveredMissing = «lo que falta para poder guardarla», en palabras: lo mismo que pide el disquete de Mesas.
// Sin número de mesa no; sin la hora de Ocupa tampoco, salvo un pedido para llevar, que no la tiene.
export function recoveredMissing({ tableNumber, times = {} }) {
    const table = String(tableNumber ?? '').trim();
    return [
        table === '' && 'el número de mesa',
        !isTakeOut({ tableNumber: table }) && String(times.hourOccupies ?? '').trim() === '' && 'la hora de Ocupa',
    ].filter(Boolean);
}


/*  recoveredRotation = «el cuerpo de una rotación recuperada», listo para saveRotation (falta 'establishment')
 *
 *  @param {string} tableNumber  la mesa, o '#ticket' para un pedido para llevar
 *  @param {object} times        sus horas: { hourOccupies, hourFirstAttention, breakUp, tableCleaning }, 'HH:MM:SS' o ''
 *  @param {string} shift        'day' | 'night'
 *  @param {string} day          el día operativo de Registros, 'AAAA-MM-DD'
 *  @param {Date}   now          ahora (para las pruebas). Es la fecha de un pedido para llevar, que no tiene Ocupa.
 */
export function recoveredRotation({ tableNumber, times = {}, shift, day, now = new Date() }) {

    const blank = createRecord();

    //  La mesa primero: con '#' se vuelve un pedido para llevar y crea el proceso de su ticket
    let records = setRecordField([blank], blank.id, 'tableNumber', String(tableNumber ?? '').trim(), now);
    for (const field of RECORD_TIMES) records = setRecordField(records, blank.id, field, String(times[field] ?? ''), now);

    const record = records[0];

    return {
        ...record,
        clientId: record.id,
        shift,
        date: record.hourOccupies ? atOperationalTime(day, record.hourOccupies) : now,
        recovered: true,
    };
}
