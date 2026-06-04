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
import FieldInput from '../../inputs/FieldInput.jsx';
import URL from '../../../libs/fetch_data/api_conexion.js';
import { sendFailedDvr, removeFailedDvr } from '../../../libs/fetch_data/failedRequest.js';

import VideoComponent from '../sendVideo/videoComponent.jsx'
import { saveVideo } from '../../../libs/fetch_data/noveltyFecth.js';
import calculateTime from '../../../libs/date_time/calculate_time.js';
import { sendFile } from '../../../libs/fetch_data/multimedia.Fetching.js';
import { blobToFile } from '../../../libs/script/64toFile.js';
import FormLayaut from '@/component/layaut/form_layaut';




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
    const [timeUniqueState, setTimeUniqueState] = useState('');
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
                

                if (title[0].photos.caption.length > 1) {
                    const html = await useImgAlternative(htmlAdapterRef.current, async (htmlForImg) => {
                    }, false, files.length > 3 ? 2 : files.length);


                    const newFile = blobToFile(html);

                    const resultImg = await sendFile(newFile);
                    console.log(resultImg);
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
        <FormLayaut
            title={title[0] ? title[0].es : ''}
            hiddenBtn={title?.length === 0}
            event={e => handlerSubmit(e)}
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
                                        <FieldInput
                                            type="checkbox"
                                            value={tableNeeded}
                                            onChange={checked => setTableNeeded(checked)}
                                            trueLabel="Requiere número de mesa"
                                            falseLabel="Sin número de mesa"
                                        />

                                        {
                                            tableNeeded ?
                                                <FieldInput
                                                    type="text"
                                                    label="Número de mesa"
                                                    value={table}
                                                    required
                                                    onChange={v => setTable(table = v)}
                                                />
                                                :
                                                null
                                        }

                                    </>
                                    :

                                    null

                            }
                            {
                                title[0].amountOfSomething ?
                                    <FieldInput
                                        type="number"
                                        label="Cantidad total"
                                        value={amountState}
                                        required
                                        onChange={v => setAmountState(v)}
                                    />
                                    :
                                    null
                            }
                            {
                                title[0].time === true ?
                                    (
                                        <>
                                            <h2>Tiempo de la novedad</h2>
                                            <FieldInput
                                                type="hour"
                                                label="Inició"
                                                value={time1}
                                                onChange={v => setTime1(v)}
                                            />

                                            <FieldInput
                                                type="hour"
                                                label="Finalizó"
                                                value={time2}
                                                onChange={v => setTime2(v)}
                                            />

                                            <p className='box-textHourResult' >Tiempo total: <span>{calculateTime(time1, time2)}</span></p>
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
                                            <FieldInput
                                                type="hour"
                                                label={title[0].especial?.time?.timeUnique ? title[0].especial?.time?.timeUnique[LANG] : 'Hora'}
                                                value={timeUniqueState}
                                                onChange={v => {
                                                    setTimeUniqueState(v);
                                                    ref.current = v;
                                                }}
                                            />
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
                                            <FieldInput
                                                type="select"
                                                label="Género"
                                                value={person?.gender ?? ''}
                                                required
                                                onChange={v => setPerson({ ...person, gender: v })}
                                                options={[
                                                    { value: local.lang === 'es' ? 'dama' : 'lady', text: 'Dama' },
                                                    { value: local.lang === 'es' ? 'caballero' : 'glentmen', text: 'Caballero' },
                                                ]}
                                            />
                                            <FieldInput
                                                type="select"
                                                label="Tipo de prenda de la persona"
                                                value={person?.garment ?? ''}
                                                required
                                                onChange={v => setPerson({ ...person, garment: v })}
                                                options={[
                                                    { value: local.lang === 'es' ? 'suéter' : 'sweater', text: 'Suéter' },
                                                    { value: local.lang === 'es' ? 'chaqueta' : 'jacket', text: 'Chaqueta' },
                                                    { value: local.lang === 'es' ? 'camisa' : 'shirt', text: 'Camisa' },
                                                    { value: local.lang === 'es' ? 'vestido' : 'dress', text: 'Vestido' },
                                                ]}
                                            />
                                            <FieldInput
                                                type="select"
                                                label="Color de la prenda"
                                                value={person?.color ?? ''}
                                                required
                                                onChange={v => setPerson({ ...person, color: v })}
                                                options={[
                                                    { value: local.lang === 'es' ? 'negro' : 'black', text: 'Negro' },
                                                    { value: local.lang === 'es' ? 'blanco' : 'white', text: 'Blanco' },
                                                    { value: local.lang === 'es' ? 'verde' : 'green', text: 'Verde' },
                                                    { value: local.lang === 'es' ? 'amarillo' : 'yellow', text: 'Amarillo' },
                                                    { value: local.lang === 'es' ? 'azul' : 'blue', text: 'Azul' },
                                                    { value: local.lang === 'es' ? 'rojo' : 'red', text: 'Rojo' },
                                                    { value: 'beige', text: 'Beige' },
                                                    { value: local.lang === 'es' ? 'marron' : 'brown', text: 'Marrón' },
                                                    { value: local.lang === 'es' ? 'rosa' : 'pink', text: 'Rosa' },
                                                    { value: local.lang === 'es' ? 'gris' : 'grey', text: 'Gris' },
                                                    { value: local.lang === 'es' ? 'dorado' : 'golden', text: 'Dorado' },
                                                    { value: local.lang === 'es' ? 'vinotinto' : 'burgundy', text: 'Vinotinto' },
                                                    { value: local.lang === 'es' ? 'naranja' : 'orange', text: 'Naranja' },
                                                ]}
                                            />
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
                                            <FieldInput
                                                type="select"
                                                label="Área"
                                                value={area ?? ''}
                                                required
                                                onChange={v => setArea(v)}
                                                options={[
                                                    { value: local.lang === 'es' ? 'almacén' : 'warehouse', text: 'Almacén' },
                                                    { value: local.lang === 'es' ? 'área de lavado' : 'dishwashing area', text: 'Área de lavado' },
                                                    { value: local.lang === 'es' ? 'baños' : 'bathrooms', text: 'Baños' },
                                                    { value: local.lang === 'es' ? 'barra' : 'bar', text: 'Barra' },
                                                    { value: local.lang === 'es' ? 'caja' : 'cash register', text: 'Caja' },
                                                    { value: local.lang === 'es' ? 'cámara de congelación' : 'freezer room', text: 'Cámara de congelación' },
                                                    { value: local.lang === 'es' ? 'cámara de refrigeración' : 'cold room', text: 'Cámara de refrigeración' },
                                                    { value: local.lang === 'es' ? 'cava' : 'large fridge compartment', text: 'Cava' },
                                                    { value: local.lang === 'es' ? 'cocina' : 'kitchen', text: 'Cocina' },
                                                    { value: local.lang === 'es' ? 'comedor' : 'dining room', text: 'Comedor' },
                                                    { value: local.lang === 'es' ? 'deposito' : 'storage room', text: 'Depósito' },
                                                    { value: local.lang === 'es' ? 'escaleras' : 'stairs', text: 'Escaleras' },
                                                    { value: local.lang === 'es' ? 'estacionamiento' : 'parking lot', text: 'Estacionamiento' },
                                                    { value: local.lang === 'es' ? 'oficina' : 'office', text: 'Oficina' },
                                                    { value: local.lang === 'es' ? 'parrilla' : 'grill area', text: 'Parrilla' },
                                                    { value: local.lang === 'es' ? 'pasillo' : 'hallway', text: 'Pasillo' },
                                                    { value: local.lang === 'es' ? 'preparación' : 'preparation', text: 'Preparación' },
                                                    { value: local.lang === 'es' ? 'puerta principal' : 'main door', text: 'Puerta principal' },
                                                    { value: local.lang === 'es' ? 'puerta trasera' : 'back door', text: 'Puerta trasera' },
                                                    { value: local.lang === 'es' ? 'recepción' : 'reception', text: 'Recepción' },
                                                    { value: local.lang === 'es' ? 'salón principal' : 'main hall', text: 'Salón principal' },
                                                    { value: local.lang === 'es' ? 'terraza' : 'terrace', text: 'Terraza' },
                                                    { value: local.lang === 'es' ? 'vestidor' : 'locker room', text: 'Vestidor' },
                                                    { value: local.lang === 'es' ? 'zona de carga' : 'loading area', text: 'Zona de carga' },
                                                ]}
                                            />
                                        </>
                                    )
                                    :
                                    (null)
                            }
                            {
                                Array.isArray(title) && title[0].doesItrequireVideo ?

                                    <>
                                        <FieldInput
                                            type="checkbox"
                                            value={isRequieredVideoState}
                                            onChange={checked => {
                                                if (!checked) setVideoState(null);
                                                setIsRequieredVideo(checked);
                                            }}
                                            trueLabel="Adjuntar video"
                                            falseLabel="Sin video"
                                        />

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
                            <FieldInput
                                type="textarea"
                                label="Nota"
                                value={description}
                                placeholder="En caso que lo amerite"
                                onChange={v => setDescription(description = v)}
                            />

                        </div>
                    </>
                    :
                    null
            }
        </FormLayaut>
    );
}

export { SendNoveltie };