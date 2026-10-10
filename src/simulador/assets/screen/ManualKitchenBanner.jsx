/*  EL AVISO DE LA COCINA EN MANUAL
 *
 *  Sale encima de la pantalla mientras «Cocina sola» está apagada: nada se marca ni se despacha solo, y
 *  sin el aviso parecería que el simulador se ha colgado.
 */


/*  @param {function} onAutoCook  volver a encender la cocina automática
 */
export default function ManualKitchenBanner({ onAutoCook }) {
    return (
        <div className='sim-franja' role='status'>
            <span><b>La cocina está en manual:</b> nada se marca ni se despacha solo. Toca los productos en la pantalla, o usa «Listo» y «Despachar» en el registro.</span>
            <button type='button' className='sim-boton sim-boton--chico sim-boton--ambar' onClick={onAutoCook}>Que cocine sola</button>
        </div>
    );
}
