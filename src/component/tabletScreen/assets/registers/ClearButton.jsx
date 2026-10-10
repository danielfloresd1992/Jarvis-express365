/*  LIMPIAR: vaciar el registro entero, las rotaciones y sus procesos
 *
 *  Va en rojo porque no se puede deshacer. Preguntar antes de borrar no es cosa suya: lo hace la
 *  sesión, que es quien borra.
 */


/*  @param {function} onClear  vaciar el registro
 */
export default function ClearButton({ onClear }) {
    return (
        <button
            type='button'
            onClick={onClear}
            className='vt-boton vt-boton--peligro'
            style={{ padding: '3px 10px', fontSize: '10px' }}
            aria-label='Vaciar el registro'
            title='Vacía el registro entero —las rotaciones y sus procesos—, incluido lo escrito a mano. No se puede deshacer.'
        >
            Limpiar
        </button>
    );
}
