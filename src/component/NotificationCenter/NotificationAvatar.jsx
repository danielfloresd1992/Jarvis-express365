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
 */

const initials = (p) => (p?.name?.[0] || '') + (p?.surName?.[0] || '');


function Face({ person, size, ring }) {
    return (
        <span
            className={`rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0 ${ring ? 'ring-2 ring-white' : ''}`}
            style={{ width: size, height: size }}
        >
            {person?.img
                ? <img src={person.img} alt='' className='w-full h-full object-cover' />
                : (
                    <span className='font-black text-slate-600 leading-none'
                        style={{ fontSize: Math.max(8, size * 0.36) }}>
                        {initials(person) || '·'}
                    </span>
                )}
        </span>
    );
}


export default function NotificationAvatar({ n }) {
    const view = viewOf(n);
    const hayTarget = Boolean(n?.target?.name || n?.target?.img);

    // ── Horario: las dos personas ─────────────────────────────────────
    if (view.showTarget && hayTarget) {
        return (
            <span className='relative w-9 h-9 shrink-0'>
                {/* Detrás, quien hizo el cambio */}
                <span className='absolute top-0 left-0'>
                    <Face person={n.actor} size={26} ring />
                </span>
                {/* Delante, la persona afectada: es de quien habla el aviso */}
                <span className='absolute bottom-0 right-0'>
                    <Face person={n.target} size={26} ring />
                </span>
            </span>
        );
    }

    const kind = n?.resource?.kind || '';
    if (!n?.resource?.img && !kind) {
        return <Face person={n?.actor} size={36} />;
    }

    // ── Recurso: su imagen manda, la persona es la insignia ───────────
    return (
        <span className='relative w-9 h-9 shrink-0'>
            {/* Cuadrado redondeado, no círculo: un logo no es una cara */}
            <span className='w-9 h-9 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-gray-200 text-gray-400'>
                {n.resource?.img
                    ? <img src={n.resource.img} alt='' className='w-full h-full object-cover' />
                    : view.fallbackIcon}
            </span>

            <span className='absolute -bottom-1 -right-1'>
                <Face person={n.actor} size={17} ring />
            </span>
        </span>
    );
}
