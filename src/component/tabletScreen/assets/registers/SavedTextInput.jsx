/*  UN TEXTO DE LO GUARDADO, CORREGIBLE: la mesa de una rotación o el número de ticket de un proceso
 *
 *  A diferencia de las celdas de la pestaña Mesas, no avisa en cada tecla: lo guardado se corrige de una
 *  vez. Enter o salir del campo lo confirma y Escape lo deja como estaba, igual que las horas
 *  (CellTimeInput). Solo avisa si cambió.
 *
 *  'key={value}' lo vuelve a montar cuando el valor cambia desde fuera, así el campo enseña siempre el de ahora.
 *  La letra la hereda de su celda ('font: inherit' en registers.css).
 */


/*  @param {string}   value     el valor guardado
 *  @param {function} onCommit  recibe el texto nuevo. Sin ella el campo solo se lee.
 *  @param {string}   label     lo que es, para los lectores de pantalla
 *  @param {boolean}  required  no se puede dejar vacío: vacío, vuelve a lo que había
 */
export default function SavedTextInput({ value = '', onCommit, label, required = false }) {

    // commit = «confirmar lo escrito»
    const commit = (input) => {
        const text = input.value.trim();
        if (!onCommit || text === value) return;
        if (required && !text) {
            input.value = value;
            return;
        }
        onCommit(text);
    };

    return (
        <input
            key={value}
            className='register-saved-input'
            type='text'
            defaultValue={value}
            readOnly={!onCommit}
            placeholder='-'
            aria-label={label}
            onBlur={event => commit(event.currentTarget)}
            onKeyDown={event => {
                if (event.key === 'Enter') event.currentTarget.blur();
                if (event.key === 'Escape') {
                    event.currentTarget.value = value;
                    event.currentTarget.blur();
                }
            }}
        />
    );
}
