import axios from 'axios';


const config = { withCredentials: true, headers: {
        'Source-Application': 'Reporte Express',
        'Version-App': '1.1'
    }
};



const axiosInstance = axios.create(config);


// ══════════════════════════════════════════════════════════════════════
// EL MENSAJE QUE VE EL OPERADOR
// ══════════════════════════════════════════════════════════════════════
// Todos los formularios de novedad terminan igual:
//
//     catch (error) {
//         if (error.message) boxModal.open({ title: 'Error', description: error.message });
//         else boxModal.open('Error', error);
//     }
//
// Y `error.message` de axios es "Request failed with status code 409", que no
// le dice nada a quien está frente a la pantalla. Acá se reemplaza por el texto
// que ya mandó jarvis_api, que sí está escrito para leerse.
//
// Se hace en el interceptor y no en cada formulario a propósito: son once
// componentes que postean novedades, todos con ese mismo `catch`. Cambiando
// esto, los once muestran el motivo real sin tocar ninguno.
//
//
// EL CASO QUE MOTIVÓ ESTO — ESTABLECIMIENTO SIN CÁMARAS
//
// Si el local tiene una caída de DVR abierta, jarvis_api rechaza cualquier
// alerta que no sea la de restablecimiento, con 409 y `code: 'DVR_DOWN'`. Sin
// esto el operador veía "Request failed with status code 409" y volvía a
// intentar, porque nada le decía que el problema era la conexión.
//
// El `code` se conserva en el error por si algún componente quiere hacer algo
// más que mostrar el texto —resaltar el local, ofrecer la alerta de
// restablecimiento—, sin tener que adivinarlo leyendo el mensaje.

axiosInstance.interceptors.response.use(
    response => response,

    error => {
        const datos = error?.response?.data;

        if (datos?.message) {
            error.message = datos.message;

            // Lo que el servidor haya dicho de más, a mano y sin re-leer la
            // respuesta.
            if (datos.code) error.code = datos.code;
            if (datos.dvrFailure) error.dvrFailure = datos.dvrFailure;
        }

        // Se REPROPAGA: el interceptor traduce el mensaje, no decide qué hacer
        // con el fallo. Eso sigue siendo de cada formulario.
        return Promise.reject(error);
    },
);


export default axiosInstance;
