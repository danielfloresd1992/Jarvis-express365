import axiosInstance from './instanceAxios';
import IP from './dataFetch';


export const sendFile = (file) => {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('img', file);
        axiosInstance.post(`${IP}/multimedia`, formData)
            .then(response => resolve(response))
            .catch(error => reject(error))
    });
}
