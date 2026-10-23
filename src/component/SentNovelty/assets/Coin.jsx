/*  LA MONEDA DEL AVISO: lo que vale esta novedad, en una pieza que gira y cae
 *
 *      full       la moneda entera, de oro: 1 alerta = el bono
 *      quarter    un trozo de moneda (el sector lleno es lo que vale esta: ¼ con una regla 4 × 1)
 *      night      la moneda de noche, índigo: la regla paga distinto en turno nocturno
 *      override   la moneda de oro con la marca del local: aquí vale distinto que en general
 *      stub       un resguardo de papel: sin bono, pero cuenta
 *      disc       un disco verde con ondas: las cámaras volvieron
 *
 *  Su aspecto y sus animaciones, en 'sent-coin…' de style.css. El sector del trozo va en --fraction.
 */


// WAVES = «las ondas del disco de las cámaras»
const WAVES = (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <path className="sent-coin__wave" d="M2 9a14 14 0 0 1 20 0" />
        <path className="sent-coin__wave sent-coin__wave--2" d="M5 12.5a10 10 0 0 1 14 0" />
        <path className="sent-coin__wave sent-coin__wave--3" d="M8.5 16a5 5 0 0 1 7 0" />
        <circle cx="12" cy="19.5" r="1.2" fill="currentColor" />
    </svg>
);


/*  @param {object} coin       { face, text, word, fraction, label } (sentReaction)
 *  @param {string} localMark  las iniciales del local, para la moneda con excepción
 */
export default function Coin({ coin, localMark = '' }) {

    if (coin.face === 'stub') {
        return (
            <span className='sent-coin sent-coin--stub' role='img' aria-label={coin.label}>
                <span className='sent-coin__stub-head' aria-hidden='true'>Resguardo</span>
                {coin.text && <span className='sent-coin__stub-number' aria-hidden='true'>{coin.text}</span>}
                <span className='sent-coin__stub-foot' aria-hidden='true'>{coin.text ? coin.word : 'cuenta en el reporte'}</span>
            </span>
        );
    }

    if (coin.face === 'disc') {
        return (
            <span className='sent-coin sent-coin--disc' role='img' aria-label={coin.label}>
                {WAVES}
                <span className='sent-coin__word' aria-hidden='true'>{coin.word}</span>
            </span>
        );
    }

    return (
        <span
            className={`sent-coin sent-coin--${coin.face}`}
            style={{ '--fraction': `${Math.round(Math.min(1, Math.max(0, coin.fraction)) * 100)}%` }}
            role='img'
            aria-label={coin.label}
        >
            <span className='sent-coin__text' aria-hidden='true'>{coin.text}</span>
            <span className='sent-coin__word' aria-hidden='true'>{coin.word}</span>
            {coin.face === 'override' && localMark && <span className='sent-coin__mark' aria-hidden='true'>{localMark}</span>}
            <span className='sent-coin__glint' aria-hidden='true' />
        </span>
    );
}
