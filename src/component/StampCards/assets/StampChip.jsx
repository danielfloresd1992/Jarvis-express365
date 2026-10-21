import { CheckIcon } from './icons.jsx';


/*  UNA TARJETA, EN PEQUEÑO, EN LA BARRA DE ABAJO
 *
 *      Servicio ●● ✓      Atención ●○○○      Limpieza ●◌○○
 *
 *  El nombre de la alerta y un punto por casilla: lleno = aprobada, a trazos = esperando validación, punteado = vacía.
 *  Con más de MAX_DOTS casillas, la cuenta en número ('3/10'). Llena, en verde con su ✓; con un sello nuevo, parpadea.
 *  Su aspecto, en 'stamp-chip…' y 'stamp-dot…' de style.css.
 */


// MAX_DOTS = «hasta cuántas casillas se pintan como puntos»
const MAX_DOTS = 6;


/*  @param {object}  card   una de buildStampCards
 *  @param {boolean} fresh  le acaba de caer un sello
 */
export default function StampChip({ card, fresh = false }) {

    // waiting = «las que esperan validación en esta tarjeta», con las que no caben
    const waiting = card.slots.filter(slot => slot?.state === 'pending').length + card.overflow;

    // summary = «la tarjeta dicha con palabras»
    const summary = `${card.title}: ${card.full ? 'tarjeta llena' : `${card.stamped} de ${card.alertsRequired}`}${waiting ? `, ${waiting} esperando validación` : ''}`;

    return (
        <li className={`stamp-chip ${card.full ? 'stamp-chip--full' : ''} ${fresh ? 'stamp-chip--fresh' : ''}`} title={summary}>
            <span className='stamp-chip__name' aria-hidden='true'>{card.title}</span>
            {
                card.alertsRequired <= MAX_DOTS
                    ? (
                        <span className='stamp-chip__dots' aria-hidden='true'>
                            {card.slots.map((slot, index) => <span key={slot?.id ?? `empty-${index}`} className={`stamp-dot stamp-dot--${slot?.state ?? 'empty'}`} />)}
                        </span>
                    )
                    : <span className='stamp-chip__count' aria-hidden='true'>{card.stamped}/{card.alertsRequired}</span>
            }
            {card.full && <CheckIcon />}
            <span className='sr-only'>{summary}</span>
        </li>
    );
}
