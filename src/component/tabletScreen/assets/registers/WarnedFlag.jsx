/*  EL AVISO YA SE ENVIÓ
 *
 *  Sale en la celda de Ocupa o de Desocupa, en lugar del triángulo de aviso (WaitingAlert), cuando la fila tiene
 *  apuntada la novedad del aviso que se envió mientras la mesa seguía esperando: 'firstAttentionWarning' (sin
 *  primera atención) o 'cleaningWarning' (sin limpiar). Ver reportedDelay.js. Una bandera amarilla (pedido del
 *  usuario), del mismo amarillo que el triángulo, quieta: ya no hay nada que hacer.
 *
 *  Se queda aunque después llegue la atención o la limpieza: dice que en esa rotación hubo aviso.
 *
 *  No es un botón: solo dice que ya está. Su aspecto va en 'register-warned' de registers.css.
 */


// WORDS = «qué se avisó», por la espera
const WORDS = {
    'primera atención': 'la mesa seguía sin primera atención',
    limpieza: 'la mesa seguía sin limpiar',
};


/*  @param {string} kind  qué espera: 'primera atención' (en Ocupa) o 'limpieza' (en Desocupa)
 */
export default function WarnedFlag({ kind = 'primera atención' }) {
    const why = `Aviso enviado: ${WORDS[kind] ?? WORDS['primera atención']}`;

    return (
        <span className='register-warned' role='img' aria-label={why} title={why}>
            <svg width='15' height='15' viewBox='0 0 24 24' fill='none' strokeWidth='2'
                 strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <path className='register-warned__pole' d='M5 22V3' strokeWidth='2.4' />
                <path className='register-warned__flag' d='M5 4h13l-2.5 4.5L18 13H5z' />
            </svg>
        </span>
    );
}
