import { useMemo } from 'react';
import { managerButtons } from './managers.js';
import RegisterBar from './RegisterBar.jsx';
import ExportButton from './ExportButton.jsx';
import ClearButton from './ClearButton.jsx';
import ReadingStatus from './ReadingStatus.jsx';
import RegisterTable from './RegisterTable.jsx';


/*  EL REGISTRO, CON SU BARRA
 *
 *  Arriba la barra —exportar, limpiar y cómo va la lectura— y debajo el register: una sola tabla con
 *  las rotaciones de las mesas y, desplegados dentro de cada una, sus procesos.
 *
 *  Es la MISMA pieza en los dos sitios donde se ve el registro: abajo en la ventana flotante
 *  (register.controller.jsx) y en el centro de Home (component/RegisterBoard). Por eso se escribe una
 *  sola vez, y lo de alrededor lo pone cada uno.
 *
 *  Recibe la sesión entera en vez de quince props sueltas: todo lo de aquí sale de ella. Como las
 *  demás piezas de assets/, solo pinta y avisa; quien borra, exporta o reporta es la sesión.
 *
 *  Va dentro de una columna flexible (flex-col): la tabla se queda con el alto que sobra.
 */


/*  @param {object} session        la sesión de la tablet: lo que devuelve hook/useTabletSession.jsx
 *  @param {object} establishment  opcional. El local con sus gerentes: en Home, el de Redux
 *                                 (state.establishment). La flotante no monta Redux y usa el de la sesión.
 */
export default function Registers({ session, establishment = session.establishment }) {

    const { reading, tracking, store, attention, cleaning, exportSheet, clearRegister, reportDelay } = session;

    // managers = «los botones de los gerentes del local» (managers.js). Se arman una vez por local: un
    // array nuevo en cada pintado repintaría la tabla entera.
    const managers = useMemo(() => managerButtons(establishment), [establishment]);

    return (
        <>
            <RegisterBar>
                <ExportButton onExport={exportSheet} />

                <ClearButton onClear={clearRegister} />

                <ReadingStatus
                    diagnosis={reading.diagnosis}
                    censusing={tracking.censusing}
                    censusReadings={tracking.censusReadings}
                    censusLength={tracking.censusLength}
                    orders={tracking.orders.length}
                />
            </RegisterBar>

            {/*  LA TABLA SOLO SE REPINTA CUANDO CAMBIA ALGUNA DE SUS PROPS ('memo'). Por eso aquí no se
                 le pasa ninguna función escrita en línea ni ningún objeto armado en el sitio: serían
                 nuevos en cada pintado y la repintarían siempre.

                 Los seis últimos datos son para cuando está VACÍA: con ellos dice por qué, en vez de
                 enseñar filas en blanco que lo mismo son «todo bien» que «no leo».  */}
            <RegisterTable
                records={store.records}
                liveOrders={tracking.orders}
                attentionLimit={attention}
                cleaningLimit={cleaning}
                writeRecord={store.writeRecord}
                writeProcess={store.writeProcess}
                addProcess={store.addProcess}
                deleteProcess={store.deleteProcess}
                addTouch={store.addTouch}
                writeTouch={store.writeTouch}
                deleteTouch={store.deleteTouch}
                onReportDelay={reportDelay}
                hasReading={Boolean(reading.diagnosis)}
                readingError={reading.diagnosis?.error || ''}
                censusing={tracking.censusing}
                censusReadings={tracking.censusReadings}
                censusLength={tracking.censusLength}
                alreadyThere={tracking.alreadyThere.size}
                managers={managers}
            />
        </>
    );
}
