import NotificationAvatar from './NotificationAvatar';
import { viewOf } from './notificationViews';

/*
 * Una fila de la bandeja. Solo pinta: el estado vive en useNotifications.
 *
 * A diferencia de Client365, acá el ítem NO navega. `resource.path` apunta a
 * rutas de Client365 (/user, /clients&manasgement) que en Reportes Express no
 * existen: seguirlas llevaría a una pantalla en blanco. Al hacer clic solo se
 * marca como leída.
 *
 * EL COLOR DE LA FAMILIA VIAJA COMO VARIABLE CSS
 *
 * La fila declara `--fam-rgb` con el tono de su familia y el resto —la
 * insignia, el chip, el fondo al pasar el ratón— lo deriva de ahí. Así el color
 * de una familia se define UNA vez, en notificationViews, y no repartido en
 * clases por todo el componente.
 */

// Color del punto según la importancia que le dio la estrategia del backend.
const LEVEL_DOT = {
    success: 'notif-level--success',
    warning: 'notif-level--warning',
    danger: 'notif-level--danger',
    info: 'notif-level--info',
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
        <div className='notif-item' style={{ '--fam-rgb': view.rgb }}>
            <button
                type='button'
                onClick={() => onMarkRead(n._id)}
                /* El nombre de la familia también acá: el ratón puede caer en
                   cualquier punto de la fila, no solo sobre la insignia. */
                title={`${view.label} · ${n.read ? 'leída' : 'sin leer'}`}
                className={`notif-row ${n.read ? '' : 'notif-row--unread'}`}
            >
                {/* La familia se reconoce por la INSIGNIA del avatar y por su
                    nombre escrito abajo, no por una franja de color al borde:
                    una barra lateral gruesa es adorno, y con seis familias la
                    bandeja se convierte en un semáforo. */}
                <span className='notif-row__watermark' aria-hidden='true'>
                    {view.watermark}
                </span>

                <div className='relative flex items-start gap-2.5'>
                    {/* Punto de nivel; hace de indicador de no leída */}
                    <span className={`notif-level ${n.read ? 'notif-level--read' : `notif-dot ${LEVEL_DOT[n.level] || LEVEL_DOT.info}`}`} />

                    {/* Una familia puede pintar a las personas por su cuenta en
                        su detalle; ahí el avatar chico de al lado sería la
                        misma cara repetida. Lo decide la vista. */}
                    {!view.hideAvatar && <NotificationAvatar n={n} />}

                    <div className='min-w-0 flex-1'>
                        <p className={`notif-title ${n.read ? 'notif-title--read' : ''}`}>
                            {title}
                        </p>
                        <p className='notif-body'>{body}</p>

                        {/* Qué campos cambiaron */}
                        {(n.changes?.length ?? 0) > 0 && (
                            <p className='notif-meta mt-1'>
                                {n.changes.slice(0, 3).map(c => c.label || c.field).join(' · ')}
                                {n.changes.length > 3 && ` +${n.changes.length - 3}`}
                            </p>
                        )}

                        {/* En horario se nombra a quién le cambiaron la jornada:
                            el cuerpo ya lo dice, pero al ojear se busca el
                            nombre, no la frase. */}
                        {view.showTarget && target && (
                            <p className='notif-meta mt-1'>
                                <span className='notif-target'>{target}</span>
                                <span> · lo cambió {actor || 'el sistema'}</span>
                            </p>
                        )}

                        {/* Bloque propio de la familia —las fotos del marcaje,
                            por ejemplo—. Acá no se sabe qué dibuja: lo decide
                            su vista. */}
                        {view.detail?.(n)}

                        <div className='flex items-center gap-2 mt-1.5 flex-wrap'>
                            {/* El nombre de la familia, escrito. El color por sí
                                solo no dice de qué es el aviso. */}
                            <span className='notif-chip-family'>{view.label}</span>

                            <span className='notif-meta'>{desde(n.createdAt)}</span>

                            {n.scope === 'personal' && (
                                <span className='notif-scope notif-scope--personal'>para ti</span>
                            )}
                            {n.scope === 'admin' && (
                                <span className='notif-scope notif-scope--admin'>solo admin</span>
                            )}
                            {actor && !view.showTarget && (
                                <span className='notif-meta truncate'>· {actor}</span>
                            )}
                        </div>

                        {resuelta && (
                            <p className={`notif-resolved ${n.request.status === 'approved' ? 'notif-resolved--ok' : 'notif-resolved--no'}`}>
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
                        className='notif-action notif-action--accept'
                    >
                        {deciding ? 'Procesando…' : 'Aceptar'}
                    </button>
                    <button
                        type='button'
                        disabled={deciding}
                        onClick={() => onDecide(n._id, 'rejected')}
                        className='notif-action notif-action--cancel'
                    >
                        Cancelar
                    </button>
                </div>
            )}

            {pendiente && !canDecide && (
                <p className='notif-pending'>Pendiente por aprobar</p>
            )}
        </div>
    );
}
