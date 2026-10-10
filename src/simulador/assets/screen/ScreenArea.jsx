/*  LA ZONA DE LA PANTALLA
 *
 *  Encima, el mando de empezar y dejar de recibir (SimulationControl) y los avisos (ManualKitchenBanner,
 *  ShiftOverBanner); debajo, la pantalla de Toast (TabletCanvas).
 */
export default function ScreenArea({ children }) {
    return <main className='sim-pantalla'>{children}</main>;
}
