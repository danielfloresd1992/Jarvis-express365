/*  AÑADIR UN PROCESO A LA ROTACIÓN — el «+» del final de la fila
 *
 *  Para los pedidos de Toast que la tablet no vio o que la IA no supo leer. El proceso entra en el
 *  array 'process' de ESA rotación, igual que los que lee la IA: un proceso nunca va suelto. Los que
 *  sí lee la IA entran solos, cada uno en la rotación de su número de mesa (applyTabletOrders, en
 *  libs/tickets/tableRecords.js).
 *
 *  Añade una línea en blanco y despliega la fila para anotarla. Si nadie le escribe nada, no se guarda.
 *
 *  En una fila SIN MESA ('waiting') sale tenue: está ahí para que se vea dónde se añaden los procesos,
 *  pero no crea nada —quien lo usa (RegisterRecordRow) lleva el cursor a «Mesa» y pide el número—.
 *
 *  Tamaño, relleno y borde van en la clase 'register-add' de registers.css: la regla global 'button {}' de
 *  index.css gana a las utilidades de Tailwind en esas tres cosas, y una clase le gana a ella. Así, además,
 *  la fila libre lo puede achicar (sus filas son más bajas).
 */


/*  @param {string}   table    el número de mesa, para decir a cuál se añade
 *  @param {boolean}  waiting  la fila todavía no tiene mesa
 *  @param {function} onAdd    añadir el proceso
 */
export default function AddProcessButton({ table, waiting, onAdd }) {

    // what = «lo que hace el botón, dicho con palabras»
    const what = waiting
        ? 'Añadir un proceso: escribe primero el número de mesa, el proceso va dentro de su rotación'
        : `Añadir un proceso a la mesa ${table}: un pedido que la tablet no leyó`;

    return (
        <button
            type='button'
            onClick={onAdd}
            aria-label={what}
            title={what}
            className='register-add flex items-center justify-center bg-transparent text-jx-tinta3 hover:bg-jx-verde-suave hover:text-jx-verde-texto transition-colors'
            style={{ opacity: waiting ? 0.45 : 1 }}
        >
            <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.6' strokeLinecap='round' aria-hidden='true'>
                <line x1='12' y1='5' x2='12' y2='19' />
                <line x1='5' y1='12' x2='19' y2='12' />
            </svg>
        </button>
    );
}
