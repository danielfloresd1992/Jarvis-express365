/*  EXPORTAR: llevarse el registro —las mesas y sus procesos— a una hoja de cálculo
 *
 *  Solo el icono, como en una barra de escritorio: lo que hace se lee al pasar el ratón. Su aspecto va
 *  en la clase 'register-icon-button' de registers.css.
 */


/*  @param {function} onExport  descargar la hoja
 */
export default function ExportButton({ onExport }) {
    return (
        <button
            type='button'
            onClick={onExport}
            className='register-icon-button'
            aria-label='Exportar el registro a una hoja de cálculo'
            title='Exportar: descarga el registro en una hoja de cálculo, con el establecimiento y la fecha'
        >
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <path d='M12 3v12' />
                <path d='m7 10 5 5 5-5' />
                <path d='M5 21h14' />
            </svg>
        </button>
    );
}
