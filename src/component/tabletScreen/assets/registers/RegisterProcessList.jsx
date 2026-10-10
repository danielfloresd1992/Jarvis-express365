import { PROCESS_COLUMNS, PROCESS_GRID, TOGGLE_WIDTH, ADD_WIDTH } from './columns.js';
import RegisterProcessLine from './RegisterProcessLine.jsx';


/*  LOS PROCESOS DE UNA ROTACIÓN, DESPLEGADOS DEBAJO DE SU FILA
 *
 *  Una tabla pequeña con su propia cabecera —número de ticket, tipo de plato, toma de orden, listo en
 *  tablet y su duración, listo en cocina, entrega del plato y su duración— y una línea por proceso,
 *  metida en una tarjeta clara dentro de la franja
 *  de su rotación (ver registers.css). Va entre la columna de la flecha y la del «+», para que se lea
 *  como parte de su fila.
 *
 *  La cabecera es pequeña y apagada a propósito: los procesos son el detalle de la rotación y no pueden
 *  pesar más que ella. Las columnas que rellena la IA llevan un punto verde.
 */


/*  @param {object}   record        la rotación: { id, process… }
 *  @param {Map}      liveByKey     lo que dice ahora mismo el seguimiento de cada pedido, por su key
 *  @param {function} writeProcess  anota (id de la rotación, id del proceso, campo, valor)
 */
export default function RegisterProcessList({ record, liveByKey, writeProcess }) {
    return (
        <div className='register-rotation__processes' style={{ paddingLeft: TOGGLE_WIDTH, paddingRight: ADD_WIDTH }}>

            <div className='register-process-card'>

                <div style={PROCESS_GRID}>
                    {
                        PROCESS_COLUMNS.map(column => (
                            <div
                                key={column.id}
                                className='min-h-[22px] min-w-0 py-[3px] flex items-center justify-center gap-[5px] text-center leading-[1.15] uppercase text-[10px] font-semibold tracking-[0.5px] text-jx-tinta3 border-b border-b-jx-regla'
                                title={column.fromTablet ? 'La rellena la lectura de la tablet' : column.computed ? 'Se calcula con las dos horas de su izquierda' : 'Se anota a mano'}
                            >
                                {column.fromTablet && <span className='size-1.5 shrink-0 rounded-full bg-jx-verde-barra' aria-hidden='true' />}
                                {/*  Si no cabe en un renglón pasa a dos, en vez de cortarse: la tabla puede ser estrecha  */}
                                <span className='min-w-0'>{column.title}</span>
                            </div>
                        ))
                    }
                </div>

                {
                    record.process.map(process => (
                        <RegisterProcessLine
                            key={process.id}
                            process={process}
                            live={process.key ? liveByKey.get(process.key) : undefined}
                            onWrite={(field, value) => writeProcess(record.id, process.id, field, value)}
                        />
                    ))
                }

            </div>

        </div>
    );
}
