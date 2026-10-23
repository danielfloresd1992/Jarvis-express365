import { useEffect, useRef } from 'react';


/*  EL AVISO ABIERTO: el foco, Escape y el pedido de abrir las tarjetas
 *
 *  Al abrirse, el foco va al botón principal («Seguir vigilando»: Intro lo cierra). Escape también cierra. Pinchar el
 *  velo no: como el BoxModal de la aplicación, un aviso se cierra con sus botones.
 *
 *  «Ver mis tarjetas» cierra el aviso y le pide a la barra de abajo que abra su panel (STAMP_CARDS_OPEN_EVENT, que
 *  escucha useStampPanel): no comparten estado, se avisan por la ventana.
 *
 *  @param {boolean}  open     hay un aviso a la vista
 *  @param {function} onClose  cerrarlo
 *  @returns {{ primaryRef, openStampCards }}
 */


// STAMP_CARDS_OPEN_EVENT = «el pedido de abrir el panel de tarjetas», por window
export const STAMP_CARDS_OPEN_EVENT = 'stamp-cards:open';


export default function useSentModal({ open, onClose }) {

    const primaryRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        primaryRef.current?.focus();

        const closeOnEscape = (event) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            onClose();
        };
        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [open, onClose]);

    const openStampCards = () => {
        onClose();
        window.dispatchEvent(new CustomEvent(STAMP_CARDS_OPEN_EVENT));
    };

    return { primaryRef, openStampCards };
}
