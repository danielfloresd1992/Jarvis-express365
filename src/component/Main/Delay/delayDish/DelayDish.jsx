import { useState, useRef, useEffect } from 'react';
import sessionAxios from '../../../../libs/fetch_data/sessionAxios.js';
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


import VideoComponent from '../../sendVideo/videoComponent.jsx';
import { saveVideo } from '../../../../libs/fetch_data/noveltyFecth.js';
import { sendFile } from '../../../../libs/fetch_data/multimedia.Fetching.js';
import { blobToFile } from '../../../../libs/script/64toFile.js';

import FormLayaut from '@/component/layaut/form_layaut';
import DishInputSelet from '@/component/keysInputs/dishInput.jsx'
import TimeTrack, { TrackNote, isClock } from '@/component/inputs/TimeTrack.jsx';
import LimitBar from '@/component/inputs/LimitBar.jsx';
import AddonField from '@/component/inputs/AddonField.jsx';
import SwitchRow from '@/component/inputs/SwitchRow.jsx';
import { exceedsLimit } from '@/libs/date_time/timeLimit.js';



function DelayDish({ awaitWindow, boxModal, reset, title }) {

    const users = useSelector(state => state.users);
    const sessionUser = useSelector(state => state.user);
    const locals = useSelector(state => state.locals);
    const seletedEstableshment = useSelector(state => state.establishment);

    const alert = useAlert();
    const saveNoveltie = useSaveNoveltie();
    const TIME_EXCEDING = '00:03:00';
    const user = useRef(null);
  

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

    const htmlAdapterRef = useRef(null);



    useEffect(() => {
        setContainsPlateArrayState(Array.isArray(seletedEstableshment?.dishes) && seletedEstableshment?.dishes.length > 0);
    }, [seletedEstableshment]);



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
            const data = useDataUser(user.current, seletedEstableshment, sessionUser, localStorage.getItem('local_appExpress'));

            let text;
            const FOR_MISTER01 = `${seletedEstableshment.franchise === 'Mister01' ? `tiempo que excede: ${returnTimeExceding(timeTotal, TIME_EXCEDING)}` : ''}`;

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
                if (seletedEstableshment.franchise === 'La Francisca') {
                    text = `*${data.localData.name}*\n_*Demora en entrega de ${plateName}*_ \nMesa ${table}\nToma de orden: ${time1}\nListo en tablet: ${time2}\nListo en ${awaitSite}: ${time3}\nEntrega de ${typeFood}: ${time4}\ndemora en entrega de ${typeFood}: ${timeTotal}\nTiempo total: ${returnTimeExceding(time4, time1)}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
                }

                else {
                    if (seletedEstableshment.name === 'Bocas Brickell') {
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

            const response = await sessionAxios.post(`${URL}/novelties`, dataForRequest)
            if (response.status === 200) {
                saveNoveltie.save(`Demora entrega de plato - mesa ${table}`, data.userData);
                
                setNumberTable(table = '');
                setFiles(files = []);
                setTime1(time1 = '');
                setTime2(time2 = '');
                setTime3(time3 = '');
                setTime4(time4 = '');
                setTimeTotal(timeTotal = '');
                setResult('00:00:00');
                boxModal.sent({ menu: title, table });
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
            <div className='box-imgComponenContent gridx4' ref={htmlAdapterRef} >
                <ImgBoxImg data={title.photos.caption[0]} boxModal={boxModal} setImg={files => { file1.current = files }} deleteImg={deleteImg} language={seletedEstableshment?.lang} index_image={0} />
                <ImgBoxImg data={title.photos.caption[1]} boxModal={boxModal} setImg={files => { file2.current = files }} deleteImg={deleteImg} language={seletedEstableshment?.lang} index_image={1} />
                <ImgBoxImg data={title.photos.caption[2]} boxModal={boxModal} setImg={files => { file3.current = files }} deleteImg={deleteImg} language={seletedEstableshment?.lang} index_image={2} />
                <ImgBoxImg data={title.photos.caption[3]} boxModal={boxModal} setImg={files => { file4.current = files }} deleteImg={deleteImg} language={seletedEstableshment?.lang} index_image={3} />

            </div>
        );
    };


    const setUser = id => {
        const userFill = users.filter(item => id === item._id);
        user.current = userFill[0];
    };



   

    function returnForm(localData) {

        const isBocas = localData.name === 'Bocas House' || localData.name === 'Bocas Weston' || localData.name === 'Bocas Orlando';

        // readySite = «dónde se pone listo»: en barra si el plato de la carta es una bebida (category 'drinks'), y en cocina
        // todo lo demás, también antes de elegirlo. Es la misma regla que el mensaje ('awaitSite'). Antes la etiqueta
        // comparaba con 'foods', que no es una categoría del modelo (food, drinks, desserts_and_sweets): cualquier plato
        // salía «Listo en barra».
        const readySite = dishState?.category === 'drinks' ? 'Listo en barra' : 'Listo en cocina';

        // dishName = «el plato», el nombre que tiene en la carta del local (Local.dishes) o en el menú antiguo; hasta que se
        // elige, «plato» (antes «¿?»)
        const dishName = (containsPlateArrayState ? dishState?.nameDishe : dishLegaceState) || 'plato';

        // deliveryLate = «la entrega pasó de su límite»: solo los locales de Mister01 lo tienen (TIME_EXCEDING)
        const deliveryLate = localData.franchise === 'Mister01' && isClock(time3) && isClock(time4) && exceedsLimit(textResult.trim(), TIME_EXCEDING);

        // sinceOrder = «la nota de una hora: lo que tardó desde la toma de orden», o qué falta para saberlo
        const sinceOrder = (time, text) => (
            isClock(time1) && isClock(time)
                ? <TrackNote duration={returnTimeExceding(time, time1)}>{text}</TrackNote>
                : <TrackNote tone='pending'>{isClock(time1) ? 'Falta esta hora' : 'Falta la toma de orden'}</TrackNote>
        );

        return (
            <div className='boxDivInput box-div-imputContain'>

                <div className='box-inputContain box-static'>
                    {/*  Propuesta «C · Línea de tiempo» (elegida por el usuario): mesa y plato en una fila, con la etiqueta
                         pegada. El plato sigue siendo su lista de siempre (la carta o el menú antiguo del local): solo
                         cambia la caja.  */}
                    <div className='ff-row ff-row--table-dish'>
                    <AddonField id='entrega-mesa' label='Mesa' value={table} onChange={value => setNumberTable(table = value)} required />
                    <div className='ff-addon ff-addon--select'>
                        <label className='ff-addon__label' htmlFor='entrega-tipo-plato'>Plato</label>
                        <select id='entrega-tipo-plato' className='ff-addon__control' onChange={e => {
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
                                                localData.dishMenu?.dishEvaluation === 'completo' ?
                                                    (
                                                        <option style={optionStyles} value={localData.dishMenu?.appetizer}>
                                                            {
                                                                localData.dishMenu?.appetizer
                                                            }
                                                        </option>
                                                    )
                                                    :
                                                    (
                                                        null
                                                    )
                                            }
                                            <option style={optionStyles} value={localData.dishMenu?.mainDish}>
                                                {
                                                    localData.dishMenu?.mainDish
                                                }
                                            </option>
                                            {
                                                localData.dishMenu?.dishEvaluation === 'completo' ?
                                                    (
                                                        <option style={optionStyles} value={seletedEstableshment.dishMenu?.dessert}>
                                                            {
                                                                localData.dishMenu?.dessert
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
                        <svg className='ff-addon__chevron' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                            <path d='M6 9l6 6 6-6' />
                        </svg>
                    </div>
                    </div>

                    {/*  Las cuatro horas sobre el recorrido del pedido, en el orden de siempre. 'recepHour' recibe el id y
                         el valor, como recibía el campo: con ellos calcula la demora de la entrega (de listo a entrega).  */}
                    <TimeTrack
                        title='Recorrido del pedido'
                        steps={[
                            { id: 'toma-orden', label: 'Toma de orden', value: time1, onChange: value => recepHour({ id: 'toma-orden', value }), note: <TrackNote tone='pending'>Empieza a contar</TrackNote> },
                            { id: 'listo-cocina', label: readySite, value: time3, onChange: value => recepHour({ id: 'listo-cocina', value }), note: sinceOrder(time3, 'desde la toma de orden') },
                            { id: 'Listo-tablet', label: 'Listo en tablet', value: time2, onChange: value => recepHour({ id: 'Listo-tablet', value }), note: sinceOrder(time2, 'desde la toma de orden') },
                            {
                                id: 'entrega-plato',
                                label: `Entrega de ${dishName}`,
                                value: time4,
                                onChange: value => recepHour({ id: 'entrega plato', value }),
                                late: deliveryLate,
                                note: isClock(time3) && isClock(time4)
                                    ? <TrackNote tone={deliveryLate ? 'late' : 'plain'} duration={textResult.trim()}>{`desde ${readySite.toLowerCase()}`}{isClock(time1) ? ` · ${returnTimeExceding(time4, time1)} en total` : ''}</TrackNote>
                                    : <TrackNote tone='pending'>{isClock(time3) ? 'Falta esta hora' : `Falta ${readySite.toLowerCase()}`}</TrackNote>,
                            },
                        ]}
                    />

                    {/*  Solo los locales de la franquicia Mister01 tienen un límite para la entrega (como antes, cuando solo
                         ellos veían «Tiempo excedido»)  */}
                    {
                        localData.franchise === 'Mister01' && (
                            <LimitBar
                                title='Entrega, contra el límite'
                                elapsed={isClock(time3) && isClock(time4) ? textResult.trim() : ''}
                                limit={TIME_EXCEDING}
                            />
                        )
                    }


                    <>
                        <SwitchRow
                            id='vc-requiere-video'
                            title='Adjuntar video'
                            description='El video va con la novedad, además de las imágenes'
                            checked={isRequieredVideoState}
                            onChange={checked => {
                                if (!checked) setVideoState(null);
                                setIsRequieredVideo(checked);
                            }}
                        />

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

                </div>
            </div>
        );
    };


    console.log(dishState);
    console.log(seletedEstableshment);


    return (
        <FormLayaut title={title.es} event={e => sendImg(e)} >

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
                        seletedEstableshment?.name !== undefined ?
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
                seletedEstableshment?.name !== undefined ?
                    (
                        returnForm(seletedEstableshment)
                    )
                    :
                    (
                        null
                    )
            }
        </FormLayaut>
    );
}



export { DelayDish }