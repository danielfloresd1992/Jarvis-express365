import { useState } from 'react';




/*  CELDAS COMPARTIDAS DE LAS PARRILLAS
 *
 *  Las usan las dos tablas: la de rotación (mesas) y la de procesos (platos).
 *
 *  Viven en su propio archivo y no dentro de Main.jsx a propósito: Main ya importa
 *  la tabla de procesos, así que si la tabla importara las celdas desde Main se
 *  cerraría el círculo y las dos quedarían importándose entre sí.
 */




/*  Una celda de la parrilla.
 *
 *  'min-w-0' y 'overflow-hidden' son los que evitan la barra de desplazamiento
 *  horizontal: sin ellos una celda no baja del ancho de su contenido y la fila entera
 *  se sale del panel. Con ellos las siete columnas se reparten el ancho que haya.
 *
 *  La letra sigue el ancho de la parrilla, igual que la imagen de la tablet sigue el de
 *  la ventana: 'cqw' es un 1 % del ancho del contenedor (el panel lleva '@container').
 *  Nunca baja de 10 px, que es lo mínimo legible, ni pasa de 13.
 *
 *  @param {object} estilo  estilo en línea, para lo que una clase no puede asegurar:
 *                          una columna más ancha que las demás (flexGrow) tiene que
 *                          serlo igual en la cabecera y en cada fila.
 */
export function WrapperCell({ classStyles = '', estilo, titulo, children }) {
    return (
        <div
            className={`cursor-pointer flex-1 min-w-0 overflow-hidden h-7 flex items-center justify-center text-[length:clamp(10px,1.8cqw,13px)] border-b border-b-[#0a3a66]/25 text-center leading-[1.15] border-r border-r-[#0a3a66]/25 ${classStyles}`}
            style={estilo}
            title={titulo}
        >
            {children}
        </div>
    );
}




/*  Celda de tiempo.
 *
 *  Un clic estampa la hora actual —que es como se trabaja en la parrilla: cuando
 *  pasa la cosa, se toca—. Dos clics abren el campo para corregir a mano lo que se
 *  haya estampado mal o llegue tarde.
 *
 *  Sin `updateValue` la celda es de solo lectura: ni el clic ni el doble clic hacen
 *  nada. Es lo que necesitan las columnas que solo muestran un valor calculado.
 */
export function WrapperText({ classStyles = '', value, updateValue }) {


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
     *  · Entre las dos parrillas hay más de cien celdas de hora. Un clic despistado
     *    en cualquiera de ellas sobrescribía su valor en silencio.
     *
     *  Para cambiar una hora ya puesta está el doble clic, que abre el campo.
     */
    const handleClick = () => {
        if (readOnly) return;
        if (value !== '' && value !== undefined && value !== null) return;
        updateValue(getCurrentTime());
    };


    const handleDoubleClick = () => {
        if (readOnly) return;
        setEditing(true);
    };




    /*  SALIR DEL MODO EDICIÓN
     *
     *  Hacen falta las tres salidas, y ninguna sobra: 'Enter' es la que todo el mundo
     *  intenta primero, 'Escape' la que se busca cuando uno se arrepiente, y perder el
     *  foco la que ocurre sola al tocar otra celda.
     *
     *  Sin ninguna de ellas la celda se quedaba convertida en campo de texto para
     *  siempre, y con treinta filas eso llena la parrilla de cajas abiertas.
     */
    const salirDeEdicion = (event) => {
        if (event.key === 'Enter' || event.key === 'Escape') {
            event.preventDefault();
            setEditing(false);
        }
    };


    if (editing) return (
        <input
            className='w-full h-full text-center bg-transparent'
            type='text'
            value={value}
            onChange={event => updateValue(event.target.value)}
            onKeyDown={salirDeEdicion}
            onBlur={() => setEditing(false)}
            autoFocus
        />
    );


    return (
        <div
            className='w-full h-full flex items-center justify-center'
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
        >
            <p className={`tracking-[0.3px] font-mono tabular-nums ${classStyles}`}>{value === '' ? '-' : value}</p>
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
