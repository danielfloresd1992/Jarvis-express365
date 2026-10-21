/*  EL DÍA OPERATIVO
 *
 *  La jornada de monitoreo va de las 08:00 a las 07:00 del día siguiente, en America/Caracas: una mesa
 *  de las 02:00 es del turno del día ANTERIOR. Es la misma regla que usa api_jarvis365
 *  (operationalDateOf, en dvrFailure.lib.ts) para guardar y para pedir por fechas, y por eso el día se
 *  calcula aquí igual: si no coincidieran, «las rotaciones de hoy» saldrían de otro día cerca de la
 *  medianoche.
 */


// TIME_ZONE = «la zona en la que se define la jornada»
const TIME_ZONE = 'America/Caracas';

// OPENS_AT = «la hora a la que abre la jornada»
const OPENS_AT = 8;


// operationalDay = «el día operativo de un instante», como 'AAAA-MM-DD'
// Recibe: now (un Date; por defecto, ahora).
export function operationalDay(now = new Date()) {

    // parts = «año, mes, día y hora de ese instante en Caracas»
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
            .formatToParts(now)
            .map(part => [part.type, part.value])
    );

    // day = «la medianoche UTC del día civil en Caracas»; antes de las 08:00 la jornada es la de ayer
    const day = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
    if (Number(parts.hour) < OPENS_AT) day.setUTCDate(day.getUTCDate() - 1);

    return day.toISOString().slice(0, 10);
}


// CARACAS_OFFSET_HOURS = «cuántas horas va Caracas por detrás de UTC»: cuatro, todo el año (no tiene horario de verano)
const CARACAS_OFFSET_HOURS = 4;


// atOperationalTime = «el instante de una hora 'HH:MM:SS' de un día operativo», en Caracas
// De las 08:00 en adelante es ese día civil; antes de las 08:00, la madrugada del día siguiente: las 02:00 del
// día operativo '2026-10-16' son las 02:00 del 17. Así, operationalDay() del resultado es siempre 'day'.
// Recibe: day ('AAAA-MM-DD') y time ('HH:MM:SS'; sin segundos también vale).
export function atOperationalTime(day, time) {
    const [hours = 0, minutes = 0, seconds = 0] = String(time ?? '').split(':').map(Number);

    const instant = new Date(`${day}T00:00:00.000Z`);
    if (hours < OPENS_AT) instant.setUTCDate(instant.getUTCDate() + 1);

    //  setUTCHours reparte lo que pase de 24 en el día siguiente: las 22:00 de Caracas son las 02:00 UTC
    instant.setUTCHours(hours + CARACAS_OFFSET_HOURS, minutes || 0, seconds || 0, 0);
    return instant;
}


// SHIFT_TIMES = «las horas de los turnos», 'HH:MM': cuándo empieza el diurno, cuándo deja de estar fijo (desde ahí se
// puede pasar al nocturno con el toggle de Mesas; pedido del usuario: desde las 17:00, antes las 17:30), cuándo
// empieza el nocturno fijo y cuándo termina. Las lee también el toggle (ShiftToggle) para explicarlo.
export const SHIFT_TIMES = { dayStarts: '08:00', dayEnds: '17:00', nightStarts: '18:30', nightEnds: '07:00' };

// secondsOfClock = «una hora 'HH:MM' en segundos desde las 00:00»
const secondsOfClock = (clock) => {
    const [hours, minutes] = clock.split(':').map(Number);
    return hours * 3600 + minutes * 60;
};


// shiftOfTime = «el turno que corresponde a una hora 'HH:MM:SS'»: 'day' de las 08:00:00 hasta antes de las 17:00:00,
// 'night' de 18:30:00 a 07:00:00 del día siguiente, y null en los dos cambios de turno —de 07:00 a 08:00 y de 17:00 a
// 18:30—, que se eligen a mano (SHIFT_TIMES). También null si no es una hora.
export function shiftOfTime(time) {
    const [hours, minutes, seconds = 0] = String(time ?? '').split(':').map(Number);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;

    const value = hours * 3600 + minutes * 60 + (seconds || 0);
    if (value >= secondsOfClock(SHIFT_TIMES.dayStarts) && value < secondsOfClock(SHIFT_TIMES.dayEnds)) return 'day';
    if (value >= secondsOfClock(SHIFT_TIMES.nightStarts) || value <= secondsOfClock(SHIFT_TIMES.nightEnds)) return 'night';
    return null;
}


// operationalDayLabel = «un día operativo dicho con palabras»: '2026-10-11' → 'sábado, 11 de octubre'
export const operationalDayLabel = (day) =>
    new Date(`${day}T12:00:00Z`).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
