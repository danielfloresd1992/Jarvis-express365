import { RESULTADO } from '../../comparacion.js';
import { delta } from '../../formato.js';


/*  UNA FILA DE LA TABLA 2: el resultado de la inferencia con un ticket
 *
 *  Casi siempre es un ticket que reconoció la inferencia, tal como lo leyó. La excepción son los que se
 *  le escaparon («sin reconocer»): no tienen lectura, así que su mesa, su ticket y su tipo son los de la
 *  simulación, y las horas van vacías.
 */


// RESULT_LOOK = «cómo se enseña cada resultado»: su texto, su color y su explicación
const RESULT_LOOK = {
    [RESULTADO.ACIERTO]: { texto: '✓ acierto', clase: 'sim-resultado--bien' },
    [RESULTADO.HORA_ESTIMADA]: { texto: 'hora estimada', clase: 'sim-resultado--aviso', ayuda: 'El ticket existe, pero se le vio por primera vez ya listo: su toma de orden es una estimación.' },
    [RESULTADO.HORA_DESVIADA]: { texto: 'hora desviada', clase: 'sim-resultado--mal', ayuda: 'El ticket existe, pero su toma de orden se aparta de la verdadera más que la tolerancia.' },
    [RESULTADO.SIN_HORA]: { texto: 'sin hora', clase: 'sim-resultado--aviso', ayuda: 'El ticket existe, pero la inferencia no le sacó toma de orden.' },
    [RESULTADO.MESA_DISTINTA]: { texto: 'mesa distinta', clase: 'sim-resultado--mal', ayuda: 'El número de ticket existe, pero la inferencia lo puso en otra mesa.' },
    [RESULTADO.NO_EXISTE]: { texto: '✗ no existe', clase: 'sim-resultado--mal', ayuda: 'La simulación nunca generó este ticket: la lectura se inventó el número (o lo leyó mal).' },
    [RESULTADO.SIN_RECONOCER]: { texto: '✗ sin reconocer', clase: 'sim-resultado--aviso', ayuda: 'La simulación generó este ticket y estuvo en la pantalla que se leía, pero la inferencia no lo dio. La mesa, el ticket y el tipo son los de la simulación.' },
};


/*  @param {object} row         una fila de la tabla 2: { ia, verdad, dToma, dListo, resultado }. 'ia' es null si no se reconoció
 *  @param {number} toleranceS  los segundos de desvío que se dan por buenos
 */
export default function InferenceRow({ row, toleranceS }) {

    const { ia, verdad, dToma, dListo, resultado } = row;

    const look = RESULT_LOOK[resultado];
    const doesNotExist = resultado === RESULTADO.NO_EXISTE;
    const missed = resultado === RESULTADO.SIN_RECONOCER;
    const deviates = dToma !== null && Math.abs(dToma) > toleranceS;

    // shown = «de dónde salen la mesa, el ticket y el tipo»: de la lectura o, si no la hubo, de la simulación
    const shown = ia ?? verdad;

    //  En «mesa distinta» se dice cuál era la buena, que es lo que se quiere saber.
    const help = resultado === RESULTADO.MESA_DISTINTA ? `${look.ayuda} En la simulación es la mesa ${verdad.mesa}.` : look.ayuda;

    return (
        <tr className={doesNotExist ? 'sim-fila--inventada' : missed ? 'sim-fila--escapada' : ''}>
            <td><b>{shown.mesa || '—'}</b></td>
            <td>#{shown.ticket || '?'}</td>
            <td>{shown.tipo || '—'}</td>
            <td className='sim-hora' title={ia?.tomaOrdenAproximada ? 'Estimada: el ticket se vio por primera vez ya listo' : undefined}>{ia?.tomaOrden ? `${ia.tomaOrdenAproximada ? '≈ ' : ''}${ia.tomaOrden}` : '—'}</td>
            <td className={`sim-hora ${deviates ? 'sim-mal' : ''}`}>{delta(dToma)}</td>
            <td className='sim-hora'>{ia?.listoTablet || '—'}</td>
            <td className='sim-hora'>{delta(dListo)}</td>
            <td><span className={`sim-resultado ${look.clase}`} title={help}>{look.texto}</span></td>
        </tr>
    );
}
