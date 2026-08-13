// ══════════════════════════════════════════════════════════════════════
// DETALLE DE UN MARCAJE
// ══════════════════════════════════════════════════════════════════════
// El cuerpo de la notificación ya dice en una frase qué pasó. Esto es la
// PRUEBA: las dos fotos con las que quedó registrado el fichaje, la hora real
// contra la pautada, y las consecuencias — retardo, unidades, día extra.
//
// Es privado: solo lo ve quien marcó. jarvis_api manda la notificación a su
// sala de socket y la consulta filtra por destinatario, así que el contenido no
// llega a otros clientes.
//
// Vive fuera de NotificationItem a propósito. El ítem no conoce ninguna
// familia: le pide su detalle a la vista y lo pinta.

/**
 * "08:02 am". Se normaliza el "a. m." que devuelve Intl en es-VE para que la
 * tarjeta diga la hora igual que el texto de la notificación, que la escribe
 * la estrategia de jarvis_api con este mismo formato.
 */
const hora = (fecha) => {
    if (!fecha) return '';
    try {
        return new Date(fecha)
            .toLocaleTimeString('es-VE', {
                timeZone: 'America/Caracas', hour: '2-digit', minute: '2-digit', hour12: true,
            })
            .replace(/[  ]/g, ' ')
            .replace(/\ba\.\s*m\./i, 'am')
            .replace(/\bp\.\s*m\./i, 'pm')
            .trim();
    } catch { return ''; }
};

const fechaLarga = (fecha) => {
    if (!fecha) return '';
    try {
        return new Date(fecha).toLocaleDateString('es-VE', {
            timeZone: 'America/Caracas', weekday: 'long', day: 'numeric', month: 'long',
        });
    } catch { return ''; }
};


/** Foto del marcaje con su etiqueta y su hora. */
function Marca({ label, url, time, tone }) {
    return (
        <div className={`notif-mark notif-mark--${tone}`}>
            <p className='notif-mark__label'>{label}</p>
            <p className='notif-mark__time'>{time || '—'}</p>

            {url ? (
                <img
                    src={url}
                    alt={label}
                    loading='lazy'
                    className='notif-mark__photo'
                    /* La foto vive en el servidor de imágenes: si se cayó o la
                       borraron, esconderla es mejor que dejar el cuadro roto. */
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            ) : (
                <div className='notif-mark__empty'>sin foto</div>
            )}
        </div>
    );
}


/** Etiqueta corta de consecuencia: puntual, retardo, unidades, día extra… */
function Tag({ text, tone }) {
    return <span className={`notif-tag notif-tag--${tone}`}>{text}</span>;
}


export default function AttendanceDetail({ n }) {
    const m = n?.meta || {};
    if (!m.checkIn && !m.checkOut) return null;

    const unidades = Number(m.discountUnits) || 0;
    const extras = Number(m.overtimeMinutes) || 0;

    return (
        <div className='mt-2'>
            {/* La fecha de la JORNADA, que no siempre es la de la notificación:
                el turno nocturno se cierra en la madrugada del día siguiente. */}
            <p className='notif-detail__day'>{fechaLarga(m.date || m.checkIn)}</p>

            <div className='grid grid-cols-2 gap-1.5'>
                <Marca label='Entrada' url={m.photoIn} time={hora(m.checkIn)} tone='in' />
                <Marca label='Salida' url={m.photoOut} time={hora(m.checkOut)} tone='out' />
            </div>

            <div className='flex flex-wrap items-center gap-1 mt-1.5'>
                {m.isLate
                    ? <Tag tone='bad' text={`${m.minutesLate || 0} min tarde`} />
                    : <Tag tone='ok' text='Puntual' />}

                {unidades > 0 && (
                    <Tag tone='warn' text={`${unidades} ${unidades === 1 ? 'unidad' : 'unidades'} desc.`} />
                )}

                {m.isExtraDay && <Tag tone='info' text='Día extra' />}

                {m.workedLabel && <Tag tone='info' text={`Trabajó ${m.workedLabel}`} />}

                {extras > 0 && (
                    <Tag
                        /* Aprobadas en verde, pendientes en ámbar: son dos
                           realidades distintas para quien las trabajó. */
                        tone={m.overtimeStatus === 'approved' ? 'ok' : 'warn'}
                        text={`${(extras / 60).toFixed(1).replace('.0', '')} h extra${m.overtimeStatus === 'approved' ? '' : ' por aprobar'}`}
                    />
                )}

                {m.startTime && (
                    <span className='notif-meta'>pautado {m.startTime}</span>
                )}
            </div>
        </div>
    );
}
