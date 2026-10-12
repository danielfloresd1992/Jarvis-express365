/*  EL CONTADOR DE TOQUES DE GERENTE DE UNA ROTACIÓN
 *
 *  Una mano y cuántos toques lleva la mesa. Al pulsarlo abre o cierra su lista (RegisterTouchList).
 *  Está siempre, también con 0 —apagado y sin hacer nada—, para que la columna no cambie de forma al
 *  apuntar el primero. Su aspecto va en las clases 'register-touches…' de registers.css.
 */


/*  @param {number}   count     cuántos toques tiene la rotación
 *  @param {boolean}  open      la lista está abierta
 *  @param {function} onToggle  abrirla o cerrarla
 */
export default function TouchToggle({ count, open, onToggle }) {

    // what = «lo que hace el contador, dicho con palabras»
    const what = count === 0 ? 'Esta mesa todavía no tiene toques'
        : `${open ? 'Cerrar' : 'Ver'} ${count === 1 ? 'el toque' : `los ${count} toques`} de esta mesa`;

    return (
        <button
            type='button'
            onClick={onToggle}
            disabled={count === 0}
            aria-expanded={count > 0 ? open : undefined}
            aria-label={what}
            title={what}
            className={`register-touches ${open && count > 0 ? 'register-touches--open' : ''}`}
        >
            <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <path d='M9 11V5.5a1.5 1.5 0 0 1 3 0V11' />
                <path d='M12 10.5V9a1.5 1.5 0 0 1 3 0v2' />
                <path d='M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.8-2.4L4 15.5a1.6 1.6 0 0 1 2.4-2.1L9 15' />
            </svg>
            <span className='tabular-nums'>{count}</span>
        </button>
    );
}
