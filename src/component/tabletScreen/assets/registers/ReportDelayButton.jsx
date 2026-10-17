/*  REPORTAR LA DEMORA DE UNA MESA
 *
 *  Solo se pinta cuando hay demora: es el atajo para reportarla sin salir de la ventana. Es un ícono
 *  —un reloj en rojo (pedido del usuario; antes era una bandera)— para que quepa junto a la hora aunque
 *  la ventana esté a 400 px; lo que hace lo dice su 'title'.
 *
 *  Hay uno en cada duración que se pasa: la de primera atención y la de limpieza ('kind'). Al pulsarlo se
 *  abre «Demoras» en el panel de la derecha con SU formulario ya relleno: la mesa y sus dos horas, Ocupa y
 *  Primera atención, o Desocupa y Limpieza (ver askForReport en RegisterRecordRow, y reporteDemora).
 *
 *  Va sobre la celda en rojo suave de la duración (register-cell--late): por eso el botón es claro, con el
 *  reloj y el borde en rojo, y se llena de rojo al pasar el ratón.
 *
 *  Tamaño, relleno y borde van en 'style' y no en clases: la regla global 'button {}' de index.css
 *  gana a las utilidades de Tailwind.
 */


/*  @param {string}   table     el número de mesa, para decir cuál se reporta
 *  @param {string}   kind      qué demora: 'primera atención' (por defecto) o 'limpieza'
 *  @param {function} onReport  pedir el reporte
 */
export default function ReportDelayButton({ table, kind = 'primera atención', onReport }) {
    return (
        <button
            type='button'
            className='shrink-0 flex items-center justify-center text-jx-critico bg-jx-tarjeta hover:bg-jx-critico hover:text-white transition-colors'
            style={{ width: 22, height: 22, padding: 0, border: '1.5px solid var(--color-jx-critico)', borderRadius: '50%' }}
            onClick={onReport}
            aria-label={`Reportar la demora de ${kind} de la mesa ${table || '?'}`}
            title={`Reportar la demora de ${kind} de la mesa ${table || '?'}: abre su formulario con la mesa y sus horas`}
        >
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor'
                 strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <circle cx='12' cy='12' r='8.5' />
                <path d='M12 7.5V12l3 2' />
            </svg>
        </button>
    );
}
