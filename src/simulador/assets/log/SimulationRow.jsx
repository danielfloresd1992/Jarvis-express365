import { esNumero, minSeg } from '../../formato.js';
import RecognitionCell from './RecognitionCell.jsx';
import DelayBadge from './DelayBadge.jsx';
import RowActions from './RowActions.jsx';


/*  UNA FILA DE LA TABLA 1: un ticket que generó la simulación
 *
 *  Lo que ya no tiene columna propia —los productos, la rotación, a qué hora se despachó y se fue de la
 *  pantalla— va en el rótulo de la fila, al pasar el ratón.
 */


// STATE_LABEL = «cómo se nombra cada estado de la tarjeta»
const STATE_LABEL = { pausa: 'en pausa', fuego: 'en fuego', lista: 'lista', despachada: 'despachada', retirada: 'fuera' };


/*  @param {object} row      una fila de la comparación: { verdad, ia, veredicto, yaEstaba, reconocible… }
 *  @param {object} actions  { disparar, lista, despachar }
 */
export default function SimulationRow({ row, actions }) {

    const { verdad } = row;

    // moreData = «lo que va en el rótulo de la fila»
    const moreData = [
        verdad.productos,
        esNumero(verdad.rotacion) ? `rotación ${verdad.manual ? 'M' : ''}${verdad.rotacion}` : '',
        verdad.despachada ? `despachada ${verdad.despachada}` : '',
        verdad.retirada ? `se fue de la pantalla ${verdad.retirada}` : '',
    ].filter(Boolean).join(' · ');

    return (
        <tr className={verdad.estado === 'retirada' ? 'sim-ida' : ''} title={moreData}>
            <td>
                <b>{verdad.mesa}</b>
                {verdad.aMano && <span className='sim-ficha sim-ficha--amano sim-ficha--pegada' title={verdad.cocinaManual ? 'Ticket creado a mano. Lo preparas tú: la cocina automática no lo toca.' : 'Ticket creado a mano. Lo lleva la cocina automática, como a cualquier otro.'}>a mano</span>}
            </td>
            <td>#{verdad.ticket}</td>
            <td>
                {verdad.tipo || '—'}
                {verdad.retenida && <span className='sim-ficha sim-ficha--hold' title='Nació retenida (HOLD): su contador de cabecera empezó a correr antes que su FIRE'>HOLD</span>}
            </td>
            <td><span className={`sim-ficha sim-ficha--${verdad.estado}`}>{STATE_LABEL[verdad.estado]}</span></td>
            <td className='sim-hora'>{verdad.tomaDeOrden}</td>
            <td className='sim-hora'>{verdad.listoEnTablet || '—'}</td>
            <td className={`sim-hora ${verdad.enPreparacion ? 'sim-en-curso' : ''}`}>
                {esNumero(verdad.preparacionS) ? minSeg(verdad.preparacionS) : '—'}
                <span className='sim-tenue'> / {esNumero(verdad.limiteS) ? minSeg(verdad.limiteS) : '—'}</span>
            </td>
            <td><DelayBadge delay={verdad.demora} excessS={verdad.excesoS} /></td>
            <td><RecognitionCell row={row} /></td>
            <td className='sim-acciones'><RowActions truth={verdad} actions={actions} /></td>
        </tr>
    );
}
