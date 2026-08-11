// ══════════════════════════════════════════════════════════════════════
// COMENTARIO EN UNA CELDA DEL HORARIO
// ══════════════════════════════════════════════════════════════════════
// Una nota que alguien escribió sobre el día de otra persona.
//
// Intervienen dos: QUIEN ESCRIBE y SOBRE QUIÉN. Las dos caras se muestran a
// 50px —bastante más que el avatar del resto de la bandeja— porque acá el
// aviso es la conversación misma, no el resumen de un cambio: se reconoce
// antes por la cara que por el nombre.
//
// La nota va entre comillas y con franja lateral, como una cita. Es texto que
// escribió una persona, y mezclarlo con el cuerpo generado haría dudar de
// dónde termina uno y empieza el otro.
//
// El texto del comentario viaja en `meta`, así que sin esta vista la
// notificación llegaría acá sin lo único que importa de ella.

const FOTO = 50;

const nombreDe = (p) => `${p?.name || ''} ${p?.surName || ''}`.trim();


/** Cara de 50px. Sin foto, la inicial sobre el gris de siempre. */
function Cara({ persona, titulo, anillo }) {
    const nombre = nombreDe(persona);

    return (
        <div className='flex flex-col items-center gap-1 shrink-0' style={{ width: FOTO }}>
            <div
                className={`rounded-full overflow-hidden bg-slate-200 flex items-center justify-center ring-2 ${anillo}`}
                style={{ width: FOTO, height: FOTO }}
                title={`${titulo}: ${nombre || 'sin nombre'}`}
            >
                {persona?.img
                    ? (
                        <img
                            src={persona.img}
                            alt={nombre}
                            loading='lazy'
                            className='w-full h-full object-cover'
                            /* Si la foto ya no está, esconderla deja la inicial
                               de abajo a la vista en vez del cuadro roto. */
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    )
                    : <span className='text-[15px] font-black text-slate-500'>{nombre[0] || '?'}</span>}
            </div>
            <span className='text-[9px] font-bold uppercase tracking-tighter text-gray-400 leading-none'>
                {titulo}
            </span>
        </div>
    );
}


export default function CommentDetail({ n }) {
    const m = n?.meta || {};
    if (!m.message) return null;

    return (
        <div className='mt-2'>
            <div className='flex items-start gap-3'>
                <Cara persona={n.actor} titulo='Escribió' anillo='ring-[#29c50c]' />

                {/* Flecha de "sobre": deja claro quién comenta a quién sin
                    repetir los nombres, que ya están en el cuerpo del texto. */}
                <div className='flex flex-col items-center justify-center pt-[15px] text-gray-300'>
                    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' className='w-4 h-4'>
                        <path d='M5 12h14M13 6l6 6-6 6' />
                    </svg>
                </div>

                <Cara persona={n.target} titulo='Sobre' anillo='ring-blue-400' />

                {/* Día del horario comentado. Es dato distinto de la fecha del
                    aviso —que va abajo, en la fila de metadatos—: se puede
                    comentar hoy el turno de la semana pasada. */}
                {m.dayLabel && (
                    <div className='flex-1 min-w-0 pt-[2px] text-right'>
                        <p className='text-[9px] font-bold uppercase tracking-tighter text-gray-400 leading-none'>
                            Día del horario
                        </p>
                        <p className='text-[12px] font-black text-gray-700 leading-tight mt-0.5'>
                            {m.dayLabel}
                        </p>
                    </div>
                )}
            </div>

            <blockquote className='mt-2 pl-2.5 border-l-[3px] border-amber-300 bg-amber-50/60 rounded-r py-1.5 pr-2'>
                <p className='text-[11.5px] text-gray-700 leading-snug italic break-words'>
                    “{m.message}”
                </p>
            </blockquote>
        </div>
    );
}
