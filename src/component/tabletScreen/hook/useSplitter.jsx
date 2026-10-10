import { useState, useRef, useEffect } from 'react';


/*  EL REPARTO DE LA VENTANA
 *
 *  Arriba el espejo de la tablet, abajo los registers, y un divisor que se arrastra para repartir
 *  el alto entre los dos. Aquí vive cuánto le toca al de arriba, en porcentaje.
 */


// SPLIT_KEY = «la llave donde se recuerda el reparto»
const SPLIT_KEY = 'tablet:division';

// SPLIT_MIN / SPLIT_MAX = «lo mínimo y lo máximo que puede ocupar el panel de arriba», en porcentaje
const SPLIT_MIN = 25;
const SPLIT_MAX = 80;

// SPLIT_DEFAULT = «el reparto con el que nace la ventana»
const SPLIT_DEFAULT = 55;



// readSavedSplit = «leer el reparto guardado»
function readSavedSplit() {
    try {
        const saved = Number(localStorage.getItem(SPLIT_KEY));
        if (Number.isFinite(saved) && saved >= SPLIT_MIN && saved <= SPLIT_MAX) return saved;
    }
    catch { /* sin acceso al almacenamiento: se usa el valor por defecto */ }

    return SPLIT_DEFAULT;
}



// useSplitter = «el divisor»
// Devuelve: { containerRef, split, splitting, start }
//   containerRef  va en la columna que se reparte: el divisor mide ESE contenedor
//   split         el alto del panel de arriba, en porcentaje
//   splitting     se está arrastrando el divisor ahora mismo
//   start         empezar a arrastrar (va en el onMouseDown del divisor)
function useSplitter() {

    const [split, setSplit] = useState(readSavedSplit);
    const [splitting, setSplitting] = useState(false);

    // containerRef = «la columna que se reparte»
    const containerRef = useRef(null);


    //  Se guarda al SOLTAR, nunca durante el arrastre: mover el divisor dispara decenas de eventos
    //  por segundo y escribir en cada uno no aporta nada.
    useEffect(() => {
        if (splitting) return;

        try { localStorage.setItem(SPLIT_KEY, String(split)); }
        catch { /* es una comodidad, no un dato crítico */ }
    }, [split, splitting]);


    //  Los oyentes van en 'window' y no en el divisor: si estuvieran en el divisor, al mover rápido
    //  el ratón se saldría de esa franja de 7 px y el arrastre se cortaría.
    useEffect(() => {
        if (!splitting) return;

        const move = (event) => {
            const box = containerRef.current?.getBoundingClientRect();
            if (!box || box.height === 0) return;

            const percentage = ((event.clientY - box.top) / box.height) * 100;
            setSplit(Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, percentage)));
        };

        const release = () => setSplitting(false);

        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', release);

        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', release);
        };
    }, [splitting]);


    const start = (event) => {
        if (event.button !== 0) return;   //  solo el botón izquierdo
        event.preventDefault();
        setSplitting(true);
    };


    return { containerRef, split, splitting, start };
}



export { useSplitter };
