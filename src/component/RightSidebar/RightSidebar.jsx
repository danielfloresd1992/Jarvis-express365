import './style.css';
import RightSidebarHeader from './RightSidebarHeader.jsx';


/*  EL PANEL LATERAL DE LA DERECHA
 *
 *  Donde se abren los formularios de reportar —Novedades, Demoras, Producción y Estándares— sin
 *  quitar la bienvenida del centro. Qué formulario va dentro lo decide Main.jsx: este componente
 *  solo pone el marco, la cabecera con el título y el botón de cerrar, y el hueco que se desplaza.
 */


/*  @param {string}   title    el título de la cabecera
 *  @param {function} onClose  cerrar el panel
 */
function RightSidebar({ title, onClose, children }) {
    return (
        <aside className='right-sidebar' aria-label={title}>
            <RightSidebarHeader title={title} onClose={onClose} />

            <div className='right-sidebar__body'>
                {children}
            </div>
        </aside>
    );
}

export default RightSidebar;
