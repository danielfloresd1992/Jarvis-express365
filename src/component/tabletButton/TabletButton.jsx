import { useEffect, useState } from 'react';

// ══════════════════════════════════════════════════════════════════════
// SACAR / QUITAR LA TABLET
// ══════════════════════════════════════════════════════════════════════
// Abre y cierra la ventana flotante que espeja la pantalla de la tablet.
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
// Sería más corto llevar acá un booleano y darlo vuelta en cada clic. Pero la
// ventana flotante tiene su propia ✕: si alguien la cierra desde ahí, ese
// booleano se quedaría diciendo "abierta" y el botón ofrecería quitar algo
// que ya no está.
//
// Por eso el estado llega por `tablet:estado`, que la carcasa emite cada vez
// que la ventana se abre o se cierra, venga de donde venga la orden. Al montar
// se pregunta una vez con `preguntarEstadoTablet`, porque la ventana puede
// llevar rato abierta de antes —al recargar Jarvis, por ejemplo— y sin esa
// pregunta el botón arrancaría mintiendo hasta el primer cambio.
//
//
// DÓNDE SE COLOCA
//
// Fijo arriba a la derecha, a 320 px del borde: justo a la izquierda de la
// bandeja del Toast POS, que ocupa los 300 px de la derecha cuando está
// abierta. La posición no cambia con la bandeja a propósito — un botón que
// salta de sitio según lo que haya abierto se vuelve difícil de encontrar.

export default function TabletButton() {

    const [abierta, setAbierta] = useState(false);

    // Sin carcasa no hay ventana flotante. Se resuelve una vez y no cambia:
    // `electronAPI` lo pone el preload antes de que cargue nada de React.
    const hayCarcasa = Boolean(window.electronAPI);

    useEffect(() => {
        // `onTabletState` devuelve la función que quita el oyente. Sin llamarla
        // al desmontar, cada montaje dejaría uno vivo y el estado se aplicaría
        // varias veces.
        const desuscribir = window.electronAPI?.onTabletState?.(setAbierta);
        window.electronAPI?.preguntarEstadoTablet?.();
        return desuscribir;
    }, []);


    // O hay carcasa y el botón funciona, o no la hay y no se pinta. Sin
    // estados intermedios.
    //
    // Antes se mostraba apagado cuando faltaba la carcasa, para poder ver dónde
    // quedaba sin levantar Electron. Se quitó: un botón gris no dice «esto no
    // es la aplicación de escritorio», dice «esto está roto», y costó una
    // mañana de buscar el fallo donde no estaba.
    if (!hayCarcasa) return null;


    // El desplazamiento con `--titlebar-h` es el mismo que usa el resto de la
    // interfaz: dentro de la aplicación de escritorio hay una barra de título
    // propia de 32 px arriba, y sin restarla este botón se metería debajo. En
    // el navegador la variable vale cero y quedan los 62 px de siempre.
    // (Los guiones bajos son la forma de Tailwind de escribir espacios; en
    // `calc` los espacios alrededor del `+` son obligatorios.)
    const clase = 'fixed top-[calc(62px_+_var(--titlebar-h))] right-[320px] z-[1001] px-3 py-1.5 rounded-md text-[12px] font-bold text-white shadow-lg transition-colors';

    return (
        <button
            className={`${clase} ${abierta ? 'bg-[#7a1f2b] hover:bg-[#9a2533]' : 'bg-[#066ca8] hover:bg-[#0890c0]'}`}
            onClick={() => {
                if (abierta) window.electronAPI?.closeTabletWindow?.();
                else window.electronAPI?.openTabletWindow?.();
            }}
            title={abierta ? 'Cerrar la ventana de la tablet' : 'Abrir la pantalla de la tablet en una ventana flotante'}
        >
            {abierta ? 'Quitar tablet' : 'Sacar tablet'}
        </button>
    );
}
