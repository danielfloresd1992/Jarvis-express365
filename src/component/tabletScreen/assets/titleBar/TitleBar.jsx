/*  LA BARRA DE TÍTULO
 *
 *  La ventana flotante no tiene marco, así que esta barra hace de barra de título: 'drag' le dice a
 *  Electron que arrastrando aquí se mueve la ventana entera.
 *
 *  Dentro van, de izquierda a derecha: el punto de estado (StatusDot), el nombre del local con el
 *  estado de la tablet y de la IA (TabletStatus), qué captura se está leyendo (ReadingIndicator) y los
 *  botones (TitleBarActions).
 */


/*  @param {function} onMouseDown  para arrastrar la ventana. Solo hace falta fuera de Electron,
 *                                 donde la ventana no se mueve sola.
 */
export default function TitleBar({ onMouseDown, children }) {
    return (
        <header
            className='sticky top-0 z-10 h-12 shrink-0 flex items-center gap-2.5 pl-3 pr-1.5 bg-jx-panel border-b border-jx-regla2 cursor-move select-none'
            style={{ WebkitAppRegion: 'drag' }}
            onMouseDown={onMouseDown}
        >
            {children}
        </header>
    );
}
