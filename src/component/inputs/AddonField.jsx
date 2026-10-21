import './formFields.css';


/*  UN CAMPO CON LA ETIQUETA PEGADA: [ Mesa | 20 ] (propuesta «C · Línea de tiempo», elegida por el usuario)
 *
 *  Para los datos cortos de un formulario —ticket, mesa, plato—, que van en una fila. La etiqueta es parte de la
 *  caja: al enfocarla se pone verde con ella. Apagado ('off'), la caja va punteada y dice por qué ('Sin mesa').
 */


/*  @param {string}   id           el del campo (único en la página)
 *  @param {string}   label        la etiqueta: 'Ticket', 'Mesa'…
 *  @param {string}   value        sin él (undefined), el campo guarda su valor solo y solo avisa con 'onChange' (lo
 *                                 que hace Pizza, que lo apunta en una ref). null cuenta como vacío.
 *  @param {function} onChange     recibe el valor nuevo
 *  @param {string}   type         'text' (por defecto) o 'number'
 *  @param {boolean}  mono         el valor en monoespaciada (números y horas). Por defecto, sí
 *  @param {boolean}  required
 *  @param {string}   off          opcional. Si viene, el campo está apagado y enseña este texto ('Sin mesa')
 *  @param {object}   inputRef     opcional. La ref del campo
 */
export default function AddonField({ id, label, value, onChange, type = 'text', mono = true, required = false, off, inputRef, placeholder }) {

    // controlled = «el valor lo lleva quien lo pinta» (viene 'value', aunque sea null, o está apagado)
    const controlled = value !== undefined || Boolean(off);

    return (
        <div className={`ff-addon ${off ? 'ff-addon--off' : ''}`}>
            <label className='ff-addon__label' htmlFor={id}>{label}</label>
            <input
                id={id}
                ref={inputRef}
                className={`ff-addon__control ${mono && !off ? 'ff-mono' : ''}`}
                type={off ? 'text' : type}
                {...(controlled ? { value: off ?? value ?? '' } : {})}
                required={required && !off}
                disabled={Boolean(off)}
                placeholder={placeholder}
                autoComplete='off'
                onChange={event => onChange(event.target.value)}
            />
        </div>
    );
}


/*  AddonSelect = «lo mismo con una lista»: [ Plato | plato fuerte ▾ ]. Las opciones van como hijos (<option>).
 *
 *  @param {string}   id
 *  @param {string}   label
 *  @param {string}   value
 *  @param {function} onChange   recibe el valor elegido
 *  @param {boolean}  required
 */
export function AddonSelect({ id, label, value, onChange, required = false, children }) {
    return (
        <div className='ff-addon ff-addon--select'>
            <label className='ff-addon__label' htmlFor={id}>{label}</label>
            <select
                id={id}
                className='ff-addon__control'
                value={value ?? ''}
                required={required}
                onChange={event => onChange(event.target.value)}
            >
                {children}
            </select>
            <svg className='ff-addon__chevron' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <path d='M6 9l6 6 6-6' />
            </svg>
        </div>
    );
}
