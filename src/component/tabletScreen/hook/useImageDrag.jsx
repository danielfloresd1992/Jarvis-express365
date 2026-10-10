import { useState, useRef, useEffect } from 'react';


/*  ARRASTRAR LA IMAGEN DE LA TABLET CON EL RATÓN
 *
 *  Para moverse por ella cuando el zoom la hace más grande que la ventana.
 *
 *  'canMove' existe porque el CURSOR lo necesita al pintar, y saber si la imagen se sale es medir
 *  el DOM: eso no se puede consultar en mitad de un pintado y esperar que se refresque solo.
 *
 *  Antes el cursor de mano aparecía solo con el zoom por encima de 100. Era una aproximación
 *  razonable mientras la imagen se encajaba entera, pero ya no: al 100 % ocupa todo el ancho y, si
 *  la pantalla de la tablet es más alargada que el hueco, sobra alto y hay que desplazarse. El
 *  arrastre siempre funcionó, pero el cursor decía que no había nada que mover, y con eso nadie lo
 *  intenta.
 */


// useImageDrag = «el arrastre de la imagen»
// Recibe: zoom (el porcentaje: al cambiar, la imagen mide otra cosa y hay que volver a medir).
// Devuelve: { containerRef, dragging, canMove, start, measure }
//   containerRef  va en el <div> que envuelve la imagen: de él salen las medidas y es el que se desplaza
//   start         empezar a arrastrar (va en su onMouseDown)
//   measure       volver a medir (va en el onLoad de la imagen)
function useImageDrag(zoom) {

    // containerRef = «el contenedor de la imagen»
    const containerRef = useRef(null);

    // dragStartRef = «dónde empezó el arrastre y en qué punto estaba el desplazamiento»
    const dragStartRef = useRef(null);

    const [dragging, setDragging] = useState(false);
    const [canMove, setCanMove] = useState(false);


    // overflows = «¿hay algo fuera de la vista que valga la pena mover?»
    const overflows = () => {
        const container = containerRef.current;
        if (!container) return false;

        return container.scrollWidth > container.clientWidth || container.scrollHeight > container.clientHeight;
    };


    //  Se recalcula en los dos únicos momentos en que la medida cambia: al tocar el zoom (aquí) y
    //  cuando termina de cargar cada captura nueva ('measure'). En el segundo hay que esperar al
    //  'onLoad' de verdad: con el alto en 'auto', una imagen sin decodificar mide cero.
    useEffect(() => {
        setCanMove(overflows());
    }, [zoom]);


    const start = (event) => {
        if (!overflows()) return;       //  si cabe entera no hay nada que arrastrar
        event.preventDefault();         //  evita que el navegador seleccione la imagen

        const container = containerRef.current;
        dragStartRef.current = {
            x: event.clientX,
            y: event.clientY,
            scrollLeft: container.scrollLeft,
            scrollTop: container.scrollTop,
        };
        setDragging(true);
    };


    //  Los oyentes van en 'window', no en el contenedor: así el arrastre sigue funcionando aunque
    //  el ratón se salga de la imagen, y se suelta bien aunque se levante el botón fuera de la ventana.
    useEffect(() => {
        if (!dragging) return;

        const move = (event) => {
            const container = containerRef.current;
            const origin = dragStartRef.current;
            if (!container || !origin) return;

            //  Se resta: al mover el ratón a la derecha, el contenido va a la derecha, y para eso hay
            //  que desplazarse hacia la izquierda.
            container.scrollLeft = origin.scrollLeft - (event.clientX - origin.x);
            container.scrollTop = origin.scrollTop - (event.clientY - origin.y);
        };

        const release = () => {
            dragStartRef.current = null;
            setDragging(false);
        };

        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', release);

        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', release);
        };
    }, [dragging]);


    return {
        containerRef,
        dragging,
        canMove,
        start,
        measure: () => setCanMove(overflows()),
    };
}



export { useImageDrag };
