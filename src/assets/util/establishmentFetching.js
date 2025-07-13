import IP from './dataFetch';
import axiosInstance from './instanceAxios';


export const getEstablishmentByIdFull = (id) => {
    return new Promise((resolve, reject) => {
        axiosInstance.get(`${IP}/local/id=${id}?populate=timeServices shedules dishes managers`)
        .then(response => resolve(response))
        .catch(error => reject(error))
    });
};