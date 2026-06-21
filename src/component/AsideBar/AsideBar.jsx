import { isMobile, isTablet } from 'react-device-detect';
import { useSelector } from 'react-redux';
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
    const userSelet = useSelector(state => state.user);
    const { deleteListNoveltie } = useSaveNoveltie();
    const dispatch = useDispatch();
    const navigate = useNavigate();


    const closeSesscion = () => {
        axiosInstance.get(`${URL}/auth/logout`)
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
        { id: 'delay-1ra', label: 'Primera atención', icon: '/ico/icons8-book-50.png', hideOnTablet: true },
        { id: 'limpieza-02', label: 'Limpieza', icon: '/ico/icons8-cleaning-a-surface-50.png', hideOnTablet: true },
        { id: 'services-03', label: 'Servicio', icon: '/ico/icons8-food-64.png', hideOnTablet: true },
        { id: 'delivery-04', label: 'Entrega de plato', icon: '/ico/icons8-food-trolley-48.png', hideOnTablet: true },
        { id: 'tablet-05', label: 'Toast POS', icon: '/ico/icons8-tablet-50.png', hideOnTablet: true },
        { id: 'touch-06', label: 'Marcada antes de estar listo', icon: '/ico/icons8-touch-50.png', hideOnTablet: true },
        { id: 'imagen-1', label: 'Novedades', icon: '/ico/icons8-google-alerts-48.png', hideOnTablet: true },
        { id: 'imagen-2', label: 'Producción', icon: '/ico/icons8-knife-64.png', hideOnMobile: true, hideOnTablet: true },
        { id: 'imagen-pizza', label: 'Estándares de calidad', icon: '/ico/icons8-warranty-32.png', hideOnMobile: true, hideOnTablet: true },
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
            {/* Overlay for mobile 'sidebar--open' */}
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
                                        <img className='sidebar__btn-icon' src={item.icon} alt='primera-atención'/>
                                        
                                        
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
                                            <img clasName='' src={icon} alt='' />
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


                    <div className='w-full'>
                        <div className='w-full flex justify-start items-center gap-4 p-0'>
                            {userSelet?.img ? (
                                <img className='w-[40px] h-[50px] object-cover' src={userSelet.img} alt='avatar' />
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            )}
                            <div>
                                <p className='font-bold text-[#ff6fbb] text-[.9rem]'>{userSelet?.name} {userSelet?.surName}</p>
                                {
                                    userSelet?.jobInformation?.position && (
                                        <p className='font-medium text-[#ffffff] text-[.8rem]'>{userSelet?.jobInformation?.position}</p>
                                    )
                                }
                                <span>

                                </span>
                            </div>

                        </div>
                    </div>

                    <button className='sidebar__btn sidebar__btn_highlighted sidebar__btn--ghost' onClick={clearLocal} id='change-local'>
                        <svg className='sidebar__btn-icon' viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className='sidebar__btn-text'>Cambiar establecimiento</span>
                    </button>

                    <button className='sidebar__btn sidebar__btn_highlighted sidebar__btn--danger' onClick={closeSesscion} id='logout'>
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