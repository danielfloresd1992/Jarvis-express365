import { useState, useEffect } from 'react';


/*  MINIMIZAR, MAXIMIZAR Y CERRAR LA VENTANA
 *
 *  Las tres teclas de la derecha de la ventana de escritorio, que crea la carcasa sin el marco de Windows.
 *  Las usan dos barras: la barra de título suelta (TitleBar, en las pantallas sin barra de navegación, como
 *  el inicio de sesión) y la barra de navegación de Home (NavBar), que la lleva dentro desde que las dos se
 *  fundieron en una (pedido del usuario).
 *
 *  Van con `no-drag`: dentro de una zona arrastrable de la ventana (`WebkitAppRegion: 'drag'`) ningún
 *  elemento responde al clic si no lo lleva. Su aspecto va en las clases 'window-controls…' de App.css.
 *
 *  Fuera de la carcasa (un navegador, el teléfono) no hay ventana que controlar: no se pintan.
 */


/*  @param {string} className  opcional. Una clase más para el grupo, para colocarlo en su barra
 */
export default function WindowControls({ className = '' }) {

    const api = typeof window !== 'undefined' ? window.electronAPI : null;

    // maximized = «la ventana está maximizada»: cambia el icono del botón de en medio
    const [maximized, setMaximized] = useState(false);

    //  La suscripción devuelve su función para darse de baja, y hay que llamarla: sin eso, cada montaje
    //  dejaría un oyente vivo.
    useEffect(() => {
        if (!api?.isElectron) return undefined;
        const stop = api.onMaximizeChange?.(setMaximized);
        return () => stop?.();
    }, []);

    if (!api?.isElectron) return null;

    return (
        <div className={`window-controls ${className}`} style={{ WebkitAppRegion: 'no-drag' }}>

            <button type='button' className='window-controls__key' onClick={() => api.minimize?.()} aria-label='Minimizar' title='Minimizar'>
                <svg width='10' height='10' viewBox='0 0 10 10' fill='none' stroke='currentColor' strokeWidth='1' aria-hidden='true'>
                    <path d='M0 5.5h10' />
                </svg>
            </button>

            <button type='button' className='window-controls__key' onClick={() => api.maximize?.()} aria-label={maximized ? 'Restaurar' : 'Maximizar'} title={maximized ? 'Restaurar' : 'Maximizar'}>
                {
                    //  Dos cuadrados superpuestos cuando está maximizada, uno cuando no: el lenguaje de Windows.
                    //  El de delante se rellena con el color de la barra, que es lo que tapa al de detrás.
                    maximized ? (
                        <svg width='10' height='10' viewBox='0 0 10 10' fill='none' stroke='currentColor' strokeWidth='1' aria-hidden='true'>
                            <rect x='2.5' y='0.5' width='7' height='7' />
                            <rect x='0.5' y='2.5' width='7' height='7' fill='var(--window-controls-bg, var(--color-jx-panel))' />
                        </svg>
                    ) : (
                        <svg width='10' height='10' viewBox='0 0 10 10' fill='none' stroke='currentColor' strokeWidth='1' aria-hidden='true'>
                            <rect x='0.5' y='0.5' width='9' height='9' />
                        </svg>
                    )
                }
            </button>

            {/*  Cerrar se pone rojo al pasar el ratón, como en Windows, con la cruz en blanco (4,80 : 1)  */}
            <button type='button' className='window-controls__key window-controls__key--close' onClick={() => api.close?.()} aria-label='Cerrar' title='Cerrar'>
                <svg width='10' height='10' viewBox='0 0 10 10' fill='none' stroke='currentColor' strokeWidth='1.1' aria-hidden='true'>
                    <path d='M0 0l10 10M10 0L0 10' />
                </svg>
            </button>

        </div>
    );
}
