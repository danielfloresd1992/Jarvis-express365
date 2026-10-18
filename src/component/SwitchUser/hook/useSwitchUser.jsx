import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../../../store/slices/user.js';
import { logIn } from '../../../libs/fetch_data/authFetch.js';


/*  CAMBIAR DE USUARIO SIN SALIR DE LA PANTALLA
 *
 *  En un local con Mesas (processRegister) la estación la comparten varios operadores a lo largo del día. Cerrar
 *  sesión y volver a entrar recargaba Home y se perdía lo que estuviera abierto. Aquí el cambio se hace en el sitio:
 *
 *      1. se inicia sesión con el usuario nuevo (POST /user/login) SOBRE la sesión que ya hay. La API pisa entera
 *         la sesión de la cookie (addCredential.js): nombre, id, permisos y 'dataUser'. La del anterior queda
 *         cerrada, porque ya no queda nada suyo en ella;
 *      2. el usuario nuevo pasa a Redux (state.user) y a la copia de sessionStorage ('session');
 *      3. y nada más: no se navega ni se recarga. Lo que lee 'state.user' (la barra lateral, el chat, el aviso de
 *         'user-data' de Home, los formularios) se pone al día solo, y las mesas siguen donde estaban.
 *
 *  Por qué no se cierra antes la sesión vieja (GET /auth/logout): si la clave nueva está mal, el operador se
 *  quedaría sin sesión y con la pantalla a medias. Así, un fallo deja la sesión de antes intacta y se puede cancelar.
 */


// FIELD_HINTS = «qué falta, cuando se envía con un campo vacío»: antes de molestar a la API
const FIELD_HINTS = {
    user: 'Escribe el usuario.',
    password: 'Escribe la contraseña.',
};


// loginFailure = «qué salió mal al entrar, dicho para el operador, y en qué campo» ('user', 'password' o null).
// Los textos de la API para 404 y 401 están en inglés y no dicen qué campo falla; los de 403 (inhabilitado, sin
// entrada laboral) ya vienen en castellano y se dejan tal cual.
const loginFailure = (error) => {
    const status = error?.response?.status;
    const serverText = error?.response?.data?.message;

    if (!error?.response) {
        return {
            field: null,
            text: error?.code === 'ECONNABORTED'
                ? 'El servidor no respondió a tiempo. Inténtalo de nuevo.'
                : 'No hay conexión con el servidor. Revisa la red e inténtalo de nuevo.',
        };
    }
    if (status === 404) return { field: 'user', text: 'Ese usuario no existe. Revisa cómo está escrito.' };
    if (status === 401) return { field: 'password', text: 'La contraseña no es correcta.' };
    if (status === 400) return { field: 'user', text: 'Escribe el usuario y la contraseña.' };
    if (status === 403) return { field: null, text: serverText ?? 'Este usuario no puede entrar ahora.' };
    return { field: null, text: serverText ?? 'No se pudo iniciar la sesión. Inténtalo de nuevo.' };
};


export default function useSwitchUser() {

    const dispatch = useDispatch();

    // currentUser = «quién tiene la sesión ahora»: el que se enseña arriba del formulario
    const currentUser = useSelector(state => state.user);

    const [open, setOpen] = useState(false);
    const [sending, setSending] = useState(false);

    // failure = «el último error», { field, text }; null = sin error
    const [failure, setFailure] = useState(null);


    const openDialog = useCallback(() => {
        setFailure(null);
        setOpen(true);
    }, []);

    // Mientras se envía no se cierra: la respuesta llegaría con el formulario ya fuera.
    const closeDialog = useCallback(() => {
        if (sending) return;
        setFailure(null);
        setOpen(false);
    }, [sending]);

    // Al volver a escribir en el campo que falló, el aviso sobra.
    const clearFailure = useCallback(() => setFailure(null), []);


    // switchTo = «entrar como { user, password }». Devuelve true si entró.
    const switchTo = useCallback(async ({ user, password }) => {
        const userName = user.trim();
        if (!userName) { setFailure({ field: 'user', text: FIELD_HINTS.user }); return false; }
        if (!password) { setFailure({ field: 'password', text: FIELD_HINTS.password }); return false; }

        setSending(true);
        setFailure(null);
        try {
            const response = await logIn({ user: userName, password });

            // La API todavía devuelve el hash de la clave (el 'delete' de user.controller.js no hace nada sobre un
            // documento de Mongoose): aquí no se guarda, ni en Redux ni en sessionStorage.
            const { password: passwordHash, ...nextUser } = response.data ?? {};

            dispatch(setUser(nextUser));
            try {
                window.sessionStorage.setItem('session', JSON.stringify(nextUser));
            }
            catch (storageError) {
                console.warn('No se pudo guardar la sesión en sessionStorage', storageError);
            }

            setOpen(false);
            return true;
        }
        catch (error) {
            setFailure(loginFailure(error));
            return false;
        }
        finally {
            setSending(false);
        }
    }, [dispatch]);


    return { currentUser, open, sending, failure, openDialog, closeDialog, clearFailure, switchTo };
}
