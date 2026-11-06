import { useEffect, useState } from 'react';
import { operationalDay } from '../../../libs/date_time/operationalDay.js';
import { onClockOffset } from '../../../libs/date_time/serverClock.js';


/*  EL DÍA OPERATIVO QUE CORRE
 *
 *  'AAAA-MM-DD', y cambia solo a las 08:00 (operationalDay.js): lo que era de hoy pasa a ser de ayer sin recargar
 *  nada. Se mira cada minuto, como la lista de Registros (useSavedRotations): así también se pone al día un equipo
 *  que se despierta de la suspensión. Solo repinta cuando el día cambia de verdad.
 *
 *  «Ahora» es la hora del servidor (serverClock.js), y se vuelve a mirar en cuanto se mide: en un equipo con el reloj
 *  mal puesto, el primer pintado todavía no tiene la corrección.
 */


// CHECK_MS = «cada cuánto se mira si el día cambió»
const CHECK_MS = 60 * 1000;


export default function useOperationalDay() {
    const [today, setToday] = useState(() => operationalDay());

    useEffect(() => {
        const check = () => setToday(operationalDay());
        const timer = setInterval(check, CHECK_MS);
        const stopListening = onClockOffset(check);
        check();
        return () => {
            clearInterval(timer);
            stopListening();
        };
    }, []);

    return today;
}
