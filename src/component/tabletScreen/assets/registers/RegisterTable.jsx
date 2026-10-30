import { memo, useLayoutEffect, useMemo, useRef } from 'react';
import { WrapperCell } from '../../../cells/GridCells.jsx';
import { GridNavProvider, useGridNavigation } from '../../../cells/GridNav.jsx';
import { isBlankRecord } from '../../../../libs/tickets/tableRecords.js';
import { matchOf, SORT_OPTIONS } from '../../../../libs/tickets/tableView.js';
import { COLUMNS, tableGrid, columnStripes, headerTint, managersWidth, columnDescription } from './columns.js';
import RegisterRecordRow from './RegisterRecordRow.jsx';
import RegisterEmptyNotice from './RegisterEmptyNotice.jsx';
import RegisterStaleBlock from './RegisterStaleBlock.jsx';
import './registers.css';


/*  EL REGISTER: las rotaciones de las mesas, y dentro de cada una sus procesos
 *
 *  Antes eran dos tablas —Rotación (las mesas) y Procesos (los pedidos)— que se turnaban en pestañas.
 *  Ahora es una: una fila por rotación, y sus procesos se despliegan debajo con la flecha (ver
 *  RegisterRecordRow). Es la estructura de libs/tickets/tableRecords.js.
 *
 *  Al final siempre quedan filas en blanco para anotar a mano; las pone el registro, no esta tabla.
 */


/*  @param {Array}    records         las rotaciones (useRegisterStore), con las filas en blanco del final
 *  @param {Array}    liveOrders      los pedidos que se están siguiendo ahora (useProcessTracking)
 *  @param {string}   attentionLimit  el límite de primera atención del local
 *  @param {string}   cleaningLimit   el límite de limpieza del local
 *  @param {function} writeRecord     anota un dato de una rotación
 *  @param {function} writeProcess    anota una hora de un proceso
 *  @param {function} writeListOpen   despliega o pliega una lista de una rotación ('processesOpen' | 'touchesOpen')
 *  @param {function} addProcess      añade un proceso en blanco a una rotación
 *  @param {function} deleteProcess   borra un proceso de una rotación
 *  @param {function} clearRecord     deja una rotación en blanco (ya guardada en la API)
 *  @param {function} addTouch        apunta un toque de gerente en una rotación
 *  @param {function} writeTouch      corrige una hora de un toque: la suya o la de su fin
 *  @param {function} deleteTouch     borra un toque
 *  @param {function} onReportDelay   qué hacer cuando se pide reportar una demora
 *
 *  Y los datos para explicar un register vacío (ver RegisterEmptyNotice). Con alguna rotación no se usan:
 *  @param {boolean}  hasReading      false antes de la primera lectura y tras desconectar
 *  @param {string}   readingError    el motivo, si la última lectura falló
 *  @param {boolean}  censusing       el seguimiento sigue apuntando lo que ya estaba
 *  @param {number}   censusReadings  cuántas lecturas lleva en ello…
 *  @param {number}   censusLength    …y cuántas dura
 *  @param {number}   alreadyThere    cuántas tarjetas apartó el censo
 *
 *  @param {Array}    managers        los botones de los gerentes del local (managers.js): una columna a la derecha
 *  @param {string}   establishmentId el _id del local, para guardar cada rotación (el disquete)
 *  @param {function} onSaved         opcional. La API guardó una rotación: (la rotación guardada), para la lista de Registros
 *  @param {object}   stale           opcional. Las rotaciones de días anteriores (useStaleRotations): salen de su fila
 *                                    y van arriba, aparte y bloqueadas (RegisterStaleBlock)
 *  @param {object}   dishTypes       el tipo de plato del local (createDishTypes, en dishTypes.js): las opciones y el tiempo de cada plato
 *
 *  Lo que se ve, de la barra de herramientas (useTableView; propuesta «A · Barra de herramientas»):
 *  @param {Array}    rows            opcional. Las filas que se enseñan, ya buscadas, filtradas y ordenadas, sin las de días
 *                                    anteriores. Sin ella, todas las de hoy en su orden.
 *  @param {string}   query           lo que se busca: las cifras de una mesa ('' = nada). Su mesa exacta va marcada.
 *  @param {string}   sort            el orden: 'arrival' | 'asc' | 'desc'. Por número, la cabecera Mesa lleva la flecha.
 *  @param {boolean}  filtering       se está buscando o mostrando solo una parte
 *  @param {string}   emptyText       qué decir si así no queda ninguna fila
 *  @param {function} onResetFilters  quitar la búsqueda y lo que se muestra (el botón de ese aviso)
 */
function RegisterTable({ records, liveOrders, attentionLimit, cleaningLimit, attentionOrigin, cleaningOrigin, writeRecord, writeProcess, writeListOpen, addProcess, deleteProcess, clearRecord, addTouch, writeTouch, deleteTouch, onReportDelay, hasReading, readingError, censusing, censusReadings, censusLength, alreadyThere, managers, establishmentId, onSaved, stale, dishTypes, rows, query = '', sort = 'arrival', filtering = false, emptyText = '', onResetFilters }) {

    // current = «las rotaciones de hoy, y las filas en blanco»: las de días anteriores van aparte, en su bloque
    const current = useMemo(() => (stale?.ids.size > 0 ? records.filter(record => !stale.ids.has(record.id)) : records), [records, stale]);

    // shownRows = «las filas que se pintan»: las de la barra de herramientas, o las de hoy tal cual
    const shownRows = rows ?? current;

    // liveByKey = «lo que dice ahora mismo el seguimiento de cada pedido», por su key
    const liveByKey = useMemo(() => new Map((liveOrders ?? []).map(order => [order.clave, order])), [liveOrders]);

    // widthOfManagers = «lo que mide la columna de los gerentes» (0 = el local no tiene, y no se pinta).
    // La rejilla y las franjas dependen de ella, y se arman solo cuando cambia.
    const widthOfManagers = managersWidth(managers.length);
    const grid = useMemo(() => tableGrid(widthOfManagers), [widthOfManagers]);
    const stripes = useMemo(() => columnStripes(widthOfManagers), [widthOfManagers]);

    // limits = «los tiempos de referencia del local», para que la cabecera diga con cuáles se marcan las duraciones
    const limits = { attentionLimit, cleaningLimit };

    // empty = «no hay ninguna rotación con algo»
    const empty = records.every(isBlankRecord);

    // La navegación por teclado entre celdas, como en Excel (GridNav.jsx, gridNav.js): el contenedor escucha las
    // flechas y cada celda con 'data-grid-cell' entra en el recorrido
    const { containerRef, onKeyDown, nav } = useGridNavigation();


    /*  LA FILA EN LA QUE SE ESCRIBE NO SE PIERDE DE VISTA
     *
     *  Ordenadas por número, al escribir la mesa en una fila libre la fila salta a su sitio, quizá fuera de la
     *  pantalla; React le deja el foco, pero no la sigue. Si la fila que tiene el foco cambió de puesto, se lleva a la
     *  vista. Solo entonces: si no, cada lectura de la IA devolvería la tabla a esa celda aunque se haya bajado a mirar
     *  otra cosa.
     */

    // previousRowsRef = «las filas del pintado anterior»
    const previousRowsRef = useRef(shownRows);

    useLayoutEffect(() => {
        const previous = previousRowsRef.current;
        previousRowsRef.current = shownRows;
        if (previous === shownRows) return;

        const focused = document.activeElement;
        if (!focused || !containerRef.current?.contains(focused)) return;

        const rowId = focused.closest('[data-record-id]')?.getAttribute('data-record-id');
        if (!rowId) return;

        const before = previous.findIndex(record => record.id === rowId);
        const after = shownRows.findIndex(record => record.id === rowId);
        if (before !== after) focused.scrollIntoView?.({ block: 'nearest' });
    }, [shownRows, containerRef]);

    // sortArrow = «la flecha de la cabecera Mesa»: ↑ de menor a mayor, ↓ de mayor a menor; en el orden de llegada, ninguna
    const sortArrow = sort === 'asc' ? '↑' : sort === 'desc' ? '↓' : '';

    // sortWords = «el orden, dicho para leer», para el 'title' de la cabecera Mesa
    const sortWords = SORT_OPTIONS.find(option => option.id === sort)?.words ?? '';

    // headerCell = «el estilo de las celdas de la cabecera». Las de las columnas van además teñidas de su color.
    // La letra, la misma que la cabecera de los procesos (10 px, RegisterProcessList; pedido del usuario): 'register-header-cell'
    // fija los 10 px en registers.css, porque la de WrapperCell, que crece con el ancho, gana a una utilidad de tamaño.
    const headerCell = 'register-header-cell uppercase tracking-[0.5px] font-semibold bg-jx-tarjeta text-jx-tinta';

    return (
        <div className='w-full flex-1 min-h-0 flex flex-col'>

            {/*  Se desplaza hacia abajo, nunca hacia los lados: las columnas se reparten el ancho que
                 haya. '@container' deja a las celdas medir la letra por él. Su fondo son las franjas de
                 color de las columnas (columnStripes).  */}
            <div ref={containerRef} onKeyDown={onKeyDown} className='@container flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden' style={stripes}>
              <GridNavProvider nav={nav}>

                {/*  CABECERA FIJA. 'z-10' no es decorativo: sin él las filas que pasan por debajo al
                     desplazarse se dibujan ENCIMA de la cabecera. La celda sin título es la del «+».  */}
                <div className='register-header sticky top-0 z-10 h-[46px] bg-jx-tarjeta w-full' style={grid}>
                    {/*  El «+», Gerentes y el disquete son las columnas de los lados: 'register-rail' les da el mismo
                         fondo de arriba abajo, en la cabecera y en todas las filas (registers.css)  */}
                    {/*  Al pasar el ratón, cada una dice qué representa (columnDescription, en columns.js)  */}
                    <WrapperCell tall classStyles={`${headerCell} register-rail`} titulo={columnDescription('add')} />
                    {
                        COLUMNS.map(column => {
                            // sortedHere = «esta columna manda en el orden»: la Mesa, ordenada por número
                            const sortedHere = column.id === 'tableNumber' && sortArrow !== '';
                            return (
                                <WrapperCell
                                    key={column.id}
                                    tall
                                    classStyles={headerCell}
                                    estilo={{ background: headerTint(column) }}
                                    titulo={sortedHere ? `${columnDescription(column.id, limits)} Ahora ordenada: ${sortWords.toLowerCase()}.` : columnDescription(column.id, limits)}
                                >
                                    {column.title}
                                    {sortedHere && <span className='register-sort-arrow' aria-hidden='true'>{sortArrow}</span>}
                                </WrapperCell>
                            );
                        })
                    }
                    {managers.length > 0 && <WrapperCell tall classStyles={`${headerCell} register-rail`} titulo={columnDescription('managers')}>Gerentes</WrapperCell>}
                    <WrapperCell tall classStyles={`${headerCell} register-rail`} titulo={columnDescription('save')} />

                </div>

                {/*  POR QUÉ NO HAY NADA. Solo sin NINGUNA rotación: en cuanto hay una, la tabla se explica sola.  */}
                {
                    empty && (
                        <RegisterEmptyNotice
                            hasReading={hasReading}
                            readingError={readingError}
                            censusing={censusing}
                            censusReadings={censusReadings}
                            censusLength={censusLength}
                            alreadyThere={alreadyThere}
                        />
                    )
                }

                {/*  LAS DE DÍAS ANTERIORES, arriba y aparte: bloqueadas, solo guardar o eliminar  */}
                {stale && <RegisterStaleBlock stale={stale} grid={grid} hasManagers={managers.length > 0} />}

                {/*  LO BUSCADO O LO MOSTRADO NO DEJA NINGUNA FILA: se dice, con el botón para volver a verlas todas  */}
                {
                    filtering && shownRows.length === 0 && (
                        <div className='register-filter-empty' role='status'>
                            <p className='register-filter-empty__text'>{emptyText}</p>
                            <button type='button' className='register-filter-empty__reset' onClick={onResetFilters}>Quitar la búsqueda y los filtros</button>
                        </div>
                    )
                }

                {
                    shownRows.map(record => (
                        <RegisterRecordRow
                            key={record.id}
                            record={record}
                            match={matchOf(record, query)}
                            liveByKey={liveByKey}
                            attentionLimit={attentionLimit}
                            cleaningLimit={cleaningLimit}
                            attentionOrigin={attentionOrigin}
                            cleaningOrigin={cleaningOrigin}
                            writeRecord={writeRecord}
                            writeProcess={writeProcess}
                            writeListOpen={writeListOpen}
                            addProcess={addProcess}
                            deleteProcess={deleteProcess}
                            clearRecord={clearRecord}
                            addTouch={addTouch}
                            writeTouch={writeTouch}
                            deleteTouch={deleteTouch}
                            onReportDelay={onReportDelay}
                            grid={grid}
                            managers={managers}
                            widthOfManagers={widthOfManagers}
                            establishmentId={establishmentId}
                            onSaved={onSaved}
                            dishTypes={dishTypes}
                        />
                    ))
                }

              </GridNavProvider>
            </div>

        </div>
    );
}


//  'memo': la sesión se repinta a menudo por cosas que a esta tabla le dan igual —qué captura lee la IA,
//  el texto de estado, el zoom—. Con 'memo', React compara las props y, si son las mismas, se la salta.
export default memo(RegisterTable);
