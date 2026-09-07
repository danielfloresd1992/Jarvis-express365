import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { isTablet } from 'react-device-detect';
import { RenderDefault } from './Default/Default.jsx';
import { SendNoveltie } from './SendNovelties/SendNoveltie.jsx';
import { Delay } from './Delay/DelayComponent.jsx';
import { Production } from './production/Producction.jsx';
import { ShowManager } from './showManager/ShowManager.jsx';
import Pizza from './pizzaComponent/Pizza.jsx';
import FormTablet from '../for_tablet/FormTablet.jsx';
import LoadFileForm from '../for_tablet/loadImg.jsx';
import calculateTime, { getTimeReport } from '@/libs/date_time/calculate_time.js';
import FieldInput from '@/component/inputs/FieldInput.jsx';

//import { DivAttention } from './first_attention/Div_first_attention.jsx';
import { DivAttention } from './Delay/first_attention/Div_first_attention.jsx';




export function Main({ value, selectNovelty, awaitWindow, boxModal, menu }) {


    const establishment = useSelector(store => store.establishment);
    const [typeDelay, setTypeDelay] = useState({ data: null, type: '' })

    //  Tickets que la ventana flotante leyó de la pantalla de la tablet
    const [tickets, setTickets] = useState([]);
    const [ultimaLectura, setUltimaLectura] = useState(null);


    //  LAS FILAS DE LA PARRILLA
    //
    //  Primero una fila por cada mesa que la IA detectó, con su número y su
    //  demora ya puestos. Después, filas vacías hasta completar la parrilla,
    //  para que el monitorista siga pudiendo anotar a mano las mesas que la
    //  tablet no ve.
    //
    //  La clave de cada fila lleva el número de mesa: así React reconoce la
    //  fila entre lecturas y no pierde lo que el monitorista haya escrito en
    //  ella cuando llega una lectura nueva.
    const FILAS_TOTALES = 30;

    const filas = useMemo(() => {
        const conTicket = tickets.map(t => ({
            clave: `mesa-${t.mesa}`,
            ticket: t,
        }));

        const vacias = Array.from(
            { length: Math.max(0, FILAS_TOTALES - conTicket.length) },
            (_, i) => ({ clave: `libre-${i}`, ticket: null })
        );

        return [...conTicket, ...vacias];
    }, [tickets]);

    //  ¿Está abierta la ventana flotante? Lo dice Electron, no lo adivinamos:
    //  si el usuario la cierra desde su propia X, el botón se entera igual.
    const [tabletAbierta, setTabletAbierta] = useState(false);


    useEffect(() => {
        const desuscribir = window.electronAPI?.onTabletState?.(setTabletAbierta);
        window.electronAPI?.preguntarEstadoTablet?.();   //  por si ya estaba abierta
        return desuscribir;
    }, []);


    //  Escuchamos lo que manda la ventana flotante. La suscripción se cancela al
    //  desmontar: si no, cada re-render dejaría un oyente vivo de más.
    useEffect(() => {
        const desuscribir = window.electronAPI?.onTickets?.((recibidos) => {
            setTickets(recibidos);
            setUltimaLectura(new Date().toLocaleTimeString());
        });
        return desuscribir;
    }, []);



    useEffect(() => {
        if (isTablet && document.documentElement?.requestFullscreen) {
            document.documentElement.requestFullscreen()
                .then(() => {
                    if (screen?.orientation) {
                        screen.orientation.lock('portrait')
                            .then(() => { })
                            .catch((error) => console.error(error));
                    }
                })
                .catch(error => {
                    console.log(error);
                })
        }
    }, []);




    const changeStateForm = (type, data) => {
        setTypeDelay({ type, data })
    };


    /*

    const render = (value) => {

        switch (value) {
            case '': return
            case 'imagen-1': return (<SendNoveltie titlesJson={menu.filter(menu => menu.category !== 'delay' && menu.es !== 'Servicio Pick Up')} awaitWindow={awaitWindow} boxModal={boxModal} reset={selectNovelty} key='imagen-1' />);
            case 'imagen-2': return (<Production awaitWindow={awaitWindow} boxModal={boxModal} reset={selectNovelty} key='imagen-2' title={menu.filter(menu => menu.es === 'Empleado realiza producción')[0]} />);
            case 'imagen-3': return (<Delay titlesJson={menu.filter(menu => menu.category === 'delay')} awaitWindow={awaitWindow} boxModal={boxModal} reset={selectNovelty} key='imagen-3' />);
            case 'imagen-4': return (<PickUp awaitWindow={awaitWindow} boxModal={boxModal} title={menu.filter(menu => menu.es === 'Servicio Pick Up')[0]} reset={selectNovelty} key='imagen-4' />)

            case 'imagen-pizza': return (<Pizza awaitWindow={awaitWindow} boxModal={boxModal} title={menu.filter(menu => menu.es === 'Estándares de calidad')[0]} reset={selectNovelty} key='imagen-4' />)
            //info
            case 'show-manager': return (<ShowManager key='show-manager' />);
            case 'delayTabletForTablet': return (<FormTablet awaitWindow={awaitWindow} boxModal={boxModal} title={menu.filter(menu => menu.es === 'Demora en preparación de plato')[0]} reset={selectNovelty} key='imagen-6' />);
            case 'loadImage': return (<LoadFileForm awaitWindow={awaitWindow} boxModal={boxModal} reset={selectNovelty} key='imagen-47' />);
            default: return (<RenderDefault selectNovelty={selectNovelty} />)
        }
    };

    */



    if (!menu) return null;


    return (
        <>
            <main className="main-content" >

                <div id='table-data' className='w-full flex-1 min-h-0 overflow-auto rounded-xl border border-[#0a3a66]/60 bg-[#01122c]'>
                    <div className='sticky top-0 h-[45px] bg-[#021a38] flex w-full items-center justify-around'>
                        {
                            ['Mesa', 'Ocupa', 'Primera atención', 'Demora', 'Desocupa', 'Limpieza', 'Demora'].map((text) => {
                                return (
                                    <WrapperCell key={text} classStyles='h-full uppercase tracking-[0.6px] font-semibold text-[#5e7ba0] bg-[#021a38]'>{text}</WrapperCell>

                                )
                            })
                        }
                    </div>

                    {
                        filas.map(fila => (
                            <RotationLine key={fila.clave} ticket={fila.ticket} setDelay={changeStateForm} />
                        ))
                    }
                </div>

                {
                    typeDelay.type === '1raAttention' && (
                        <div className='fixed right-0 w-[50%] z-[900] top-[calc(var(--titlebar-h)+50px)] h-[calc(100%-var(--titlebar-h)-50px)]'>

                            <DivAttention
                                titlesJson={menu.filter(menu => menu.category === 'delay')[0]}
                                awaitWindow={awaitWindow}
                                boxModal={boxModal}
                                reset={selectNovelty}
                                title={menu.filter(menu => menu.category === 'delay')[0]}
                                data={typeDelay?.data}
                            />

                        </div>
                    )

                }
                {/*  La tablet ya no vive aquí: se abre como ventana flotante del sistema.  */}
                <button
                    className={`fixed right-4 z-[901] top-[calc(var(--titlebar-h)+58px)] px-3 py-1.5 rounded-md text-[12px] font-bold text-white ${tabletAbierta ? 'bg-[#7a1f2b] hover:bg-[#9a2533]' : 'bg-[#066ca8] hover:bg-[#0890c0]'}`}
                    onClick={() => {
                        if (tabletAbierta) window.electronAPI?.closeTabletWindow?.();
                        else window.electronAPI?.openTabletWindow?.();
                    }}
                >
                    {tabletAbierta ? 'Quitar tablet' : 'Sacar tablet'}
                </button>

                <PanelTickets tickets={tickets} hora={ultimaLectura} />



            </main>

        </>
    );
}




/*
 *  PANEL DE TICKETS — provisional.
 *
 *  Muestra en crudo lo último que la ventana flotante leyó de la tablet. Existe
 *  para comprobar que el camino completo funciona (tablet -> IA -> flotante ->
 *  Jarvis) mientras se define en qué columna de la parrilla va cada dato.
 *  Cuando eso se decida, esto se reemplaza por el volcado a la parrilla.
 */
function PanelTickets({ tickets, hora }) {

    if (!hora) return null;   //  todavía no llegó ninguna lectura

    return (
        <div className='fixed right-4 bottom-4 z-[900] w-[300px] max-h-[45%] overflow-auto rounded-xl border border-[#0a3a66] bg-[#01122c] shadow-[0_0_40px_rgba(0,120,255,0.15)]'>

            <div className='sticky top-0 flex items-center justify-between px-3 py-2 bg-[#021a38] border-b border-[#0a3a66]'>
                <span className='text-[11px] font-bold uppercase tracking-[0.6px] text-[#5e7ba0]'>
                    Tickets leídos
                </span>
                <span className='text-[10px] font-mono text-[#33486a]'>{hora}</span>
            </div>

            {
                tickets.length === 0 ?
                    <p className='px-3 py-3 text-[12px] text-[#33486a]'>La tablet no mostraba ningún ticket.</p>
                    :
                    <ul className='divide-y divide-[#0a3a66]/40'>
                        {
                            tickets.map((t, i) => (
                                <li key={i} className='px-3 py-2 flex items-center justify-between gap-2'>
                                    {/*  'table' es el nombre viejo del campo: se acepta por si
                                         llega una lectura del prompt anterior.  */}
                                    <span className='text-[12px] font-semibold text-[#aecbf0]'>
                                        Mesa {t?.mesa ?? t?.table ?? '—'}
                                    </span>

                                    <span className={`text-[12px] font-mono tabular-nums ${t?.rojo ? 'text-[#f08a6a] font-bold' : 'text-[#5e7ba0]'}`}>
                                        {t?.tiempo ?? '—'}
                                    </span>
                                </li>
                            ))
                        }
                    </ul>
            }
        </div>
    );
}




function RotationLine({ setDelay, ticket }) {


    const [tableNumber, setTableNumber] = useState(ticket?.mesa ?? '');
    const [customerSeatedTime, setCustomerSeatedTime] = useState('');
    const [firtAtenttionTime, setFirtAttentionTime] = useState('');
    const timeLimit = '00:03:00';


    //  El número de mesa lo pone la IA, pero el monitorista puede corregirlo.
    //  Solo se sobrescribe cuando la lectura trae una mesa distinta a la que
    //  hay puesta: si no, cada lectura le borraría lo que acabara de escribir.
    useEffect(() => {
        if (ticket?.mesa && String(ticket.mesa) !== tableNumber) {
            setTableNumber(String(ticket.mesa));
        }
    }, [ticket?.mesa]);

    const totalTime = useMemo(() => getTimeReport(customerSeatedTime, firtAtenttionTime, timeLimit), [customerSeatedTime, firtAtenttionTime]);
    const timeWhitTouch = customerSeatedTime === '' && firtAtenttionTime === '';



    const handdlerContextMenu = e => {
        e.preventDefault();
    };


    const handdlerChengeTable = (e) => {
        setTableNumber(e.target.value);
    };


    const handdlerDelay1raAttention = () => {
        if (tableNumber === '') return alert('Indique el número de mesa');

        setDelay('1raAttention', { tableNumber, customerSeatedTime, firtAtenttionTime })

    };



    return (
        <div className='flex w-full items-center justify-around bg-[#0e1223] transition-colors hover:bg-[#10203c]'>
            <WrapperCell classStyles='font-semibold'>
                <input
                    className='w-full h-full text-center'
                    type='text'
                    value={tableNumber}
                    onChange={handdlerChengeTable}
                />
            </WrapperCell>

            <WrapperCell classStyles='text-[#aecbf0]'>
                <WrapperText
                    value={customerSeatedTime}
                    updateValue={(value) => setCustomerSeatedTime(value)}
                />
            </WrapperCell>

            <WrapperCell classStyles='text-[#aecbf0]'>
                <WrapperText

                    value={firtAtenttionTime}
                    updateValue={(value) => setFirtAttentionTime(value)}
                />
            </WrapperCell>


            {/*  DEMORA — si la IA leyó el tiempo del ticket, manda ese; si no,
                 se sigue calculando a mano como hasta ahora (atención − ocupa).  */}
            <WrapperCell classStyles='text-[#39ff14] font-semibold relative'>
                {
                    ticket?.tiempo ?
                        <WrapperText
                            classStyles={ticket.rojo ? 'text-[#f08a6a] font-bold' : 'text-[#aecbf0]'}
                            value={ticket.tiempo}
                        />
                        :
                        <WrapperText
                            classStyles={timeWhitTouch ? 'text-[#33486a]' : totalTime.exceeded ? 'text-[red]' : 'text-lime-500'}
                            value={timeWhitTouch ? '00:00:00' : totalTime.timeTotal}
                        />
                }

                {
                    totalTime.exceeded && (
                        <button className='absolute w-[60px] right-[0px]' onClick={handdlerDelay1raAttention}>
                            <img className='w-full h-full' src='/ico/icons8-delay-64.png' alt='ico-delay' />
                        </button>
                    )
                }

            </WrapperCell>


            <WrapperCell classStyles='text-[#33486a]'>
                <WrapperText value='00:00:00' />
            </WrapperCell>

            <WrapperCell classStyles='text-[#33486a]'>
                <WrapperText value='00:00:00' />
            </WrapperCell>

            <WrapperCell classStyles='text-[#33486a]'>
                <WrapperText value='00:00:00' />
            </WrapperCell>
        </div>
    )
}




function WrapperCell({ classStyles = '', children }) {
    return (
        <div className={`cursor-pointer flex-1 h-7 flex items-center justify-center text-[12px] border-b border-b-[#0a3a66]/25 text-center leading-[1.15] border-r border-r-[#0a3a66]/25 ${classStyles}`}>
            {children}
        </div>
    );
}





function WrapperText({ classStyles = '', value, updateValue, block = false }) {


    const [modeEdit, setModeEdit] = useState(false);


    const handdlerClick = () => {
        if (typeof updateValue === 'function') updateValue(getBiteDAte());
    };


    const haddlerOnDoubleClick = () => {
        if (!modeEdit) setModeEdit(true);
    };




    if (modeEdit) return (
        <input
            className='w-full h-full text-center'
            type='text'
            name='impút'
            value={value}
            onChange={(e) => { console.log(e.target.value); updateValue(e.target.value) }}
        />
    )


    return (
        <div
            className='w-full h-full flex items-center justify-center'
            onClick={handdlerClick}
            onDoubleClick={haddlerOnDoubleClick}
        >

            <p className={`tracking-[0.3px] font-mono tabular-nums ${classStyles}`}>{value === '' ? '-' : value}</p>

        </div>

    )
}



function getBiteDAte() {
    const ahora = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}`;
}