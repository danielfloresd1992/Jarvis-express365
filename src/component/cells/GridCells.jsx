import { useEffect, useRef, useState } from 'react';
import CellTimeInput from './CellTimeInput.jsx';
import { useGridNav } from './GridNav.jsx';
import { EDIT_EVENT } from '../../libs/tickets/gridNav.js';
import { copyText, readText, toTime } from '../../libs/tickets/cellClipboard.js';
import './cells.css';




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
 *  LA HORA SE PONE CON EL RELOJ, Y SE VE ANTES DE PONERLA (propuesta «C», elegida por el usuario): al pasar el
 *  ratón por una celda vacía, el guion se convierte en la hora de ahora, en gris y corriendo, y a la derecha sale un
 *  reloj negro con las agujas blancas. Con el ratón sobre el reloj esa hora se oscurece —es la que se va a poner— y
 *  al pulsarlo queda puesta —que es como se trabaja en el register: cuando pasa la cosa, se marca—. Un clic en la
 *  celda no pone nada. Dos clics abren el campo para corregir a mano lo que se haya puesto mal o llegue tarde.
 *
 *  Y SE BORRA CON SU SÍMBOLO (pedido del usuario): al pasar el ratón por una celda con hora, a la derecha sale una
 *  ✕; al pulsarla la celda se queda en blanco.
 *
 *  Sin `updateValue` la celda es de solo lectura: ni reloj, ni borrar, ni doble clic. Es lo que necesitan las
 *  columnas que solo muestran un valor calculado.
 *
 *  Con `stampNow` en false no sale el reloj y solo queda el doble clic. Es para las horas en las que «ahora» no
 *  tiene sentido: el fin de un toque viejo, por ejemplo, no es la hora a la que alguien lo mira (RegisterTouchTable).
 *
 *  Con `compact`, para las celdas estrechas (los toques, Registros), ni la vista previa ni el borrar: no caben junto
 *  a la hora. Queda el reloj sobre el guion, y el doble clic.
 *
 *  CON EL TECLADO, COMO EN EXCEL (pedido del usuario). Con `row` y `col` la celda entra en la navegación de su
 *  tabla (gridNav.js): un clic la elige (marco verde), las flechas la mueven, y en la elegida:
 *
 *      Enter           en una celda vacía pone la hora de ahora (lo mismo que el reloj); en una con hora abre el
 *                      campo para corregirla (lo mismo que el doble clic). Al guardar con Enter la celda sigue
 *                      elegida: no baja sola, para que un Enter de más no ponga una hora en la de abajo
 *      0-9             abre el campo con esa cifra ya escrita, reemplazando la hora
 *      Supr / Retroceso  deja la celda en blanco (pedido del usuario)
 *      Escape          con el campo abierto, lo cierra sin cambiar nada y la celda sigue elegida; con la celda
 *                      elegida y cerrada, la deselecciona (lo hace la tabla, gridNav.js)
 *      Ctrl+C          copia su hora (también en una de solo lectura, como una duración)
 *      Ctrl+V          pega una hora copiada ('13:58:04', '9:05', '135804'; cellClipboard.js). Lo que no sea una
 *                      hora no se pega
 *
 *  Una celda de solo lectura también se elige (se pasa por ella), pero no abre nada.
 *
 *  Y se abre cuando se lo pide el menú contextual («Editar»): el aviso EDIT_EVENT (gridNav.js), como un doble clic.
 */
export function WrapperText({ classStyles = '', value, updateValue, stampNow = true, compact = false, row, col }) {


    const [editing, setEditing] = useState(false);

    // initialKey = «la cifra con la que se abrió el campo», si se abrió escribiendo
    const [initialKey, setInitialKey] = useState('');

    // rootRef = «la celda cerrada», para devolverle el foco al cerrar el campo con el teclado
    const rootRef = useRef(null);

    // afterCloseRef = «qué hacer con el foco al cerrar el campo»: null nada (se cerró con el ratón), 'stay' se queda
    // en la celda, 'down' baja a la siguiente (hoy no se usa: Enter guarda y se queda, ver arriba)
    const afterCloseRef = useRef(null);

    const nav = useGridNav();

    // navigable = «la celda está en una tabla con navegación por teclado»
    const navigable = row !== undefined && col !== undefined;

    const readOnly = typeof updateValue !== 'function';

    //  Al cerrarse el campo con el teclado, el foco vuelve a la celda (y con Enter baja a la siguiente): si no, se
    //  quedaría en ningún sitio y las flechas dejarían de funcionar
    useEffect(() => {
        if (editing || !afterCloseRef.current) return;
        const after = afterCloseRef.current;
        afterCloseRef.current = null;
        if (after === 'down') nav.move(rootRef.current, 'down');
        else rootRef.current?.focus({ preventScroll: true });
    }, [editing, nav]);

    // open = «abrir el campo», con una cifra ya escrita o sin ella
    const open = (key = '') => {
        if (readOnly) return;
        setHovered(false);
        setInitialKey(key);
        setEditing(true);
    };

    // openRef = «abrir el campo», siempre la de este pintado: la usa el aviso del menú contextual
    const openRef = useRef(open);
    openRef.current = open;

    //  «Editar», desde el menú contextual: el aviso EDIT_EVENT llega a la celda cerrada y la abre
    useEffect(() => {
        const root = rootRef.current;
        if (editing || !root) return undefined;
        const onEdit = () => openRef.current();
        root.addEventListener(EDIT_EVENT, onEdit);
        return () => root.removeEventListener(EDIT_EVENT, onEdit);
    }, [editing]);

    // copyable = «tiene algo que copiar»: una hora, o una duración calculada (las vacías dicen '—')
    const copyable = () => !empty && value !== '—';

    //  Las teclas de la celda elegida. Las flechas no se tocan: las maneja la tabla (GridNav.jsx).
    const handleKeyDown = (event) => {

        //  Ctrl+C y Ctrl+V (Cmd en un Mac): copiar su hora, y pegar una
        if ((event.ctrlKey || event.metaKey) && !event.altKey && event.target === rootRef.current) {
            const letter = event.key.toLowerCase();
            if (letter === 'c' && copyable()) {
                event.preventDefault();
                copyText(value);
            }
            if (letter === 'v' && !readOnly) {
                event.preventDefault();
                readText().then(text => {
                    const time = toTime(text);
                    if (time && time !== value) updateValue(time);
                });
            }
            return;
        }

        if (event.altKey || event.ctrlKey || event.metaKey || event.target !== rootRef.current) return;

        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            if (readOnly) return;
            //  Vacía: se pone la hora de ahora, como con el reloj. Con hora: se abre para corregirla, como con el
            //  doble clic (pedido del usuario). Donde «ahora» no tiene sentido (stampNow en false), siempre se abre.
            if (empty && stampNow) updateValue(getCurrentTime());
            else open();
            return;
        }
        if (/^\d$/.test(event.key)) {
            event.preventDefault();
            event.stopPropagation();
            open(event.key);
            return;
        }
        if ((event.key === 'Delete' || event.key === 'Backspace') && !readOnly) {
            event.preventDefault();
            event.stopPropagation();
            if (value !== '') updateValue('');
        }
    };

    // empty = «la hora todavía no está puesta»
    const empty = value === '' || value === undefined || value === null;

    // hovered = «el ratón está sobre la celda»: solo entonces corre la vista previa
    const [hovered, setHovered] = useState(false);

    // preview = «la hora de ahora, la que pondría el reloj», al segundo mientras el ratón está encima
    const [preview, setPreview] = useState('');


    /*  EL RELOJ, SOLO EN UNA CELDA VACÍA
     *
     *  Antes un clic en cualquier sitio de la celda la estampaba, y dolía por dos lados: el navegador, ante un
     *  doble clic, dispara click, click y DESPUÉS dblclick, así que corregir una hora la pisaba antes de abrir el
     *  campo; y entre los dos registers hay más de cien celdas de hora, donde un clic despistado sobrescribía una
     *  en silencio. Con el reloj hace falta pulsar a propósito, y solo donde falta la hora: para cambiar una que ya
     *  está, el doble clic.
     */
    // canStamp = «sale el reloj»: la celda se edita, la hora tiene sentido «ahora» y todavía no está puesta
    const canStamp = !readOnly && stampNow && empty;

    // showsPreview = «la celda enseña la hora que pondría el reloj»: con el ratón encima, si cabe
    const showsPreview = canStamp && !compact && hovered;

    // canClear = «sale el símbolo de borrar»: la celda se edita, cabe, y tiene una hora que quitar
    const canClear = !readOnly && !compact && !empty;

    //  La vista previa corre mientras el ratón está encima: un setInterval que se apaga al salir. Solo hay una
    //  celda con el ratón encima a la vez, así que como mucho corre uno.
    useEffect(() => {
        if (!showsPreview) return undefined;
        setPreview(getCurrentTime());
        const timer = setInterval(() => setPreview(getCurrentTime()), 1000);
        return () => clearInterval(timer);
    }, [showsPreview]);

    // stamp = «poner la hora de ahora», desde el reloj
    const stamp = (event) => {
        event.stopPropagation();
        updateValue(getCurrentTime());
    };

    // clear = «dejar la celda en blanco», desde el símbolo de borrar
    const clear = (event) => {
        event.stopPropagation();
        updateValue('');
    };


    const handleDoubleClick = () => open();




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
            initialKey={initialKey}
            onCommit={(time, reason) => {
                afterCloseRef.current = reason === 'blur' ? null : 'stay';
                setEditing(false);
                if (time !== value) updateValue(time);
            }}
            onCancel={() => {
                afterCloseRef.current = 'stay';
                setEditing(false);
            }}
        />
    );


    return (
        <div
            ref={rootRef}
            className='cell-time w-full h-full flex items-center justify-center'
            onDoubleClick={handleDoubleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onKeyDown={navigable ? handleKeyDown : undefined}
            tabIndex={navigable ? (readOnly ? -1 : 0) : undefined}
            data-grid-cell={navigable ? 'true' : undefined}
            data-row={navigable ? row : undefined}
            data-col={navigable ? col : undefined}
        >
            {/*  'data-empty': la hora todavía no pasó. Así se la puede apagar desde fuera (registers.css). Con el
                 ratón encima de una celda vacía, en lugar del guion va la vista previa (cells.css).  */}
            <p className={`tracking-[0.3px] font-mono tabular-nums ${classStyles}`} data-empty={value === '' ? 'true' : undefined}>
                {showsPreview && preview ? <span className='cell-time__preview'>{preview}</span> : value === '' ? '-' : value}
            </p>

            {/*  El reloj y el borrar: salen al pasar el ratón (cells.css). Su doble clic no abre el campo.  */}
            {
                canStamp && (
                    <button
                        type='button'
                        className='cell-time__stamp'
                        onClick={stamp}
                        onDoubleClick={event => event.stopPropagation()}
                        title={showsPreview && preview ? `Poner ${preview}` : 'Poner la hora de ahora'}
                        aria-label='Poner la hora de ahora'
                    >
                        {/*  14 px en un botón de 20: 3 px a cada lado. Con un tamaño impar (13) el margen era de
                             3,5 px, la pantalla no pinta medios píxeles y el icono quedaba corrido a un lado.  */}
                        <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4'
                             strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                            <circle cx='12' cy='12' r='9' />
                            <path d='M12 7v5l3 2' />
                        </svg>
                    </button>
                )
            }
            {
                canClear && (
                    <button
                        type='button'
                        className='cell-time__clear'
                        onClick={clear}
                        onDoubleClick={event => event.stopPropagation()}
                        title={`Borrar ${value}: la celda se queda en blanco`}
                        aria-label={`Borrar la hora ${value}`}
                    >
                        {/*  12 px en 20: 4 px a cada lado (el mismo motivo que el reloj)  */}
                        <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3'
                             strokeLinecap='round' aria-hidden='true'>
                            <path d='M6 6l12 12' />
                            <path d='M18 6 6 18' />
                        </svg>
                    </button>
                )
            }
        </div>
    );
}




//  Hora del equipo en 'HH:MM:SS'. Es la que pone el reloj de una celda vacía, y la
//  misma que usa el seguimiento cuando detecta que un ticket cambió de color.
export function getCurrentTime() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
