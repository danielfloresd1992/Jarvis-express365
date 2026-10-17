import { useCallback, useEffect, useMemo, useState } from 'react';
import { managerButtons } from './managers.js';
import RegisterBar from './RegisterBar.jsx';
import RegisterViewTabs from './RegisterViewTabs.jsx';
import ShiftToggle from './ShiftToggle.jsx';
import ClearButton from './ClearButton.jsx';
import ReadingStatus from './ReadingStatus.jsx';
import RegisterTable from './RegisterTable.jsx';
import RegisterSaved from './RegisterSaved.jsx';
import RegisterTabPanel from './RegisterTabPanel.jsx';


/*  EL REGISTRO, CON SU BARRA
 *
 *  Arriba la barra —limpiar y cómo va la lectura— y debajo el register: una sola tabla con
 *  las rotaciones de las mesas y, desplegados dentro de cada una, sus procesos.
 *
 *  Es la MISMA pieza en los dos sitios donde se ve el registro: abajo en la ventana flotante
 *  (register.controller.jsx) y en el centro de Home (component/RegisterBoard). Por eso se escribe una
 *  sola vez, y lo de alrededor lo pone cada uno.
 *
 *  Recibe la sesión entera en vez de quince props sueltas: todo lo de aquí sale de ella. Como las
 *  demás piezas de assets/, solo pinta y avisa; quien borra, guarda o reporta es la sesión.
 *
 *  LAS DOS PESTAÑAS ESTÁN SIEMPRE MONTADAS: Mesas (RegisterTable) y Registros (RegisterSaved). Cambiar
 *  de pestaña solo enseña una y oculta la otra (RegisterTabPanel), así que la oculta conserva lo suyo
 *  (pedido del usuario): en Mesas, los procesos y toques desplegados, el aviso de una fila y un guardado
 *  que la API aún no contestó; en Registros, la lista desplegada de una fila (RegisterSavedRow no la
 *  cierra al cambiar de pestaña); en las dos, hasta dónde se había bajado.
 *  Los datos viven en la sesión: las mesas en session.store y las rotaciones guardadas en
 *  session.savedRotations. Ahí vive también la pregunta por los tickets que la IA lee otra vez después de
 *  guardarlos (useSavedRotations), que por eso sigue funcionando aunque este componente no esté en pantalla.
 *
 *  Va dentro de una columna flexible (flex-col): la tabla se queda con el alto que sobra.
 */


/*  @param {object} session        la sesión de la tablet: lo que devuelve hook/useTabletSession.jsx
 *  @param {object} establishment  opcional. El local con sus gerentes: en Home, el de Redux
 *                                 (state.establishment). La flotante no monta Redux y usa el de la sesión.
 */
export default function Registers({ session, establishment = session.establishment }) {

    const { reading, tracking, store, savedRotations, attention, cleaning, clearRegister, reportDelay, shift, shiftLocked, toggleShift } = session;
    const { saved, loadSaved, rememberSaved, editNotice, editSaved, addSavedTouch, deleteSavedTouch, addRecovered, exportSaved } = savedRotations;

    // managers = «los botones de los gerentes del local» (managers.js). Se arman una vez por local: un
    // array nuevo en cada pintado repintaría la tabla entera.
    const managers = useMemo(() => managerButtons(establishment), [establishment]);

    // view = «qué enseña el register»: 'mesas' (la tabla) o 'registros' (las rotaciones guardadas)
    const [view, setView] = useState('mesas');

    //  Al abrir «Registros» se vuelven a pedir las guardadas: así salen también las que otro equipo
    //  guardó mientras se miraba Mesas, aunque su aviso por el socket no haya llegado.
    useEffect(() => {
        if (view === 'registros') loadSaved();
    }, [view, loadSaved]);

    // exportWithManagers = «exportar a Excel un turno» ('all', 'day' o 'night', del menú de Exportar), con los
    // gerentes del local: el Resumen cuenta los toques por placa. «Todas» va en el NAS a la carpeta del turno de
    // la barra (folderShift).
    const exportWithManagers = useCallback((exported) => exportSaved({ managers, shift: exported, folderShift: shift }), [exportSaved, managers, shift]);

    // downloadWithManagers = «descargar el Excel en este equipo» (el botón «Descargar Excel»): igual, pero nunca al NAS
    const downloadWithManagers = useCallback((exported) => exportSaved({ managers, shift: exported, download: true }), [exportSaved, managers]);

    // addRecoveredHere = «guardar una rotación anotada a mano en Registros», en este local (su _id, como el disquete de Mesas)
    const establishmentId = establishment?._id;
    const addRecoveredHere = useCallback((fields) => addRecovered(fields, establishmentId), [addRecovered, establishmentId]);

    return (
        <>
            {/*  Las pestañas a la izquierda; a la derecha el estado de la lectura ('ml-auto' lo empuja) y,
                 tras una raya, las dos acciones con icono.  */}
            <RegisterBar>
                <RegisterViewTabs view={view} onChange={setView} />

                {/*  El turno con que nacen las rotaciones: de día o de noche (toggleShift, de la sesión)  */}
                <ShiftToggle shift={shift} locked={shiftLocked} onToggle={toggleShift} />

                <ReadingStatus
                    diagnosis={reading.diagnosis}
                    censusing={tracking.censusing}
                    censusReadings={tracking.censusReadings}
                    censusLength={tracking.censusLength}
                    orders={tracking.orders.length}
                />

                <span aria-hidden='true' className='shrink-0 w-px h-5 mx-1 bg-jx-regla2' />

                <ClearButton onClear={clearRegister} />
            </RegisterBar>

            {/*  «Registros»: las rotaciones guardadas de hoy, que aquí se pueden corregir y exportar  */}
            <RegisterTabPanel visible={view === 'registros'}>
                <RegisterSaved
                    saved={saved}
                    establishmentName={establishment?.name}
                    attentionLimit={attention}
                    cleaningLimit={cleaning}
                    onRetry={loadSaved}
                    onEdit={editSaved}
                    onAddTouch={addSavedTouch}
                    onDeleteTouch={deleteSavedTouch}
                    editNotice={editNotice}
                    managers={managers}
                    onExport={exportWithManagers}
                    onDownload={downloadWithManagers}
                    onAddRotation={addRecoveredHere}
                    defaultShift={shift}
                />
            </RegisterTabPanel>

            {/*  LA TABLA SOLO SE REPINTA CUANDO CAMBIA ALGUNA DE SUS PROPS ('memo'). Por eso aquí no se
                 le pasa ninguna función escrita en línea ni ningún objeto armado en el sitio: serían
                 nuevos en cada pintado y la repintarían siempre.

                 Los seis últimos datos son para cuando está VACÍA: con ellos dice por qué, en vez de
                 enseñar filas en blanco que lo mismo son «todo bien» que «no leo».  */}
            <RegisterTabPanel visible={view === 'mesas'}>
                <RegisterTable
                    records={store.records}
                    liveOrders={tracking.orders}
                    attentionLimit={attention}
                    cleaningLimit={cleaning}
                    writeRecord={store.writeRecord}
                    writeProcess={store.writeProcess}
                    writeListOpen={store.writeListOpen}
                    addProcess={store.addProcess}
                    deleteProcess={store.deleteProcess}
                    clearRecord={store.clearRecord}
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
                    establishmentId={establishment?._id}
                    onSaved={rememberSaved}
                />
            </RegisterTabPanel>
        </>
    );
}
