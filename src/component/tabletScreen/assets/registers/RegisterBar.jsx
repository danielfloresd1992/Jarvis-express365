/*  LA BARRA DE LOS REGISTERS
 *
 *  La franja de encima de la tabla, como la barra de una aplicación de escritorio. Dentro van, de
 *  izquierda a derecha: las pestañas «Mesas / Registros» (RegisterViewTabs), cómo va la lectura
 *  (ReadingStatus) y los botones de exportar y limpiar, solo con icono (ExportButton, ClearButton).
 */


export default function RegisterBar({ children }) {
    return (
        <div className='shrink-0 flex flex-wrap items-center gap-1.5 px-2 py-1.5 bg-jx-panel border-b border-jx-regla2' style={{ WebkitAppRegion: 'no-drag' }}>
            {children}
        </div>
    );
}
