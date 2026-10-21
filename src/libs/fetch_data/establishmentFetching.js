import IP from './api_conexion';
import axiosInstance from './instanceAxios';


export const getEstablishmentByIdFull = (id) => {
    return new Promise((resolve, reject) => {
        axiosInstance.get(`${IP}/local/id=${id}?populate=timeServices shedules dishes managers`)
            .then(response => resolve(response))
            .catch(error => reject(error))
    });
};


// getTimeServices = «los tiempos de servicio configurados del local»: { firstAtenttion, TableCleaning, … }, o null si
// el local no los tiene. Solo con 'timeServices' poblado: sin los platos ni los gerentes, que aquí no hacen falta.
export const getTimeServices = (id) => {
    return new Promise((resolve, reject) => {
        axiosInstance.get(`${IP}/local/id=${id}?populate=timeServices`)
            .then(response => {
                const timeServices = response.data?.timeServices;
                resolve(timeServices && typeof timeServices === 'object' ? timeServices : null);
            })
            .catch(error => reject(error));
    });
};


// getDishes = «la carta del local»: sus platos ({ _id, nameDishe, category… }), o [] si no tiene. Solo con 'dishes'
// poblado: la versión ligera del local los trae como simples _id.
export const getDishes = (id) => {
    return new Promise((resolve, reject) => {
        axiosInstance.get(`${IP}/local/id=${id}?populate=dishes`)
            .then(response => {
                const dishes = response.data?.dishes;
                resolve(Array.isArray(dishes) ? dishes.filter(dish => dish && typeof dish === 'object') : []);
            })
            .catch(error => reject(error));
    });
};