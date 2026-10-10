import StatusDot from '../tabletScreen/assets/titleBar/StatusDot.jsx';


/*  LA TABLET ESTÁ FUERA, EN SU VENTANA
 *
 *  Mientras la ventana flotante está abierta, la tablet vive allí y aquí no se monta nada (ver
 *  tabletScreen/tablet.provider.jsx). En su hueco queda este aviso, con un botón para traerla de
 *  vuelta.
 *
 *  El punto va hueco: desde aquí no se sabe ni se toca cómo está la tablet; eso lo dice su ventana.
 */


/*  @param {function} onBringBack  traer la tablet de vuelta a la barra
 */
export default function TabletAway({ onBringBack }) {
    return (
        <section className='tablet-dock tablet-dock--away' aria-label='Tablet'>

            <header className='tablet-dock__header'>
                <StatusDot />
                <span className='tablet-dock__title'>Tablet</span>
            </header>

            <p className='tablet-dock__away-text'>
                Está abierta en su propia ventana.
            </p>

            <button type='button' className='tablet-dock__back' onClick={onBringBack}>
                Traerla aquí
            </button>

        </section>
    );
}
