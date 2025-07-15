
import visivilityOff from '../../../public/ico/visibility/visibility_off.svg';
import visivility from '../../../public/ico/visibility/visibility.svg';
import { useEffect, useState } from 'react';
import axiosInstance from '../../libs/fetch_data/instanceAxios.js';
import { useForm } from 'react-hook-form';
import Typewriter from 'typewriter-effect';
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
            <div className='component-error' style={errMicroservises.boolean ? { display: 'flex' } : { display: 'none' }}>
                <h1 className='component-error-h1'>
                    {errMicroservises.textTitle}
                </h1>
                <p className='component-error-p'>
                    {errMicroservises.textDescription}
                </p>
            </div>
            <div className='componentLogin'>
                <div className='componentLogin-presentation'>
                    <Presentation />
                </div>
                <div className='componentLogin-formContent'>
                    <form className='componentLogin-form' onSubmit={handleSubmit(loggin)} >
                        <label className='form-label' htmlFor="" > Usuario
                            <input className='form-input input-theme' type="text" required {...register("user")} />
                        </label>
                        <label className='form-label' htmlFor=""> Contraseña
                            <div className='form-inputContent input-theme'>
                                <input className='form-input sort' type={iSvisivility ? 'password' : 'text'} required name="" id="" {...register("password")} />
                                <button className='form-input-btnPass' onClick={() => { setVisivility(!iSvisivility) }} type='button'>
                                    <img className='form-input-imgPass' src={iSvisivility ? visivilityOff.toString() : visivility.toString()} alt="" />
                                </button>
                            </div>
                        </label>

                        <span className='form-textError' >{textError}</span>

                        <button className='form-btn' type='submit'>Iniciar session</button>
                    </form>
                </div>

            </div >
        </>
    )

}


export { LoginUser };