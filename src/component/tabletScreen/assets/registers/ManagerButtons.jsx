import { touchCounts } from './managers.js';


/*  LOS BOTONES DE LOS GERENTES, EN UNA ROTACIÓN
 *
 *  Cada clic apunta un toque de ese gerente en la rotación, con la hora. La lista sale de managers.js.
 *
 *  Los gerentes van en verde y los asistentes —los que su texto empieza por «A»— en ocre. Son teclas con
 *  relieve, y cada una lleva en su esquina cuántos toques ha dado ese gerente en la mesa (pedido del
 *  usuario). Su aspecto va en las clases 'register-manager…' de registers.css.
 */


/*  @param {Array}    managers  los botones: [{ id, ref, name, label, title }] (managerButtons)
 *  @param {Array}    touches   opcional. Los toques de la rotación, para la burbuja de cada gerente; sin
 *                              ellos no sale ninguna (en Registros, donde la lista ya está a la vista)
 *  @param {boolean}  dimmed    la fila no tiene mesa: van apagados, y pulsarlos solo pide el número
 *  @param {function} onTouch   recibe el gerente pulsado
 */
export default function ManagerButtons({ managers, touches = [], dimmed, onTouch }) {

    // counts = «cuántos toques lleva cada gerente», en el orden de 'managers'
    const counts = touchCounts(touches, managers);

    return managers.map((manager, index) => (
        <button
            key={manager.id}
            type='button'
            onClick={() => onTouch(manager)}
            title={counts[index] > 0 ? `${manager.title} · ${counts[index] === 1 ? '1 toque' : `${counts[index]} toques`} en esta mesa` : manager.title}
            aria-label={`Apuntar un toque de ${manager.title}${counts[index] > 0 ? ` (lleva ${counts[index]})` : ''}`}
            className={`register-manager register-manager--${manager.label.startsWith('A') ? 'a' : 'g'} ${dimmed ? 'register-manager--off' : ''}`}
        >
            {manager.label}
            {counts[index] > 0 && <span className='register-manager__count tabular-nums' aria-hidden='true'>{counts[index]}</span>}
        </button>
    ));
}
