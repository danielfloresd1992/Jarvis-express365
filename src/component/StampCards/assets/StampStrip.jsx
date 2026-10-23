import StampChip from './StampChip.jsx';
import ConfettiBurst from './ConfettiBurst.jsx';
import { StampIcon } from './icons.jsx';
import { formatBonus } from '../../../libs/bonus/stampCards.js';


/*  LA FRANJA DE LAS TARJETAS EN LA BARRA DE ABAJO
 *
 *      [◎ Tarjetas 1,5]  Servicio ●● ✓  Atención ●○○○  Limpieza ●◌○○   2 esperando · 1 rechazada
 *
 *  El botón abre el panel (StampPanel) y lleva los bonos del día. Detrás, una ficha por tarjeta (StampChip), hasta
 *  MAX_CHIPS, y la cuenta de las que esperan y las rechazadas. Mientras carga, si falla o si todavía no hay nada, una
 *  línea que lo dice. Su aspecto, en 'stamp-strip…' de style.css.
 *
 *  Cuando aprueban una novedad, del botón salta confeti (ConfettiBurst) y, si trajo bono, el botón da un saltito.
 *  Cuando rechazan una, la cuenta de rechazadas tiembla un momento, y nada más: se avisa, no se castiga.
 */


// MAX_CHIPS = «cuántas tarjetas caben en la barra»: las demás se cuentan ('+2') y se ven en el panel
const MAX_CHIPS = 5;


/*  @param {object}   result     lo de buildStampCards: { cards, others, rejected, totals }
 *  @param {string}   status     'loading' | 'ready' | 'error' (useMyNovelties)
 *  @param {string}   message    por qué falló
 *  @param {boolean}  open       el panel está abierto
 *  @param {function} onToggle   abrirlo o cerrarlo
 *  @param {object}   buttonRef  el botón (el cursor vuelve a él al cerrar con Escape)
 *  @param {Set}      freshIds   los sellos que acaban de caer
 *  @param {object}   burst      el confeti de ahora: { id, strength, amount } (useStampNews), o null
 *  @param {Set}      freshRejectedIds  las que acaban de rechazar
 */
export default function StampStrip({ result, status, message, open, onToggle, buttonRef, freshIds, burst = null, freshRejectedIds = new Set() }) {

    const { cards, totals } = result;
    const shown = cards.slice(0, MAX_CHIPS);
    const hidden = cards.length - shown.length;

    // bump = «el botón da un saltito»: solo cuando la aprobada trajo bono
    const bump = burst && burst.strength !== 'small';

    return (
        <div className='stamp-strip'>
            <span className='stamp-strip__origin'>
                <button
                    ref={buttonRef}
                    type='button'
                    className={`stamp-strip__toggle ${bump ? 'stamp-strip__toggle--bump' : ''}`}
                    onClick={onToggle}
                    aria-expanded={open}
                    aria-controls='stamp-panel'
                    title='Tus tarjetas de hoy: cada aprobada pone un sello'
                >
                    <StampIcon />
                    <span>Tarjetas</span>
                    <span className='stamp-strip__bonus'>{formatBonus(totals.bonus)}</span>
                    <span className='sr-only'>bonos hoy</span>
                </button>
                {burst && <ConfettiBurst key={burst.id} strength={burst.strength} amount={burst.amount} />}
            </span>

            {status === 'loading' && <span className='stamp-strip__note'>Cargando tus novedades…</span>}
            {status === 'error' && <span className='stamp-strip__note stamp-strip__note--warning' title={message}>{message}</span>}
            {status === 'ready' && totals.reported === 0 && <span className='stamp-strip__note'>Aún no reportas hoy: cada aprobada pone un sello</span>}

            {
                shown.length > 0 && (
                    <ul className='stamp-strip__chips' aria-label='Tus tarjetas'>
                        {shown.map(card => (
                            <StampChip key={card.key} card={card} fresh={card.slots.some(slot => slot && freshIds.has(slot.id))} />
                        ))}
                        {hidden > 0 && <li className='stamp-chip stamp-chip--more' title={`${hidden} tarjetas más: ábrelas con «Tarjetas»`}>+{hidden}</li>}
                    </ul>
                )
            }

            {
                status === 'ready' && (totals.pending > 0 || totals.rejected > 0) && (
                    <span className='stamp-strip__counts'>
                        {totals.pending > 0 && <b className='stamp-strip__pending'>{totals.pending} esperando</b>}
                        {totals.pending > 0 && totals.rejected > 0 && ' · '}
                        {totals.rejected > 0 && <b className={`stamp-strip__rejected ${freshRejectedIds.size ? 'stamp-strip__rejected--fresh' : ''}`}>{totals.rejected} {totals.rejected === 1 ? 'rechazada' : 'rechazadas'}</b>}
                    </span>
                )
            }
        </div>
    );
}
