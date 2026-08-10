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
            className='notif-panel absolute right-0 top-[calc(100%+10px)] z-[1200] w-[370px] max-w-[calc(100vw-24px)] flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden'
            style={{ boxShadow: '0 12px 34px -6px rgba(15,23,42,0.30)' }}
        >
            {/* Cabecera */}
            <div className='shrink-0 flex items-center gap-2 px-4 py-3 border-b border-gray-100'>
                <p className='text-sm font-bold text-gray-800'>Notificaciones</p>
                {unread > 0 && (
                    <span className='text-[10px] font-black text-white bg-rose-500 rounded-full px-1.5 py-0.5 leading-none'>
                        {unread}
                    </span>
                )}
                {unread > 0 && (
                    <button
                        type='button'
                        onClick={onMarkAllRead}
                        className='ml-auto text-[11px] font-bold text-[#1f9a08] hover:underline'
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
                    <p className='px-4 py-8 text-center text-xs text-gray-400'>Cargando…</p>
                )}

                {/*
                  Un fallo NO se muestra como "sin notificaciones": eso se lee
                  como "no hay nada" cuando en realidad no se pudo consultar.
                */}
                {error && notifications.length === 0 && (
                    <div className='px-4 py-8 text-center'>
                        <p className='text-sm font-semibold text-rose-600'>No se pudieron cargar</p>
                        <p className='text-[11px] text-gray-400 mt-1'>{error}</p>
                        <button
                            type='button'
                            onClick={onRetry}
                            className='mt-3 h-8 px-4 rounded-lg text-[11px] font-bold text-white bg-[#29c50c] hover:bg-[#1f9a08] transition-colors'
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {vacia && (
                    <div className='px-4 py-10 text-center'>
                        <p className='text-sm font-semibold text-gray-500'>Sin notificaciones</p>
                        <p className='text-[11px] text-gray-400 mt-1'>
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
                        className='w-full py-3 text-[11px] font-bold text-[#1f9a08] hover:bg-gray-50 transition-colors disabled:opacity-60'
                    >
                        {loadingMore ? 'Cargando…' : (nextCount ? `Ver ${nextCount} más` : 'Ver más')}
                    </button>
                )}
            </div>
        </div>
    );
}
