import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../../libs/fetch_data/instanceAxios.js';
import { isMobile } from 'react-device-detect';
import './style.css';
import dropImg from '../../../../public/img/drop.png';
import { useSaveNoveltie } from '../../../hook/useSaveNoveltie.jsx';
import axios from 'axios';
import { useDataUser } from '../../../hook/useTextMenu.jsx';
import { useTextMenu } from '../../../hook/useTextMenu.jsx';
import { Search } from '../search/searchComponent.jsx';
import { useAlert } from '../../../hook/useAlert.jsx';
import URL from '../../../libs/fetch_data/api_conexion.js';
import carList from '../SendNovelties/modelCar.json';
import NavBar from '../../layaut/NasBar.jsx';
import BoxVideo from './video.jsx';



function SendVideo({ titlesJson, awaitWindow, boxModal, reset }) {

    const alert = useAlert();
    const saveNoveltieList = useSaveNoveltie();
    const ref = useRef(null);
    const LANG = JSON.parse(localStorage.getItem('local_appExpress'))[0].lang;


    let [video, setVideo] = useState(null);
    const [videoArrState, setVideoArrState] = useState([null]);
    const [speedVideoState, setSpeedVideoState] = useState(0.5);
    const videoOriginalRef = useRef(null);

    let [title, setTitle] = useState([]);
    let [file, setFile] = useState(null);
    let [table, setTable] = useState('');
    const [tableNeeded, setTableNeeded] = useState(true);
    let [time1, setTime1] = useState('');
    let [time2, setTime2] = useState('');
    let [local, setLocal] = useState(null);
    let [timeTotal, setTimeTotal] = useState('');
    let [textResult, setResult] = useState('');
    let [description, setDescription] = useState('');

    const [car, setCar] = useState(null);
    const [person, setPerson] = useState(null);
    const [area, setArea] = useState(null);
    const user = useRef(null);
    const isMountedRef = useRef(false);


    useEffect(() => {
        isMobile ? null : setLocal(local = JSON.parse(localStorage.getItem('local_appExpress'))[0]);
    }, []);


    useEffect(() => {

        const isUndefinex = videoArrState.filter(video => video === null)
        if (isUndefinex.length < 1) {
            awaitWindow.open('Preparando resultado para mostrar');

            const formData = new FormData();

            videoArrState.forEach(video => {
                formData.append(`file`, video.file);
            });

            axios.post('https://72.68.60.201:3001/servise/video/concact', formData, { responseType: 'blob' })
                .then(response => {
                    renderVideo(response.data, true);
                })
                .catch(err => {
                    conosle.log(err);
                })
                .finally(() => {
                    awaitWindow.close();
                })

        }

    }, [videoArrState]);



    useEffect(() => {

        if (isMountedRef.current) {
            awaitWindow.open('acelerando video');
            const formData = new FormData();
            formData.append('file', videoOriginalRef.current);
            axios.post(`https://72.68.60.201:3001/servise/video/speed=${speedVideoState}`, formData, { responseType: 'blob' })
                .then(response => {
                    console.log(response.data)
                    if (response.status === 200) renderVideo(response.data, false);

                })
                .catch(err => {
                    console.log(err);
                })
                .finally(() => {
                    awaitWindow.close();
                })
        }
    }, [speedVideoState]);



    const onChange = (video) => {

        const type = ['video/mp4', 'video/avi', ''];
        const typeItem = type.filter(item => item === video.type);

        if (typeItem.length === 0) {
            boxModal.open({ title: 'Aviso', description: 'Extención del archivo invalido' });
            return awaitWindow.close();
        }

        const formData = new FormData();
        formData.append('file', video);

        axios.post('https://72.68.60.201:3001/servise/video', formData, { responseType: 'blob' })
            .then(response => {
                renderVideo(response.data, true);
            })
            .catch(err => {
                console.log(err);
            })
            .finally(() => {
                awaitWindow.close();
            });
    };


    const renderVideo = (video, changeOrigin = false) => {
        isMountedRef.current = true;
        const url = window.URL.createObjectURL(new Blob([video]));
        setFile(file = url);
        const newFile = new File([video], 'video', { lastModified: new Date().getTime(), type: video.type });
        if (changeOrigin) videoOriginalRef.current = newFile;
        setVideo(video = newFile);
    };


    const sendImg = e => {
        e.preventDefault();

        const data = useDataUser(user.current, local, sessionStorage.getItem('session'), localStorage.getItem('local_appExpress'));
        const LANG = local.lang;
        const localData = local;

        const menu = useTextMenu({
            localData,
            LANG,
            title: title,
            table,
            time1,
            time2,
            textResult,
            ref,
            description,
            car,
            person,
            area
        });


        let formData = new FormData();
        formData.append('video', video, JSON.parse(localStorage.getItem('local_appExpress'))[0].name);

        formData.append('title', title[0].es);
        formData.append('userName', `${JSON.parse(sessionStorage.getItem('session')).name} ${JSON.parse(sessionStorage.getItem('session')).surName}`);
        formData.append('userId', JSON.parse(sessionStorage.getItem('session'))._id);
        formData.append('localName', JSON.parse(localStorage.getItem('local_appExpress'))[0].name);
        formData.append('localId', JSON.parse(localStorage.getItem('local_appExpress'))[0]._id);
        formData.append('lang', JSON.parse(localStorage.getItem('local_appExpress'))[0].lang);
        formData.append('description', description);
        formData.append('menu', menu);
        formData.append('caption', JSON.stringify([JSON.parse(localStorage.getItem('local_appExpress'))[0].name]));
        formData.append('rulesForBonus', JSON.stringify(title[0].rulesForBonus));
        formData.append('alertId', title[0]._id)

        axiosInstance.post(`${URL}/novelties`, formData)
            .then(response => {
                if (response.status === 200) {
                    saveNoveltieList.save(title[0].es, data.userData);
                    alert.request(`Novedad en ${JSON.parse(localStorage.getItem('local_appExpress'))[0].name}. video por validar`);
                    setTitle(title = []);
                    setFile(file = null);
                    setVideo(video = null);
                    setTime1(time1 = '');
                    setTime2(time2 = '');
                    setTimeTotal(timeTotal = '');
                    setResult(textResult = '00:00:00');
                    setDescription('');
                    reset('');
                }
                boxModal.open({ title: 'Aviso', description: 'El video se envió con éxito' });
            })
            .catch(err => {
                console.log(err);
                boxModal.open({ title: 'Error', description: '500, error server internal' });
            });
    };

    const recepHour = (element) => {
        if (element.id === 'inicio') setTime1(time1 = element.value);
        if (element.id === 'fin') setTime2(time2 = element.value);
        let hourTotal = time2.split(':')[0] - time1.split(':')[0];
        let minuteTotal = time2.split(':')[1] - time1.split(':')[1];
        let secondTotal = time2.split(':')[2] - time1.split(':')[2];

        if (secondTotal < 0) {
            secondTotal = 60 - Math.abs(secondTotal)
            --minuteTotal;
        }
        if (minuteTotal < 0) {
            minuteTotal = 60 - Math.abs(minuteTotal);
            --hourTotal
        }
        if (minuteTotal < 10) minuteTotal = `0${minuteTotal}`
        if (secondTotal < 10) secondTotal = `0${secondTotal}`
        if (hourTotal < 9) hourTotal = `0${hourTotal}`;

        let housExceed = '00';
        let minuteExceed = (`0${minuteTotal - 3}`).substr(-2);
        let secondExceed = (`0${secondTotal - 0}`).substr(-2);

        if (secondExceed < 0) {
            secondExceed = 60 - Math.abs(secondExceed);
            --minuteExceed;
        }
        if (minuteExceed < 0) {
            minuteExceed = 60 - Math.abs(minuteExceed);
            --housExceed;
        }

        setResult(textResult = ` ${isNaN(hourTotal) ? '❌' : hourTotal}:${isNaN(minuteTotal) ? '❌' : minuteTotal}:${isNaN(secondTotal) ? '❌' : secondTotal}`);
        if (!isNaN(hourTotal) && !isNaN(minuteTotal) && !isNaN(secondTotal)) {
            setDisabledBtn(btnDisabled = false);
        }
        else {
            setDisabledBtn(btnDisabled = true);
        }
        setTimeTotal(timeTotal = `${hourTotal}:${minuteTotal}:${secondTotal}`);
        setTimeExcee(timeExceeding = `${housExceed}:${minuteExceed}:${secondExceed}`);
    };


    const setTitleObject = (id) => {
        const fillTitle = titlesJson.filter(objectNoveltie => id === objectNoveltie._id);
        setTitle(title = fillTitle);
    };


    const updateArrVideo = videoRequest => {
        const newArr = [...videoArrState];
        newArr[videoRequest.order] = videoRequest;
        setVideoArrState(newArr);
    };




    return (
        <>
            <form className='box-send' onSubmit={e => sendImg(e)}>
                <NavBar>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            color: '#fff'
                        }}
                    >

                        <p>Cantidad de videos</p> <p style={{ fontSize: '1.2rem' }}>{videoArrState.length}</p>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '.5rem'
                            }}
                        >
                            <button
                                className='btn'
                                type='button'
                                onClick={e => {
                                    if (videoArrState.length === 1) return;
                                    let numberArr = [...videoArrState];
                                    numberArr.pop(null);
                                    setVideoArrState(numberArr)
                                }}
                            >-</button>

                            <button
                                className='btn'
                                type='button'
                                onClick={e => {
                                    if (videoArrState.length === 4) return;

                                    let numberArr = [...videoArrState];
                                    numberArr.push(null);
                                    setVideoArrState(numberArr);
                                }}
                            >+</button>

                        </div>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            color: '#fff'
                        }}
                    >
                        <p>Velodidad</p>
                        <p>{speedVideoState}</p>

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '.5rem'
                            }}
                        >
                            <button
                                className='btn'
                                type='button'
                                disabled={video ? false : true}
                                onClick={e => {
                                    setSpeedVideoState(state => state = Number((state - 0.1).toFixed(1)));
                                }}
                            >-</button>

                            <button
                                className='btn'
                                disabled={video ? false : true}
                                type='button'
                                onClick={e => {
                                    setSpeedVideoState(state => state = Number((state + 0.1).toFixed(1)));
                                }}
                            >+</button>

                        </div>
                    </div>
                </NavBar>
                <div className='productionContain-headerContain' style={{ justifyContent: 'center', flexDirection: 'column' }} >
                    <Search array={titlesJson} config={{ placeholder: 'Titulo de la novedad', key: ['es'] }} callback={(element, reset) => { return <p onClick={e => { setTitleObject(e.target.id); reset(e.target.textContent) }} className='speed-title' key={element._id} id={element._id} >{element.es} </p> }} />
                </div>

                <div className='box-div'
                    style={{
                        width: '100%'
                    }}
                >
                    {
                        videoArrState?.length < 2 ?

                            <video autoPlay controls className='box-imgContain' src={file ? file : dropImg}
                                value={file}
                                onDragLeave={e => e.preventDefault()}
                                onDragEnter={e => e.preventDefault()}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                    e.preventDefault();
                                    console.log(e.dataTransfer.files[0]);
                                    awaitWindow.open('Procesando video, por favor espere...');
                                    onChange(e.dataTransfer.files[0])
                                }}
                                style={{ border: 'solid 1px #fff' }}>
                                <p className='box-text'>Novedad</p>
                            </video>
                            :
                            <div
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItem: 'center',
                                    justifyContent: 'center',
                                    flexWrap: 'wrap',
                                    gap: '1rem'
                                }}
                            >
                                {
                                    videoArrState.map((element, indexItem) => (
                                        <BoxVideo
                                            changeEvent={updateArrVideo}
                                            index={indexItem}
                                        />
                                    ))
                                }
                                {
                                    file ?
                                        <div
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexDirection: 'column'
                                            }}
                                        >
                                            <video autoPlay loop={true} controls className='box-imgContain' src={file ? file : dropImg} value={file}
                                                style={{
                                                    width: '638px',
                                                    backgroundColor: '#000'
                                                }}
                                            >
                                            </video>
                                            <p style={{ textAlign: 'center' }}>Resultado</p>
                                        </div>
                                        :
                                        null
                                }
                            </div>
                    }

                </div>


                <div className='box-div-imputContain'>
                    {
                        title.length > 0 && title[0].table === true ?
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
                                        <label className='box-label'> Número de mesa
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
                            (
                                null
                            )
                    }
                    {
                        title.length > 0 && title[0].time === true ?
                            (
                                <>
                                    <label className='box-label' htmlFor=""> Inició
                                        <input className='box-inputText' type="text" id="inicio" value={time1} required pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$"
                                            onChange={e => recepHour(e.target)}
                                        />
                                    </label>

                                    <label htmlFor="" className='box-label'> Finalizó
                                        <input className='box-inputText' type="text" id="fin" value={time2} required pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$"
                                            onChange={e => recepHour(e.target)}
                                        />
                                    </label>


                                    <p className='box-textHourResult'>Tiempo total: <span>{textResult}</span></p>
                                </>
                            ) :
                            (
                                null
                            )
                    }
                    {
                        title.length > 0 && title[0].timeUnique === true ?
                            (
                                <label className='box-label' htmlFor=""> {title[0].especial?.time?.timeUnique ? title[0].especial?.time?.timeUnique[LANG] : 'Hora'}
                                    <input className='box-inputText' type="text" id="inicio" value={ref.current} required pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$"
                                        onChange={e => ref.current = e.target.value}
                                    />
                                </label>
                            ) :
                            (
                                null
                            )
                    }

                    {
                        title.length > 0 && Boolean(title[0].car) ?
                            (
                                <>
                                    <h2 style={{ color: 'rgb(223 0 155)' }}>Descripción del vehículo</h2>
                                    <label className='box-label'> Marca del vehículo
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
                                                    setCar({ ...car, model: e.target.value });
                                                }
                                            }
                                        >
                                            <option value=''>Selecione</option>
                                            {
                                                carList.sort().map(movil => (
                                                    <option value={movil}>{movil}</option>
                                                ))
                                            }
                                        </select>
                                    </label>
                                    <label
                                        className='box-label'> Color del vehículo
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
                                                    setCar({ ...car, color: e.target.value });
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
                        title.length > 0 && title[0].isDescriptionPerson ?
                            (
                                <>
                                    <h2 style={{ color: 'rgb(223 0 155)' }}>Descripción de la persona</h2>
                                    <label className='box-label'> Genero
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
                                        className='box-label'> Tipo de prenda de la persona
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
                                        className='box-label'> Color la prenda
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
                        title.length > 0 && title[0].isArea ?
                            (
                                <>
                                    <h2 style={{ color: 'rgb(223 0 155)' }}>Área de la incidencia</h2>
                                    <label className='box-label'> Área
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
                                        </select>
                                    </label>
                                </>
                            )
                            :
                            (null)
                    }


                    <label className='box-label' htmlFor=""> Nota
                        <textarea className='box-textArea' spellCheck="true" autoComplete='true' placeholder='en caso que lo amerite' cols="30" rows="10" value={description} onChange={e => setDescription(description = e.target.value)}></textarea>
                    </label>
                    <button className='btnSend' disabled={title.length === 0 || video === null}>Enviar</button>
                </div>

            </form>
        </>
    );
}

export { SendVideo };