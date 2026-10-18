/*  CUÁNDO TERMINA UN TOQUE DE GERENTE
 *
 *  Al apuntar un toque se le pone también una hora de fin, 'hourTouchFinish': su hora ('hourTouch') más un rato
 *  al azar de entre 5 segundos y un minuto, los dos incluidos (pedido del usuario). La usan los dos botones que
 *  apuntan toques: el de Mesas (useRegisterStore, 'addTouch') y el de Registros (useSavedRotations, 'addSavedTouch').
 *
 *      randomTouchFinish('09:29:50')   →  '09:30:12'    por ejemplo: 22 segundos después
 *      randomTouchFinish('23:59:40')   →  '00:00:25'    pasada la medianoche sigue por las 00: el día operativo cruza las 00:00
 *      randomTouchFinish('')           →  ''            sin hora de toque no hay fin que calcular
 *
 *  Y lo que la lista de toques (RegisterTouchList) necesita para enseñarlo: lo que duró cada toque
 *  (touchDurationSeconds) y esa duración dicha para leer (formatDuration).
 */


// TOUCH_FINISH_MIN_SECONDS / TOUCH_FINISH_MAX_SECONDS = «lo que dura un toque, como poco y como mucho», en segundos
export const TOUCH_FINISH_MIN_SECONDS = 5;
export const TOUCH_FINISH_MAX_SECONDS = 60;

// DAY_SECONDS = «los segundos de un día»: pasada la medianoche, la hora vuelve a empezar
const DAY_SECONDS = 24 * 3600;

// CLOCK = «una hora del reloj 'HH:MM:SS'», de 00:00:00 a 23:59:59 (la misma regla que la API, rotation.schema.js)
const CLOCK = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

// twoDigits = «un número a dos cifras»: 7 → '07'
const twoDigits = (value) => String(value).padStart(2, '0');

// clockSeconds = «una hora 'HH:MM:SS' en segundos desde las 00:00», o null si no es una hora
const clockSeconds = (time) => {
    const match = CLOCK.exec(String(time ?? '').trim());
    return match ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) : null;
};

// MIDNIGHT_SLACK_SECONDS = «cuánto puede durar un toque que cruza la medianoche»: un fin ANTERIOR al inicio solo
// se entiende como «pasó las 00:00» si queda a menos de una hora. Más que eso es una hora mal corregida a mano.
const MIDNIGHT_SLACK_SECONDS = 3600;


/*  touchDurationSeconds = «lo que duró un toque», en segundos: de 'hourTouch' a 'hourTouchFinish'
 *
 *      touchDurationSeconds('09:29:50', '09:30:12')   →  22
 *      touchDurationSeconds('23:59:40', '00:00:25')   →  45      cruzó la medianoche
 *      touchDurationSeconds('09:52:10', '')           →  null    un toque de antes, sin hora de fin
 *      touchDurationSeconds('10:00:00', '09:00:00')   →  null    el fin, corregido a mano, quedó antes del inicio
 */
export function touchDurationSeconds(hourTouch, hourTouchFinish) {
    const start = clockSeconds(hourTouch);
    const end = clockSeconds(hourTouchFinish);
    if (start === null || end === null) return null;

    if (end >= start) return end - start;
    const acrossMidnight = end + DAY_SECONDS - start;
    return acrossMidnight <= MIDNIGHT_SLACK_SECONDS ? acrossMidnight : null;
}


/*  formatDuration = «unos segundos, dichos para leer»
 *
 *      formatDuration(22)     →  '22 s'
 *      formatDuration(60)     →  '1 min'
 *      formatDuration(76)     →  '1 min 16 s'
 *      formatDuration(3725)   →  '1 h 02 min'
 */
export function formatDuration(seconds) {
    if (seconds < 60) return `${seconds} s`;
    if (seconds < 3600) return seconds % 60 === 0 ? `${Math.floor(seconds / 60)} min` : `${Math.floor(seconds / 60)} min ${twoDigits(seconds % 60)} s`;
    return `${Math.floor(seconds / 3600)} h ${twoDigits(Math.floor((seconds % 3600) / 60))} min`;
}


/*  randomTouchFinish = «la hora de fin de un toque»
 *
 *  @param {string}   hourTouch  la hora del toque, 'HH:MM:SS'
 *  @param {function} random     opcional. De dónde sale el azar: un número de 0 (incluido) a 1 (sin incluir).
 *                               Math.random si no se dice; las pruebas pasan uno fijo
 *  @returns {string} 'HH:MM:SS', entre 5 y 60 segundos después de hourTouch; '' si hourTouch no es una hora
 */
export function randomTouchFinish(hourTouch, random = Math.random) {

    // start = «la hora del toque, en segundos desde las 00:00»
    const start = clockSeconds(hourTouch);
    if (start === null) return '';

    // extra = «lo que dura el toque»: un número entero de segundos, de 5 a 60
    const extra = TOUCH_FINISH_MIN_SECONDS + Math.floor(random() * (TOUCH_FINISH_MAX_SECONDS - TOUCH_FINISH_MIN_SECONDS + 1));

    // end = «la hora de fin, en segundos desde las 00:00»
    const end = (start + extra) % DAY_SECONDS;

    return `${twoDigits(Math.floor(end / 3600))}:${twoDigits(Math.floor((end % 3600) / 60))}:${twoDigits(end % 60)}`;
}
