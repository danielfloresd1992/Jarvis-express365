import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CurrentUserCard from './CurrentUserCard.jsx';


/*  EL FORMULARIO DE CAMBIAR DE USUARIO
 *
 *  Ocupa la pantalla entera sobre un fondo negro, con la tarjeta en el centro (pedido del usuario): arriba quién
 *  tiene la sesión ahora (CurrentUserCard) y debajo el usuario y la clave del que entra. Un error de usuario o de
 *  clave se marca en SU campo, en rojo y con el texto debajo; uno que no es de ningún campo (sin conexión, sin
 *  entrada laboral, inhabilitado) va encima de los botones.
 *
 *  Va a 'document.body' con un portal: así no lo recorta la barra de arriba, que es donde vive la tecla. Y lleva
 *  'no-drag': en el escritorio la barra arrastra la ventana, y sin eso un clic en el fondo la movería.
 *
 *  Se cierra con «Cancelar» o con Escape, nunca tocando el fondo: un clic despistado no borra lo escrito.
 *  Mientras se envía no se cierra (useSwitchUser).
 */


// EyeIcon = «el ojo de enseñar la clave», tachado cuando está escondida
function EyeIcon({ crossed }) {
    return (
        <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'
             strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
            <path d='M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z' />
            <circle cx='12' cy='12' r='3' />
            {crossed && <path d='M3 3l18 18' />}
        </svg>
    );
}


// WORDS = «lo que dice el formulario en cada modo»: cambiar de usuario (la tecla) o volver a entrar (la sesión venció,
// useSwitchUser). En el segundo, el usuario ya va escrito: lo normal es que vuelva a entrar el mismo.
const WORDS = {
    switch: {
        title: 'Cambiar de usuario',
        subtitle: 'Las mesas y lo que tengas abierto se quedan como están.',
        eyebrow: 'Usuario nuevo',
    },
    expired: {
        title: 'Tu sesión venció',
        subtitle: 'Vuelve a entrar para seguir. Lo que estabas enviando se manda solo al entrar, y lo demás se queda como está.',
        eyebrow: 'Entrar de nuevo',
    },
};

// loginNameOf = «el usuario con que se entra», si la sesión lo trae (el campo 'user' del usuario); '' si no
const loginNameOf = (user) => (typeof user?.user === 'string' ? user.user : '');


/*  @param {string}   mode         'switch' (por defecto) o 'expired' (la sesión venció: volver a entrar)
 *  @param {object}   currentUser  quién tiene la sesión ahora
 *  @param {boolean}  sending      se está entrando: los campos y las teclas quedan quietos
 *  @param {object}   failure      el último error, { field, text } (null = ninguno)
 *  @param {function} onSubmit     entrar con { user, password }
 *  @param {function} onCancel     cerrar sin cambiar nada
 *  @param {function} onEdit       se volvió a escribir: el aviso de error sobra
 */
export default function SwitchUserDialog({ mode = 'switch', currentUser, sending, failure, onSubmit, onCancel, onEdit }) {

    const expired = mode === 'expired';
    const words = WORDS[expired ? 'expired' : 'switch'];

    const [userName, setUserName] = useState(() => (expired ? loginNameOf(currentUser) : ''));
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // ids = «los nombres que unen cada etiqueta y cada aviso con su campo», para los lectores de pantalla
    const baseId = useId();
    const ids = { title: `${baseId}-title`, user: `${baseId}-user`, password: `${baseId}-password`, error: `${baseId}-error` };

    const userInputRef = useRef(null);
    const passwordInputRef = useRef(null);

    // Escape cierra, como «Cancelar».
    useEffect(() => {
        const onKeyDown = (event) => { if (event.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onCancel]);

    // Tras un error, el cursor vuelve al campo que falló; la clave, además, seleccionada para reescribirla encima.
    // (Mientras se enviaba los campos estaban deshabilitados y habían perdido el foco.)
    useEffect(() => {
        if (failure?.field === 'user') userInputRef.current?.focus();
        if (failure?.field === 'password') {
            passwordInputRef.current?.focus();
            passwordInputRef.current?.select();
        }
    }, [failure]);

    const userFailed = failure?.field === 'user';
    const passwordFailed = failure?.field === 'password';
    const generalFailure = failure && !failure.field ? failure.text : null;

    const submit = (event) => {
        event.preventDefault();
        if (sending) return;
        onSubmit({ user: userName, password });
    };

    const edit = (setter) => (event) => {
        setter(event.target.value);
        if (failure) onEdit();
    };

    // passwordFirst = «el usuario ya va escrito»: el cursor empieza en la clave
    const passwordFirst = expired && loginNameOf(currentUser) !== '';

    return createPortal(
        <div className={`switch-user-backdrop ${expired ? 'switch-user-backdrop--expired' : ''}`}>
            <div className='switch-user-dialog' role='dialog' aria-modal='true' aria-labelledby={ids.title}>

                <header className='switch-user-dialog__header'>
                    <span className='switch-user-dialog__icon' aria-hidden='true'>
                        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2'
                             strokeLinecap='round' strokeLinejoin='round'>
                            <path d='M16 3l4 4-4 4' />
                            <path d='M20 7H8' />
                            <path d='M8 21l-4-4 4-4' />
                            <path d='M4 17h12' />
                        </svg>
                    </span>
                    <div>
                        <h2 id={ids.title} className='switch-user-dialog__title'>{words.title}</h2>
                        <p className='switch-user-dialog__subtitle'>{words.subtitle}</p>
                    </div>
                </header>

                <CurrentUserCard user={currentUser} expired={expired} />

                <form className='switch-user-form' onSubmit={submit} noValidate>
                    <span className='switch-user-eyebrow'>{words.eyebrow}</span>

                    <div className='switch-user-field'>
                        <label className='switch-user-field__label' htmlFor={ids.user}>Usuario</label>
                        <div className={`switch-user-field__box ${userFailed ? 'switch-user-field__box--error' : ''}`}>
                            <svg className='switch-user-field__icon' width='16' height='16' viewBox='0 0 24 24' fill='none'
                                 stroke='currentColor' strokeWidth='2' aria-hidden='true'>
                                <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
                                <circle cx='12' cy='7' r='4' />
                            </svg>
                            <input
                                ref={userInputRef}
                                id={ids.user}
                                className='switch-user-field__input'
                                type='text'
                                autoComplete='off'
                                autoCapitalize='off'
                                spellCheck='false'
                                autoFocus={!passwordFirst}
                                placeholder='Ingresa el usuario'
                                value={userName}
                                onChange={edit(setUserName)}
                                disabled={sending}
                                aria-invalid={userFailed || undefined}
                                aria-describedby={userFailed ? ids.error : undefined}
                            />
                        </div>
                        {userFailed && <p id={ids.error} className='switch-user-field__error' role='alert'>{failure.text}</p>}
                    </div>

                    <div className='switch-user-field'>
                        <label className='switch-user-field__label' htmlFor={ids.password}>Contraseña</label>
                        <div className={`switch-user-field__box ${passwordFailed ? 'switch-user-field__box--error' : ''}`}>
                            <svg className='switch-user-field__icon' width='16' height='16' viewBox='0 0 24 24' fill='none'
                                 stroke='currentColor' strokeWidth='2' aria-hidden='true'>
                                <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
                                <path d='M7 11V7a5 5 0 0 1 10 0v4' />
                            </svg>
                            <input
                                ref={passwordInputRef}
                                id={ids.password}
                                className='switch-user-field__input'
                                type={showPassword ? 'text' : 'password'}
                                autoFocus={passwordFirst}
                                autoComplete='new-password'
                                placeholder='Ingresa la contraseña'
                                value={password}
                                onChange={edit(setPassword)}
                                disabled={sending}
                                aria-invalid={passwordFailed || undefined}
                                aria-describedby={passwordFailed ? ids.error : undefined}
                            />
                            <button
                                type='button'
                                className='switch-user-field__toggle'
                                onClick={() => setShowPassword(shown => !shown)}
                                aria-label={showPassword ? 'Esconder la contraseña' : 'Enseñar la contraseña'}
                                title={showPassword ? 'Esconder la contraseña' : 'Enseñar la contraseña'}
                            >
                                <EyeIcon crossed={!showPassword} />
                            </button>
                        </div>
                        {passwordFailed && <p id={ids.error} className='switch-user-field__error' role='alert'>{failure.text}</p>}
                    </div>

                    {generalFailure && <p className='switch-user-form__error' role='alert'>{generalFailure}</p>}

                    <div className='switch-user-form__actions'>
                        <button type='button' className='switch-user-key switch-user-key--cancel' onClick={onCancel} disabled={sending}>
                            Cancelar
                        </button>
                        <button type='submit' className='switch-user-key switch-user-key--enter' disabled={sending}>
                            {sending && <span className='switch-user-key__spinner' aria-hidden='true' />}
                            {sending ? 'Entrando…' : 'Entrar'}
                        </button>
                    </div>
                </form>

            </div>
        </div>,
        document.body,
    );
}
