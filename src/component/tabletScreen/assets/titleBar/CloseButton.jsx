import Icon from '../Icon.jsx';


/*  CERRAR la propia ventana flotante
 *
 *  Va el último y separado por una raya, como en cualquier ventana. Al pasar el ratón se pone rojo,
 *  como la ✕ de Windows.
 */


/*  @param {function} onClose  cerrar la ventana
 */
export default function CloseButton({ onClose }) {
    return (
        <>
            <span aria-hidden='true' className='w-px h-6 mx-0.5 bg-jx-regla2' />

            <button
                type='button'
                className='vt-icono vt-icono--fantasma'
                onClick={onClose}
                aria-label='Cerrar la ventana de la tablet'
                title='Cerrar'
            >
                <Icon name='close' />
            </button>
        </>
    );
}
