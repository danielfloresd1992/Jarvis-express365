import './style.css';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import useSentReaction from './hook/useSentReaction.jsx';
import useTodayBonus from './hook/useTodayBonus.jsx';
import useSentModal from './hook/useSentModal.jsx';
import SentModal from './assets/SentModal.jsx';


/*  EL AVISO AL ENVIAR UNA NOVEDAD (pedido del usuario: propuesta «B · La moneda»)
 *
 *  Antes, todos los formularios abrían el mismo «Aviso · Novedad enviada». Ahora abren este, que dice «Entregada
 *  con éxito · a la espera de su validación» y reacciona según la alerta: el color de su categoría, y una moneda que
 *  gira y cae con lo que vale su regla de bono (libs/bonus/sentReaction.js). Es para que enviar se sienta, y se vea
 *  qué hay en juego: la validación se espera con ganas en vez de olvidarse.
 *
 *      useSentReaction   qué moneda y qué decir, con las reglas de bono
 *      useTodayBonus     la pila de hoy y la tarjeta de esta alerta («2 de 4»)
 *      useSentModal      el foco, Escape y «Ver mis tarjetas»
 *
 *  Se monta UNA vez, en Home, junto al BoxModal de siempre, y se abre desde los formularios con
 *  boxModal.sent({ menu, table }) (configBoxModal, en Home.jsx). Con 'sent' en null no pinta nada.
 *
 *  @param {object}   sent     { id, menu, table, at } de la novedad recién enviada, o null
 *  @param {function} onClose  cerrarlo
 */
export default function SentNovelty({ sent, onClose }) {

    const user = useSelector(state => state.user);
    const establishment = useSelector(state => state.establishment);

    const today = useTodayBonus({ userId: user?._id, user, menuId: sent?.menu?._id, openedAt: sent?.id });
    const { reaction } = useSentReaction({ sent, user, establishment, card: today.card, todayCount: today.totals.reported });
    const { primaryRef, openStampCards } = useSentModal({ open: Boolean(sent), onClose });

    if (!sent || !reaction) return null;

    // localMark = «las iniciales del local», para la moneda con excepción: 'Mister Pizza' → 'MP'
    const localMark = String(establishment?.name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0].toUpperCase()).join('');

    return createPortal(
        <SentModal
            key={sent.id}
            reaction={reaction}
            sent={sent}
            localMark={localMark}
            today={today}
            primaryRef={primaryRef}
            onClose={onClose}
            onCards={openStampCards}
        />,
        document.body,
    );
}
