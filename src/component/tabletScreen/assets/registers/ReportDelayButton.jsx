/*  REPORTAR LA DEMORA DE UNA MESA
 *
 *  Solo se pinta cuando hay demora: es el atajo para reportarla sin salir de la ventana. Es un ícono
 *  —una bandera— para que quepa junto a la hora aunque la ventana esté a 400 px; lo que hace lo dice
 *  su 'title'.
 *
 *  Tamaño, relleno y borde van en 'style' y no en clases: la regla global 'button {}' de index.css
 *  gana a las utilidades de Tailwind.
 */


/*  @param {string}   table     el número de mesa, para decir cuál se reporta
 *  @param {function} onReport  pedir el reporte
 */
export default function ReportDelayButton({ table, onReport }) {
    return (
        <button
            type='button'
            className='shrink-0 flex items-center justify-center text-white bg-jx-critico hover:bg-jx-critico-texto transition-colors'
            style={{ width: 22, height: 22, padding: 0, border: 'none', borderRadius: 6 }}
            onClick={onReport}
            aria-label={`Reportar la demora de la mesa ${table || '?'}`}
            title={`Reportar la demora de la mesa ${table || '?'}`}
        >
            <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor'
                 strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <path d='M5 21V4' />
                <path d='M5 4h12l-2.5 4.5L17 13H5' />
            </svg>
        </button>
    );
}
