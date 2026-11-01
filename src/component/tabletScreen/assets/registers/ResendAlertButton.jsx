import { withNoveltyStatus } from '../../../../libs/tickets/linkedNovelties.js';


/*  LA ALERTA SE INVALIDÓ: LA X PARA ENVIAR OTRA (pedido del usuario)
 *
 *  Sale en lugar de la bandera de una alerta enviada desde Mesas —una demora (ReportedFlag), el aviso de que la mesa
 *  seguía esperando (WarnedFlag) o «Marcada antes de estar listo» (EarlyMarkFlag)— cuando quien valida la invalidó.
 *  Lo dice su novedad entera (linkedNoveltyOf, de useLinkedNovelties). Una X blanca en un círculo rojo, quieta: no corre
 *  prisa como una demora sin reportar.
 *
 *  AL PULSARLA se vuelve a abrir su formulario de Demoras con los datos de la fila, como la primera vez ('onResend' es
 *  lo mismo que pide el botón que la envió). Al enviar la nueva, la rotación apunta su novedad en lugar de la
 *  invalidada (reportedDelay.js) y vuelve la bandera de «Reportada». La invalidada no se borra: sigue en la API, con su
 *  validación.
 *
 *  El 'title' dice qué se invalidó, quién y por qué. Su aspecto va en 'register-resend' de registers.css; con 'corner',
 *  en la esquina derecha de Ocupa o Desocupa, donde iba la bandera amarilla del aviso.
 */


/*  @param {string}   subject   qué alerta es, para el 'title': 'Demora de limpieza reportada', 'Aviso enviado: …'
 *  @param {object}   novelty   lo que se sabe de su novedad (linkedNoveltyOf): quién la invalidó y por qué
 *  @param {function} onResend  volver a abrir su formulario. Sin él, la X solo informa (desactivada).
 *  @param {boolean}  corner    va en la esquina de la celda (la del aviso), y no en la fila de la duración
 */
export default function ResendAlertButton({ subject, novelty, onResend, corner = false }) {
    const why = `${withNoveltyStatus(subject, novelty)}.${onResend ? ' Pulsa para enviar otra alerta' : ''}`;

    return (
        <button
            type='button'
            className={`register-resend ${corner ? 'register-resend--corner' : ''}`}
            onClick={onResend}
            disabled={!onResend}
            title={why}
            aria-label={why}
        >
            <svg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3.6' strokeLinecap='round' aria-hidden='true'>
                <path d='M6 6l12 12' />
                <path d='M18 6L6 18' />
            </svg>
        </button>
    );
}
