/*  GUARDAR LA ROTACIÓN — el disquete del final de la fila
 *
 *  Al pulsarlo avisa a la fila ('onSave'), que valida que tenga número de mesa y hora de Ocupa antes de
 *  guardar (RegisterRecordRow, 'saveOne').
 *
 *  Es hermano del «+» del principio de la fila (AddProcessButton): el mismo tamaño y el mismo borde, y
 *  en una fila SIN MESA ('waiting') sale tenue, porque no hay nada que guardar.
 *
 *  Tamaño, relleno y borde van en 'style': la regla global 'button {}' de index.css gana a las
 *  utilidades de Tailwind en esas tres cosas.
 */


/*  @param {string}   table    el número de mesa, para decir cuál se guarda
 *  @param {boolean}  waiting  la fila todavía no tiene mesa
 *  @param {boolean}  busy     se está guardando: el botón se desactiva hasta que conteste la API
 *  @param {function} onSave   guardar la rotación
 */
export default function SaveRecordButton({ table, waiting, busy, onSave }) {

    // what = «lo que hace el botón, dicho con palabras»
    const what = busy ? `Guardando la rotación de la mesa ${table}…`
        : waiting ? 'Guardar la rotación: todavía no tiene número de mesa'
        : `Guardar la rotación de la mesa ${table}`;

    return (
        <button
            type='button'
            onClick={onSave}
            disabled={busy}
            aria-busy={busy}
            aria-label={what}
            title={what}
            className='flex items-center justify-center bg-transparent text-jx-tinta3 hover:bg-jx-verde-suave hover:text-jx-verde-texto transition-colors disabled:cursor-wait'
            style={{ width: 22, height: 22, padding: 0, border: '1px solid var(--color-jx-regla2)', borderRadius: 6, opacity: waiting || busy ? 0.45 : 1 }}
        >
            <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <path d='M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z' />
                <path d='M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7' />
                <path d='M7 3v4a1 1 0 0 0 1 1h7' />
            </svg>
        </button>
    );
}
