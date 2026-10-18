/*  REPORTAR LA DEMORA DE UNA MESA
 *
 *  Solo se pinta cuando hay demora y todavía no se ha reportado: es el atajo para reportarla sin salir de la
 *  ventana. La propuesta «C · Marco que late y Reportar», elegida por el usuario: una píldora roja con el reloj y
 *  la palabra «Reportar», para que se entienda qué hay que hacer. En una tabla estrecha se queda solo el reloj
 *  (registers.css, con '@container'); lo que hace lo dice también su 'title'.
 *
 *  Hay uno en cada duración que se pasa: la de primera atención y la de limpieza ('kind'). Al pulsarlo se
 *  abre «Demoras» en el panel de la derecha con SU formulario ya relleno: la mesa y sus dos horas, Ocupa y
 *  Primera atención, o Desocupa y Limpieza (ver askForReport en RegisterRecordRow, y reporteDemora). Al
 *  enviarlo, la fila apunta la novedad y en su lugar sale la bandera de «Reportada» (ReportedFlag).
 *
 *  El aspecto va en las clases 'register-report…' de registers.css: la regla global 'button {}' de index.css
 *  gana a las utilidades de Tailwind en tamaño, relleno y borde.
 */


/*  @param {string}   table     el número de mesa, para decir cuál se reporta
 *  @param {string}   kind      qué demora: 'primera atención' (por defecto) o 'limpieza'
 *  @param {function} onReport  pedir el reporte
 */
export default function ReportDelayButton({ table, kind = 'primera atención', onReport }) {
    return (
        <button
            type='button'
            className='register-report'
            onClick={onReport}
            aria-label={`Reportar la demora de ${kind} de la mesa ${table || '?'}`}
            title={`Reportar la demora de ${kind} de la mesa ${table || '?'}: abre su formulario con la mesa y sus horas`}
        >
            <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor'
                 strokeWidth='2.6' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <circle cx='12' cy='12' r='9' />
                <path d='M12 7v5l3 2' />
            </svg>
            <span className='register-report__label'>Reportar</span>
        </button>
    );
}
