import axiosInstance from '../util/instanceAxios';
import IP from '../util/dataFetch';



export const setNovelty = dataForRequest => {
    return new Promise((resolve, reject) => {
        axiosInstance.post(`${IP}/novelties`, dataForRequest)
        .then(response => resolve(response))
        .catch(error => reject(error));
    });
};


export const saveVideo = (file) => {
    return new Promise((resolve, reject) => {
        if(!file) resolve(null);
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