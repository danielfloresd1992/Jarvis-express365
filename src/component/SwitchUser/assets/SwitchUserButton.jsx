import UserAvatar from './UserAvatar.jsx';


/*  «CAMBIAR DE USUARIO», en el centro de la barra de arriba
 *
 *  Una píldora con la cara de quien tiene la sesión, para que se vea de un vistazo quién está, y el nombre de la
 *  acción. En una ventana estrecha se queda la cara y las flechas (la regla de '.nav-bar__label' en App.css); el
 *  'title' dice entonces de quién es la sesión y qué hace.
 *
 *  Solo sale en un local con Mesas (switchUser.controller.jsx).
 */


/*  @param {object}   user       quién tiene la sesión (state.user)
 *  @param {function} onClick    abrir el formulario
 *  @param {object}   buttonRef  para devolverle el foco al cerrar el formulario
 */
export default function SwitchUserButton({ user, onClick, buttonRef }) {
    const fullName = `${user?.name ?? ''} ${user?.surName ?? ''}`.trim();

    return (
        <button
            ref={buttonRef}
            type='button'
            className='nav-bar__action-btn nav-bar__action-btn--switch-user'
            onClick={onClick}
            aria-haspopup='dialog'
            title={fullName ? `Sesión de ${fullName}: cambiar de usuario` : 'Cambiar de usuario'}
        >
            <UserAvatar user={user} size='small' />
            <span className='nav-bar__label'>Cambiar de usuario</span>
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2'
                 strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <path d='M16 3l4 4-4 4' />
                <path d='M20 7H8' />
                <path d='M8 21l-4-4 4-4' />
                <path d='M4 17h12' />
            </svg>
        </button>
    );
}
