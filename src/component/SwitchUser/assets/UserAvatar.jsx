import { useState } from 'react';


/*  LA CARA DEL USUARIO: su foto ('img') o, si no tiene o no carga, sus iniciales sobre ocre suave.
 *  La usan la tecla de la barra y la tarjeta de la sesión actual. El tamaño lo pone la clase ('size').
 */


// initialsOf = «las iniciales del nombre y el apellido»: { name: 'Ana', surName: 'Pérez' } → 'AP'
export const initialsOf = (user) => `${user?.name?.trim()?.[0] ?? ''}${user?.surName?.trim()?.[0] ?? ''}`.toUpperCase() || '?';


/*  @param {object} user  el usuario (state.user)
 *  @param {string} size  'small' (la tecla de la barra) o 'large' (la tarjeta)
 */
export default function UserAvatar({ user, size = 'small' }) {

    // brokenImage = «la foto no cargó»: se pasa a las iniciales. Va por dirección, así otra foto vuelve a probar.
    const [brokenImage, setBrokenImage] = useState(null);
    const showImage = Boolean(user?.img) && brokenImage !== user.img;

    return (
        <span className={`switch-user-avatar switch-user-avatar--${size}`} aria-hidden='true'>
            {
                showImage
                    ? <img src={user.img} alt='' onError={() => setBrokenImage(user.img)} />
                    : initialsOf(user)
            }
        </span>
    );
}
