/*  LIMPIAR: vaciar el registro entero, las rotaciones y sus procesos
 *
 *  Solo el icono, en rojo porque no se puede deshacer. Preguntar antes de borrar no es cosa suya: lo
 *  hace la sesión, que es quien borra.
 */


/*  @param {function} onClear  vaciar el registro
 */
export default function ClearButton({ onClear }) {
    return (
        <button
            type='button'
            onClick={onClear}
            className='register-icon-button register-icon-button--danger'
            aria-label='Vaciar el registro'
            title='Limpiar: vacía el registro entero —las rotaciones y sus procesos—, incluido lo escrito a mano. No se puede deshacer.'
        >
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <path d='M3 6h18' />
                <path d='M8 6V4h8v2' />
                <path d='M6 6l1 14h10l1-14' />
                <path d='M10 11v5' />
                <path d='M14 11v5' />
            </svg>
        </button>
    );
}
