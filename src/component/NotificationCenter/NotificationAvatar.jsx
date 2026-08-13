import { viewOf } from './notificationViews';

/**
 * El visual de la notificación. Qué muestra depende de la FAMILIA que declara
 * jarvis_api en su estrategia.
 *
 * · schedule → DOS caras: quien hizo el cambio y a quién se lo hicieron. En el
 *   horario intervienen dos personas y ver solo una deja la mitad de la
 *   historia; "Kervis cambió un horario" no dice de quién.
 *
 * · resource → el logo del establecimiento en grande, con la foto de quien lo
 *   tocó como insignia. Lo que se reconoce de un vistazo es el logo.
 *
 * · sin recurso ni familia → el actor solo. Cubre a las notificaciones
 *   anteriores a estos campos: se ven bien, no rotas.
 *
 * SOBRE TODO ESO VA LA INSIGNIA DE FAMILIA
 *
 * Un punto con el ícono del tipo, en el color de su familia, siempre visible.
 * Antes el ícono de familia era solo un respaldo para cuando faltaba la foto,
 * así que en la práctica no se veía nunca: todas las notificaciones eran caras
 * redondas y había que leerlas para saber de qué iban.
 */

const initials = (p) => (p?.name?.[0] || '') + (p?.surName?.[0] || '');


function Face({ person, size, ring }) {
    return (
        <span
            className={`notif-face rounded-full overflow-hidden flex items-center justify-center shrink-0 ${ring ? 'notif-face--ring' : ''}`}
            style={{ width: size, height: size }}
        >
            {person?.img
                ? <img src={person.img} alt='' className='w-full h-full object-cover' />
                : (
                    <span className='notif-face__initials font-black leading-none'
                        style={{ fontSize: Math.max(8, size * 0.36) }}>
                        {initials(person) || '·'}
                    </span>
                )}
        </span>
    );
}


/**
 * Insignia de la familia: el ícono del tipo sobre su color.
 *
 * Lleva `title` a propósito. El color solo diferencia; el nombre explica. Quien
 * pasa el ratón se entera de qué es "el punto ámbar" sin tener que deducirlo.
 */
function FamilyBadge({ view }) {
    return (
        <span
            className='notif-badge-family'
            title={view.label}
            aria-label={view.label}
        >
            {view.glyph}
        </span>
    );
}


export default function NotificationAvatar({ n }) {
    const view = viewOf(n);
    const hayTarget = Boolean(n?.target?.name || n?.target?.img);

    // ── Horario: las dos personas ─────────────────────────────────────
    if (view.showTarget && hayTarget) {
        return (
            <span className='notif-avatar relative w-9 h-9 shrink-0'>
                {/* Detrás, quien hizo el cambio */}
                <span className='absolute top-0 left-0'>
                    <Face person={n.actor} size={26} ring />
                </span>
                {/* Delante, la persona afectada: es de quien habla el aviso */}
                <span className='absolute bottom-0 right-0'>
                    <Face person={n.target} size={26} ring />
                </span>
                <FamilyBadge view={view} />
            </span>
        );
    }

    const kind = n?.resource?.kind || '';
    if (!n?.resource?.img && !kind) {
        return (
            <span className='notif-avatar relative w-9 h-9 shrink-0'>
                <Face person={n?.actor} size={36} />
                <FamilyBadge view={view} />
            </span>
        );
    }

    // ── Recurso: su imagen manda, la persona es la insignia ───────────
    return (
        <span className='notif-avatar relative w-9 h-9 shrink-0'>
            {/* Cuadrado redondeado, no círculo: un logo no es una cara */}
            <span className='notif-logo w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center'>
                {n.resource?.img
                    ? <img src={n.resource.img} alt='' className='w-full h-full object-cover' />
                    : view.fallbackIcon}
            </span>

            <span className='absolute -bottom-1 -right-1'>
                <Face person={n.actor} size={17} ring />
            </span>
            <FamilyBadge view={view} />
        </span>
    );
}
