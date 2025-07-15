import icoMenuHamburger from '../../../public/ico/menuHamburger/menuHamburger.svg';
import { isMobile } from 'react-device-detect';
import { useEffect, useState, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../../store/slices/user.js'; //'../../../store/slices/user.js';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { desconnectIo } from '../../store/slices/socketio';
import ListNovelties from './listNovelties.jsx';
//import { useSaveNoveltie } from '../../hook/useSaveNoveltie';
import { socket } from '../../libs/socket/io.js';
import URL from '../../libs/fetch_data/api_conexion.js';
import { confirmAuthentication } from '../../libs/fetch_data/authFetch.js';




function NavBar({ clearLocal, openCloseSidebar, boxModal }) {


    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [openList, setOpenList] = useState(false);
    const userSelet = useSelector(state => state.user);



    useEffect(() => {
        if (!userSelet) {
            confirmAuthentication()
                .then(response => {
                    dispatch(setUser(response.data));
                })
                .catch(error => {
                    console.log(error);
                })
        }
    }, []);



    useEffect(() => {
        let key = true;

        const closeSession = () => {
            if (key) {
                boxModal.open('Aviso', 'El administrador ha decidido que esta sessión ha caducado');
                closeSesscion();
            }
        };
        const resetApp = () => {
            if (key) {
                location.reload();
            }
        };

        socket.on('close-session-express', closeSession);
        socket.on('reset-session-express', resetApp);

        if (JSON.parse(sessionStorage.getItem('session'))) dispatch(setUser(JSON.parse(window.sessionStorage.getItem('session'))))

        return () => {
            socket.off('close-session-express', closeSession);
            socket.off('reset-session-express', resetApp);
        }
    }, []);



    const closeSesscion = () => {
        axios.get(`${URL}/user/logout`)
            .then(response => {
                if (response.status === 200) {
                    dispatch(setUser({}));
                    if (window.location.hostname !== 'localhost') {
                        dispatch(desconnectIo());
                    }
                    dispatch(setUser(null));
                    sessionStorage.removeItem('session');
                    localStorage.removeItem('local_appExpress');
                    //    deleteListNoveltie();
                    navigate('/');
                }
            })
            .catch(err => {
                console.log(err);
            });
    };


    return (
        <nav className='NavComponent'>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <button className='NavComponent-btnOpenSidebar' onClick={openCloseSidebar}>
                    <img className='NavComponent-btnOpenSidebar_img' src={icoMenuHamburger} alt="" />
                </button>

                <span className='NavComponent-user'>Usuario: {`${userSelet?.name} ${userSelet?.surName}`}</span>
            </div>




            <ul className='NavComponent-ul'>
                {
                    isMobile ?
                        (
                            null
                        ) :
                        (
                            <>
                                <li className='NavComponent-li'><a className='NavComponent-a' onClick={() => navigate('/ModalData')}>Mis bonos</a></li>
                                <li className='NavComponent-li'><a className='NavComponent-a' onClick={() => setOpenList(!openList)} >Mis novedades</a></li>
                                {/*
                                    <li className='NavComponent-li'><a className='NavComponent-a' onClick={clearLocal}>Cambiar de local</a></li>
                                */}

                            </>

                        )
                }
                {/*
                    <li className='NavComponent-li'><a className='NavComponent-a' onClick={closeSesscion} >Cerrar Sessión</a></li>
                */}

            </ul>
            <ListNovelties open={openList} />
        </nav>
    );
}

export default memo(NavBar);