import { useCallback, useEffect, useRef, useState } from 'react';
import { clockNow, clockDuration, waitingSeconds } from '../../../libs/date_time/waitingTime.js';
import { exceedsLimit } from '../../../libs/date_time/timeLimit.js';


/*  EL BUCLE DE UNA ROTACIÓN (pedido del usuario)
 *
 *  Un setInterval por rotación de Mesas, que:
 *
 *      arranca   cuando la rotación se activa ('active': la fila se usó por primera vez y tiene fecha);
 *      se para   con clearInterval cuando se guarda (RegisterRecordRow llama a 'stop' en cuanto la API la
 *                confirma), y también si la rotación deja de estar activa o la fila se desmonta.
 *
 *  En cada vuelta (cada segundo) mira las ESPERAS de la mesa ('waits'): la de primera atención, desde Ocupa, y la
 *  de limpieza, desde Desocupa. Cada una, desde su hora hasta ahora por el reloj del equipo, contra el tiempo de
 *  referencia del local; una espera que ya terminó ('done': llegó la atención, o la limpieza) no cuenta.
 *
 *  'overdue' dice cuál se pasó, y cambia SOLO cuando cambia la respuesta: la fila no se repinta cada segundo, solo
 *  al pasar un límite (y sale el triángulo de aviso, WaitingAlert) o al dejar de estarlo.
 *
 *  Las esperas se leen de 'latest', no de las dependencias del efecto: cambiar una hora no reinicia el bucle, que
 *  sigue el mismo desde que se activó la rotación hasta que se guarda.
 */


// TICK_MS = «cada cuánto da una vuelta el bucle»
const TICK_MS = 1000;

// overdueOf = «qué esperas pasaron de su límite ahora»: { attention: true, cleaning: false }
const overdueOf = (waits) => Object.fromEntries(Object.entries(waits).map(([name, wait]) => {
    const seconds = wait.done ? null : waitingSeconds(wait.since, clockNow());
    return [name, seconds !== null && exceedsLimit(clockDuration(seconds), wait.limit)];
}));

// sameOverdue = «las dos respuestas dicen lo mismo»
const sameOverdue = (previous, next) => Object.keys(next).every(name => previous[name] === next[name]);


/*  @param {boolean} active  la rotación está activa: mientras lo esté, el bucle corre
 *  @param {object}  waits   las esperas, por nombre: { attention: { since, done, limit }, cleaning: { … } }
 *                             since  la hora desde la que se espera, 'HH:MM:SS' ('' si todavía no hay)
 *                             done   la espera ya terminó
 *                             limit  el tiempo de referencia del local, 'HH:MM:SS'
 *  @returns {{ overdue: object, stop: function }}
 *           overdue  qué esperas pasaron de su límite: { attention: boolean, cleaning: boolean }
 *           stop     parar el bucle ya (clearInterval), sin esperar a que la fila se limpie
 */
export default function useRotationLoop({ active, waits }) {

    const [overdue, setOverdue] = useState(() => Object.fromEntries(Object.keys(waits).map(name => [name, false])));

    // latest = «las esperas de ahora», para que cada vuelta las lea sin reiniciar el bucle
    const latest = useRef(waits);
    latest.current = waits;

    // timerRef = «el id del setInterval que corre», o null si no corre ninguno
    const timerRef = useRef(null);

    const stop = useCallback(() => {
        if (timerRef.current === null) return;
        clearInterval(timerRef.current);
        timerRef.current = null;
    }, []);

    useEffect(() => {
        // lap = «una vuelta del bucle»: qué esperas se pasaron. Sin la rotación activa, ninguna.
        const lap = () => {
            const next = active ? overdueOf(latest.current) : Object.fromEntries(Object.keys(latest.current).map(name => [name, false]));
            setOverdue(previous => (sameOverdue(previous, next) ? previous : next));
        };

        lap();
        if (!active) return undefined;

        timerRef.current = setInterval(lap, TICK_MS);
        return stop;
    }, [active, stop]);

    return { overdue, stop };
}
