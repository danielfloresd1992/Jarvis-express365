/*  LOS BOTONES DEL REGISTRO
 *
 *  La tolerancia (cuántos segundos de desvío se dan por buenos), exportar en CSV, JSON o PDF, y limpiar
 *  el registro de las tarjetas que ya no están en pantalla.
 */


/*  @param {number}   toleranceS         los segundos de desvío que se dan por buenos
 *  @param {function} onToleranceChange  recibe la tolerancia nueva, en segundos
 *  @param {boolean}  empty              el registro no tiene ninguna fila: no hay nada que exportar
 *  @param {function} onExport           recibe 'csv', 'json' o 'pdf'
 *  @param {function} onClear            limpiar el registro
 */
export default function LogActions({ toleranceS, onToleranceChange, empty, onExport, onClear }) {
    return (
        <div className='sim-registro__acciones'>
            <label className='sim-etiqueta' htmlFor='sim-tolerancia' title='Cuántos segundos puede desviarse la toma de orden inferida para contarla como acierto'>Tolerancia</label>
            <input id='sim-tolerancia' type='number' min={0} max={600} value={toleranceS} onChange={event => onToleranceChange(Number(event.target.value) || 0)} />

            <button type='button' className='sim-boton sim-boton--chico' onClick={() => onExport('csv')} disabled={empty} title='Todas las columnas, también las que aquí no se pintan'>Exportar CSV</button>
            <button type='button' className='sim-boton sim-boton--chico' onClick={() => onExport('json')} disabled={empty}>JSON</button>
            <button type='button' className='sim-boton sim-boton--chico' onClick={() => onExport('pdf')} disabled={empty} title='Abre el informe de aciertos y desaciertos para guardarlo como PDF'>PDF</button>
            <button type='button' className='sim-boton sim-boton--chico sim-boton--peligro' onClick={onClear} title='Quita del registro las tarjetas que ya no están en pantalla'>Limpiar</button>
        </div>
    );
}
