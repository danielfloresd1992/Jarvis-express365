import { isMobile, isTablet } from 'react-device-detect';
import { useInbox } from './inboxContext.jsx';


/*  EL BOTÓN DE LA BANDEJA DE IMÁGENES DEL TOAST, EN LA BARRA DE ARRIBA
 *
 *  Abre y cierra el panel de la bandeja (images_inbox.jsx) y dice cuántas imágenes tiene. Va en la barra
 *  como los demás accesos, y no flotando sobre la página: flotando tapaba la esquina de arriba de lo que
 *  hubiera debajo, y el centro tenía que dejarle un hueco. Trae su propio <li>, como TabletButton.
 *
 *  No sale en el teléfono, igual que el panel; ni fuera de InboxProvider, donde no hay panel que abrir.
 *  En una ventana estrecha el panel se esconde (App.css), y el botón con él ('nav-bar__inbox').
 */
export default function InboxButton() {

    const inbox = useInbox();

    if ((isMobile && !isTablet) || !inbox) return null;

    const { collapsed, setCollapsed, count } = inbox;

    return (
        <li className='nav-bar__inbox'>
            <button
                type='button'
                className='nav-bar__action-btn'
                onClick={() => setCollapsed(current => !current)}
                aria-expanded={!collapsed}
                title='Bandeja de imágenes del Toast POS'
            >
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                    <polyline points='22 12 16 12 14 15 10 15 8 12 2 12' />
                    <path d='M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z' />
                </svg>
                Imágenes
                {count > 0 && <span className='nav-bar__badge' aria-label={`${count} sin revisar`}>{count}</span>}
            </button>
        </li>
    );
}
