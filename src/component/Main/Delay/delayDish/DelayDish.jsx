import { useState, useRef, useEffect } from 'react';
import axiosInstance from '../../../../libs/fetch_data/instanceAxios.js';
import { isMobile } from 'react-device-detect';
import { useSelector } from 'react-redux';
import { useDataUser } from '../../../../hook/useTextMenu.jsx';
import { useAlert } from '../../../../hook/useAlert';
import { Search } from '../../search/searchComponent.jsx';
import { returnTimeExceding } from '../../../../libs/date_time/time';
import { useSaveNoveltie } from '../../../../hook/useSaveNoveltie.jsx';
import { ImgBoxImg } from '../../imgBoxComponent/ImgBox';
import { useImgAlternative } from '../../../../hook/useImgAlternative.jsx';
import URL from '../../../../libs/fetch_data/api_conexion.js';

import { optionStyles } from '../../../../styles/inputs.jsx';

import useAdapterResize from '../../../../hook/adapter_resize.jsx';

import VideoComponent from '../../sendVideo/videoComponent.jsx';
import { saveVideo } from '../../../../libs/fetch_data/noveltyFecth.js';
import { sendFile } from '../../../../libs/fetch_data/multimedia.Fetching.js';
import { blobToFile } from '../../../../libs/script/64toFile.js';




function DelayDish({ awaitWindow, boxModal, reset, title }) {

    const users = useSelector(state => state.users);
    const locals = useSelector(state => state.locals);
    const alert = useAlert();
    const saveNoveltie = useSaveNoveltie();
    const TIME_EXCEDING = '00:03:00';
    const user = useRef(null);
    let [local, setLocal] = useState(null);

    const [isRequieredVideoState, setIsRequieredVideo] = useState(true);
    const [videoState, setVideoState] = useState(null);

    const [containsPlateArrayState, setContainsPlateArrayState] = useState(false);

    let [files, setFiles] = useState([]);
    let [table, setNumberTable] = useState('');
    let [description, setDescription] = useState('');
    let [time1, setTime1] = useState('');
    let [time2, setTime2] = useState('');
    let [time3, setTime3] = useState('');
    let [time4, setTime4] = useState('');
    let [timeTotal, setTimeTotal] = useState('');
    let [time, setTime] = useState('');
    let [textResult, setResult] = useState('00:00:00');
    let [dishLegaceState, setDish] = useState('');
    const [dishState, setDishState] = useState(null);


    let file1 = useRef(null);
    let file2 = useRef(null);
    let file3 = useRef(null);
    let file4 = useRef(null);

    const { htmlAdapterRef } = useAdapterResize({ breackWidth: 1350 });


    useEffect(() => {
        isMobile ? null : setLocal(local = JSON.parse(localStorage.getItem('local_appExpress'))[0]);
    }, []);

    useEffect(() => {
        setContainsPlateArrayState(Array.isArray(local?.dishes) && local?.dishes.length > 0);
    }, [local]);



    const deleteImg = text => {
        const getItems = files.filter(file => file.caption !== text);
        setFiles(files = getItems);
    };


    const sendImg = async e => {
        try {
            e.preventDefault();
            awaitWindow.open('Enviando novedad...');
            let urlVideo;
            if (videoState) {
                console.log(videoState)
                urlVideo = await saveVideo(videoState);
            }
            console.log(urlVideo);
            const data = useDataUser(user.current, local, sessionStorage.getItem('session'), localStorage.getItem('local_appExpress'));

            let text;
            const FOR_MISTER01 = `${local.franchise === 'Mister01' ? `tiempo que excede: ${returnTimeExceding(timeTotal, TIME_EXCEDING)}` : ''}`;

            const caption = [
                data.LANG === 'es' ? `toma de orden - mesa ${table}` : `order take - table ${table}`,
                data.LANG === 'es' ? `listo en tablet - mesa ${table}` : `ready in tablet - table ${table}`,
                data.LANG === 'es' ? `listo en cocina - mesa ${table}` : `ready at kitchen - table ${table}`,
                data.LANG === 'es' ? `entrega de ${dishLegaceState} - mesa ${table}` : `delivery '${dishLegaceState}' - table ${table}`,
            ];


            const awaitSite = dishState?.category === 'drinks' ? (data.LANG === 'es' ? 'barra' : 'bar') : (data.LANG === 'es' ? 'cocina' : 'kitchen'); /// define si el pedido fue listo en cocina o barra
            const plateName = containsPlateArrayState ? dishState.nameDishe : dishLegaceState; /// tipo de plato o pedido
            const typeFood = containsPlateArrayState ? dishState.category === 'drinks' ? 'drink' : plateName : data.LANG === 'es' ? 'plato' : 'plate';  /// falta de contexto


            if (data.LANG === 'es') {
                if (local.franchise === 'La Francisca') {
                    text = `*${data.localData.name}*\n_*Demora en entrega de ${plateName}*_ \nMesa ${table}\nToma de orden: ${time1}\nListo en tablet: ${time2}\nListo en ${awaitSite}: ${time3}\nEntrega de ${typeFood}: ${time4}\ndemora en entrega de ${typeFood}: ${timeTotal}\nTiempo total: ${returnTimeExceding(time4, time1)}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
                }

                else {
                    if (local.name === 'Bocas Brickell') {
                        text = `*${data.localData.name}*\n_*Demora en entrega de ${plateName}*_ \nMesa ${table}\nToma de orden: ${time1}\nListo en tablet: ${time2}\nListo en ${awaitSite}: ${time3}\nEntrega de ${typeFood}: ${time4}\ndemora en entrega de ${typeFood}: ${timeTotal}\nTiempo total: ${returnTimeExceding(time4, time1)}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
                    }
                    else {
                        text = `*${data.localData.name}*\n_*Demora en entrega de ${plateName}*_ \nMesa ${table}\nToma de orden: ${time1}\nListo en ${awaitSite}: ${time3}\nListo en tablet: ${time2}\nEntrega de ${typeFood}: ${time4}\ndemora en entrega de ${typeFood}: ${timeTotal}\nTiempo total: ${returnTimeExceding(time4, time1)}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
                    }

                }
            }
            else {
                text = `*${data.localData.name}*\n_*${plateName} delivery delay*_\nTable: ${table}\nOrder take: ${time1}\nReady in tablet: ${time2}\nReady at ${awaitSite} ${time3}\n${plateName} delivery: ${time4}\nDelay in preparation ${returnTimeExceding(timeTotal, TIME_EXCEDING)}\nTotal time: ${timeTotal}${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
            }

            const dataForRequest = {};



            const html = await useImgAlternative(htmlAdapterRef.current, htmlForImg => {
                htmlForImg.style.display = 'grid';
                htmlForImg.style.gridTemplateColumns = '1fr 1fr'
            }, false, 4);


            const resultImg = await sendFile(blobToFile(html));
            dataForRequest.imageToShare = resultImg.data.url;



            [file1.current, file2.current, file3.current, file4.current].map((file, index) => {
                if (!file) throw new Error(`Debe ingresas las imagenes correspondiente, imagen: ${index + 1}`);
                if (!dataForRequest.imageUrl) dataForRequest.imageUrl = [];
                dataForRequest.imageUrl.push({ url: file.url, caption: file.caption });
            });


            dataForRequest.title = `Demora en entrega de ${plateName}`;
            dataForRequest.table = table;
            dataForRequest.nameDish = plateName;
            dataForRequest.userName = data.userData.userName;
            dataForRequest.userId = data.userData.userId;
            dataForRequest.localName = data.localData.name;
            dataForRequest.localId = data.localData.localId;
            dataForRequest.description = `Listo en cocina ${time3}, entrega de plato ${time4} ${FOR_MISTER01}`;
            dataForRequest.menu = text;
            dataForRequest.rulesForBonus = title.rulesForBonus;
            dataForRequest.alertId = title._id;
            if (urlVideo) dataForRequest.videoUrl = urlVideo.data.url;

            dataForRequest.timePeriod = {
                tomaOrden: time1,
                listoTablet: time2,
                listoCocina: time3,
                entregaPlato: time4
            };

            const response = await axiosInstance.post(`${URL}/novelties`, dataForRequest)
            if (response.status === 200) {
                saveNoveltie.save(`Demora entrega de plato - mesa ${table}`, data.userData);
                alert.request(`Novedad en ${data.localData.name}. por validar`);
                setNumberTable(table = '');
                setFiles(files = []);
                setTime1(time1 = '');
                setTime2(time2 = '');
                setTime3(time3 = '');
                setTime4(time4 = '');
                setTimeTotal(timeTotal = '');
                setResult('00:00:00');
                boxModal.open({ title: 'Aviso', description: 'Novedad enviada' });
                reset('');
            }
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



    const recepHour = (element) => {

        if (element.id === 'toma-orden') setTime1(time1 = element.value);
        if (element.id === 'Listo-tablet') setTime2(time2 = element.value);
        if (element.id === 'listo-cocina') setTime3(time3 = element.value);
        if (element.id === 'entrega plato') setTime4(time4 = element.value);
        let hourTotal = time4.split(':')[0] - time3.split(':')[0];
        let minuteTotal = time4.split(':')[1] - time3.split(':')[1];
        let secondTotal = time4.split(':')[2] - time3.split(':')[2];

        if (secondTotal < 0) {

            secondTotal = 60 - Math.abs(secondTotal)
            --minuteTotal;
        }
        if (minuteTotal < 0) {
            minuteTotal = 60 - Math.abs(minuteTotal);
            --hourTotal;
        }
        if (minuteTotal < 10) minuteTotal = `0${minuteTotal}`
        if (secondTotal < 10) secondTotal = `0${secondTotal}`
        if (hourTotal < 9) hourTotal = `0${hourTotal}`;

        ///////////////////////////////////////////////////////////////

        let hourTime = time4.split(':')[0] - time1.split(':')[0];
        let minuteTime = time4.split(':')[1] - time1.split(':')[1];
        let secondTime = time4.split(':')[2] - time1.split(':')[2];

        if (secondTime < 0) {
            secondTime = 60 - Math.abs(secondTime);
            --secondTime;
        }

        if (minuteTime < 0) {
            minuteTime = 60 - Math.abs(minuteTime);
            --minuteTime;
        }
        if (minuteTime < 10) minuteTime = `0${minuteTime}`;

        if (secondTime < 10) secondTime = `0${secondTime}`;

        if (hourTime < 9) hourTime = `0${hourTime}`;

        setResult(textResult = ` ${isNaN(hourTotal) ? '❌' : hourTotal}:${isNaN(minuteTotal) ? '❌' : minuteTotal}:${isNaN(secondTotal) ? '❌' : secondTotal}`);

        if (!isNaN(hourTotal) && !isNaN(minuteTotal) && !isNaN(secondTotal)) {
            setTimeTotal(timeTotal = textResult);
            setTime(time = ` ${isNaN(hourTime) ? '❌' : hourTime}:${isNaN(minuteTime) ? '❌' : minuteTime}:${isNaN(secondTime) ? '❌' : secondTime}`);
        }
    };


    function catBoxImg() {
        return (
            <div className='box-imgComponenContent' ref={htmlAdapterRef} >
                <ImgBoxImg data={title.photos.caption[0]} boxModal={boxModal} setImg={files => { file1.current = files }} deleteImg={deleteImg} language={local?.lang} index_image={0} />
                <ImgBoxImg data={title.photos.caption[1]} boxModal={boxModal} setImg={files => { file2.current = files }} deleteImg={deleteImg} language={local?.lang} index_image={1} />
                <ImgBoxImg data={title.photos.caption[2]} boxModal={boxModal} setImg={files => { file3.current = files }} deleteImg={deleteImg} language={local?.lang} index_image={2} />
                <ImgBoxImg data={title.photos.caption[3]} boxModal={boxModal} setImg={files => { file4.current = files }} deleteImg={deleteImg} language={local?.lang} index_image={3} />

            </div>
        );
    };


    const setUser = id => {
        const userFill = users.filter(item => id === item._id);
        user.current = userFill[0];
    };



    const fillLocal = id => {
        const localFranchise = locals.filter(item => id === item._id);
        setLocal(local = localFranchise[0]);
    };



    function returnForm(localData) {

        const isBocas = localData.name === 'Bocas House' || localData.name === 'Bocas Weston' || localData.name === 'Bocas Orlando';

        return (
            <div className='boxDivInput box-div-imputContain'>

                <div className='box-inputContain box-static'>
                    <label className='box-label' htmlFor=""> Número de mesa
                        <input className='box-inputText' type="text" id="numero-mesa" value={table} required
                            onChange={e => {
                                setNumberTable(table = e.target.value);
                            }}
                        />
                    </label>
                    <label htmlFor="" className='box-label'>Tipo de plato
                        <select className='box-inputText' onChange={e => {
                            if (containsPlateArrayState) {
                                const dishSeleted = localData.dishes.filter(item => e.target.value === item._id);
                                setDishState(dishSeleted[0]);
                            }
                            else setDish(dishLegaceState = e.target.value)
                        }
                        }
                            required
                        >
                            <option value="">-Seleccione-</option>
                            {
                                containsPlateArrayState ?
                                    (
                                        localData.dishes.map(dishItem => (
                                            <option style={optionStyles} value={dishItem._id}>{dishItem.nameDishe}</option>
                                        ))
                                    )

                                    :
                                    (
                                        <>
                                            {
                                                isBocas ?
                                                    (
                                                        <option style={optionStyles} value="Lunch">Lunch</option>
                                                    )
                                                    :
                                                    (
                                                        null
                                                    )

                                            }
                                            {
                                                localData.dishMenu.dishEvaluation === 'completo' ?
                                                    (
                                                        <option style={optionStyles} value={localData.dishMenu.appetizer}>
                                                            {
                                                                localData.dishMenu.appetizer
                                                            }
                                                        </option>
                                                    )
                                                    :
                                                    (
                                                        null
                                                    )
                                            }
                                            <option style={optionStyles} value={localData.dishMenu.mainDish}>
                                                {
                                                    localData.dishMenu.mainDish
                                                }
                                            </option>
                                            {
                                                localData.dishMenu.dishEvaluation === 'completo' ?
                                                    (
                                                        <option style={optionStyles} value={local.dishMenu.dessert}>
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
                                                localData.name === 'Bocas Brickell' ?
                                                    (
                                                        <>
                                                            <option style={optionStyles} value='Drink'>Drink</option>
                                                            <option style={optionStyles} value='Drink bar'>Drinks bar</option>
                                                        </>
                                                    )
                                                    :
                                                    (
                                                        null
                                                    )
                                            }
                                        </>
                                    )
                            }


                        </select>
                    </label>

                    <label className='box-label' htmlFor=""> Toma de orden
                        <input className='box-inputText' type="text" id="toma-orden" value={time1} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required maxLength="8"
                            onChange={e => recepHour(e.target)}
                        />
                    </label>


                    <label htmlFor="" className='box-label'> {containsPlateArrayState ? (dishState?.category === "foods" ? 'Listo en cocina' : 'Listo en barra') : 'Listo en cocina'}
                        <input className='box-inputText' type="text" id="listo-cocina" value={time3} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required maxLength="8"
                            onChange={e => recepHour(e.target)}
                        />
                    </label>


                    <label className='box-label' htmlFor=""> Listo en tablet
                        <input className='box-inputText' type="text" id="Listo-tablet" value={time2} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required maxLength="8"
                            onChange={e => recepHour(e.target)}
                        />
                    </label>
                    <label htmlFor="" className='box-label'> Entrega de {containsPlateArrayState ? dishState?.nameDishe : dishLegaceState ? dishLegaceState : '¿?'}
                        <input className='box-inputText' type="text" id="entrega plato" value={time4} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required maxLength="8"
                            onChange={e => recepHour(e.target)}
                        />
                    </label>

                    <p className='box-textHourResult'>Tiempo total: <span>{textResult}</span></p>

                    {

                        localData.franchise === 'Mister01' ?
                            (
                                <p className='box-textHourResult'>Tiempo excedido: <span>{returnTimeExceding(timeTotal, TIME_EXCEDING)}</span></p>
                            )
                            :
                            (
                                null
                            )

                    }


                    <>
                        <label htmlFor="" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexDirection: 'column' }}>
                            <p>¿no se requiere video?</p>
                            <input type='checkbox'
                                checked={isRequieredVideoState}
                                onChange={e => {
                                    console.log(e.target.checked)
                                    if (!e.target.checked) setVideoState(null);
                                    if (e.target.checked === false) setVideoState(null);
                                    setIsRequieredVideo(e.target.checked)
                                }}
                            />
                        </label>

                        {
                            isRequieredVideoState ?
                                <VideoComponent awaitWindow={awaitWindow} boxModal={boxModal} getVideo={file => setVideoState(file)} />
                                :
                                null
                        }


                    </>




                    <label className='box-label' htmlFor=""> Nota
                        <textarea className='box-textArea' spellCheck="true" autoComplete='true' placeholder='en caso que lo amerite' cols="30" rows="10" value={description} onChange={e => setDescription(description = e.target.value)}></textarea>
                    </label>

                    <button className='btnSend' disabled={table === '' || timeTotal === '' ? true : false}>Enviar</button>
                </div>
            </div>
        );
    };



    return (
        <>
            <form className='box-send' onSubmit={e => sendImg(e)} style={{ alignContent: 'center' }}>
                <h2 style={{ color: 'rgb(92 92 92)', textDecoration: 'underline', textAlign: 'center' }}>{title.es}</h2>
                {
                    isMobile ?
                        (
                            <>
                                <div className='productionContain-headerContain' style={{ justifyContent: 'center', zIndex: '80' }} >
                                    <Search array={users} config={{ placeholder: 'Nombre del operador', key: ['name', 'userName'] }} callback={(element, reset) => { return <p onClick={e => { setUser(e.target.id); reset(e.target.textContent) }} className='speed-title' key={element._id} id={element._id} >{`${element.name} ${element.surName}`} </p> }} />
                                </div>
                            </>
                        )
                        :
                        (
                            null
                        )
                }
                {
                    isMobile ?
                        (
                            <>
                                <div className='productionContain-headerContain' style={{ justifyContent: 'center', zIndex: '40' }} >
                                    <Search array={locals} config={{ placeholder: 'Nombre del local', key: ['name'] }} callback={(element, reset) => { return <p onClick={e => { fillLocal(e.target.id); reset(e.target.textContent) }} className='speed-title' key={element._id} id={element._id} >{`${element.name}`} </p> }} />
                                </div>
                            </>
                        )
                        :
                        (
                            null
                        )

                }
                {
                    isMobile ?
                        (
                            local?.name !== undefined ?
                                (
                                    catBoxImg()
                                )
                                :
                                (
                                    null
                                )

                        )
                        :
                        (
                            catBoxImg()
                        )
                }

                {
                    local?.name !== undefined ?
                        (
                            returnForm(local)
                        )
                        :
                        (
                            null
                        )
                }
            </form>
        </>
    );
}



export { DelayDish }