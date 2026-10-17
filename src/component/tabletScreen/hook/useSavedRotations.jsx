import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ReactReduxContext } from 'react-redux';
import { getRotationsByEstablishment, saveRotation, updateRotation, addRotationTouch, deleteRotationTouch } from '../../../libs/fetch_data/rotationFetching.js';
import { operationalDay } from '../../../libs/date_time/operationalDay.js';
import { recoveredRotation } from '../../../libs/tickets/recoveredRotation.js';
import { exportCustomerServiceWorkbook } from '../../../libs/export/customerServiceWorkbook.js';
import { findSavedTicket } from '../../../libs/tickets/savedTickets.js';
import { socketAppManager } from '../../../store/slices/socketio.js';
import { showBoxModal } from '../../../store/slices/boxModal.js';
import { getCurrentTime } from '../../cells/GridCells.jsx';


/*  LAS ROTACIONES YA GUARDADAS DEL DÍA, Y LA PREGUNTA POR LOS TICKETS REPETIDOS
 *
 *  Lo que enseña la pestaña «Registros» —las rotaciones guardadas en la API del día operativo— y, con esa
 *  misma lista, la pregunta que se hace cuando la IA lee un ticket que ya se guardó.
 *
 *  VIVE EN LA SESIÓN (useTabletSession), Y NO EN UNA PESTAÑA, A PROPÓSITO. La IA lee mientras haya tablet,
 *  se vea lo que se vea: la pestaña Mesas, la pestaña Registros u otra pantalla de Home. Cuando la lista y la
 *  pregunta vivían en el componente Registers, desaparecían en cuanto el centro de Home enseñaba otra cosa
 *  (la configuración de la IA, un formulario…), y los tickets repetidos entraban sin preguntar. La sesión
 *  está montada mientras haya tablet; esto, con ella.
 *
 *      1. LA LISTA       se pide al montar, al cambiar de local y cuando lo pide la pestaña al abrirse
 *                        (loadSaved); a las 08:00 se cambia sola al día nuevo; y se pone al día en vivo con
 *                        los avisos del socket de la API y con lo que se guarda aquí con el disquete
 *                        (rememberSaved, sin esperar al socket).
 *      2. CORREGIRLA     editSaved, addSavedTouch, deleteSavedTouch: primero en pantalla, luego en la API.
 *                        Lo que se AÑADE aquí —una rotación entera (addRecovered) o un toque— se anotó
 *                        después de que pasara, y va a la API con recovered: true.
 *      3. EXPORTARLA     exportSaved: el Excel de atención al cliente (libs/export).
 *      4. LA PREGUNTA    acceptNewOrder, que se le da al registro (store.setOrderGuard) y que este llama
 *                        con cada pedido NUEVO de la IA: si su ticket ya está en la lista (findSavedTicket,
 *                        que busca en todas las rotaciones y en todos sus procesos), pregunta.
 *
 *  LA PREGUNTA, paso a paso. Se hace con el BoxModal (store/slices/boxModal.js), y su respuesta llega
 *  DESPUÉS, por callback:
 *
 *      · llega el ticket ya guardado → se abre el aviso y, mientras no se contesta, el ticket queda fuera
 *      · Aceptar → se apunta «sí» y se vuelven a pasar los pedidos (store.reapplyOrders): entra ya en su mesa
 *      · Cancelar (o Escape) → se apunta «no» y no entra
 *
 *  La respuesta se recuerda POR TICKET (la IA lee cada medio segundo: sin eso preguntaría en cada lectura),
 *  y mientras la pregunta está abierta no se abre otra para el mismo ticket. Se olvida al cambiar de local o
 *  de día operativo. La ventana flotante no monta Redux y allí no hay BoxModal: pregunta window.confirm.
 *
 *  Recibe: { establishmentName   el local: de cuál se piden las rotaciones
 *            attention, cleaning sus dos límites, para el Excel
 *            store }             el registro (useRegisterStore): setOrderGuard y reapplyOrders
 *  Devuelve: { saved, loadSaved, rememberSaved, editNotice, editSaved, addSavedTouch, deleteSavedTouch,
 *              addRecovered, exportSaved, findTicket }
 */


// LIVE_METHODS = «lo que avisa la API en vivo»: una rotación guardada ('post') o corregida ('put')
const LIVE_METHODS = ['post', 'put'];

// DAY_CHECK_MS = «cada cuánto se mira si empezó otro día operativo», en milisegundos
const DAY_CHECK_MS = 60000;

// EMPTY_SAVED = «la lista antes de pedirla»
const EMPTY_SAVED = { status: 'loading', day: '', documents: [], message: '' };

// liveEvent = «el evento de un local»: '<nombre del local>-post' o '<nombre del local>-put' ('Francisca Doral-post').
// Tiene que ser el mismo nombre que arma la API (rotationEvent, en rotation.lib.js).
const liveEvent = (method, establishmentName) => `${establishmentName}-${method}`;

// dayOf = «el día operativo de una rotación guardada», 'AAAA-MM-DD': la API lo guarda como la medianoche UTC de ese día
const dayOf = (rotation) => String(rotation?.operationalDate ?? '').slice(0, 10);

// byStart = «por la hora en que empezó», como las ordena el GET
const byStart = (one, other) => new Date(one.date) - new Date(other.date);

// clock = «una fecha como hora HH:MM de este equipo»
const clock = (date) => new Date(date).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });


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

    return { ...saved, documents: [...saved.documents, rotation].sort(byStart) };
}


// keepSaved = «meter en la lista la rotación que se acaba de guardar AQUÍ, con el disquete»
// Lo que devuelve la API al guardarla entra en el acto, sin esperar a su aviso por el socket: la fila de
// Mesas se limpia al momento, y si la IA lee el mismo ticket antes de que llegue el aviso —o el aviso no
// llega—, la búsqueda de tickets guardados tiene que encontrarlo ya. Por eso no espera a que la lista esté
// 'ready'. La API la devuelve sin poblar quién la guardó: sin él, «Creador» sale '-' hasta que llega el
// aviso del socket o se vuelve a pedir la lista, que la traen completa.
function keepSaved(saved, rotation) {
    if (!rotation?._id || saved.documents.some(item => item._id === rotation._id)) return saved;
    if (saved.day && dayOf(rotation) !== saved.day) return saved;

    const kept = typeof rotation.createdBy === 'object' ? rotation : { ...rotation, createdBy: null };
    return { ...saved, documents: [...saved.documents, kept].sort(byStart) };
}



function useSavedRotations({ establishmentName, attention, cleaning, store }) {

    // reduxStore = «el store de Redux de esta ventana», o null en la flotante (que no lo monta). De él salen
    // quién exporta (el usuario, para el nombre del Excel) y el BoxModal de la pregunta.
    const reduxStore = useContext(ReactReduxContext)?.store ?? null;


    //  ── 1 · LA LISTA ──────────────────────────────────────────────────────────────────

    // saved = «lo que se trajo»: status 'loading' | 'ready' | 'error', el día, las rotaciones y el error
    const [saved, setSaved] = useState(EMPTY_SAVED);

    // savedRef = «la lista, siempre la última»: la pregunta la lee en el momento, sin esperar a un pintado
    const savedRef = useRef(saved);
    savedRef.current = saved;

    // requestRef = «la última petición»: si se cambia de local con una en camino, la vieja no pisa a la nueva
    const requestRef = useRef(0);

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

    //  Al montar y al cambiar de local. La pestaña Registros la vuelve a pedir cada vez que se abre.
    useEffect(() => { loadSaved(); }, [loadSaved]);

    // rememberSaved = «la API acaba de guardar esta rotación con el disquete»: entra ya en la lista (keepSaved).
    // La llama la fila de Mesas, antes de limpiarse.
    const rememberSaved = useCallback((rotation) => setSaved(current => keepSaved(current, rotation)), []);

    //  A LAS 08:00 EMPIEZA OTRO DÍA OPERATIVO. Cada minuto se mira si el día cambió y, si cambió, se traen
    //  las del nuevo. Un minuto y no un temporizador a las 08:00 en punto: así también se pone al día un
    //  equipo que se despierta de la suspensión.
    useEffect(() => {
        if (!saved.day) return undefined;

        const timer = setInterval(() => { if (operationalDay() !== saved.day) loadSaved(); }, DAY_CHECK_MS);
        return () => clearInterval(timer);
    }, [saved.day, loadSaved]);

    //  EN VIVO: la API avisa por socket cada rotación que se guarda (POST) o se corrige (PUT), con un evento
    //  por local (liveEvent; en la API, rotation.socket.js). Cada una entra en la lista (putSaved) sin volver
    //  a pedir nada: así se ve al momento lo que guarda o corrige otro empleado, y lo propio.
    useEffect(() => {
        if (!establishmentName) return undefined;

        const listeners = LIVE_METHODS.map(method => ({
            event: liveEvent(method, establishmentName),
            listener: (rotation) => setSaved(current => putSaved(current, rotation, method)),
        }));

        listeners.forEach(({ event, listener }) => socketAppManager.on(event, listener));
        return () => listeners.forEach(({ event, listener }) => socketAppManager.off(event, listener));
    }, [establishmentName]);


    //  ── 2 · CORREGIRLA ────────────────────────────────────────────────────────────────
    //
    //  Primero en pantalla, para que se vea al momento, y luego en la API, que responde con la rotación ya
    //  corregida (y esa reemplaza a la de pantalla). Si falla, se dice por qué ('editNotice') y se vuelven a
    //  traer las guardadas, para no enseñar un cambio que no se guardó.

    // editNotice = «por qué no se guardó la última corrección» ('' si se guardó)
    const [editNotice, setEditNotice] = useState('');

    // failed = «la API no lo guardó»: se dice por qué y se vuelve a traer la lista
    const failed = useCallback((error) => {
        setEditNotice(error.message);
        loadSaved();
    }, [loadSaved]);

    // editSaved = «cambiar un dato de lo guardado». 'data' es lo que cambia ({ tableNumber: '33' }, { hourTouch:
    // '10:41:30' }); 'id', el _id de lo que cambia: la rotación, uno de sus procesos o uno de sus toques.
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
            .catch(failed);
    }, [failed]);

    // addSavedTouch = «apuntar un toque de ese gerente», con la hora del clic. Se espera a la API antes de
    // pintarlo: el toque necesita el _id que ella le da para poder corregirlo o quitarlo. Apuntado aquí, en
    // Registros, es un toque recuperado: recovered: true.
    const addSavedTouch = useCallback((rotationId, manager) => {
        if (!rotationId) return;

        setEditNotice('');
        addRotationTouch(rotationId, { ref: manager.ref, name: manager.name, hourTouch: getCurrentTime(), createdAt: new Date().toISOString(), recovered: true })
            .then(updated => setSaved(current => putSaved(current, updated, 'put')))
            .catch(failed);
    }, [failed]);

    // deleteSavedTouch = «quitar un toque»: primero de pantalla y luego en la API
    const deleteSavedTouch = useCallback((touchId) => {
        if (!touchId) return;

        setEditNotice('');
        setSaved(current => ({
            ...current,
            documents: current.documents.map(rotation => ({ ...rotation, touch: (rotation.touch ?? []).filter(touch => touch._id !== touchId) })),
        }));

        deleteRotationTouch(touchId)
            .then(updated => setSaved(current => putSaved(current, updated, 'put')))
            .catch(failed);
    }, [failed]);


    // addRecovered = «guardar una rotación anotada a mano en Registros» (recoveredRotation: recovered true, en el
    // día operativo que se enseña). Entra en la lista en cuanto la API la guarda (keepSaved), sin esperar al
    // socket. Devuelve la promesa: el formulario la espera para cerrarse, o para decir por qué no se guardó.
    // Recibe: los datos del formulario ({ tableNumber, times, shift }) y el _id del local.
    const addRecovered = useCallback((fields, establishmentId) => {
        if (!establishmentId) return Promise.reject(new Error('Elige primero el local'));

        const body = recoveredRotation({ ...fields, day: savedRef.current.day || operationalDay() });
        return saveRotation({ ...body, establishment: establishmentId })
            .then(rotation => {
                setSaved(current => keepSaved(current, rotation));
                return rotation;
            });
    }, []);


    //  ── 3 · EXPORTARLA ────────────────────────────────────────────────────────────────

    // exportSaved = «el Excel de lo que enseña la pestaña Registros». Devuelve la promesa: el botón la espera, y
    // con ella dónde acabó el archivo (en el NAS, donde se eligió…: deliverWorkbook).
    // Recibe: { managers     los botones de gerentes del local (los tiene la pestaña): de ahí las placas G1, A2…
    //           shift        qué turno: 'all' (el día entero), 'day' o 'night'. Lo elige el menú de Exportar.
    //           folderShift  con 'all', en la carpeta de qué turno del NAS va: el de la barra
    //           download }   descargarlo en el equipo en vez de guardarlo en el NAS (el botón «Descargar Excel»)
    // Quien exporta es el usuario de la sesión (Redux), y va en el nombre del archivo. En la flotante, sin Redux, no va.
    const exportSaved = useCallback(({ managers, shift = 'all', folderShift, download = false } = {}) => {
        const user = reduxStore?.getState().user;
        return exportCustomerServiceWorkbook({
            rotations: saved.documents,
            day: saved.day,
            establishmentName,
            attentionLimit: attention,
            cleaningLimit: cleaning,
            managers,
            shift,
            folderShift,
            download,
            exporter: [user?.name, user?.surName].filter(Boolean).join(' '),
        });
    }, [saved.documents, saved.day, establishmentName, attention, cleaning, reduxStore]);


    //  ── 4 · LA PREGUNTA POR LOS TICKETS YA GUARDADOS ──────────────────────────────────

    // findTicket = «dónde está guardado ese ticket hoy»: { rotation, process }, o null. Busca en TODAS las
    // rotaciones de la lista y en todos sus procesos (libs/tickets/savedTickets.js), siempre en la última.
    const findTicket = useCallback((ticketNumber) => findSavedTicket(savedRef.current.documents, ticketNumber), []);

    // answersRef = «lo que ya se contestó por cada ticket»: número → true (registrarlo) / false (no)
    // askingRef = «los tickets con la pregunta abierta, todavía sin contestar»
    const answersRef = useRef(new Map());
    const askingRef = useRef(new Set());
    useEffect(() => {
        answersRef.current.clear();
        askingRef.current.clear();
    }, [establishmentName, saved.day]);

    const { setOrderGuard, reapplyOrders } = store;

    // answerTicket = «contestar por un ticket»: se apunta y, si se aceptó, el ticket entra ya
    const answerTicket = useCallback((ticket, accepted) => {
        askingRef.current.delete(ticket);
        answersRef.current.set(ticket, accepted);
        if (accepted) reapplyOrders();
    }, [reapplyOrders]);

    // acceptNewOrder = «¿entra este pedido nuevo de la IA?»: true, entra; false, se queda fuera
    const acceptNewOrder = useCallback((order) => {
        const ticket = String(order.ticket ?? '').trim();

        // found = «dónde está guardado», o null si no está: entonces entra sin preguntar
        const found = findTicket(ticket);
        if (!found) return true;
        if (answersRef.current.has(ticket)) return answersRef.current.get(ticket);
        if (askingRef.current.has(ticket)) return false;

        // place = «dónde lo vio la IA»: la mesa, si es una de verdad (no el '#ticket' de un pedido para llevar)
        const table = String(order.mesa ?? '').trim();
        const place = table && !table.startsWith('#') ? ` · Mesa ${table}` : '';

        // savedAt = «dónde y cuándo se guardó»: la mesa de la rotación guardada y la hora del disquete
        const savedAt = `Guardado en la mesa ${found.rotation.tableNumber}${found.rotation.createdAt ? ` a las ${clock(found.rotation.createdAt)}` : ''}`;

        const message = `¿Desea registrar un ticket que ya fue registrado y guardado?\n\nTicket ${ticket}${place}\n${savedAt}`;

        //  En la flotante, sin Redux: window.confirm, que contesta en el acto
        if (!reduxStore) {
            const accepted = window.confirm(message);
            answersRef.current.set(ticket, accepted);
            return accepted;
        }

        askingRef.current.add(ticket);
        reduxStore.dispatch(showBoxModal({
            tone: 'warning',
            title: 'Ticket ya registrado',
            message,
            onAccept: () => answerTicket(ticket, true),
            onCancel: () => answerTicket(ticket, false),
        }));

        //  Fuera hasta que se conteste: si se acepta, answerTicket lo mete
        return false;
    }, [findTicket, reduxStore, answerTicket]);

    //  Se le da al registro con la sesión, y se le quita cuando la sesión se va
    useEffect(() => {
        setOrderGuard(acceptNewOrder);
        return () => setOrderGuard(null);
    }, [setOrderGuard, acceptNewOrder]);


    return { saved, loadSaved, rememberSaved, editNotice, editSaved, addSavedTouch, deleteSavedTouch, addRecovered, exportSaved, findTicket };
}



export { useSavedRotations };
