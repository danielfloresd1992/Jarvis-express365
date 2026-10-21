import { formatBonus, bonusWord } from '../../../libs/bonus/stampCards.js';


/*  ¡TARJETA LLENA!
 *
 *  El aviso que sube sobre la barra cuando una aprobada llena una tarjeta (useStampNews): el sello «+1 BONO» cae con
 *  golpe, y debajo, de qué alerta y cuántas lleva hoy. Se va solo o con su ✕. Su aspecto, en 'stamp-toast…' de
 *  style.css.
 */


/*  @param {object}   celebration  { title, bonusAwarded, filled } (useStampNews)
 *  @param {function} onClose      quitarlo
 */
export default function FullCardToast({ celebration, onClose }) {

    const { title, bonusAwarded, filled } = celebration;

    return (
        <div className='stamp-toast' role='status'>
            <span className='stamp-toast__seal' aria-hidden='true'>
                <span className='stamp-toast__amount'>+{formatBonus(bonusAwarded)}</span>
                <span className='stamp-toast__word'>{bonusWord(bonusAwarded)}</span>
            </span>
            <span className='stamp-toast__text'>
                <span className='stamp-toast__kicker'>¡Tarjeta llena!</span>
                <span className='stamp-toast__title'>{title}</span>
                <span className='stamp-toast__detail'>
                    +{formatBonus(bonusAwarded)} {bonusWord(bonusAwarded)}. {filled === 1 ? 'Tu primera tarjeta llena de esta alerta hoy' : `Ya llevas ${filled} de esta alerta hoy`}: empieza otra.
                </span>
            </span>
            <button type='button' className='stamp-toast__close' onClick={onClose} aria-label='Cerrar el aviso'>✕</button>
        </div>
    );
}
