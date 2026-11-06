import useClockOffset from '../../hook/useClockOffset.jsx';
import { offsetText } from '../../../../libs/date_time/serverClock.js';


/*  EL RELOJ DE ESTE EQUIPO VA DESFASADO, en la barra del registro, junto a la subida en vivo. Solo pinta, y solo
 *  cuando hace falta: con el reloj bien puesto no sale nada.
 *
 *      ● Reloj atrasado 5 h        por dentro, el equipo va 5 h por detrás de la hora real
 *
 *  Mesas ya fecha con la hora del servidor (serverClock.js), así que sus días salen bien igual. La píldora está para
 *  que se arregle el equipo: el resto de la app todavía usa su reloj.
 */
export default function ClockStatus() {

    const offset = useClockOffset();
    if (offset === 0) return null;

    const amount = offsetText(offset);
    const direction = offset > 0 ? 'atrasado' : 'adelantado';
    const title = [
        `El reloj de este equipo va ${amount} ${direction} respecto a la hora del servidor.`,
        'Mesas usa la hora del servidor, así que el día y la fecha de cada rotación salen bien; el resto de la app todavía usa la del equipo.',
        'Para arreglarlo en Windows: Configuración → Hora e idioma → Fecha y hora. Zona horaria «(UTC-04:00) Caracas» y «Establecer la hora automáticamente» activado.',
    ].join('\n');

    return (
        <span role='status' title={title} className='inline-flex items-center gap-1.5 shrink-0 h-7 px-2.5 rounded-full border text-[11px] font-semibold whitespace-nowrap border-jx-aviso-suave bg-jx-aviso-suave text-jx-aviso-texto'>
            <span aria-hidden='true' className='w-1.5 h-1.5 rounded-full bg-jx-ocre' />
            Reloj {direction} {amount}
        </span>
    );
}
