/*  UN MARCADOR: el número en grande y, al lado, de qué es y su detalle
 *
 *  En una ventana estrecha el texto se recorta con puntos suspensivos, así que el rótulo que sale al
 *  pasar el ratón lleva TODO: el número, el detalle entero y la explicación.
 */


/*  @param {string|number} number  lo que se enseña en grande
 *  @param {string}        label   de qué es
 *  @param {string}        detail  el detalle de debajo
 *  @param {string}        help    la explicación, al pasar el ratón
 *  @param {string}        tone    'bien', 'aviso' o 'mal' (el color); vacío, sin color
 */
export default function Score({ number, label, detail, help, tone = '' }) {
    return (
        <div className={`sim-marcador ${tone ? `sim-marcador--${tone}` : ''}`} title={`${number} ${label} · ${detail}\n\n${help}`}>
            <span className='sim-marcador__numero'>{number}</span>
            <span className='sim-marcador__texto'>
                <b>{label}</b>
                <span>{detail}</span>
            </span>
        </div>
    );
}
