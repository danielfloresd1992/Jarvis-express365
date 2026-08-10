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
    const paleta = tone === 'in'
        ? { box: 'bg-emerald-50 border-emerald-200', tag: 'text-emerald-700', val: 'text-emerald-900' }
        : { box: 'bg-orange-50 border-orange-200', tag: 'text-orange-700', val: 'text-orange-900' };

    return (
        <div className={`rounded-lg border p-2 ${paleta.box}`}>
            <p className={`text-[9px] font-bold uppercase tracking-wider ${paleta.tag}`}>{label}</p>
            <p className={`text-[12px] font-bold leading-tight ${paleta.val}`}>{time || '—'}</p>

            {url ? (
                <img
                    src={url}
                    alt={label}
                    loading='lazy'
                    className='w-full h-[62px] object-cover rounded mt-1.5 bg-white'
                    /* La foto vive en el servidor de imágenes: si se cayó o la
                       borraron, esconderla es mejor que dejar el cuadro roto. */
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            ) : (
                <div className='w-full h-[62px] rounded mt-1.5 bg-white/70 border border-dashed border-current opacity-40 flex items-center justify-center'>
                    <span className='text-[9px] font-semibold'>sin foto</span>
                </div>
            )}
        </div>
    );
}


/** Etiqueta corta de consecuencia: puntual, retardo, unidades, día extra… */
function Chip({ text, tone }) {
    const tonos = {
        ok: 'bg-[#29c50c]/10 text-[#1f9a08] border-[#29c50c]/30',
        warn: 'bg-amber-100 text-amber-700 border-amber-300',
        bad: 'bg-rose-100 text-rose-700 border-rose-300',
        info: 'bg-blue-50 text-blue-700 border-blue-200',
    };
    return (
        <span className={`inline-flex items-center px-1.5 py-[1px] rounded border text-[9.5px] font-bold ${tonos[tone]}`}>
            {text}
        </span>
    );
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
            <p className='text-[10px] text-gray-400 mb-1.5 capitalize'>
                {fechaLarga(m.date || m.checkIn)}
            </p>

            <div className='grid grid-cols-2 gap-1.5'>
                <Marca label='Entrada' url={m.photoIn} time={hora(m.checkIn)} tone='in' />
                <Marca label='Salida' url={m.photoOut} time={hora(m.checkOut)} tone='out' />
            </div>

            <div className='flex flex-wrap items-center gap-1 mt-1.5'>
                {m.isLate
                    ? <Chip tone='bad' text={`${m.minutesLate || 0} min tarde`} />
                    : <Chip tone='ok' text='Puntual' />}

                {unidades > 0 && (
                    <Chip tone='warn' text={`${unidades} ${unidades === 1 ? 'unidad' : 'unidades'} desc.`} />
                )}

                {m.isExtraDay && <Chip tone='info' text='Día extra' />}

                {m.workedLabel && <Chip tone='info' text={`Trabajó ${m.workedLabel}`} />}

                {extras > 0 && (
                    <Chip
                        /* Aprobadas en verde, pendientes en ámbar: son dos
                           realidades distintas para quien las trabajó. */
                        tone={m.overtimeStatus === 'approved' ? 'ok' : 'warn'}
                        text={`${(extras / 60).toFixed(1).replace('.0', '')} h extra${m.overtimeStatus === 'approved' ? '' : ' por aprobar'}`}
                    />
                )}

                {m.startTime && (
                    <span className='text-[9.5px] text-gray-400'>pautado {m.startTime}</span>
                )}
            </div>
        </div>
    );
}
