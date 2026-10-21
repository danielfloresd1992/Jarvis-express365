import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../../../store/slices/user.js';
import { showBoxModal } from '../../../store/slices/boxModal.js';
import { logIn } from '../../../libs/fetch_data/authFetch.js';
import { onSessionExpired } from '../../../libs/fetch_data/sessionGate.js';


/*  CAMBIAR DE USUARIO SIN SALIR DE LA PANTALLA
 *
 *  En un local con Mesas (processRegister) la estación la comparten varios operadores a lo largo del día. Cerrar
 *  sesión y volver a entrar recargaba Home y se perdía lo que estuviera abierto. Aquí el cambio se hace en el sitio:
 *
 *      1. se inicia sesión con el usuario nuevo (POST /user/login) SOBRE la sesión que ya hay. La API pisa entera
 *         la sesión de la cookie (addCredential.js): nombre, id, permisos y 'dataUser'. La del anterior queda
 *         cerrada, porque ya no queda nada suyo en ella;
 *      2. el usuario nuevo pasa a Redux (state.user) y a la copia de sessionStorage ('session');
 *      3. no se navega ni se recarga. Lo que lee 'state.user' (la barra lateral, el chat, el aviso de 'user-data'
 *         de Home, los formularios) se pone al día solo, y las mesas siguen donde estaban;
 *      4. el BoxModal de la aplicación avisa que el cambio salió bien, y de quién es ahora la sesión.
 *
 *  Por qué no se cierra antes la sesión vieja (GET /auth/logout): si la clave nueva está mal, el operador se
 *  quedaría sin sesión y con la pantalla a medias. Así, un fallo deja la sesión de antes intacta y se puede cancelar.
 *
 *  EL MODO «LA SESIÓN VENCIÓ» (pedido del usuario): el mismo formulario se abre solo cuando una petición de
 *  sessionAxios.js recibe 401. Se apunta en sessionGate.js al montarse. Entrar hace lo mismo que el cambio —Redux,
 *  sessionStorage, sin recargar—, pero no avisa con el BoxModal: contesta a la petición que espera ({ entered,
 *  sameUser }), que se repite sola si entró el mismo usuario, y el formulario que la hizo dice cómo acabó. Cancelar
 *  le contesta que no.
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


// fullNameOf = «nombre y apellido», para el aviso: { name: 'Ana', surName: 'Pérez' } → 'Ana Pérez'
const fullNameOf = (user) => `${user?.name ?? ''} ${user?.surName ?? ''}`.trim() || 'sin nombre';


export default function useSwitchUser() {

    const dispatch = useDispatch();

    // currentUser = «quién tiene la sesión ahora»: el que se enseña arriba del formulario
    const currentUser = useSelector(state => state.user);

    const [open, setOpen] = useState(false);
    const [sending, setSending] = useState(false);

    // failure = «el último error», { field, text }; null = sin error
    const [failure, setFailure] = useState(null);

    // mode = «para qué está abierto»: 'switch' (la tecla de la barra) o 'expired' (una petición recibió 401)
    const [mode, setMode] = useState('switch');

    // finishRef = «a quién se le contesta» en el modo 'expired' (sessionGate.js); null si nadie espera
    const finishRef = useRef(null);

    // answer = «contestar a la petición que espera», una vez. Sin nadie esperando, no hace nada.
    const answer = useCallback((outcome) => {
        const finish = finishRef.current;
        finishRef.current = null;
        finish?.(outcome);
    }, []);

    //  Abrirse solo cuando la sesión venza (sessionAxios.js). Al desmontarse, a quien espere se le contesta que no:
    //  si no, su petición se quedaría esperando un formulario que ya no está.
    useEffect(() => {
        const stopListening = onSessionExpired((finish) => {
            finishRef.current = finish;
            setFailure(null);
            setMode('expired');
            setOpen(true);
        });
        return () => {
            stopListening();
            answer({ entered: false });
        };
    }, [answer]);


    const openDialog = useCallback(() => {
        setFailure(null);
        setMode('switch');
        setOpen(true);
    }, []);

    // Mientras se envía no se cierra: la respuesta llegaría con el formulario ya fuera. Cerrar sin entrar, en el modo
    // 'expired', es contestar que no.
    const closeDialog = useCallback(() => {
        if (sending) return;
        setFailure(null);
        setOpen(false);
        answer({ entered: false });
    }, [sending, answer]);

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

            const sameUser = String(nextUser._id) === String(currentUser?._id);

            // La sesión había vencido: se le contesta a la petición que espera, que se repite si es el mismo usuario.
            // Sin BoxModal: el formulario que la hizo dice cómo acabó.
            if (finishRef.current) {
                answer({ entered: true, sameUser });
                return true;
            }

            // El aviso de que salió bien (pedido del usuario). Si se volvió a entrar con el mismo usuario, no se
            // dice que se cerró la sesión de nadie.
            dispatch(showBoxModal({
                tone: 'success',
                title: 'Cambio de usuario exitoso',
                message: sameUser
                    ? `Sigues con la sesión de ${fullNameOf(nextUser)}.`
                    : `Ahora la sesión es de ${fullNameOf(nextUser)}.\nLa de ${fullNameOf(currentUser)} quedó cerrada.`,
            }));
            return true;
        }
        catch (error) {
            setFailure(loginFailure(error));
            return false;
        }
        finally {
            setSending(false);
        }
    }, [dispatch, currentUser, answer]);


    return { currentUser, open, mode, sending, failure, openDialog, closeDialog, clearFailure, switchTo };
}
