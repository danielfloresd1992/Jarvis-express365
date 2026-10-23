import { useCallback, useEffect, useRef, useState } from 'react';
import { STAMP_CARDS_OPEN_EVENT } from '../../SentNovelty/hook/useSentModal.jsx';


/*  EL PANEL DE LAS TARJETAS: ABIERTO O CERRADO
 *
 *  Se abre y se cierra con el botón «Tarjetas» de la barra. Abierto, se cierra también con Escape (y el cursor vuelve al
 *  botón) o con un clic fuera, como el menú de Exportar (ExportExcelButton). También lo abre el aviso de «Entregada con
 *  éxito» con su botón «Ver mis tarjetas» (STAMP_CARDS_OPEN_EVENT, por window: no comparten estado).
 *
 *  @returns {{ open, toggle, close, wrapperRef, buttonRef }}  wrapperRef va en lo que cuenta como «dentro» (la barra y
 *           el panel); buttonRef, en el botón
 */
export default function useStampPanel() {

    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);
    const buttonRef = useRef(null);

    const toggle = useCallback(() => setOpen(current => !current), []);
    const close = useCallback(() => setOpen(false), []);

    //  El pedido del aviso de «Entregada con éxito». El clic que lo pidió ya pasó: no cuenta como «clic fuera».
    useEffect(() => {
        const openOnRequest = () => setOpen(true);
        window.addEventListener(STAMP_CARDS_OPEN_EVENT, openOnRequest);
        return () => window.removeEventListener(STAMP_CARDS_OPEN_EVENT, openOnRequest);
    }, []);

    useEffect(() => {
        if (!open) return undefined;

        const closeOnEscape = (event) => {
            if (event.key !== 'Escape') return;
            setOpen(false);
            buttonRef.current?.focus();
        };
        const closeOnClickOutside = (event) => {
            if (!wrapperRef.current?.contains(event.target)) setOpen(false);
        };

        document.addEventListener('keydown', closeOnEscape);
        document.addEventListener('click', closeOnClickOutside);
        return () => {
            document.removeEventListener('keydown', closeOnEscape);
            document.removeEventListener('click', closeOnClickOutside);
        };
    }, [open]);

    return { open, toggle, close, wrapperRef, buttonRef };
}
