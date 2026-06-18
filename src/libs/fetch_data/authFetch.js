import axiosInstance from './instanceAxios';
import IP from './dataFetch';



export const confirmAuthentication = async () => {
    try {
        return await axiosInstance.get(`${IP}/auth/isAuth`)
    } 
    catch(error){
        return error
    }
}