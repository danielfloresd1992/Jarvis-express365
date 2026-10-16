import { createSlice } from '@reduxjs/toolkit';


/*  EL BOX MODAL: LA VENTANA DE AVISO DE TODA LA APLICACIÓN
 *
 *  Se monta UNA vez, en la raíz (App.tsx → component/BoxModal), y se abre desde cualquier sitio como si
 *  fuera una API:
 *
 *      dispatch(showBoxModal({ tone: 'success', title: 'Guardado', message: 'La rotación se guardó' }))
 *
 *      dispatch(showBoxModal({
 *          tone: 'warning',
 *          title: 'Ticket repetido',
 *          message: '¿Desea registrar un ticket que ya fue registrado y guardado?',
 *          onAccept: () => registrar(),       ← con callback: «Cancelar» y «Aceptar»
 *      }))
 *
 *  Y se lee como cualquier otro estado: useSelector(selectBoxModal) da el aviso que está a la vista, o
 *  null. Desde un componente es más corto con el hook useBoxModal (src/hook/useBoxModal.jsx).
 *
 *  LOS DOS TIPOS salen solos de las opciones:
 *
 *      'info'      sin onAccept: un solo botón, «Aceptar», que solo cierra
 *      'confirm'   con onAccept: «Cancelar» y «Aceptar»; Aceptar ejecuta el callback
 *
 *  Y el tono (tone) es el tipo de alerta: 'success', 'warning' o 'error'. Cambia el color y el icono.
 *
 *  Si se pide un aviso con otro abierto, espera su turno (queue): no se pisan.
 *
 *  LOS CALLBACKS NO VAN EN REDUX. El estado solo guarda datos que se pueden escribir como texto —el store
 *  avisa si se le mete una función—, así que onAccept y onCancel se guardan aparte, en 'callbacks', por el
 *  id del aviso, y answerBoxModal los busca ahí al contestar.
 *
 *  OJO: la ventana flotante de la tablet no monta Redux (ver main.jsx), así que allí no hay BoxModal.
 */


// BOX_MODAL_TONES = «los tipos de alerta»
export const BOX_MODAL_TONES = ['success', 'warning', 'error'];

// DEFAULT_TONE = «el tipo de alerta si no se dice ninguno»
const DEFAULT_TONE = 'warning';

// callbacks = «lo que hacen Aceptar y Cancelar de cada aviso», por su id: { onAccept, onCancel }
const callbacks = new Map();

// lastId = «el id del último aviso». Cada aviso lleva el suyo, para contestarle a él y no a otro.
let lastId = 0;


const boxModal = createSlice({
    name: 'boxModal',

    // queue = «los avisos pedidos, en orden»: el primero es el que se ve
    initialState: { queue: [] },

    reducers: {
        pushBoxModal: (state, action) => {
            state.queue.push(action.payload);
        },
        removeBoxModal: (state, action) => {
            state.queue = state.queue.filter(modal => modal.id !== action.payload);
        },
    },
});

const { pushBoxModal, removeBoxModal } = boxModal.actions;


/*  showBoxModal = «abrir un aviso». Se usa con dispatch: dispatch(showBoxModal({ … }))
 *
 *  @param {string}   title        el título (opcional)
 *  @param {string}   message      el mensaje. Los saltos de línea ('\n') se respetan.
 *  @param {string}   tone         el tipo de alerta: 'success' | 'warning' | 'error' (por defecto, 'warning')
 *  @param {function} onAccept     opcional. Con él, el aviso pregunta (Cancelar / Aceptar) y Aceptar lo ejecuta
 *  @param {function} onCancel     opcional. Se ejecuta al cancelar (botón Cancelar o la tecla Escape)
 *  @param {string}   acceptLabel  el texto de Aceptar (por defecto, 'Aceptar')
 *  @param {string}   cancelLabel  el texto de Cancelar (por defecto, 'Cancelar')
 *  @returns el id del aviso
 */
export const showBoxModal = ({ title = '', message = '', tone = DEFAULT_TONE, onAccept, onCancel, acceptLabel = 'Aceptar', cancelLabel = 'Cancelar' } = {}) => (dispatch) => {
    lastId += 1;
    const id = lastId;

    if (onAccept || onCancel) callbacks.set(id, { onAccept, onCancel });

    dispatch(pushBoxModal({
        id,
        kind: typeof onAccept === 'function' ? 'confirm' : 'info',
        tone: BOX_MODAL_TONES.includes(tone) ? tone : DEFAULT_TONE,
        title: String(title),
        message: String(message),
        acceptLabel,
        cancelLabel,
    }));

    return id;
};


/*  answerBoxModal = «contestar un aviso»: lo cierra y, después, ejecuta su callback
 *
 *  Primero se cierra y luego se llama: así un callback que abre otro aviso lo ve aparecer en su turno, y
 *  no detrás del que ya se estaba cerrando. Un callback que falla no deja el aviso abierto.
 *
 *  @param {number}  id        el del aviso
 *  @param {boolean} accepted  true = Aceptar (onAccept); false = Cancelar o Escape (onCancel)
 */
export const answerBoxModal = (id, accepted) => (dispatch) => {
    const handlers = callbacks.get(id);
    callbacks.delete(id);

    dispatch(removeBoxModal(id));

    const handler = accepted ? handlers?.onAccept : handlers?.onCancel;
    if (typeof handler !== 'function') return;

    try {
        handler();
    }
    catch (error) {
        console.log(error);
    }
};


// selectBoxModal = «el aviso que está a la vista», o null si no hay ninguno. Para useSelector.
export const selectBoxModal = (state) => state.boxModal.queue[0] ?? null;


export default boxModal.reducer;
