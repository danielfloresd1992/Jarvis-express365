import axiosInstance from './instanceAxios';
import IP from './dataFetch';



export const setNovelty = dataForRequest => {
    return new Promise((resolve, reject) => {
        axiosInstance.post(`${IP}/novelties`, dataForRequest)
            .then(response => resolve(response))
            .catch(error => reject(error));
    });
};


export const saveVideo = (file) => {
    return new Promise((resolve, reject) => {
        // Faltaba el `return`: resolver la promesa no corta la ejecución, así
        // que sin archivo se enviaba igual un POST con el FormData vacío.
        // Hoy queda tapado porque los llamadores comprueban antes, pero
        // cualquier llamador nuevo mandaría una petición inválida.
        if (!file) return resolve(null);
        const formData = new FormData();
        formData.append('video', file);
        axiosInstance.post(`${IP}/novelty/video`, formData)
            .then(response => resolve(response))
            .catch(error => reject(error));
    });
}


/**
 * Sube una imagen a la bandeja del Toast POS de un local.
 *
 * Es el MISMO endpoint que usa el formulario «Subir imagen a mi Jarvis» de las
 * tabletas (component/for_tablet/loadImg.jsx). Se saca acá para que la ventana
 * flotante de la tablet pueda mandar su captura sin repetir la petición, y para
 * que el día que cambie la ruta se cambie en un sitio.
 *
 * NO se manda quién la envía. El nombre que después aparece bajo cada imagen en
 * la bandeja lo pone el servidor a partir de la sesión de la cookie. Mandarlo
 * desde acá sería, además de innecesario, falsificable.
 *
 * Al terminar, jarvis_api emite `fileLoader` por el socket y la bandeja se
 * actualiza sola en todas las pantallas que estén mirando ese local.
 *
 * @param {string} idLocal  El `_id` del establecimiento.
 * @param {Blob|File} imagen  La imagen. Si es un Blob se le pone nombre acá:
 *   `FormData` lo llamaría "blob" y el servidor guardaría un archivo sin
 *   extensión.
 */
export const enviarImagenToastPos = (idLocal, imagen) => {
    return new Promise((resolve, reject) => {
        if (!idLocal) return reject(new Error('No hay un local seleccionado.'));
        if (!imagen) return reject(new Error('No hay ninguna imagen que enviar.'));

        const formData = new FormData();
        formData.append('img', imagen, imagen.name ?? `tablet_${Date.now()}.png`);

        axiosInstance.post(`${IP}/noventy/imageToasdPos?id=${idLocal}`, formData)
            .then(response => resolve(response))
            .catch(error => reject(error));
    });
};


export const getFileToastPos = id => {
    return new Promise((resolve, reject) => {
        axiosInstance.get(`${IP}/noventy/imageToasdPos?id=${id}`)
            .then(response => resolve(response))
            .catch(error => reject(error));
    })
}



export const deleteFileToasPos = id => {
    return new Promise((resolve, reject) => {
        axiosInstance.delete(`${IP}/noventy/imageToasdPos?id=${id}`)
            .then(response => resolve(response))
            .catch(error => reject(error));
    });
}