/* ── Icons ─────────────────────────────────────────── */

const IconCheck = ({ active }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
        style={active ? { filter: 'drop-shadow(0 0 4px #4e8300)' } : {}}
        className={`w-3.5 h-3.5 transition-all duration-300 ${active ? 'text-green-600' : 'text-slate-300'}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
)

const IconWhatsapp = ({ active }) => (
    <svg viewBox="0 0 24 24" fill="currentColor"
        style={active ? { filter: 'drop-shadow(0 0 4px #4e8300)' } : {}}
        className={`w-3.5 h-3.5 transition-all duration-300 ${active ? 'text-green-600 notif-icon-active' : 'text-slate-300'}`}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.524 5.845L.057 23.571a.75.75 0 00.921.921l5.726-1.467A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.667-.518-5.186-1.42l-.371-.22-3.851.988.988-3.851-.22-.371A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
)

const IconX = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
        className="w-3.5 h-3.5 text-red-500"
        style={{ filter: 'drop-shadow(0 0 4px #ef4444)' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
)

/* ── Helpers ─────────────────────────────────────────── */

function getInitials(name = '') {
    return name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// Gradiente consistente por nombre — usa la paleta de la app
const AVATAR_COLORS = [
    { from: '#3a6c00', to: '#82c91e' },  // green
    { from: '#334155', to: '#64748b' },  // slate
    { from: '#4f46e5', to: '#818cf8' },  // indigo
    { from: '#0891b2', to: '#38bdf8' },  // cyan
    { from: '#b45309', to: '#fbbf24' },  // amber
    { from: '#9d174d', to: '#f472b6' },  // pink
]
function avatarStyle(name = '') {
    const { from, to } = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
    return { background: `linear-gradient(135deg, ${from}, ${to})` }
}

function resolveStatus(validationResult, givenToTheGroup) {
    const isApproved    = validationResult?.isApproved
    const discardClient = validationResult?.validationToDiscard?.byTheClient
    const discardDept   = validationResult?.validationToDiscard?.reportingDepartment
    const isInvalid     = discardClient || discardDept || isApproved === false

    if (isInvalid) return {
        label:      'Invalidada',
        accent:     '#ef4444',
        badgeBg:    'rgba(239,68,68,0.10)',
        badgeColor: '#dc2626',
        dotColor:   '#ef4444',
        cardBg:     '#fda6a6',
        invalid:    true,
    }
    if (isApproved && givenToTheGroup) return {
        label:      'Enviado',
        accent:     '#4e8300',
        badgeBg:    'rgba(78,131,0,0.10)',
        badgeColor: '#3a6c00',
        dotColor:   '#5d9a10',
        cardBg:     '#d3fdca',
        invalid:    false,
    }
    if (isApproved) return {
        label:      'Aprobada',
        accent:     '#4f46e5',
        badgeBg:    'rgba(79,70,229,0.08)',
        badgeColor: '#4338ca',
        dotColor:   '#6366f1',
        cardBg:     '#d3fdca',
        invalid:    false,
    }
    return {
        label:      'Pendiente',
        accent:     '#f59e0b',
        badgeBg:    'rgba(245,158,11,0.10)',
        badgeColor: '#d97706',
        dotColor:   '#f59e0b',
        cardBg:     '#fff',
        invalid:    false,
    }
}

/* ── Component ──────────────────────────────────────── */

export default function AlertUpdateCard({ data }) {
    const validationResult = data?.validationResult
    const sentToGroup      = !!data?.givenToTheGroup

    // Personas
    const validatorName = validationResult?.validatedByUser?.user?.nameUser || ''
    const senderName    = data?.sharedByUser?.user?.nameUser || ''

    // Contenido
    const title    = data?.title || 'Sin título'
    const localName = data?.local?.name || ''
    const imgUrl    = data?.imageToShare || data?.imageUrl?.[0]?.url || null
    const table     = data?.table || null
    const ticket    = data?.orderTicketNumber ?? null
    const validatedAt = validationResult?.updatedAt
        ? new Date(validationResult.updatedAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
        : null

    const status = resolveStatus(validationResult, sentToGroup)
  
    return (
        <div className='flex w-full h-full overflow-hidden' style={{ backgroundColor: status.cardBg }}>

            {/* ── Barra de acento izquierda ── */}
            <div className='w-[3px] min-w-[3px] h-full flex-shrink-0'
                style={{ background: status.accent }} />

            {/* ── Imagen de la novedad ── */}
            {imgUrl && (
                <div className='w-[52px] min-w-[52px] h-full overflow-hidden flex-shrink-0 relative'>
                    <img src={imgUrl} alt={title}
                        className='w-full h-full object-cover' />
                    {/* borde derecho sutil */}
                    <div className='absolute inset-y-0 right-0 w-px bg-slate-200' />
                </div>
            )}

            {/* ── Panel principal ── */}
            <div className='flex flex-col justify-between flex-1 min-w-0 p-[1rem]' style={{padding: '0.5rem'}}>

                {/* Fila top: tag + hora + badge */}
                <div className='flex items-center justify-between mb-1.5'>
                    <div className='flex items-center gap-1.5'>
                        <span className='notif-dot w-[6px] h-[6px] rounded-full flex-shrink-0'
                            style={{ backgroundColor: status.dotColor, boxShadow: `0 0 6px 1px ${status.dotColor}88` }} />
                        <span className='text-[9px] font-bold uppercase tracking-[0.15em] text-slate-700'>
                            Novedad
                        </span>
                        {validatedAt && (
                            <span className='text-[9px] font-bold text-slate-700'>· {validatedAt}</span>
                        )}
                    </div>

                    <span className='notif-badge text-[8px] font-bold uppercase tracking-wide px-2 py-[3px] rounded-full border'
                        style={{
                            background:  status.badgeBg,
                            color:       status.badgeColor,
                            borderColor: status.badgeBg.replace('0.10', '0.3').replace('0.08', '0.25'),
                            padding: '.2rem .5rem'
                        }}>
                        {status.label}
                    </span>
                </div>
                <div className='w-full'>
                    {/* Título */}
                    <p className='text-[12px] font-bold text-slate-900 leading-snug line-clamp-2'>
                        {title}
                    </p>

                    {/* Local */}
                    {localName && (
                        <p className='text-[9px] font-medium text-slate-800 uppercase tracking-widest mt-[3px] truncate'>
                            {localName}
                        </p>
                    )}

                    {/* Mesa y Ticket */}
                    {(table || ticket !== null) && (
                        <div className='flex items-center gap-2 mt-[3px]'>
                            {table && (
                                <span className='text-[9px] font-semibold text-slate-600'>
                                    Mesa: <span className='font-bold text-slate-800'>{table}</span>
                                </span>
                            )}
                            {ticket !== null && (
                                <span className='text-[9px] font-semibold text-slate-600'>
                                    Ticket: <span className='font-bold text-slate-800'>{ticket}</span>
                                </span>
                            )}
                        </div>
                    )}
                </div>
                {/* Separador */}
                <div className='w-full h-px bg-slate-100 mt-auto mb-2' />

                {/* ── Footer: avatares + iconos ── */}
                <div className='flex items-center justify-between gap-2'>

                    {/* Avatares apilados */}
                    <div className='flex items-center gap-2 min-w-0'>
                        <div className='relative w-9 h-6 flex-shrink-0'>

                            {/* Emisor — fondo */}
                            <div title={senderName}
                                className='absolute right-0 bottom-0 w-5 h-5 rounded-full flex items-center justify-center ring-[1.5px] ring-white'
                                style={avatarStyle(senderName)}>
                                <span className='text-[6px] font-black text-white leading-none'>
                                    {getInitials(senderName)}
                                </span>
                            </div>

                            {/* Validador — frente */}
                            <div title={validatorName}
                                className='absolute left-0 bottom-0 w-6 h-6 rounded-full flex items-center justify-center ring-[1.5px] ring-white shadow-sm'
                                style={avatarStyle(validatorName)}>
                                <span className='text-[8px] font-black text-white leading-none'>
                                    {getInitials(validatorName)}
                                </span>
                            </div>
                        </div>

                        {/* Nombres */}
                        <div className='flex flex-col min-w-0'>
                            <span className='text-[11px] font-medium text-bacl leading-tight truncate'>
                                {validatorName || '—'}
                            </span>
                            <span className='text-[9px] text-slate-600 leading-tight truncate'>
                                {senderName || '—'}
                            </span>
                        </div>
                    </div>

                    {/* Pill de iconos de estado */}
                    <div className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-full flex-shrink-0 bg-slate-50 border border-slate-200'>
                        {status.invalid
                            ? <IconX />
                            : <IconCheck active={validationResult?.isApproved} />
                        }
                        <div className='w-px h-3 bg-slate-200' />
                        <IconWhatsapp active={sentToGroup} />
                    </div>
                </div>
            </div>
        </div>
    )
}
