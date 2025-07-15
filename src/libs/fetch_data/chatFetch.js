import axiosInstance from './instanceAxios';
import IP from './dataFetch';



export const getMessageForChat = ({ page, limit }) => {
    return new Promise((resolve, reject) => {
        axiosInstance.get(`${IP}/chat?page=${page ?? 0}&limit=${limit ?? 10}`)
            .then(response => resolve(response))
            .catch(error => reject(error));
    });
};




export const setMessageForChat = (body) => {
    return new Promise((resolve, reject) => {
        console.log(body)
        axiosInstance.post(`${IP}/chat`, body)
            .then(response => resolve(response))
            .catch(error => reject(error));
    });
};