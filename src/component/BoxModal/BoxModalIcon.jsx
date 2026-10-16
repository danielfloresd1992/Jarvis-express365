/*  EL ICONO DEL BOX MODAL, según el tipo de alerta
 *
 *      success   un círculo con una marca
 *      warning   un triángulo con una exclamación
 *      error     un círculo con una equis
 *
 *  Toma el color del texto (currentColor): el de cada tono lo pone style.css.
 */


// PATHS = «el dibujo de cada tono», en una caja de 24 × 24
const PATHS = {
    success: (
        <>
            <circle cx='12' cy='12' r='9' />
            <path d='m8 12.5 2.7 2.7L16.5 9' />
        </>
    ),
    warning: (
        <>
            <path d='M10.3 4.2 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z' />
            <path d='M12 9.5v4' />
            <path d='M12 17h.01' />
        </>
    ),
    error: (
        <>
            <circle cx='12' cy='12' r='9' />
            <path d='m9 9 6 6M15 9l-6 6' />
        </>
    ),
};


/*  @param {string} tone  'success' | 'warning' | 'error'
 */
export default function BoxModalIcon({ tone }) {
    return (
        <svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
            {PATHS[tone] ?? PATHS.warning}
        </svg>
    );
}
