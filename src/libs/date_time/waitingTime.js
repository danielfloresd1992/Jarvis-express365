/*  CUÁNTO LLEVA ESPERANDO UNA MESA
 *
 *  Para el bucle de cada rotación de Mesas (useRotationLoop) y su aviso (WaitingAlert): una mesa con Ocupa y sin
 *  Primera atención —o con Desocupa y sin Limpieza— lleva esperando desde esa hora hasta ahora, por el reloj del
 *  equipo. Pasado el tiempo de referencia del local, se puede avisar.
 */

// DAY_SECONDS = «los segundos de un día»: pasada la medianoche, la hora vuelve a empezar
const DAY_SECONDS = 24 * 3600;

// CLOCK = «una hora del reloj 'HH:MM:SS'», de 00:00:00 a 23:59:59
const CLOCK = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

// MIDNIGHT_SLACK_SECONDS = «cuánto puede llevar una espera que cruzó la medianoche». Un Ocupa POSTERIOR a ahora solo
// se entiende como «se ocupó antes de las 00:00» si así la espera queda en menos de 6 horas. Si no, el Ocupa es de
// unos segundos en el futuro (la hora la leyó la IA de la tablet, con su propio reloj): todavía no espera nada.
const MIDNIGHT_SLACK_SECONDS = 6 * 3600;

// twoDigits = «un número a dos cifras»: 7 → '07'
const twoDigits = (value) => String(value).padStart(2, '0');

// clockSeconds = «una hora 'HH:MM:SS' en segundos desde las 00:00», o null si no es una hora
const clockSeconds = (time) => {
    const match = CLOCK.exec(String(time ?? '').trim());
    return match ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) : null;
};


// clockNow = «la hora del equipo, 'HH:MM:SS'»
export function clockNow(date = new Date()) {
    return `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}:${twoDigits(date.getSeconds())}`;
}


/*  waitingSeconds = «cuántos segundos van de 'since' a 'now'», las dos 'HH:MM:SS'
 *
 *      waitingSeconds('17:07:40', '17:12:10')   →  270
 *      waitingSeconds('23:58:00', '00:03:00')   →  300     cruzó la medianoche
 *      waitingSeconds('17:07:45', '17:07:40')   →  0       el Ocupa va unos segundos por delante del reloj
 *      waitingSeconds('',         '17:07:40')   →  null    sin Ocupa no hay espera
 */
export function waitingSeconds(since, now) {
    const start = clockSeconds(since);
    const end = clockSeconds(now);
    if (start === null || end === null) return null;

    if (end >= start) return end - start;
    const acrossMidnight = end + DAY_SECONDS - start;
    return acrossMidnight <= MIDNIGHT_SLACK_SECONDS ? acrossMidnight : 0;
}


// clockDuration = «unos segundos como duración 'HH:MM:SS'»: 270 → '00:04:30'
export function clockDuration(seconds) {
    return `${twoDigits(Math.floor(seconds / 3600))}:${twoDigits(Math.floor((seconds % 3600) / 60))}:${twoDigits(seconds % 60)}`;
}
