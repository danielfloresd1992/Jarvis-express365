import { useState, useEffect } from 'react';

// ══════════════════════════════════════════════════════════════════════
// BARRA DE TÍTULO
// ══════════════════════════════════════════════════════════════════════
// La carcasa de escritorio crea la ventana con `frame: false`, o sea sin la
// barra que pone Windows. Eso no es un descuido: una barra propia se pinta con
// los colores de la aplicación en vez del gris del sistema, y deja sitio para
// mostrar el consumo de CPU y memoria, que en las estaciones de monitoreo
// importa.
//
// Pero quitarla se lleva por delante todo lo que esa barra hacía. Sin este
// componente la ventana no se puede mover, ni minimizar, ni maximizar, ni
// cerrar: queda clavada donde Electron la abrió.
//
//
// CÓMO SE ARRASTRA UNA VENTANA SIN MARCO
//
// Con `WebkitAppRegion: 'drag'`. Es una propiedad de Chromium, no del estándar,
// y le dice al sistema "esta zona es la barra de título": arrastrando aquí se
// mueve la ventana entera.
//
// El precio es que dentro de una zona arrastrable NINGÚN elemento responde al
// clic — el sistema se queda el gesto antes de que llegue a la página. Por eso
// los botones llevan `no-drag`: sin eso, minimizar, maximizar y cerrar dejarían
// de funcionar sin dar ninguna pista de por qué.
//
//
// FUERA DE ELECTRON NO SE PINTA
//
// En un navegador no hay ventana del sistema que controlar, y `window.electronAPI`
// no existe. Se devuelve `null` en vez de una barra con tres botones muertos.

const DRAG = { WebkitAppRegion: 'drag' };
const NO_DRAG = { WebkitAppRegion: 'no-drag' };


export default function TitleBar({ appName = 'Jarvis Express 365' }) {

    const api = typeof window !== 'undefined' ? window.electronAPI : null;

    const [isMax, setIsMax] = useState(false);
    const [stats, setStats] = useState({ cpu: 0, ramPercent: 0, ramUsedGb: '0', ramTotalGb: '0' });


    // Las dos suscripciones devuelven su función para darse de baja. Hay que
    // llamarlas: las estadísticas llegan una vez por segundo y, sin soltarlas,
    // cada montaje dejaría un oyente vivo acumulando trabajo.
    useEffect(() => {
        if (!api?.isElectron) return;

        const offMax = api.onMaximizeChange?.(setIsMax);
        const offStats = api.onSystemStats?.(setStats);

        return () => {
            offMax?.();
            offStats?.();
        };
    }, []);


    if (!api?.isElectron) return null;


    // El umbral del 80 % es el que decide el color del punto: por encima pasa a
    // rojo. No apaga nada ni avisa a nadie — solo hace que se note de un vistazo
    // que la máquina va justa, que es lo que se quiere ver desde el otro lado
    // de la sala.
    const AVISO = 80;

    return (
        <div
            style={DRAG}
            className='fixed top-0 left-0 w-full h-8 z-[999999] flex items-center justify-between select-none bg-[#021326] border-b border-[#0a3a66] pl-3'
        >

            {/*  IZQUIERDA: ícono y nombre  */}
            <div className='flex items-center gap-2 min-w-0'>
                <img src='/logo1.PNG' alt='' className='w-[18px] h-[18px] object-contain' draggable={false} />
                <span className='text-[12px] font-semibold tracking-[0.4px] text-[#aecbf0] truncate'>{appName}</span>
            </div>


            {/*  CENTRO: consumo de CPU y memoria, en vivo  */}
            <div className='flex items-center gap-4 text-[11px] font-mono tabular-nums text-[#5e7ba0]'>

                <span className='flex items-center gap-1.5'>
                    <span className='w-1.5 h-1.5 rounded-full' style={{ background: stats.cpu > AVISO ? '#ff4d4d' : '#39ff14' }} />
                    CPU {stats.cpu}%
                </span>

                <span className='flex items-center gap-1.5'>
                    <span className='w-1.5 h-1.5 rounded-full' style={{ background: stats.ramPercent > AVISO ? '#ff4d4d' : '#00b9ff' }} />
                    RAM {stats.ramPercent}% ({stats.ramUsedGb}/{stats.ramTotalGb} GB)
                </span>

            </div>


            {/*  DERECHA: minimizar, maximizar y cerrar.
                 `no-drag` es obligatorio, no decorativo: ver la nota de arriba.  */}
            <div style={NO_DRAG} className='flex items-center h-full'>

                <button
                    onClick={() => api.minimize?.()}
                    className='h-full w-12 flex items-center justify-center text-[#aecbf0] hover:bg-[#0a3a66]/60'
                    title='Minimizar'
                >
                    <svg width='15' height='15' viewBox='0 0 11 11'>
                        <line x1='1' y1='6' x2='10' y2='6' stroke='currentColor' strokeWidth='1.2' />
                    </svg>
                </button>

                <button
                    onClick={() => api.maximize?.()}
                    className='h-full w-12 flex items-center justify-center text-[#aecbf0] hover:bg-[#0a3a66]/60'
                    title={isMax ? 'Restaurar' : 'Maximizar'}
                >
                    {
                        // Dos cuadrados superpuestos cuando está maximizada, uno
                        // cuando no: es el mismo lenguaje que usa Windows, así que
                        // no hay que explicárselo a nadie.
                        isMax ?
                            <svg width='15' height='15' viewBox='0 0 11 11' fill='none' stroke='currentColor' strokeWidth='1.2'>
                                <rect x='2.5' y='1' width='7' height='7' />
                                <rect x='1' y='2.5' width='7' height='7' fill='#021326' />
                            </svg>
                            :
                            <svg width='15' height='15' viewBox='0 0 11 11' fill='none' stroke='currentColor' strokeWidth='1.2'>
                                <rect x='1' y='1' width='9' height='9' />
                            </svg>
                    }
                </button>

                <button
                    onClick={() => api.close?.()}
                    className='h-full w-12 flex items-center justify-center text-[#aecbf0] hover:bg-[#c0392b] hover:text-white'
                    title='Cerrar'
                >
                    <svg width='15' height='15' viewBox='0 0 11 11' stroke='currentColor' strokeWidth='1.2'>
                        <line x1='1' y1='1' x2='10' y2='10' />
                        <line x1='10' y1='1' x2='1' y2='10' />
                    </svg>
                </button>

            </div>

        </div>
    );
}
