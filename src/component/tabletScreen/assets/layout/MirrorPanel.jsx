/*  EL PANEL DE ARRIBA: el espejo de la tablet
 *
 *  Dentro van la barra de título, el aviso del envío, la imagen y la barra de zoom.
 *
 *  El mínimo va en píxeles, pero acotado en porcentaje: la carcasa instalada abre hoy la ventana a
 *  400×300, y 160 + 7 + 140 no caben ahí. Sin el tope, el register se recortaba y el divisor no se
 *  podía mover.
 *
 *  El div de dentro lleva 'relative' porque el aviso del envío (SendNotice) se coloca contra él. Sin
 *  borde ni esquinas propias: el marco lo pone la ventana, y un segundo borde aquí dibujaría una
 *  línea doble justo encima del divisor.
 */


// MIRROR_MIN_HEIGHT = «el alto mínimo del espejo»
const MIRROR_MIN_HEIGHT = 'min(160px, 45%)';


/*  @param {number} height  cuánto le toca del alto de la ventana, en porcentaje (lo decide el divisor)
 */
export default function MirrorPanel({ height, children }) {
    return (
        <div
            className='w-full flex flex-col overflow-hidden'
            style={{ height: `${height}%`, minHeight: MIRROR_MIN_HEIGHT }}
        >
            <div className='relative w-full h-full min-h-0 flex flex-col overflow-hidden bg-jx-lienzo'>
                {children}
            </div>
        </div>
    );
}
