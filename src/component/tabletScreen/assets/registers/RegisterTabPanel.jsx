/*  UNA PESTAÑA DEL REGISTER: Mesas o Registros
 *
 *  Las dos pestañas están SIEMPRE montadas: cambiar de una a otra solo las enseña o las oculta. Así la
 *  que no se ve conserva lo suyo —lo desplegado, un guardado a medias, hasta dónde se había bajado— y
 *  no vuelve a montarse desde cero al volver a ella.
 *
 *  A la vista va con 'display: contents': la envoltura no crea caja propia, y su contenido sigue siendo
 *  un hijo más de la columna flexible de Registers (el 'flex-1' de la tabla se queda con el alto que
 *  sobra, igual que sin envoltura). Oculta va con 'display: none': montada, pero sin ocupar nada.
 *
 *  @param {boolean} visible   si es la pestaña elegida
 *  @param {node}    children  la pestaña
 */
export default function RegisterTabPanel({ visible, children }) {
    return (
        <div style={{ display: visible ? 'contents' : 'none' }}>
            {children}
        </div>
    );
}
