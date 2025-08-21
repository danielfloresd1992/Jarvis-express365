//import './style.css';
import { useState, useRef, useEffect } from 'react';
import axiosInstance from '../../../../libs/fetch_data/instanceAxios.js';
import { isMobile } from 'react-device-detect';
import { useSelector } from 'react-redux';
import { useAlert } from '../../../../hook/useAlert';
import { Search } from '../../search/searchComponent.jsx';
import { returnTimeExceding } from '../../../../libs/date_time/time';
import { useDataUser } from '../../../../hook/useTextMenu.jsx';
import { useSaveNoveltie } from '../../../../hook/useSaveNoveltie.jsx';
import { ImgBoxImg } from '../../imgBoxComponent/ImgBox';
import { TABLET_RULES, checkTime } from './model.js';
import URL from '../../../../libs/fetch_data/api_conexion.js';
import useAdapterResize from '../../../../hook/adapter_resize.jsx';


import { TableInput, TikekInput } from '../../../keysInputs/tableNumber.jsx';
import DishInputSelet from '../../../keysInputs/dishInput.jsx'
import PrintErrorDish from '../../../print_error/PrintErrorDishTime.jsx';



function TabletDelay({ awaitWindow, boxModal, reset, title: noveltyConfig }) {

    const seletedEstableshment = useSelector(state => state.establishment);
    const users = useSelector(state => state.users);
    const locals = useSelector(state => state.locals);
    const { htmlAdapterRef } = useAdapterResize({ breackWidth: 1350 });
    const config = {
        hiddenBoxText: true,
        edit: true
    }

    const alert = useAlert();
    const saveNoveltie = useSaveNoveltie();

    const user = useRef(null);
    const [dish, setDish] = useState(null);

    let [tiket, setTiket] = useState('');
    let [local, setLocal] = useState(null);

    let [files, setFiles] = useState([null]);
    let [table, setNumberTable] = useState('');

    let [time1, setTime1] = useState('');
    let [time2, setTime2] = useState('');
    let [time3, setTime3] = useState('');
    let [time4, setTime4] = useState('');

    const [correspondingTimesState, setCorrespondingTimesState] = useState(false);
    let [description, setDescription] = useState('');


    //LISTO DESDE TABLET
    const delayPreparationTable = returnTimeExceding(time2, time1);
    //LISTO DESDE COCINA
    const delayPreparationInKichen = returnTimeExceding(time3, time1);
    // TOTAL HASTA LA ENTREGA
    const timeTotalDelay = returnTimeExceding(time4, time1);
    //CALCULO PARA VALIDAR TIEMPO
    const timeDelaySubtraction = checkTime(dish, delayPreparationTable);
    //PARA EL TEXTO DEL MENU



    useEffect(() => {
        isMobile ? null : setLocal(local = JSON.parse(localStorage.getItem('local_appExpress'))[0]);
    }, []);



    const pushImg = file => {
        setFiles([file]);
    };


    const deleteImg = text => {
        const getItems = files.filter(file => file.caption !== text);
        setFiles(files = getItems);
    };




    const sendImgForm = async e => {
        try {
            e.preventDefault();
            awaitWindow.open('Enviando novedad...');

            if (!dish) throw new Error('Seleccione el tipo de plato');

            const data = useDataUser(user.current, local, sessionStorage.getItem('session'), localStorage.getItem('local_appExpress'));
            const text = assemble_text({
                localName: local?.name,
                dish: dish,
                ticket: tiket,
                table: table,
                takeOrder: time1,
                readtTable: time2,
                readyKichen: time3,
                delivery: time4,
                delayPreparationTable: delayPreparationTable,
                timeTotalDelay: timeTotalDelay,
                timeDelaySubtraction: timeDelaySubtraction,
                correspondingTimes: correspondingTimesState
            }, local?.lang);


            let dataForRequest = {};

            files.forEach((data) => {
                if (!data) throw new Error(`Debe ingresas las imagenes correspondiente, imagen: ${index + 1}`)
                if (!dataForRequest.imageUrl) dataForRequest.imageUrl = [];
                dataForRequest.imageUrl.push({ url: data.url, caption: data.caption });
            });

            //  const repsonseData = await sendFile(blobToFile(files[0].file));
            dataForRequest.imageToShare = dataForRequest.imageUrl[0].url;


            dataForRequest.title = `Demora de ${dish.nameDishe}`;
            dataForRequest.table = table;
            dataForRequest.nameDish = dish.nameDishe;
            dataForRequest.userName = data.userData.userName;
            dataForRequest.userId = data.userData.userId;
            dataForRequest.localName = data.localData.name;
            dataForRequest.localId = data.localData.localId;
            dataForRequest.description = `Demora en preparación de ${dish.nameDishe}, tiempo total: ${timeTotalDelay}, ${timeDelaySubtraction.timeExceeding}`
            dataForRequest.menu = text;
            dataForRequest.rulesForBonus = noveltyConfig.rulesForBonus;
            dataForRequest.alertId = noveltyConfig?._id;
            dataForRequest.numberTiket = tiket;
            dataForRequest.timePeriod = {
                tomaOrden: time1,
                listoTablet: time2,
                listoCocina: time3,
                entregaPlato: time4
            };


            axiosInstance.post(`${URL}/novelties`, dataForRequest)
                .then(response => {
                    console.log(response);
                    if (response.status === 200) {
                        saveNoveltie.save(`Demora de tablet - mesa ${table}`, data.userData);
                        alert.request(`demora de tablet en ${data.localData.name}. por validar`);
                        setNumberTable('');
                        setFiles(files => files = []);
                        setTime1(time1 = '');
                        setTime2(time2 = '');
                        setDish(null);
                        boxModal.open({ title: 'Aviso', description: 'Novedad enviada' });
                        reset();
                    }
                })
                .catch(err => {
                    console.log(err);
                    const error = err;
                    boxModal.open({ title: 'Error', description: error });
                })
                .finally(() => {
                    awaitWindow.close();
                });
        }
        catch (error) {
            console.log(error);
            if (error.message) boxModal.open({ title: 'Error', description: error.message });

            else boxModal.open('Error', error);
        }
        finally {
            awaitWindow.close();
        }
    };




    return (
        <>
            <form className='box-send' onSubmit={e => sendImgForm(e)}>
                <h2 style={{ color: 'rgb(92 92 92)', textDecoration: 'underline', textAlign: 'center' }}>Demora de tablet</h2>



                <div className='box-imgComponenContent' ref={htmlAdapterRef}>
                    {
                        noveltyConfig.photos.caption.map(iteration => (
                            <ImgBoxImg data={iteration} boxModal={boxModal} setImg={pushImg} deleteImg={deleteImg} key={iteration.index} language={local?.lang} config={config} />

                        ))
                    }
                </div>



                <div className='box-inputContain box-div-imputContain'
                    style={{
                        gap: '2rem',
                    }}
                >

                    <TikekInput
                        value={tiket}
                        onChangeEvent={(value) => setTiket(value)}
                    />

                    <TableInput
                        value={table}
                        onChangeEvent={(value) => setNumberTable(value)}
                    />

                    <DishInputSelet
                        value={dish}
                        onChangeEvent={(dish) => setDish(dish)}
                        dishes={seletedEstableshment?.dishes}
                    />

                    <label className='box-label' htmlFor=""> Toma de orden
                        <input className='box-inputText' type="text" id="toma-orden" value={time1} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required maxLength="8"
                            onChange={e => setTime1(e.target.value)}
                        />
                    </label>


                    <label className='box-label' htmlFor=""> Listo en tablet
                        <input className='box-inputText' type="text" id="Listo-tablet" value={time2} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required maxLength="8"
                            onChange={e => setTime2(e.target.value)}
                        />
                    </label>


                    <label htmlFor="" className='box-label'> Listo en cocina
                        <input className='box-inputText' type="text" id="listo-cocina" value={time3} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required maxLength="8"
                            onChange={e => setTime3(e.target.value)}
                        />
                    </label>



                    <label htmlFor="" className='box-label'> Entrega de plato
                        <input className='box-inputText' type="text" id="entrega plato" value={time4} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required maxLength="8"
                            onChange={e => setTime4(e.target.value)}
                        />
                    </label>

                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '1rem 0', gap: '.5rem' }}>
                        <p className='box-textHourResult'>Tiempo total en cocina: <span>{delayPreparationInKichen}</span></p>
                        <p className='box-textHourResult'>Tiempo total en tablet: <span>{delayPreparationTable}</span></p>
                        <p className='box-textHourResult'>Tiempo total en entrega de plato: <span>{timeTotalDelay}</span></p>

                        <p className='box-textHourResult'>Tiempo excedido: {timeDelaySubtraction.timeExceeding}</p>
                        {
                            !(timeDelaySubtraction.approval) && timeDelaySubtraction.timeExceeding !== '00:00:00' ?
                                <PrintErrorDish dish={dish} />
                                :
                                null
                        }
                    </div>


                    <label htmlFor="" className='box-label' style={{ textAlign: 'center' }}>¿estuvo dentro de los tiempos correspondientes?
                        <br />
                        <p style={{ textAlign: 'center' }}>('no fue marcada en pantalla')</p>
                        <input className='box-inputText' type="checkbox" value={correspondingTimesState}
                            onChange={e => setCorrespondingTimesState(e.target.checked)}
                        />
                    </label>
                    {
                        correspondingTimesState ?
                            <h1 style={{ color: '#000' }}>Si</h1>
                            :
                            <h1 style={{ color: '#000' }}>No</h1>
                    }



                    <br />
                    <label className='box-label' htmlFor="">Nota
                        <textarea className='box-textArea' spellCheck="true" autoComplete='true' placeholder='en caso que lo amerite' cols="30" rows="10" value={description} onChange={e => setDescription(description = e.target.value)}></textarea>
                    </label>

                    <button className='btnSend' disabled={!(timeDelaySubtraction.ignore) && !(timeDelaySubtraction.approval)} >Enviar</button>

                </div>
            </form>
        </>
    );
}

export { TabletDelay }



function assemble_text({ localName, dish, ticket, table, takeOrder, readtTable, delayPreparationTable, readyKichen, delivery, timeTotalDelay, timeDelaySubtraction, correspondingTimes }, lang) {

    const localNameText = `*${localName}*\n`;
    const headerText = lang === 'es' ? `_*Demora en preparación de ${dish?.nameDishe}*_\n` : `_*${dish?.nameDishe} preparation delay*_\n`;
    const ticketText = ticket !== '' ? lang === 'es' ? `Ticket: #${ticket}\n` : `Ticket: #${ticket}\n` : '';
    const tableText = table !== '' ? lang === 'es' ? `Mesa: ${table}\n` : `Table: ${table}\n` : '';
    const takeOrderText = lang === 'es' ? `Toma de orden: ${takeOrder}\n` : `Orden Take: ${takeOrder}\n`;
    const readtTableText = lang === 'es' ? `Listo en tablet: ${readtTable}\n` : `Ready in tablet: ${readtTable}\n`;
    const readyKichenText = lang === 'es' ? `Listo en cocina: ${readyKichen}\n` : `Ready in kitchen: ${readyKichen}\n`;
    const deliveryDushText = lang === 'es' ? `Entrega de ${dish?.nameDishe}: ${delivery}\n` : `${dish?.nameDishe} delivery: ${delivery}\n`;
    const TIME_DELAY_SUBTRACTION_MENU = ''//dish?.showDelaySubtraction ? `${lang === 'es' ? 'tiempo que excede' : `${dish?.nameDishe} in preparation`}: ${timeDelaySubtraction.timeExceeding}\n` : ''
    const delayPreparationTableText = lang === 'es' ? `Demora en preparación: ${delayPreparationTable}\n` : `delay in preparation: ${timeDelaySubtraction.timeExceeding}\n`;
    const timeTotalText = lang === 'es' ? `Tiempo total: ${timeTotalDelay}` : localName === 'Mister Mizner' ? `Total time: ${timeTotalDelay}` : '';

    const corresponding = correspondingTimes ?
        lang === 'es' ?
            '\nNota: La orden estuvo dentro de los tiempos correspondientes, sin embargo no fue marcada en pantalla al momento, por tal motivo siguió corriendo el tiempo y se registra la demora en nuestro sistema, quedamos atentos a sus comentarios.'
            : '\nNote : The order was completed within the expected time frame; however, it was not marked on screen at the appropriate moment.As a result, the timer continued running and the delay was recorded in our system.We remain available for any comments or feedback you may have.'
        :
        ''


    return `${localNameText}${headerText}${ticketText}${tableText}${takeOrderText}${readtTableText}${readyKichenText}${deliveryDushText}${delayPreparationTableText}${TIME_DELAY_SUBTRACTION_MENU}${timeTotalText}${corresponding}`;
}   