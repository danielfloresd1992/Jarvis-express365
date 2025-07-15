import plate from '../../../../public/ico/restaurant/restaurant.svg';
import serviseSvg from '../../../../public/ico/cleaning_services/cleaning_services.svg';
import book from '../../../../public/ico/menubook/menubook.svg';
import food from '../../../../public/ico/food.svg';
import tablet from '../../../../public/ico/tablet/tablet.svg';
import touchTablet from '../../../../public/ico/icons8-panel-táctil-100.png';
import tiketIco from '../../../../public/ico/icons8-boleto-100.png'
import { useState } from 'react';
import { DivAttention } from './first_attention/Div_first_attention.jsx';
import { DelayDish } from './delayDish/DelayDish.jsx';
import { Divclear } from './clean/DivClear.jsx';
import { Servises } from './servise/servise.jsx';
import { TabletDelay } from './tablet/tablet.jsx';
import TabletTouch from './tabletTouch/tablet_touch.jsx';
import ErrorTiket from './error_tiket/ErrorTiket.jsx'



function Delay({ titlesJson, awaitWindow, boxModal, reset }) {

    let [title, setTitle] = useState([]);




    if (titlesJson.length < 1) return null;

    const render = text => {
        switch (text) {
            case 'primera atención': return <DivAttention awaitWindow={awaitWindow} boxModal={boxModal} reset={resetTitle} title={titlesJson[0]} />;
            case 'limpieza': return <Divclear awaitWindow={awaitWindow} boxModal={boxModal} reset={resetTitle} title={titlesJson[1]} />;
            case 'servicio': return <Servises awaitWindow={awaitWindow} boxModal={boxModal} reset={resetTitle} title={titlesJson[2]} />;
            case 'plato': return <DelayDish awaitWindow={awaitWindow} boxModal={boxModal} reset={resetTitle} title={titlesJson[3]} />;
            case 'tablet': return <TabletDelay awaitWindow={awaitWindow} boxModal={boxModal} reset={resetTitle} title={titlesJson[4]} />;
            case 'tablet-touch': return <TabletTouch awaitWindow={awaitWindow} boxModal={boxModal} reset={resetTitle} title={titlesJson.filter(item => item._id === '67893e1e35aa90710e005d09')} />
            case 'tablet-tiket': return <ErrorTiket awaitWindow={awaitWindow} boxModal={boxModal} reset={resetTitle} title={titlesJson.filter(item => item._id === '67fe7590e3a4f498308de7e1')} />;
            default: null;
                break;
        }
    };

    const resetTitle = () => {
        setTitle(title = []);
        render('');
    };

    return (
        <>
            <div className='textIncident' style={{ width: '100%' }}>
                <div className='textIncident-btnContain'>
                    <button className='textIncident-btn' id='primera atención' onClick={e => setTitle(title = e.currentTarget.id)} >
                        <img src={book} alt="" className='textIncident-btnImg' />
                    </button>
                    <span className='textIncident-btnText'>Demora de primera atención</span>
                </div>

                <div className='textIncident-btnContain'>
                    <button className='textIncident-btn' id='limpieza' onClick={e => setTitle(title = e.currentTarget.id)}>
                        <img src={serviseSvg} alt="" className='textIncident-btnImg' />
                    </button>
                    <span className='textIncident-btnText'>Demora de limpieza</span>
                </div>

                <div className='textIncident-btnContain' >
                    <button className='textIncident-btn' id='servicio' onClick={e => setTitle(title = e.currentTarget.id)}>
                        <img src={food} alt="" className='textIncident-btnImg' />
                    </button>
                    <span className='textIncident-btnText'>Demora de servicio</span>
                </div>

                <div className='textIncident-btnContain' >
                    <button className='textIncident-btn' id='plato' onClick={e => setTitle(title = e.currentTarget.id)}>
                        <img src={plate} alt="" className='textIncident-btnImg' />
                    </button>
                    <span className='textIncident-btnText'>Demora en entrega de plato</span>
                </div>

                <div className='textIncident-btnContain' >
                    <button className='textIncident-btn' id='tablet' onClick={e => setTitle(title = e.currentTarget.id)}>
                        <img src={tablet} alt="" className='textIncident-btnImg' />
                    </button>
                    <span className='textIncident-btnText'>Demora de tablet</span>
                </div>

                <div className='textIncident-btnContain' >
                    <button className='textIncident-btn' id='tablet-touch' onClick={e => setTitle(title = e.currentTarget.id)}>
                        <img src={touchTablet} alt="" className='textIncident-btnImg' />
                    </button>
                    <span className='textIncident-btnText'>Marcada en pantalla antes de estar listo</span>
                </div>


                <div className='textIncident-btnContain' >
                    <button className='textIncident-btn' id='tablet-tiket' onClick={e => setTitle(title = e.currentTarget.id)}>
                        <img src={tiketIco} alt="" className='' />
                    </button>
                    <span className='textIncident-btnText'>Error de tiket en toasd</span>
                </div>
            </div>

            {
                render(title)
            }
        </>
    );
}

export { Delay };