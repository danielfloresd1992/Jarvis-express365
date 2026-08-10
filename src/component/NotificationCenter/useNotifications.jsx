import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { socketAppManager } from '../../store/slices/socketio';
import {
    getNotifications, getUnreadCount,
    markNotificationRead, markAllNotificationsRead, decideNotificationRequest,
} from './notification.fetch';

// ══════════════════════════════════════════════════════════════════════
// NOTIFICACIONES — estado, socket, lectura y decisiones
// ══════════════════════════════════════════════════════════════════════
// Concentra todo para que los componentes solo pinten.
//
// Se usa socketAppManager y no el `socket` de libs/socket/io.js: el primero
// apunta a VITE_SOCKET_JARVIS_URL, que es jarvis_api, el servidor que emite las
// notificaciones. El otro va al bot de ava y no sabe nada de esto.
//
// El usuario se UNE a su sala al conectarse: es lo que permite que las
// personales lleguen solo a él. Sin sala habría que emitir a todos y
// esconderlas en el front, que no es lo mismo que no enviarlas.

const LANG = 'es';
export const NOTIFICATION_EVENT = 'notification:new';

/**
 * Cuántas trae cada tanda.
 *
 * Siete y no veinte: la bandeja tiene una altura fija y con siete se llena sin
 * que nada quede a medio asomar. Pedir veinte de entrada era traer —y renderizar
 * con sus fotos y avatares— tres pantallas de más que casi nadie llegaba a
 * mirar, y esta app corre en Electron sobre las estaciones de monitoreo.
 *
 * jarvis_api acepta hasta 50 por página, así que se cambia acá sin tocar la API.
 */
export const PAGE_SIZE = 7;


// ══════════════════════════════════════════════════════════════════════
// VISTO ≠ LEÍDO
// ══════════════════════════════════════════════════════════════════════
// Son dos cosas distintas y no deben mezclarse:
//
//   LEÍDO  → hecho del negocio. Vive en jarvis_api (notificationRead) y solo
//            cambia cuando la persona ABRE la notificación, la clica o decide
//            sobre ella. Es lo que apaga el contador.
//   VISTO  → atención de ESTA pantalla. "Ya me enteré de que hay algo nuevo".
//            Solo apaga la ALARMA —el repique, el halo, el color de aviso—;
//            el contador de pendientes sigue igual.
//
// Va en localStorage y no en el backend porque es estado de pantalla, no del
// negocio: mirar la bandeja en una estación no tiene por qué apagar el aviso en
// otra, donde todavía no te enteraste. Además no gasta ida y vuelta.
//
// Se guarda EL CONTADOR de pendientes en el momento de mirar, no una marca de
// tiempo: así no hace falta cargar la lista para saber si hay algo nuevo, y
// alcanza con el contador que la campana ya pide al montarse.
//
// La clave lleva el id del usuario a propósito: en las estaciones de monitoreo
// se turnan varias personas en la misma máquina y, sin eso, que uno mirara la
// bandeja le apagaría el aviso al siguiente.

const CLAVE_VISTO = (userId) => `jarvis:notif-visto:${userId}`;

/** Pendientes que el usuario ya sabe que tiene en esta estación. */
const leerVisto = (userId) => {
    if (!userId) return 0;
    try {
        const n = Number(window.localStorage.getItem(CLAVE_VISTO(userId)));
        return Number.isFinite(n) && n >= 0 ? n : 0;
    }
    // Modo privado o almacenamiento lleno: se sigue sin persistir. El aviso
    // volverá a sonar en cada carga, que es el lado seguro del error.
    catch { return 0; }
};

const guardarVisto = (userId, valor) => {
    if (!userId) return;
    try { window.localStorage.setItem(CLAVE_VISTO(userId), String(valor)); }
    catch { /* ver arriba */ }
};


export default function useNotifications() {
    const user = useSelector(store => store.user);
    const userId = user?._id;
    const isAdmin = user?.admin === true;

    const [notifications, setNotifications] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [total, setTotal] = useState(0);
    const [deciding, setDeciding] = useState(null);

    // Sube con cada notificación que ENTRA en vivo. La campana lo usa como
    // `key` para remontar el ícono y reiniciar la sacudida: una animación CSS
    // no se relanza sola si el nodo sigue siendo el mismo.
    const [pulseKey, setPulseKey] = useState(0);

    // Pendientes que el usuario ya sabe que tiene (ver "VISTO ≠ LEÍDO").
    // `null` es "todavía no se leyó localStorage": mientras tanto no se avisa
    // de nada, para no dar un golpe de alarma que se apague solo al instante.
    const [visto, setVisto] = useState(null);

    // ¿Ya contestó el contador del servidor? Hace falta distinguirlo de "hay
    // cero pendientes": al montar, `unread` arranca en 0 porque todavía no se
    // preguntó, y sin esta bandera la sincronía de abajo leería ese 0 como una
    // caída real y borraría la marca guardada — con lo que recargar la app
    // reviviría la alarma de notificaciones que ya se habían mirado.
    const [contadorListo, setContadorListo] = useState(false);

    // Cerrojo de carga en un ref: el estado no se actualiza a tiempo para
    // frenar dos aperturas seguidas dentro del mismo tick.
    const loadingRef = useRef(false);
    const mounted = useRef(true);
    useEffect(() => () => { mounted.current = false; }, []);

    /** Texto en el idioma activo, con respaldo al otro si faltara. */
    const textOf = useCallback((n) => {
        const t = n?.i18n?.[LANG] || n?.i18n?.es || n?.i18n?.en || {};
        return { title: t.title || '', body: t.body || '' };
    }, []);

    const refreshUnread = useCallback(async () => {
        if (!userId) return;
        try {
            const data = await getUnreadCount();
            if (!mounted.current) return;
            setUnread(data?.unread ?? 0);
            setContadorListo(true);
        } catch { /* el contador no puede romper la app */ }
    }, [userId]);


    /**
     * Primera página. Se llama CADA vez que se abre la campana, no solo la
     * primera: entre una apertura y otra pudo llegar algo con el socket caído,
     * y la lista se habría quedado vieja sin avisar.
     */
    const load = useCallback(async () => {
        if (!userId || loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        setError(null);
        try {
            const data = await getNotifications({ page: 0, limit: PAGE_SIZE });
            if (!mounted.current) return;
            setNotifications(data?.notifications || []);
            setTotal(data?.total ?? 0);
        }
        catch (err) {
            // Un fallo NO puede verse como "sin notificaciones": eso se lee
            // como "no hay nada" cuando en realidad no se pudo consultar.
            if (mounted.current) {
                setError(err?.response?.data?.message || 'No se pudieron cargar las notificaciones.');
            }
        }
        finally {
            loadingRef.current = false;
            if (mounted.current) setLoading(false);
        }
    }, [userId]);


    /** Siguiente página, al final de la lista. */
    const loadMore = useCallback(async () => {
        if (!userId || loadingRef.current) return;
        const page = Math.floor(notifications.length / PAGE_SIZE);
        loadingRef.current = true;
        setLoadingMore(true);
        try {
            const data = await getNotifications({ page, limit: PAGE_SIZE });
            if (!mounted.current) return;
            const nuevas = data?.notifications || [];
            // Se descartan las repetidas: entre página y página pudo entrar una
            // por socket y desplazar el resto, duplicando la del borde.
            setNotifications(prev => {
                const vistos = new Set(prev.map(p => String(p._id)));
                return [...prev, ...nuevas.filter(n => !vistos.has(String(n._id)))];
            });
            setTotal(data?.total ?? 0);
        }
        catch { /* silencioso: el botón sigue para reintentar */ }
        finally {
            loadingRef.current = false;
            if (mounted.current) setLoadingMore(false);
        }
    }, [userId, notifications.length]);


    useEffect(() => { refreshUnread(); }, [refreshUnread]);


    // ── Visto: hidratación y sincronía ────────────────────────────────
    // Al cambiar de usuario se relee su propia marca; sin sesión se vuelve a
    // "desconocido" para no arrastrar la del anterior. En las estaciones
    // compartidas esto es lo que impide que un turno herede el aviso del otro.
    useEffect(() => {
        setContadorListo(false);
        setVisto(userId ? leerVisto(userId) : null);
    }, [userId]);

    // Si los pendientes BAJAN —porque se leyeron acá o en otra estación—, la
    // marca tiene que bajar con ellos. Si no, quedaría por encima del contador
    // y haría falta acumular esa misma cantidad otra vez para volver a avisar.
    useEffect(() => {
        if (!userId || !contadorListo || visto === null || unread >= visto) return;
        setVisto(unread);
        guardarVisto(userId, unread);
    }, [unread, visto, userId, contadorListo]);

    /**
     * "Ya vi que hay novedades." Apaga la alarma SIN tocar el estado de lectura:
     * las notificaciones siguen sin leer y el contador, intacto.
     *
     * Si todavía no llegó el contador no se guarda nada: quedaría un 0 falso.
     * La campana vuelve a llamar en cuanto el contador cambie, así que abrir la
     * bandeja antes de tiempo no pierde el gesto.
     */
    const markSeen = useCallback(() => {
        if (!userId || !contadorListo) return;
        setVisto(unread);
        guardarVisto(userId, unread);
    }, [userId, unread, contadorListo]);

    // Hay novedad mientras entren más pendientes de los que el usuario ya sabía.
    const hasNew = visto !== null && unread > visto;


    // ── Sala de socket y llegada en vivo ──────────────────────────────
    useEffect(() => {
        if (!userId) return;

        const join = () => socketAppManager.emit('join-user', { userId, admin: isAdmin });

        // Al reconectar las salas se pierden: hay que volver a unirse o las
        // personales dejarían de llegar en silencio.
        join();
        socketAppManager.on('connect', join);

        const onNew = (notification) => {
            if (!notification?._id) return;
            setUnread(n => n + 1);
            setPulseKey(k => k + 1);
            setNotifications(prev => (
                prev.some(p => String(p._id) === String(notification._id))
                    ? prev
                    : [{ ...notification, read: false }, ...prev]
            ));
            setTotal(t => t + 1);
        };

        socketAppManager.on(NOTIFICATION_EVENT, onNew);

        return () => {
            socketAppManager.off('connect', join);
            socketAppManager.off(NOTIFICATION_EVENT, onNew);
            socketAppManager.emit('leave-user', { userId });
        };
    }, [userId, isAdmin]);


    // ── Lectura ───────────────────────────────────────────────────────
    const markRead = useCallback(async (id) => {
        // Optimista: la campana responde de inmediato y el servidor confirma.
        let cambiaba = false;
        setNotifications(prev => prev.map(n => {
            if (String(n._id) !== String(id) || n.read) return n;
            cambiaba = true;
            return { ...n, read: true };
        }));
        if (!cambiaba) return;
        setUnread(n => Math.max(0, n - 1));

        try { await markNotificationRead(id); }
        catch { refreshUnread(); }
    }, [refreshUnread]);

    const markAllRead = useCallback(async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnread(0);
        try { await markAllNotificationsRead(); }
        catch { refreshUnread(); }
    }, [refreshUnread]);


    // ── Solicitudes ───────────────────────────────────────────────────
    // NO es optimista, a diferencia de marcar como leída: al aprobar es el
    // servidor quien escribe el horario, y adelantar el resultado dejaría la
    // campana diciendo "aprobado" sobre un cambio que pudo no aplicarse.
    const decide = useCallback(async (id, decision, note = '') => {
        setDeciding(id);
        try {
            const data = await decideNotificationRequest(id, decision, note);
            const actualizada = data?.notification;
            setNotifications(prev => prev.map(n => (
                String(n._id) === String(id)
                    ? {
                        ...n,
                        ...(actualizada || {}),
                        read: true,
                        request: actualizada?.request || { ...n.request, status: decision },
                    }
                    : n
            )));
            refreshUnread();
            return { ok: true, applied: data?.applied ?? 0 };
        }
        catch (err) {
            return { ok: false, message: err?.response?.data?.message || 'No se pudo procesar la solicitud.' };
        }
        finally {
            if (mounted.current) setDeciding(null);
        }
    }, [refreshUnread]);


    return {
        notifications, unread, total,
        loading, loadingMore, error,
        hasMore: notifications.length < total,
        // Cuántas trae realmente el botón. La última tanda casi nunca son
        // siete, y prometer "ver 7 más" para traer 2 es mentirle al que pulsa.
        nextCount: Math.max(0, Math.min(PAGE_SIZE, total - notifications.length)),
        load, loadMore,
        markRead, markAllRead,
        decide, deciding,
        textOf, pulseKey,
        hasNew, markSeen,
        isAdmin,
    };
}
