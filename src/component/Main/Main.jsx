import { useState, useEffect } from 'react';
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
import calculateTime from '@/libs/date_time/calculate_time.js';




export function Main({ value, selectNovelty, awaitWindow, boxModal, menu }) {



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





    const render = (value) => {

        switch (value) {
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



    const establishment = useSelector(store => store.establishment);

    console.log(establishment);


    return (
        <main className="main-content">
            <div className='w-full border border-[#0a3a66] rounded-[12px] overflow-hidden bg-[#01122c]'>
                <div className='flex w-full items-center justify-around'>
                    {
                        ['Mesa', 'Ocupa', 'Primera atención', 'Demora', 'Desocupa', 'Limpieza', 'Demora'].map((text) => {
                            return (
                                <WrapperCell key={text} classStyles='uppercase  border-[#044e84] bg-[#021a38]'>{text}</WrapperCell>

                            )
                        })
                    }
                </div>

                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
                <RotationLine />
            </div>
        </main>
    );
}




function RotationLine({ }) {


    const [tableNuumber, setTableNumber] = useState('');
    const [customerSeated, setCustomerSeated] = useState('');
    const [firtAtenttion, setFirtAttention] = useState('');
    const timeLimit = '00:03:00';

    const handdlerContextMenu = e => {
        e.preventDefault();
    };



    return (
        <div className='flex w-full items-center justify-around'>
            <WrapperCell classStyles='bg-[#0e1223]'>
                <WrapperText
                    classStyles='text-white'
                    value={tableNuumber}
                    updateValue={(value) => setTableNumber(value)}
                />
            </WrapperCell>

            <WrapperCell classStyles='bg-[#0e1223]'>
                <WrapperText 
                    value={customerSeated}
                    updateValue={(value) => setCustomerSeated(value)}
                />
            </WrapperCell>

            <WrapperCell classStyles='bg-[#0e1223]'>
                <WrapperText 
                    value={firtAtenttion}
                    updateValue={(value) => setFirtAttention(value)}
                />
            </WrapperCell>

            <WrapperCell classStyles='bg-[#0e1223]'>
                <WrapperText value={calculateTime(customerSeated, firtAtenttion)} />
            </WrapperCell>


            <WrapperCell classStyles='bg-[#0e1223]'>
                <WrapperText value='00:00:00' />
            </WrapperCell>

            <WrapperCell classStyles='bg-[#0e1223]'>
                <WrapperText value='00:00:00' />
            </WrapperCell>

            <WrapperCell classStyles='bg-[#0e1223]'>
                <WrapperText value='00:00:00' />
            </WrapperCell>
        </div>
    )
}




function WrapperCell({ classStyles = '', children }) {
    return (
        <div className={`cursor-pointer flex-1 text-[#5e7ba0] h-[26px] flex items-center justify-center text-[12px] font-bold tracking-[0.8px]  border-b border-b-[#0a3a66] text-center leading-[1.15] border-r border-r-[#0a3a66]/45 ${classStyles}`}>
            {children}
        </div>
    );
}


function WrapperText({ classStyles = '', value, updateValue }) {


    const handdlerClick = () => {
        updateValue(getBiteDAte())
    };



    return (
        <div className='w-full h-full flex items-center justify-center' onClick={handdlerClick}>
        
            <p className={`text-[#6aff6e]  font-bold tracking-[0.3px] font-mono tabular-nums ${classStyles}`}>{value === '' ? '-' : value}</p>
     
        </div>
    )
}



function getBiteDAte() {
    const ahora = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}`;
}