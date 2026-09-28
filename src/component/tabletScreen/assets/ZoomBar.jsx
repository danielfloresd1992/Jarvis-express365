import Icono from './Icono.jsx';


/*  LA BARRA DE ZOOM
 *
 *  La franja de debajo del espejo: alejar, el porcentaje y acercar, juntos en un
 *  grupo; a su lado, la pista de arrastre; y al final, solo en desarrollo, el botón
 *  de guardar la captura y sus tiras.
 *
 *  Solo pinta. El zoom lo guarda TabletScreen, porque también lo necesita el espejo
 *  para dibujar la imagen y porque se recuerda entre sesiones.
 *
 *  Los límites viven AQUÍ y se exportan: son del zoom, y tenerlos en dos archivos
 *  acabaría con un botón que se apaga en un número y un `Math.min` que corta en otro.
 */


// ZOOM_MIN = «lo más que se puede alejar», en porcentaje
const ZOOM_MIN = 50;

// ZOOM_MAX = «lo más que se puede acercar», en porcentaje
const ZOOM_MAX = 400;

// ZOOM_PASO = «cuánto cambia el zoom en cada clic»
const ZOOM_PASO = 25;


/*  @param {number}   zoom                 el ancho de la imagen, en porcentaje
 *  @param {boolean}  canMove              la imagen se sale de la vista y se puede arrastrar
 *  @param {boolean}  connected            la tablet está conectada
 *  @param {function} zoomCallback         recibe cuánto cambiar el zoom (+ o −)
 *  @param {function} resetZoomCallback    volver al 100 %
 *  @param {function} saveFramesCallback   guardar el PNG y sus tiras (solo en desarrollo)
 */
export default function ZoomBar({
    zoom,
    canMove,
    connected,
    zoomCallback,
    resetZoomCallback,
    saveFramesCallback
}) {


    return (
        //  'no-drag' porque esta franja está dentro de una ventana sin marco: en una
        //  zona arrastrable, los botones dejarían de responder al clic.
        <div
            className='h-10 shrink-0 flex items-center gap-2 px-2 bg-[#021a38] select-none'
            style={{ WebkitAppRegion: 'no-drag' }}
        >


            {/*  LOS TRES CONTROLES, JUNTOS
                 Alejar, el porcentaje —un clic vuelve al 100 %— y acercar. Van en un
                 grupo porque son una sola cosa, y así se lee igual con un lector de
                 pantalla.  */}
            <div className='vt-zoom' role='group' aria-label='Zoom de la imagen'>

                <button
                    type='button'
                    className='vt-zoom__paso'
                    onClick={() => zoomCallback(-ZOOM_PASO)}
                    disabled={zoom <= ZOOM_MIN}
                    aria-label='Alejar'
                    title='Alejar'
                >
                    <Icono nombre='alejar' tamano={16} />
                </button>

                <button
                    type='button'
                    className='vt-zoom__valor'
                    onClick={resetZoomCallback}
                    title='Volver al 100 %'
                >
                    {zoom} %
                </button>

                <button
                    type='button'
                    className='vt-zoom__paso'
                    onClick={() => zoomCallback(ZOOM_PASO)}
                    disabled={zoom >= ZOOM_MAX}
                    aria-label='Acercar'
                    title='Acercar'
                >
                    <Icono nombre='acercar' tamano={16} />
                </button>

            </div>


            {/*  LA PISTA DE ARRASTRE, solo cuando de verdad hay imagen fuera de la vista:
                 decirlo cuando no sobra nada que ver sería mentir.  */}
            {
                canMove && (
                    <span className='hidden min-[480px]:flex items-center gap-1.5 text-[11px] text-[#8aa0bb]'>
                        <Icono nombre='mover' tamano={14} />
                        Arrastra la imagen para moverte
                    </span>
                )
            }


            {/*  GUARDAR LA CAPTURA Y SUS TIRAS
                 Solo en desarrollo: es una herramienta para comparar modelos, no algo
                 que el monitorista necesite ver.  */}
            {
                import.meta.env.DEV && (
                    <button
                        type='button'
                        className='vt-icono vt-icono--pequeno ml-auto'
                        onClick={saveFramesCallback}
                        disabled={!connected}
                        aria-label='Guardar la captura y sus tiras'
                        title='Guarda el PNG completo y las tiras tal como se le mandan al modelo, para el banco de pruebas'
                    >
                        <Icono nombre='guardar' tamano={16} />
                    </button>
                )
            }

        </div>
    );
}


export { ZOOM_MIN, ZOOM_MAX, ZOOM_PASO };
