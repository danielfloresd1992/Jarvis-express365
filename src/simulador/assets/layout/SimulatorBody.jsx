/*  EL CUERPO DEL SIMULADOR
 *
 *  Dos columnas: a la izquierda la pantalla de la tablet (ScreenArea) y a la derecha el panel de
 *  control (ControlPanel).
 */
export default function SimulatorBody({ children }) {
    return <div className='sim-cuerpo'>{children}</div>;
}
