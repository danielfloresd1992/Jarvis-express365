import { useState, useEffect } from 'react';
import useNotifications from './useNotifications';
import NotificationPanel from './NotificationPanel';
import './NotificationCenter.css';

/*
 * NotificationBell — la campana completa: botón, contador, animaciones y
 * bandeja.
 *
 * Se monta con una sola línea. El NavBar no sabe qué es una notificación, ni
 * llama al hook, ni conoce el panel.
 *
 * Las animaciones viven en NotificationCenter.css y animan SOLO transform y
 * opacity. Es una regla dura acá: animar box-shadow o width dejó a esta misma
 * app en 20% de CPU en reposo, y corre en Electron sobre las estaciones de
 * monitoreo, encendida toda la jornada.
 */

export default function NotificationBell() {
    const {
        notifications, unread, loading, loadingMore, error, hasMore, nextCount,
        load, loadMore, markRead, markAllRead, decide, deciding,
        textOf, pulseKey, hasNew, markSeen, isAdmin,
    } = useNotifications();

    const [open, setOpen] = useState(false);

    // DOS estados distintos, y de ahí sale toda la apariencia:
    //   hasUnread → hay pendientes: se muestra el número. Solo lo apaga LEER.
    //   hasNew    → además, todavía no te enteraste: suena la alarma. La apaga
    //               abrir la bandeja, sin marcar nada como leído.
    const hasUnread = unread > 0;

    // La lista se pide al ABRIR y CADA vez que se abre: el contador viene de un
    // endpoint que no trae documentos, así que quien nunca abre la campana no
    // paga por cargarla, y quien la reabre no se queda con una lista vieja.
    const toggle = () => {
        setOpen(abierto => {
            if (!abierto) load();
            return !abierto;
        });
    };

    // Abrir la bandeja es enterarse. Se mantiene mientras siga abierta —
    // `markSeen` cambia de identidad al cambiar el contador— para que algo que
    // llegue con la bandeja a la vista tampoco dispare la alarma.
    useEffect(() => {
        if (open) markSeen();
    }, [open, markSeen]);

    return (
        <div className='notif-center relative'>
            <button
                type='button'
                data-notif-bell
                onClick={toggle}
                aria-expanded={open}
                aria-label='Notificaciones'
                title={hasUnread
                    ? `Tienes ${unread} notificación${unread === 1 ? '' : 'es'} sin leer${hasNew ? ' · hay novedades' : ''}`
                    : 'Sin notificaciones nuevas'}
                className={`nav-bar__action-btn notif-bell ${hasNew ? 'notif-bell--new' : hasUnread ? 'notif-bell--seen' : ''}`}
            >
                {/* Onda que sale del botón al llegar algo. Va remontada con
                    `key`, igual que la sacudida: es lo único que relanza una
                    animación CSS ya terminada. */}
                {hasNew && pulseKey > 0 && (
                    <span key={`wave-${pulseKey}`} className='notif-bell__wave' aria-hidden='true' />
                )}

                <span className='relative inline-flex'>
                    {/*
                      DOS CAPAS, no una con dos animaciones: ambas animan
                      `transform` y sobre el mismo elemento se pisarían.
                      Anidadas, sus transformaciones se componen.

                      · Externa: repique periódico mientras haya NOVEDAD.
                      · Interna: sacudida de UNA pasada al llegar algo.
                        `key={pulseKey}` la remonta, que es lo único que
                        relanza una animación CSS ya terminada. Con pulseKey
                        en 0 no lleva clase, así no sacude al recargar.

                      Las dos se apagan al abrir la bandeja. El ícono, en
                      cambio, sigue siendo la campana ACTIVA mientras queden
                      pendientes: tacharla diría "no hay nada" junto a un
                      número que dice lo contrario.
                    */}
                    <span className={`inline-flex ${hasNew ? 'notif-bell--alert' : ''}`}>
                        <span key={pulseKey} className={`inline-flex ${pulseKey > 0 && hasNew ? 'notif-bell--shake' : ''}`}>
                            {hasUnread ? (
                                <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                                    <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' />
                                    <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0' />
                                </svg>
                            ) : (
                                <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                                    <path d='M8.7 3A6 6 0 0 1 18 8c0 7 3 9 3 9H6' />
                                    <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0' />
                                    <line x1='2' y1='2' x2='22' y2='22' />
                                </svg>
                            )}
                        </span>
                    </span>

                    {/* El halo late: es alarma pura, no información. Solo con
                        novedad sin ver. */}
                    {hasNew && (
                        <span className='absolute -top-1 -right-1 flex h-[8px] w-[8px]' aria-hidden='true'>
                            <span className='notif-badge-halo absolute inline-flex h-full w-full rounded-full'></span>
                            <span className='notif-badge-dot relative inline-flex rounded-full h-[8px] w-[8px]'></span>
                        </span>
                    )}
                </span>

                <span>Notificaciones</span>

                {hasUnread && (
                    // El número se queda mientras haya sin leer, pero se apaga a
                    // gris en cuanto dejan de ser novedad: sigue informando
                    // cuántas faltan sin tirar del ojo.
                    //
                    // key={unread}: el golpe seco se repite cada vez que cambia
                    // la cuenta, no solo al aparecer.
                    <span
                        key={unread}
                        className={`notif-badge-count ml-auto ${hasNew ? 'notif-badge-pop' : 'notif-badge-count--seen'}`}
                    >
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>

            <NotificationPanel
                open={open}
                onClose={() => setOpen(false)}
                notifications={notifications}
                unread={unread}
                loading={loading}
                loadingMore={loadingMore}
                error={error}
                hasMore={hasMore}
                nextCount={nextCount}
                onLoadMore={loadMore}
                onRetry={load}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
                textOf={textOf}
                onDecide={decide}
                deciding={deciding}
                isAdmin={isAdmin}
            />
        </div>
    );
}
