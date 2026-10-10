import { memo } from 'react';
import { plural, porCiento } from '../../formato.js';
import Score from './Score.jsx';


/*  LOS MARCADORES
 *
 *  Las cuentas que importan, en grande: cuántos tickets generó la simulación, cuántos reconoció la
 *  inferencia, qué porcentaje acertó, cuántos se le escaparon, cuántas horas no cuadran y cuántos
 *  tickets se inventó. El color dice si va bien (verde), regular (ámbar) o mal (rojo).
 */


// measure = «una fracción de aciertos y su color». Sin nada que medir todavía no hay ni porcentaje ni color.
const measure = (part, total) => (total > 0 ? { text: porCiento(part / total), tone: part === total ? 'bien' : part / total >= 0.5 ? 'aviso' : 'mal' } : { text: '—', tone: '' });

// failure = «una fracción de fallos y su color». Va al revés que los aciertos: aquí CERO es lo bueno.
const failure = (part, total) => (total > 0 ? { text: porCiento(part / total), tone: part === 0 ? 'bien' : part / total <= 0.2 ? 'aviso' : 'mal' } : { text: '—', tone: '' });


/*  @param {object}  summary       el resumen de la comparación ('resumen' de comparar)
 *  @param {object}  shift         el turno, tal como entró en la comparación
 *  @param {boolean} hasInference  la ventana de la tablet ya mandó algo
 *  @param {number}  toleranceS    los segundos de desvío que se dan por buenos
 */
function Scoreboard({ summary, shift, hasInference, toleranceS }) {

    const {
        generados, reconocibles, existen, inferidos, aciertos, inventados, numerosInventados, errorMedio,
        sinReconocer, numerosSinReconocer, horaDesviada, numerosHoraDesviada,
    } = summary;

    const recognized = measure(existen, reconocibles);
    const hits = measure(aciertos, inferidos);

    const missed = failure(sinReconocer, reconocibles);
    const wrongTime = failure(horaDesviada, existen);

    return (
        <div className='sim-marcadores'>

            <Score
                number={generados}
                label='generó la simulación'
                detail={shift.disponible ? `mesa ${shift.rotacionesIniciadas} de ${shift.rotacionesDelTurno} · ${plural(shift.demoras.total, 'demora', 'demoras')}` : plural(generados, 'ticket', 'tickets')}
                help='Tabla 1. Todos los tickets que ha creado la simulación, estén o no todavía en pantalla.'
            />

            <Score
                number={hasInference ? recognized.text : '—'}
                tone={hasInference ? recognized.tone : ''}
                label='reconoció la inferencia'
                detail={hasInference ? `${existen} de ${reconocibles} que pudo ver` : 'todavía no ha llegado nada de la ventana de la tablet'}
                help='De los tickets que la ventana de la tablet PUDO ver, cuántos reconoció. No cuentan los que ya estaban en pantalla al conectar (se apartan a propósito) ni los que nunca llegaron a pintarse.'
            />

            <Score
                number={hasInference ? hits.text : '—'}
                tone={hasInference ? hits.tone : ''}
                label='de aciertos'
                detail={hasInference ? `${aciertos} de ${inferidos} que dio la inferencia${errorMedio !== null ? ` · error medio ${errorMedio} s` : ''}` : '—'}
                help={`Tabla 2. De todo lo que dio la inferencia, cuánto está BIEN: el ticket existe, la mesa es la suya y la toma de orden cae dentro de ±${toleranceS} s.`}
            />

            {/*  NO RECONOCIDOS: los que la lectura pudo ver y se le escaparon.  */}
            <Score
                number={hasInference ? missed.text : '—'}
                tone={hasInference ? missed.tone : ''}
                label={sinReconocer === 1 ? 'ticket sin reconocer' : 'tickets sin reconocer'}
                detail={!hasInference ? '—'
                    : sinReconocer > 0 ? `${sinReconocer} de ${reconocibles} · ${numerosSinReconocer.slice(0, 8).join(' ')}`
                        : `ninguno: vio los ${reconocibles} que pudo ver`}
                help='Tickets que la ventana de la tablet PUDO ver y la inferencia no dio. Es el reverso de «reconoció la inferencia», puesto aparte para no tener que restar de cabeza. Salen en la tabla 2, marcados «sin reconocer».'
            />

            {/*  Y de los que sí vio, aquellos cuya hora no cuadra.  */}
            <Score
                number={hasInference ? wrongTime.text : '—'}
                tone={hasInference ? wrongTime.tone : ''}
                label={horaDesviada === 1 ? 'toma de orden que no coincide' : 'tomas de orden que no coinciden'}
                detail={!hasInference ? '—'
                    : horaDesviada > 0 ? `${horaDesviada} de ${existen} · ${numerosHoraDesviada.slice(0, 8).join(' ')}`
                        : existen > 0 ? `ninguna: las ${existen} caen dentro de ±${toleranceS} s`
                            : '—'}
                help={`De los tickets que la inferencia reconoció Y existen, aquellos cuya toma de orden se sale de ±${toleranceS} s. No cuentan aquí los que se vieron ya listos (su hora es una estimación) ni los que se quedaron sin hora.`}
            />

            <Score
                number={hasInference ? inventados : '—'}
                tone={!hasInference ? '' : inventados > 0 ? 'mal' : 'bien'}
                label={inventados === 1 ? 'ticket que no existe' : 'tickets que no existen'}
                detail={inventados > 0 ? numerosInventados.join(' · ') : hasInference ? 'la lectura no se ha inventado ninguno' : '—'}
                help='Tickets que dio la inferencia y que la simulación nunca generó: números inventados o mal leídos. Salen arriba del todo en la tabla 2.'
            />

        </div>
    );
}


//  'memo': solo se repinta cuando cambia la comparación (una vez por segundo como mucho) o la
//  tolerancia, y no con cada movimiento de un deslizador del panel.
export default memo(Scoreboard);
