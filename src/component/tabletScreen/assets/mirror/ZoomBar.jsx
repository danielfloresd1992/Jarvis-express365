/*  LA BARRA DE ZOOM
 *
 *  La franja de debajo del espejo. Dentro van el control del zoom (ZoomControl), la pista de
 *  arrastre (DragHint) y, solo en desarrollo, el botón de guardar la captura (SaveFramesButton).
 *
 *  'no-drag' porque esta franja está dentro de una ventana sin marco: en una zona arrastrable, los
 *  botones dejarían de responder al clic.
 */


export default function ZoomBar({ children }) {
    return (
        <div
            className='h-10 shrink-0 flex items-center gap-2 px-2 bg-jx-panel select-none'
            style={{ WebkitAppRegion: 'no-drag' }}
        >
            {children}
        </div>
    );
}
