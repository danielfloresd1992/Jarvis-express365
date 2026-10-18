/*  GUARDAR LA ROTACIÓN — el disquete del final de la fila
 *
 *  Al pulsarlo avisa a la fila ('onSave'), que valida que tenga número de mesa y hora de Ocupa antes de
 *  guardar (RegisterRecordRow, 'saveOne').
 *
 *  Es una tecla con relieve, como las de los gerentes (pedido del usuario: se veía plano). Se pone en
 *  verde cuando la rotación ya terminó ('done'): es la que toca guardar. En una fila SIN MESA ('waiting')
 *  va plana, porque no hay nada que guardar; y mientras guarda, hundida y con el giro.
 *
 *  El aspecto va en las clases 'register-save…' de registers.css: la regla global 'button {}' de
 *  index.css gana a las utilidades de Tailwind en tamaño, relleno y borde.
 */


/*  @param {string}   table    el número de mesa, para decir cuál se guarda
 *  @param {boolean}  waiting  la fila todavía no tiene mesa
 *  @param {boolean}  done     la rotación terminó: la mesa se limpió, o el pedido para llevar se entregó
 *  @param {boolean}  busy     se está guardando: el botón se desactiva hasta que conteste la API
 *  @param {function} onSave   guardar la rotación
 */
export default function SaveRecordButton({ table, waiting, done, busy, onSave }) {

    // what = «lo que hace el botón, dicho con palabras»
    const what = busy ? `Guardando la rotación de la mesa ${table}…`
        : waiting ? 'Guardar la rotación: todavía no tiene número de mesa'
        : done ? `Guardar la rotación de la mesa ${table}: ya terminó`
        : `Guardar la rotación de la mesa ${table}`;

    // look = «la clase de su estado»: plana sin mesa, verde terminada
    const look = waiting ? 'register-save--waiting' : done ? 'register-save--done' : '';

    return (
        <button
            type='button'
            onClick={onSave}
            disabled={busy}
            aria-busy={busy}
            aria-label={what}
            title={what}
            className={`register-save ${look}`}
        >
            {
                busy ? (
                    <svg className='animate-spin' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.6' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                        <path d='M21 12a9 9 0 1 1-9-9' />
                    </svg>
                ) : (
                    <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                        <path d='M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z' />
                        <path d='M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7' />
                        <path d='M7 3v4a1 1 0 0 0 1 1h7' />
                    </svg>
                )
            }
        </button>
    );
}
