/*  EL MARCO DE LA VENTANA
 *
 *  Es una FILA: a la izquierda la columna de siempre —el espejo arriba y los registers abajo— y,
 *  en desarrollo, a la derecha el registro de la inferencia ('side'). Sin ese panel la fila tiene
 *  un solo hijo, que la ocupa entera.
 *
 *  'fixed' se mide contra la ventana y le da igual lo que hagan sus padres. Es lo que hace falta
 *  aquí: la cadena html → body → #root no siempre tiene un alto real, y un alto en porcentaje sobre
 *  un padre sin alto colapsa. Dentro de un panel de la página tiene que ser 'absolute', o taparía
 *  la página entera en vez de quedarse dentro del panel.
 *
 *  'text-jx-tinta' y 'color-scheme: light' van aquí, en la raíz, porque el ':root' de index.css
 *  sigue en oscuro: sin ellos las celdas heredaban letra celeste y el navegador pintaba oscuras las
 *  barras de desplazamiento sobre el papel.
 */


/*  @param {boolean} inPanel    true cuando esto vive dentro de un panel de la página en vez de en una ventana del sistema
 *  @param {object}  columnRef  la ref de la columna que se reparte: el divisor mide ESTE contenedor
 *  @param {boolean} splitting  se está arrastrando el divisor ahora mismo
 *  @param {node}    side       lo que va a la derecha de la columna (el registro de la inferencia)
 */
export default function WindowFrame({ inPanel, columnRef, splitting, side, children }) {
    return (
        <div className={`${inPanel ? 'absolute' : 'fixed'} inset-0 flex overflow-hidden bg-jx-lienzo text-jx-tinta [color-scheme:light]`}>

            {/*  'min-w-0' deja encoger la columna cuando el panel de al lado está abierto.  */}
            <div
                ref={columnRef}
                className={`relative flex-1 min-w-0 h-full flex flex-col overflow-hidden ${splitting ? 'select-none cursor-row-resize' : ''}`}
            >
                {children}
            </div>

            {side}

        </div>
    );
}
