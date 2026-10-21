import IP from './api_conexion';
import axiosInstance from './instanceAxios';
import { operationalDay } from '../date_time/operationalDay.js';


/*  LAS PETICIONES DE LAS TARJETAS DE SELLOS (StampCards)
 *
 *  Todo es LECTURA de fondo, así que va por instanceAxios y no por sessionAxios: si la sesión venció, una barra que se
 *  pone al día sola no debe abrir el formulario de volver a entrar por su cuenta.
 *
 *  Cada función rechaza con un Error cuyo `message` se puede enseñar tal cual (como rotationFetching.js).
 */


// stampError = «el error de una petición, con un mensaje que entienda el operador»
// Un 404 sin texto de la API es que la ruta no existe: la API todavía no tiene ese recurso desplegado.
function stampError(error, fallback) {
    const status = error?.response?.status ?? 0;
    const fromApi = error?.response?.data?.message;
    const message = status === 0 ? 'No hay conexión con el servidor'
        : status === 401 ? 'La sesión expiró: vuelve a iniciar sesión'
        : fromApi || (status === 404 ? 'El servidor todavía no tiene este recurso: falta actualizar la API' : fallback);
    return Object.assign(new Error(message), { status, cause: error });
}

// nextDay = «el día siguiente», 'AAAA-MM-DD'
const nextDay = (day) => {
    const date = new Date(`${day}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
};


// leanNovelty = «una novedad, solo con lo que usan las tarjetas»: el documento entero trae comentarios, usuarios
// populados y más, y la barra lo guarda todo el día
export const leanNovelty = (novelty) => ({
    _id: novelty?._id,
    createdAt: novelty?.createdAt,
    title: novelty?.title,
    table: novelty?.table ?? null,
    menuRef: novelty?.menuRef?._id ?? novelty?.menuRef ?? null,
    establishment: novelty?.establishment
        ? { _id: novelty.establishment._id ?? novelty.establishment, name: novelty.establishment.name, franchiseReference: novelty.establishment.franchiseReference }
        : null,
    validationResult: {
        isApproved: novelty?.validationResult?.isApproved,
        detail: novelty?.validationResult?.detail ?? '',
        validationToDiscard: novelty?.validationResult?.validationToDiscard ?? null,
    },
    bonus: novelty?.bonus ?? null,
});


// getMyNovelties = «las novedades que reportó un operador en un día operativo» (GET /novelties/by-user)
// La API corta por días UTC y el día operativo va de 08:00 a 08:00 en Caracas (operationalDay.js): se piden ese día y
// el siguiente, y se quedan las que caen en el operativo. Resuelve con la lista, ya ligera (leanNovelty).
// Recibe: userId (el _id del operador) y day ('AAAA-MM-DD').
export const getMyNovelties = ({ userId, day }) => {
    return new Promise((resolve, reject) => {
        axiosInstance.get(`${IP}/novelties/by-user`, { params: { userId, since: day, until: nextDay(day) } })
            .then(response => {
                const novelties = response.data?.novelties ?? [];
                resolve(novelties.filter(novelty => operationalDay(new Date(novelty.createdAt)) === day).map(leanNovelty));
            })
            .catch(error => reject(stampError(error, 'No se pudieron traer tus novedades de hoy')));
    });
};


// getAlert = «una alerta del catálogo» (GET /menu/id=<id>), con sus reglas de bono (bonusRules) sin popular.
// La API la devuelve dentro de una lista; resuelve con la alerta o null si no existe.
export const getAlert = (id) => {
    return new Promise((resolve, reject) => {
        axiosInstance.get(`${IP}/menu/id=${id}`)
            .then(response => {
                const found = Array.isArray(response.data) ? response.data[0] : response.data;
                resolve(found ? { _id: found._id, es: found.es, bonifies: found.bonifies, bonusRules: found.bonusRules ?? [] } : null);
            })
            .catch(error => reject(stampError(error, 'No se pudo traer la alerta')));
    });
};


// getBonusRules = «las reglas de bono» (GET /bonus/rules): todas, activas o no. Resuelve con la lista.
export const getBonusRules = () => {
    return new Promise((resolve, reject) => {
        axiosInstance.get(`${IP}/bonus/rules`)
            .then(response => resolve(response.data?.rules ?? []))
            .catch(error => reject(stampError(error, 'No se pudieron traer las reglas de bono')));
    });
};
