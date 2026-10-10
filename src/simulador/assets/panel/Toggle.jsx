/*  UN INTERRUPTOR DEL PANEL: una casilla con su rótulo
 */


/*  @param {string}   label     el rótulo
 *  @param {boolean}  value     encendido o apagado
 *  @param {function} onChange  recibe true o false
 *  @param {string}   help      lo que sale al pasar el ratón
 */
export default function Toggle({ label, value, onChange, help }) {
    return (
        <div className='sim-fila' title={help}>
            <label className='sim-interruptor'>
                <input type='checkbox' checked={value === true} onChange={event => onChange(event.target.checked)} />
                {label}
            </label>
        </div>
    );
}
