import { useState, useEffect, useRef } from 'react';
import AddonField from '../inputs/AddonField.jsx';


/*  LA MESA Y EL TICKET DE LOS FORMULARIOS DE DEMORAS (propuesta «C · Línea de tiempo», elegida por el usuario)
 *
 *  Un campo con la etiqueta pegada ([ Mesa | 20 ]) y, debajo, la casilla para cuando no lo lleva. Antes la pregunta
 *  era «¿no se necesita número de mesa?» y, MARCADA, significaba justo lo contrario: que sí se necesitaba. Ahora la
 *  casilla dice lo que hace —«Sin número de mesa»— y, marcada, apaga el campo, que se queda punteado diciendo «Sin
 *  mesa». La mesa queda vacía, como antes.
 *
 *  Van en una fila con el plato (la clase 'ff-row' en el formulario).
 */


/*  @param {function} onChangeEvent  recibe el número de mesa ('' si no lleva)
 *  @param {boolean}  disabled       el plato no pide mesa (requiresTableNumber === false): no se pinta
 *  @param {string}   value
 */
export function TableInput({ onChangeEvent, disabled, value }) {

    // withoutTable = «se marcó Sin número de mesa»
    const [withoutTable, setWithoutTable] = useState(false);

    if (disabled) return null;

    return (
        <div className='ff-field'>
            <AddonField
                id='ff-mesa'
                label='Mesa'
                value={value}
                onChange={onChangeEvent}
                required
                off={withoutTable ? 'Sin mesa' : undefined}
            />
            <label className='ff-check'>
                <input
                    type='checkbox'
                    checked={withoutTable}
                    onChange={event => {
                        if (event.target.checked) onChangeEvent('');
                        setWithoutTable(event.target.checked);
                    }}
                />
                Sin número de mesa
            </label>
        </div>
    );
}




/*  @param {function} onChangeEvent  recibe el número de ticket ('' si no lleva)
 *  @param {string}   value
 */
export function TikekInput({ onChangeEvent, value }) {

    // withoutTicket = «se marcó Sin número de ticket»
    const [withoutTicket, setWithoutTicket] = useState(false);
    const inputRef = useRef(null);


    //  Es un campo de número: la rueda del ratón encima lo cambiaría sin querer al bajar por el formulario
    useEffect(() => {
        const preventScrollEvent = (event) => {
            event.preventDefault();
        };

        const input = inputRef.current;
        if (input) input.addEventListener('wheel', preventScrollEvent, { passive: false });

        return () => {
            if (input) input.removeEventListener('wheel', preventScrollEvent);
        };
    }, [inputRef]);


    return (
        <div className='ff-field'>
            <AddonField
                id='ff-ticket'
                label='Ticket'
                type='number'
                value={value}
                onChange={onChangeEvent}
                required
                inputRef={inputRef}
                off={withoutTicket ? 'Sin ticket' : undefined}
            />
            <label className='ff-check'>
                <input
                    type='checkbox'
                    checked={withoutTicket}
                    onChange={event => {
                        if (event.target.checked) onChangeEvent('');
                        setWithoutTicket(event.target.checked);
                    }}
                />
                Sin número de ticket
            </label>
        </div>
    );
}
