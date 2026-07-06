import { useState, useEffect } from 'react';


//  Región arrastrable / no arrastrable de la ventana sin marco
const DRAG = { WebkitAppRegion: 'drag' };
const NO_DRAG = { WebkitAppRegion: 'no-drag' };


export function TitleBar({ appName = 'Jarvis Express 365' }) {


//  Sólo se muestra dentro de Electron (en el navegador no hace nada)
    const api = typeof window !== 'undefined' ? window.electronAPI : null;


    const [isMax, setIsMax] = useState(false);
    const [stats, setStats] = useState({ cpu: 0, ramPercent: 0, ramUsedGb: '0', ramTotalGb: '0' });


//  SUSCRIPCIONES: estado maximizado + estadísticas CPU/RAM en tiempo real
//  + marca el <html> con 'is-electron' para empujar la app debajo de la barra
    useEffect(() => {
        if (!api?.isElectron) return;

        document.documentElement.classList.add('is-electron');

        const offMax = api.onMaximizeChange(setIsMax);
        const offStats = api.onSystemStats(setStats);

        return () => {
            document.documentElement.classList.remove('is-electron');
            offMax?.();
            offStats?.();
        };
    }, []);


    if (!api?.isElectron) return null;


//  HANDLERS DE LOS BOTONES
    const handdlerMinimize = () => api.minimize();
    const handdlerMaximize = () => api.maximize();
    const handdlerClose = () => api.close();




    return (
        <div style={DRAG} className='shrink-0 z-[999999] flex items-center justify-between h-8 w-full select-none bg-[#021326] border-b border-[#0a3a66] pl-3'>


            {/*  IZQUIERDA: ícono + nombre  */}
            <div className='flex items-center gap-2 min-w-0'>
                <img src='/app-icon.png' alt='' className='w-[18px] h-[18px] object-contain' draggable={false} />
                <span className='text-[12px] font-semibold tracking-[0.4px] text-[#aecbf0] truncate'>{appName}</span>
            </div>


            {/*  CENTRO: consumo de CPU y RAM en tiempo real  */}
            <div className='flex items-center gap-4 text-[11px] font-mono tabular-nums text-[#5e7ba0]'>

                <span className='flex items-center gap-1.5'>
                    <span className='w-1.5 h-1.5 rounded-full' style={{ background: stats.cpu > 80 ? '#ff4d4d' : '#39ff14' }} />
                    CPU {stats.cpu}%
                </span>

                <span className='flex items-center gap-1.5'>
                    <span className='w-1.5 h-1.5 rounded-full' style={{ background: stats.ramPercent > 80 ? '#ff4d4d' : '#00b9ff' }} />
                    RAM {stats.ramPercent}% ({stats.ramUsedGb}/{stats.ramTotalGb} GB)
                </span>

            </div>


            {/*  DERECHA: botones minimizar / maximizar / cerrar  */}
            <div style={NO_DRAG} className='flex items-center h-full'>

                <button onClick={handdlerMinimize} className='h-full w-12 flex items-center justify-center text-[#aecbf0] hover:bg-[#0a3a66]/60'>
                    <svg width='15' height='15' viewBox='0 0 11 11'><line x1='1' y1='6' x2='10' y2='6' stroke='currentColor' strokeWidth='1.2' /></svg>
                </button>

                <button onClick={handdlerMaximize} className='h-full w-12 flex items-center justify-center text-[#aecbf0] hover:bg-[#0a3a66]/60'>
                    {
                        isMax ?
                            <svg width='15' height='15' viewBox='0 0 11 11' fill='none' stroke='currentColor' strokeWidth='1.2'>
                                <rect x='2.5' y='1' width='7' height='7' /><rect x='1' y='2.5' width='7' height='7' fill='#021326' />
                            </svg>
                            :
                            <svg width='15' height='15' viewBox='0 0 11 11' fill='none' stroke='currentColor' strokeWidth='1.2'>
                                <rect x='1' y='1' width='9' height='9' />
                            </svg>
                    }
                </button>

                <button onClick={handdlerClose} className='h-full w-12 flex items-center justify-center text-[#aecbf0] hover:bg-[#c0392b] hover:text-white'>
                    <svg width='15' height='15' viewBox='0 0 11 11' stroke='currentColor' strokeWidth='1.2'>
                        <line x1='1' y1='1' x2='10' y2='10' /><line x1='10' y1='1' x2='1' y2='10' />
                    </svg>
                </button>

            </div>


        </div>
    );
}