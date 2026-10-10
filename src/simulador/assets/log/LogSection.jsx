/*  EL REGISTRO DE LA SIMULACIÓN: DOS TABLAS QUE SE LEEN DE UN VISTAZO
 *
 *      1 · LO QUE GENERÓ LA SIMULACIÓN      la verdad: cada ticket con sus horas    (SimulationTable)
 *      2 · LO QUE RECONOCIÓ LA INFERENCIA   lo que leyó la IA, con su resultado     (InferenceTable)
 *
 *  Encima, a la altura del título, lo que se le pase en 'tools': los marcadores con las cuentas que
 *  importan (Scoreboard) y los botones de exportar y limpiar (LogActions).
 *
 *  Antes era UNA tabla de veintiuna columnas con la verdad y lo inferido en la misma fila. Tenía todos
 *  los datos y no se leía ninguno. Lo que aquí ya no se pinta —la demora según Jarvis, a qué hora se fue
 *  cada tarjeta de la pantalla— sigue saliendo en la exportación a CSV y JSON.
 *
 *  Las cuentas están en comparacion.js; los componentes del registro SOLO PINTAN.
 */


/*  @param {node} tools  lo que va junto al título
 */
export default function LogSection({ tools, children }) {
    return (
        <section className='sim-registro' aria-label='Registro de la simulación'>

            <div className='sim-registro__cabeza'>
                <h2>Registro de la simulación</h2>
                {tools}
            </div>

            <div className='sim-dos-tablas'>
                {children}
            </div>

        </section>
    );
}
