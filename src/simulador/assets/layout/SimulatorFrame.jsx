/*  EL MARCO DEL SIMULADOR
 *
 *  De arriba abajo: la barra con el título (SimulatorHeader), el cuerpo con la pantalla y el panel
 *  (SimulatorBody) y, debajo de todo, el registro de la simulación (LogSection).
 */
export default function SimulatorFrame({ children }) {
    return <div className='sim-app'>{children}</div>;
}
