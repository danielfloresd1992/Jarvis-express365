import { ALARM_COLOR } from './alarm.js';


/*  LA FLECHA QUE DESPLIEGA LOS PROCESOS DE UNA ROTACIÓN
 *
 *  Dice cuántos procesos tiene la rotación y, al pulsarla, los abre o los cierra debajo de su fila.
 *  Sin procesos no se pinta: no hay nada que desplegar (para añadir uno está el «+» del final).
 *
 *  Con la fila cerrada no se ven las rayas de alarma de sus procesos, así que la cuenta se pinta del
 *  color de la peor: roja si alguno pasó de hora y media, ámbar si alguno sigue en camino.
 *
 *  Relleno, borde y letra van en 'style': la regla global 'button {}' de index.css gana a las
 *  utilidades de Tailwind en esas tres cosas (los colores y el ':hover' sí funcionan con clases).
 */


/*  @param {number}   count     cuántos procesos tiene la rotación
 *  @param {boolean}  open      están desplegados
 *  @param {string}   alarm     la peor alarma de sus procesos: 'rojo' | 'amarillo' | ''
 *  @param {function} onToggle  abrirlos o cerrarlos
 *  @param {string}   noun      qué despliega, en singular: 'proceso' (por defecto) o 'toque' (los de gerente)
 */
export default function ProcessToggle({ count, open, alarm, onToggle, noun = 'proceso' }) {

    if (count === 0) return null;

    // what = «lo que hace la flecha, dicho con palabras»
    const what = `${open ? 'Cerrar' : 'Desplegar'} ${count === 1 ? `el ${noun}` : `los ${count} ${noun}s`} de esta mesa`;

    return (
        <button
            type='button'
            onClick={onToggle}
            aria-expanded={open}
            aria-label={what}
            title={what}
            className='flex items-center gap-[3px] bg-jx-tarjeta text-jx-tinta2 hover:bg-jx-hundido hover:text-jx-tinta transition-colors'
            style={{ padding: '2px 5px', border: '1px solid var(--color-jx-regla2)', borderRadius: 6, fontSize: 11, fontWeight: 700, lineHeight: 1 }}
        >
            <svg
                width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.6'
                strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'
                style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease' }}
            >
                <polyline points='9 6 15 12 9 18' />
            </svg>

            <span className='tabular-nums' style={alarm ? { color: ALARM_COLOR[alarm] } : undefined}>
                {count}
            </span>
        </button>
    );
}
