import axiosInstance from '../../../libs/fetch_data/instanceAxios.js';
import { useState, useRef, useEffect } from 'react';
import { useAlert } from '../../../hook/useAlert';
import { useSaveNoveltie } from '../../../hook/useSaveNoveltie';
import { useDataUser } from '../../../hook/useTextMenu';
import { ImgComponent } from './ImageComponent.jsx';
import { Search } from '../search/searchComponent.jsx';
import { isMobile } from 'react-device-detect';
import { useSelector } from 'react-redux';

import useAdapterResize from '../../../hook/adapter_resize.jsx';
import { useTextMenu } from '../../../hook/useTextMenu';
import { useImgAlternative } from '../../../hook/useImgAlternative.jsx';

import CarsSelect from '../../inputs/InputCar.jsx';
import URL from '../../../libs/fetch_data/api_conexion.js';
import { sendFailedDvr, removeFailedDvr } from '../../../libs/fetch_data/failedRequest.js';

import VideoComponent from '../sendVideo/videoComponent.jsx'
import { saveVideo } from '../../../libs/fetch_data/noveltyFecth.js';
import calculateTime from '../../../libs/date_time/calculate_time.js';
import { sendFile } from '../../../libs/fetch_data/multimedia.Fetching.js';
import { blobToFile } from '../../../libs/script/64toFile.js';





function SendNoveltie({ titlesJson, awaitWindow, boxModal, reset }) {


    const alert = useAlert();
    const saveNoveltieList = useSaveNoveltie();

    const users = useSelector(state => state.users);
    const locals = useSelector(state => state.locals);

    const keySubmit = useRef(true);

    let [title, setTitle] = useState([]);
    let [files, setFiles] = useState([]);
    const [isRequieredVideoState, setIsRequieredVideo] = useState(true);
    const [videoState, setVideoState] = useState(null);
    let [table, setTable] = useState('');
    const [tableNeeded, setTableNeeded] = useState(true);
    let [time1, setTime1] = useState('');
    let [time2, setTime2] = useState('');
    let [local, setLocal] = useState(null);


    let [description, setDescription] = useState('');
    const [amountState, setAmountState] = useState('');
    const [car, setCar] = useState(null);
    const [person, setPerson] = useState(null);
    const [area, setArea] = useState(null);
    const ref = useRef(null);
    const user = useRef(null);
    const { htmlAdapterRef } = useAdapterResize({ breackWidth: 1350 });




    useEffect(() => {
        isMobile ? null : setLocal(local = JSON.parse(localStorage.getItem('local_appExpress'))[0]);
    }, []);



    if (videoState) saveVideo(videoState).then((url) => console.log(url))



    const handlerSubmit = async e => {
        try {
            e.preventDefault();
            if (keySubmit.current) {
                keySubmit.current = false;


                awaitWindow.open('Guardando información');



                let dataForRequest = {};
                const data = useDataUser(user.current, local, sessionStorage.getItem('session'), localStorage.getItem('local_appExpress'));
                const LANG = local.lang;
                const localData = local;
                let urlVideo;

                const menu = useTextMenu({
                    localData,
                    LANG,
                    title: title,
                    amountState,
                    table,
                    time1,
                    time2,
                    textResult: calculateTime(time1 ?? '', time2 ?? ''),
                    ref,
                    description,
                    car,
                    person,
                    area,

                });


                if (videoState) urlVideo = await saveVideo(videoState);


                files.map((file, index) => {
                    if (!file) throw new Error(`Debe ingresas las imagenes correspondiente, imagen: ${index + 1}`)

                    if (dataForRequest.imageUrl) {
                        dataForRequest.imageUrl.push({ url: file.url, caption: file.caption });
                    }
                    else {
                        dataForRequest.imageUrl = [];
                        dataForRequest.imageUrl.push({ url: file.url, caption: file.caption });
                    }

                });
                console.log(files)

                if (title[0].photos.caption.length > 1) {
                    const html = await useImgAlternative(htmlAdapterRef.current, async (htmlForImg) => {
                    }, false, files.length > 3 ? 2 : files.length);


                    const newFile = blobToFile(html);

                    const resultImg = await sendFile(newFile);
                    dataForRequest.imageToShare = resultImg.data.url;
                }
                else {
                    dataForRequest.imageToShare = files[0].url;
                }


                dataForRequest.title = `${title[0].es}${table !== '' ? ` - Mesa: ${table}` : ''}`;
                dataForRequest.amount = amountState;
                dataForRequest.userName = data.userData.userName;
                dataForRequest.table = table;
                dataForRequest.userId = data.userData.userId;
                dataForRequest.localName = data.localData.name;
                dataForRequest.localId = data.localData.localId;
                dataForRequest.description = description;
                dataForRequest.menu = menu;

                dataForRequest.rulesForBonus = title[0].rulesForBonus;
                dataForRequest.alertId = title[0]._id;

                if (title[0].time) {
                    dataForRequest.timePeriod = { init: time1, end: time2 };
                }

                if (urlVideo) dataForRequest.videoUrl = urlVideo.data.url;

                const response = await axiosInstance.post(`${URL}/novelties`, dataForRequest);

                if (response.status === 200) {
                    sendFailedDvr, removeFailedDvr
                    // falla de conexion con dvr
                    if (title[0]._id === '640f7c747d44282c3f625d79') {
                        sendFailedDvr({
                            date: new Date,
                            localName: data.localData.name,
                            idLocal: data.localData.localId,
                            title: title[0].es,
                            buffer_img: files[0].image[1]
                        });
                    }
                    if (title[0]._id === '6417181494525c2ce4fc98aa') {
                        removeFailedDvr({ date: new Date, localName: data.localData.name, idLocal: data.localData.localId, title: title[0].es });
                    }

                    saveNoveltieList.save(title[0].es, data.userData);
                    alert.request(`Novedad en ${data.localData.name}. por validar`);
                    setTitle(title = []);
                    setTable(table = '');
                    setFiles([]);
                    setTime1('');
                    setTime2('');
                    setDescription('');
                    user.current = null;
                    setLocal(local = null);
                    ref.current = null;
                    boxModal.open({ title: 'Aviso', description: 'Novedad enviada' });
                    keySubmit.current = true;
                    reset('');
                }
            }
        }
        catch (error) {
            console.log(error);
            if (error.message) boxModal.open({ title: 'Error', description: error.message });

            else boxModal.open('Error', error);
        }
        finally {
            awaitWindow.close();
            keySubmit.current = true;
        }
    };


    const setUser = id => {
        const userFill = users.filter(item => id === item._id);
        user.current = userFill[0];
    };


    const fillLocal = id => {
        const localFranchise = locals.filter(item => id === item._id);
        localStorage.setItem('local_appExpress', JSON.stringify(localFranchise));
        setLocal(local = localFranchise[0]);
    };


    const setTitleObject = (id) => {
        setVideoState(null);
        const fillTitle = titlesJson.filter(objectNoveltie => id === objectNoveltie._id);
        setTitle(title = fillTitle);
        setFiles(fillTitle[0].photos.caption.map(item => undefined));
    };



    const printImg = () => {

        return (
            <div className='box-div-imgContain' style={{ zoom: window.innerWidth < 1350 ? ((window.innerWidth / 1350) - 0.1).toString() : '1' }} ref={htmlAdapterRef}>
                {
                    title[0].photos.caption.map((img, index) => (

                        <ImgComponent
                            saveImg={file => {
                                file.caption = img[local.lang]
                                const arrState = [...files]
                                arrState[index] = file;
                                setFiles(arrState);
                            }}
                            data={img}
                            deleteFile={() => {
                                //removeFile
                                const arrState = [...files]
                                arrState[index] = undefined;
                                setFiles(arrState);
                            }}
                            boxModal={boxModal}
                            key={img.index}
                        />
                    ))
                }
            </div>
        );
    };


    return (

        <form
            className='box-send'
            onSubmit={e => handlerSubmit(e)}
            style={{ minHeight: '100%', width: '100%', alignContent: 'center' }}
        >
            <div
                className='productionContain-headerContain'
                style={{ justifyContent: 'center', flexDirection: 'column', margin: '0 auto' }}
            >
                <Search
                    array={titlesJson}
                    config={{
                        placeholder: 'Titulo de la novedad',
                        key: ['es']
                    }
                    }
                    callback={(element, reset) => {
                        return (
                            <p
                                onClick={e => {
                                    setTitleObject(e.target.id);
                                    reset(e.target.textContent);
                                }
                                }
                                className='speed-title'
                                key={element._id}
                                id={element._id}
                            >{element.es}
                            </p>
                        )
                    }
                    }
                />
            </div>


            {
                isMobile ?
                    (
                        <>
                            <div
                                className='productionContain-headerContain'
                                style={{ justifyContent: 'center', zIndex: '80' }}
                            >
                                <Search
                                    array={users}
                                    config={{ placeholder: 'Nombre del operador', key: ['name', 'userName'] }}
                                    callback={(element, reset) => { return <p onClick={e => { setUser(e.target.id); reset(e.target.textContent) }} className='speed-title' key={element._id} id={element._id} >{`${element.name} ${element.surName}`} </p> }}
                                />
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
                            <div
                                className='productionContain-headerContain'
                                style={{ justifyContent: 'center', zIndex: '40' }}
                            >
                                <Search
                                    array={locals}
                                    config={{ placeholder: 'Nombre del local', key: ['name'] }}
                                    callback={(element, reset) => {
                                        return <p onClick={e => {
                                            fillLocal(e.target.id); reset(e.target.textContent)
                                        }
                                        }
                                            className='speed-title'
                                            key={element._id}
                                            id={element._id}
                                        >{`${element.name}`}
                                        </p>
                                    }}
                                />
                            </div>


                        </>
                    )
                    :
                    (
                        null
                    )
            }
            {
                local && title.length > 0 ?

                    <>
                        <h3 className='box-div-title' >{title[0].es}</h3>

                        {
                            printImg()
                        }


                        <div className='box-div-imputContain'>

                            {
                                title[0].table === true ?  //tableNeeded, setTableNeeded
                                    <>
                                        <label htmlFor="" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexDirection: 'column' }}>
                                            <p>¿no se necesita numero de mesa?</p>
                                            <input type='checkbox'
                                                checked={tableNeeded}
                                                onChange={e => {
                                                    console.log(e.target.checked)
                                                    setTableNeeded(e.target.checked)
                                                }}
                                            />
                                        </label>

                                        {
                                            tableNeeded ?
                                                <label className='box-label' style={{ color: '#fff' }} > Número de mesa
                                                    <input
                                                        className='box-inputText'
                                                        type="text"
                                                        id="inicio"
                                                        value={table}
                                                        required
                                                        onChange={e => setTable(table = e.target.value)}
                                                    />
                                                </label>
                                                :
                                                null
                                        }

                                    </>
                                    :

                                    null

                            }
                            {
                                title[0].amountOfSomething ?
                                    <>
                                        <label className='box-label' style={{ color: '#fff' }} >Cantidad total
                                            <input
                                                className='box-inputText'
                                                type="number"
                                                id="inicio"
                                                value={amountState}
                                                required
                                                onChange={e => setAmountState(e.target.value)}
                                            />
                                        </label>
                                    </>

                                    :
                                    null
                            }
                            {
                                title[0].time === true ?
                                    (
                                        <>
                                            <h2>Tiempo de la novedad</h2>
                                            <label className='box-label' style={{ color: '#fff' }} > Inició
                                                <input
                                                    className='box-inputText'
                                                    type="text" id="inicio"
                                                    value={time1}
                                                    required
                                                    pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$"
                                                    onChange={e => setTime1(e.target.value)}
                                                />
                                            </label>

                                            <label className='box-label' style={{ color: '#fff' }} > Finalizó
                                                <input
                                                    className='box-inputText'
                                                    type="text"
                                                    id="fin"
                                                    value={time2}
                                                    required
                                                    pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$"
                                                    onChange={e => setTime2(e.target.value)}
                                                />
                                            </label>


                                            <p className='box-textHourResult' style={{ color: '#fff' }} >Tiempo total: <span>{calculateTime(time1, time2)}</span></p>
                                        </>
                                    )
                                    :
                                    (
                                        null
                                    )
                            }
                            {
                                title.length > 0 && title[0].timeUnique === true ?
                                    (
                                        <>
                                            <h2>Tiempo de la novedad</h2>
                                            <label className='box-label' style={{ color: '#fff' }} > {title[0].especial?.time?.timeUnique ? title[0].especial?.time?.timeUnique[LANG] : 'Hora'}
                                                <input
                                                    className='box-inputText'
                                                    type="text"
                                                    id="inicio"
                                                    value={ref.current}
                                                    required pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$"
                                                    onChange={e => ref.current = e.target.value}
                                                />
                                            </label>
                                        </>
                                    ) :
                                    (
                                        null
                                    )
                            }

                            {
                                Boolean(title[0].car) ?
                                    (
                                        <>
                                            <CarsSelect changueInput={car => setCar(car)} lang={local.lang} imagenCompare={files[0]?.image ? files[0].image[1] : null} />
                                            <hr />
                                        </>
                                    )
                                    :
                                    (null)
                            }

                            {
                                title[0].isDescriptionPerson ?
                                    (
                                        <>
                                            <h2>Descripción de la persona</h2>
                                            <label className='box-label' style={{ color: '#fff' }} > Genero
                                                <select
                                                    className='box-inputText'
                                                    style={
                                                        {
                                                            textAlign: 'left'
                                                        }
                                                    }
                                                    required
                                                    onChange={
                                                        e => {
                                                            setPerson({ ...person, gender: e.target.value })
                                                        }
                                                    }
                                                >
                                                    <option value=''>Selecione</option>
                                                    <option value={local.lang === 'es' ? 'dama' : 'lady'}>Dama</option>
                                                    <option value={local.lang === 'es' ? 'caballero' : 'glentmen'}>Caballero</option>
                                                </select>
                                            </label>
                                            <label
                                                className='box-label' style={{ color: '#fff' }} > Tipo de prenda de la persona
                                                <select
                                                    className='box-inputText'
                                                    style={
                                                        {
                                                            textAlign: 'left'
                                                        }
                                                    }
                                                    required
                                                    onChange={
                                                        e => {
                                                            setPerson({ ...person, garment: e.target.value })
                                                        }
                                                    }
                                                >
                                                    <option value=''>Selecione</option>
                                                    <option value={local.lang === 'es' ? 'suéter' : 'sweater'}>Sueter</option>
                                                    <option value={local.lang === 'es' ? 'chaqueta' : 'jacket'}>Chaqueta</option>
                                                    <option value={local.lang === 'es' ? 'camisa' : 'shirt'}>Camisa</option>
                                                    <option value={local.lang === 'es' ? 'vestido' : 'dress'}>Vestido</option>
                                                </select>
                                            </label>
                                            <label
                                                className='box-label' style={{ color: '#fff' }} > Color la prenda
                                                <select
                                                    className='box-inputText'
                                                    style={
                                                        {
                                                            textAlign: 'left'
                                                        }
                                                    }
                                                    required
                                                    onChange={
                                                        e => {
                                                            setPerson({ ...person, color: e.target.value })
                                                        }
                                                    }
                                                >
                                                    <option value=''>Selecione</option>
                                                    <option value={local.lang === 'es' ? 'negro' : 'black'}>negro</option>
                                                    <option value={local.lang === 'es' ? 'blanco' : 'white'}>blanco</option>
                                                    <option value={local.lang === 'es' ? 'verde' : 'green'}>verde</option>
                                                    <option value={local.lang === 'es' ? 'amarillo' : 'yellow'}>amarillo</option>
                                                    <option value={local.lang === 'es' ? 'azul' : 'blue'}>azul</option>
                                                    <option value={local.lang === 'es' ? 'rojo' : 'red'}>rojo</option>
                                                    <option value='beige'>beige</option>
                                                    <option value={local.lang === 'es' ? 'marron' : 'brown'}>marron</option>
                                                    <option value={local.lang === 'es' ? 'rosa' : 'pink'}>rosa</option>
                                                    <option value={local.lang === 'es' ? 'gris' : 'grey'}>gris</option>
                                                    <option value={local.lang === 'es' ? 'dorado' : 'golden'}>dorado</option>
                                                    <option value={local.lang === 'es' ? 'vinotinto' : 'burgundy'}>vinotinto</option>
                                                    <option value={local.lang === 'es' ? 'naranja' : 'orange'}>naranja</option>
                                                </select>
                                            </label>
                                        </>
                                    )
                                    :
                                    (null)
                            }

                            {
                                title[0].isArea ?
                                    (
                                        <>
                                            <h2>Área de la incidencia</h2>
                                            <label className='box-label' style={{ color: '#fff' }} > Área
                                                <select
                                                    className='box-inputText'
                                                    style={
                                                        {
                                                            textAlign: 'left'
                                                        }
                                                    }
                                                    required
                                                    onChange={
                                                        e => {
                                                            setArea(e.target.value)
                                                        }
                                                    }
                                                >
                                                    <option value=''>Selecione</option>
                                                    <option value={local.lang === 'es' ? 'almacén' : 'warehouse'}>Almacén</option>
                                                    <option value={local.lang === 'es' ? 'barra' : 'bar'}>Barra</option>
                                                    <option value={local.lang === 'es' ? 'baños' : 'bathrooms'}>Baños</option>
                                                    <option value={local.lang === 'es' ? 'cava' : 'large fridge compartment'}>Cava</option>
                                                    <option value={local.lang === 'es' ? 'cocina' : 'kitchen'}>Cocina</option>
                                                    <option value={local.lang === 'es' ? 'deposito' : 'warehouse'}>Deposito</option>
                                                    <option value={local.lang === 'es' ? 'oficina' : 'office'}>Oficina</option>
                                                    <option value={local.lang === 'es' ? 'pasillo' : 'hallway'}>Pasillo</option>
                                                    <option value={local.lang === 'es' ? 'puerta trasera' : 'back door'}>Puerta trasera</option>
                                                    <option value={local.lang === 'es' ? 'puerta principal' : 'main door'}>Puerta pincipal</option>
                                                    <option value={local.lang === 'es' ? 'salón principal' : 'main hall'}>Salón principal</option>
                                                    <option value={local.lang === 'es' ? 'terraza' : 'terrace'}>Terraza</option>
                                                    <option value={local.lang === 'es' ? 'preparación' : 'preparation'}>Terraza</option>


                                                </select>
                                            </label>
                                        </>
                                    )
                                    :
                                    (null)
                            }
                            {
                                Array.isArray(title) && title[0].doesItrequireVideo ?

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
                                                <VideoComponent awaitWindow={awaitWindow} boxModal={boxModal} getVideo={file => setVideoState(file)} />
                                                :
                                                null
                                        }


                                    </>
                                    :
                                    null
                            }
                            <label className='box-label' style={{ color: '#fff' }} htmlFor=""> Nota
                                <textarea
                                    className='box-textArea'
                                    spellCheck="true"
                                    autoComplete='true'
                                    placeholder='en caso que lo amerite'
                                    cols="30"
                                    rows="10"
                                    value={description}
                                    onChange={e => setDescription(description = e.target.value)}>
                                </textarea>
                            </label>
                            <button
                                className='btnSend'
                                disabled={title.length === 0}
                            >Enviar</button>
                        </div>
                    </>
                    :
                    null
            }
        </form>
    );
}

export { SendNoveltie };