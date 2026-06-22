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
import { TabletScreen } from '../tabletScreen/TabletScreen.jsx';




export function Main({ value, selectNovelty, awaitWindow, boxModal, menu }) {


    const establishment = useSelector(store => store.establishment);
    const [typeDelay, setTypeDelay] = useState({ data: null, type: '' })



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

                <div className='w-full h-[100%] min-h-0 overflow-auto rounded-xl border border-[#0a3a66]/60 bg-[#01122c]'>
                    <div className='sticky top-0 h-[45px] bg-[#021a38] flex w-full items-center justify-around'>
                        {
                            ['Mesa', 'Ocupa', 'Primera atención', 'Demora', 'Desocupa', 'Limpieza', 'Demora'].map((text) => {
                                return (
                                    <WrapperCell key={text} classStyles='h-full uppercase tracking-[0.6px] font-semibold text-[#5e7ba0] bg-[#021a38]'>{text}</WrapperCell>

                                )
                            })
                        }
                    </div>

                    <RotationLine setDelay={changeStateForm} />
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

                {
                    typeDelay.type === '1raAttention' && (
                        <div className='fixed right-0 w-[50%]  p-[52px_0_0_0] top-0 h-[100%]'>

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

                <TabletScreen />

            </main>

        </>
    );
}




function RotationLine({ setDelay }) {


    const [tableNumber, setTableNumber] = useState('');
    const [customerSeatedTime, setCustomerSeatedTime] = useState('');
    const [firtAtenttionTime, setFirtAttentionTime] = useState('');
    const timeLimit = '00:03:00';

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


            <WrapperCell classStyles='text-[#39ff14] font-semibold relative'>
                <WrapperText
                    classStyles={timeWhitTouch ? 'text-[#33486a]' : totalTime.exceeded ? 'text-[red]' : 'text-lime-500'}
                    value={timeWhitTouch ? '00:00:00' : totalTime.timeTotal}
                />

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





function WrapperText({ classStyles = '', value, updateValue, block=false }) {


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