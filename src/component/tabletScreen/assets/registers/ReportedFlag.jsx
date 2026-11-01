import NoveltyMarks from './NoveltyMarks.jsx';
import ResendAlertButton from './ResendAlertButton.jsx';
import { withNoveltyStatus, isRejected } from '../../../../libs/tickets/linkedNovelties.js';


/*  LA DEMORA YA SE REPORTÓ
 *
 *  Sale en la duración en lugar del botón de reportar (ReportDelayButton) cuando la fila tiene apuntada la
 *  novedad que se envió por esa demora (firstAttentionDelay o cleaningDelay; ver reportedDelay.js). La
 *  propuesta «C», elegida por el usuario, con su ajuste: una píldora verde con la bandera y «Reportada» en
 *  blanco, en letra pequeña. En una tabla estrecha se queda solo la bandera (registers.css, con '@container').
 *
 *  Y EN QUÉ QUEDÓ, con la novedad entera ('novelty', de useLinkedNovelties). Pedido del usuario:
 *
 *      aprobada     la celda va en verde (la pinta la fila) y la bandera en blanco, sin la píldora ('white'): «Aprobada»
 *      invalidada   en lugar de la bandera, la X para enviar otra alerta (ResendAlertButton, con 'onResend')
 *      modificada   el lápiz ocre en la esquina (NoveltyMarks)
 *
 *  Sin validar todavía, como siempre. El 'title' lo dice en palabras, con quién validó y por qué.
 *
 *  No es un botón: solo dice que ya está. Su aspecto va en las clases 'register-reported…' de registers.css.
 */


/*  @param {string}   kind      qué demora: 'primera atención' (por defecto), 'limpieza' o 'preparación'
 *  @param {object}   novelty   opcional. Lo que se sabe de su novedad (linkedNoveltyOf, en linkedNovelties.js)
 *  @param {boolean}  white     la bandera va en blanco, sin la píldora: está sobre la celda verde de aprobada
 *  @param {function} onResend  volver a pedir el reporte: la X de una invalidada
 */
export default function ReportedFlag({ kind = 'primera atención', novelty = null, white = false, onResend }) {
    const subject = `Demora de ${kind} reportada`;

    if (isRejected(novelty)) return <ResendAlertButton subject={subject} novelty={novelty} onResend={onResend} />;

    const why = withNoveltyStatus(subject, novelty);

    return (
        <span className={`register-reported ${white ? 'register-reported--white' : ''}`} role='img' aria-label={why} title={why}>
            <svg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.6'
                 strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <path d='M5 22V3' />
                <path d='M5 4h13l-2.5 4.5L18 13H5z' fill='currentColor' />
            </svg>
            <span className='register-reported__label'>{novelty?.status === 'approved' ? 'Aprobada' : 'Reportada'}</span>
            <NoveltyMarks novelty={novelty} showStatus={!white} />
        </span>
    );
}
