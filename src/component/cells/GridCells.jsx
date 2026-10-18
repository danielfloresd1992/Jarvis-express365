import { useState } from 'react';
import CellTimeInput from './CellTimeInput.jsx';




/*  CELDAS COMPARTIDAS DE LOS REGISTERS
 *
 *  Las usa el registro de las mesas: cada dato de una mesa y cada hora de sus procesos.
 *
 *  Viven en su propio archivo y no dentro de Main.jsx a propósito: Main ya importa
 *  la tabla de procesos, así que si la tabla importara las celdas desde Main se
 *  cerraría el círculo y las dos quedarían importándose entre sí.
 */




/*  Una celda de un register.
 *
 *  'min-w-0' y 'overflow-hidden' son los que evitan la barra de desplazamiento
 *  horizontal: sin ellos una celda no baja del ancho de su contenido y la fila entera
 *  se sale del panel. Con ellos las columnas se reparten el ancho que haya.
 *
 *  La letra sigue el ancho del register, igual que la imagen de la tablet sigue el de
 *  la ventana: 'cqw' es un 1 % del ancho del contenedor (el panel lleva '@container').
 *  Nunca baja de 10 px, que es lo mínimo legible, ni pasa de 13.
 *
 *  @param {object}  estilo  estilo en línea, para lo que una clase no puede asegurar:
 *                           una columna más ancha que las demás (flexGrow) tiene que
 *                           serlo igual en la cabecera y en cada fila.
 *  @param {boolean} tall    la celda ocupa el alto entero de su fila en vez de una
 *                           línea: los datos de una mesa, que abarcan todas las líneas
 *                           de sus procesos.
 */
export function WrapperCell({ classStyles = '', estilo, titulo, tall = false, children }) {
    return (
        <div
            className={`cursor-pointer flex-1 min-w-0 overflow-hidden ${tall ? 'self-stretch min-h-7' : 'h-7'} flex items-center justify-center text-[length:clamp(10px,1.8cqw,13px)] border-b border-b-jx-regla text-center leading-[1.15] border-r border-r-jx-regla ${classStyles}`}
            style={estilo}
            title={titulo}
        >
            {children}
        </div>
    );
}




/*  Celda de tiempo.
 *
 *  Un clic estampa la hora actual —que es como se trabaja en el register: cuando
 *  pasa la cosa, se toca—. Dos clics abren el campo para corregir a mano lo que se
 *  haya estampado mal o llegue tarde.
 *
 *  Sin `updateValue` la celda es de solo lectura: ni el clic ni el doble clic hacen
 *  nada. Es lo que necesitan las columnas que solo muestran un valor calculado.
 *
 *  Con `stampOnClick` en false el clic no estampa nada y solo queda el doble clic. Es
 *  para las horas en las que «ahora» no tiene sentido: el fin de un toque viejo, por
 *  ejemplo, no es la hora a la que alguien lo mira (RegisterTouchList).
 */
export function WrapperText({ classStyles = '', value, updateValue, stampOnClick = true }) {


    const [editing, setEditing] = useState(false);

    const readOnly = typeof updateValue !== 'function';


    /*  UN CLIC ESTAMPA — PERO SOLO SOBRE UNA CELDA VACÍA
     *
     *  Dos motivos, y los dos duelen:
     *
     *  · El navegador, ante un doble clic, dispara click, click y DESPUÉS dblclick.
     *    Sin esta guarda, los dos primeros clics sellaban la hora actual y el editor
     *    se abría ya con el valor nuevo: el doble clic destruía justo el dato que
     *    ibas a corregir, y sin manera de deshacerlo.
     *
     *  · Entre los dos registers hay más de cien celdas de hora. Un clic despistado
     *    en cualquiera de ellas sobrescribía su valor en silencio.
     *
     *  Para cambiar una hora ya puesta está el doble clic, que abre el campo.
     */
    const handleClick = () => {
        if (readOnly || !stampOnClick) return;
        if (value !== '' && value !== undefined && value !== null) return;
        updateValue(getCurrentTime());
    };


    const handleDoubleClick = () => {
        if (readOnly) return;
        setEditing(true);
    };




    /*  EL CAMPO DE LA HORA: HH:MM:SS sin teclear los «:» (CellTimeInput)
     *
     *  Las tres salidas siguen, y ninguna sobra: 'Enter' guarda, 'Escape' descarta y deja la
     *  hora como estaba, y perder el foco —tocar otra celda— guarda. Sin ellas la celda se
     *  quedaba convertida en campo para siempre, y con treinta filas eso llena el register de
     *  cajas abiertas. Solo se anota si la hora cambió.
     */
    if (editing) return (
        <CellTimeInput
            value={value}
            onCommit={time => {
                setEditing(false);
                if (time !== value) updateValue(time);
            }}
            onCancel={() => setEditing(false)}
        />
    );


    return (
        <div
            className='w-full h-full flex items-center justify-center'
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
        >
            {/*  'data-empty': la hora todavía no pasó. Así se la puede apagar desde fuera (registers.css).  */}
            <p className={`tracking-[0.3px] font-mono tabular-nums ${classStyles}`} data-empty={value === '' ? 'true' : undefined}>{value === '' ? '-' : value}</p>
        </div>
    );
}




//  Hora del equipo en 'HH:MM:SS'. Es la que se estampa al tocar una celda, y la
//  misma que usa el seguimiento cuando detecta que un ticket cambió de color.
export function getCurrentTime() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
