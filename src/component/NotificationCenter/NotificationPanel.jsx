import { useEffect, useRef } from 'react';
import NotificationItem from './NotificationItem';

/*
 * La bandeja desplegable de la campana.
 *
 * Aquí CUELGA del navbar, no de un riel lateral como en Client365: se ancla
 * bajo el botón y se alinea a la derecha, que es donde vive la barra. En
 * pantallas angostas se limita con max-width para no salirse.
 *
 * Solo pinta. El estado, el socket y las lecturas viven en useNotifications.
 */

export default function NotificationPanel({
    open, onClose, notifications, unread, loading, loadingMore, error, hasMore, nextCount = 0,
    onLoadMore, onRetry, onMarkRead, onMarkAllRead, textOf, onDecide, deciding, isAdmin,
}) {
    const ref = useRef(null);

    // Cierre al hacer clic fuera y con Escape. Sin esto la bandeja queda
    // abierta sobre el contenido y hay que volver a la campana para cerrarla.
    useEffect(() => {
        if (!open) return;

        const onDown = (e) => {
            // El botón de la campana vive fuera del panel: si no se excluye,
            // su propio clic cerraría y volvería a abrir en el mismo gesto.
            if (ref.current && !ref.current.contains(e.target) && !e.target.closest?.('[data-notif-bell]')) {
                onClose();
            }
        };
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };

        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    if (!open) return null;

    const vacia = !loading && !error && notifications.length === 0;

    return (
        <div
            ref={ref}
            role='dialog'
            aria-label='Notificaciones'
            className='notif-center notif-panel absolute right-0 top-[calc(100%+10px)] z-[1200] w-[370px] max-w-[calc(100vw-24px)] flex flex-col rounded-xl overflow-hidden'
        >
            {/* Cabecera */}
            <div className='notif-panel__head shrink-0 flex items-center gap-2 px-4 py-3'>
                <p className='notif-panel__title'>Notificaciones</p>
                {unread > 0 && (
                    <span className='notif-panel__count'>
                        {unread}
                    </span>
                )}
                {unread > 0 && (
                    <button
                        type='button'
                        onClick={onMarkAllRead}
                        className='notif-panel__action ml-auto'
                    >
                        Marcar todas como leídas
                    </button>
                )}
            </div>

            {/*
              Lista con ALTO FIJO (notif-panel__list) y no elástico: cada tanda
              que se carga se va al scroll en vez de estirar la bandeja. Sin
              esto, pulsar "ver más" empujaba el panel hacia abajo y el botón se
              escapaba de donde estaba el cursor.
            */}
            <div className='notif-panel__list overflow-y-auto'>
                {loading && notifications.length === 0 && (
                    <p className='notif-empty__hint px-4 py-8 text-center'>Cargando…</p>
                )}

                {/*
                  Un fallo NO se muestra como "sin notificaciones": eso se lee
                  como "no hay nada" cuando en realidad no se pudo consultar.
                */}
                {error && notifications.length === 0 && (
                    <div className='px-4 py-8 text-center'>
                        <p className='notif-error__title'>No se pudieron cargar</p>
                        <p className='notif-empty__hint'>{error}</p>
                        <button
                            type='button'
                            onClick={onRetry}
                            className='notif-action notif-action--accept mt-3 px-4'
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {vacia && (
                    <div className='px-4 py-10 text-center'>
                        <p className='notif-empty__title'>Sin notificaciones</p>
                        <p className='notif-empty__hint'>
                            Acá aparecerán los cambios del sistema.
                        </p>
                    </div>
                )}

                {notifications.map(n => {
                    const { title, body } = textOf(n);
                    return (
                        <NotificationItem
                            key={n._id}
                            n={n}
                            title={title}
                            body={body}
                            canDecide={Boolean(isAdmin && onDecide && n.request?.status === 'pending')}
                            deciding={deciding === n._id}
                            onMarkRead={onMarkRead}
                            onDecide={onDecide}
                        />
                    );
                })}

                {hasMore && (
                    <button
                        type='button'
                        onClick={onLoadMore}
                        disabled={loadingMore}
                        className='notif-panel__action w-full py-3'
                    >
                        {loadingMore ? 'Cargando…' : (nextCount ? `Ver ${nextCount} más` : 'Ver más')}
                    </button>
                )}
            </div>
        </div>
    );
}
