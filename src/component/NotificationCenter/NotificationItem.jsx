import NotificationAvatar from './NotificationAvatar';
import { viewOf } from './notificationViews';

/*
 * Una fila de la bandeja. Solo pinta: el estado vive en useNotifications.
 *
 * A diferencia de Client365, acá el ítem NO navega. `resource.path` apunta a
 * rutas de Client365 (/user, /clients&manasgement) que en Reportes Express no
 * existen: seguirlas llevaría a una pantalla en blanco. Al hacer clic solo se
 * marca como leída.
 */

// Color del punto según la importancia que le dio la estrategia del backend.
const LEVEL_DOT = {
    success: 'bg-[#29c50c]',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-blue-500',
};

/**
 * "hace 5 minutos". Escrito a mano porque este proyecto no tiene date-fns y no
 * vale la pena sumar una dependencia por una línea de texto.
 */
const desde = (fecha) => {
    if (!fecha) return '';
    const ms = Date.now() - new Date(fecha).getTime();
    if (!Number.isFinite(ms) || ms < 0) return '';

    const min = Math.floor(ms / 60000);
    if (min < 1) return 'hace un momento';
    if (min < 60) return `hace ${min} minuto${min === 1 ? '' : 's'}`;

    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h} hora${h === 1 ? '' : 's'}`;

    const d = Math.floor(h / 24);
    if (d < 30) return `hace ${d} día${d === 1 ? '' : 's'}`;

    const meses = Math.floor(d / 30);
    if (meses < 12) return `hace ${meses} mes${meses === 1 ? '' : 'es'}`;

    const años = Math.floor(meses / 12);
    return `hace ${años} año${años === 1 ? '' : 's'}`;
};


export default function NotificationItem({
    n, title, body, canDecide, deciding, onMarkRead, onDecide,
}) {
    const actor = `${n.actor?.name || ''} ${n.actor?.surName || ''}`.trim();
    const target = `${n.target?.name || ''} ${n.target?.surName || ''}`.trim();
    const pendiente = n.request?.status === 'pending';
    const resuelta = n.request?.status === 'approved' || n.request?.status === 'rejected';

    // La apariencia la decide la FAMILIA que declaró el backend: acá no se sabe
    // qué es "schedule" ni qué es "resource".
    const view = viewOf(n);

    return (
        <div className='notif-item border-b border-gray-50'>
            <button
                type='button'
                onClick={() => onMarkRead(n._id)}
                className={`relative block w-full text-left px-4 py-3 overflow-hidden transition-colors duration-150 active:scale-[.99] ${n.read
                    ? 'hover:bg-gray-50'
                    : `${view.unreadBg} ${view.unreadHoverBg}`}`}
            >
                {/* Franja lateral con el color de la familia */}
                <span
                    aria-hidden='true'
                    className={`absolute left-0 top-0 bottom-0 w-[3px] ${view.accent} ${n.read ? 'opacity-30' : ''}`}
                />

                {view.watermark}

                <div className='relative flex items-start gap-2.5'>
                    {/* Punto de nivel; hace de indicador de no leída */}
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read
                        ? 'bg-gray-200'
                        : `notif-dot ${LEVEL_DOT[n.level] || LEVEL_DOT.info}`}`}
                    />

                    {/* Una familia puede pintar a las personas por su cuenta en
                        su detalle; ahí el avatar chico de al lado sería la
                        misma cara repetida. Lo decide la vista. */}
                    {!view.hideAvatar && <NotificationAvatar n={n} />}

                    <div className='min-w-0 flex-1'>
                        <p className={`text-[12.5px] leading-snug ${n.read ? 'font-semibold text-gray-600' : 'font-bold text-gray-800'}`}>
                            {title}
                        </p>
                        <p className='text-[11.5px] text-gray-500 leading-snug mt-0.5'>{body}</p>

                        {/* Qué campos cambiaron */}
                        {(n.changes?.length ?? 0) > 0 && (
                            <p className='text-[10.5px] text-gray-400 mt-1'>
                                {n.changes.slice(0, 3).map(c => c.label || c.field).join(' · ')}
                                {n.changes.length > 3 && ` +${n.changes.length - 3}`}
                            </p>
                        )}

                        {/* En horario se nombra a quién le cambiaron la jornada:
                            el cuerpo ya lo dice, pero al ojear se busca el
                            nombre, no la frase. */}
                        {view.showTarget && target && (
                            <p className='text-[10.5px] text-gray-500 mt-1'>
                                <span className='font-bold text-gray-700'>{target}</span>
                                <span className='text-gray-400'> · lo cambió {actor || 'el sistema'}</span>
                            </p>
                        )}

                        {/* Bloque propio de la familia —las fotos del marcaje,
                            por ejemplo—. Acá no se sabe qué dibuja: lo decide
                            su vista. */}
                        {view.detail?.(n)}

                        <div className='flex items-center gap-2 mt-1'>
                            <span className='text-[10px] text-gray-400'>{desde(n.createdAt)}</span>
                            {n.scope === 'personal' && (
                                <span className='text-[9px] font-bold uppercase tracking-wider text-blue-500'>para ti</span>
                            )}
                            {n.scope === 'admin' && (
                                <span className='text-[9px] font-bold uppercase tracking-wider text-amber-600'>solo admin</span>
                            )}
                            {actor && !view.showTarget && (
                                <span className='text-[10px] text-gray-300 truncate'>· {actor}</span>
                            )}
                        </div>

                        {resuelta && (
                            <p className={`text-[10.5px] font-bold mt-1.5 ${n.request.status === 'approved' ? 'text-[#1f9a08]' : 'text-rose-600'}`}>
                                {n.request.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                                {typeof n.request.decidedBy === 'object' && n.request.decidedBy?.name
                                    ? ` por ${n.request.decidedBy.name} ${n.request.decidedBy.surName || ''}`.trimEnd()
                                    : ''}
                            </p>
                        )}
                    </div>
                </div>
            </button>

            {canDecide && onDecide && (
                <div className='flex items-center gap-2 px-4 pb-3 -mt-1'>
                    <button
                        type='button'
                        disabled={deciding}
                        onClick={() => onDecide(n._id, 'approved')}
                        className='flex-1 h-8 rounded-lg text-[11px] font-bold text-white bg-[#29c50c] hover:bg-[#1f9a08] transition-colors disabled:opacity-60'
                    >
                        {deciding ? 'Procesando…' : 'Aceptar'}
                    </button>
                    <button
                        type='button'
                        disabled={deciding}
                        onClick={() => onDecide(n._id, 'rejected')}
                        className='flex-1 h-8 rounded-lg text-[11px] font-bold border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-60'
                    >
                        Cancelar
                    </button>
                </div>
            )}

            {pendiente && !canDecide && (
                <p className='px-4 pb-3 -mt-1 text-[10.5px] font-bold text-amber-600'>
                    Pendiente por aprobar
                </p>
            )}
        </div>
    );
}
