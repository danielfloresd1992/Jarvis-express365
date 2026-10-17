/*  AGREGAR UNA ROTACIÓN: el botón de la pestaña «Registros», junto a Exportar
 *
 *  Abre encima de la lista la fila para anotar a mano una rotación que no se guardó en su momento
 *  (RegisterSavedNew), que se guarda como recuperada. Mientras esa fila está abierta, el botón se apaga:
 *  se anota una a la vez. Su aspecto va en la clase 'register-add-button' de registers.css.
 */


/*  @param {function} onAdd     abre la fila nueva
 *  @param {boolean}  disabled  apagado: ya hay una fila nueva abierta, o no se puede guardar
 */
export default function AddRotationButton({ onAdd, disabled = false }) {
    return (
        <button
            type='button'
            className='register-add-button'
            onClick={onAdd}
            disabled={disabled}
            title='Anotar a mano una rotación que no se guardó en su momento: se guarda como recuperada'
        >
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' aria-hidden='true'>
                <path d='M12 5v14M5 12h14' />
            </svg>
            <span>Agregar rotación</span>
        </button>
    );
}
