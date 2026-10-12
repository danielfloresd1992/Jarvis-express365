import { PROCESS_COLUMNS, PROCESS_GRID, PROCESS_STRIPES, ADD_WIDTH, SAVE_WIDTH, headerTint } from './columns.js';
import RegisterProcessLine from './RegisterProcessLine.jsx';


/*  LOS PROCESOS DE UNA ROTACIÓN, DESPLEGADOS DEBAJO DE SU FILA
 *
 *  Una tabla pequeña con su propia cabecera —número de ticket, tipo de plato, toma de orden, listo en
 *  tablet y su duración, listo en cocina, entrega del plato y su duración— y una línea por proceso,
 *  metida en una tarjeta clara dentro de la franja de su rotación (ver registers.css). Va debajo de las
 *  columnas de datos: deja libres la del «+», a la izquierda, y la de los gerentes, a la derecha.
 *
 *  La cabecera es pequeña y apagada a propósito: los procesos son el detalle de la rotación y no pueden
 *  pesar más que ella. Las columnas que rellena la IA llevan un punto verde.
 *
 *  Cada columna se reconoce por su color, como las de la rotación pero con una paleta propia
 *  (PROCESS_COLUMNS): su cabecera va teñida de él, y la tarjeta lleva debajo sus franjas (PROCESS_STRIPES).
 */


/*  @param {object}   record        la rotación: { id, process… }
 *  @param {Map}      liveByKey     lo que dice ahora mismo el seguimiento de cada pedido, por su key
 *  @param {function} writeProcess  anota (id de la rotación, id del proceso, campo, valor)
 *  @param {function} deleteProcess borra un proceso (id de la rotación, id del proceso)
 *  @param {number}   widthOfManagers  lo que mide la columna de los gerentes (0 = no hay)
 */
export default function RegisterProcessList({ record, liveByKey, writeProcess, deleteProcess, widthOfManagers }) {
    return (
        <div className='register-rotation__processes' style={{ paddingLeft: ADD_WIDTH, paddingRight: widthOfManagers + SAVE_WIDTH }}>

            <div className='register-process-card' style={PROCESS_STRIPES}>

                <div style={PROCESS_GRID}>
                    {
                        PROCESS_COLUMNS.map(column => (
                            <div
                                key={column.id}
                                className='min-h-[22px] min-w-0 py-[3px] flex items-center justify-center gap-[5px] text-center leading-[1.15] uppercase text-[10px] font-semibold tracking-[0.5px] text-jx-tinta3 border-b border-b-jx-regla'
                                style={column.color ? { background: headerTint(column) } : undefined}
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
                            onDelete={() => deleteProcess(record.id, process.id)}
                        />
                    ))
                }

            </div>

        </div>
    );
}
