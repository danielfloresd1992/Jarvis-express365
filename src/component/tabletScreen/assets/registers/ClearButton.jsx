/*  LIMPIAR: vaciar el registro entero, las rotaciones y sus procesos
 *
 *  Solo el icono, en rojo porque no se puede deshacer. Es una tecla con relieve, de la misma familia que las
 *  de los gerentes (propuesta «B · Medidores», elegida por el usuario): se hunde al pulsarla. Al pasar el
 *  ratón —o al llegarle con el teclado— dice cuántas rotaciones de Mesas se perderían. Con Mesas ya vacía
 *  va plana y apagada: no hay nada que limpiar.
 *
 *  Preguntar antes de borrar no es cosa suya: lo hace la sesión, que es quien borra. Su aspecto va en las
 *  clases 'register-clear…' de registers.css.
 */


/*  @param {function} onClear  vaciar el registro
 *  @param {number}   pending  las filas de Mesas en uso: lo que se perdería. 0 = no hay nada que limpiar
 */
export default function ClearButton({ onClear, pending }) {

    // what = «lo que hace, dicho con palabras»
    const what = pending === 0 ? 'Mesas ya está vacía'
        : `Limpiar Mesas · ${pending} sin guardar`;

    return (
        <span className='register-clear'>
            <button
                type='button'
                onClick={onClear}
                disabled={pending === 0}
                className='register-clear__key'
                aria-label={`${what}. Vacía el registro entero —las rotaciones y sus procesos—, incluido lo escrito a mano. No se puede deshacer.`}
            >
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                    <path d='M3 6h18' />
                    <path d='M8 6V4h8v2' />
                    <path d='M6 6l1 14h10l1-14' />
                    <path d='M10 11v5' />
                    <path d='M14 11v5' />
                </svg>
            </button>
            <span className='register-clear__tip' role='tooltip' aria-hidden='true'>{what}</span>
        </span>
    );
}
