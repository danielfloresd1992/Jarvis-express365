import { secondsOf, isConfiguredLimit } from '../../libs/date_time/timeLimit.js';
import { clockDuration } from '../../libs/date_time/waitingTime.js';
import './formFields.css';


/*  LO QUE TARDÓ, CONTRA SU LÍMITE (propuesta «C · Línea de tiempo», elegida por el usuario)
 *
 *  Una barra: verde hasta el límite, roja lo que se pasó, y la raya del límite encima. Arriba, la duración y cuánto
 *  se pasó («+00:04:04») o cuánto sobra («sobran 00:03:20»). Sin una duración que se entienda o sin un límite
 *  configurado no pinta nada: no hay contra qué medir.
 *
 *  La escala se ajusta para que lo más largo de los dos llegue al 95 %: siempre se ve el final de la barra.
 *
 *  @param {string} title       qué se mide: 'En tablet, contra el límite de día'
 *  @param {string} elapsed     lo que tardó, 'HH:MM:SS' (el mismo que calcula y envía el formulario)
 *  @param {string} limit       el límite, 'HH:MM:SS'
 *  @param {string} inTimeNote  opcional. Lo que se dice si NO se pasó (por ejemplo, que así no es una demora)
 */
export default function LimitBar({ title, elapsed, limit, inTimeNote }) {

    const spent = secondsOf(elapsed);
    if (spent === null || !isConfiguredLimit(limit)) return null;

    const allowed = secondsOf(limit);
    const late = spent > allowed;

    // percent = «unos segundos, como posición en la barra»
    const scale = Math.max(spent, allowed) / 0.95;
    const percent = (seconds) => (seconds / scale) * 100;

    const difference = clockDuration(Math.abs(spent - allowed));
    const figure = late ? `+${difference}` : `sobran ${difference}`;
    const limitAt = percent(allowed);

    return (
        <section className={`ff-limit ${late ? 'ff-limit--late' : 'ff-limit--ok'}`} aria-label={title}>
            <div className='ff-limit__head'>
                <span className='ff-limit__title'>{title}</span>
                <span className='ff-limit__figure'><b className='ff-mono'>{clockDuration(spent)}</b> · {figure}</span>
            </div>

            <div className='ff-limit__bar' role='img' aria-label={`${clockDuration(spent)} contra ${limit}: ${late ? `se pasó ${difference}` : `sobran ${difference}`}`}>
                <span className='ff-limit__fill' style={{ width: `${percent(Math.min(spent, allowed))}%` }} />
                {late && <span className='ff-limit__over' style={{ left: `${limitAt}%`, width: `${percent(spent - allowed)}%` }} />}
                <span className='ff-limit__mark' style={{ left: `${limitAt}%` }} />
            </div>

            <div className='ff-limit__scale'>
                <span style={{ left: 0 }}>00:00:00</span>
                {/*  Cerca del final, la etiqueta del límite se alinea por la derecha para no salirse  */}
                <span className={`ff-limit__limit ${limitAt > 78 ? 'ff-limit__limit--end' : ''}`} style={{ left: `${limitAt}%` }}>Límite {limit}</span>
            </div>

            {!late && inTimeNote && <p className='ff-limit__note'>{inTimeNote}</p>}
        </section>
    );
}
