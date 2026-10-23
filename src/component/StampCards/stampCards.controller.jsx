import './style.css';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useMyNovelties from './hook/useMyNovelties.jsx';
import useBonusCatalog from './hook/useBonusCatalog.jsx';
import useStampNews from './hook/useStampNews.jsx';
import useStampPanel from './hook/useStampPanel.jsx';
import StampStrip from './assets/StampStrip.jsx';
import StampPanel from './assets/StampPanel.jsx';
import FullCardToast from './assets/FullCardToast.jsx';
import { buildStampCards } from '../../libs/bonus/stampCards.js';


/*  LAS TARJETAS DE SELLOS, EN LA BARRA DE ABAJO (pedido del usuario: propuesta «B · Tarjetas de sellos»)
 *
 *  Las novedades que el operador reportó en el día operativo, con su validación, como tarjetas de sellos: una por
 *  alerta, con tantas casillas como pide su regla de bono. Cada aprobada pone un sello; tarjeta llena = su bono. Es para
 *  que reportar se note: cada aprobación se ve caer, y se ve cuánto falta para el siguiente bono.
 *
 *      useMyNovelties     las novedades del día, al día por el socket
 *      useBonusCatalog    las alertas y las reglas, para adelantar dónde va el sello de las que esperan
 *      buildStampCards    las novedades → las tarjetas (libs/bonus/stampCards.js, pura)
 *      useStampNews       la aprobada que acaba de llegar (su sello y el confeti) y la tarjeta que se acaba de llenar
 *      useStampPanel      el panel, abierto o cerrado
 *
 *  Va dentro de la barra del chat (Chat.jsx), a la izquierda del botón del chat. Sin usuario no pinta nada.
 */
export default function StampCards() {

    const user = useSelector(state => state.user);

    const { status, day, novelties, message } = useMyNovelties(user?._id);
    const { menus, rulesById } = useBonusCatalog(novelties);

    // result = «las tarjetas de hoy»
    const result = useMemo(() => buildStampCards({ novelties, menus, rulesById, user }), [novelties, menus, rulesById, user]);

    const { freshIds, freshRejectedIds, celebration, dismissCelebration, burst } = useStampNews({
        novelties,
        cards: result.cards,
        ready: status === 'ready',
        scope: `${user?._id ?? ''}:${day}`,
    });

    const panel = useStampPanel();

    if (!user?._id) return null;

    return (
        <div ref={panel.wrapperRef} className='stamp-cards'>
            {panel.open && <StampPanel result={result} status={status} message={message} day={day} freshIds={freshIds} freshRejectedIds={freshRejectedIds} />}
            {celebration && <FullCardToast celebration={celebration} onClose={dismissCelebration} />}
            <StampStrip
                result={result}
                status={status}
                message={message}
                open={panel.open}
                onToggle={panel.toggle}
                buttonRef={panel.buttonRef}
                freshIds={freshIds}
                freshRejectedIds={freshRejectedIds}
                burst={burst}
            />
        </div>
    );
}
