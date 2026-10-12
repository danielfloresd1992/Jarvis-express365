import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { managerButtons } from './managers.js';
import RegisterBar from './RegisterBar.jsx';
import RegisterViewTabs from './RegisterViewTabs.jsx';
import ShiftToggle from './ShiftToggle.jsx';
import ExportButton from './ExportButton.jsx';
import ClearButton from './ClearButton.jsx';
import ReadingStatus from './ReadingStatus.jsx';
import RegisterTable from './RegisterTable.jsx';
import RegisterSaved from './RegisterSaved.jsx';
import { getRotationsByEstablishment, updateRotation, addRotationTouch, deleteRotationTouch } from '../../../../libs/fetch_data/rotationFetching.js';
import { getCurrentTime } from '../../../cells/GridCells.jsx';
import { operationalDay } from '../../../../libs/date_time/operationalDay.js';
import { socketAppManager } from '../../../../store/slices/socketio.js';


// LIVE_METHODS = «lo que avisa la API en vivo»: una rotación guardada ('post') o corregida ('put')
const LIVE_METHODS = ['post', 'put'];

// DAY_CHECK_MS = «cada cuánto se mira si empezó otro día operativo», en milisegundos
const DAY_CHECK_MS = 60000;

// liveEvent = «el evento de un local»: '<nombre del local>-post' o '<nombre del local>-put' ('Francisca Doral-post').
// Tiene que ser el mismo nombre que arma la API (rotationEvent, en rotation.lib.js).
const liveEvent = (method, establishmentName) => `${establishmentName}-${method}`;

// dayOf = «el día operativo de una rotación guardada», 'AAAA-MM-DD': la API lo guarda como la medianoche UTC de ese día
const dayOf = (rotation) => String(rotation?.operationalDate ?? '').slice(0, 10);


// putSaved = «poner en la lista una rotación que llega en vivo»
// La de un 'put' reemplaza a la que ya estaba (por su _id); la de un 'post' entra en su sitio, por la hora en
// que empezó, como las ordena el GET. Lo que ya está no se duplica: quien guarda recibe también su propio aviso.
// No se toca nada si la lista no está lista (la petición en camino ya la traerá), si la rotación es de otro
// día, o si es la corrección de una que no está en la lista.
function putSaved(saved, rotation, method) {
    if (saved.status !== 'ready' || !rotation?._id) return saved;

    const index = saved.documents.findIndex(item => item._id === rotation._id);
    if (index !== -1) {
        const documents = [...saved.documents];
        documents[index] = rotation;
        return { ...saved, documents };
    }

    if (method !== 'post' || dayOf(rotation) !== saved.day) return saved;

    const documents = [...saved.documents, rotation].sort((one, other) => new Date(one.date) - new Date(other.date));
    return { ...saved, documents };
}


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

    const { reading, tracking, store, attention, cleaning, exportSheet, clearRegister, reportDelay, shift, shiftLocked, toggleShift } = session;

    // managers = «los botones de los gerentes del local» (managers.js). Se arman una vez por local: un
    // array nuevo en cada pintado repintaría la tabla entera.
    const managers = useMemo(() => managerButtons(establishment), [establishment]);

    // view = «qué enseña el register»: 'mesas' (la tabla) o 'registros' (las rotaciones guardadas)
    const [view, setView] = useState('mesas');


    /*  LAS ROTACIONES GUARDADAS DE HOY, para la pestaña «Registros»
     *
     *  Se piden aquí, en la raíz del registro, y bajan por props a RegisterSaved: no hace falta Redux,
     *  porque solo las usa esa pestaña. Se piden al cargar, al cambiar de local y cada vez que se abre
     *  la pestaña, para que salgan las que se acaban de guardar con el disquete. «Hoy» es el día
     *  operativo (operationalDay), el mismo con que las guarda la API.
     */

    // saved = «lo que se trajo»: status 'loading' | 'ready' | 'error', el día, las rotaciones y el error
    const [saved, setSaved] = useState({ status: 'loading', day: '', documents: [], message: '' });

    // requestRef = «la última petición»: si se cambia de local con una en camino, la vieja no pisa a la nueva
    const requestRef = useRef(0);

    const establishmentName = establishment?.name;

    // loadSaved = «traer las rotaciones guardadas de hoy de este local»
    const loadSaved = useCallback(() => {
        if (!establishmentName) return;

        const request = ++requestRef.current;
        const day = operationalDay();
        setSaved(current => ({ ...current, status: 'loading', day }));

        getRotationsByEstablishment(establishmentName, day)
            .then(data => { if (request === requestRef.current) setSaved({ status: 'ready', day, documents: data.documents ?? [], message: '' }); })
            .catch(error => { if (request === requestRef.current) setSaved({ status: 'error', day, documents: [], message: error.message }); });
    }, [establishmentName]);

    //  Al cargar, al cambiar de local y al cambiar de pestaña
    useEffect(() => { loadSaved(); }, [loadSaved, view]);

    //  A LAS 08:00 EMPIEZA OTRO DÍA OPERATIVO. Con la pestaña abierta de un turno a otro, la lista se quedaba
    //  en el de ayer, y las mesas nuevas que llegan en vivo no entraban (putSaved descarta las de otro día).
    //  Cada minuto se mira si el día cambió y, si cambió, se traen las del nuevo. Un minuto y no un
    //  temporizador a las 08:00 en punto: así también se pone al día un equipo que se despierta de la suspensión.
    useEffect(() => {
        if (!saved.day) return undefined;

        const timer = setInterval(() => { if (operationalDay() !== saved.day) loadSaved(); }, DAY_CHECK_MS);
        return () => clearInterval(timer);
    }, [saved.day, loadSaved]);


    /*  EN VIVO: lo que se guarda o se corrige desde cualquier equipo
     *
     *  La API avisa por socket cada rotación que se guarda (POST) o se corrige (PUT), con un evento por
     *  local (liveEvent; en la API, rotation.socket.js). Aquí se escuchan los dos del local que se está
     *  viendo, y cada rotación que llega se pone en la tabla (putSaved) sin volver a pedir nada: así se ve
     *  al momento lo que guarda o corrige otro empleado, y lo propio. El payload ya trae la misma forma que
     *  el GET, con quién la guardó y quién la corrigió.
     */
    useEffect(() => {
        if (!establishmentName) return;

        const listeners = LIVE_METHODS.map(method => ({
            event: liveEvent(method, establishmentName),
            listener: (rotation) => setSaved(current => putSaved(current, rotation, method)),
        }));

        listeners.forEach(({ event, listener }) => socketAppManager.on(event, listener));
        return () => listeners.forEach(({ event, listener }) => socketAppManager.off(event, listener));
    }, [establishmentName]);


    /*  CORREGIR UNA ROTACIÓN GUARDADA
     *
     *  editSaved(data, id) = «cambiar un dato de lo guardado». 'data' es lo que cambia, con su nombre y su
     *  valor nuevo ({ tableNumber: '33' }, { hourTouch: '10:41:30' }); 'id', el ObjectId de lo que cambia:
     *  la rotación, uno de sus procesos o uno de sus toques, que en la API tienen _id cada uno.
     *
     *  Cambia primero en pantalla, para que se vea al momento, y luego lo guarda (updateRotation). La API
     *  responde con la rotación ya corregida, y esa reemplaza a la de pantalla. Si falla, se dice por qué
     *  ('editNotice') y se vuelven a traer las guardadas, para no enseñar un cambio que no se guardó.
     */

    // editNotice = «por qué no se guardó la última corrección» ('' si se guardó)
    const [editNotice, setEditNotice] = useState('');

    const editSaved = useCallback((data, id) => {
        if (!id) return;

        // change = «el mismo objeto con el cambio, si es el señalado»
        const change = (item) => (item._id === id ? { ...item, ...data } : item);

        setEditNotice('');
        setSaved(current => ({
            ...current,
            documents: current.documents.map(rotation => ({
                ...change(rotation),
                process: (rotation.process ?? []).map(change),
                touch: (rotation.touch ?? []).map(change),
            })),
        }));

        updateRotation(data, id)
            .then(updated => setSaved(current => ({
                ...current,
                documents: current.documents.map(rotation => (rotation._id === updated._id ? updated : rotation)),
            })))
            .catch(error => {
                setEditNotice(error.message);
                loadSaved();
            });
    }, [loadSaved]);


    /*  AÑADIR Y QUITAR TOQUES DE UNA ROTACIÓN GUARDADA
     *
     *  addSavedTouch(rotationId, manager) = «apuntar un toque de ese gerente», con la hora del clic, como el
     *  botón del gerente en la pestaña Mesas. La hora se corrige después con doble clic (editSaved). Se espera
     *  a la API antes de pintarlo: el toque necesita el _id que ella le da para poder corregirlo o quitarlo.
     *
     *  deleteSavedTouch(touchId) = «quitar un toque». Se quita primero de pantalla y luego en la API.
     *
     *  Las dos ponen en la tabla la rotación que responde la API (putSaved). Si fallan, se dice por qué
     *  ('editNotice') y se vuelven a traer las guardadas, como al corregir.
     */
    const addSavedTouch = useCallback((rotationId, manager) => {
        if (!rotationId) return;

        setEditNotice('');
        addRotationTouch(rotationId, { ref: manager.ref, name: manager.name, hourTouch: getCurrentTime(), createdAt: new Date().toISOString() })
            .then(updated => setSaved(current => putSaved(current, updated, 'put')))
            .catch(error => {
                setEditNotice(error.message);
                loadSaved();
            });
    }, [loadSaved]);

    const deleteSavedTouch = useCallback((touchId) => {
        if (!touchId) return;

        setEditNotice('');
        setSaved(current => ({
            ...current,
            documents: current.documents.map(rotation => ({ ...rotation, touch: (rotation.touch ?? []).filter(touch => touch._id !== touchId) })),
        }));

        deleteRotationTouch(touchId)
            .then(updated => setSaved(current => putSaved(current, updated, 'put')))
            .catch(error => {
                setEditNotice(error.message);
                loadSaved();
            });
    }, [loadSaved]);

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

                <ExportButton onExport={exportSheet} />

                <ClearButton onClear={clearRegister} />
            </RegisterBar>

            {/*  «Registros»: las rotaciones guardadas de hoy, que aquí se pueden corregir  */}
            {
                view === 'registros' && (
                    <RegisterSaved
                        saved={saved}
                        establishmentName={establishmentName}
                        attentionLimit={attention}
                        cleaningLimit={cleaning}
                        onRetry={loadSaved}
                        onEdit={editSaved}
                        onAddTouch={addSavedTouch}
                        onDeleteTouch={deleteSavedTouch}
                        editNotice={editNotice}
                        managers={managers}
                    />
                )
            }

            {/*  LA TABLA SOLO SE REPINTA CUANDO CAMBIA ALGUNA DE SUS PROPS ('memo'). Por eso aquí no se
                 le pasa ninguna función escrita en línea ni ningún objeto armado en el sitio: serían
                 nuevos en cada pintado y la repintarían siempre.

                 Los seis últimos datos son para cuando está VACÍA: con ellos dice por qué, en vez de
                 enseñar filas en blanco que lo mismo son «todo bien» que «no leo».  */}
            {
                view === 'mesas' && (
                    <RegisterTable
                        records={store.records}
                        liveOrders={tracking.orders}
                        attentionLimit={attention}
                        cleaningLimit={cleaning}
                        writeRecord={store.writeRecord}
                        writeProcess={store.writeProcess}
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
                    />
                )
            }
        </>
    );
}
