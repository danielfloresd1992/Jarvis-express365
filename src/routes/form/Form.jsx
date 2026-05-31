
import visivilityOff from '../../../public/ico/visibility/visibility_off.svg';
import visivility from '../../../public/ico/visibility/visibility.svg';
import { useEffect, useState } from 'react';
import axiosInstance from '../../libs/fetch_data/instanceAxios.js';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/slices/user.js';
import URL from '../../libs/fetch_data/api_conexion.js';



function LoginUser() {

    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const [iSvisivility, setVisivility] = useState(true);
    let [textError, setError] = useState(String);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    let [errMicroservises, setErrorMicroservises] = useState({
        boolean: false,
        textTitle: '',
        textDescription: ''
    });


    useEffect(() => {
        localStorage.removeItem('local_appExpress');
        if (JSON.parse(sessionStorage.getItem('session'))) {
            dispatch(setUser(JSON.parse(window.sessionStorage.getItem('session'))));
            navigate('/home');
        }
    }, []);


    const loggin = data => {
        axiosInstance.post(`${URL}/user/login`, data)
            .then(response => {
                if (response.status === 200) {
                    dispatch(setUser(response.data));
                    window.sessionStorage.setItem('session', JSON.stringify(response.data))
                    navigate('/home');
                }
            })
            .catch(err => {
                console.log(err)
                if (err?.response?.data) {
                    setError(err?.response?.data?.error ?? 'error');
                }
            });
    };


    return (
        <>
            {/* Error overlay */}
            {errMicroservises.boolean && (
                <div className='auth-error-overlay'>
                    <h1 className='auth-error-overlay__title'>
                        {errMicroservises.textTitle}
                    </h1>
                    <p className='auth-error-overlay__text'>
                        {errMicroservises.textDescription}
                    </p>
                </div>
            )}

            <div className='auth-page'>
                {/* Full-screen animated background */}
                <div className='auth-page__brand'>
                
                </div>

                {/* Remix-style two-column shell */}
                <div className='auth-shell'>

                    {/* ── LEFT: Hero ── */}
                    <section className='auth-hero'>
                        {/* Eyebrow badge */}
                        <div className='auth-hero__eyebrow'>
                            <span className='auth-hero__eyebrow-dot' />
                            SISTEMA DE ALERTAS EN TIEMPO REAL
                        </div>

                        {/* Brand mark */}
                        <div className='auth-hero__brand'>
                            <img className='auth-hero__logo' src='/logo1.PNG' alt='Jarvis 365' />
                            <span className='auth-hero__brand-text'>
                                <span className='auth-hero__brand-jarvis'>JARVIS</span>
                                <span className='auth-hero__brand-num'>365</span>
                            </span>
                        </div>

                        {/* Huge headline */}
                        <h1 className='auth-hero__title'>
                            Reporta al instante.
                            <br />
                            <span className='auth-hero__title-accent'>Resuelve sin demoras.</span>
                        </h1>

                        <p className='auth-hero__subtitle'>
                            La plataforma que centraliza las incidencias de tus locales —
                            multimedia, monitoreo y notificaciones en tiempo real, todo en un solo lugar.
                        </p>

                        {/* Feature list */}
                        <ul className='auth-hero__features'>
                            <li className='auth-hero__feature'>
                                <span className='auth-hero__feature-ico'>
                                    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <polyline points='13 2 3 14 12 14 11 22 21 10 12 10 13 2' />
                                    </svg>
                                </span>
                                <span className='auth-hero__feature-text'>
                                    <b>Alertas instantáneas</b>
                                    Notificaciones del sistema en cuanto ocurre una incidencia.
                                </span>
                            </li>
                            <li className='auth-hero__feature'>
                                <span className='auth-hero__feature-ico'>
                                    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <path d='M23 6l-9.5 9.5-5-5L1 18' />
                                        <polyline points='17 6 23 6 23 12' />
                                    </svg>
                                </span>
                                <span className='auth-hero__feature-text'>
                                    <b>Monitoreo en vivo</b>
                                    Visualiza el rendimiento de cada local en tiempo real.
                                </span>
                            </li>
                            <li className='auth-hero__feature'>
                                <span className='auth-hero__feature-ico'>
                                    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
                                        <circle cx='8.5' cy='8.5' r='1.5' />
                                        <polyline points='21 15 16 10 5 21' />
                                    </svg>
                                </span>
                                <span className='auth-hero__feature-text'>
                                    <b>Soporte multimedia</b>
                                    Adjunta imágenes y videos a cada reporte sin fricción.
                                </span>
                            </li>
                        </ul>

                        {/* Stats strip */}
                        <div className='auth-hero__stats'>
                            <div className='auth-hero__stat'>
                                <span className='auth-hero__stat-num'>24/7</span>
                                <span className='auth-hero__stat-lbl'>Disponible</span>
                            </div>
                            <div className='auth-hero__stat-sep' />
                            <div className='auth-hero__stat'>
                                <span className='auth-hero__stat-num'>&lt;15ms</span>
                                <span className='auth-hero__stat-lbl'>Latencia</span>
                            </div>
                            <div className='auth-hero__stat-sep' />
                            <div className='auth-hero__stat'>
                                <span className='auth-hero__stat-num'>99.8%</span>
                                <span className='auth-hero__stat-lbl'>Uptime</span>
                            </div>
                        </div>
                    </section>

                    {/* ── RIGHT: Login card ── */}
                    <div className='auth-card'>
                        <div className='auth-card__header'>
                            <h2 className='auth-card__title'>Bienvenido</h2>
                            <p className='auth-card__subtitle'>Inicia sesión para continuar</p>
                        </div>

                        <form className='auth-form' onSubmit={handleSubmit(loggin)}>
                            <div className='auth-input-group'>
                                <label className='auth-input-label'>Usuario</label>
                                <div className='auth-input-wrapper'>
                                    <svg className='auth-input-icon' viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <input
                                        className='auth-input'
                                        type="text"
                                        placeholder="Ingresa tu usuario"
                                        required
                                        {...register("user")}
                                    />
                                </div>
                            </div>

                            <div className='auth-input-group'>
                                <label className='auth-input-label'>Contraseña</label>
                                <div className='auth-input-wrapper'>
                                    <svg className='auth-input-icon' viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <input
                                        className='auth-input'
                                        type={iSvisivility ? 'password' : 'text'}
                                        placeholder="Ingresa tu contraseña"
                                        required
                                        {...register("password")}
                                    />
                                    <button
                                        className='auth-input-toggle'
                                        onClick={() => setVisivility(!iSvisivility)}
                                        type='button'
                                    >
                                        <img
                                            className='auth-input-toggle__img'
                                            src={iSvisivility ? visivilityOff.toString() : visivility.toString()}
                                            alt=""
                                        />
                                    </button>
                                </div>
                            </div>

                            {textError && (
                                <span className='auth-form__error'>{textError}</span>
                            )}

                            <button className='auth-btn auth-btn--primary' type='submit'>
                                Iniciar sesión
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}


export { LoginUser };