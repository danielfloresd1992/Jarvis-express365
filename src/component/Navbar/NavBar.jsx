import { isMobile } from 'react-device-detect';
import { useEffect, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../../store/slices/user.js';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { desconnectIo, socketAppManager } from '../../store/slices/socketio';
import { socket } from '../../libs/socket/io.js';
import URL from '../../libs/fetch_data/api_conexion.js';
import { confirmAuthentication } from '../../libs/fetch_data/authFetch.js';
import NotificationBell from '../NotificationCenter';
import TabletButton from '../tabletButton/TabletButton.jsx';
import InboxButton from '../inbox/InboxButton.jsx';
import WindowControls from '../titleBar/WindowControls.jsx';
import SwitchUserController from '../SwitchUser/switchUser.controller.jsx';


/*  LA BARRA DE ARRIBA, QUE EN EL ESCRITORIO ES TAMBIÉN LA DE LA VENTANA
 *
 *  La propuesta «B · Clara, integrada con la app», elegida por el usuario: del mismo papel que la tabla, con
 *  una raya verde de marca arriba, el logo en verde, los accesos en tinta y «Sacar tablet» como tecla verde.
 *
 *  Dentro de la aplicación de escritorio se FUNDE con la barra de título (component/titleBar): se arrastra
 *  para mover la ventana (`WebkitAppRegion: 'drag'`; los botones van con `no-drag`, en App.css), dice el
 *  nombre de la ventana junto al logo y lleva al final minimizar, maximizar y cerrar (WindowControls).
 *  Mientras está montada pone `has-app-bar` en el <html>: la barra de título suelta se oculta (index.css).
 *
 *  En una ventana estrecha los accesos se quedan en su icono, con el nombre al pasar el ratón (App.css).
 */


// IS_ELECTRON = «corre dentro de la aplicación de escritorio»: solo ahí hay ventana que mover y cerrar
const IS_ELECTRON = typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron);




function NavBar({ clearLocal, boxModal }) {


    const navigate = useNavigate();
    const userSelet = useSelector(state => state.user);
    const dispatch = useDispatch();


    //  En el escritorio esta barra hace de barra de título: mientras está montada, la suelta se aparta
    //  (index.css, 'has-app-bar'). Al salir de Home vuelve, que es la que mueve y cierra la ventana allí.
    useEffect(() => {
        if (!IS_ELECTRON) return undefined;
        document.documentElement.classList.add('has-app-bar');
        return () => document.documentElement.classList.remove('has-app-bar');
    }, []);



    useEffect(() => {
        let key = true;

        const closeSession = (payload) => {
            if (!key) return;

            // Payload nuevo desde ava bot: { userId } — si trae un _id y no
            // es el de ESTA sesión, el cierre no va dirigido a este cliente.
            // El formato viejo ('close') o un userId vacío cierran todas las
            // sesiones, como siempre.
            const targetUserId = (payload && typeof payload === 'object') ? payload.userId : null;
            if (targetUserId && String(targetUserId) !== String(userSelet?._id)) return;

            boxModal.open({
                title: 'Aviso',
                description: 'El administrador ha decidido que esta sessión ha caducado'
            });
            closeSesscion();
        };
        const resetApp = () => {
            if (key) {
                location.reload();
            }
        };

        socket.on('close-session-express', closeSession);
        socket.on('reset-session-express', resetApp);



        return () => {
            key = false;
            socket.off('close-session-express', closeSession);
            socket.off('reset-session-express', resetApp);
        }
    }, [userSelet?._id]);



    // Cierre de sesión remoto: cuando el usuario marca su SALIDA laboral en
    // bioJarvis, jarvis_api emite 'close-session-user' con su _id por el
    // socket de jarvis (socketAppManager). Si es el usuario de ESTA sesión,
    // se reutiliza el mismo closeSesscion del botón de cerrar sesión.
    useEffect(() => {
        const sessionUserId = userSelet?._id;
        if (!sessionUserId) return;

        const closeIfCurrentUser = (payload) => {
            if (String(payload?.userId) === String(sessionUserId)) {
                boxModal.open({
                    title: 'Fin de la jornada',
                    description: 'Marcaste tu salida: la sesión se cerró automáticamente.'
                });
                closeSesscion();
            }
        };

        socketAppManager.on('close-session-user', closeIfCurrentUser);
        return () => {
            socketAppManager.off('close-session-user', closeIfCurrentUser);
        };
    }, [userSelet?._id]);



    const closeSesscion = () => {
        axios.get(`${URL}/auth/logout`)
            .then(response => {
                if (response.status === 200) {
                    dispatch(setUser({}));
                    if (window.location.hostname !== 'localhost') {
                        dispatch(desconnectIo());
                    }
                    dispatch(setUser(null));
                    sessionStorage.removeItem('session');
                    localStorage.removeItem('local_appExpress');
                    navigate('/');
                }
            })
            .catch(err => {
                console.log(err);
            });
    };


    return (
        <nav className={`nav-bar ${IS_ELECTRON ? 'nav-bar--window' : ''}`} style={IS_ELECTRON ? { WebkitAppRegion: 'drag' } : undefined}>
            <div className='nav-bar__left'>
                <div className='nav-bar__brand'>
                    <span className='nav-bar__app-name'>JarvisExpress</span>
                    {/*  El nombre de la ventana, el que la gente conoce en las estaciones: solo en el escritorio  */}
                    {IS_ELECTRON && <span className='nav-bar__window-title'>Reportes de alertas</span>}
                </div>
            </div>

            {/*  En el centro, «Cambiar de usuario»: solo en un local con Mesas (switchUser.controller.jsx)  */}
            <div className='nav-bar__center'>
                <SwitchUserController />
            </div>

            <ul className='nav-bar__actions'>
                {/* Sacar / quitar la ventana de la tablet. Trae su propio <li> y
                    solo se pinta dentro de la aplicación de escritorio. */}
                <TabletButton />

                {/* Centro de notificaciones: se monta entero desde su módulo.
                    También en móvil, a diferencia de los otros accesos: un aviso
                    de que te cambiaron el horario importa igual desde el
                    teléfono. */}
                <li>
                    <NotificationBell />
                </li>

                {/* La bandeja de imágenes del Toast. Trae su propio <li>, y no sale en el teléfono. */}
                <InboxButton />

                {/*  «Mis novedades» y su desplegable se quitaron (pedido del usuario)  */}
                {!isMobile && (
                    <li>
                        <button type='button' className='nav-bar__action-btn' onClick={() => navigate('/ModalData')} title='Mis bonos'>
                            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                                <path d='M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1' />
                                <path d='M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4' />
                            </svg>
                            <span className='nav-bar__label'>Mis bonos</span>
                        </button>
                    </li>
                )}
                <li>
                    <button className='nav-bar__action-btn nav-bar__action-btn--logout' onClick={closeSesscion} title="Cerrar sesión"
                        style={{
                            display: 'none'
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </li>
            </ul>

            {/*  En el escritorio, tras una raya: minimizar, maximizar y cerrar la ventana  */}
            {IS_ELECTRON && <span className='nav-bar__divider' aria-hidden='true' />}
            <WindowControls className='nav-bar__window-controls' />
        </nav>
    );
}

export default memo(NavBar);