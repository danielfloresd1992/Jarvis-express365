import { useSelector } from 'react-redux';
import { useState, useRef, useEffect } from 'react';
import useAdapterResize from '../../../../hook/adapter_resize.jsx'
//import { useTextMenu } from '../../../../hook/useTextMenu.jsx';
import { useImgAlternative } from '../../../../hook/useImgAlternative.jsx';
import { useAlert } from '../../../../hook/useAlert.jsx';
import { useSaveNoveltie } from '../../../../hook/useSaveNoveltie.jsx';
import returnTimeExceding from '../../../../libs/date_time/calculate_time.js';

import VideoComponent from '../../sendVideo/videoComponent.jsx';
import { saveVideo } from '../../../../libs//fetch_data/noveltyFecth.js';
import { ImgBoxImg } from '../../imgBoxComponent/ImgBox.jsx';

import { setNovelty } from '../../../../libs//fetch_data/noveltyFecth.js';
import calculateTime from '../../../../libs/date_time/calculate_time.js';

import { sendFile } from '../../../../libs//fetch_data/multimedia.Fetching.js';
import { blobToFile } from '../../../../libs/script/64toFile.js';




export default function TabletTouch({ awaitWindow, boxModal, reset, title }) {

    if (title.length < 1) return null;


    const [fileState, setFileState] = useState([null, null]);
    const [isRequieredVideoState, setIsRequieredVideo] = useState(true)
    const [videoState, setVideoState] = useState(null);
    const keySubmit = useRef(true);
    const dish = useRef('');
    const seletedEstableshment = useSelector(state => state.establishment);
    const user = useSelector(state => state.user);

    const alert = useAlert();
    const saveNoveltie = useSaveNoveltie();


    const { htmlAdapterRef } = useAdapterResize({ breackWidth: 1350 });

    let [time1, setTime1] = useState('');
    let [time2, setTime2] = useState('');
    let [time3, setTime3] = useState('');
    let [time4, setTime4] = useState('');
    let [table, setNumberTable] = useState('');



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

                if (dish.current === '') throw new Error('Selecione el tipo de plato');

                if (isRequieredVideoState && !videoState) throw new Error('Complete el video de la alerta, o desactive el video');

                const dataForRequest = {};
                let text = '';


                if (videoState) videoUrl = await saveVideo(videoState);


                if (videoUrl) dataForRequest.videoUrl = videoUrl.data.url;

                const html = await useImgAlternative(htmlAdapterRef.current);

                const responseUrl = await sendFile(blobToFile(html));
                dataForRequest.imageToShare = responseUrl.data.url;


                if (seletedEstableshment.lang === 'es') {
                    text = `*${seletedEstableshment.name}*\n_*Demora en preparación de ${dish.current}*_\nMesa: ${table}\nTome de orden: ${time1}\nListo en tablet: ${time3}\nListo en cocina: ${time2}\nEntrega de ${dish.current}: ${time4}\nTiempo en preparación en Toast: ${returnTimeExceding(time1, time3)}\nNota: La orden fue sacada de pantalla antes de estar lista en cocina. Tiempo real de preparación: ${returnTimeExceding(time1, time2)}`;
                }
                else {
                    if (seletedEstableshment.name === 'Mister Boca Ratón') {

                        text = '';
                    }
                    else {
                        text = '';
                    }
                }

                dataForRequest.title = `Demora de ${dish.current} "marcada en pantalla antes de tiempo"`;
                dataForRequest.table = table;
                dataForRequest.nameDish = dish.current;
                dataForRequest.userName = `${user.name} ${user.surName}`;
                dataForRequest.userId = user._id;
                dataForRequest.localName = seletedEstableshment.name;
                dataForRequest.localId = seletedEstableshment._id;
                dataForRequest.description = `Demora en preparación de ${dish.current}, tiempo total: ${calculateTime(time1, time2)}`;
                dataForRequest.menu = text;
                dataForRequest.alertId = title[0]._id;
                dataForRequest.rulesForBonus = title[0].rulesForBonus;
                dataForRequest.timePeriod = {
                    tomaOrden: time1,
                    listoTablet: time3,
                    listoCocina: time2,
                    entregaPlato: time4
                };


                const response = await setNovelty(dataForRequest);

                saveNoveltie.save(`Demora de tablet - mesa ${table}`, user.surName);
                alert.request(`demora de tablet en ${seletedEstableshment.name}. por validar`);
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





                <label className='box-label' htmlFor=""> Número de mesa
                    <input className='box-inputText' type="text" id="table" value={table} required
                        onChange={e => {
                            setNumberTable(table = e.target.value);
                        }}
                    />
                </label>


                <label htmlFor="" className='box-label'>Tipo de plato
                    <select
                        className='box-inputText'
                        onChange={e => { dish.current = e.target.value }}
                        required
                        defaultValue={null}
                    >
                        <option value={null} selected disabled={true}>--Selecione--</option>
                        {
                            seletedEstableshment.dishes.length > 0 ?
                                seletedEstableshment.dishes.map(items => (
                                    <option key={items._id} value={items.nameDishe} style={{ color: '#000', backgroundColor: '#fff' }}>{items.nameDishe}</option>

                                ))
                                :
                                <>
                                    {
                                        localData.dishMenu.dishEvaluation === 'completo' ?
                                            (
                                                <option value={local.dishMenu.dessert}>
                                                    {
                                                        localData.dishMenu.dessert
                                                    }
                                                </option>
                                            )
                                            :
                                            (
                                                null
                                            )
                                    }
                                    {
                                        localData.name === 'Bocas Brickell' || localData.name === 'Dando la Brasa' ?
                                            (
                                                <>
                                                    <option value='Drink'>Drink</option>
                                                    <option value='Drink bar'>Drink bar</option>
                                                    <option value='Cafe'>Cafe</option>
                                                    <option value='Uber Eats'>Uber Eats</option>
                                                    <option value='Grup hub'>Grup hub</option>
                                                    <option value='Door Dash'>Door Dash</option>
                                                    <option value='Postmates'>Postmates</option>
                                                    <option value='Take Out'>Take Out</option>
                                                </>
                                            )
                                            :
                                            (
                                                null
                                            )
                                    }
                                    {
                                        localData.name === 'Mister Turtle Creek' || localData.name === 'Mister Boca Ratón' ?
                                            (
                                                <option value='Dessert'>Dessert</option>
                                            )
                                            :
                                            (
                                                null
                                            )
                                    }
                                </>
                        }


                    </select>
                </label>

                <label className='box-label' htmlFor=""> Toma de orden
                    <input className='box-inputText' type="text" id="toma-orden" value={time1} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required maxLength="8"
                        onChange={e => setTime1(e.target.value)}
                    />
                </label>


                <label htmlFor="" className='box-label'> Listo en cocina
                    <input className='box-inputText' type="text" id="listo-cocina" value={time2} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required maxLength="8"
                        onChange={e => setTime2(e.target.value)}
                    />
                </label>


                <label className='box-label' htmlFor=""> Listo en tablet
                    <input className='box-inputText' type="text" id="Listo-tablet" value={time3} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required maxLength="8"
                        onChange={e => setTime3(e.target.value)}
                    />
                </label>


                <label htmlFor="" className='box-label'> Entrega de plato
                    <input className='box-inputText' type="text" id="entrega plato" value={time4} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required maxLength="8"
                        onChange={e => setTime4(e.target.value)}
                    />
                </label>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '1rem 0' }}>
                    <p className='box-textHourResult'>Tiempo total en cocina: <span>{time1 && time2 ? returnTimeExceding(time1, time2) : ''}</span></p>
                    <p className='box-textHourResult'>Tiempo total en tablet: <span>{time1 && time3 ? returnTimeExceding(time1, time3) : ''}</span></p>
                    <p className='box-textHourResult'>Tiempo total en entrega de plato: <span>{time1 && time4 ? returnTimeExceding(time1, time4) : ''}</span></p>
                </div>

                <button className='btnSend'>Enviar</button>

            </div>
        </form >
    );
}