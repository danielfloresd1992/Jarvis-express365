import AttendanceDetail from './AttendanceDetail';
import CommentDetail from './CommentDetail';
import ScheduleDetail from './ScheduleDetail';
import BonusDetail from './BonusDetail';

// ══════════════════════════════════════════════════════════════════════
// VISTAS POR FAMILIA — el espejo en el cliente del patrón del backend
// ══════════════════════════════════════════════════════════════════════
// jarvis_api declara la FAMILIA en la estrategia del tipo y la manda dentro de
// la notificación. Acá cada familia dice cómo se pinta.
//
// El componente que dibuja no conoce ninguna familia: pide su vista al registro
// y obedece. Agregar una nueva es registrar un objeto más, sin tocar el ítem ni
// la bandeja.
//
// La alternativa era un `if (type.startsWith('schedule'))` dentro del ítem. Con
// tres familias parece igual; con doce es una cadena de condicionales que hay
// que leer entera para entender por qué algo se ve como se ve. Y un tipo mal
// escrito caería en un estilo cualquiera sin avisar.
//
//
// CADA FAMILIA TIENE SU COLOR, Y ES INFORMACIÓN
//
// El color no decora: dice de qué es el aviso antes de leerlo. En una bandeja
// de siete, distinguir "te cambiaron el horario" de "alguien comentó tu día"
// tiene que costar una mirada, no una lectura.
//
// Los tonos están elegidos para el fondo azul casi negro de esta app y son
// claramente distintos entre sí. Ninguno usa el cian de la barra: ese color es
// del chrome, y confundir contenido con chrome es justo lo que hay que evitar.
//
// Van como TRIPLETA RGB y no como hexadecimal porque el CSS necesita el color
// sólido y además tres transparencias del mismo tono. Con `rgb(var(--fam-rgb) /
// .07)` sale de un único valor; con `color-mix` haría falta un navegador de
// 2023 en adelante, y esto corre en estaciones de monitoreo que no se
// actualizan.
//
// `label` es el nombre que se lee al pasar el ratón. Sin él, el color sería un
// código secreto que solo entiende quien lo eligió.

const Calendar = (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'
        className='absolute -right-2 -bottom-2 w-[86px] h-[86px] opacity-[0.06] pointer-events-none'
        aria-hidden='true'>
        <rect x='3' y='4' width='18' height='18' rx='2' />
        <path d='M16 2v4M8 2v4M3 10h18' />
        <path d='M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01' />
    </svg>
);

const Building = (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'
        className='absolute -right-2 -bottom-2 w-[86px] h-[86px] opacity-[0.06] pointer-events-none'
        aria-hidden='true'>
        <path d='m2 7 4.4-4.4A2 2 0 0 1 7.8 2h8.3a2 2 0 0 1 1.5.6L22 7' />
        <path d='M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8' />
        <path d='M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4M2 7h20' />
    </svg>
);

const Bubble = (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'
        className='absolute -right-2 -bottom-2 w-[86px] h-[86px] opacity-[0.06] pointer-events-none'
        aria-hidden='true'>
        <path d='M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-4-.9L3 21l1.9-5a8.4 8.4 0 0 1-.9-4 8.4 8.4 0 0 1 8.4-8.4h.6a8.4 8.4 0 0 1 8 8v.4z' />
    </svg>
);

const Clock = (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'
        className='absolute -right-2 -bottom-2 w-[86px] h-[86px] opacity-[0.06] pointer-events-none'
        aria-hidden='true'>
        <circle cx='12' cy='12' r='9' />
        <path d='M12 7v5l3.2 1.9' />
    </svg>
);

const Spark = (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'
        className='absolute -right-2 -bottom-2 w-[86px] h-[86px] opacity-[0.06] pointer-events-none'
        aria-hidden='true'>
        <path d='M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1' />
        <circle cx='12' cy='12' r='4' />
    </svg>
);


const Tag = (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'
        className='absolute -right-2 -bottom-2 w-[86px] h-[86px] opacity-[0.06] pointer-events-none'
        aria-hidden='true'>
        <path d='M20.6 13.4 12 22l-8.6-8.6A2 2 0 0 1 2.8 12V4a2 2 0 0 1 2-2h8a2 2 0 0 1 1.4.6l6.4 6.4a2 2 0 0 1 0 2.4z' />
        <circle cx='7.5' cy='7.5' r='1.5' />
    </svg>
);

// La estrella va RELLENA, no de contorno como el resto de las marcas de agua.
// Es la única así en toda la bandeja: sobre el fondo casi negro, una silueta
// llena pesa mas que un trazo, y ese peso extra es justamente lo que hace que
// el aviso de bonificación se encuentre sin leer.
const Star = (
    <svg viewBox='0 0 24 24' fill='currentColor'
        className='absolute -right-2 -bottom-2 w-[86px] h-[86px] opacity-[0.10] pointer-events-none'
        aria-hidden='true'>
        <path d='m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z' />
    </svg>
);


// ── Glifos de la insignia (16px, trazo grueso para que lea en pequeño) ──

const glifo = (paths) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2'
        strokeLinecap='round' strokeLinejoin='round' className='w-[13px] h-[13px]'>
        {paths}
    </svg>
);

const CalendarGlyph = glifo(<><rect x='3' y='4' width='18' height='18' rx='2' /><path d='M16 2v4M8 2v4M3 10h18' /></>);
const ClockGlyph = glifo(<><circle cx='12' cy='12' r='9' /><path d='M12 7v5l3.2 1.9' /></>);
const BubbleGlyph = glifo(<path d='M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-4-.9L3 21l1.9-5a8.4 8.4 0 0 1-.9-4 8.4 8.4 0 0 1 8.4-8.4h.6a8.4 8.4 0 0 1 8 8v.4z' />);
const StoreGlyph = glifo(<><path d='m2 7 4.4-4.4A2 2 0 0 1 7.8 2h8.3a2 2 0 0 1 1.5.6L22 7' /><path d='M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M2 7h20' /></>);
const SparkGlyph = glifo(<><path d='M12 3v3M12 18v3M3 12h3M18 12h3' /><circle cx='12' cy='12' r='4' /></>);
const DotGlyph = glifo(<circle cx='12' cy='12' r='7' />);
const TagGlyph = glifo(<><path d='M20.6 13.4 12 22l-8.6-8.6A2 2 0 0 1 2.8 12V4a2 2 0 0 1 2-2h8a2 2 0 0 1 1.4.6l6.4 6.4a2 2 0 0 1 0 2.4z' /><circle cx='7.5' cy='7.5' r='1.5' /></>);

// El unico glifo relleno del registro. Ver la nota de la marca de agua Star.
const StarGlyph = (
    <svg viewBox='0 0 24 24' fill='currentColor' className='w-[13px] h-[13px]'>
        <path d='m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z' />
    </svg>
);


const VIEWS = {
    // Horario: guardia, permisos, faltas, cambios de jornada, horas extras.
    schedule: {
        label: 'Horario',
        rgb: '62 207 74',
        watermark: Calendar,
        showTarget: true,
        // Cada día que cambió, con lo que le pusieron. El cuerpo del aviso lo
        // resume; esto lo desglosa y lo resalta.
        detail: (n) => <ScheduleDetail n={n} />,
        glyph: CalendarGlyph,
        fallbackIcon: CalendarGlyph,
    },

    // El marcaje PROPIO: entrada, salida, retardo, día extra. Es la única
    // familia con detalle visual bajo el texto —las dos fotos—, porque es la
    // única donde el aviso además sirve de comprobante.
    attendance: {
        label: 'Marcaje',
        rgb: '45 212 191',
        watermark: Clock,
        // Actor y afectado son la MISMA persona: es su propio marcaje.
        showTarget: false,
        detail: (n) => <AttendanceDetail n={n} />,
        glyph: ClockGlyph,
        fallbackIcon: ClockGlyph,
    },

    // Una nota escrita sobre el día de otra persona.
    comment: {
        label: 'Comentario',
        rgb: '251 191 36',
        watermark: Bubble,
        // El nombre del comentado ya está en el cuerpo y su cara en el detalle.
        showTarget: false,
        // El detalle pinta las dos caras a 50px; el avatar chico sobra.
        hideAvatar: true,
        detail: (n) => <CommentDetail n={n} />,
        glyph: BubbleGlyph,
        fallbackIcon: BubbleGlyph,
    },

    // Establecimientos y franquicias.
    resource: {
        label: 'Establecimiento',
        rgb: '96 165 250',
        watermark: Building,
        showTarget: false,
        glyph: StoreGlyph,
        fallbackIcon: StoreGlyph,
    },

    // Anuncios de la plataforma.
    system: {
        label: 'Sistema',
        rgb: '192 132 252',
        watermark: Spark,
        showTarget: false,
        glyph: SparkGlyph,
        fallbackIcon: SparkGlyph,
    },

    // La alerta como tal: se creó, se editó, se eliminó. Gris pizarra: es
    // información operativa y no debe competir con lo que sí toca dinero.
    menu: {
        label: 'Alerta',
        rgb: '148 163 184',
        watermark: Tag,
        showTarget: false,
        glyph: TagGlyph,
        fallbackIcon: TagGlyph,
    },

    // Cambió lo que PAGA una alerta.
    //
    // Dorado, y es el único dorado de la bandeja. El ámbar del comentario
    // (251 191 36) es más amarillo y más claro; este tira a oro viejo y va con
    // la estrella rellena, así que los dos se distinguen aunque compartan
    // familia cromática. La distancia importa: uno avisa que alguien escribió
    // una nota, el otro que cambió lo que se cobra.
    bonus: {
        label: 'Bonificación',
        rgb: '217 164 65',
        watermark: Star,
        showTarget: false,
        detail: (n) => <BonusDetail n={n} />,
        glyph: StarGlyph,
        fallbackIcon: StarGlyph,
    },

    // Sin familia declarada. Sin marca de agua: es preferible que una
    // notificación nueva se vea sobria a que herede un fondo que no le toca.
    general: {
        label: 'Aviso',
        rgb: '148 163 184',
        watermark: null,
        showTarget: false,
        glyph: DotGlyph,
        fallbackIcon: DotGlyph,
    },
};


/**
 * Vista de una notificación. Las creadas antes de que existiera `family` no la
 * traen: caen en 'general' y se ven sobrias, no rotas.
 */
export const viewOf = (n) => VIEWS[n?.family] || VIEWS.general;

export default VIEWS;
