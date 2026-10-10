import { forwardRef, useSyncExternalStore } from 'react';


/*  EL ESPEJO DE LA TABLET
 *
 *  La captura de la pantalla de la tablet, o el texto de que no hay ninguna. Va debajo de la barra
 *  de título y encima de la barra de zoom.
 *
 *  LA IMAGEN NO LLEGA POR PROPS. Cambia dos veces por segundo, y si pasara por el controlador se
 *  repintaría la ventana entera en cada fotograma. Se lee de 'frames', el almacén que mantiene
 *  useTablet: este componente es el único que lo escucha y el único que se repinta.
 *
 *  Lleva 'forwardRef' porque quien lo usa necesita el div de fuera, no el de dentro: de ese div
 *  salen las medidas para saber si la imagen se sale de la vista, y es el que se desplaza al
 *  arrastrarla.
 *
 *  'flex-1 min-h-0' y no 'fixed inset-0': esto es una pieza DENTRO de la ventana partida y tiene que
 *  repartirse el alto con la barra de título y la de zoom. 'min-h-0' es lo que le permite encogerse:
 *  sin él, un hijo de flex no baja de su alto natural y la imagen empujaría fuera a todo lo demás.
 *
 *  'overflow-auto' es lo que permite moverse por la imagen cuando el zoom la hace más grande que la
 *  ventana. Sin eso, al ampliar solo se vería el centro y el resto quedaría cortado sin poder alcanzarlo.
 */


/*  @param {object}   frames       el almacén de la imagen: { subscribe, read } (de useTablet)
 *  @param {number}   zoom         el ancho de la imagen, en porcentaje
 *  @param {boolean}  dragging     se está arrastrando la imagen ahora mismo
 *  @param {boolean}  canMove      la imagen se sale de la vista, así que se puede mover
 *  @param {function} onMouseDown  empezar a arrastrar
 *  @param {function} onLoad       la imagen terminó de cargar: hay que volver a medir
 */
export default forwardRef(function TabletMirror({ frames, zoom, dragging, canMove, onMouseDown, onLoad }, ref) {

    // img = «la captura que hay que pintar», como URL de objeto. null: no hay tablet
    const img = useSyncExternalStore(frames.subscribe, frames.read);

    // cursor = «el cursor que toca»: la mano cerrada al arrastrar, abierta si se puede.
    let cursor = '';
    if (dragging) cursor = 'cursor-grabbing select-none';
    else if (canMove) cursor = 'cursor-grab';


    return (
        <div
            ref={ref}
            onMouseDown={onMouseDown}
            className={`w-full flex-1 min-h-0 overflow-auto flex items-center justify-center border-b border-jx-regla2 bg-jx-hundido ${cursor}`}
        >

            {
                img ?
                    <img
                        style={{ width: `${zoom}%`, height: 'auto', flex: 'none', maxWidth: 'none', margin: 'auto' }}
                        src={img}
                        alt='pantalla tablet'
                        draggable={false}
                        onLoad={onLoad}
                    />
                    :
                    <p className='text-[12px] text-jx-tinta3 px-4 text-center'>Conecta la tablet para ver su pantalla</p>
            }

        </div>
    );
});
