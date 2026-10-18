import UserAvatar from './UserAvatar.jsx';


/*  QUIÉN TIENE LA SESIÓN AHORA, arriba del formulario: su cara, su nombre y su cargo, con la marca de «activa».
 *  Debajo, una línea dice lo que le va a pasar: su sesión se cierra al entrar el usuario nuevo.
 */


/*  @param {object} user  quién tiene la sesión (state.user)
 */
export default function CurrentUserCard({ user }) {
    const fullName = `${user?.name ?? ''} ${user?.surName ?? ''}`.trim() || 'Sin nombre';
    const position = user?.jobInformation?.position;

    return (
        <section className='switch-user-current' aria-label='Sesión actual'>
            <span className='switch-user-eyebrow'>Sesión actual</span>
            <div className='switch-user-current__card'>
                <UserAvatar user={user} size='large' />
                <div className='switch-user-current__text'>
                    <span className='switch-user-current__name'>{fullName}</span>
                    {position && <span className='switch-user-current__position'>{position}</span>}
                </div>
                <span className='switch-user-current__state'>Activa</span>
            </div>
            <p className='switch-user-current__note'>
                <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4'
                     strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                    <path d='M12 5v14' />
                    <path d='M6 13l6 6 6-6' />
                </svg>
                Se cierra al entrar el usuario nuevo
            </p>
        </section>
    );
}
