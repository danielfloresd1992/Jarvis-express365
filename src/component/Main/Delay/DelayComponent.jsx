import plate from '../../../../public/ico/restaurant/restaurant.svg';
import serviseSvg from '../../../../public/ico/cleaning_services/cleaning_services.svg';
import book from '../../../../public/ico/menubook/menubook.svg';
import food from '../../../../public/ico/food.svg';
import tablet from '../../../../public/ico/tablet/tablet.svg';
import touchTablet from '../../../../public/ico/icons8-panel-táctil-100.png';
import tiketIco from '../../../../public/ico/icons8-boleto-100.png'
import { useState, createElement } from 'react';
import { DivAttention } from './first_attention/Div_first_attention.jsx';
import { DelayDish } from './delayDish/DelayDish.jsx';
import { Divclear } from './clean/DivClear.jsx';
import { Servises } from './servise/servise.jsx';
import { TabletDelay } from './tablet/tablet.jsx';
import TabletTouch from './tabletTouch/tablet_touch.jsx';
import ErrorTiket from './error_tiket/ErrorTiket.jsx'



function Delay({ titlesJson, awaitWindow, boxModal, reset }) {

    let [title, setTitle] = useState([]);


    // (<Delay titlesJson={menu.filter(menu => menu.category === 'delay')} awaitWindow={awaitWindow} boxModal={boxModal} reset={selectNovelty} key='imagen-3' />);

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
            <div className='delay-grid'>
                <BottonSelection title='Primera atención'              ico={book}        id='primera atención'   event={setTitle} />
                <BottonSelection title='Limpieza'                      ico={serviseSvg}  id='limpieza'           event={setTitle} />
                <BottonSelection title='Servicio'                      ico={food}        id='servicio'           event={setTitle} />
                <BottonSelection title='Entrega de plato'              ico={plate}       id='plato'              event={setTitle} />
                <BottonSelection title='Tablet'                        ico={tablet}      id='tablet'             event={setTitle} />
                <BottonSelection title='Marcada antes de estar listo'  ico={touchTablet} id='tablet-touch'       event={setTitle} />
                <BottonSelection title='Error de tiket'                ico={tiketIco}    id='tablet-tiket'       event={setTitle} />
                <BottonSelection title='Plato no comandado'            ico='/ico/icons8-transaccion-rechazada-100.png' id='tablet-no-comanda' event={setTitle} />
            </div>
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



