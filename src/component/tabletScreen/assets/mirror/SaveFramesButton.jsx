import Icon from '../Icon.jsx';


/*  GUARDAR LA CAPTURA
 *
 *  Solo se pinta en desarrollo: es una herramienta para comparar modelos, no algo que el
 *  monitorista necesite ver. Guarda la misma imagen que recibe el modelo: la captura entera.
 */


/*  @param {boolean}  disabled  no hay tablet conectada
 *  @param {function} onSave    guardar el PNG
 */
export default function SaveFramesButton({ disabled, onSave }) {
    return (
        <button
            type='button'
            className='vt-icono vt-icono--pequeno ml-auto'
            onClick={onSave}
            disabled={disabled}
            aria-label='Guardar la captura'
            title='Guarda la captura tal como se le manda al modelo, para el banco de pruebas'
        >
            <Icon name='save' size={16} />
        </button>
    );
}
