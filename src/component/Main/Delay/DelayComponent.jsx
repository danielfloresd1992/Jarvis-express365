import plate from '../../../../public/ico/restaurant/restaurant.svg';
import serviseSvg from '../../../../public/ico/cleaning_services/cleaning_services.svg';
import book from '../../../../public/ico/menubook/menubook.svg';
import food from '../../../../public/ico/food.svg';
import tablet from '../../../../public/ico/tablet/tablet.svg';
import touchTablet from '../../../../public/ico/icons8-panel-táctil-100.png';
import tiketIco from '../../../../public/ico/icons8-boleto-100.png'
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { showBoxModal } from '../../../store/slices/boxModal.js';
import { DivAttention } from './first_attention/Div_first_attention.jsx';
import { DelayDish } from './delayDish/DelayDish.jsx';
import { Divclear } from './clean/DivClear.jsx';
import { Servises } from './servise/servise.jsx';
import { TabletDelay } from './tablet/tablet.jsx';
import TabletTouch from './tabletTouch/tablet_touch.jsx';
import ErrorTiket from './error_tiket/ErrorTiket.jsx'
import NoComanda from './no_comanda/NoComanda.jsx'



/*  @param {object} reporteDemora  un reporte que llegó del register de la tablet (su reloj rojo).
 *                                 Cuando viene, se abre directamente SU formulario con sus
 *                                 datos ya puestos: el de primera atención o, si su 'tipo' es
 *                                 'limpieza', el de limpieza (ver tipoDe).
 *
 *                                 Mientras ese reporte está abierto, el menú de botones
 *                                 NO se enseña (pedido del usuario): se viene a reportar
 *                                 esa demora, y solo está su formulario. Al enviarlo o
 *                                 cerrarlo (resetTitle), el menú vuelve.
 *
 *                                 Sin él —el caso de siempre, cuando alguien entra a
 *                                 Demoras a mano— esto se comporta exactamente igual
 *                                 que antes: el menú de botones, sin nada elegido.
 */


// tipoDe = «qué formulario pide un reporte»: su 'tipo' ('primera atención' o 'limpieza', los mismos 'id' de los
// botones de abajo). Sin 'tipo' es de primera atención: así llegaban todos antes de existir la limpieza, también
// los de una ventana flotante sin actualizar.
const tipoDe = (reporte) => reporte?.tipo ?? 'primera atención';


/*  CON EL REGISTRO DE PROCESOS ACTIVO, PRIMERA ATENCIÓN Y LIMPIEZA SE REPORTAN DESDE MESAS (pedido del usuario)
 *
 *  Allí cada demora sale de su fila, con el reloj rojo de su duración: el formulario llega con la mesa y las horas
 *  puestas, y la novedad queda apuntada en su rotación (firstAttentionDelay / cleaningDelay). Reportarla a mano
 *  desde aquí la dejaría suelta. Así que, con el registro activo, esos dos botones del menú van apagados —con un
 *  candado y la nota «Desde Mesas»— y al pulsarlos solo dicen dónde se hace. El reporte que llega del reloj rojo
 *  no pasa por estos botones: abre su formulario directamente, y sigue funcionando igual.
 */

// FROM_TABLES = «los botones que, con el registro de procesos activo, se reportan desde Mesas»
const FROM_TABLES = ['primera atención', 'limpieza'];

// FROM_TABLES_MESSAGE = «lo que se le dice a quien pulsa uno de ellos»
const FROM_TABLES_MESSAGE = 'Con el registro de procesos activo, las demoras de primera atención y de limpieza se reportan desde Mesas: en la fila de la mesa, con el reloj rojo de su duración.\n\nAsí el reporte lleva la mesa y las horas ya puestas, y queda unido a su rotación.';


function Delay({ titlesJson, awaitWindow, boxModal, reset, reporteDemora, onReporteCerrado }) {

    let [title, setTitle] = useState(reporteDemora ? tipoDe(reporteDemora) : []);


    /*  DE DÓNDE VINO LO QUE ESTÁ ABIERTO
     *
     *  Esto es lo que separa un formulario precargado de uno en blanco, y hace falta
     *  llevarlo aparte del título: los dos casos abren la MISMA pantalla.
     *
     *  Sin esta distinción, después de un reporte desde la tablet cualquier entrada a
     *  mano en 'Primera atención' salía rellena con la mesa y las horas del reporte
     *  anterior. Entrar a mano tiene que dar siempre un formulario vacío.
     */
    const [reporteActivo, setReporteActivo] = useState(reporteDemora ?? null);


    //  Si llega OTRO reporte con el formulario ya abierto, hay que volver a elegir:
    //  el estado inicial solo se lee al montar, y este componente ya está montado.
    useEffect(() => {
        if (!reporteDemora) return;
        setTitle(tipoDe(reporteDemora));
        setReporteActivo(reporteDemora);
    }, [reporteDemora?.id]);


    // datosPara = «los datos del reporte para ese formulario»: solo si el reporte es suyo. Un reporte de limpieza
    // no rellena el de primera atención, ni al revés.
    const datosPara = (tipo) => (reporteActivo && tipoDe(reporteActivo) === tipo ? reporteActivo : null);


    // processRegister = «el local tiene activado el registro de procesos» (Local.processRegister, se activa en
    // Client365): el de state.establishment, el local elegido. Si ese local está también en la lista que se pide
    // al abrir (state.locals), manda la lista, que está al día: es la misma regla con que Main enseña o no Mesas,
    // así los botones solo se bloquean cuando Mesas está a la vista para reportar desde allí.
    const processRegister = useSelector(state => {
        const fresh = state.locals?.find?.(local => local._id === state.establishment?._id);
        return (fresh ?? state.establishment)?.processRegister === true;
    });

    const dispatch = useDispatch();

    // fromTables = «este botón se reporta desde Mesas»: bloqueado aquí
    const fromTables = (id) => processRegister && FROM_TABLES.includes(id);

    //  Un clic en cualquiera de los botones es una elección a mano, y por tanto empieza
    //  de cero: se suelta el reporte que hubiera precargado. Si el botón se reporta desde
    //  Mesas, no abre nada: dice dónde se hace (con el BoxModal de la aplicación).
    const elegirAMano = (id) => {
        if (fromTables(id)) {
            dispatch(showBoxModal({ tone: 'warning', title: 'Se reporta desde Mesas', message: FROM_TABLES_MESSAGE }));
            return;
        }
        setReporteActivo(null);
        setTitle(id);
    };




    if (titlesJson.length < 1) return null;

    const render = text => {
        switch (text) {
            case 'primera atención': return <DivAttention key={datosPara('primera atención')?.id ?? 'manual'} awaitWindow={awaitWindow} boxModal={boxModal} reset={resetTitle} title={titlesJson[0]} datosIniciales={datosPara('primera atención')} />;
            case 'limpieza': return <Divclear key={datosPara('limpieza')?.id ?? 'manual'} awaitWindow={awaitWindow} boxModal={boxModal} reset={resetTitle} title={titlesJson[1]} datosIniciales={datosPara('limpieza')} />;
            case 'servicio': return <Servises awaitWindow={awaitWindow} boxModal={boxModal} reset={resetTitle} title={titlesJson[2]} />;
            case 'plato': return <DelayDish awaitWindow={awaitWindow} boxModal={boxModal} reset={resetTitle} title={titlesJson[3]} />;
            case 'tablet': return <TabletDelay awaitWindow={awaitWindow} boxModal={boxModal} reset={resetTitle} title={titlesJson[4]} />;
            case 'tablet-touch': return <TabletTouch awaitWindow={awaitWindow} boxModal={boxModal} reset={resetTitle} title={titlesJson.filter(item => item._id === '67893e1e35aa90710e005d09')} />
            case 'tablet-tiket': return <ErrorTiket awaitWindow={awaitWindow} boxModal={boxModal} reset={resetTitle} title={titlesJson.filter(item => item._id === '67fe7590e3a4f498308de7e1')} />;
            case 'tablet-no-comanda': return <NoComanda awaitWindow={awaitWindow} boxModal={boxModal} reset={resetTitle} title={titlesJson.filter(item => item._id === '6a70d377003e6d1c9effbc76')} />;
            default: null;
                break;
        }
    };

    /*  Cierra el formulario y vuelve al menú de botones.
     *
     *  Es el mismo 'resetTitle' de siempre; lo único añadido es avisar arriba de que el
     *  reporte se consumió. Sin ese aviso, Home seguiría teniéndolo por abierto y el
     *  formulario se volvería a precargar al entrar la próxima vez.
     */
    const resetTitle = () => {
        setTitle(title = []);
        setReporteActivo(null);
        onReporteCerrado?.();
        render('');
    };



    return (
        <>
            {/*  El menú de botones, salvo con un reporte del register abierto: entonces solo va su formulario  */}
            {
                !reporteActivo && (
                    <div className='delay-grid'>
                        <BottonSelection title='Primera atención'              ico={book}        id='primera atención'   event={elegirAMano} locked={fromTables('primera atención')} />
                        <BottonSelection title='Limpieza'                      ico={serviseSvg}  id='limpieza'           event={elegirAMano} locked={fromTables('limpieza')} />
                        <BottonSelection title='Servicio'                      ico={food}        id='servicio'           event={elegirAMano} />
                        <BottonSelection title='Entrega de plato'              ico={plate}       id='plato'              event={elegirAMano} />
                        <BottonSelection title='Tablet'                        ico={tablet}      id='tablet'             event={elegirAMano} />
                        <BottonSelection title='Marcada antes de estar listo'  ico={touchTablet} id='tablet-touch'       event={elegirAMano} />
                        <BottonSelection title='Error de tiket'                ico={tiketIco}    id='tablet-tiket'       event={elegirAMano} />
                        <BottonSelection title='Plato no comandado'            ico='/ico/icons8-transaccion-rechazada-100.png' id='tablet-no-comanda' event={elegirAMano} />
                    </div>
                )
            }
            {render(title)}
        </>
    );
}



/*  @param {boolean} locked  opcional. Se reporta desde Mesas: va apagado, con un candado y la nota «Desde Mesas».
 *                           Es 'aria-disabled' y no 'disabled' a propósito: así sigue enseñando su porqué al
 *                           pasar el ratón y, al pulsarlo, avisa (ver elegirAMano) en vez de no hacer nada.
 */
function BottonSelection({ title, ico, id, event, locked = false }) {
    return (
        <div className={`delay-btn-wrap ${locked ? 'delay-btn-wrap--locked' : ''}`}>
            <button
                className='delay-btn'
                id={id}
                type='button'
                onClick={e => event(e.currentTarget.id)}
                title={locked ? `${title}: se reporta desde Mesas, con el reloj rojo de la fila` : title}
                aria-disabled={locked || undefined}
            >
                <img
                    src={ico}
                    alt={title}
                    className='delay-btn-icon'
                />
                {
                    locked && (
                        <span className='delay-btn-lock' aria-hidden='true'>
                            <svg width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.6' strokeLinecap='round' strokeLinejoin='round'>
                                <rect x='4' y='11' width='16' height='10' rx='2' />
                                <path d='M8 11V7a4 4 0 0 1 8 0v4' />
                            </svg>
                        </span>
                    )
                }
            </button>
            <span className='delay-btn-label'>{title}</span>
            {locked && <span className='delay-btn-note'>Desde Mesas</span>}
        </div>
    );
}







export { Delay };



