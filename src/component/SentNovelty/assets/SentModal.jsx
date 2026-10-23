import Coin from './Coin.jsx';
import TodayPile from './TodayPile.jsx';
import ConfettiBurst from '../../StampCards/assets/ConfettiBurst.jsx';
import { clockOf } from '../../../libs/bonus/stampCards.js';


/*  EL AVISO DE «ENTREGADA CON ÉXITO»
 *
 *      ┌──────────────────────────────────────┐   ← la raya de arriba, del color de la categoría
 *      │           [ DEMORAS ]                │
 *      │        Entregada con éxito           │
 *      │   Demora de servicio · mesa 15 · 12:48
 *      │              ( ¼ )  ← la moneda cae  │
 *      │   Un cuarto más: te faltan 2…        │
 *      │   ◌ A la espera de su validación     │
 *      │   ● ◔ ◌  Hoy: 1,25 · +0,25 en juego  │
 *      │          [Ver mis tarjetas] [Seguir] │
 *      └──────────────────────────────────────┘
 *
 *  Solo pinta: lo que dice sale de sentReaction y de useTodayBonus. Su aspecto, en 'sent-modal…' de style.css.
 */


// BURST_BY_KIND = «cuánto confeti, según la reacción»: más en las que dan bono (pedido del usuario)
const BURST_BY_KIND = { full: 'full', override: 'full', night: 'full', step: 'bonus', none: 'small', dvr: 'bonus' };


/*  @param {object}   reaction    lo de sentReaction
 *  @param {object}   sent        { menu, table, at }
 *  @param {string}   localMark   las iniciales del local (moneda con excepción)
 *  @param {object}   today       { ready, totals } (useTodayBonus)
 *  @param {object}   primaryRef  el botón principal (el foco va ahí)
 *  @param {function} onClose     «Seguir vigilando»
 *  @param {function} onCards     «Ver mis tarjetas»
 */
export default function SentModal({ reaction, sent, localMark, today, primaryRef, onClose, onCards }) {

    const { category, kind, coin, headline, sub, reward } = reaction;

    // where = «dónde y cuándo»: la mesa si la hay, y la hora
    const where = `${sent.table ? `mesa ${sent.table} · ` : ''}${clockOf(sent.at)}`;

    return (
        <div className='sent-modal__overlay'>
            <section
                className={`sent-modal sent-modal--${kind}`}
                style={{ '--sent-color': category.color, '--sent-bg': category.bg }}
                role='alertdialog'
                aria-modal='true'
                aria-labelledby='sent-modal-title'
                aria-describedby='sent-modal-status'
            >
                <div className='sent-modal__head'>
                    {category.es && <span className='sent-modal__category'>{category.es}</span>}
                    <h2 id='sent-modal-title' className='sent-modal__title'>Entregada con éxito</h2>
                    <p className='sent-modal__alert'>{reaction.alert} · <span className='sent-modal__clock'>{where}</span></p>
                </div>

                <div className='sent-modal__stage'>
                    <ConfettiBurst strength={BURST_BY_KIND[kind] ?? 'small'} amount={0} />
                    <Coin coin={coin} localMark={localMark} />
                </div>

                <p className='sent-modal__headline'>{headline}</p>
                <p className='sent-modal__sub'>{sub}</p>

                <p id='sent-modal-status' className='sent-modal__status'>
                    <span className='sent-modal__waiting' aria-hidden='true' />
                    A la espera de su validación · te avisamos aquí cuando la validen
                </p>

                {today.ready && (kind !== 'none' && kind !== 'dvr' || today.totals.bonus > 0) && (
                    <TodayPile earned={today.totals.bonus} reward={reward} face={coin.face} />
                )}

                <div className='sent-modal__actions'>
                    <button type='button' className='sent-modal__button' onClick={onCards}>Ver mis tarjetas</button>
                    <button ref={primaryRef} type='button' className='sent-modal__button sent-modal__button--primary' onClick={onClose}>Seguir vigilando</button>
                </div>
            </section>
        </div>
    );
}
