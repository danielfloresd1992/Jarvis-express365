import { memo } from 'react';
import { plural, porCiento } from '../../formato.js';
import InferenceRow from './InferenceRow.jsx';


/*  TABLA 2 · EL RESULTADO DE LA INFERENCIA
 *
 *  Un ticket por fila, tal como lo leyó la ventana de la tablet, con lo que se desvía de la verdad y
 *  su resultado. Los que no existen salen arriba del todo.
 *
 *  Y, en su sitio, los que se le escaparon: tickets que generó la simulación, estuvieron en la pantalla
 *  que se leía y la inferencia no dio. Salen con «sin reconocer» y con los datos de la simulación.
 */


/*  @param {Array}   rows          las filas de la tabla 2 ('tabla2' de comparar)
 *  @param {object}  summary       el resumen de la comparación
 *  @param {boolean} hasInference  la ventana de la tablet ya mandó algo
 *  @param {number}  toleranceS    los segundos de desvío que se dan por buenos
 */
function InferenceTable({ rows, summary, hasInference, toleranceS }) {

    const { aciertos, inferidos, inventados, sinReconocer } = summary;

    // count = «la cuenta del título»: los aciertos, y los dos fallos si los hay
    const count = inferidos > 0 || sinReconocer > 0
        ? [
            inferidos > 0 ? `${aciertos} de ${plural(inferidos, 'acierto', 'aciertos')} (${porCiento(aciertos / inferidos)})` : 'ninguno reconocido',
            inventados > 0 ? plural(inventados, 'no existe', 'no existen') : '',
            sinReconocer > 0 ? `${sinReconocer} sin reconocer` : '',
        ].filter(Boolean).join(' · ')
        : 'nada todavía';

    return (
        <div className='sim-bloque sim-bloque--ia'>
            <h3 className='sim-bloque__titulo'><span className='sim-bloque__numero'>2</span> Resultado de la inferencia <small>{count}</small></h3>

            <div className='sim-tabla-caja' tabIndex={0} role='region' aria-label='Tabla 2: resultado de la inferencia'>
                {rows.length === 0
                    ? <p className='sim-vacio'>{hasInference ? 'La ventana de la tablet está conectada, pero la inferencia todavía no ha dado ningún ticket.' : 'Conecta la ventana de la tablet (su botón «Simular»): aquí irá saliendo lo que lea la IA.'}</p>
                    : (
                        <table className='sim-tabla'>
                            <thead>
                                <tr>
                                    <th>Mesa</th>
                                    <th>Ticket</th>
                                    <th>Tipo</th>
                                    <th>Toma de orden</th>
                                    <th title='Segundos de diferencia con la toma de orden verdadera'>Dif.</th>
                                    <th>Listo en tablet</th>
                                    <th title='Segundos de diferencia con el «listo» verdadero'>Dif.</th>
                                    <th title={`Acierto = el ticket existe, su mesa es la suya y la toma de orden cae dentro de ±${toleranceS} s`}>Resultado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/*  La clave es la del ticket: la de su lectura, o la de la simulación si no la hubo.  */}
                                {rows.map(row => <InferenceRow key={row.ia ? `ia:${row.ia.clave}` : `simulación:${row.verdad.clave}`} row={row} toleranceS={toleranceS} />)}
                            </tbody>
                        </table>
                    )}
            </div>
        </div>
    );
}


//  'memo': solo se repinta cuando cambia la comparación o la tolerancia.
export default memo(InferenceTable);
