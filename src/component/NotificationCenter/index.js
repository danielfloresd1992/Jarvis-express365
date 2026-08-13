// ══════════════════════════════════════════════════════════════════════
// CENTRO DE NOTIFICACIONES
// ══════════════════════════════════════════════════════════════════════
// Punto de entrada único. Se monta con una línea:
//
//     import NotificationBell from '../NotificationCenter';
//     <li><NotificationBell /></li>
//
// NO confundir con component/notifications/, que es otra cosa: los avisos
// EFÍMEROS de la esquina inferior, que aparecen y se descartan solos. Este es
// el centro PERSISTENTE, con historial y estado de lectura guardados en
// jarvis_api.
//
// El resto se exporta por si otra pantalla arma su propia vista, pero importar
// desde acá mantiene una sola puerta: el día que una pieza cambie de nombre o
// se parta en dos, no hay que perseguir imports por el proyecto.

export { default } from './NotificationBell';
export { default as NotificationBell } from './NotificationBell';
export { default as NotificationPanel } from './NotificationPanel';
export { default as NotificationItem } from './NotificationItem';
export { default as NotificationAvatar } from './NotificationAvatar';
export { default as AttendanceDetail } from './AttendanceDetail';
export { default as ScheduleDetail } from './ScheduleDetail';
export { default as useNotifications, NOTIFICATION_EVENT } from './useNotifications';
export { viewOf } from './notificationViews';

export {
    getNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    decideNotificationRequest,
} from './notification.fetch';
