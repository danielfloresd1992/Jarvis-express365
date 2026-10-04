import { useState, useEffect } from 'react';

// ══════════════════════════════════════════════════════════════════════
// BARRA DE TÍTULO
// ══════════════════════════════════════════════════════════════════════
// La carcasa de escritorio crea la ventana con `frame: false`, o sea sin la
// barra que pone Windows. Eso no es un descuido: una barra propia se pinta con
// los colores de la aplicación en vez del gris del sistema.
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
// AQUÍ ESTABA EL CONSUMO DE CPU Y MEMORIA, Y YA NO
//
// En el centro de la barra iban dos lecturas en vivo —«CPU 21 %» y «RAM 49 %
// (11.8/23.9 GB)»— con un punto que se ponía rojo al pasar del 80 %. Se quitaron
// a petición del usuario: la aplicación no hacía nada con ese dato, solo lo
// enseñaba.
//
// Lo que se fue con ellas: el estado `stats`, la suscripción a `onSystemStats`
// —que llegaba UNA VEZ POR SEGUNDO— y el umbral del aviso.
//
// OJO, QUEDA LA MITAD DE FUERA. Quien calcula y envía esas medidas es la carcasa
// de Electron, que vive en el Escritorio y no en este repositorio. Esto deja de
// ESCUCHARLAS, pero la carcasa las sigue midiendo y emitiendo cada segundo
// contra nadie. Para quitarlo del todo hay que tocar también su `main.js`.
//
//
// FUERA DE ELECTRON NO SE PINTA
//
// En un navegador no hay ventana del sistema que controlar, y `window.electronAPI`
// no existe. Se devuelve `null` en vez de una barra con tres botones muertos.

const DRAG = { WebkitAppRegion: 'drag' };
const NO_DRAG = { WebkitAppRegion: 'no-drag' };

//  Las tres teclas de la derecha comparten tamaño y comportamiento; lo único que
//  cambia es el icono y qué pasa al pasar el ratón.
const TECLA = 'h-full w-12 flex items-center justify-center text-jx-tinta2 transition-colors';


//  El nombre por defecto es el que la gente ya conoce en las estaciones. Solo
//  se ve dentro de la aplicación de escritorio —en el navegador esta barra no
//  se pinta—, así que cambiarlo no toca la marca de la web, que sigue siendo
//  JarvisExpress en su propia cabecera.
export default function TitleBar({ appName = 'Reportes de alertas' }) {

    const api = typeof window !== 'undefined' ? window.electronAPI : null;

    const [isMax, setIsMax] = useState(false);


    //  La suscripción devuelve su función para darse de baja, y hay que llamarla:
    //  sin eso, cada montaje dejaría un oyente vivo.
    useEffect(() => {
        if (!api?.isElectron) return;

        const offMax = api.onMaximizeChange?.(setIsMax);

        return () => offMax?.();
    }, []);


    if (!api?.isElectron) return null;


    return (
        <div
            style={DRAG}
            className='fixed top-0 left-0 w-full h-8 z-[999999] flex items-center justify-between select-none bg-jx-panel border-b border-jx-regla2 pl-3'
        >

            {/*  IZQUIERDA: ícono y nombre  */}
            <div className='flex items-center gap-2 min-w-0'>
                <img src='/logo1.PNG' alt='' className='w-[18px] h-[18px] object-contain brightness-[0.22]' draggable={false} />
                <span className='text-[12px] font-semibold tracking-[0.4px] text-jx-tinta truncate'>{appName}</span>
            </div>


            {/*  DERECHA: minimizar, maximizar y cerrar.
                 `no-drag` es obligatorio, no decorativo: ver la nota de arriba.  */}
            <div style={NO_DRAG} className='flex items-center h-full'>

                <button
                    onClick={() => api.minimize?.()}
                    className={`${TECLA} hover:bg-jx-arena hover:text-jx-tinta`}
                    title='Minimizar'
                >
                    <svg width='15' height='15' viewBox='0 0 11 11'>
                        <line x1='1' y1='6' x2='10' y2='6' stroke='currentColor' strokeWidth='1.2' />
                    </svg>
                </button>

                <button
                    onClick={() => api.maximize?.()}
                    className={`${TECLA} hover:bg-jx-arena hover:text-jx-tinta`}
                    title={isMax ? 'Restaurar' : 'Maximizar'}
                >
                    {
                        // Dos cuadrados superpuestos cuando está maximizada, uno
                        // cuando no: es el mismo lenguaje que usa Windows, así que
                        // no hay que explicárselo a nadie.
                        //
                        // El relleno del cuadrado de delante tiene que ser el color
                        // DE LA BARRA, no un color suelto: es lo que tapa al de
                        // detrás y da la sensación de que uno está encima del otro.
                        isMax ?
                            <svg width='15' height='15' viewBox='0 0 11 11' fill='none' stroke='currentColor' strokeWidth='1.2'>
                                <rect x='2.5' y='1' width='7' height='7' />
                                <rect x='1' y='2.5' width='7' height='7' fill='var(--color-jx-panel)' />
                            </svg>
                            :
                            <svg width='15' height='15' viewBox='0 0 11 11' fill='none' stroke='currentColor' strokeWidth='1.2'>
                                <rect x='1' y='1' width='9' height='9' />
                            </svg>
                    }
                </button>

                {/*  Cerrar se pone rojo al pasar el ratón porque es lo que hace
                     Windows, y ahí sí va letra blanca: sobre el rojo de la paleta
                     da 4,80 : 1, mientras que la tinta se quedaría en 2,97.  */}
                <button
                    onClick={() => api.close?.()}
                    className={`${TECLA} hover:bg-jx-critico hover:text-white`}
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
