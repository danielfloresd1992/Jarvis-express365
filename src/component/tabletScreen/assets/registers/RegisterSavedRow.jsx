import { useState, useRef, useEffect } from 'react';
import { getTimeReport } from '../../../../libs/date_time/calculate_time.js';
import { WrapperText } from '../../../cells/GridCells.jsx';
import { isTakeOut } from '../../../../libs/tickets/tableRecords.js';
import { COLUMNS } from './columns.js';
import SavedTextInput from './SavedTextInput.jsx';
import SavedPerson, { fullName } from './SavedPerson.jsx';
import RegisterSavedToggle, { Chevron } from './RegisterSavedToggle.jsx';
import RegisterSavedProcesses from './RegisterSavedProcesses.jsx';
import RegisterSavedTouches from './RegisterSavedTouches.jsx';
import RegisterSavedChanges from './RegisterSavedChanges.jsx';


/*  UNA ROTACIÓN GUARDADA, EN LA PESTAÑA «REGISTROS»
 *
 *      Hora │ Mesa │ Ocupa │ 1ra Atención │ Desocupa │ Limpieza │ Tiempo de 1ra atención │
 *      Tiempo de limpieza │ Procesos TP │ Toques de gerentes │ Creador │ Edición
 *
 *  «Hora» es cuándo se guardó. Las cinco columnas de datos llevan el color que tienen en la pestaña
 *  Mesas (COLUMNS, en columns.js): la cabecera teñida y la celda con una franja suave. Los dos tiempos
 *  van en cápsulas, en rojo si pasaron del límite; «Creador» es quien la guardó y «Edición», quien la
 *  corrigió por última vez (la última línea de 'changes'), los dos con su foto (SavedPerson). La persona
 *  de «Edición» despliega además la lista de todos los cambios (RegisterSavedChanges).
 *
 *  SE CORRIGE: la mesa escribiéndola y las horas con doble clic; los procesos y los toques, en las listas
 *  que despliegan sus cápsulas. Cada cambio sale por 'onEdit' con el _id de lo que cambia. «Hora» no se
 *  corrige: es cuándo se guardó, y la pone el servidor.
 *
 *  UN PEDIDO PARA LLEVAR (isTakeOut: su mesa es un '#ticket') no es una rotación: solo trae su proceso.
 *  Sus horas de mesa, sus dos tiempos y sus toques van tachados, como en la pestaña Mesas; los toques
 *  solo enseñan su cápsula si ya tenía alguno, para poder verlos y quitarlos. La mesa sí se corrige:
 *  quitarle el '#' la vuelve una rotación, y la API recalcula 'takeOut' al guardarla.
 *
 *  La lista desplegada FLOTA bajo las columnas del ciclo, encima de las filas de abajo: no estira la fila
 *  (pedido del usuario). Para que se vea de quién es, la fila abierta se oscurece un poco. Se cierra con
 *  su botón, con Escape o pinchando fuera de la fila.
 */


// SAVED_GRID = «la rejilla de una rotación guardada»: la misma para la cabecera y cada fila. Las fijas
// son las justas para su contenido, para que a Creador y Edición les quede sitio aunque el tablero sea
// estrecho (con el panel de la inferencia abierto).
export const SAVED_GRID = {
    display: 'grid',
    gridTemplateColumns: '56px 48px 84px 84px 84px 84px 88px 100px 100px 92px minmax(0, 1fr) minmax(0, 1fr)',
    gridAutoRows: 'minmax(42px, auto)',
};

// SAVED_COLUMNS = «las columnas de datos», con el título y el color que tienen en la pestaña Mesas;
// aquí Primera atención se titula «1ra Atención» (pedido del usuario)
export const SAVED_COLUMNS = ['tableNumber', 'hourOccupies', 'hourFirstAttention', 'breakUp', 'tableCleaning']
    .map(id => COLUMNS.find(column => column.id === id))
    .map(column => (column.id === 'hourFirstAttention' ? { ...column, title: '1ra Atención' } : column));

// DRAWER_AREA = «dónde va la lista desplegada»: de la primera columna del ciclo (tras Hora y las de datos) al
// final. Como flota ('position: absolute'), esa zona de la rejilla es su caja: se pega al borde de abajo de la fila.
const DRAWER_AREA = { gridColumn: `${SAVED_COLUMNS.length + 2} / -1`, gridRow: '1' };

// CYCLE_TITLES = «los títulos de las columnas del ciclo», en el orden en que las pinta la fila
export const CYCLE_TITLES = ['Tiempo de 1ra atención', 'Tiempo de limpieza', 'Procesos TP', 'Toques de gerentes', 'Creador', 'Edición'];

// cellTint = «el fondo de una celda»: el color de su columna, suave
export const cellTint = (column) => `color-mix(in srgb, ${column.color} 16%, var(--color-jx-lienzo))`;

// clock = «una fecha como hora HH:MM de este equipo»
const clock = (date) => new Date(date).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });


/*  @param {object}   rotation        la rotación tal como la devuelve la API (GET /rotation)
 *  @param {string}   attentionLimit  el límite de primera atención del local, 'HH:MM:SS'
 *  @param {string}   cleaningLimit   el límite de limpieza del local, 'HH:MM:SS'
 *  @param {function} onEdit          corrige un dato: (data, id) — ver editSaved en Registers
 *  @param {function} onAddTouch      apunta un toque: (id de la rotación, gerente) — ver addSavedTouch en Registers
 *  @param {function} onDeleteTouch   quita un toque: (id del toque) — ver deleteSavedTouch en Registers
 *  @param {Array}    managers        los botones de los gerentes del local, para la placa de cada toque
 */
export default function RegisterSavedRow({ rotation, attentionLimit, cleaningLimit, onEdit, onAddTouch, onDeleteTouch, managers }) {

    // open = «qué lista está desplegada»: 'procesos', 'toques', 'cambios' o ninguna ('')
    const [open, setOpen] = useState('');
    const toggle = (list) => setOpen(current => (current === list ? '' : list));

    // rowRef / drawerRef = «la fila» y «la lista desplegada»: para saber si se pinchó fuera y para enseñarla entera
    const rowRef = useRef(null);
    const drawerRef = useRef(null);

    //  Abierta, la lista tapa las filas de abajo: se cierra con Escape o pinchando fuera de la fila. Escape
    //  dentro de un campo es «deja la hora como estaba», no «cierra». Se escucha 'click' y no 'pointerdown'
    //  para que el campo que se esté corrigiendo se guarde al perder el foco ANTES de que la lista se vaya.
    //  Al abrirse se desplaza lo justo para verla entera: en la última fila quedaría bajo el borde.
    useEffect(() => {
        if (!open) return undefined;

        drawerRef.current?.scrollIntoView({ block: 'nearest' });

        const closeOnEscape = (event) => {
            if (event.key !== 'Escape' || event.defaultPrevented || event.target.closest?.('input, select, textarea')) return;
            setOpen('');
        };
        const closeOnClickOutside = (event) => {
            if (!rowRef.current?.contains(event.target)) setOpen('');
        };

        document.addEventListener('keydown', closeOnEscape);
        document.addEventListener('click', closeOnClickOutside);
        return () => {
            document.removeEventListener('keydown', closeOnEscape);
            document.removeEventListener('click', closeOnClickOutside);
        };
    }, [open]);

    // processCount / touchCount = «cuántos procesos y toques tiene la mesa»
    const processCount = rotation.process?.length ?? 0;
    const touchCount = rotation.touch?.length ?? 0;

    // takeOut = «es un pedido para llevar», que no es una rotación (isTakeOut)
    // canAddTouches = «se le pueden apuntar toques»: el local tiene gerentes y no es un pedido para llevar
    const takeOut = isTakeOut(rotation);
    const canAddTouches = managers.length > 0 && !takeOut;

    // edit = «corregir un dato de la rotación»
    const edit = (field) => (value) => onEdit({ [field]: value }, rotation._id);

    // attention / cleaning = «las dos duraciones de la mesa», con si se pasaron de su límite
    const attention = rotation.hourFirstAttention ? getTimeReport(rotation.hourOccupies, rotation.hourFirstAttention, attentionLimit) : null;
    const cleaning = rotation.breakUp && rotation.tableCleaning ? getTimeReport(rotation.breakUp, rotation.tableCleaning, cleaningLimit) : null;

    // changeCount / lastChange = «cuántas correcciones tiene» y «la última», la que sale en «Edición»
    const changeCount = rotation.changes?.length ?? 0;
    const lastChange = rotation.changes?.at(-1);

    return (
        <div ref={rowRef} className={`register-saved-row ${open ? 'register-saved-row--open' : ''}`} style={SAVED_GRID}>

            <div className='register-saved-cell font-mono tabular-nums' title='Hora en que se guardó'>
                {rotation.createdAt ? clock(rotation.createdAt) : '-'}
            </div>

            {/*  Mesa, Ocupa, 1ra Atención, Desocupa y Limpieza, cada una con el color de su columna. La mesa en
                 negrita y se corrige escribiéndola; las horas, con doble clic (WrapperText). La primera
                 atención en rojo si pasó del límite. En un pedido para llevar, las horas van tachadas.
                 El color va en 'backgroundColor' y no en 'background', que borraría la raya del tachado.  */}
            {
                SAVED_COLUMNS.map(column => (
                    takeOut && column.id !== 'tableNumber'
                        ? <div key={column.id} className='register-saved-cell register-cell--na' style={{ backgroundColor: cellTint(column) }} title='Pedido para llevar: no lleva esta hora' />
                        : (
                            <div
                                key={column.id}
                                className={`register-saved-cell register-saved-cell--edit ${column.id === 'tableNumber' ? 'text-[14px] font-bold' : ''} ${column.id === 'hourFirstAttention' && attention?.exceeded ? 'text-jx-critico-texto font-bold' : ''}`}
                                style={{ backgroundColor: cellTint(column) }}
                                title={column.id === 'tableNumber' ? 'Clic para corregir la mesa' : 'Doble clic para corregir la hora'}
                            >
                                {
                                    column.id === 'tableNumber'
                                        ? <SavedTextInput value={rotation.tableNumber} onCommit={edit('tableNumber')} label='Número de mesa' required />
                                        : <WrapperText value={rotation[column.id]} updateValue={edit(column.id)} />
                                }
                            </div>
                        )
                ))
            }

            {
                takeOut ? (
                    <>
                        <div className='register-saved-cell register-saved-cell--cycle register-cell--na' title='Pedido para llevar: no lleva primera atención' />
                        <div className='register-saved-cell register-saved-cell--cycle register-cell--na' title='Pedido para llevar: no lleva limpieza' />
                    </>
                ) : (
                    <>
                        {/*  Tiempo de 1ra atención: de Ocupa a Primera atención  */}
                        <div className='register-saved-cell register-saved-cell--cycle'>
                            <span className={`register-saved-chip ${attention?.exceeded ? 'register-saved-chip--late' : 'register-saved-chip--attention'}`}>
                                {attention ? attention.timeTotal : '-'}
                            </span>
                        </div>

                        {/*  Tiempo de limpieza: de Desocupa a Limpieza. Si al guardarla la mesa no se había desocupado, se dice.  */}
                        <div className='register-saved-cell register-saved-cell--cycle'>
                            {
                                !rotation.breakUp
                                    ? <span className='register-saved-chip register-saved-chip--open' title='La mesa no se había desocupado cuando se guardó'>Sin desocupar</span>
                                    : <span className={`register-saved-chip ${cleaning?.exceeded ? 'register-saved-chip--late' : 'register-saved-chip--cleaning'}`}>{cleaning ? cleaning.timeTotal : '-'}</span>
                            }
                        </div>
                    </>
                )
            }

            {/*  Procesos TP (Toast POS) y toques: cada cápsula despliega su lista, una a la vez. Un pedido para
                 llevar no lleva toques: va tachado, y solo si ya tenía alguno queda su cápsula.  */}
            <div className='register-saved-cell register-saved-cell--cycle'>
                <RegisterSavedToggle className='register-saved-chip--process' count={processCount} word='proceso' open={open === 'procesos'} onToggle={() => toggle('procesos')} />
            </div>
            <div className={`register-saved-cell register-saved-cell--cycle ${takeOut ? 'register-cell--na' : ''}`} title={takeOut ? 'Pedido para llevar: no lleva toques de gerente' : undefined}>
                {
                    (!takeOut || touchCount > 0)
                    && <RegisterSavedToggle className='register-saved-chip--touches' count={touchCount} word='toque' open={open === 'toques'} onToggle={() => toggle('toques')} openEmpty={canAddTouches} />
                }
            </div>

            {/*  Creador y Edición, con su foto. La persona de Edición despliega todos los cambios.  */}
            <div className='register-saved-cell register-saved-cell--cycle register-saved-cell--person' title={fullName(rotation.createdBy)}>
                {rotation.createdBy ? <SavedPerson user={rotation.createdBy} /> : '-'}
            </div>
            <div className='register-saved-cell register-saved-cell--cycle register-saved-cell--person'>
                {
                    lastChange
                        ? (
                            <button
                                type='button'
                                className='register-saved-person-toggle'
                                onClick={() => toggle('cambios')}
                                aria-expanded={open === 'cambios'}
                                title={`${changeCount} ${changeCount === 1 ? 'cambio' : 'cambios'} · el último, de ${fullName(lastChange.user) || 'alguien sin nombre'} a las ${clock(lastChange.changedAt)}`}
                            >
                                <SavedPerson user={lastChange.user} />
                                <Chevron open={open === 'cambios'} />
                            </button>
                        )
                        : <span title='Nadie la ha corregido'>-</span>
                }
            </div>

            {
                open && (
                    <div ref={drawerRef} className='register-saved-drawer' style={DRAWER_AREA}>
                        {open === 'procesos' && <RegisterSavedProcesses processes={rotation.process} onEdit={onEdit} />}
                        {
                            open === 'toques' && (
                                <RegisterSavedTouches
                                    touches={rotation.touch ?? []}
                                    managers={managers}
                                    onEdit={onEdit}
                                    onAdd={canAddTouches ? (manager) => onAddTouch?.(rotation._id, manager) : undefined}
                                    onDelete={onDeleteTouch}
                                />
                            )
                        }
                        {open === 'cambios' && <RegisterSavedChanges rotation={rotation} />}
                    </div>
                )
            }
        </div>
    );
}
