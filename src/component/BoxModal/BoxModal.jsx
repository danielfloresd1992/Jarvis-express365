import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectBoxModal, answerBoxModal } from '../../store/slices/boxModal.js';
import BoxModalIcon from './BoxModalIcon.jsx';
import './style.css';


/*  EL BOX MODAL: la ventana de aviso de toda la aplicación
 *
 *  Se monta UNA sola vez, en la raíz (App.tsx), y pinta el aviso que diga Redux (selectBoxModal): no
 *  recibe props. Para abrir uno se usa la API del slice —dispatch(showBoxModal({ … }))— o el hook
 *  useBoxModal. Todo lo que puede llevar un aviso está explicado en store/slices/boxModal.js.
 *
 *      'info'      un solo botón, «Aceptar», que cierra
 *      'confirm'   «Cancelar» y «Aceptar»; Aceptar ejecuta el callback del aviso
 *
 *  Con el teclado: el foco va a «Aceptar» al abrirse (Intro acepta) y Escape cancela. Pinchar fuera no
 *  cierra: un aviso que pregunta se contesta con sus botones, no por un clic distraído.
 *
 *  CÓMO SE PINTA. La capa (.box-modal__overlay) va con un PORTAL directamente en <body>, no donde está
 *  este componente en el árbol de React. Es lo que garantiza que ocupe la ventana entera: un ancestro con
 *  'transform', 'filter' o 'contain' encoge cualquier 'position: fixed' que lleve dentro, y colgada de
 *  <body> no tiene ancestros que puedan hacerlo. La capa es fija respecto a la VENTANA (style.css): cubre
 *  el viewport entero aunque la página esté desplazada, y el modal va centrado dentro de ella.
 */
export default function BoxModal() {

    const dispatch = useDispatch();

    // modal = «el aviso a la vista», o null
    const modal = useSelector(selectBoxModal);

    // acceptRef = «el botón Aceptar», para darle el foco
    const acceptRef = useRef(null);

    // id = «qué aviso se ve»: los efectos se repiten cuando cambia, aunque el siguiente se parezca
    const id = modal?.id;

    //  Al abrirse un aviso, el foco va a «Aceptar»
    useEffect(() => {
        if (id) acceptRef.current?.focus();
    }, [id]);

    //  Escape = Cancelar (en un aviso que solo informa, cierra)
    useEffect(() => {
        if (!id) return undefined;

        const cancelOnEscape = (event) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            dispatch(answerBoxModal(id, false));
        };

        document.addEventListener('keydown', cancelOnEscape);
        return () => document.removeEventListener('keydown', cancelOnEscape);
    }, [id, dispatch]);

    if (!modal) return null;

    // answer = «contestar»: true = Aceptar, false = Cancelar
    const answer = (accepted) => dispatch(answerBoxModal(modal.id, accepted));

    return createPortal(
        <div className='box-modal__overlay'>
            <div
                className={`box-modal box-modal--${modal.tone}`}
                role='alertdialog'
                aria-modal='true'
                aria-labelledby={modal.title ? 'box-modal-title' : undefined}
                aria-describedby={modal.message ? 'box-modal-message' : undefined}
            >
                <div className='box-modal__content'>
                    <span className='box-modal__icon'>
                        <BoxModalIcon tone={modal.tone} />
                    </span>

                    <div className='box-modal__text'>
                        {modal.title && <h2 id='box-modal-title' className='box-modal__title'>{modal.title}</h2>}
                        {modal.message && <p id='box-modal-message' className='box-modal__message'>{modal.message}</p>}
                    </div>
                </div>

                <div className='box-modal__actions'>
                    {
                        modal.kind === 'confirm' && (
                            <button type='button' className='box-modal__button' onClick={() => answer(false)}>
                                {modal.cancelLabel}
                            </button>
                        )
                    }
                    <button ref={acceptRef} type='button' className='box-modal__button box-modal__button--accept' onClick={() => answer(true)}>
                        {modal.acceptLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
