/*  LOS BOTONES DE LOS GERENTES, EN UNA ROTACIÓN
 *
 *  Cada clic apunta un toque de ese gerente en la rotación, con la hora. La lista sale de managers.js.
 *
 *  Los gerentes van en verde y los asistentes —los que su texto empieza por «A»— en ocre. Su aspecto
 *  va en las clases 'register-manager…' de registers.css.
 */


/*  @param {Array}    managers  los botones: [{ id, ref, name, label, title }] (managerButtons)
 *  @param {boolean}  dimmed    la fila no tiene mesa: van apagados, y pulsarlos solo pide el número
 *  @param {function} onTouch   recibe el gerente pulsado
 */
export default function ManagerButtons({ managers, dimmed, onTouch }) {
    return managers.map(manager => (
        <button
            key={manager.id}
            type='button'
            onClick={() => onTouch(manager)}
            title={manager.title}
            aria-label={`Apuntar un toque de ${manager.title}`}
            className={`register-manager register-manager--${manager.label.startsWith('A') ? 'a' : 'g'} ${dimmed ? 'register-manager--off' : ''}`}
        >
            {manager.label}
        </button>
    ));
}
