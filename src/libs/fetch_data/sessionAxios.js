import axios from 'axios';
import { API_CONFIG, explainApiError } from './instanceAxios.js';
import { askToLogIn } from './sessionGate.js';


/*  LA INSTANCIA DE AXIOS DE LOS FORMULARIOS Y DE LAS ROTACIONES (pedido del usuario)
 *
 *  La de siempre (instanceAxios.js): la cookie de la sesión, las cabeceras de jarvis_api y el texto de sus errores. Y
 *  además, un interceptor para cuando la API responde 401 —no hay sesión, o venció—:
 *
 *      1. se abre el formulario de iniciar sesión, el mismo de «Cambiar de usuario», en su modo «la sesión venció»
 *         (sessionGate.js). Sin recargar: lo que hay en pantalla —el formulario a medio enviar, las mesas— se queda;
 *      2. la petición ESPERA mientras tanto. El formulario que la hizo sigue en «Enviando…»;
 *      3. si entra el MISMO usuario, la petición se repite sola, una vez, y el formulario termina como si nada;
 *      4. si entra OTRO usuario, no se repite: lo que se mandaba lleva el nombre del anterior (la novedad, su 'userId').
 *         Falla con un texto que pide revisar y volver a enviar, ya a nombre del nuevo;
 *      5. si se cancela, falla con un texto que dice que la sesión venció.
 *
 *  Un 401 de la petición repetida no vuelve a preguntar (no hay bucle). El inicio de sesión no pasa por aquí: va por
 *  instanceAxios (authFetch.js), y su 401 es «clave incorrecta».
 *
 *  Donde no se puede abrir el formulario (la ventana flotante), falla como fallaba antes.
 *
 *  La usan los formularios de component/Main —con la subida de sus imágenes y su video— y el guardado de las
 *  rotaciones de Mesas (rotationFetching.js).
 */


const sessionAxios = axios.create(API_CONFIG);


// SESSION_TEXT = «lo que dice el error que queda», según cómo acabó el formulario de entrar
const SESSION_TEXT = {
    cancelled: 'La sesión venció y no se volvió a entrar. Inicia sesión y vuelve a enviarlo.',
    otherUser: 'Entró otro usuario. Revisa el formulario y vuelve a enviarlo, para que salga a su nombre.',
};


sessionAxios.interceptors.response.use(
    response => response,

    async error => {
        const request = error?.config;

        //  Solo un 401, y solo la primera vez: la petición repetida no vuelve a preguntar
        if (error?.response?.status !== 401 || !request || request.retriedAfterLogin) {
            return Promise.reject(explainApiError(error));
        }

        const { asked, entered, sameUser } = await askToLogIn();

        if (entered && sameUser) {
            request.retriedAfterLogin = true;
            return sessionAxios(request);
        }

        //  Sin formulario que abrir (la ventana flotante) no se preguntó nada: el error de siempre
        const explained = explainApiError(error);
        if (!asked) return Promise.reject(explained);

        explained.message = entered ? SESSION_TEXT.otherUser : SESSION_TEXT.cancelled;
        explained.code = 'SESSION_EXPIRED';
        return Promise.reject(explained);
    },
);


export default sessionAxios;
