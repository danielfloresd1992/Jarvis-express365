import { useSyncExternalStore } from 'react';
import { onClockOffset, clockOffsetMs } from '../../../libs/date_time/serverClock.js';


/*  CUÁNTO VA DESFASADO EL RELOJ DE ESTE EQUIPO (serverClock.js)
 *
 *  En milisegundos: positivo si va atrasado, negativo si va adelantado, 0 si va bien. Repinta cuando cambia la medida.
 */
export default function useClockOffset() {
    return useSyncExternalStore(onClockOffset, clockOffsetMs);
}
