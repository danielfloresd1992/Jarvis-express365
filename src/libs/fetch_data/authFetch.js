import axiosInstance from './instanceAxios';
import IP from './dataFetch';


export const confirmAuthentication = () => {
    return new Promise((resolve, reject) => {
        axiosInstance.get(`${IP}/auth/isAuth`)
            .then(response => resolve(response))
            .catch(error => reject(error));
    });
}