import { useState, useEffect, useMemo, useRef } from 'react';
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
import { TabletScreen } from '../tabletScreen/TabletScreen.jsx';




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

    /*  LA TABLET SE VE DE DOS FORMAS SEGÚN DÓNDE CORRA JARVIS
     *
     *  En la aplicación de escritorio, en una ventana flotante del sistema que
     *  se queda encima de todo. En un navegador eso no existe —ninguno deja a
     *  una página crear ventanas del sistema—, así que ahí se dibuja dentro de
     *  Jarvis, en un panel a la derecha.
     *
     *  El botón es el mismo y el componente también: lo único que cambia es
     *  dónde se pinta.
     */
    const hayEscritorio = !!window.electronAPI?.isElectron;

    //  Si hay escritorio, el estado lo dice Electron: así el botón acierta
    //  aunque alguien cierre la ventana desde su propia ✕.
    const [tabletAbierta, setTabletAbierta] = useState(false);

    //  Y si no, lo lleva la propia página.
    const [panelAbierto, setPanelAbierto] = useState(false);

    const tabletVisible = hayEscritorio ? tabletAbierta : panelAbierto;


    const alternarTablet = () => {
        if (!hayEscritorio) return setPanelAbierto(abierto => !abierto);

        if (tabletAbierta) window.electronAPI?.closeTabletWindow?.();
        else window.electronAPI?.openTabletWindow?.();
    };


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
                {/*  La tablet ya no vive aquí: se abre como ventana flotante del sistema.

                     El botón se dibuja como una pastilla con un punto de estado a la
                     izquierda: verde cuando la ventana está fuera, apagado cuando no.
                     Así se sabe de un vistazo si la tablet está a la vista sin tener
                     que leer el texto.  */}
                <button
                    className={`
                        group fixed right-[76px] z-[901] top-[calc(var(--titlebar-h)+58px)]
                        flex items-center gap-2 pl-2.5 pr-3.5 py-1.5
                        rounded-full border text-[12px] font-semibold tracking-[0.2px]
                        shadow-lg backdrop-blur-sm
                        transition-all duration-200 ease-out
                        hover:-translate-y-px active:translate-y-0
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0890c0]/60
                        ${tabletVisible
                            ? 'border-[#9a2533]/60 bg-[#7a1f2b]/90 text-[#ffd9dd] hover:bg-[#9a2533] shadow-[#7a1f2b]/30'
                            : 'border-[#0a3a66] bg-[#021a38]/90 text-[#aecbf0] hover:bg-[#0a3a66] hover:text-white shadow-black/40'
                        }
                    `}
                    onClick={alternarTablet}
                    title={
                        hayEscritorio
                            ? (tabletVisible ? 'Cerrar la ventana de la tablet' : 'Abrir la tablet en una ventana aparte')
                            : (tabletVisible ? 'Ocultar la tablet' : 'Ver la tablet en un panel')
                    }
                >
                    {/*  Punto de estado. El halo solo aparece cuando está abierta:
                         un elemento que late todo el rato termina siendo ruido.  */}
                    <span className='relative flex h-2 w-2 shrink-0'>
                        {
                            tabletVisible && (
                                <span className='absolute inline-flex h-full w-full rounded-full bg-[#ff6b7a] opacity-60 animate-ping' />
                            )
                        }
                        <span className={`relative inline-flex h-2 w-2 rounded-full ${tabletVisible ? 'bg-[#ff8f9c]' : 'bg-[#33486a] group-hover:bg-[#5e7ba0]'}`} />
                    </span>

                    {/*  Icono de tablet  */}
                    <svg className='h-3.5 w-3.5 shrink-0' viewBox='0 0 24 24' fill='none'
                         stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                        <rect x='5' y='2.5' width='14' height='19' rx='2.5' />
                        <line x1='10.5' y1='18.5' x2='13.5' y2='18.5' />
                    </svg>

                    <span>{tabletVisible ? 'Quitar tablet' : 'Sacar tablet'}</span>
                </button>


                {/*  PANEL DE LA TABLET — solo cuando NO hay escritorio.
                     Se monta siempre y se oculta con 'hidden': si se quitara del
                     árbol, al cerrarlo TabletScreen ejecutaría su limpieza y
                     cerraría la conexión con la tablet.  */}
                {
                    !hayEscritorio && (
                        <PanelFlotanteTablet
                            visible={panelAbierto}
                            onCerrar={() => setPanelAbierto(false)}
                            nombreLocal={establishment?.name}
                        />
                    )
                }

                <PanelTickets tickets={tickets} hora={ultimaLectura} />



            </main>

        </>
    );
}




/*  PANEL FLOTANTE DE LA TABLET — para cuando Jarvis corre en un navegador.
 *
 *  Imita a la ventana de Electron con lo que una página sí puede hacer: se
 *  arrastra por su barra superior, se estira por la esquina, queda por encima
 *  del resto y se cierra con su ✕. "Siempre encima" aquí significa encima del
 *  contenido de Jarvis — una página no puede ponerse sobre otros programas.
 *
 *  Recuerda dónde quedó, igual que la de escritorio.
 */
const CLAVE_PANEL = 'tablet:panel';

function leerPanelGuardado() {
    try {
        const g = JSON.parse(localStorage.getItem(CLAVE_PANEL));
        if (g && Number.isFinite(g.x) && Number.isFinite(g.y)) return g;
    }
    catch { /* sin acceso al almacenamiento: valores por defecto */ }

    return { x: Math.max(16, window.innerWidth - 420), y: 120, ancho: 400, alto: 300 };
}


function PanelFlotanteTablet({ visible, onCerrar, nombreLocal }) {

    const [caja, setCaja] = useState(leerPanelGuardado);
    const [arrastrando, setArrastrando] = useState(false);
    const [estirando, setEstirando] = useState(null);   //  'derecha' | 'abajo' | 'esquina'
    const inicioRef = useRef(null);
    const cajaRef = useRef(null);


    //  Se guarda al SOLTAR, nunca durante el movimiento: mover o estirar dispara
    //  decenas de eventos por segundo y escribir en cada uno no aporta nada.
    //
    //  Aquí estaba el fallo de que "no recordaba": la condición miraba solo el
    //  arrastre, así que al estirar guardaba en cada píxel y el último valor
    //  bueno se perdía entre medias.
    useEffect(() => {
        if (arrastrando || estirando) return;
        try { localStorage.setItem(CLAVE_PANEL, JSON.stringify(caja)); }
        catch { /* da igual: es una comodidad, no un dato crítico */ }
    }, [caja, arrastrando, estirando]);




    const empezarArrastre = (e) => {
        if (e.button !== 0) return;                 //  solo el botón izquierdo
        if (e.target.closest('button')) return;     //  no al pulsar Conectar o la ✕
        e.preventDefault();

        inicioRef.current = { x: e.clientX, y: e.clientY, cajaX: caja.x, cajaY: caja.y };
        setArrastrando(true);
    };


    const empezarEstirado = (lado) => (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();     //  si no, también arrancaría el arrastre de la ventana

        inicioRef.current = { x: e.clientX, y: e.clientY, ancho: caja.ancho, alto: caja.alto };
        setEstirando(lado);
    };


    //  Estirar por un borde: el derecho solo cambia el ancho, el inferior solo el
    //  alto, y la esquina los dos.
    useEffect(() => {
        if (!estirando) return;

        const mover = (e) => {
            const i = inicioRef.current;
            if (!i) return;

            setCaja(c => ({
                ...c,
                ancho: estirando === 'abajo' ? c.ancho : Math.max(280, i.ancho + (e.clientX - i.x)),
                alto: estirando === 'derecha' ? c.alto : Math.max(180, i.alto + (e.clientY - i.y)),
            }));
        };

        const soltar = () => {
            inicioRef.current = null;
            setEstirando(null);
        };

        window.addEventListener('mousemove', mover);
        window.addEventListener('mouseup', soltar);

        return () => {
            window.removeEventListener('mousemove', mover);
            window.removeEventListener('mouseup', soltar);
        };
    }, [estirando]);


    //  Los oyentes van en 'window' y no en el panel: si estuvieran en el panel,
    //  al mover rápido el ratón se saldría de él y el arrastre se cortaría.
    useEffect(() => {
        if (!arrastrando) return;

        const mover = (e) => {
            const i = inicioRef.current;
            if (!i) return;

            //  Se deja siempre un trozo visible: si se pudiera arrastrar del todo
            //  fuera de la pantalla, no habría forma de traerlo de vuelta.
            const maxX = window.innerWidth - 80;
            const maxY = window.innerHeight - 40;

            setCaja(c => ({
                ...c,
                x: Math.min(maxX, Math.max(-c.ancho + 80, i.cajaX + (e.clientX - i.x))),
                y: Math.min(maxY, Math.max(0, i.cajaY + (e.clientY - i.y))),
            }));
        };

        const soltar = () => {
            //  El tamaño lo cambia el navegador con el tirador de la esquina, así
            //  que hay que leerlo del elemento: React no se entera solo.
            const el = cajaRef.current;
            if (el) setCaja(c => ({ ...c, ancho: el.offsetWidth, alto: el.offsetHeight }));

            inicioRef.current = null;
            setArrastrando(false);
        };

        window.addEventListener('mousemove', mover);
        window.addEventListener('mouseup', soltar);

        return () => {
            window.removeEventListener('mousemove', mover);
            window.removeEventListener('mouseup', soltar);
        };
    }, [arrastrando]);


    return (
        <div
            ref={cajaRef}
            hidden={!visible}
            className={`fixed z-[1000] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.6)] ${arrastrando || estirando ? 'select-none' : ''}`}
            style={{
                left: caja.x,
                top: caja.y,
                width: caja.ancho,
                height: caja.alto,
            }}
        >
            <TabletScreen
                onCerrar={onCerrar}
                onArrastrarBarra={empezarArrastre}
                nombreLocal={nombreLocal}
            />

            {/*  TIRADORES PARA AGRANDAR
                 Se salen 5 px del borde y miden 10 de ancho: pegados al borde exacto
                 eran casi imposibles de acertar, que es lo que pasaba con el de abajo
                 y el de la esquina. La marca que se ve es fina; la zona que responde
                 al ratón, mucho más generosa.

                 El de la esquina va DESPUÉS para quedar por encima de los otros dos:
                 en la zona donde se cruzan, gana el que estira en diagonal.  */}
            <div
                onMouseDown={empezarEstirado('derecha')}
                className='group absolute top-4 -right-[5px] bottom-6 w-[10px] cursor-ew-resize flex items-center justify-center'
                title='Estirar a lo ancho'
            >
                <span className='h-12 w-[3px] rounded-full bg-[#0a3a66] group-hover:bg-[#0890c0] transition-colors' />
            </div>

            <div
                onMouseDown={empezarEstirado('abajo')}
                className='group absolute left-4 right-6 -bottom-[5px] h-[10px] cursor-ns-resize flex items-center justify-center'
                title='Estirar a lo alto'
            >
                <span className='h-[3px] w-12 rounded-full bg-[#0a3a66] group-hover:bg-[#0890c0] transition-colors' />
            </div>

            {/*  La esquina lleva las rayitas de siempre, para que se vea que desde
                 ahí se agarra en las dos direcciones a la vez.  */}
            <div
                onMouseDown={empezarEstirado('esquina')}
                className='group absolute -right-[5px] -bottom-[5px] h-6 w-6 cursor-nwse-resize flex items-end justify-end p-1'
                title='Cambiar el tamaño'
            >
                <svg className='h-3.5 w-3.5 text-[#5e7ba0] group-hover:text-[#0890c0] transition-colors' viewBox='0 0 12 12'
                     fill='none' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' aria-hidden='true'>
                    <line x1='11' y1='2' x2='2' y2='11' />
                    <line x1='11' y1='7' x2='7' y2='11' />
                </svg>
            </div>
        </div>
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