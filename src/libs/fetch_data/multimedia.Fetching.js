import sessionAxios from './sessionAxios.js';
import IP from './dataFetch';


// sendFile = «subir una imagen» (POST /multimedia). Por sessionAxios: es lo primero que hace un formulario al enviar,
// y si la sesión venció tiene que abrirse ahí el formulario de volver a entrar.
export const sendFile = (file) => {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('img', file);
        sessionAxios.post(`${IP}/multimedia`, formData)
            .then(response => resolve(response))
            .catch(error => reject(error))
    });
}
