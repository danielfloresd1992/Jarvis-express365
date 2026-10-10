/*  EXPORTAR: llevarse el registro —las mesas y sus procesos— a una hoja de cálculo
 *
 *  Su aspecto va en la clase 'vt-boton' de index.css. El tamaño va en 'style' y no en clases: la
 *  regla global 'button {}' de index.css no está en ninguna capa y le gana a las utilidades.
 */


/*  @param {function} onExport  descargar la hoja
 */
export default function ExportButton({ onExport }) {
    return (
        <button
            type='button'
            onClick={onExport}
            className='vt-boton'
            style={{ padding: '3px 10px', fontSize: '10px' }}
            aria-label='Exportar el registro a una hoja de cálculo'
            title='Descarga el registro en una hoja de cálculo, con el establecimiento y la fecha'
        >
            Exportar
        </button>
    );
}
