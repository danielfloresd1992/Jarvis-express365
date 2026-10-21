import './formFields.css';


/*  UNA PREGUNTA DE SÍ O NO: un interruptor con su explicación (propuesta «C · Línea de tiempo», elegida por el usuario)
 *
 *  Sustituye a las casillas sueltas con un «Sí / No» gigante debajo. La frase dice lo que pasa al encenderlo —no
 *  pregunta al revés—, y debajo, en pequeño, qué cambia en el formulario. Encendido, la fila entera se pone verde.
 *
 *  @param {string}   id           el de la casilla (único en la página)
 *  @param {string}   title        lo que significa encenderlo: 'Sin primera atención aún (aviso)'
 *  @param {string}   description  opcional. Qué cambia
 *  @param {boolean}  checked
 *  @param {function} onChange     recibe true o false
 */
export default function SwitchRow({ id, title, description, checked, onChange }) {
    return (
        <label className='ff-switch-row' htmlFor={id}>
            <span className='ff-switch-row__text'>
                <span className='ff-switch-row__title'>{title}</span>
                {description && <span className='ff-switch-row__description'>{description}</span>}
            </span>
            <input
                id={id}
                className='ff-switch-row__input'
                type='checkbox'
                role='switch'
                checked={checked}
                onChange={event => onChange(event.target.checked)}
            />
            <span className='ff-switch' aria-hidden='true' />
        </label>
    );
}
