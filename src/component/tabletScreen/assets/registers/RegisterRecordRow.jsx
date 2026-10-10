import { memo, useState, useEffect, useMemo, useRef } from 'react';
import { WrapperCell, WrapperText } from '../../../cells/GridCells.jsx';
import { getTimeReport } from '../../../../libs/date_time/calculate_time.js';
import { worstAlarm } from './alarm.js';
import ProcessToggle from './ProcessToggle.jsx';
import AddProcessButton from './AddProcessButton.jsx';
import ManagerButtons from './ManagerButtons.jsx';
import ReportDelayButton from './ReportDelayButton.jsx';
import RegisterProcessList from './RegisterProcessList.jsx';
import RegisterTouchList from './RegisterTouchList.jsx';
import { TOUCH_TOGGLE_SPACE } from './columns.js';


/*  UNA ROTACIÓN DEL REGISTER: una mesa, desde que se ocupa hasta que se limpia
 *
 *      + │ ▸2 Mesa │ Ocupa │ Primera atención │ Duración │ Desocupa │ Limpieza │ Duración │ G1 G2 A1 ▸3
 *
 *  Cada botón de gerente apunta un toque, con la hora del clic, en 'touch' de la rotación; su flecha, a
 *  la derecha, despliega debajo la lista de toques (RegisterTouchList).
 *
 *  La flecha, dentro de la celda de la mesa, despliega debajo los procesos de la rotación —sus pedidos, con sus cuatro horas cada uno
 *  (RegisterProcessList)— y dice cuántos son. Empiezan cerrados, y se despliegan solos cuando la IA
 *  mete en la rotación un proceso nuevo (ver 'seenKeysRef').
 *
 *  UN PROCESO SIEMPRE VA DENTRO DE UNA ROTACIÓN, nunca suelto:
 *      · los que lee la IA entran solos, cada pedido en la rotación de su número de mesa;
 *      · los de a mano, con el «+» de la fila: van a ESA rotación. Si la fila todavía no tiene mesa, el
 *        «+» no crea nada: lleva el cursor a «Mesa» y pide el número, porque un proceso sin mesa no
 *        sabría de qué rotación es.
 *
 *  LA FILA NO GUARDA NADA. La rotación llega entera en 'record' (libs/tickets/tableRecords.js) y todo
 *  lo que se escribe se pide al registro con writeRecord / writeProcess / addProcess. Lo único suyo es
 *  si está desplegada o no.
 */


// FRESH_MS = «cuánto dura nueva una rotación»: la que abre la IA monta su fila en el acto, y una que vuelve
// de lo guardado al recargar ya tiene una fecha de antes. Ver 'seenKeysRef'.
const FRESH_MS = 5000;


/*  @param {object}   record          la rotación: { id, tableNumber, hourOccupies, hourFirstAttention, process, breakUp, tableCleaning }
 *  @param {Map}      liveByKey       lo que dice ahora mismo el seguimiento de cada pedido, por su key
 *  @param {string}   attentionLimit  el límite de primera atención del local, 'HH:MM:SS'
 *  @param {string}   cleaningLimit   el límite de limpieza del local, 'HH:MM:SS'
 *  @param {function} writeRecord     anota (id de la rotación, campo, valor)
 *  @param {function} writeProcess    anota (id de la rotación, id del proceso, campo, valor)
 *  @param {function} addProcess      añade un proceso en blanco a la rotación (id)
 *  @param {function} deleteProcess   borra un proceso (id de la rotación, id del proceso)
 *  @param {function} addTouch        apunta un toque de gerente (id de la rotación, gerente)
 *  @param {function} writeTouch      corrige la hora de un toque (id de la rotación, id del toque, hora)
 *  @param {function} deleteTouch     borra un toque (id de la rotación, id del toque)
 *  @param {function} onReportDelay   qué hacer cuando se pide reportar una demora
 *  @param {object}   grid            la rejilla de la fila (tableGrid): la misma que la de la cabecera
 *  @param {Array}    managers        los botones de los gerentes del local (managers.js)
 *  @param {number}   widthOfManagers lo que mide su columna, para que los procesos la dejen libre
 */
function RegisterRecordRow({ record, liveByKey, attentionLimit, cleaningLimit, writeRecord, writeProcess, addProcess, deleteProcess, addTouch, writeTouch, deleteTouch, onReportDelay, grid, managers, widthOfManagers }) {

    // open = «los procesos están desplegados»
    const [open, setOpen] = useState(false);

    // touchesOpen = «los toques de gerente están desplegados»
    const [touchesOpen, setTouchesOpen] = useState(false);


    /*  SE DESPLIEGA SOLA CUANDO LA IA LE METE UN PROCESO
     *
     *  Si llega a esta rotación un pedido de la tablet que la fila no conocía, la lista se abre para que
     *  se vea. Lo que ya conocía no la abre: si alguien la cerró, sigue cerrada hasta el próximo proceso
     *  nuevo. Los procesos a mano tampoco: esos los abre el «+».
     *
     *  Al montarse la fila no hay nada con qué comparar, y ahí se mira la fecha: la rotación que abre la
     *  IA llega ya con su primer proceso y recién creada, y se abre; la que vuelve de lo guardado al
     *  recargar es de antes, y se queda cerrada.
     */

    // tabletKeys = «los pedidos de la tablet que tiene la rotación», en una sola cadena para compararlos
    const tabletKeys = record.process.map(process => process.key).filter(Boolean).join('|');

    // seenKeysRef = «los pedidos de la tablet que la fila ya conocía». null = se acaba de montar.
    const seenKeysRef = useRef(null);

    useEffect(() => {
        const seen = seenKeysRef.current;
        const keys = tabletKeys === '' ? [] : tabletKeys.split('|');
        seenKeysRef.current = new Set(keys);

        if (seen === null) {
            const fresh = record.date && Date.now() - new Date(record.date).getTime() < FRESH_MS;
            if (keys.length > 0 && fresh) setOpen(true);
            return;
        }

        if (keys.some(key => !seen.has(key))) setOpen(true);
    }, [tabletKeys, record.date]);

    // tableInputRef = «el campo de la mesa», para llevar ahí el cursor cuando falta
    const tableInputRef = useRef(null);

    // noTable = «la rotación todavía no tiene número de mesa»
    const noTable = String(record.tableNumber ?? '').trim() === '';

    // write = «anotar un dato de esta rotación»
    const write = (field) => (value) => writeRecord(record.id, field, value);


    //  Aviso de la propia fila, no un alert() del sistema: en la aplicación de escritorio un alert es un
    //  diálogo nativo que CONGELA la ventana entera, incluido el espejo de la tablet.
    const [notice, setNotice] = useState('');

    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(''), 2500);
        return () => clearTimeout(timer);
    }, [notice]);


    // askingTable = «se está pidiendo el número de mesa»: se pulsó el «+» en una fila sin mesa.
    // La celda «Mesa» se marca unos segundos, o hasta que se escriba en ella.
    const [askingTable, setAskingTable] = useState(false);

    useEffect(() => {
        if (!askingTable) return;
        const timer = setTimeout(() => setAskingTable(false), 4000);
        return () => clearTimeout(timer);
    }, [askingTable]);


    // addOne = «añadir un proceso a esta rotación y desplegarla para anotarlo»
    // Sin mesa no: el cursor va a «Mesa» y se pide el número.
    const addOne = () => {
        if (noTable) {
            tableInputRef.current?.focus();
            return setAskingTable(true);
        }

        addProcess(record.id);
        setOpen(true);
    };

    // touchOne = «apuntar un toque de un gerente en esta rotación». Como el «+», sin mesa no: pide el número.
    const touchOne = (manager) => {
        if (noTable) {
            tableInputRef.current?.focus();
            return setAskingTable(true);
        }

        addTouch(record.id, manager);
    };

    // alarm = «la peor alarma de sus procesos», para la cuenta de la flecha cuando está cerrada
    const alarm = worstAlarm(record.process.map(process => (process.key ? liveByKey.get(process.key)?.color ?? '' : '')));


    // attention = «la duración de la primera atención»: lo que pasa entre que se ocupa la mesa y se la atiende
    const attention = useMemo(
        () => getTimeReport(record.hourOccupies, record.hourFirstAttention, attentionLimit),
        [record.hourOccupies, record.hourFirstAttention, attentionLimit]
    );

    //  Mientras falte cualquiera de las dos horas no hay nada que calcular, y la celda va en gris. Con
    //  una sola hora se pintaba el resultado ilegible en verde, como si todo fuera bien.
    // noAttentionYet = «todavía no hay duración que calcular»
    const noAttentionYet = record.hourOccupies === '' || record.hourFirstAttention === '';


    //  La duración de la limpieza se calcula igual, pero contra SU propio límite: lo que pasa entre que
    //  la mesa queda libre y que alguien la deja lista.
    const cleaning = useMemo(
        () => getTimeReport(record.breakUp, record.tableCleaning, cleaningLimit),
        [record.breakUp, record.tableCleaning, cleaningLimit]
    );

    const noCleaningYet = record.breakUp === '' || record.tableCleaning === '';


    // askForReport = «pedir el reporte de la demora»
    const askForReport = () => {
        if (record.tableNumber === '') return setNotice('Indica el número de mesa');

        //  Los nombres de este objeto son los que espera el formulario de demoras.
        const delivered = onReportDelay?.({
            tableNumber: record.tableNumber,
            customerSeatedTime: record.hourOccupies,
            firtAtenttionTime: record.hourFirstAttention,
            demora: attention.timeTotal,
        });

        //  Si no llegó, hay que decirlo: un botón que no hace nada y tampoco avisa es peor que uno que no
        //  está, porque quien lo pulsa se queda creyendo que reportó.
        if (delivered === false) setNotice('Esta versión de la aplicación todavía no puede reportar');

        //  Quien recibe el reporte puede negarse y decir por qué, con un texto.
        if (typeof delivered === 'string') setNotice(delivered);
    };


    //  Las clases 'register-rotation…' son los nombres con que se la encuentra en las herramientas del
    //  navegador y en las pruebas, y con los que registers.css pinta la rotación desplegada.
    //  La fila no lleva fondo propio: debajo están los colores de las columnas (columnStripes), y al pasar
    //  el ratón solo se oscurece un poco, sin taparlos.
    return (
        <div className={`register-rotation ${open ? 'register-rotation--open' : ''}`}>

            {/*  'relative': los toques de gerente flotan justo debajo de esta fila (RegisterTouchList)  */}
            <div className='register-rotation__row relative w-full transition-colors hover:bg-jx-tinta/5' style={grid}>

                {/*  El «+»: un proceso a mano, que entra en el array 'process' de ESTA rotación. En una
                     fila sin mesa sale tenue y, al pulsarlo, pide el número (ver 'addOne').  */}
                <WrapperCell classStyles='cursor-default'>
                    <AddProcessButton table={record.tableNumber} waiting={noTable} onAdd={addOne} />
                </WrapperCell>

                {/*  LA MESA, con la flecha de sus procesos pegada a la izquierda (sin procesos no hay flecha).
                     La flecha flota encima ('absolute') para que el número quede centrado igual en todas las
                     filas, la tengan o no. Solo si la celda es tan estrecha que la flecha (unos 40 px) taparía
                     el número (unas 3 cifras, 3ch), el número se aparta lo justo: el relleno sale de que el
                     texto centrado empiece a partir de esos 40 px, y en celdas anchas da 0.
                     En ocre y con «Nº de mesa» mientras se pide el número (ver 'askingTable'). Desplegada,
                     la mesa va más gruesa: es la cabeza de su grupo.  */}
                <WrapperCell classStyles={`relative ${open ? 'font-extrabold' : 'font-semibold'} ${askingTable && noTable ? 'bg-jx-ocre-suave' : ''}`}>
                    <span className='absolute left-1 top-1/2 -translate-y-1/2'>
                        <ProcessToggle
                            count={record.process.length}
                            open={open}
                            alarm={alarm}
                            onToggle={() => setOpen(current => !current)}
                        />
                    </span>
                    <input
                        ref={tableInputRef}
                        className='w-full h-full text-center bg-transparent placeholder:text-jx-ocre-texto placeholder:font-normal'
                        style={record.process.length > 0 ? { paddingLeft: 'max(0px, calc(80px + 3ch - 100%))' } : undefined}
                        type='text'
                        value={record.tableNumber}
                        onChange={event => write('tableNumber')(event.target.value)}
                        placeholder={askingTable && noTable ? 'Nº de mesa' : ''}
                        title={askingTable && noTable ? 'Escribe primero el número de mesa: el proceso va dentro de la rotación de esa mesa' : undefined}
                        aria-label='Número de mesa'
                    />
                </WrapperCell>

                <WrapperCell classStyles='text-jx-tinta'>
                    <WrapperText value={record.hourOccupies} updateValue={write('hourOccupies')} />
                </WrapperCell>

                <WrapperCell classStyles='text-jx-tinta'>
                    <WrapperText value={record.hourFirstAttention} updateValue={write('hourFirstAttention')} />
                </WrapperCell>

                {/*  DURACIÓN de la primera atención. Es un valor calculado, así que no se toca: va sin
                     'updateValue'. El botón de reportar aparece cuando pasa del límite del local.  */}
                <WrapperCell classStyles='gap-1.5 px-1'>
                    <WrapperText
                        classStyles={noAttentionYet ? 'text-jx-tinta3' : attention.exceeded ? 'text-jx-critico-texto font-bold' : 'text-jx-verde-texto'}
                        value={noAttentionYet ? '00:00:00' : attention.timeTotal}
                    />

                    {attention.exceeded && <ReportDelayButton table={record.tableNumber} onReport={askForReport} />}

                    {
                        notice && (
                            <span
                                className='min-w-0 truncate rounded font-bold text-jx-tinta bg-jx-ocre'
                                style={{ padding: '2px 6px', fontSize: '9px' }}
                                title={notice}
                            >
                                {notice}
                            </span>
                        )
                    }
                </WrapperCell>

                <WrapperCell classStyles='text-jx-tinta'>
                    <WrapperText value={record.breakUp} updateValue={write('breakUp')} />
                </WrapperCell>

                <WrapperCell classStyles='text-jx-tinta'>
                    <WrapperText value={record.tableCleaning} updateValue={write('tableCleaning')} />
                </WrapperCell>

                {/*  Y la DURACIÓN de la limpieza. También calculada: sin 'updateValue'.  */}
                <WrapperCell>
                    <WrapperText
                        classStyles={noCleaningYet ? 'text-jx-tinta3' : cleaning.exceeded ? 'text-jx-critico-texto font-bold' : 'text-jx-verde-texto'}
                        value={noCleaningYet ? '00:00:00' : cleaning.timeTotal}
                    />
                </WrapperCell>

                {/*  Un botón por cada gerente del local, y a la derecha la flecha de sus toques (sin toques no
                     hay flecha). La flecha flota ('absolute') en un hueco reservado, para que los botones no se
                     muevan cuando aparece. Sin gerentes, no hay columna.  */}
                {
                    managers.length > 0 && (
                        <WrapperCell classStyles='relative cursor-default gap-1' estilo={{ paddingRight: TOUCH_TOGGLE_SPACE }}>
                            <ManagerButtons managers={managers} onTouch={touchOne} />
                            <span className='absolute right-1 top-1/2 -translate-y-1/2'>
                                <ProcessToggle
                                    noun='toque'
                                    count={record.touch.length}
                                    open={touchesOpen}
                                    onToggle={() => setTouchesOpen(current => !current)}
                                />
                            </span>
                        </WrapperCell>
                    )
                }

                {/*  Los toques de gerente: flotan encima de las filas de abajo, sin empujarlas  */}
                {
                    touchesOpen && record.touch.length > 0 && (
                        <RegisterTouchList
                            touches={record.touch}
                            widthOfManagers={widthOfManagers}
                            onWrite={(touchId, hourTouch) => writeTouch(record.id, touchId, hourTouch)}
                            onDelete={(touchId) => deleteTouch(record.id, touchId)}
                        />
                    )
                }

            </div>

            {/*  Los procesos, desplegados debajo  */}
            {
                open && record.process.length > 0 && (
                    <RegisterProcessList record={record} liveByKey={liveByKey} writeProcess={writeProcess} deleteProcess={deleteProcess} widthOfManagers={widthOfManagers} />
                )
            }

        </div>
    );
}


/*  'memo': cada rotación solo se repinta cuando cambia alguna de sus props. Al anotar en una, las demás
 *  siguen siendo el MISMO objeto (tableRecords.js no cambia nada en su sitio) y se saltan. Por eso las
 *  funciones que recibe tienen que ser estables (useCallback en useRegisterStore y en la sesión): una
 *  función nueva en cada pintado dejaría el 'memo' sin efecto.
 */
export default memo(RegisterRecordRow);
