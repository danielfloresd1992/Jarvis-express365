/*  ¿ESTÁ CONECTADA LA VENTANA DE LA TABLET?
 *
 *  Lo dice un punto que se enciende y una frase. Mientras está conectada en modo simulación, la
 *  ventana de la tablet pide una captura varias veces por segundo: si hace un rato que no pide
 *  ninguna, es que no está.
 */


/*  @param {boolean} alive     la ventana de la tablet está pidiendo capturas ahora mismo
 *  @param {number}  captures  cuántas lleva pedidas
 */
export default function TabletLinkStatus({ alive, captures }) {
    return (
        <span className={`sim-estado ${alive ? 'sim-estado--vivo' : ''}`} title={`La ventana de la tablet pide una captura varias veces por segundo mientras está conectada en modo simulación. Lleva ${captures}.`}>
            <span className='sim-estado__punto' />
            {alive ? 'Ventana de la tablet conectada' : 'Esperando a la ventana de la tablet'}
        </span>
    );
}
