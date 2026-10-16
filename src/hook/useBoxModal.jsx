import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showBoxModal, selectBoxModal } from '../store/slices/boxModal.js';


/*  useBoxModal = «el aviso de la aplicación, desde un componente»
 *
 *      const { showModal } = useBoxModal();
 *
 *      showModal({ tone: 'error', title: 'No se guardó', message: error.message });   ← solo «Aceptar»
 *      showModal({ tone: 'warning', message: '¿Seguro?', onAccept: () => borrar() });  ← «Cancelar» y «Aceptar»
 *
 *  Es un atajo de dispatch(showBoxModal(…)): las opciones están explicadas en store/slices/boxModal.js.
 *  Fuera de un componente (en libs/, por ejemplo) se usa directamente: store.dispatch(showBoxModal(…)).
 *
 *  Devuelve:
 *      showModal(opciones)   abre un aviso; devuelve su id
 *      modal                 el aviso que está a la vista ({ id, kind, tone, title, message… }), o null
 */
export function useBoxModal() {
    const dispatch = useDispatch();
    const modal = useSelector(selectBoxModal);

    const showModal = useCallback((options) => dispatch(showBoxModal(options)), [dispatch]);

    return { showModal, modal };
}
