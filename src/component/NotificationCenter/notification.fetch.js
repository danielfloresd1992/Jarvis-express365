import axiosInstance from '../../libs/fetch_data/instanceAxios';
import IP from '../../libs/fetch_data/dataFetch';

// ══════════════════════════════════════════════════════════════════════
// NOTIFICACIONES — capa de red
// ══════════════════════════════════════════════════════════════════════
// Habla con los MISMOS endpoints de jarvis_api que usa Client365. No hay
// backend propio de Reportes Express: la notificación se guarda una vez y la
// consultan los dos frontends.
//
// VITE_API_URL ya trae el prefijo /api_jarvis/v1, así que las rutas van tal
// cual. La sesión viaja por cookie (withCredentials en instanceAxios), y es el
// SERVIDOR quien decide qué le corresponde a cada usuario: desde acá nunca se
// envía a quién pertenece la consulta.

/** Página de notificaciones del usuario de la sesión, con su estado de lectura. */
export const getNotifications = async ({ page = 0, limit = 20 } = {}) => {
    const response = await axiosInstance.get(`${IP}/notifications?page=${page}&limit=${limit}`);
    return response.data;
};

/** Cuántas quedan sin leer. No trae documentos: solo el número. */
export const getUnreadCount = async () => {
    const response = await axiosInstance.get(`${IP}/notifications/unread-count`);
    return response.data;
};

/** Marca una como leída. Idempotente: llamarla dos veces no falla. */
export const markNotificationRead = async (id) => {
    const response = await axiosInstance.post(`${IP}/notifications/${id}/read`);
    return response.data;
};

/** Marca como leídas todas las que le corresponden al usuario. */
export const markAllNotificationsRead = async () => {
    const response = await axiosInstance.post(`${IP}/notifications/read-all`);
    return response.data;
};

/**
 * Resuelve una solicitud pendiente. Solo administradores.
 *
 * Al aprobar, el servidor aplica el cambio que guardó la solicitud: desde acá
 * NO se reenvía su contenido. Si viajara en la petición, quien aprueba podría
 * alterar lo que se solicitó.
 */
export const decideNotificationRequest = async (id, decision, note = '') => {
    const response = await axiosInstance.post(`${IP}/notifications/${id}/decide`, { decision, note });
    return response.data;
};
