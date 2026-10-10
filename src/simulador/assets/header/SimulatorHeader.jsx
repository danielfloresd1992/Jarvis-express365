/*  LA BARRA DE ARRIBA DEL SIMULADOR
 *
 *  El título a la izquierda y, a la derecha, lo que se le pase: cómo va la lectura de la IA
 *  (AiReadingStatus), si la ventana de la tablet está conectada (TabletLinkStatus) y el reloj de la
 *  tablet simulada (TabletClock).
 *
 *  El subtítulo ya no dice «herramienta de desarrollo»: desde que la simulación está también en la
 *  aplicación publicada, eso sería mentira. Lo que SÍ hay que dejar claro, y ahora más que antes, es
 *  que nada de aquí sale hacia Jarvis.
 */
export default function SimulatorHeader({ children }) {
    return (
        <header className='sim-barra'>
            <div className='sim-barra__titulo'>
                <h1>Simulador de Toast · pantalla de cocina</h1>
                <div className='sim-barra__sub'>Tickets de mentira, para probar la lectura sin tablet. Nada de lo que pasa aquí se guarda ni llega a Jarvis.</div>
            </div>

            <span className='sim-hueco' />

            {children}
        </header>
    );
}
