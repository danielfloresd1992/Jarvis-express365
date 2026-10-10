import { useState, useEffect } from 'react';


/*  EL ZOOM DE LA IMAGEN DE LA TABLET
 *
 *  Los límites viven AQUÍ y en ningún sitio más: tenerlos en dos archivos acabaría con un botón
 *  que se apaga en un número y un 'Math.min' que corta en otro. Los botones no los conocen: solo
 *  reciben si se puede acercar o alejar.
 */


// ZOOM_KEY = «la llave donde se recuerda el zoom»
const ZOOM_KEY = 'tablet:zoom';

// ZOOM_MIN = «lo más que se puede alejar», en porcentaje
const ZOOM_MIN = 50;

// ZOOM_MAX = «lo más que se puede acercar», en porcentaje
const ZOOM_MAX = 400;

// ZOOM_STEP = «cuánto cambia el zoom en cada clic»
const ZOOM_STEP = 25;



// readSavedZoom = «leer el zoom guardado»
// El último zoom que usó esta máquina. Si no hay nada guardado, o el valor quedó corrupto o fuera de
// rango, se vuelve al 100 % en vez de arrastrar el error.
function readSavedZoom() {
    try {
        const saved = Number(localStorage.getItem(ZOOM_KEY));
        if (Number.isFinite(saved) && saved >= ZOOM_MIN && saved <= ZOOM_MAX) return saved;
    }
    catch { /* sin acceso al almacenamiento: se usa el valor por defecto */ }

    return 100;
}



// useZoom = «el zoom»
// En porcentaje: 100 = la pantalla entera cabe en la ventana. Arranca con el último valor que usó
// esta máquina, para no tener que volver a ajustarlo cada vez que se abre la ventana.
// Devuelve: { value, canZoomIn, canZoomOut, zoomIn, zoomOut, reset }
function useZoom() {

    const [value, setValue] = useState(readSavedZoom);


    //  Se guarda en cuanto cambia. El navegador lo conserva aunque se apague el equipo, así que
    //  sobrevive a cierres accidentales y a reinicios.
    useEffect(() => {
        try { localStorage.setItem(ZOOM_KEY, String(value)); }
        catch { /* en modo privado puede fallar: no es motivo para romper nada */ }
    }, [value]);


    //  Se mantiene siempre entre el mínimo y el máximo: así los botones nunca dejan el zoom en un
    //  valor absurdo por mucho que se pulsen.
    const change = (delta) => {
        setValue(current => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, current + delta)));
    };


    return {
        value,
        canZoomIn: value < ZOOM_MAX,
        canZoomOut: value > ZOOM_MIN,
        zoomIn: () => change(ZOOM_STEP),
        zoomOut: () => change(-ZOOM_STEP),
        reset: () => setValue(100),
    };
}



export { useZoom };
