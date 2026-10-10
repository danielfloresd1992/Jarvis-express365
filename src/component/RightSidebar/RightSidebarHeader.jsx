/*  LA CABECERA DEL PANEL DE LA DERECHA: el título y el botón de cerrar
 */


/*  @param {string}   title    el título
 *  @param {function} onClose  cerrar el panel
 */
function RightSidebarHeader({ title, onClose }) {
    return (
        <header className='right-sidebar__header'>
            <h2 className='right-sidebar__title'>{title}</h2>

            <button type='button' className='right-sidebar__close' onClick={onClose} aria-label={`Cerrar ${title}`} title='Cerrar'>
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                    <line x1='6' y1='6' x2='18' y2='18' />
                    <line x1='18' y1='6' x2='6' y2='18' />
                </svg>
            </button>
        </header>
    );
}

export default RightSidebarHeader;
