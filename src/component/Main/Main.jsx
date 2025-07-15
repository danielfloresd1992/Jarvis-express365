import { useEffect } from 'react';
import { isDesktop, isTablet } from 'react-device-detect';
import { RenderDefault } from './Default/Default.jsx';
import { SendNoveltie } from './SendNovelties/SendNoveltie.jsx';
import { SendVideo } from './sendVideo/sendVideo.jsx';
import { Delay } from './Delay/DelayComponent.jsx';
import { Production } from './production/Producction.jsx';
import { PickUp } from './pickUp/PickUp.jsx';
import { ShowManager } from './showManager/ShowManager.jsx';
import Pizza from './pizzaComponent/Pizza.jsx';
import FormTablet from '../for_tablet/FormTablet.jsx';
import LoadFileForm from '../for_tablet/loadImg.jsx';


function Main({ value, selectNovelty, awaitWindow, boxModal, menu }){

   

    useEffect(() => {
        if(isTablet && document.documentElement?.requestFullscreen){
            document.documentElement.requestFullscreen()
            .then(() => {
                if(screen?.orientation){
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

    



    const render = (value) => {

        switch (value) {
            case 'imagen-1': return(<SendNoveltie titlesJson={ menu.filter(menu => menu.category !== 'delay' && menu.es !== 'Servicio Pick Up') } awaitWindow={ awaitWindow } boxModal={ boxModal } reset={ selectNovelty } key='imagen-1' />);
            case 'imagen-2': return(<Production awaitWindow={ awaitWindow } boxModal={ boxModal } reset={ selectNovelty } key='imagen-2' title={ menu.filter(menu => menu.es === 'Empleado realiza producción' )[0]}/>);
            case 'imagen-3': return(<Delay titlesJson={ menu.filter(menu => menu.category === 'delay') } awaitWindow={ awaitWindow } boxModal={ boxModal } reset={ selectNovelty } key='imagen-3' />);
            case 'imagen-4': return(<PickUp awaitWindow={ awaitWindow } boxModal={ boxModal } title={ menu.filter(menu => menu.es === 'Servicio Pick Up' )[0] } reset={ selectNovelty } key='imagen-4' />)
            case 'video-2': return(<SendVideo titlesJson={ menu.filter(menu => menu.category !== 'delay') } awaitWindow={ awaitWindow } boxModal={ boxModal } reset={ selectNovelty } key='video-2' />);
            case 'imagen-pizza': return(<Pizza awaitWindow={ awaitWindow } boxModal={ boxModal } title={ menu.filter(menu => menu.es === 'Estándares de calidad' )[0] } reset={ selectNovelty } key='imagen-4' />)
            //info
            case 'show-manager': return( <ShowManager key='show-manager' /> );
            case 'delayTabletForTablet': return(<FormTablet awaitWindow={ awaitWindow } boxModal={ boxModal } title={ menu.filter(menu => menu.es === 'Demora en preparación de plato' )[0] } reset={ selectNovelty } key='imagen-6' />);
            case 'loadImage': return(<LoadFileForm awaitWindow={ awaitWindow } boxModal={ boxModal }  reset={ selectNovelty } key='imagen-47' />);
            default: return(<RenderDefault/>)
        }
    };

    

    return(
        <>
            <main className="mainComponent" style={{ width: isDesktop || isTablet ? 'calc(100% - 300px)' : '100%', left: '0', position: 'relative' }}>
                { 
                    render(value)
                }
            </main>
        </>
    );
}

export { Main };