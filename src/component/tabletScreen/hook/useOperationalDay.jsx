import { useEffect, useState } from 'react';
import { operationalDay } from '../../../libs/date_time/operationalDay.js';


/*  EL DÍA OPERATIVO QUE CORRE
 *
 *  'AAAA-MM-DD', y cambia solo a las 08:00 (operationalDay.js): lo que era de hoy pasa a ser de ayer sin recargar
 *  nada. Se mira cada minuto, como la lista de Registros (useSavedRotations): así también se pone al día un equipo
 *  que se despierta de la suspensión. Solo repinta cuando el día cambia de verdad.
 */


// CHECK_MS = «cada cuánto se mira si el día cambió»
const CHECK_MS = 60 * 1000;


export default function useOperationalDay() {
    const [today, setToday] = useState(() => operationalDay());

    useEffect(() => {
        const timer = setInterval(() => setToday(operationalDay()), CHECK_MS);
        return () => clearInterval(timer);
    }, []);

    return today;
}
