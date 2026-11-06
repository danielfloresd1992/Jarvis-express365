/*  LA HORA DEL SERVIDOR
 *
 *  Los INSTANTES de Mesas —la fecha de cada rotación, qué día operativo es hoy, cuándo cambió algo— no salen del reloj
 *  del equipo sino de serverNow(): ese reloj corregido con la hora del servidor.
 *
 *  POR QUÉ. Un PC con la zona horaria mal puesta —la de Madrid, UTC+1, la que traen los Windows instalados en español
 *  de España— y la hora cambiada a mano para que enseñe la de Venezuela se ve bien, pero por dentro va 5 horas
 *  atrasado. Para él, el día operativo (operationalDay.js) no cambiaba a las 08:00 sino a la 1:00 pm de su pantalla:
 *  a esa hora, una vez al día, todo lo anotado en Mesas desde la mañana pasaba al bloque «de un día anterior» (reporte
 *  del usuario, 2026-11-06), y la API guardaba esas rotaciones en el día de antes. Con el reloj bien puesto, la
 *  corrección es cero y nada cambia.
 *
 *  DE DÓNDE SALE. De la cabecera Date de una petición HEAD a la propia app. Es del mismo origen (Vercel, o el servidor
 *  de desarrollo), así que el navegador deja leerla; la de la API no, porque está en otro dominio y no la expone. Se mide
 *  al arrancar (startServerClock, en main.jsx), cada 30 minutos, al volver la conexión y cuando el reloj del equipo
 *  salta: porque alguien lo arregla con la app abierta, o porque el equipo vuelve de la suspensión.
 *
 *  LO QUE NO CAMBIA. Las horas 'HH:MM:SS' que se escriben y se ven en las celdas siguen saliendo del reloj del equipo,
 *  que en esos PCs enseña bien la hora de Caracas: el desfase está solo por dentro.
 */


// MIN_OFFSET_MS = «desde cuánto desfase se corrige». Por debajo es el ruido de la medida: la cabecera va en segundos.
const MIN_OFFSET_MS = 2 * 60 * 1000;

// MAX_ROUND_TRIP_MS = «una medida que tardó más que esto no vale»: no se sabe en qué momento del viaje se puso la hora
const MAX_ROUND_TRIP_MS = 10 * 1000;

// NOTICE_MS = «cuánto tiene que moverse la corrección para avisar a quien escucha»: medio segundo arriba o abajo no
const NOTICE_MS = 1000;

// CHECK_MS / REMEASURE_MS / JUMP_MS = «cada cuánto se mira», «cada cuánto se vuelve a medir» y «cuánto tiene que saltar
// el reloj del equipo, frente al monotónico, para volver a medir ya»
const CHECK_MS = 60 * 1000;
const REMEASURE_MS = 30 * 60 * 1000;
const JUMP_MS = 60 * 1000;


// offsetMs = «cuánto hay que sumarle al reloj del equipo»: positivo si el equipo va atrasado. 0 si va bien.
let offsetMs = 0;

// listeners = «quién quiere saber que cambió la corrección» (onClockOffset)
const listeners = new Set();


// serverNow = «ahora», con la corrección: la Date que se usa para los instantes
export const serverNow = () => new Date(Date.now() + offsetMs);

// clockOffsetMs = «la corrección de ahora», en milisegundos
export const clockOffsetMs = () => offsetMs;

// onClockOffset = «avisar cuando cambie la corrección». Devuelve con qué dejar de escuchar (la forma de
// useSyncExternalStore).
export function onClockOffset(listener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}


// offsetFromResponse = «cuánto va atrasado (+) o adelantado (−) el equipo», de una respuesta y de cuándo salió y llegó
// La cabecera Date dice el segundo en que contestó el servidor (truncado: se le suma medio segundo) y Age, cuánto
// llevaba la respuesta en una caché. Se compara con el punto medio del viaje. null si la medida no sirve.
export function offsetFromResponse({ date, age } = {}, sentAt, receivedAt) {
    const serverAt = Date.parse(date ?? '');
    const roundTrip = receivedAt - sentAt;
    if (!Number.isFinite(serverAt) || !(roundTrip >= 0) || roundTrip > MAX_ROUND_TRIP_MS) return null;

    const cachedFor = Number(age) > 0 ? Number(age) * 1000 : 0;
    return serverAt + cachedFor + 500 - (sentAt + roundTrip / 2);
}


// applyOffset = «quedarse con una medida»: por debajo de MIN_OFFSET_MS es que el reloj va bien, y la corrección es 0
export function applyOffset(measured) {
    const next = Number.isFinite(measured) && Math.abs(measured) >= MIN_OFFSET_MS ? Math.round(measured) : 0;
    const changed = Math.abs(next - offsetMs) >= NOTICE_MS || (next === 0) !== (offsetMs === 0);
    offsetMs = next;
    if (changed) for (const listener of [...listeners]) listener(offsetMs);
}


// measureClock = «medir el desfase»: HEAD a la propia app, sin caché. Resuelve con offsetFromResponse (o null si no se
// puede medir aquí: sin fetch, o una página sin origen). Rechaza si no hay conexión.
export async function measureClock(fetchImpl = globalThis.fetch, origin = globalThis.location?.origin) {
    if (typeof fetchImpl !== 'function' || !origin || origin === 'null') return null;

    const sentAt = Date.now();
    const response = await fetchImpl(`${origin}/?reloj=${sentAt}`, { method: 'HEAD', cache: 'no-store' });
    const receivedAt = Date.now();

    return offsetFromResponse({ date: response.headers.get('date'), age: response.headers.get('age') }, sentAt, receivedAt);
}


// offsetText = «el desfase en palabras»: '5 h', '5 h 30 min', '12 min'
export function offsetText(milliseconds) {
    const minutes = Math.round(Math.abs(milliseconds) / 60000);
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours === 0) return `${rest} min`;
    return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}



//  ── MEDIR MIENTRAS LA APP ESTÁ ABIERTA ──────────────────────────────────────────────────

// started = «ya se está midiendo»: startServerClock arranca una sola vez aunque se llame más
let started = false;

// measuring = «hay una medida en el aire»: no se lanzan dos a la vez
let measuring = false;

// lastMeasure = «cuándo salió bien la última medida», en el reloj del equipo y en el monotónico (performance.now).
// Si los dos avanzan distinto, el reloj del equipo saltó.
let lastMeasure = null;

async function measureNow() {
    if (measuring) return;
    measuring = true;
    try {
        const measured = await measureClock();
        if (measured !== null) {
            applyOffset(measured);
            lastMeasure = { wall: Date.now(), monotonic: performance.now() };
        }
    }
    catch {
        //  Sin conexión: se queda la corrección que había, y se vuelve a probar en el próximo vistazo
    }
    finally {
        measuring = false;
    }
}

// isDue = «toca volver a medir»: nunca salió bien, pasó media hora o el reloj del equipo saltó
function isDue() {
    if (!lastMeasure) return true;
    const monotonicElapsed = performance.now() - lastMeasure.monotonic;
    const wallElapsed = Date.now() - lastMeasure.wall;
    return monotonicElapsed > REMEASURE_MS || Math.abs(wallElapsed - monotonicElapsed) > JUMP_MS;
}

// startServerClock = «empezar a medir»: ya, cada minuto se mira si toca otra vez, y al volver la conexión
export function startServerClock() {
    if (started || typeof window === 'undefined' || typeof performance === 'undefined') return;
    started = true;

    measureNow();
    setInterval(() => { if (isDue()) measureNow(); }, CHECK_MS);
    window.addEventListener('online', () => { measureNow(); });
}
