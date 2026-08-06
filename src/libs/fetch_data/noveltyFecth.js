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