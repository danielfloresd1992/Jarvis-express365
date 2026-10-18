import { clockNow, clockDuration, waitingSeconds } from '../../../../libs/date_time/waitingTime.js';


/*  LA MESA LLEVA DEMASIADO ESPERANDO: SIN PRIMERA ATENCIÓN, O SIN LIMPIAR
 *
 *  Va en la celda de Ocupa (esperando la primera atención) o en la de Desocupa (esperando la limpieza) de una
 *  rotación de Mesas (RegisterRecordRow), cuando el bucle de su rotación (useRotationLoop) dice que la espera pasó
 *  del tiempo de referencia del local: un triángulo amarillo que late. Solo pinta: el reloj es el bucle.
 *
 *  Al pulsarlo se abre «Demoras» en el formulario de esa espera —Primera atención o Limpieza— con su casilla
 *  «¿… aún?» marcada: la mesa, la hora desde la que espera y la de ahora, para enviar el aviso de que sigue
 *  esperando (onReport, con la hora del clic y lo que lleva hasta ese momento).
 *
 *  Su aspecto va en 'register-waiting' de registers.css.
 */


// WORDS = «cómo se dice cada espera»: qué le falta a la mesa y desde cuándo
const WORDS = {
    'primera atención': { missing: 'sin primera atención', since: 'ocupada' },
    limpieza: { missing: 'sin limpiar', since: 'desocupada' },
};


/*  @param {string}   kind      qué espera: 'primera atención' (desde Ocupa) o 'limpieza' (desde Desocupa)
 *  @param {string}   since     la hora desde la que espera, 'HH:MM:SS'
 *  @param {string}   limit     el tiempo de referencia del local para esa espera, 'HH:MM:SS'
 *  @param {string}   table     el número de mesa, para decir cuál
 *  @param {function} onReport  pedir el aviso: (hora del clic 'HH:MM:SS', lo que lleva esperando 'HH:MM:SS')
 */
export default function WaitingAlert({ kind, since, limit, table, onReport }) {

    const words = WORDS[kind] ?? WORDS['primera atención'];

    // report = «pedir el aviso», con la hora del clic y lo que lleva esperando hasta ella
    const report = () => {
        const now = clockNow();
        onReport(now, clockDuration(waitingSeconds(since, now) ?? 0));
    };

    const why = `La mesa ${table || '?'} lleva más de ${limit} ${words.missing} (${words.since} a las ${since}). Pulsa para enviar el aviso`;

    return (
        <button type='button' className='register-waiting' onClick={report} title={why} aria-label={why}>
            {/*  Amarillo con el borde ámbar y la «!» en tinta: el amarillo solo, sobre el color claro de la celda,
                 apenas se distingue (registers.css, 'register-waiting').  */}
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' strokeWidth='2'
                 strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <path className='register-waiting__triangle' d='M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z' />
                <path className='register-waiting__mark' d='M12 9v4' strokeWidth='2.4' />
                <path className='register-waiting__mark' d='M12 17h.01' strokeWidth='2.6' />
            </svg>
        </button>
    );
}
