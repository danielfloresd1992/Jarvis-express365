// ══════════════════════════════════════════════════════════════════════
// QUÉ SE CAMBIÓ EN EL HORARIO
// ══════════════════════════════════════════════════════════════════════
// El cuerpo del aviso ya resume el cambio en una frase. Esto lo desglosa: un
// día por línea, con la fecha y lo que le pusieron.
//
// Antes el aviso solo decía "modificó tu horario el 12/08/2026", así que para
// saber si te habían puesto falta, libre o vacaciones había que abrir la
// grilla. El tipo de cambio ES la información.
//
// Los tonos son los mismos que en Client365 pero adaptados al fondo oscuro de
// esta app: quien ve una falta en rojo en el horario la reconoce igual acá.

const TONOS = {
    falta:      'notif-day--falta',
    extra:      'notif-day--extra',
    descanso:   'notif-day--libre',
    permiso:    'notif-day--permiso',
    vacaciones: 'notif-day--vacaciones',
    laboral:    'notif-day--laboral',
    // Roles del día: no son un tipo de jornada, son un papel dentro de ella.
    onDuty:     'notif-day--guardia',
    auxiliary:  'notif-day--auxiliar',
};

const tonoDe = (c) => TONOS[c.workType || c.rol || ''] || 'notif-day--laboral';

/** Horario del día, si el tipo lo lleva. Libre o falta no tienen horas. */
const horasDe = (c) => (c.startTime && c.endTime) ? `${c.startTime} – ${c.endTime}` : '';


export default function ScheduleDetail({ n }) {
    const cambios = n?.meta?.cambios || [];
    if (cambios.length === 0) return null;

    // Se muestran hasta cinco. Un lote de treinta días llenaría la bandeja
    // entera con una sola notificación.
    const visibles = cambios.slice(0, 5);
    const restantes = cambios.length - visibles.length;

    return (
        <div className='notif-days mt-2'>
            {visibles.map((c, i) => (
                <div key={c.dayKey || i} className='notif-day'>
                    {/* La fecha primero: es lo que se busca al repasar. */}
                    <span className='notif-day__date'>{c.fecha || c.dayKey}</span>

                    <span className={`notif-day__tag ${tonoDe(c)}`}>
                        {/* Quitar un rol también se avisa, y decir solo
                            "Guardia" haría entender lo contrario. */}
                        {c.asignado === false ? `${c.etiqueta} retirada` : c.etiqueta}
                    </span>

                    {horasDe(c) && <span className='notif-day__hours'>{horasDe(c)}</span>}
                    {c.shift && <span className='notif-day__hours'>{c.shift}</span>}
                </div>
            ))}

            {restantes > 0 && (
                <p className='notif-day__more'>
                    y {restantes} {restantes === 1 ? 'día más' : 'días más'}
                </p>
            )}
        </div>
    );
}
