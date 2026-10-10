import { useId } from 'react';
import { esNumero } from '../../formato.js';


/*  UN DESLIZADOR DEL PANEL
 *
 *  Su etiqueta, el deslizador y su valor escrito al lado. Debajo, si se le da, una pista corta que
 *  también lee un lector de pantalla.
 */


/*  @param {string}   label     la etiqueta
 *  @param {number}   value     el valor
 *  @param {number}   min, max  los límites
 *  @param {number}   step      el paso
 *  @param {function} onChange  recibe el valor nuevo, como número
 *  @param {function} format    cómo se escribe el valor (por omisión, tal cual)
 *  @param {string}   help      lo que sale al pasar el ratón
 *  @param {string}   hint      la pista de debajo
 */
export default function Slider({ label, value, min, max, step = 1, onChange, format = number => number, help, hint }) {
    const id = useId();

    //  Un valor que no sea un número (un ajuste que el motor cargado no conoce) no puede dejar el
    //  control sin valor: React lo daría por «no controlado».
    const safe = esNumero(value) ? value : min;

    return (
        <>
            <div className='sim-fila' title={help}>
                <label htmlFor={id}>{label}</label>
                <input
                    id={id} type='range' min={min} max={max} step={step} value={safe}
                    onChange={event => onChange(Number(event.target.value))}
                    aria-valuetext={String(format(safe))}
                    aria-describedby={hint ? `${id}-pista` : undefined}
                />
                <output className='sim-fila__valor' htmlFor={id}>{format(safe)}</output>
            </div>
            {hint && <p id={`${id}-pista`} className='sim-pista'>{hint}</p>}
        </>
    );
}
