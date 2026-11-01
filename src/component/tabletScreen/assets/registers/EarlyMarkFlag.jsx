import NoveltyMarks from './NoveltyMarks.jsx';
import ResendAlertButton from './ResendAlertButton.jsx';
import { withNoveltyStatus, isRejected } from '../../../../libs/tickets/linkedNovelties.js';


/*  «MARCADA ANTES DE ESTAR LISTO» YA SE REPORTÓ: la bandera pirata, negra (pedido del usuario)
 *
 *  Sale en la primera Duración del proceso —de la toma de orden a listo en tablet: el tiempo de la tablet de Toast,
 *  que es lo que esta alerta denuncia— cuando el proceso tiene apuntada su novedad ('earlyMarkDelay', ver
 *  reportedDelay.js). Puede ir junto a la bandera de la demora de preparación: son dos alertas distintas.
 *
 *  Y EN QUÉ QUEDÓ, con la novedad entera ('novelty', de useLinkedNovelties). Pedido del usuario:
 *
 *      aprobada     la celda va en verde (la pinta la línea) y la bandera en blanco, con la calavera del verde de la
 *                   celda ('white')
 *      invalidada   en lugar de la bandera, la X para enviar otra alerta (ResendAlertButton, con 'onResend')
 *      modificada   el lápiz ocre en la esquina (NoveltyMarks)
 *
 *  El 'title' lo dice en palabras. No es un botón: solo dice que ya está. Su aspecto va en las clases
 *  'register-pirate…' de registers.css.
 */


// WHY = «lo que dice al pasar el ratón», y lo que leen los lectores de pantalla
const WHY = '«Marcada antes de estar listo» reportada: se sacó de la pantalla de la tablet antes de estar listo en cocina';


/*  @param {object}   novelty   opcional. Lo que se sabe de su novedad (linkedNoveltyOf, en linkedNovelties.js)
 *  @param {boolean}  white     la bandera va en blanco: está sobre la celda verde de aprobada
 *  @param {function} onResend  volver a pedir el reporte: la X de una invalidada
 */
export default function EarlyMarkFlag({ novelty = null, white = false, onResend }) {
    if (isRejected(novelty)) return <ResendAlertButton subject={WHY} novelty={novelty} onResend={onResend} />;

    const why = withNoveltyStatus(WHY, novelty);

    return (
        <span className={`register-pirate ${white ? 'register-pirate--white' : ''}`} role='img' aria-label={why} title={why}>
            <svg width='18' height='18' viewBox='0 0 24 24' aria-hidden='true'>
                {/*  El mástil y la bandera, negros  */}
                <path d='M4 2.5V22' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' />
                <path d='M4 3h17v11.5H4z' fill='currentColor' />
                {/*  La calavera: el cráneo, la mandíbula y los ojos  */}
                <circle className='register-pirate__mark' cx='12.5' cy='6.6' r='2.4' />
                <rect className='register-pirate__mark' x='11.1' y='8.2' width='2.8' height='1.5' rx='0.5' />
                <circle cx='11.6' cy='6.5' r='0.7' fill='currentColor' />
                <circle cx='13.4' cy='6.5' r='0.7' fill='currentColor' />
                {/*  Los huesos cruzados, debajo  */}
                <path className='register-pirate__bones' d='M8.8 13l7.4-2.6M8.8 10.4l7.4 2.6' strokeWidth='1.4' strokeLinecap='round' />
            </svg>
            <NoveltyMarks novelty={novelty} showStatus={!white} />
        </span>
    );
}
