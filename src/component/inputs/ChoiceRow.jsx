import './formFields.css';


/*  UNA PREGUNTA QUE HAY QUE CONTESTAR: «Sí» o «No» (propuesta «C · Línea de tiempo», elegida por el usuario)
 *
 *  Como el interruptor (SwitchRow), una fila con la pregunta a la izquierda; pero aquí no hay respuesta por defecto
 *  —hay que elegir una—, así que son dos botones de opción en forma de píldora. El elegido, en tinta. Son radios de
 *  verdad, con 'required': el formulario no se envía sin contestar.
 *
 *  No guarda nada: avisa con 'onChange' (Pizza lo apunta en una ref).
 *
 *  @param {string}   name      el nombre del grupo (único en la página)
 *  @param {string}   title     la pregunta: 'Apariencia', 'Es desechada'…
 *  @param {function} onChange  recibe el valor elegido
 *  @param {Array}    options   las opciones: [{ value, label }]. Por defecto, Sí (✅) y No (❌), los valores de siempre
 *  @param {boolean}  required  por defecto, sí
 */
export default function ChoiceRow({ name, title, onChange, options = [{ value: '✅', label: 'Sí' }, { value: '❌', label: 'No' }], required = true }) {

    const titleId = `${name}-pregunta`;

    return (
        <div className='ff-choice' role='radiogroup' aria-labelledby={titleId}>
            <span className='ff-choice__title' id={titleId}>{title}</span>
            <span className='ff-choice__options'>
                {
                    options.map(option => (
                        <label key={option.value} className='ff-choice__option'>
                            <input
                                type='radio'
                                name={name}
                                value={option.value}
                                required={required}
                                onChange={event => onChange(event.target.value)}
                            />
                            <span>{option.label}</span>
                        </label>
                    ))
                }
            </span>
        </div>
    );
}
