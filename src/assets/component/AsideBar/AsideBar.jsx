import { isMobile, isTablet } from 'react-device-detect';
import { useNavigate } from 'react-router-dom';
import { memo } from 'react';
import { useDispatch } from 'react-redux';
import { desconnectIo } from '../../../store/slices/socketio';
import { useSaveNoveltie } from '../../hook/useSaveNoveltie';
import { setUser } from '../../../store/slices/user.js';
import image from '../../../../public/ico/image/image.svg';
import rolej from '../../../../public/ico/Hour/hourSaint.svg';
import collage from '../../../../public/ico/collage/collage.svg';
import shopping from '../../../../public/ico/shopping/shopping.svg';
import group from '../../../../public/ico/groups/groups.svg';
import icoLogOut from '../../../../public/ico/icons8-salida-50.png';
import icoChangue from '../../../../public/ico/icons8-cambiar-50.png';

import axiosInstance from '../../util/instanceAxios';
import URL from '../api_conexion';


const styleSetion = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    gap: '0.5rem'
}



function AsideBar({ clearLocal, localMonitoring, selectNovelty, openBoleanSidebar }) {

    let isLocalVisivility = localMonitoring[0] ? true : false;
    console.log('soy el componente asidebar');
    const { deleteListNoveltie } = useSaveNoveltie();
    const dispatch = useDispatch();
    const navigate = useNavigate();


    const closeSesscion = () => {
        axiosInstance.get(`${URL}/user/logout`)
            .then(response => {
                if (response.status === 200) {
                    dispatch(setUser(null));
                    if (window.location.hostname !== 'localhost') {
                        dispatch(desconnectIo());
                    }

                    sessionStorage.removeItem('session');
                    localStorage.removeItem('local_appExpress');
                    deleteListNoveltie();
                    navigate('/');
                }
            })
            .catch(err => {
                console.log(err);
            });
    };

    return (
        <>
            <aside className={openBoleanSidebar ? 'asideComponent closeSidebar' : 'asideComponent'}>
                <div style={styleSetion}>
                    {
                        isMobile && !isTablet ?
                            (
                                null
                            )
                            :
                            (
                                isLocalVisivility ? (<h2 className='asideComponent-namelocal'>{localMonitoring[0].name}</h2>) : <h1 className='asideComponent-namelocal'>esperando</h1>
                            )
                    }
                    <hr />

                    {
                        !isTablet ?
                            <>

                                <button className='asideComponent-btnAction' onClick={e => { selectNovelty(e.target.id) }} id="imagen-1" >Novedades<img src={image} className="img-btn" /></button>
                                <button className='asideComponent-btnAction' onClick={e => { selectNovelty(e.target.id) }} id="imagen-3" >Demoras<img src={rolej} className="img-btn" /></button>
                                <button className='asideComponent-btnAction' onClick={e => { selectNovelty(e.target.id) }} id="imagen-4" >PickUp<img src={shopping} className="img-btn" /></button>

                                {
                                    isMobile ?
                                        (
                                            null
                                        )
                                        :
                                        (
                                            <button className='asideComponent-btnAction' onClick={e => selectNovelty(e.target.id)}
                                                id='imagen-2' >Producción<img src={collage} className="img-btn" /></button>

                                        )
                                }

                                {
                                    isMobile ?
                                        (
                                            null
                                        )
                                        :
                                        (
                                            <button className='asideComponent-btnAction' onClick={e => selectNovelty(e.target.id)}
                                                id='imagen-pizza' >Estandares de calidad<img src={collage} className="img-btn" /></button>

                                        )
                                }

                                <hr />
                                {/*
 <h2 className='asideComponent-namelocal'>Compartir video</h2>
 <button className='asideComponent-btnAction' onClick={ e => selectNovelty(e.target.id) } 
 style={{ backgroundColor: '#008000', border: '2px solid #00FF00' }} id='video-2' >Video<img src={ camera } className="img-btn" /></button>
 
 <hr/>
                            */}

                                <h2 className='asideComponent-namelocal'>Información del local</h2>
                                {
                                    isLocalVisivility ?
                                        <>
                                            <button className='asideComponent-btnAction' onClick={e => selectNovelty(e.target.id)}
                                                id='show-manager' >Gerentes<img src={group} className="img-btn" /></button>
                                        </>
                                        : null
                                }

                            </>
                            :
                            <>
                                <button className='asideComponent-btnAction' onClick={e => selectNovelty(e.target.id)}
                                    id='delayTabletForTablet' >Demora en preparación
                                </button>

                                <button className='asideComponent-btnAction' onClick={e => selectNovelty(e.target.id)}
                                    id='loadImage' >Subir imagen a mi Jarvis
                                </button>
                            </>
                    }
                </div>
                <div style={styleSetion}>
                    <button className='asideComponent-btnAction' onClick={e => clearLocal()}
                        id='show-manager' >
                        Cambiar establecimiento
                        <img src={icoChangue} className="img-btn" />
                    </button>

                    <button className='asideComponent-btnAction' onClick={closeSesscion}
                        id='show-manager' >
                        Cerrar sessión
                        <img src={icoLogOut} className="img-btn" />
                    </button>

                </div>
            </aside>

        </>
    );
}

export default memo(AsideBar); 