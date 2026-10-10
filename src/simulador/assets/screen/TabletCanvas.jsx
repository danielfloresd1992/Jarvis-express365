import { forwardRef } from 'react';


/*  LA PANTALLA DE TOAST
 *
 *  Un <canvas> y nada más: lo pinta hook/useScreen.jsx, fuera del pintado de React. Este componente
 *  solo pone el lienzo en su sitio y le pasa los toques.
 *
 *  Lleva 'forwardRef' porque quien lo pinta necesita el propio <canvas>.
 */


/*  @param {function} onTap  un toque en la pantalla (va en el onClick del lienzo)
 */
export default forwardRef(function TabletCanvas({ onTap }, ref) {
    return (
        <div className='sim-pantalla__lienzo'>
            <div className='sim-tablet'>
                <canvas ref={ref} onClick={onTap} aria-label='Pantalla de la tablet simulada. Toca un producto para marcarlo hecho, la cabecera de una tarjeta para despacharla, o las flechas del contador de tickets para pasar de pantalla.' />
            </div>
        </div>
    );
});
