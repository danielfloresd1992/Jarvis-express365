/////deprecated calculate time between two hours
export default function calculateTime(time1, time2) {
    if (!time1 && !time2) return '';
    let hourTotal = time2.split(':')[0] - time1.split(':')[0];
    let minuteTotal = time2.split(':')[1] - time1.split(':')[1];
    let secondTotal = time2.split(':')[2] - time1.split(':')[2];

    if (secondTotal < 0) {
        secondTotal = 60 - Math.abs(secondTotal)
        --minuteTotal;
    }
    if (minuteTotal < 0) {
        minuteTotal = 60 - Math.abs(minuteTotal);
        --hourTotal
    }
    if (minuteTotal < 10) minuteTotal = `0${minuteTotal}`
    if (secondTotal < 10) secondTotal = `0${secondTotal}`
    if (hourTotal < 9) hourTotal = `0${hourTotal}`;

    let housExceed = '00';
    let minuteExceed = (`0${minuteTotal - 3}`).substr(-2);
    let secondExceed = (`0${secondTotal - 0}`).substr(-2);

    if (secondExceed < 0) {
        secondExceed = 60 - Math.abs(secondExceed);
        --minuteExceed;
    }
    if (minuteExceed < 0) {
        minuteExceed = 60 - Math.abs(minuteExceed);
        --housExceed;
    }

    return ` ${isNaN(hourTotal) ? '❌' : hourTotal}:${isNaN(minuteTotal) ? '❌' : minuteTotal}:${isNaN(secondTotal) ? '❌' : secondTotal}`;
}




// 'HH:MM:SS' -> segundos. Devuelve NaN si el formato es inválido.
function toSeconds(time) {
    if (typeof time !== 'string') return NaN;
    const parts = time.trim().split(':');
    if (parts.length !== 3) return NaN;
    const [h, m, s] = parts.map(Number);
    if ([h, m, s].some(Number.isNaN)) return NaN;
    return h * 3600 + m * 60 + s;
}


// segundos -> 'HH:MM:SS'
function toHHMMSS(totalSeconds) {
    const pad = (n) => String(n).padStart(2, '0');
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
}


/**
 * Calcula el tiempo total entre dos horas y, opcionalmente, si superó un límite.
 *
 * @param {string} startTime  hora inicial en 'HH:MM:SS'
 * @param {string} endTime    hora final en 'HH:MM:SS'
 * @param {string} [timeLimit] límite en 'HH:MM:SS' (opcional)
 * @returns {{ timeTotal: string, exceeded: boolean | null }}
 *   - timeTotal: diferencia en 'HH:MM:SS', o '❌:❌:❌' si algún tiempo es inválido.
 *   - exceeded: true/false si se pasó (o no) del límite; null si no se envió el tercer parámetro.
 */
export function getTimeReport(startTime, endTime, timeLimit) {
    const start = toSeconds(startTime);
    const end = toSeconds(endTime);

    // Algún tiempo inválido, o el orden invertido (fin antes que inicio) -> no se puede calcular
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
        return { timeTotal: '❌:❌:❌', exceeded: null };
    }

    const totalSeconds = end - start;
    const timeTotal = toHHMMSS(totalSeconds);

    // Tercer parámetro opcional: sin él (o inválido) -> null en vez de boolean
    const limit = toSeconds(timeLimit);
    const exceeded = Number.isNaN(limit) ? null : totalSeconds > limit;

    return { timeTotal, exceeded };
}