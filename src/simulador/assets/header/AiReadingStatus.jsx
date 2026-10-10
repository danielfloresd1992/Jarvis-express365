import { recortar } from '../../formato.js';


/*  CÓMO ACABÓ LA ÚLTIMA LECTURA DE LA IA, en la barra de arriba
 *
 *  La frase la arma describeLastReading (hook/useTabletLink.jsx). Si la última falló, el motivo va
 *  recortado detrás y entero al pasar el ratón.
 */


/*  @param {object} reading  { texto, fallo, titulo }: lo que devuelve describeLastReading
 */
export default function AiReadingStatus({ reading }) {
    return (
        <span className='sim-lee'>
            <span className='sim-lee__texto' title={`${reading.texto}\n${reading.titulo}`}>{reading.texto}</span>
            {reading.fallo && <span className='sim-lee__fallo sim-aviso' title={reading.fallo}> · la última falló: {recortar(reading.fallo, 48)}</span>}
        </span>
    );
}
