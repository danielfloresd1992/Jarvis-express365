/*  EL BOTÓN DE LA LISTA DE TOQUES DE GERENTE DE UNA ROTACIÓN
 *
 *  Una mano y una flecha que dice que despliega. Al pulsarlo abre o cierra su lista (RegisterTouchList).
 *  Ya no lleva el número: cada gerente dice los suyos en su tecla (ManagerButtons). Está siempre, para que
 *  la columna no cambie de forma al apuntar el primero.
 *
 *  También se abre SIN TOQUES: la primera fila de la lista es el modo manual (RegisterTouchManual), por
 *  donde se apunta el primero a mano. Solo va plano y sin hacer nada cuando no se puede apuntar ninguno
 *  ('disabled'): una fila sin mesa, o un pedido para llevar sin toques.
 *  Su aspecto va en las clases 'register-touches…' de registers.css.
 */


/*  @param {number}   count     cuántos toques tiene la rotación
 *  @param {boolean}  open      la lista está abierta
 *  @param {boolean}  disabled  opcional. No se puede abrir; si no se dice, solo cuando no hay toques
 *  @param {function} onToggle  abrirla o cerrarla
 */
export default function TouchToggle({ count, open, disabled = count === 0, onToggle }) {

    // what = «lo que hace el botón, dicho con palabras»
    const what = disabled ? 'Esta mesa todavía no tiene toques'
        : count === 0 ? `${open ? 'Cerrar' : 'Abrir'} la lista de toques, para apuntar uno a mano`
        : `${open ? 'Cerrar' : 'Ver'} ${count === 1 ? 'el toque' : `los ${count} toques`} de esta mesa`;

    // shownOpen = «se pinta abierta»
    const shownOpen = open && !disabled;

    return (
        <button
            type='button'
            onClick={onToggle}
            disabled={disabled}
            aria-expanded={disabled ? undefined : open}
            aria-label={what}
            title={what}
            className={`register-touches ${shownOpen ? 'register-touches--open' : ''}`}
        >
            <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <path d='M9 11V5.5a1.5 1.5 0 0 1 3 0V11' />
                <path d='M12 10.5V9a1.5 1.5 0 0 1 3 0v2' />
                <path d='M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.8-2.4L4 15.5a1.6 1.6 0 0 1 2.4-2.1L9 15' />
            </svg>
            <svg width='9' height='9' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <path d={shownOpen ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
            </svg>
        </button>
    );
}
