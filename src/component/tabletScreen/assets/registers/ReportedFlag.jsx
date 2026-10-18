/*  LA DEMORA YA SE REPORTÓ
 *
 *  Sale en la duración en lugar del botón de reportar (ReportDelayButton) cuando la fila tiene apuntada la
 *  novedad que se envió por esa demora (firstAttentionDelay o cleaningDelay; ver reportedDelay.js). La
 *  propuesta «C», elegida por el usuario, con su ajuste: una píldora verde con la bandera y «Reportada» en
 *  blanco, en letra pequeña. En una tabla estrecha se queda solo la bandera (registers.css, con '@container').
 *
 *  No es un botón: solo dice que ya está. Su aspecto va en las clases 'register-reported…' de registers.css.
 */


/*  @param {string} kind  qué demora: 'primera atención' (por defecto) o 'limpieza'
 */
export default function ReportedFlag({ kind = 'primera atención' }) {
    return (
        <span className='register-reported' role='img' aria-label={`Demora de ${kind} reportada`} title={`Demora de ${kind} reportada`}>
            <svg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.6'
                 strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <path d='M5 22V3' />
                <path d='M5 4h13l-2.5 4.5L18 13H5z' fill='currentColor' />
            </svg>
            <span className='register-reported__label'>Reportada</span>
        </span>
    );
}
