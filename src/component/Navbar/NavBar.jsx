import { isMobile } from 'react-device-detect';
import { useEffect, useState, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../../store/slices/user.js';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { desconnectIo, socketAppManager } from '../../store/slices/socketio';
import ListNovelties from './listNovelties.jsx';
import { socket } from '../../libs/socket/io.js';
import URL from '../../libs/fetch_data/api_conexion.js';
import { confirmAuthentication } from '../../libs/fetch_data/authFetch.js';




function NavBar({ clearLocal, openCloseSidebar, boxModal }) {


    const navigate = useNavigate();
    const [openList, setOpenList] = useState(false);
    const userSelet = useSelector(state => state.user);
    const dispatch = useDispatch();



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
        <nav className='nav-bar'>
            <div className='nav-bar__left'>
                <button className='nav-bar__toggle' onClick={openCloseSidebar} title="Menú">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
                <div className='nav-bar__brand'>
                    <span className='nav-bar__app-name'>JarvisExpress</span>
                </div>
            </div>

            

            <ul className='nav-bar__actions'>
                {!isMobile && (
                    <>
                        <li>
                            <button className='nav-bar__action-btn' onClick={() => navigate('/ModalData')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="5" width="20" height="14" rx="2" />
                                    <line x1="2" y1="10" x2="22" y2="10" />
                                </svg>
                                Mis bonos
                            </button>
                        </li>
                        <li>
                            <button className='nav-bar__action-btn' onClick={() => setOpenList(!openList)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                                Mis novedades
                            </button>
                        </li>
                    </>
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

            <ListNovelties open={openList} />
        </nav>
    );
}

export default memo(NavBar);