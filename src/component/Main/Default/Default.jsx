import './style.css';
import { isMobile, isTablet } from 'react-device-detect';


/* Mismas rutas que AsideBar → selectNovelty(id) */
const SHORTCUTS = [
    {
        id: 'imagen-1',
        label: 'Novedades',
        desc: 'Reporta incidencias',
        icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
        id: 'imagen-3',
        label: 'Demoras',
        desc: 'Registra tiempos',
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        hideOnMobile: true,
    },
    {
        id: 'imagen-2',
        label: 'Producción',
        desc: 'Controla la cocina',
        icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
        hideOnMobile: true,
    },
    {
        id: 'imagen-pizza',
        label: 'Estándares',
        desc: 'Calidad del servicio',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        hideOnMobile: true,
    },
];


function RenderDefault({ selectNovelty }) {

    const go = id => {
        if (typeof selectNovelty === 'function') selectNovelty(id);
    };

    return (
        <div className="default-welcome">
            {/* Glow ambiental detrás del contenido */}
            <div className="default-welcome__glow" />

            <div className='default-welcome__icon-wrap'>
                <svg className='default-welcome__icon' viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                </svg>
            </div>

            <h1 className='default-welcome__title'>Bienvenido a JarvisExpress</h1>
            <p className='default-welcome__subtitle'>
                Selecciona una opción para comenzar a reportar
            </p>

            <div className='default-welcome__hints'>
                {SHORTCUTS.map(item => {
                    if (item.hideOnMobile && isMobile && !isTablet) return null;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            className='default-welcome__hint'
                            onClick={() => go(item.id)}
                        >
                            <span className='default-welcome__hint-ico'>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                    <path d={item.icon} />
                                </svg>
                            </span>
                            <span className='default-welcome__hint-text'>
                                <b>{item.label}</b>
                                <small>{item.desc}</small>
                            </span>
                            <svg className='default-welcome__hint-arrow' width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}


export { RenderDefault };
