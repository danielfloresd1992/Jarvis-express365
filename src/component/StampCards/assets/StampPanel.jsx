import StampCard from './StampCard.jsx';
import NoveltyList from './NoveltyList.jsx';
import { formatBonus, bonusWord } from '../../../libs/bonus/stampCards.js';
import { operationalDayLabel } from '../../../libs/date_time/operationalDay.js';


/*  EL PANEL DE LAS TARJETAS: todas las novedades del día con su validación
 *
 *  Sube desde la barra al pulsar «Tarjetas». Arriba, los bonos del día; luego una tarjeta por alerta (StampCard) y, al
 *  final, las que no ponen sello: las que no dan bono y las rechazadas, con su motivo (NoveltyList). Su aspecto, en
 *  'stamp-panel…' de style.css.
 */


/*  @param {object} result    lo de buildStampCards: { cards, others, rejected, totals }
 *  @param {string} status    'loading' | 'ready' | 'error'
 *  @param {string} message   por qué falló
 *  @param {string} day       el día operativo, 'AAAA-MM-DD'
 *  @param {Set}    freshIds  los sellos que acaban de caer
 */
export default function StampPanel({ result, status, message, day, freshIds }) {

    const { cards, others, rejected, totals } = result;

    return (
        <section id='stamp-panel' className='stamp-panel' aria-label='Tus tarjetas de hoy'>
            <header className='stamp-panel__head'>
                <div className='stamp-panel__heading'>
                    <h2 className='stamp-panel__title'>Tus tarjetas de hoy</h2>
                    <p className='stamp-panel__hint'>Cada aprobada pone un sello. Tarjeta llena = su bono, y cada sello ya cuenta su parte.</p>
                </div>
                <div className='stamp-panel__total'>
                    <span className='stamp-panel__number'>{formatBonus(totals.bonus)}</span>
                    <span className='stamp-panel__unit'>{bonusWord(totals.bonus)}{day ? ` · ${operationalDayLabel(day)}` : ''}</span>
                </div>
            </header>

            {status === 'loading' && <p className='stamp-panel__empty'>Cargando tus novedades…</p>}
            {status === 'error' && <p className='stamp-panel__empty stamp-panel__empty--warning'>{message}</p>}
            {
                status === 'ready' && totals.reported === 0 && (
                    <p className='stamp-panel__empty'>Todavía no reportas nada hoy. Cuando aprueben tu primera novedad, aquí aparece su tarjeta con el primer sello.</p>
                )
            }

            {cards.length > 0 && (
                <div className='stamp-panel__cards'>
                    {cards.map(card => <StampCard key={card.key} card={card} freshIds={freshIds} />)}
                </div>
            )}

            {others.length > 0 && <NoveltyList title={`Sin tarjeta · ${others.length}`} hint='no dan bono' items={others} kind='other' />}
            {rejected.length > 0 && <NoveltyList title={`${rejected.length === 1 ? 'Rechazada' : 'Rechazadas'} · ${rejected.length}`} hint='no ocupan sello ni quitan ninguno' items={rejected} kind='rejected' />}

            {totals.pending > 0 && (
                <p className='stamp-panel__note'>Los sellos a lápiz esperan validación: su casilla es la que les tocaría si las aprueban.</p>
            )}
        </section>
    );
}
