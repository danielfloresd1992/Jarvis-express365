import UserAvatar from './UserAvatar.jsx';


/*  QUIÉN TIENE LA SESIÓN AHORA, arriba del formulario: su cara, su nombre y su cargo, con la marca de «activa».
 *  Debajo, una línea dice lo que le va a pasar: su sesión se cierra al entrar el usuario nuevo.
 */


/*  @param {object}  user     quién tiene la sesión (state.user)
 *  @param {boolean} expired  su sesión venció (el formulario de volver a entrar): «Vencida» en ámbar, y la nota dice
 *                            qué pasa si entra otro
 */
export default function CurrentUserCard({ user, expired = false }) {
    const fullName = `${user?.name ?? ''} ${user?.surName ?? ''}`.trim() || 'Sin nombre';
    const position = user?.jobInformation?.position;

    return (
        <section className='switch-user-current' aria-label={expired ? 'Sesión vencida' : 'Sesión actual'}>
            <span className='switch-user-eyebrow'>{expired ? 'Sesión vencida' : 'Sesión actual'}</span>
            <div className='switch-user-current__card'>
                <UserAvatar user={user} size='large' />
                <div className='switch-user-current__text'>
                    <span className='switch-user-current__name'>{fullName}</span>
                    {position && <span className='switch-user-current__position'>{position}</span>}
                </div>
                <span className={`switch-user-current__state ${expired ? 'switch-user-current__state--expired' : ''}`}>{expired ? 'Vencida' : 'Activa'}</span>
            </div>
            <p className='switch-user-current__note'>
                <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4'
                     strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                    <path d='M12 5v14' />
                    <path d='M6 13l6 6 6-6' />
                </svg>
                {expired ? 'Si entra otro usuario, lo que se estaba enviando hay que mandarlo otra vez' : 'Se cierra al entrar el usuario nuevo'}
            </p>
        </section>
    );
}
