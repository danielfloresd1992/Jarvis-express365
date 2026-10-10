import { useEffect, useState } from 'react';


/*  ¿ESTÁ ABIERTA LA VENTANA FLOTANTE DE LA TABLET?
 *
 *  La ventana la crea la carcasa de escritorio, y el estado NO SE ADIVINA: lo dice ella. Emite
 *  'tablet:estado' cada vez que la ventana se abre o se cierra, venga de donde venga la orden —el
 *  botón de la barra de arriba, o la ✕ de la propia ventana—. Llevar aquí un booleano y darle la
 *  vuelta en cada clic se quedaría diciendo «abierta» cuando alguien la cierra desde su ✕.
 *
 *  Al montar se pregunta una vez con 'preguntarEstadoTablet', porque la ventana puede llevar rato
 *  abierta de antes —al recargar Jarvis, por ejemplo— y sin esa pregunta se arrancaría mintiendo
 *  hasta el primer cambio.
 *
 *  Fuera de la carcasa no hay ventana flotante: devuelve siempre false.
 *
 *  Lo usan el botón «Sacar tablet» (component/tabletButton) y la tablet de la ventana principal
 *  (component/tabletScreen/tablet.provider.jsx), que se aparta mientras la flotante está abierta.
 */


// useTabletWindow = «la ventana flotante de la tablet está abierta»
// Devuelve: true o false.
function useTabletWindow() {

    // open = «está abierta»
    const [open, setOpen] = useState(false);

    useEffect(() => {
        //  'onTabletState' devuelve la función que quita el oyente. Sin llamarla al desmontar, cada
        //  montaje dejaría uno vivo y el estado se aplicaría varias veces.
        const unsubscribe = window.electronAPI?.onTabletState?.(setOpen);
        window.electronAPI?.preguntarEstadoTablet?.();
        return unsubscribe;
    }, []);

    return open;
}



export { useTabletWindow };
