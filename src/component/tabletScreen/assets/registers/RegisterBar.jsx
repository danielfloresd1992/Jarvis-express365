/*  LA BARRA DE LOS REGISTERS
 *
 *  La franja de encima de la tabla. Dentro van, de izquierda a derecha: los botones de exportar y
 *  limpiar (ExportButton, ClearButton) y cómo va la lectura (ReadingStatus).
 *
 *  Los botones van juntos y a la izquierda del estado porque son lo único de aquí que hace algo; el
 *  estado solo informa.
 */


export default function RegisterBar({ children }) {
    return (
        <div className='shrink-0 flex items-center gap-1 px-1 pt-1 bg-jx-panel' style={{ WebkitAppRegion: 'no-drag' }}>
            {children}
        </div>
    );
}
