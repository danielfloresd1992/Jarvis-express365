import { minSeg } from '../../formato.js';


/*  LA DEMORA DE UN TICKET: por cuánto se pasó, «en plazo», o una raya si todavía no se sabe
 */


/*  @param {boolean|null} delay    true si se demoró, false si salió en plazo, null si todavía no se sabe
 *  @param {number}       excessS  por cuántos segundos se pasó
 */
export default function DelayBadge({ delay, excessS }) {
    if (delay === true) return <span className='sim-ficha sim-ficha--demora'>+{minSeg(excessS ?? 0)}</span>;
    if (delay === false) return <span className='sim-ficha sim-ficha--enplazo'>en plazo</span>;
    return '—';
}
