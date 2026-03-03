import { isMobile, isTablet } from 'react-device-detect';
import { useNavigate } from 'react-router-dom';
import { memo } from 'react';
import { useDispatch } from 'react-redux';
import { desconnectIo } from '../../store/slices/socketio';
import { useSaveNoveltie } from '../../hook/useSaveNoveltie';
import { setUser } from '../../store/slices/user.js';
import axiosInstance from '../../libs/fetch_data/instanceAxios.js';
import URL from '../../libs/fetch_data/api_conexion.js';



function AsideBar({ clearLocal, localMonitoring, selectNovelty, openBoleanSidebar }) {

    let isLocalVisivility = localMonitoring[0] ? true : false;
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


    const menuItems = [
        { id: 'imagen-1', label: 'Novedades', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', hideOnTablet: true },
        { id: 'imagen-3', label: 'Demoras', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', hideOnTablet: true },
        { id: 'imagen-2', label: 'Producción', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', hideOnMobile: true, hideOnTablet: true },
        { id: 'imagen-pizza', label: 'Estándares de calidad', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', hideOnMobile: true, hideOnTablet: true },
    ];

    const tabletItems = [
        { id: 'delayTabletForTablet', label: 'Demora en preparación' },
        { id: 'loadImage', label: 'Subir imagen a mi Jarvis' },
    ];

    const infoItems = [
        { id: 'show-manager', label: 'Gerentes', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    ];


    return (
        <>
            {/* Overlay for mobile */}
            {openBoleanSidebar && <div className='sidebar-overlay' onClick={() => selectNovelty('')} />}

            <aside className={`sidebar ${openBoleanSidebar ? 'sidebar--open' : 'sidebar--closed'}`}>
                {/* Local name header */}
                <div className='sidebar__header'>
                    {!isMobile || isTablet ? (
                        isLocalVisivility
                            ? <h2 className='sidebar__local-name'>{localMonitoring[0].name}</h2>
                            : <h2 className='sidebar__local-name sidebar__local-name--waiting'>Esperando...</h2>
                    ) : null}
                </div>

                {/* Navigation section */}
                <div className='sidebar__nav'>
                    <span className='sidebar__section-label'>Reportar</span>

                    {!isTablet ? (
                        <>
                            {menuItems.map(item => {
                                if (item.hideOnMobile && isMobile) return null;
                                return (
                                    <button
                                        key={item.id}
                                        className='sidebar__btn'
                                        onClick={e => selectNovelty(e.currentTarget.id)}
                                        id={item.id}
                                    >
                                        <svg className='sidebar__btn-icon' viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d={item.icon} />
                                        </svg>
                                        <span className='sidebar__btn-text'>{item.label}</span>
                                    </button>
                                );
                            })}

                            {isLocalVisivility && (
                                <>
                                    <span className='sidebar__section-label' style={{ marginTop: '0.75rem' }}>Información</span>
                                    {infoItems.map(item => (
                                        <button
                                            key={item.id}
                                            className='sidebar__btn'
                                            onClick={e => selectNovelty(e.currentTarget.id)}
                                            id={item.id}
                                        >
                                            <svg className='sidebar__btn-icon' viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d={item.icon} />
                                            </svg>
                                            <span className='sidebar__btn-text'>{item.label}</span>
                                        </button>
                                    ))}
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            {tabletItems.map(item => (
                                <button
                                    key={item.id}
                                    className='sidebar__btn'
                                    onClick={e => selectNovelty(e.currentTarget.id)}
                                    id={item.id}
                                >
                                    <span className='sidebar__btn-text'>{item.label}</span>
                                </button>
                            ))}
                        </>
                    )}
                </div>

                {/* Footer actions */}
                <div className='sidebar__footer'>
                    <button className='sidebar__btn sidebar__btn--ghost' onClick={clearLocal} id='change-local'>
                        <svg className='sidebar__btn-icon' viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className='sidebar__btn-text'>Cambiar establecimiento</span>
                    </button>

                    <button className='sidebar__btn sidebar__btn--danger' onClick={closeSesscion} id='logout'>
                        <svg className='sidebar__btn-icon' viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span className='sidebar__btn-text'>Cerrar sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default memo(AsideBar);