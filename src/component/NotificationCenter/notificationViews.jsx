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

import AttendanceDetail from './AttendanceDetail';

const Calendar = (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'
        className='absolute -right-2 -bottom-2 w-[86px] h-[86px] text-[#29c50c] opacity-[0.07] pointer-events-none'
        aria-hidden='true'>
        <rect x='3' y='4' width='18' height='18' rx='2' />
        <path d='M16 2v4M8 2v4M3 10h18' />
        <path d='M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01' />
    </svg>
);

const Building = (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'
        className='absolute -right-2 -bottom-2 w-[86px] h-[86px] text-blue-600 opacity-[0.06] pointer-events-none'
        aria-hidden='true'>
        <path d='m2 7 4.4-4.4A2 2 0 0 1 7.8 2h8.3a2 2 0 0 1 1.5.6L22 7' />
        <path d='M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8' />
        <path d='M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4M2 7h20' />
    </svg>
);

const Clock = (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'
        className='absolute -right-2 -bottom-2 w-[86px] h-[86px] text-teal-600 opacity-[0.07] pointer-events-none'
        aria-hidden='true'>
        <circle cx='12' cy='12' r='9' />
        <path d='M12 7v5l3.2 1.9' />
    </svg>
);

const Spark = (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'
        className='absolute -right-2 -bottom-2 w-[86px] h-[86px] text-amber-500 opacity-[0.07] pointer-events-none'
        aria-hidden='true'>
        <path d='M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1' />
        <circle cx='12' cy='12' r='4' />
    </svg>
);

const StoreGlyph = (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className='w-[17px] h-[17px]'>
        <path d='m2 7 4.4-4.4A2 2 0 0 1 7.8 2h8.3a2 2 0 0 1 1.5.6L22 7' />
        <path d='M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M2 7h20' />
    </svg>
);

const CalendarGlyph = (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className='w-[17px] h-[17px]'>
        <rect x='3' y='4' width='18' height='18' rx='2' />
        <path d='M16 2v4M8 2v4M3 10h18' />
    </svg>
);

const ClockGlyph = (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className='w-[17px] h-[17px]'>
        <circle cx='12' cy='12' r='9' />
        <path d='M12 7v5l3.2 1.9' />
    </svg>
);


const VIEWS = {
    // Horario: guardia, permisos, faltas, cambios de jornada, horas extras.
    // Verde de marca y calendario de fondo.
    schedule: {
        watermark: Calendar,
        accent: 'bg-[#29c50c]',
        unreadBg: 'bg-[#29c50c]/[0.05]',
        unreadHoverBg: 'hover:bg-[#29c50c]/[0.10]',
        showTarget: true,
        fallbackIcon: CalendarGlyph,
    },

    // El marcaje PROPIO: entrada, salida, retardo, día extra. Es la única
    // familia con detalle visual bajo el texto —las dos fotos—, porque es la
    // única donde el aviso además sirve de comprobante.
    //
    // Teal y no verde de marca: se parece al horario pero no es lo mismo, y
    // conviene distinguir de un vistazo "te cambiaron la jornada" de "así
    // marcaste hoy".
    attendance: {
        watermark: Clock,
        accent: 'bg-teal-500',
        unreadBg: 'bg-teal-500/[0.05]',
        unreadHoverBg: 'hover:bg-teal-500/[0.10]',
        // Actor y afectado son la MISMA persona: es su propio marcaje. Mostrar
        // dos caras iguales sería ruido.
        showTarget: false,
        detail: (n) => <AttendanceDetail n={n} />,
        fallbackIcon: ClockGlyph,
    },

    resource: {
        watermark: Building,
        accent: 'bg-blue-500',
        unreadBg: 'bg-blue-500/[0.04]',
        unreadHoverBg: 'hover:bg-blue-500/[0.09]',
        showTarget: false,
        fallbackIcon: StoreGlyph,
    },

    system: {
        watermark: Spark,
        accent: 'bg-amber-400',
        unreadBg: 'bg-amber-400/[0.06]',
        unreadHoverBg: 'hover:bg-amber-400/[0.12]',
        showTarget: false,
        fallbackIcon: StoreGlyph,
    },

    // Sin familia declarada. Sin marca de agua: es preferible que una
    // notificación nueva se vea sobria a que herede un fondo que no le toca.
    general: {
        watermark: null,
        accent: 'bg-gray-300',
        unreadBg: 'bg-gray-500/[0.04]',
        unreadHoverBg: 'hover:bg-gray-500/[0.09]',
        showTarget: false,
        fallbackIcon: StoreGlyph,
    },
};


/**
 * Vista de una notificación. Las creadas antes de que existiera `family` no la
 * traen: caen en 'general' y se ven sobrias, no rotas.
 */
export const viewOf = (n) => VIEWS[n?.family] || VIEWS.general;

export default VIEWS;
