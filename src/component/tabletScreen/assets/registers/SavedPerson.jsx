import { useState } from 'react';


/*  UNA PERSONA DE LO GUARDADO: su foto y su nombre (Creador, Edición y la lista de cambios)
 *
 *  Llega poblada desde la API: { name, surName, img }. La foto es la URL de '/user/multimedia/…', y se
 *  pide en miniatura ('?w=48': la API la recorta al vuelo y el navegador la guarda). Sin foto, o si no
 *  carga, sus iniciales.
 */


// fullName = «nombre y apellido de un usuario poblado»: '' si no viene
export const fullName = (user) => [user?.name, user?.surName].filter(Boolean).join(' ');


/*  @param {object} user  el usuario poblado: { name, surName, img }
 */
export default function SavedPerson({ user }) {

    // broken = «la foto no cargó»: se enseñan las iniciales
    const [broken, setBroken] = useState(false);

    const name = fullName(user);
    const initials = [user?.name, user?.surName].map(word => word?.[0] ?? '').join('').toUpperCase() || '?';

    return (
        <span className='register-saved-person'>
            {
                user?.img && !broken
                    ? <img className='register-saved-avatar' src={`${user.img}?w=48`} alt='' onError={() => setBroken(true)} />
                    : <span className='register-saved-avatar register-saved-avatar--initials' aria-hidden='true'>{initials}</span>
            }
            <span className='min-w-0 truncate'>{name || 'Sin nombre'}</span>
        </span>
    );
}
