import { horasMin, enUnRato } from '../../formato.js';


/*  CÓMO VA EL TURNO
 *
 *  Una línea con el estado, una barra con dos medidas —el relleno son las mesas que ya entraron y la
 *  marca es por dónde va el reloj— y las cifras de lo que hay en pantalla.
 */


/*  @param {object}  shift      el turno (readShift)
 *  @param {boolean} receiving  están entrando tickets
 *  @param {boolean} started    ya se empezó
 *  @param {number}  speed      la velocidad del reloj
 */
export default function ShiftStatus({ shift, receiving, started, speed }) {

    if (!shift.disponible) return <p className='sim-ayuda'>El motor que está cargado no lleva la cuenta del turno: aquí no hay nada que enseñar.</p>;

    // entered = «las mesas que ya entraron» · total = «las del turno»
    const { rotacionesIniciadas: entered, rotacionesDelTurno: total } = shift;

    const headline = shift.terminado ? `Turno terminado: ${entered} de ${total}` : receiving ? 'Turno en marcha' : started ? 'Turno en pausa' : 'Turno sin empezar';

    const details = [];
    if (!shift.terminado) {
        details.push(`mesa ${entered} de ${total}`);
        details.push(`${horasMin(shift.transcurridoS)} de ${horasMin(shift.duracionS)}`);

        if (entered >= total) details.push(`ya entraron todas · quedan ${shift.activasEnPantalla} en cocina`);
        else if (receiving && shift.proximaRotacionEnS !== null) details.push(`próxima mesa en ${enUnRato(shift.proximaRotacionEnS)}`);
    }

    // tablesProgress = «cuánto llevan las mesas» · clockProgress = «cuánto lleva el reloj», de 0 a 1
    const tablesProgress = total > 0 ? Math.min(1, entered / total) : 0;
    const clockProgress = shift.duracionS > 0 ? Math.min(1, shift.transcurridoS / shift.duracionS) : 0;

    const nextInRealTime = speed > 1 && shift.proximaRotacionEnS !== null
        ? ` La próxima mesa llega en ${enUnRato(shift.proximaRotacionEnS / speed)} de los de verdad.`
        : '';

    return (
        <div className={`sim-turno ${shift.terminado ? 'sim-turno--fin' : receiving ? '' : 'sim-turno--pausa'}`}>
            <p className='sim-turno__estado' title={`Las horas son del reloj de la tablet, que corre a ×${speed}.${nextInRealTime}`}>
                <b>{headline}</b>{details.map(detail => <span key={detail}> · {detail}</span>)}
            </p>

            <div
                className='sim-turno__barra' role='progressbar' aria-label='Mesas del turno que ya han entrado'
                aria-valuemin={0} aria-valuemax={total} aria-valuenow={entered} aria-valuetext={`${entered} de ${total} mesas`}
                title={`Relleno: mesas que ya entraron (${entered} de ${total}). Marca: por dónde va el reloj del turno (${shift.inicio || '—'} → ${shift.fin || '—'}).`}
            >
                <span className='sim-turno__relleno' style={{ width: `${tablesProgress * 100}%` }} />
                <span className='sim-turno__marca' style={{ left: `${clockProgress * 100}%` }} />
            </div>

            <p className='sim-turno__cifras'>
                en pantalla <b>{shift.activasEnPantalla}</b> · tickets <b>{shift.tickets}</b> · mesas terminadas <b>{shift.rotacionesTerminadas}</b>
                {shift.rotacionesManuales > 0 && <> · a mano <b>{shift.rotacionesManuales}</b></>} · demoras <b className={shift.demoras.total > 0 ? 'sim-mal' : ''}>{shift.demoras.total}</b>
            </p>
        </div>
    );
}
