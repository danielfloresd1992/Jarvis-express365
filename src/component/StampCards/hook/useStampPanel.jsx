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

    //  El pedido del aviso de «Entregada con éxito»
    useEffect(() => {
        const openOnRequest = () => setOpen(true);
        window.addEventListener(STAMP_CARDS_OPEN_EVENT, openOnRequest);
        return () => window.removeEventListener(STAMP_CARDS_OPEN_EVENT, openOnRequest);
    }, []);

    useEffect(() => {
        if (!open) return undefined;

        // openedAt = «cuándo se abrió», en el mismo reloj que 'event.timeStamp'.
        //
        // EL CLIC QUE LO ABRIÓ DESDE FUERA NO LO CIERRA. «Ver mis tarjetas» está fuera de la barra, y su clic sigue
        // subiendo hacia 'document' después de pedir el panel. Con un clic de verdad, el navegador deja pintar a React
        // entre un oyente y el siguiente: este efecto pone su oyente de «clic fuera» ANTES de que ese mismo clic llegue
        // a 'document', y lo cerraba en el acto (el panel se abría y se cerraba sin llegar a verse). Un clic que
        // empezó antes de abrirse no es un clic fuera.
        const openedAt = performance.now();

        const closeOnEscape = (event) => {
            if (event.key !== 'Escape') return;
            setOpen(false);
            buttonRef.current?.focus();
        };
        const closeOnClickOutside = (event) => {
            if (event.timeStamp <= openedAt) return;
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
