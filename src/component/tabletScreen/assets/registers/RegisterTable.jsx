import { memo, useMemo } from 'react';
import { WrapperCell } from '../../../cells/GridCells.jsx';
import { isBlankRecord } from '../../../../libs/tickets/tableRecords.js';
import { COLUMNS, tableGrid, columnStripes, headerTint, managersWidth } from './columns.js';
import RegisterRecordRow from './RegisterRecordRow.jsx';
import RegisterEmptyNotice from './RegisterEmptyNotice.jsx';
import './registers.css';


/*  EL REGISTER: las rotaciones de las mesas, y dentro de cada una sus procesos
 *
 *  Antes eran dos tablas —Rotación (las mesas) y Procesos (los pedidos)— que se turnaban en pestañas.
 *  Ahora es una: una fila por rotación, y sus procesos se despliegan debajo con la flecha (ver
 *  RegisterRecordRow). Es la estructura de libs/tickets/tableRecords.js.
 *
 *  Al final siempre quedan filas en blanco para anotar a mano; las pone el registro, no esta tabla.
 */


/*  @param {Array}    records         las rotaciones (useRegisterStore), con las filas en blanco del final
 *  @param {Array}    liveOrders      los pedidos que se están siguiendo ahora (useProcessTracking)
 *  @param {string}   attentionLimit  el límite de primera atención del local
 *  @param {string}   cleaningLimit   el límite de limpieza del local
 *  @param {function} writeRecord     anota un dato de una rotación
 *  @param {function} writeProcess    anota una hora de un proceso
 *  @param {function} addProcess      añade un proceso en blanco a una rotación
 *  @param {function} deleteProcess   borra un proceso de una rotación
 *  @param {function} clearRecord     deja una rotación en blanco (ya guardada en la API)
 *  @param {function} addTouch        apunta un toque de gerente en una rotación
 *  @param {function} writeTouch      corrige la hora de un toque
 *  @param {function} deleteTouch     borra un toque
 *  @param {function} onReportDelay   qué hacer cuando se pide reportar una demora
 *
 *  Y los datos para explicar un register vacío (ver RegisterEmptyNotice). Con alguna rotación no se usan:
 *  @param {boolean}  hasReading      false antes de la primera lectura y tras desconectar
 *  @param {string}   readingError    el motivo, si la última lectura falló
 *  @param {boolean}  censusing       el seguimiento sigue apuntando lo que ya estaba
 *  @param {number}   censusReadings  cuántas lecturas lleva en ello…
 *  @param {number}   censusLength    …y cuántas dura
 *  @param {number}   alreadyThere    cuántas tarjetas apartó el censo
 *
 *  @param {Array}    managers        los botones de los gerentes del local (managers.js): una columna a la derecha
 *  @param {string}   establishmentId el _id del local, para guardar cada rotación (el disquete)
 *  @param {function} onSaved         opcional. La API guardó una rotación: (la rotación guardada), para la lista de Registros
 */
function RegisterTable({ records, liveOrders, attentionLimit, cleaningLimit, writeRecord, writeProcess, addProcess, deleteProcess, clearRecord, addTouch, writeTouch, deleteTouch, onReportDelay, hasReading, readingError, censusing, censusReadings, censusLength, alreadyThere, managers, establishmentId, onSaved }) {

    // liveByKey = «lo que dice ahora mismo el seguimiento de cada pedido», por su key
    const liveByKey = useMemo(() => new Map((liveOrders ?? []).map(order => [order.clave, order])), [liveOrders]);

    // widthOfManagers = «lo que mide la columna de los gerentes» (0 = el local no tiene, y no se pinta).
    // La rejilla y las franjas dependen de ella, y se arman solo cuando cambia.
    const widthOfManagers = managersWidth(managers.length);
    const grid = useMemo(() => tableGrid(widthOfManagers), [widthOfManagers]);
    const stripes = useMemo(() => columnStripes(widthOfManagers), [widthOfManagers]);

    // empty = «no hay ninguna rotación con algo»
    const empty = records.every(isBlankRecord);

    // headerCell = «el estilo de las celdas de la cabecera». Las de las columnas van además teñidas de su color.
    const headerCell = 'uppercase tracking-[0.6px] font-semibold bg-jx-tarjeta text-jx-tinta';

    return (
        <div className='w-full flex-1 min-h-0 flex flex-col'>

            {/*  Se desplaza hacia abajo, nunca hacia los lados: las columnas se reparten el ancho que
                 haya. '@container' deja a las celdas medir la letra por él. Su fondo son las franjas de
                 color de las columnas (columnStripes).  */}
            <div className='@container flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden' style={stripes}>

                {/*  CABECERA FIJA. 'z-10' no es decorativo: sin él las filas que pasan por debajo al
                     desplazarse se dibujan ENCIMA de la cabecera. La celda sin título es la del «+».  */}
                <div className='register-header sticky top-0 z-10 h-[46px] bg-jx-tarjeta w-full' style={grid}>
                    <WrapperCell tall classStyles={headerCell} titulo='Añadir un proceso a mano' />
                    {
                        COLUMNS.map(column => (
                            <WrapperCell key={column.id} tall classStyles={headerCell} estilo={{ background: headerTint(column) }} titulo='Se anota a mano'>
                                {column.title}
                            </WrapperCell>
                        ))
                    }
                    {managers.length > 0 && <WrapperCell tall classStyles={headerCell} titulo='Un botón por cada gerente del local'>Gerentes</WrapperCell>}
                    <WrapperCell tall classStyles={headerCell} titulo='Guardar la rotación' />

                </div>

                {/*  POR QUÉ NO HAY NADA. Solo sin NINGUNA rotación: en cuanto hay una, la tabla se explica sola.  */}
                {
                    empty && (
                        <RegisterEmptyNotice
                            hasReading={hasReading}
                            readingError={readingError}
                            censusing={censusing}
                            censusReadings={censusReadings}
                            censusLength={censusLength}
                            alreadyThere={alreadyThere}
                        />
                    )
                }

                {
                    records.map(record => (
                        <RegisterRecordRow
                            key={record.id}
                            record={record}
                            liveByKey={liveByKey}
                            attentionLimit={attentionLimit}
                            cleaningLimit={cleaningLimit}
                            writeRecord={writeRecord}
                            writeProcess={writeProcess}
                            addProcess={addProcess}
                            deleteProcess={deleteProcess}
                            clearRecord={clearRecord}
                            addTouch={addTouch}
                            writeTouch={writeTouch}
                            deleteTouch={deleteTouch}
                            onReportDelay={onReportDelay}
                            grid={grid}
                            managers={managers}
                            widthOfManagers={widthOfManagers}
                            establishmentId={establishmentId}
                            onSaved={onSaved}
                        />
                    ))
                }

            </div>

        </div>
    );
}


//  'memo': la sesión se repinta a menudo por cosas que a esta tabla le dan igual —qué captura lee la IA,
//  el texto de estado, el zoom—. Con 'memo', React compara las props y, si son las mismas, se la salta.
export default memo(RegisterTable);
