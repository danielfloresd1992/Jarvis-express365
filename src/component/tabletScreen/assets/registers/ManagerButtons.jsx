/*  LOS BOTONES DE LOS GERENTES, EN UNA ROTACIÓN
 *
 *  Cada clic apunta un toque de ese gerente en la rotación, con la hora. La lista sale de managers.js.
 *
 *  Relleno, borde y letra van en 'style': la regla global 'button {}' de index.css gana a las
 *  utilidades de Tailwind en esas tres cosas (los colores y el ':hover' sí funcionan con clases).
 */


// BUTTON_WIDTH = «lo que mide cada botón». Con el hueco entre ellos, cada uno ocupa MANAGER_BUTTON_SPACE (columns.js).
const BUTTON_WIDTH = 26;


/*  @param {Array}    managers  los botones: [{ id, ref, name, label, title }] (managerButtons)
 *  @param {function} onTouch   recibe el gerente pulsado
 */
export default function ManagerButtons({ managers, onTouch }) {
    return managers.map(manager => (
        <button
            key={manager.id}
            type='button'
            onClick={() => onTouch(manager)}
            title={manager.title}
            aria-label={manager.title}
            className='flex shrink-0 items-center justify-center bg-jx-tarjeta text-jx-tinta2 hover:bg-jx-hundido hover:text-jx-tinta transition-colors'
            style={{ width: BUTTON_WIDTH, height: 22, padding: 0, border: '1px solid var(--color-jx-regla2)', borderRadius: 6, fontSize: 10, fontWeight: 700, lineHeight: 1 }}
        >
            {manager.label}
        </button>
    ));
}
