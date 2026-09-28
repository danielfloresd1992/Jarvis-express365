import { forwardRef } from 'react';


/*  EL ESPEJO DE LA TABLET
 *
 *  La captura de la pantalla de la tablet, o el texto de que no hay ninguna. Va
 *  debajo de la cabecera (TabletContainer) y encima de la barra de zoom.
 *
 *  Lleva `forwardRef` porque quien lo usa necesita el div de fuera, no el de dentro:
 *  de ese div salen las medidas para saber si la imagen se sale de la vista, y es el
 *  que se desplaza al arrastrarla.
 *
 *  'flex-1 min-h-0' y no 'fixed inset-0': esto es una pieza DENTRO de la ventana
 *  partida y tiene que repartirse el alto con la cabecera y la barra de zoom. Un
 *  elemento fijo se mediría contra la ventana entera y taparía la parrilla de abajo.
 *  'min-h-0' es lo que le permite encogerse: sin él, un hijo de flex no baja de su
 *  alto natural y la imagen empujaría fuera a todo lo demás.
 *
 *  'overflow-auto' es lo que permite moverse por la imagen cuando el zoom la hace
 *  más grande que la ventana. Sin eso, al ampliar solo se vería el centro y el resto
 *  quedaría cortado sin poder alcanzarlo.
 */


/*  @param {string}   img          la captura, como URL de objeto. null: no hay tablet
 *  @param {number}   zoom         el ancho de la imagen, en porcentaje
 *  @param {boolean}  isDragging   se está arrastrando la imagen ahora mismo
 *  @param {boolean}  canMove      la imagen se sale de la vista, así que se puede mover
 *  @param {function} onMouseEvent empezar a arrastrar
 *  @param {function} loadEvent    la imagen terminó de cargar: hay que volver a medir
 */
export default forwardRef(function TabletRender({ img, zoom, isDragging, canMove, onMouseEvent, loadEvent }, ref) {

    // classCursor = «el cursor que toca»: la mano cerrada al arrastrar, abierta si se puede.
    let classCursor = '';
    if (isDragging) classCursor = 'cursor-grabbing select-none';
    else if (canMove) classCursor = 'cursor-grab';


    return (
        <div
            ref={ref}
            onMouseDown={onMouseEvent}
            className={`w-full flex-1 min-h-0 overflow-auto flex items-center justify-center border-b border-[#0a3a66] bg-black/20 ${classCursor}`}
        >

            {
                img ?
                    <img
                        style={{ width: `${zoom}%`, height: 'auto', flex: 'none', maxWidth: 'none', margin: 'auto' }}
                        src={img}
                        alt='pantalla tablet'
                        draggable={false}
                        onLoad={loadEvent}
                    />
                    :
                    <p className='text-[12px] text-[#33486a] px-4 text-center'>Conecta la tablet para ver su pantalla</p>
            }

        </div>
    );
});
