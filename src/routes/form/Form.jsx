
import visivilityOff from '../../../public/ico/visibility/visibility_off.svg';
import visivility from '../../../public/ico/visibility/visibility.svg';
import { useEffect, useState } from 'react';
import axiosInstance from '../../libs/fetch_data/instanceAxios.js';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/slices/user.js';
import URL from '../../libs/fetch_data/api_conexion.js';

import Presentation from '../../component/presentatiom.jsx'


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
                {/* Brand / Presentation section */}
                <div className='auth-page__brand'>
                    <Presentation />
                </div>

                {/* Form section */}
                <div className='auth-page__form-side'>
                    <div className='auth-card'>
                        <div className='auth-card__header'>
                            <img className='auth-card__logo-mobile' src='/logo1.png' alt='Logo' />
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