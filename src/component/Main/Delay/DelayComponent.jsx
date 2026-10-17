import plate from '../../../../public/ico/restaurant/restaurant.svg';
import serviseSvg from '../../../../public/ico/cleaning_services/cleaning_services.svg';
import book from '../../../../public/ico/menubook/menubook.svg';
import food from '../../../../public/ico/food.svg';
import tablet from '../../../../public/ico/tablet/tablet.svg';
import touchTablet from '../../../../public/ico/icons8-panel-táctil-100.png';
import tiketIco from '../../../../public/ico/icons8-boleto-100.png'
import { useState, useEffect } from 'react';
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


    //  Un clic en cualquiera de los botones es una elección a mano, y por tanto empieza
    //  de cero: se suelta el reporte que hubiera precargado.
    const elegirAMano = (id) => {
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
                        <BottonSelection title='Primera atención'              ico={book}        id='primera atención'   event={elegirAMano} />
                        <BottonSelection title='Limpieza'                      ico={serviseSvg}  id='limpieza'           event={elegirAMano} />
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



function BottonSelection({ title, ico, id, event }) {
    return (
        <div className='delay-btn-wrap'>
            <button
                className='delay-btn'
                id={id}
                type='button'
                onClick={e => event(e.currentTarget.id)}
                title={title}
            >
                <img
                    src={ico}
                    alt={title}
                    className='delay-btn-icon'
                />
            </button>
            <span className='delay-btn-label'>{title}</span>
        </div>
    );
}







export { Delay };



