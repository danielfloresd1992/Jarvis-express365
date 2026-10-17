import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { isTablet } from 'react-device-detect';
import { RenderDefault } from './Default/Default.jsx';
import { SendNoveltie } from './SendNovelties/SendNoveltie.jsx';
import { Delay } from './Delay/DelayComponent.jsx';
import { Production } from './production/Producction.jsx';
import { ConfigIA } from './configIA/ConfigIA.jsx';
import Pizza from './pizzaComponent/Pizza.jsx';
import FormTablet from '../for_tablet/FormTablet.jsx';
import LoadFileForm from '../for_tablet/loadImg.jsx';
import RightSidebar from '../RightSidebar/RightSidebar.jsx';
import RegisterBoard from '../RegisterBoard/RegisterBoard.jsx';


//  Lo que se abre desde el menú no sustituye a lo del centro: va en el panel de la derecha, con
//  este título, y los registers de la tablet se quedan a la vista debajo.
//  Lo único que sigue ocupando el centro son los dos formularios de la tableta del local («Demora
//  en preparación» y «Subir imagen»): allí no hay registers que dejar a la vista.
const SIDEBAR_TITLES = {
    'imagen-1': 'Novedades',
    'imagen-3': 'Demoras',
    'imagen-2': 'Producción',
    'imagen-pizza': 'Estándares de calidad',
    'config-ia': 'Servidor de IA',
};


function Main({ value, selectNovelty, closeNovelty, awaitWindow, boxModal, menu, reporteDemora, onReporteCerrado }) {



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





    // processRegister = «el local elegido tiene activado el registro de procesos» (Local.processRegister,
    // se activa en Client365). Se lee de la lista que se pide al abrir (state.locals) y no de
    // state.establishment, que es la copia guardada en el equipo al elegir el local: un cambio hecho
    // después en Client365 no llegaría hasta volver a elegirlo.
    const establishment = useSelector(state => state.establishment);
    const processRegister = useSelector(state => state.locals?.find(local => local._id === establishment?._id)?.processRegister === true);

    // home = «lo que ocupa el centro»: con el registro de procesos activado, los registers de la tablet
    // (o la bienvenida donde aquí no hay tablet: en el teléfono, o con la tablet fuera en su ventana);
    // sin él, la bienvenida.
    const welcome = <RenderDefault selectNovelty={selectNovelty} />;
    const home = processRegister ? <RegisterBoard fallback={welcome} /> : welcome;


    const render = (value) => {

        switch (value) {
            case 'imagen-1': return (<SendNoveltie titlesJson={menu.filter(menu => menu.category !== 'delay' && menu.es !== 'Servicio Pick Up')} awaitWindow={awaitWindow} boxModal={boxModal} reset={selectNovelty} key='imagen-1' />);
            case 'imagen-2': return (<Production awaitWindow={awaitWindow} boxModal={boxModal} reset={selectNovelty} key='imagen-2' title={menu.filter(menu => menu.es === 'Empleado realiza producción')[0]} />);
            case 'imagen-3': return (<Delay titlesJson={menu.filter(menu => menu.category === 'delay')} awaitWindow={awaitWindow} boxModal={boxModal} reset={selectNovelty} reporteDemora={reporteDemora} onReporteCerrado={onReporteCerrado} key='imagen-3' />);
            case 'imagen-4': return (<PickUp awaitWindow={awaitWindow} boxModal={boxModal} title={menu.filter(menu => menu.es === 'Servicio Pick Up')[0]} reset={selectNovelty} key='imagen-4' />)

            case 'imagen-pizza': return (<Pizza awaitWindow={awaitWindow} boxModal={boxModal} title={menu.filter(menu => menu.es === 'Estándares de calidad')[0]} reset={selectNovelty} key='imagen-4' />)
            //configuración
            case 'config-ia': return (<ConfigIA key='config-ia' />);
            case 'delayTabletForTablet': return (<FormTablet awaitWindow={awaitWindow} boxModal={boxModal} title={menu.filter(menu => menu.es === 'Demora en preparación de plato')[0]} reset={selectNovelty} key='imagen-6' />);
            case 'loadImage': return (<LoadFileForm awaitWindow={awaitWindow} boxModal={boxModal} reset={selectNovelty} key='imagen-47' />);
            default: return home;
        }
    };



    //  Con una demora del register abierta en «Demoras» (su reloj rojo), la cabecera dice cuál: su tipo y su mesa.
    //  Al enviarla o cerrarla, Home suelta el reporte y vuelve a decir «Demoras».
    const reportTitle = value === 'imagen-3' && reporteDemora
        ? `Demora de ${reporteDemora.tipo === 'limpieza' ? 'limpieza' : 'primera atención'} · mesa ${reporteDemora.tableNumber || '?'}`
        : null;
    const sidebarTitle = reportTitle ?? SIDEBAR_TITLES[value];

    return (
        <main className="main-content">
            {sidebarTitle ? home : render(value)}

            {sidebarTitle && (
                <RightSidebar title={sidebarTitle} onClose={closeNovelty}>
                    {render(value)}
                </RightSidebar>
            )}
        </main>
    );
}

export { Main };