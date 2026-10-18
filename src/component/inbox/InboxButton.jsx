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
                    <rect x='3' y='3' width='18' height='18' rx='2' />
                    <circle cx='9' cy='9' r='2' />
                    <path d='m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21' />
                </svg>
                <span className='nav-bar__label'>Imágenes</span>
                {count > 0 && <span className='nav-bar__badge' aria-label={`${count} sin revisar`}>{count}</span>}
            </button>
        </li>
    );
}
