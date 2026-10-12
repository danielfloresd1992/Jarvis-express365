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


// operationalDayLabel = «un día operativo dicho con palabras»: '2026-10-11' → 'sábado, 11 de octubre'
export const operationalDayLabel = (day) =>
    new Date(`${day}T12:00:00Z`).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
