import Stamp from './Stamp.jsx';
import { formatBonus, bonusWord } from '../../../libs/bonus/stampCards.js';


/*  UNA TARJETA DE SELLOS, en el panel
 *
 *      ┌ Demora de servicio ─────────── 2 × 1 ┐
 *      │  (11:40)  (12:48)                     │
 *      │  2 de 2 · ¡Llena! +1 bono             │
 *      └───────────────────────────────────────┘
 *
 *  La tarjeta en juego (buildStampCards): sus casillas, cuántas lleva y lo que ya vale. Llena, se pinta en verde; si se
 *  acaba de llenar, brilla. Su aspecto, en 'stamp-card…' de style.css.
 */


/*  @param {object} card      una de buildStampCards
 *  @param {Set}    freshIds  los sellos que acaban de caer
 */
export default function StampCard({ card, freshIds }) {

    // perAlert = «lo que vale cada sello»
    const perAlert = card.bonusAwarded / card.alertsRequired;

    // waiting = «las de lápiz de esta tarjeta», más las que no caben
    const waiting = card.slots.filter(slot => slot?.state === 'pending').length + card.overflow;

    // celebrate = «se acaba de llenar»: alguno de sus sellos es nuevo
    const celebrate = card.full && card.slots.some(slot => slot && freshIds.has(slot.id));

    return (
        <article className={`stamp-card ${card.full ? 'stamp-card--full' : ''} ${celebrate ? 'stamp-card--celebrate' : ''}`}>
            <header className='stamp-card__head'>
                <h3 className='stamp-card__title' title={card.title}>{card.title}</h3>
                <span className='stamp-card__rule' title={`Regla${card.ruleName ? ` «${card.ruleName}»` : ''}: ${card.alertsRequired} aprobadas dan ${formatBonus(card.bonusAwarded)} ${bonusWord(card.bonusAwarded)}`}>
                    {card.alertsRequired} × {formatBonus(card.bonusAwarded)}
                </span>
            </header>

            <div className={`stamp-card__slots ${card.alertsRequired > 6 ? 'stamp-card__slots--many' : ''}`}>
                {card.slots.map((slot, index) => (
                    <Stamp key={slot?.id ?? `empty-${index}`} slot={slot} fresh={Boolean(slot && freshIds.has(slot.id))} />
                ))}
            </div>

            <p className='stamp-card__foot'>
                {
                    card.full
                        ? <b className='stamp-card__done'>¡Llena! +{formatBonus(card.bonusAwarded)} {bonusWord(card.bonusAwarded)}</b>
                        : <><b>{card.stamped} de {card.alertsRequired}</b> · ya vale {formatBonus(card.stamped * perAlert)}</>
                }
                {waiting > 0 && <span className='stamp-card__waiting'> · +{waiting} esperando validación</span>}
            </p>

            {card.filled > 0 && (
                <p className='stamp-card__today'>
                    Hoy: {card.filled} {card.filled === 1 ? 'tarjeta llena' : 'tarjetas llenas'} · +{formatBonus(card.bonus)} {bonusWord(card.bonus)}
                </p>
            )}
        </article>
    );
}
