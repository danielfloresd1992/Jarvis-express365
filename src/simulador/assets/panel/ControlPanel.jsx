/*  EL PANEL DE CONTROL
 *
 *  La columna de la derecha. Dentro van sus secciones, cada una en su archivo y en este orden: Turno,
 *  Crear un ticket a mano, Tiempos máximos y demoras, Cocina, Quién lee la pantalla, Pantalla de Toast
 *  y Escenas.
 */
export default function ControlPanel({ children }) {
    return (
        <aside className='sim-panel' aria-label='Controles de la simulación'>
            {children}
        </aside>
    );
}
