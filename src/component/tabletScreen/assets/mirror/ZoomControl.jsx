import Icon from '../Icon.jsx';


/*  EL CONTROL DEL ZOOM
 *
 *  Alejar, el porcentaje —un clic vuelve al 100 %— y acercar. Van en un grupo porque son una sola
 *  cosa, y así se lee igual con un lector de pantalla.
 *
 *  Solo pinta. El zoom y sus límites viven en hook/useZoom.jsx.
 */


/*  @param {number}   zoom        el ancho de la imagen, en porcentaje
 *  @param {boolean}  canZoomIn   todavía se puede acercar
 *  @param {boolean}  canZoomOut  todavía se puede alejar
 *  @param {function} onZoomIn    acercar un paso
 *  @param {function} onZoomOut   alejar un paso
 *  @param {function} onReset     volver al 100 %
 */
export default function ZoomControl({ zoom, canZoomIn, canZoomOut, onZoomIn, onZoomOut, onReset }) {
    return (
        <div className='vt-zoom' role='group' aria-label='Zoom de la imagen'>

            <button
                type='button'
                className='vt-zoom__paso'
                onClick={onZoomOut}
                disabled={!canZoomOut}
                aria-label='Alejar'
                title='Alejar'
            >
                <Icon name='zoomOut' size={16} />
            </button>

            <button
                type='button'
                className='vt-zoom__valor'
                onClick={onReset}
                title='Volver al 100 %'
            >
                {zoom} %
            </button>

            <button
                type='button'
                className='vt-zoom__paso'
                onClick={onZoomIn}
                disabled={!canZoomIn}
                aria-label='Acercar'
                title='Acercar'
            >
                <Icon name='zoomIn' size={16} />
            </button>

        </div>
    );
}
