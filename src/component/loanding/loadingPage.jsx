/*  LA PANTALLA DE CARGA
 *
 *  Una barra y nada más.
 *
 *  Antes tenía resplandor de fondo, una línea de barrido, cuatro esquinas, dos paneles
 *  de datos inventados («NETWORK · ONLINE», «SISTEMA · ACTIVO»), tres anillos girando,
 *  un engranaje con su halo, el logotipo, el título con otro engranaje de separador, un
 *  divisor, un rótulo con tres puntos animados, la barra, un subtítulo y una barra
 *  inferior. Veintitantos elementos para decir «espera un momento».
 *
 *  Queda la barra, que es lo único que informa de algo.
 */
export default function LoadingPage() {
    return (
        <div className='lp-wrap'>
            <div className='lp-progress-track'>
                <div className='lp-progress-fill' />
            </div>
        </div>
    );
}
