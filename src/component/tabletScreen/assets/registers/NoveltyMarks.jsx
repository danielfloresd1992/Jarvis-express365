/*  EN QUÉ QUEDÓ LA ALERTA DE UNA BANDERA: sus marcas en la esquina
 *
 *  Las banderas de Mesas (ReportedFlag, WarnedFlag, EarlyMarkFlag) dicen que se envió una alerta. Estas marcas dicen
 *  qué pasó después, con lo que trae su novedad entera (linkedNoveltyOf, en libs/tickets/linkedNovelties.js):
 *
 *      arriba a la derecha   ✓ verde aprobada · ? gris si ya no existe. Sin validar, o mientras se consulta, ninguna.
 *                            La ✓ solo hace falta cuando la celda no va en verde ('showStatus'): casi siempre lo va, y
 *                            la celda ya lo dice. Una invalidada no llega aquí: en lugar de su bandera va la X para
 *                            enviar otra (ResendAlertButton).
 *      abajo a la derecha    el lápiz ocre: alguien modificó la alerta al validarla
 *
 *  Solo pintan, y quedan fuera de los lectores de pantalla: lo que dicen en palabras va en el 'title' y el
 *  'aria-label' de su bandera (withNoveltyStatus). La bandera tiene que ser 'relative' o 'absolute': su aspecto va
 *  en 'register-novelty-mark…' de registers.css.
 */


// STATUS_PATHS = «el dibujo de la marca de cada estado», en 24 × 24. Los estados sin dibujo no llevan marca.
const STATUS_PATHS = {
    approved: 'M5 12.5l4.5 4.5L19 7.5',
    missing: 'M9 9.5a3 3 0 1 1 4.2 2.7c-.8.4-1.2 1-1.2 1.8v.5M12 19.5h.01',
};

// PENCIL = «el lápiz de "modificada"»
const PENCIL = 'M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z';


/*  @param {object}  novelty     lo que se sabe de la novedad de la bandera (linkedNoveltyOf), o null
 *  @param {boolean} showStatus  con la marca de la validación. false sobre la celda verde de aprobada: ya lo dice ella.
 */
export default function NoveltyMarks({ novelty, showStatus = true }) {
    if (!novelty) return null;

    const statusPath = showStatus ? STATUS_PATHS[novelty.status] : undefined;

    return (
        <>
            {
                statusPath && (
                    <span className={`register-novelty-mark register-novelty-mark--${novelty.status}`} aria-hidden='true'>
                        <svg width='8' height='8' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='4' strokeLinecap='round' strokeLinejoin='round'>
                            <path d={statusPath} />
                        </svg>
                    </span>
                )
            }
            {
                novelty.edited && (
                    <span className='register-novelty-mark register-novelty-mark--edited' aria-hidden='true'>
                        <svg width='7' height='7' viewBox='0 0 24 24' fill='currentColor' stroke='currentColor' strokeWidth='2' strokeLinejoin='round'>
                            <path d={PENCIL} />
                        </svg>
                    </span>
                )
            }
        </>
    );
}
