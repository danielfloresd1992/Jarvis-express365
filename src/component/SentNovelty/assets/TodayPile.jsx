import { formatBonus } from '../../../libs/bonus/stampCards.js';


/*  LA PILA DE HOY: lo que ya hay y lo que está en juego
 *
 *      ●  ◔  ◌    Hoy: 1,25 bonos ganados · +0,25 en juego con esta
 *
 *  Una moneda por cada bono entero ganado hoy, un trozo por lo que sobra, y esta a trazos. Su aspecto, en
 *  'sent-pile…' de style.css.
 */


// MAX_COINS = «cuántas monedas se pintan»: con más, se dice el número
const MAX_COINS = 6;


/*  @param {number} earned  los bonos ganados hoy (totals.bonus de las tarjetas)
 *  @param {number} reward  los que trae esta novedad si la aprueban
 *  @param {string} face    la cara de la moneda de esta: 'full' | 'quarter' | 'night' | 'override'
 */
export default function TodayPile({ earned, reward, face }) {

    const whole = Math.min(MAX_COINS, Math.floor(earned));
    const remainder = earned - Math.floor(earned);

    return (
        <div className='sent-pile'>
            <span className='sent-pile__coins' role='img' aria-label={`Hoy: ${formatBonus(earned)} bonos ganados y ${formatBonus(reward)} en juego con esta`}>
                {Array.from({ length: whole }, (unused, index) => <span key={index} className='sent-pile__coin sent-pile__coin--full' />)}
                {remainder > 0 && <span className='sent-pile__coin sent-pile__coin--part' style={{ '--fraction': `${Math.round(remainder * 100)}%` }} />}
                {reward > 0 && <span className={`sent-pile__coin sent-pile__coin--pending sent-pile__coin--${face}`} />}
            </span>
            <span className='sent-pile__text'>
                <b>Hoy: {formatBonus(earned)} bonos</b> ganados{reward > 0 && <> · <b className='sent-pile__reward'>+{formatBonus(reward)}</b> en juego con esta</>}
            </span>
        </div>
    );
}
