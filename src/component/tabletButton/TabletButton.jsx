import { useTabletWindow } from '../../hook/useTabletWindow.js';

// ══════════════════════════════════════════════════════════════════════
// SACAR / QUITAR LA TABLET
// ══════════════════════════════════════════════════════════════════════
// Por defecto la tablet vive en la ventana principal: el espejo en la barra
// de la izquierda y los registers en el centro de Home. Este botón la saca a
// una ventana flotante, y al quitarla vuelve sola a su sitio.
//
// La ventana NO vive acá: la crea la carcasa de escritorio (jarvis-desktop)
// como una ventana real del sistema, sin marco y siempre encima. Este botón
// solo pide que se abra o se cierre. Una página web no puede crear una
// ventana así por su cuenta, y por eso fuera de la carcasa no hay nada que
// sacar.
//
//
// EL ESTADO NO SE ADIVINA — LO DICE ELECTRON
//
// Si está abierta o no lo dice `useTabletWindow` (hook/useTabletWindow.js),
// que escucha a la carcasa. Ahí está explicado por qué no basta con un
// booleano que se dé vuelta en cada clic.
//
//
// DÓNDE SE COLOCA
//
// En la barra de arriba, junto a «Notificaciones», y con su misma clase
// (`nav-bar__action-btn`): es un acceso más del header, no un botón flotante
// encima del contenido. Antes iba fijo sobre la pantalla y tapaba lo que
// hubiera debajo.
//
// Devuelve el `<li>` entero y no solo el botón: sin carcasa no se pinta nada,
// y un `<li>` vacío seguiría ocupando su hueco en la fila de accesos.

export default function TabletButton() {

    const abierta = useTabletWindow();

    // Sin carcasa no hay ventana flotante. Se resuelve una vez y no cambia:
    // `electronAPI` lo pone el preload antes de que cargue nada de React.
    const hayCarcasa = Boolean(window.electronAPI);


    // O hay carcasa y el botón funciona, o no la hay y no se pinta. Sin
    // estados intermedios.
    //
    // Antes se mostraba apagado cuando faltaba la carcasa, para poder ver dónde
    // quedaba sin levantar Electron. Se quitó: un botón gris no dice «esto no
    // es la aplicación de escritorio», dice «esto está roto», y costó una
    // mañana de buscar el fallo donde no estaba.
    if (!hayCarcasa) return null;


    // Con la ventana fuera, el botón queda marcado en rojo (la variante está en
    // App.css, junto al resto de `nav-bar__action-btn`): es lo que avisa de que
    // el siguiente clic CIERRA, sin tener que leer el texto.
    return (
        <li>
            <button
                type='button'
                className={`nav-bar__action-btn ${abierta ? 'nav-bar__action-btn--tablet-open' : ''}`}
                onClick={() => {
                    if (abierta) window.electronAPI?.closeTabletWindow?.();
                    else window.electronAPI?.openTabletWindow?.();
                }}
                title={abierta ? 'Cerrar la ventana de la tablet y devolverla a la barra lateral' : 'Sacar la tablet de la barra lateral a una ventana flotante'}
            >
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                    <rect x='4' y='2' width='16' height='20' rx='2' />
                    <line x1='12' y1='18' x2='12.01' y2='18' />
                </svg>
                {abierta ? 'Quitar tablet' : 'Sacar tablet'}
            </button>
        </li>
    );
}
