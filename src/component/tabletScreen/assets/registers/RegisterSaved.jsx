import { useMemo } from 'react';
import RegisterSavedRow, { SAVED_GRID, SAVED_COLUMNS, CYCLE_TITLES } from './RegisterSavedRow.jsx';
import { headerTint } from './columns.js';
import { operationalDayLabel } from '../../../../libs/date_time/operationalDay.js';
import { isTakeOut } from '../../../../libs/tickets/tableRecords.js';
import ExportExcelButton from './ExportExcelButton.jsx';


/*  LA PESTAÑA «REGISTROS»: LAS ROTACIONES GUARDADAS DEL DÍA
 *
 *  Las que se guardaron con el disquete, tal como las devuelve api_jarvis365, una fila por rotación y
 *  ordenadas por la hora en que se ocupó la mesa. Arriba, el día y los totales.
 *
 *  No pide nada y no guarda nada: la lista y lo que la corrige viven en la sesión de la tablet
 *  (session.savedRotations, hook/useSavedRotations.jsx) y le llegan por props desde Registers. Aquí se
 *  pintan, con sus tres estados —trayéndolas, sin ninguna y con error—. Por eso se puede desmontar al
 *  pasar a Mesas sin perder nada, y la búsqueda de tickets ya guardados no depende de que se vea.
 */


// secondsOf = «una hora 'HH:MM:SS' en segundos del día operativo», para ordenar; null si no hay hora.
// El día operativo abre a las 08:00: una hora anterior es de la madrugada siguiente y va después.
function secondsOf(time) {
    const [hours, minutes, seconds] = String(time ?? '').split(':').map(Number);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
    const value = hours * 3600 + minutes * 60 + (seconds || 0);
    return value < 8 * 3600 ? value + 24 * 3600 : value;
}


/*  @param {object}   saved              las rotaciones guardadas (useSavedRotations): { status, day, documents, message }
 *                                       status: 'loading' | 'ready' | 'error'
 *  @param {string}   establishmentName  el local, para decir de cuál son
 *  @param {string}   attentionLimit     el límite de primera atención del local
 *  @param {string}   cleaningLimit      el límite de limpieza del local
 *  @param {function} onRetry            volver a pedirlas
 *  @param {function} onEdit             corrige un dato: (data, id) — ver editSaved en useSavedRotations
 *  @param {function} onAddTouch         apunta un toque: (id de la rotación, gerente) — ver addSavedTouch en useSavedRotations
 *  @param {function} onDeleteTouch      quita un toque: (id del toque) — ver deleteSavedTouch en useSavedRotations
 *  @param {string}   editNotice         por qué no se guardó la última corrección ('' si se guardó)
 *  @param {Array}    managers           los botones de los gerentes del local, para las placas de los toques
 *  @param {function} onExport           opcional. Exportar a Excel; sin él, el botón sale apagado
 */
export default function RegisterSaved({ saved, establishmentName, attentionLimit, cleaningLimit, onRetry, onEdit, onAddTouch, onDeleteTouch, editNotice, managers, onExport }) {

    const { status, day, documents, message } = saved;

    // rotations = «las rotaciones, por la hora en que se ocupó la mesa»
    const rotations = useMemo(
        () => [...documents].sort((first, second) => (secondsOf(first.hourOccupies) ?? 0) - (secondsOf(second.hourOccupies) ?? 0)),
        [documents]
    );

    // loading = «se están trayendo, y todavía no hay ninguna que enseñar»
    const loading = status === 'loading' && rotations.length === 0;

    // takeOutCount / rotationCount = «los pedidos para llevar» y «las rotaciones de verdad». Un pedido para
    // llevar sale en la lista, pero no cuenta como rotación: no hubo mesa ocupada (isTakeOut).
    const takeOutCount = rotations.filter(isTakeOut).length;
    const rotationCount = rotations.length - takeOutCount;

    // totalTouches = «los toques de gerente del día», sumando los de todas las rotaciones
    const totalTouches = rotations.reduce((sum, rotation) => sum + (rotation.touch?.length ?? 0), 0);

    return (
        <div className='flex-1 min-h-0 flex flex-col bg-jx-lienzo'>

            {/*  El día y los totales: rotaciones, pedidos para llevar (si hay) y toques de gerente (sin título: el
                 usuario lo quitó). A la derecha, Exportar a Excel.  */}
            <div className='shrink-0 flex flex-wrap items-center gap-2.5 px-4 py-2 border-b border-jx-regla2'>
                {day && <span className='text-[13px] font-semibold text-jx-tinta'>{operationalDayLabel(day)} · día operativo</span>}
                {status === 'ready' && <span className='register-saved-chip register-saved-chip--count'>{rotationCount} {rotationCount === 1 ? 'rotación' : 'rotaciones'}</span>}
                {status === 'ready' && takeOutCount > 0 && <span className='register-saved-chip register-saved-chip--process' title='Pedidos sin mesa: su mesa es el #ticket. No cuentan como rotación.'>{takeOutCount} para llevar</span>}
                {status === 'ready' && <span className='register-saved-chip register-saved-chip--touches-total'>{totalTouches} {totalTouches === 1 ? 'toque' : 'toques'} en total</span>}
                {status === 'loading' && rotations.length > 0 && <span className='text-[12px] text-jx-tinta3'>actualizando…</span>}
                {editNotice && <span className='register-saved-chip register-saved-chip--late' role='alert'>No se guardó el cambio: {editNotice}</span>}
                <ExportExcelButton onExport={onExport} disabled={rotations.length === 0} />
            </div>

            {
                loading && (
                    <div className='flex flex-col gap-4 px-4 py-5' aria-busy='true' aria-label='Trayendo las rotaciones guardadas'>
                        {['70%', '85%', '55%', '60%'].map(width => (
                            <div key={width} className='grid grid-cols-[48px_32px_minmax(0,1fr)] gap-3 items-center'>
                                <span className='register-saved-skeleton' />
                                <span className='register-saved-skeleton' />
                                <span className='register-saved-skeleton' style={{ width }} />
                            </div>
                        ))}
                    </div>
                )
            }

            {
                status === 'error' && (
                    <div className='flex-1 flex flex-col items-center justify-center gap-2.5 p-6 text-center'>
                        <span className='text-[14px] font-bold text-jx-tinta'>No se pudieron traer las rotaciones</span>
                        <span className='max-w-[340px] text-[12.5px] text-jx-tinta2'>{message}</span>
                        <button type='button' className='register-saved-retry' onClick={onRetry}>
                            Reintentar
                        </button>
                    </div>
                )
            }

            {
                status === 'ready' && rotations.length === 0 && (
                    <div className='flex-1 flex flex-col items-center justify-center gap-2.5 p-6 text-center'>
                        <span className='text-[14px] font-bold text-jx-tinta'>Todavía no hay rotaciones guardadas hoy{establishmentName ? ` en ${establishmentName}` : ''}</span>
                        <span className='max-w-[340px] text-[12.5px] text-jx-tinta2'>Cada mesa se guarda con el disquete de su fila, en la pestaña Mesas. Las guardadas aparecen aquí.</span>
                    </div>
                )
            }

            {
                rotations.length > 0 && (
                    <>
                        {/*  La cabecera: Hora, las cuatro columnas de datos teñidas de su color (como en la
                             pestaña Mesas) y las del ciclo (CYCLE_TITLES, en el orden de la fila).  */}
                        <div className='register-saved-header shrink-0' style={SAVED_GRID}>
                            <div className='register-saved-cell'>Hora</div>
                            {SAVED_COLUMNS.map(column => (
                                <div key={column.id} className='register-saved-cell text-center px-1' style={{ background: headerTint(column) }}>{column.title}</div>
                            ))}
                            {CYCLE_TITLES.map(title => (
                                <div key={title} className='register-saved-cell text-center px-1'>{title}</div>
                            ))}
                        </div>

                        <div className='flex-1 min-h-0 overflow-y-auto'>
                            {rotations.map(rotation => (
                                <RegisterSavedRow
                                    key={rotation._id}
                                    rotation={rotation}
                                    attentionLimit={attentionLimit}
                                    cleaningLimit={cleaningLimit}
                                    onEdit={onEdit}
                                    onAddTouch={onAddTouch}
                                    onDeleteTouch={onDeleteTouch}
                                    managers={managers}
                                />
                            ))}
                        </div>
                    </>
                )
            }

        </div>
    );
}
