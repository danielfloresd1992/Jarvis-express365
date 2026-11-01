import NoveltyMarks from './NoveltyMarks.jsx';
import ResendAlertButton from './ResendAlertButton.jsx';
import { withNoveltyStatus, isRejected } from '../../../../libs/tickets/linkedNovelties.js';


/*  EL AVISO YA SE ENVIÓ
 *
 *  Sale en la celda de Ocupa o de Desocupa, en lugar del triángulo de aviso (WaitingAlert), cuando la fila tiene
 *  apuntada la novedad del aviso que se envió mientras la mesa seguía esperando: 'firstAttentionWarning' (sin
 *  primera atención) o 'cleaningWarning' (sin limpiar). Ver reportedDelay.js. Una bandera amarilla (pedido del
 *  usuario), del mismo amarillo que el triángulo, quieta: ya no hay nada que hacer.
 *
 *  Se queda aunque después llegue la atención o la limpieza: dice que en esa rotación hubo aviso.
 *
 *  Y EN QUÉ QUEDÓ, con la novedad entera ('novelty', de useLinkedNovelties). Pedido del usuario:
 *
 *      aprobado     la celda va en verde (la pinta la fila) y la bandera en blanco ('white')
 *      invalidado   en lugar de la bandera, la X para enviar otro aviso (ResendAlertButton, con 'onResend'), en la
 *                   misma esquina
 *      modificado   el lápiz ocre en la esquina de la bandera (NoveltyMarks)
 *
 *  El 'title' lo dice en palabras. No es un botón: solo dice que ya está. Su aspecto va en 'register-warned' de
 *  registers.css.
 */


// WORDS = «qué se avisó», por la espera
const WORDS = {
    'primera atención': 'la mesa seguía sin primera atención',
    limpieza: 'la mesa seguía sin limpiar',
};


/*  @param {string}   kind      qué espera: 'primera atención' (en Ocupa) o 'limpieza' (en Desocupa)
 *  @param {object}   novelty   opcional. Lo que se sabe de la novedad del aviso (linkedNoveltyOf, en linkedNovelties.js)
 *  @param {boolean}  white     la bandera va en blanco: está sobre la celda verde de aprobado
 *  @param {function} onResend  volver a pedir el aviso: la X de uno invalidado
 */
export default function WarnedFlag({ kind = 'primera atención', novelty = null, white = false, onResend }) {
    const subject = `Aviso enviado: ${WORDS[kind] ?? WORDS['primera atención']}`;

    if (isRejected(novelty)) return <ResendAlertButton subject={subject} novelty={novelty} onResend={onResend} corner />;

    const why = withNoveltyStatus(subject, novelty);

    return (
        <span className={`register-warned ${white ? 'register-warned--white' : ''}`} role='img' aria-label={why} title={why}>
            <svg width='15' height='15' viewBox='0 0 24 24' fill='none' strokeWidth='2'
                 strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <path className='register-warned__pole' d='M5 22V3' strokeWidth='2.4' />
                <path className='register-warned__flag' d='M5 4h13l-2.5 4.5L18 13H5z' />
            </svg>
            <NoveltyMarks novelty={novelty} showStatus={!white} />
        </span>
    );
}
