import axiosInstance from './instanceAxios';
import IP from './dataFetch';



// logIn = «iniciar sesión con { user, password }». La API guarda al usuario en la sesión de la cookie (la misma que ya
// hubiera: la pisa entera) y responde con él. Un fallo llega como error de axios, con su 'status' (404 sin usuario,
// 401 clave, 403 inhabilitado o sin entrada laboral). 'timeout': si la API se queda sin responder, no se espera para siempre.
export const logIn = (credentials) => axiosInstance.post(`${IP}/user/login`, credentials, { timeout: 15000 });



export const confirmAuthentication = async () => {
    try {
        return await axiosInstance.get(`${IP}/auth/isAuth`)
    } 
    catch(error){
        return error
    }
}