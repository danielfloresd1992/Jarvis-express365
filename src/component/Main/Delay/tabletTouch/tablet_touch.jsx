import { useSelector } from 'react-redux';
import { useState, useRef, useEffect } from 'react';
import useAdapterResize from '../../../../hook/adapter_resize.jsx'
//import { useTextMenu } from '../../../../hook/useTextMenu.jsx';
import { useImgAlternative } from '../../../../hook/useImgAlternative.jsx';
import { useAlert } from '../../../../hook/useAlert.jsx';
import { useSaveNoveltie } from '../../../../hook/useSaveNoveltie.jsx';
import { returnTimeExceding } from '@/libs/date_time/time';

import VideoComponent from '../../sendVideo/videoComponent.jsx';
import { saveVideo } from '../../../../libs//fetch_data/noveltyFecth.js';
import { ImgBoxImg } from '../../imgBoxComponent/ImgBox.jsx';

import { setNovelty } from '../../../../libs//fetch_data/noveltyFecth.js';
import calculateTime from '../../../../libs/date_time/calculate_time.js';

import { sendFile } from '../../../../libs//fetch_data/multimedia.Fetching.js';
import { blobToFile } from '../../../../libs/script/64toFile.js';
import FormLayaut from '@/component/layaut/form_layaut';

import { TableInput, TikekInput } from '@/component/keysInputs/tableNumber';
import DishInputSelet from '@/component/keysInputs/dishInput.jsx'

import { checkTime } from '../tablet/model.js';



export default function TabletTouch({ awaitWindow, boxModal, reset, title }) {

    if (title.length < 1) return null;


    const [fileState, setFileState] = useState([null, null]);
    const [isRequieredVideoState, setIsRequieredVideo] = useState(true)
    const [videoState, setVideoState] = useState(null);
    const keySubmit = useRef(true);

    const seletedEstableshment = useSelector(state => state.establishment);
    const user = useSelector(state => state.user);
    const [dish, setDish] = useState('');
    let [table, setNumberTable] = useState('');
    let [tiket, setTiket] = useState('');
    const alert = useAlert();
    const saveNoveltie = useSaveNoveltie();


    const { htmlAdapterRef } = useAdapterResize({ breackWidth: 1350 });

    let [time1, setTime1] = useState(''); //TOMA DE ORDEN
    let [time2, setTime2] = useState(''); //LISTO EN TABLET
    let [time3, setTime3] = useState(''); //LISTO EN COCINA
    let [time4, setTime4] = useState(''); //ENTREGA DE PLATO


    //LISTO DESDE TABLET
    const delayPreparationTable = returnTimeExceding(time2, time1);
    //LISTO DESDE COCINA
    const delayPreparationInKichen = returnTimeExceding(time3, time1);
    // TOTAL HASTA LA ENTREGA
    const timeTotalDelay = returnTimeExceding(time4, time1);
    //CALCULO PARA VALIDAR TIEMPO
    //const timeDelaySubtraction = checkTime(dish, delayPreparationTable);
    //PARA EL TEXTO DEL MENU


    const handlerSubmit = async e => {
        try {
            e.preventDefault();
            if (keySubmit.current) {
                keySubmit.current = false;
                awaitWindow.open('Enviando novedad...');

                let videoUrl;
                fileState.forEach(items => {
                    if (items === null) throw new Error('Complete todas las imagenes del formulario');
                });

                if (dish === '') throw new Error('Selecione el tipo de plato');

                if (isRequieredVideoState && !videoState) throw new Error('Complete el video de la alerta, o desactive el video');

                const dataForRequest = {};
                let text = '';


                if (videoState) videoUrl = await saveVideo(videoState);


                if (videoUrl) dataForRequest.videoUrl = videoUrl.data.url;

                const html = await useImgAlternative(htmlAdapterRef.current);

                const responseUrl = await sendFile(blobToFile(html));
                dataForRequest.imageToShare = responseUrl.data.url;


                if (seletedEstableshment.lang === 'es') {
                    text = `*${seletedEstableshment.name}*\n_*Demora en preparación de ${dish}*_\nMesa: ${table}${tiket ?? `Ticket: #${tiket}`}\nTome de orden: ${time1}\nListo en tablet: ${time2}\nListo en cocina: ${time3}\nEntrega de ${dish}: ${time4}\nTiempo en preparación en Toast: ${delayPreparationTable}\nNota: La orden fue sacada de pantalla antes de estar lista en cocina. Tiempo real de preparación: ${delayPreparationInKichen}`;
                }
                else {
                    if (seletedEstableshment.name === 'Mister Boca Ratón') {

                        text = '';
                    }
                    else {
                        text = '';
                    }
                }

                dataForRequest.title = `Demora de ${dish} "marcada en pantalla antes de tiempo"`;
                dataForRequest.table = table;
                dataForRequest.nameDish = dish;
                dataForRequest.userName = `${user.name} ${user.surName}`;
                dataForRequest.userId = user._id;
                dataForRequest.localName = seletedEstableshment.name;
                dataForRequest.localId = seletedEstableshment._id;
                dataForRequest.description = `Demora en preparación de ${dish}, tiempo total: ${calculateTime(time1, time2)}`;
                dataForRequest.menu = text;
                dataForRequest.alertId = title[0]._id;
                dataForRequest.rulesForBonus = title[0].rulesForBonus;
                dataForRequest.timePeriod = {
                    tomaOrden: time1,
                    listoTablet: time3,
                    listoCocina: time3,
                    entregaPlato: time4
                };


                const response = await setNovelty(dataForRequest);

                saveNoveltie.save(`Demora de tablet - mesa ${table}`, user.surName);
                boxModal.open({ title: 'Aviso', description: 'Novedad enviada' });
                reset();
            }
        }
        catch (error) {
            console.log(error);
            if (error?.message) boxModal.open({ title: 'Error', description: error.message });
            else boxModal.open({ title: 'Error', description: error });
        }
        finally {
            awaitWindow.close();
            keySubmit.current = true;
        }
    };






    return (
        <form
            className='box-send'
            onSubmit={handlerSubmit}
            style={{ minHeight: '100%', width: '100%', alignContent: 'center' }}
        >
            <div>
                <h2 style={{ color: 'rgb(92 92 92)', textDecoration: 'underline', textAlign: 'center' }}>{'Demora de tablet '}</h2>
                <p style={{ color: 'rgb(92 92 92)', textAlign: 'center', fontSize: '.9rem' }}>marcada en pantalla antes de etar listo en cocina</p>
            </div>

            <div className='box-imgComponenContent' style={{ zoom: window.innerWidth < 1350 ? ((window.innerWidth / 1350) - 0.1).toString() : '1' }} ref={htmlAdapterRef}>
                {
                    title[0].photos.caption.map((iteration, index) => (

                        <ImgBoxImg
                            data={iteration}
                            boxModal={boxModal}
                            setImg={img => {
                                const files = [...fileState];
                                files[index] = img;
                                setFileState(files);
                            }}

                            deleteImg={() => {
                                const files = [...fileState];
                                files[index] = null;
                                setFileState(files);
                            }}
                        />
                    ))
                }
            </div>



            <div className='box-inputContain box-div-imputContain'>

                <>
                    <label htmlFor="" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexDirection: 'column' }}>
                        <p>¿no se requiere video?</p>
                        <input type='checkbox'
                            checked={isRequieredVideoState}
                            onChange={e => {
                                if (!e.target.checked) setVideoState(null);
                                if (e.target.checked === false) setVideoState(null);
                                setIsRequieredVideo(e.target.checked)
                            }}
                        />
                    </label>

                    {
                        isRequieredVideoState ?
                            <div className='box-imgComponenContent'>
                                <VideoComponent awaitWindow={awaitWindow} boxModal={boxModal} getVideo={(video) => { setVideoState(video) }} />
                            </div>
                            :
                            null
                    }
                </>




                <TikekInput
                    value={tiket}
                    onChangeEvent={(value) => setTiket(value)}
                />

                <TableInput
                    value={table}
                    onChangeEvent={(value) => setNumberTable(value)}
                />

                <DishInputSelet
                    value={dish.current}
                    onChangeEvent={(dish) => {
                        setDish(dish.nameDishe);
                    }}
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

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '1rem 0' }}>
                    <p className='box-textHourResult'>Tiempo total en cocina: <span>{delayPreparationInKichen}</span></p>
                    <p className='box-textHourResult'>Tiempo total en tablet: <span>{delayPreparationTable}</span></p>
                    <p className='box-textHourResult'>Tiempo total en entrega de plato: <span>{timeTotalDelay}</span></p>
                </div>


                <button className='btnSend'>Enviar</button>

            </div>
        </form >
    );
}