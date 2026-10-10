import { forwardRef } from 'react';


/*  SOLO LA PANTALLA
 *
 *  Lo que se pinta con '?solo=pantalla' en la dirección: el lienzo a su tamaño real y nada alrededor,
 *  para fotografiarlo y compararlo con una captura de la tablet de verdad. Se puede tocar igual.
 */


/*  @param {function} onTap  un toque en la pantalla
 */
export default forwardRef(function BareScreen({ onTap }, ref) {
    return <div className='sim-solo'><canvas ref={ref} onClick={onTap} /></div>;
});
