import { plural } from '../../formato.js';


/*  EL AVISO DE QUE EL TURNO TERMINÓ
 *
 *  Ya pasaron todas sus mesas y no entra ninguna más. Desde aquí se puede empezar otro.
 */


/*  @param {number}   rotations   cuántas mesas tenía el turno
 *  @param {function} onNewShift  empezar otro turno
 */
export default function ShiftOverBanner({ rotations, onNewShift }) {
    return (
        <div className='sim-franja sim-franja--fin' role='status'>
            <span><b>El turno terminó:</b> ya pasaron sus {plural(rotations, 'mesa', 'mesas')} y no entra ninguna más.</span>
            <button type='button' className='sim-boton sim-boton--chico' onClick={onNewShift}>↺ Empezar otro turno</button>
        </div>
    );
}
