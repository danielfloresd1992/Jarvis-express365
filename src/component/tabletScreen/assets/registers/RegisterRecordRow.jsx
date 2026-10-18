import { memo, useState, useEffect, useMemo, useRef } from 'react';
import { WrapperCell, WrapperText } from '../../../cells/GridCells.jsx';
import { getTimeReport } from '../../../../libs/date_time/calculate_time.js';
import { exceedsLimit } from '../../../../libs/date_time/timeLimit.js';
import { worstAlarm } from './alarm.js';
import ProcessToggle from './ProcessToggle.jsx';
import AddProcessButton from './AddProcessButton.jsx';
import ManagerButtons from './ManagerButtons.jsx';
import ReportDelayButton from './ReportDelayButton.jsx';
import ReportedFlag from './ReportedFlag.jsx';
import RegisterProcessList from './RegisterProcessList.jsx';
import RegisterTouchList from './RegisterTouchList.jsx';
import TouchToggle from './TouchToggle.jsx';
import SaveRecordButton from './SaveRecordButton.jsx';
import { saveRotation } from '../../../../libs/fetch_data/rotationFetching.js';


/*  UNA ROTACIÓN DEL REGISTER: una mesa, desde que se ocupa hasta que se limpia
 *
 *      + │ ▸2 Mesa │ Ocupa │ Primera atención │ Duración │ Desocupa │ Limpieza │ Duración │ G1 G2 A1 │ 3 toques
 *
 *  Cada botón de gerente apunta un toque, con la hora del clic, en 'touch' de la rotación; el contador
 *  de la derecha (TouchToggle) abre la lista de toques, que flota debajo (RegisterTouchList).
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
 *  lo que se escribe se pide al registro con writeRecord / writeProcess / addProcess. Ni siquiera si sus
 *  listas están desplegadas: eso también va en la rotación ('processesOpen', 'touchesOpen') y se pide con
 *  writeListOpen, para que al cerrar la app y volver a abrirla cada fila siga como se dejó.
 */


// FRESH_MS = «cuánto dura nueva una rotación»: la que abre la IA monta su fila en el acto, y una que vuelve
// de lo guardado al recargar ya tiene una fecha de antes. Ver 'seenKeysRef'.
const FRESH_MS = 5000;

// originText = «de dónde salió un tiempo de referencia, en palabras», para el aviso de la celda en rojo: así se ve
// por qué una demora cuenta con ese tiempo (useTabletSession: attentionOrigin y cleaningOrigin)
const originText = (origin, field) => (
    origin === 'local' ? `configurado en el local (${field})`
        : origin === 'fijo' ? 'fijado por la ventana que monta el register'
            : `de la lista de nombres (limitesDelLocal.js), porque el local no tiene ${field} configurado o no llegó`
);


/*  UNA CELDA QUE EL PEDIDO PARA LLEVAR NO LLEVA
 *
 *  Una rotación para llevar (record.takeOut: su mesa es un '#ticket') es hueca: solo contiene el proceso
 *  del pedido. Sus horas de mesa, sus duraciones y los toques de gerente no existen, y en su lugar va una
 *  raya roja (registers.css, 'register-cell--na'), sin dato y sin clic: un «-» diría «todavía no pasó».
 *  'children' es lo que tiene que seguir viéndose encima, como el aviso de la fila.
 */
function NotApplicableCell({ title = 'Pedido para llevar: no lleva esta hora', classStyles = '', children }) {
    return (
        <WrapperCell classStyles={`register-cell--na cursor-default gap-1.5 px-1 ${classStyles}`} titulo={title}>
            {children}
        </WrapperCell>
    );
}


/*  @param {object}   record          la rotación: { id, tableNumber, hourOccupies, hourFirstAttention, process, breakUp, tableCleaning }
 *  @param {Map}      liveByKey       lo que dice ahora mismo el seguimiento de cada pedido, por su key
 *  @param {string}   attentionLimit  el límite de primera atención del local, 'HH:MM:SS'
 *  @param {string}   cleaningLimit   el límite de limpieza del local, 'HH:MM:SS'
 *  @param {string}   attentionOrigin de dónde salió el de primera atención: 'local', 'lista' o 'fijo' (useTabletSession)
 *  @param {string}   cleaningOrigin  de dónde salió el de limpieza: 'local' o 'lista'
 *  @param {function} writeRecord     anota (id de la rotación, campo, valor)
 *  @param {function} writeProcess    anota (id de la rotación, id del proceso, campo, valor)
 *  @param {function} writeListOpen   despliega o pliega una lista (id de la rotación, 'processesOpen' | 'touchesOpen', boolean)
 *  @param {function} addProcess     añade un proceso en blanco a la rotación (id)
 *  @param {function} deleteProcess   borra un proceso (id de la rotación, id del proceso)
 *  @param {function} clearRecord     deja la rotación en blanco (id de la rotación), ya guardada en la API
 *  @param {function} addTouch        apunta un toque de gerente (id de la rotación, gerente)
 *  @param {function} writeTouch      corrige una hora de un toque (id de la rotación, id del toque, 'hourTouch' o 'hourTouchFinish', hora)
 *  @param {function} deleteTouch     borra un toque (id de la rotación, id del toque)
 *  @param {function} onReportDelay   qué hacer cuando se pide reportar una demora
 *  @param {object}   grid            la rejilla de la fila (tableGrid): la misma que la de la cabecera
 *  @param {Array}    managers        los botones de los gerentes del local (managers.js)
 *  @param {number}   widthOfManagers lo que mide su columna, para que los procesos la dejen libre
 *  @param {string}   establishmentId el _id del local: a cuál se guarda la rotación (el disquete)
 *  @param {function} onSaved         opcional. La API guardó la rotación: (la rotación guardada)
 */
function RegisterRecordRow({ record, liveByKey, attentionLimit, cleaningLimit, attentionOrigin, cleaningOrigin, writeRecord, writeProcess, writeListOpen, addProcess, deleteProcess, clearRecord, addTouch, writeTouch, deleteTouch, onReportDelay, grid, managers, widthOfManagers, establishmentId, onSaved }) {

    // open = «los procesos están desplegados»; touchesOpen = «los toques de gerente están desplegados».
    // Salen de la rotación y no de un estado de la fila: así se guardan en el equipo con ella.
    const open = record.processesOpen === true;
    const touchesOpen = record.touchesOpen === true;

    // setOpen / setTouchesOpen = «desplegar o plegar» cada lista, en la rotación (writeListOpen)
    const setOpen = (value) => writeListOpen(record.id, 'processesOpen', value);
    const setTouchesOpen = (value) => writeListOpen(record.id, 'touchesOpen', value);


    /*  SE DESPLIEGA SOLA CUANDO LA IA LE METE UN PROCESO
     *
     *  Si llega a esta rotación un pedido de la tablet que la fila no conocía, la lista se abre para que
     *  se vea. Lo que ya conocía no la abre: si alguien la cerró, sigue cerrada hasta el próximo proceso
     *  nuevo. Los procesos a mano tampoco: esos los abre el «+».
     *
     *  Al montarse la fila no hay nada con qué comparar, y ahí se mira la fecha: la rotación que abre la
     *  IA llega ya con su primer proceso y recién creada, y se abre; la que vuelve de lo guardado al
     *  recargar es de antes, y se queda como se dejó ('processesOpen').
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

    // takeOut = «es un pedido para llevar»: su mesa es un '#ticket' y no lleva horas de mesa ni toques
    const takeOut = record.takeOut === true;

    //  Al escribir '#14' en la mesa se crea solo el proceso de ese ticket (withTicketProcess, en
    //  tableRecords.js), y la lista se abre para verlo. Solo cuando aparece, no al montarse la fila: lo que
    //  vuelve de lo guardado se queda como se dejó.
    // processCountRef = «cuántos procesos tenía la fila»
    const processCountRef = useRef(record.process.length);
    useEffect(() => {
        if (takeOut && record.process.length > processCountRef.current) setOpen(true);
        processCountRef.current = record.process.length;
    }, [takeOut, record.process.length]);

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

    // saving = «se está guardando esta rotación»: el disquete se desactiva hasta que conteste la API
    const [saving, setSaving] = useState(false);

    // clearRow = «limpiar la fila entera»: la rotación queda en blanco en su sitio, con un id nuevo.
    // Se llama cuando la API confirma que la guardó; con un error la fila se queda como estaba.
    const clearRow = () => clearRecord(record.id);

    // saveOne = «guardar esta rotación», el disquete. Primero valida: sin número de mesa o sin la hora
    // de Ocupa no se guarda, y se dice qué falta. Si es la mesa, el cursor va a su celda, como con el «+».
    // Un pedido para llevar no tiene Ocupa, así que a ese solo se le pide la mesa (su '#ticket').
    // Luego la manda a la API (saveRotation): si la guardó, la fila se limpia (clearRow); si no, el
    // aviso de la fila dice por qué.
    const saveOne = () => {

        // missing = «lo que falta para poder guardar»
        const missing = [
            noTable && 'el número de mesa',
            !takeOut && String(record.hourOccupies ?? '').trim() === '' && 'la hora de Ocupa',
        ].filter(Boolean);

        if (missing.length > 0) {
            if (noTable) {
                tableInputRef.current?.focus();
                setAskingTable(true);
            }
            return setNotice(`Falta ${missing.join(' y ')}`);
        }

        if (!establishmentId) return setNotice('Elige primero el local');
        if (saving) return;

        setSaving(true);

        //  La rotación entera, con su local y su id como `clientId` (la API reconoce así la misma
        //  rotación). Sin lista de campos: lo que crezca el ciclo viaja solo.
        //  Lo que devuelve la API entra en la lista de Registros ANTES de limpiar la fila: así, si la IA
        //  vuelve a leer alguno de sus tickets, ya consta como guardado y se pregunta (ver Registers).
        saveRotation({ ...record, establishment: establishmentId, clientId: record.id })
            .then(savedRotation => {
                onSaved?.(savedRotation);
                clearRow();
            })
            .catch(error => setNotice(error.message))
            .finally(() => setSaving(false));
    };

    // alarm = «la peor alarma de sus procesos», para la cuenta de la flecha cuando está cerrada
    const alarm = worstAlarm(record.process.map(process => (process.key ? liveByKey.get(process.key)?.color ?? '' : '')));


    // attention = «la duración de la primera atención»: lo que pasa entre que se ocupa la mesa y se la atiende
    const attention = useMemo(
        () => getTimeReport(record.hourOccupies, record.hourFirstAttention, attentionLimit),
        [record.hourOccupies, record.hourFirstAttention, attentionLimit]
    );

    //  Mientras falte cualquiera de las dos horas no hay nada que calcular, y la celda dice «—» en gris (no
    //  '00:00:00', que parecía una duración de verdad). Con una sola hora se pintaba el resultado ilegible en
    //  verde, como si todo fuera bien.
    // noAttentionYet = «todavía no hay duración que calcular»
    const noAttentionYet = record.hourOccupies === '' || record.hourFirstAttention === '';


    //  La duración de la limpieza se calcula igual, pero contra SU propio límite: lo que pasa entre que
    //  la mesa queda libre y que alguien la deja lista.
    const cleaning = useMemo(
        () => getTimeReport(record.breakUp, record.tableCleaning, cleaningLimit),
        [record.breakUp, record.tableCleaning, cleaningLimit]
    );

    const noCleaningYet = record.breakUp === '' || record.tableCleaning === '';

    // attentionLate / cleaningLate = «la duración pasó del tiempo de referencia del local» (exceedsLimit): de
    // firstAtenttion la primera atención y de TableCleaning la limpieza (ver limitesDelLocal). Su celda va en rojo.
    const attentionLate = !noAttentionYet && exceedsLimit(attention.timeTotal, attentionLimit);
    const cleaningLate = !noCleaningYet && exceedsLimit(cleaning.timeTotal, cleaningLimit);

    // attentionReported / cleaningReported = «su demora ya se reportó»: la fila tiene apuntada la novedad que se envió
    // desde el botón de reportar (firstAttentionDelay / cleaningDelay, ver reportedDelay.js). En lugar del botón va la
    // bandera de «Reportada» (ReportedFlag).
    const attentionReported = Boolean(record.firstAttentionDelay);
    const cleaningReported = Boolean(record.cleaningDelay);

    // durationLook = «cómo va la celda de una duración» (propuesta «C», elegida por el usuario; registers.css):
    //   reportada              rojo claro y texto negro, quieta
    //   pasada, sin reportar   rojo claro, con el marco rojo que late hasta que se reporte
    //   en tiempo              como siempre
    const durationLook = (late, reported) => (reported ? 'register-cell--reported' : late ? 'register-cell--late register-cell--alert' : '');

    // durationText = «el color del texto de una duración»: gris sin calcular, negro reportada, rojo pasada, verde en tiempo
    const durationText = (empty, late, reported) => (empty ? 'text-jx-tinta3' : reported ? 'text-jx-tinta font-bold' : late ? 'text-jx-critico-texto font-bold' : 'text-jx-verde-texto');


    // askForReport = «pedir el reporte de una demora»: 'primera atención' (de Ocupa a Primera atención) o 'limpieza'
    // (de Desocupa a Limpieza). Lo pide el reloj rojo de su duración, y se abre «Demoras» en su formulario con la
    // mesa y las dos horas ya puestas (DelayComponent → Div_first_attention o DivClear, con datosIniciales).
    const askForReport = (tipo) => {
        if (record.tableNumber === '') return setNotice('Indica el número de mesa');

        //  Los nombres de cada objeto son los que espera su formulario de demoras. 'tipo' dice cuál; sin él, la
        //  ventana principal entiende primera atención (así llegaban antes de existir la limpieza).
        //  'limit' es el tiempo de referencia con que se marcó como demora: el formulario lo dice en su descripción.
        //  'recordId' es esta fila: al enviar la alerta, el ObjectId de la novedad vuelve a ella (reportedDelay.js).
        const delivered = onReportDelay?.(tipo === 'limpieza'
            ? { tipo, recordId: record.id, tableNumber: record.tableNumber, breakUpTime: record.breakUp, cleaningTime: record.tableCleaning, demora: cleaning.timeTotal, limit: cleaningLimit }
            : { tipo, recordId: record.id, tableNumber: record.tableNumber, customerSeatedTime: record.hourOccupies, firtAtenttionTime: record.hourFirstAttention, demora: attention.timeTotal, limit: attentionLimit });

        //  Si no llegó, hay que decirlo: un botón que no hace nada y tampoco avisa es peor que uno que no
        //  está, porque quien lo pulsa se queda creyendo que reportó.
        if (delivered === false) setNotice('Esta versión de la aplicación todavía no puede reportar');

        //  Quien recibe el reporte puede negarse y decir por qué, con un texto.
        if (typeof delivered === 'string') setNotice(delivered);
    };


    //  Las clases 'register-rotation…' son los nombres con que se la encuentra en las herramientas del
    //  navegador y en las pruebas, y con los que registers.css pinta la rotación desplegada.
    //  Una fila en uso no lleva fondo propio: debajo están los colores de las columnas (columnStripes), y
    //  al pasar el ratón solo se oscurece un poco, sin taparlos.
    //
    //  UNA FILA LIBRE VA EN GRIS ('register-rotation--free'): es una carcasa sin estrenar, todavía sin
    //  'date'. La fecha se le pone la primera vez que se usa —la IA le mete un pedido, o se escribe en
    //  cualquier celda (tableRecords.js)— y en ese momento se colorea.
    // free = «la fila está libre»: nadie la ha usado todavía
    const free = !record.date;

    // canTouchByHand = «se puede apuntar un toque a mano» desde la lista (RegisterTouchManual): con mesa, y sin ser
    // un pedido para llevar, que no lleva toques
    const canTouchByHand = !noTable && !takeOut;

    // finished = «la rotación ya terminó»: la mesa se limpió; un pedido para llevar, cuando se entregaron todos
    // sus platos. El disquete se pone en verde: es la que toca guardar (SaveRecordButton, 'done').
    const finished = takeOut
        ? record.process.length > 0 && record.process.every(process => process.dishDelivery !== '')
        : record.tableCleaning !== '';

    // noticeBadge = «el aviso de la fila», en la celda de la Duración de la primera atención: también cuando
    // esa celda va tachada, porque el aviso de guardar un pedido para llevar sale ahí
    const noticeBadge = notice && (
        <span
            className='min-w-0 truncate rounded font-bold text-jx-tinta bg-jx-ocre'
            style={{ padding: '2px 6px', fontSize: '9px' }}
            title={notice}
        >
            {notice}
        </span>
    );

    return (
        <div className={`register-rotation ${open ? 'register-rotation--open' : ''} ${free ? 'register-rotation--free' : ''}`}>

            {/*  'relative': los toques de gerente flotan justo debajo de esta fila (RegisterTouchList)  */}
            <div className='register-rotation__row relative w-full transition-colors hover:bg-jx-tinta/5' style={grid}>

                {/*  El «+»: un proceso a mano, que entra en el array 'process' de ESTA rotación. En una
                     fila sin mesa sale tenue y, al pulsarlo, pide el número (ver 'addOne').  */}
                {/*  'register-rail': el «+», Gerentes y el disquete llevan el mismo fondo en todas las filas  */}
                <WrapperCell classStyles='register-rail cursor-default'>
                    <AddProcessButton table={record.tableNumber} waiting={noTable} onAdd={addOne} />
                </WrapperCell>

                {/*  LA MESA, con la flecha de sus procesos pegada a la izquierda (sin procesos no hay flecha).
                     La flecha flota encima ('absolute') para que el número quede centrado igual en todas las
                     filas, la tengan o no. Solo si la celda es tan estrecha que la flecha (unos 40 px) taparía
                     el número (unas 3 cifras, 3ch), el número se aparta lo justo: el relleno sale de que el
                     texto centrado empiece a partir de esos 40 px, y en celdas anchas da 0.
                     En ocre y con «Nº de mesa» mientras se pide el número (ver 'askingTable').
                     El número va grande y grueso, y a la derecha el estado de la rotación: terminada o en
                     curso (la propuesta «A · Ordenada», elegida por el usuario; 'register-mesa-…' en registers.css).
                     Ese icono se aparta del número como la flecha, con el mismo cálculo.  */}
                <WrapperCell classStyles={`register-mesa-cell relative ${askingTable && noTable ? 'bg-jx-ocre-suave' : ''}`}>
                    <span className='absolute left-1 top-1/2 -translate-y-1/2'>
                        <ProcessToggle
                            count={record.process.length}
                            open={open}
                            alarm={alarm}
                            onToggle={() => setOpen(!open)}
                        />
                    </span>
                    <input
                        ref={tableInputRef}
                        className='register-mesa-input w-full h-full text-center bg-transparent placeholder:text-jx-ocre-texto placeholder:font-normal'
                        style={{
                            paddingLeft: record.process.length > 0 ? 'max(0px, calc(80px + 3ch - 100%))' : undefined,
                            paddingRight: free ? undefined : 'max(0px, calc(44px + 3ch - 100%))',
                        }}
                        type='text'
                        value={record.tableNumber}
                        onChange={event => write('tableNumber')(event.target.value)}
                        placeholder={askingTable && noTable ? 'Nº de mesa' : ''}
                        title={askingTable && noTable ? 'Escribe primero el número de mesa: el proceso va dentro de la rotación de esa mesa' : undefined}
                        aria-label='Número de mesa'
                    />
                    {
                        !free && (
                            <span
                                className={`register-mesa-status register-mesa-status--${finished ? 'done' : 'open'}`}
                                role='img'
                                aria-label={finished ? 'Terminada' : 'En curso'}
                                title={finished ? (takeOut ? 'Terminada: se entregaron sus platos' : 'Terminada: la mesa ya se limpió') : 'En curso'}
                            >
                                {
                                    finished ? (
                                        <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                                            <path d='M5 12l5 5 9-10' />
                                        </svg>
                                    ) : (
                                        <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.6' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                                            <circle cx='12' cy='12' r='9' />
                                            <path d='M12 7v5l3 2' />
                                        </svg>
                                    )
                                }
                            </span>
                        )
                    }
                </WrapperCell>

                {/*  UN PEDIDO PARA LLEVAR no lleva ninguna de las seis celdas de la mesa: van tachadas
                     (NotApplicableCell), y la de la Duración conserva el aviso de la fila.  */}
                {
                    takeOut ? (
                        <>
                            <NotApplicableCell />
                            <NotApplicableCell />
                            <NotApplicableCell title='Pedido para llevar: no lleva primera atención'>{noticeBadge}</NotApplicableCell>
                            <NotApplicableCell />
                            <NotApplicableCell />
                            <NotApplicableCell title='Pedido para llevar: no lleva limpieza' />
                        </>
                    ) : (
                        <>
                            <WrapperCell classStyles='text-jx-tinta'>
                                <WrapperText value={record.hourOccupies} updateValue={write('hourOccupies')} />
                            </WrapperCell>

                            <WrapperCell classStyles='text-jx-tinta'>
                                <WrapperText value={record.hourFirstAttention} updateValue={write('hourFirstAttention')} />
                            </WrapperCell>

                            {/*  DURACIÓN de la primera atención. Es un valor calculado, así que no se toca: va sin
                                 'updateValue'. Si pasa del tiempo del local (attentionLate), la celda va en rojo con
                                 el marco que late y aparece «Reportar»; una vez reportada, queda en rojo claro con
                                 la bandera de «Reportada» (durationLook).  */}
                            <WrapperCell classStyles={`gap-1.5 px-1 ${durationLook(attentionLate, attentionReported)}`} titulo={attentionReported ? 'Demora de primera atención reportada' : attentionLate ? `Pasó del tiempo de referencia de primera atención: ${attentionLimit}, ${originText(attentionOrigin, 'firstAtenttion')}` : undefined}>
                                <WrapperText
                                    classStyles={durationText(noAttentionYet, attentionLate, attentionReported)}
                                    value={noAttentionYet ? '—' : attention.timeTotal}
                                />

                                {attentionReported
                                    ? <ReportedFlag kind='primera atención' />
                                    : attentionLate && <ReportDelayButton table={record.tableNumber} kind='primera atención' onReport={() => askForReport('primera atención')} />}

                                {noticeBadge}
                            </WrapperCell>

                            <WrapperCell classStyles='text-jx-tinta'>
                                <WrapperText value={record.breakUp} updateValue={write('breakUp')} />
                            </WrapperCell>

                            <WrapperCell classStyles='text-jx-tinta'>
                                <WrapperText value={record.tableCleaning} updateValue={write('tableCleaning')} />
                            </WrapperCell>

                            {/*  Y la DURACIÓN de la limpieza. También calculada: sin 'updateValue'. Igual que la de
                                 primera atención, contra el tiempo de limpieza del local (cleaningLate).  */}
                            <WrapperCell classStyles={`gap-1.5 px-1 ${durationLook(cleaningLate, cleaningReported)}`} titulo={cleaningReported ? 'Demora de limpieza reportada' : cleaningLate ? `Pasó del tiempo de referencia de limpieza: ${cleaningLimit}, ${originText(cleaningOrigin, 'TableCleaning')}` : undefined}>
                                <WrapperText
                                    classStyles={durationText(noCleaningYet, cleaningLate, cleaningReported)}
                                    value={noCleaningYet ? '—' : cleaning.timeTotal}
                                />

                                {cleaningReported
                                    ? <ReportedFlag kind='limpieza' />
                                    : cleaningLate && <ReportDelayButton table={record.tableNumber} kind='limpieza' onReport={() => askForReport('limpieza')} />}
                            </WrapperCell>
                        </>
                    )
                }

                {/*  Un botón por cada gerente del local y, tras una raya, el de la lista de toques, que está
                     siempre (sin mesa, apagado). Sin gerentes, no hay columna. Un pedido para llevar no lleva
                     toques: va tachada, y solo si ya tenía alguno (de antes de ponerle el '#') queda el
                     botón de la lista, para poder verlos y borrarlos.  */}
                {
                    managers.length > 0 && (
                        takeOut ? (
                            <NotApplicableCell title='Pedido para llevar: no lleva toques de gerente' classStyles='register-rail'>
                                {record.touch.length > 0 && <TouchToggle count={record.touch.length} open={touchesOpen} onToggle={() => setTouchesOpen(!touchesOpen)} />}
                            </NotApplicableCell>
                        ) : (
                            //  'gap-2' y 'register-managers-cell': la burbuja de cada gerente asoma por su esquina
                            //  (registers.css), y necesita sitio y que la celda no la recorte.
                            <WrapperCell classStyles='register-rail register-managers-cell cursor-default gap-2'>
                                <ManagerButtons managers={managers} touches={record.touch} dimmed={noTable} onTouch={touchOne} />
                                <span aria-hidden='true' className='shrink-0 w-px h-[18px] mx-0.5 bg-jx-regla2' />
                                <TouchToggle count={record.touch.length} open={touchesOpen} disabled={noTable} onToggle={() => setTouchesOpen(!touchesOpen)} />
                            </WrapperCell>
                        )
                    )
                }

                {/*  El disquete: guardar la rotación (ver 'saveOne')  */}
                <WrapperCell classStyles='register-rail cursor-default'>
                    <SaveRecordButton table={record.tableNumber} waiting={noTable} done={finished} busy={saving} onSave={saveOne} />
                </WrapperCell>

                {/*  Los toques de gerente: flotan encima de las filas de abajo, sin empujarlas. Con mesa y sin
                     ser para llevar se abre también sin toques: su primera fila apunta uno a mano ('onCreate').  */}
                {
                    touchesOpen && (record.touch.length > 0 || canTouchByHand) && (
                        <RegisterTouchList
                            tableNumber={record.tableNumber}
                            touches={record.touch}
                            managers={managers}
                            onWrite={(touchId, field, value) => writeTouch(record.id, touchId, field, value)}
                            onDelete={(touchId) => deleteTouch(record.id, touchId)}
                            onClose={() => setTouchesOpen(false)}
                            onCreate={canTouchByHand ? (manager, times) => addTouch(record.id, manager, times) : undefined}
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
