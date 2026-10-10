import { memo } from 'react';
import { plural } from '../../formato.js';
import SimulationRow from './SimulationRow.jsx';


/*  TABLA 1 · LO QUE GENERÓ LA SIMULACIÓN
 *
 *  Un ticket por fila, el más nuevo arriba, con sus horas de verdad, su preparación y su demora, si lo
 *  reconoció la inferencia y —mientras no se haya despachado— los botones para manejarlo.
 */


/*  @param {Array}   rows      las filas de la comparación ('filas' de comparar)
 *  @param {boolean} stopped   no están entrando tickets (cambia el texto de «no hay nada»)
 *  @param {object}  actions   { disparar, lista, despachar }: lo que hacen los botones de cada fila
 */
function SimulationTable({ rows, stopped, actions }) {
    return (
        <div className='sim-bloque'>
            <h3 className='sim-bloque__titulo'><span className='sim-bloque__numero'>1</span> Generados por la simulación <small>{plural(rows.length, 'ticket', 'tickets')} · el más nuevo arriba</small></h3>

            <div className='sim-tabla-caja' tabIndex={0} role='region' aria-label='Tabla 1: tickets generados por la simulación'>
                {rows.length === 0
                    ? <p className='sim-vacio'>{stopped ? 'Todavía no hay ningún ticket. Pulsa «Empezar a recibir tickets», encima de la pantalla, o crea uno a mano desde el panel.' : 'Aún no ha entrado ningún pedido. Entran solos, o créalos con los botones del panel.'}</p>
                    : (
                        <table className='sim-tabla'>
                            <thead>
                                <tr>
                                    <th>Mesa</th>
                                    <th>Ticket</th>
                                    <th>Tipo</th>
                                    <th>Estado</th>
                                    <th>Toma de orden</th>
                                    <th title='Primera señal en la tablet de que está listo: se completa de palomitas o se despacha'>Listo</th>
                                    <th title='Lo que tardó en prepararse (del FIRE a todas las palomitas) y, detrás, su tiempo máximo. En cursiva si sigue cocinándose'>Prep. / máx.</th>
                                    <th title='Si la preparación superó su máximo, y por cuánto'>Demora</th>
                                    <th title='¿Lo reconoció la inferencia? «ya estaba» y «no se vio» no son fallos: esos tickets no se podían reconocer'>¿Reconocido?</th>
                                    <th className='sim-acciones' title='Para toda tarjeta sin despachar: dispararla si está en pausa, marcarla lista y despacharla'>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(row => <SimulationRow key={row.verdad.id} row={row} actions={actions} />)}
                            </tbody>
                        </table>
                    )}
            </div>
        </div>
    );
}


//  'memo': con un turno entero son cientos de filas. Solo se repinta cuando cambia la comparación (con
//  el latido), y no con cada movimiento de un deslizador del panel.
export default memo(SimulationTable);
