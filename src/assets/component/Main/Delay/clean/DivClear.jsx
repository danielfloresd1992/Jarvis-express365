import './style.css';
import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { isMobile } from 'react-device-detect';
import { useAlert } from '../../../../hook/useAlert.jsx';
import { useDataUser } from '../../../../hook/useTextMenu.jsx';
import { useSaveNoveltie } from '../../../../hook/useSaveNoveltie.jsx';
import { ImgBoxImg } from '../../imgBoxComponent/ImgBox.jsx';
import { returnTimeExceding } from '../../../../util/time.js';
import { useImgAlternative } from '../../../../hook/useImgAlternative';
import { Search } from '../../search/searchComponent.jsx';
import axiosInstance from '../../../../util/instanceAxios.js';
import URL from '../../../api_conexion.js';
import useAdapterResize from '../../../../hook/adapter_resize.jsx';
import { sendFile } from '../../../../util/multimedia.Fetching.js';
//./../../hook/adapter_resize.jsx';
import { blobToFile } from '../../../../util/64toFile.js'


function Divclear({ awaitWindow, boxModal, reset, title }) {

    const users = useSelector(state => state.users);
    const locals = useSelector(state => state.locals);


    const alert = useAlert();
    const saveNoveltie = useSaveNoveltie();
    const user = useRef(null);
    let [local, setLocal] = useState(null);
    let [table, setNumberTable] = useState('');
    let [time1, setTime1] = useState('');
    let [time2, setTime2] = useState('');
    let [timeTotal, setTimeTotal] = useState('');
    let [textResult, setResult] = useState('00:00:00');
    let [description, setDescription] = useState('');
    let file1 = useRef(null);
    let file2 = useRef(null);

    let TIME_EXCEDING = useRef('00:03:30');

    const [hasFinishedState, setHasFinishedState] = useState(true);

    const { htmlAdapterRef } = useAdapterResize({ breackWidth: 1350 });

    useEffect(() => {

        if (isMobile) {

        }
        else {
            setLocal(local = JSON.parse(localStorage.getItem('local_appExpress'))[0]);

            if (
                local.name === 'Mister Aventura' ||
                local.name === 'Mister Brickell P.' ||
                local.name === 'Mister Coconut' ||
                local.name === 'Mister Wynwood' ||
                local.name === 'Mister PineCrest'
            ) {
                TIME_EXCEDING.current = '00:02:00';
            }
            else {
                TIME_EXCEDING.current = '00:03:30';
            }

        }
    }, []);



    const deleteImg = number => {
        if(number === 0) file1.current = null;
        if(number === 1) file2.current = null;
    };

    console.log(local);

    const sendImg = async e => {
        try {
            e.preventDefault();
            awaitWindow.open('Enviando novedad...');

            let text;

            const data = useDataUser(user.current, local, sessionStorage.getItem('session'), localStorage.getItem('local_appExpress'));
            if (
                data.localData.name === 'Mister Aventura' ||
                data.localData.name === 'Mister Brickell P.' ||
                data.localData.name === 'Mister Coconut' ||
                data.localData.name === 'Mister Wynwood'
            ) { TIME_EXCEDING.current = '00:02:00'; }

            const FOR_MISTER01 = `${data.franchise === 'Mister01' ? `tiempo que excede: ${returnTimeExceding(timeTotal, TIME_EXCEDING.current)}` : ''}`;

            
         
            if (data.LANG === 'es' && hasFinishedState) {
                text = `*${data.localData.name}*\n_*Demora de limpieza*_\nMesa: ${table}\n${local?.alertLength === 'extended' ? `Desocupa: ${time1}\nLimpieza: ${time2}\nTiempo de limpieza: ${timeTotal}\n*Mesa no cumple protocolo de limpieza ❌*\n` : `Hora:${time2}\nTiempo total: ${timeTotal}\n`}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
            }
            else if (data.LANG === 'en' && hasFinishedState) {
                if (data.localData.name === 'Mister Turtle Creek' || data.localData.name === 'Mister Grapevine' || data.localData.name === 'Mister Fort Lauderdale' || data.localData.name === 'Mister Wynwood' || data.localData.name === 'Mister Coconut' || data.localData.name === 'Mister Brickell P.' || data.localData.name === 'Mister Aventura' || data.localData.name === 'Mister Bay Harbor') {
                    text = `*${data.localData.name}*\n_*Cleaning delay*_\nTable: ${table}\nClient leaves the table: ${time1}\nCleaning: ${time2}\nExceeding time: ${returnTimeExceding(timeTotal, TIME_EXCEDING.current)}\nTime total: ${timeTotal}\n*The table does not follow the cleaning protocol ❌*${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
                }
                else {
                    text = `*${data.localData.name}*\n_*Cleaning delay*_\nTable: ${table}\nTime exceeding three and half minute: ${returnTimeExceding(timeTotal, TIME_EXCEDING.current)}\n*The table does not follow the cleaning protocol ❌*${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`
                }
            }
            else {
                data.LANG === 'es' ?
                    text = `*${data.localData.name}*\nMesa: *${table}* fue desocupada a las *${time1}* tiene una demora de limpieza de: *${returnTimeExceding(time2, time1)}*\nAún no cumple el protocolo de limpieza ❌${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`
                    :
                    text = `*${data.localData.name}*\nTable ${table} was vacated at *${time1}* and has a cleaning delay of  *${returnTimeExceding(time2, time1)}\n*, it still does not comply with the cleaning protocol ❌*${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
            }

            const dataForRequest = {};

        
            const html = await useImgAlternative(htmlAdapterRef.current, htmlForImg => {

            });

            const resultImg = await sendFile(blobToFile(html));
            dataForRequest.imageToShare = resultImg.data.url;


            if (hasFinishedState) {
                [file1.current, file2.current].map((file, index) => {
                    if (!file) throw new Error(`Debe ingresas las imagenes correspondiente, imagen: ${index + 1}`);
                    const fileObject = { url: file.url, caption: file.caption };
                    if(dataForRequest.imageUrl){ 
                        dataForRequest.imageUrl.push(fileObject);
                    }
                    else{ 
                        dataForRequest.imageUrl = [];
                        dataForRequest.imageUrl.push(fileObject);
                    }
                });
            }
         

            dataForRequest.title = hasFinishedState ? 'Demora de limpieza' : 'Mesa sin ser limpiada aún (aviso)';
            dataForRequest.table = table;
            dataForRequest.userName = data.userData.userName;
            dataForRequest.userId = data.userData.userId;
            dataForRequest.localName = data.localData.name;
            dataForRequest.localId = data.localData.localId;
            dataForRequest.description = `Desocupa ${time1}, Limpieza ${time2} total: ${timeTotal} ${FOR_MISTER01}`;
            dataForRequest.menu = text;

            dataForRequest.rulesForBonus = title.rulesForBonus;
            dataForRequest.alertId = title._id;
            dataForRequest.for_the_report = hasFinishedState ? true : false;

            dataForRequest.timePeriod = {
                init: time1,
                end: time2,
            };
            const response = await axiosInstance.post(`${URL}/novelties`, dataForRequest)

            if (response.status === 200) {
                saveNoveltie.save(`Demora de limpieza - mesa ${table}`, data.userData);
                alert.request(`Novedad en ${data.localData.name}. por validar`);
                setNumberTable('');
                setTime1(time1 = '');
                setTime2(time2 = '');
                setTimeTotal(timeTotal = '');
                setResult('00:00:00');
                boxModal.open({ title: 'Aviso', description: 'Novedad enviada' });
                user.current = null;
                setHasFinishedState(true);
                reset();
            }
        }
        catch(error){
            console.log(error);
            if (error.message) boxModal.open({ title: 'Error', description: error.message });

            else boxModal.open('Error', error);
        }
        finally {
            awaitWindow.close();
        }
    };



    const recepHour = (element) => {
        if (element.id === 'desocupa') setTime1(time1 = element.value);
        if (element.id === 'limpieza') setTime2(time2 = element.value);
        let hourTotal = time2.split(':')[0] - time1.split(':')[0];
        let minuteTotal = time2.split(':')[1] - time1.split(':')[1];
        let secondTotal = time2.split(':')[2] - time1.split(':')[2];

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

        setResult(textResult = `${isNaN(hourTotal) ? '❌' : hourTotal}:${isNaN(minuteTotal) ? '❌' : minuteTotal}:${isNaN(secondTotal) ? '❌' : secondTotal}`);

        if (!isNaN(hourTotal) && !isNaN(minuteTotal) && !isNaN(secondTotal)) {
            setTimeTotal(timeTotal = `${hourTotal}:${minuteTotal}:${secondTotal}`);
        }
    };


    const setUser = id => {
        const userFill = users.filter(item => id === item._id);
        user.current = userFill[0];
    };


    const fillLocal = id => {
        const localFranchise = locals.filter(item => id === item._id);
        setLocal(local = localFranchise[0]);
    };


    function catBoxImg() {
        return (
            <>
                {
                    hasFinishedState ?
                        <div className='box-imgComponenContent' ref={htmlAdapterRef}>
                            <ImgBoxImg 
                                data={title.photos.caption[0]} 
                                boxModal={boxModal} 
                                setImg={files => { file1.current = files }} 
                                deleteImg={() => deleteImg(0)} 
                                language={local?.lang} 
                                index_image={0} 
                            />
                            <ImgBoxImg 
                                data={title.photos.caption[1]} 
                                boxModal={boxModal} 
                                setImg={files => { file2.current = files }} 
                                deleteImg={() => deleteImg(1)} 
                                language={local?.lang} index_image={1} 
                            />
                        </div>
                        :
                        <div className='box-imgComponenContent' ref={htmlAdapterRef}>
                            <ImgBoxImg data={{ index: 1, es: 'En vivo', en: 'now' }} boxModal={boxModal} setImg={files => { file1.current = files }} deleteImg={deleteImg} language={local?.lang} />
                        </div>
                }
            </>
        )
    }

    return (
        <>
            <form className='box-send' onSubmit={e => sendImg(e)}
                style={{
                    alignContent: 'center'
                }}
            >
                <h2 style={{color: 'rgb(92 92 92)', textDecoration: 'underline', textAlign: 'center'}}>{title.es}</h2>
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


                <div className='box-inputContain box-div-imputContain'>
                    <label className='box-label' htmlFor=""> Número de mesa
                        <input className='box-inputText' type="text" id="table" value={table} required
                            onChange={e => {
                                setNumberTable(table = e.target.value);
                            }}
                        />
                    </label>

                    <label className='box-label' htmlFor=""> Tiempo de desocupa
                        <input className='box-inputText' type="text" id="desocupa" value={time1} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required maxLength="8"
                            onChange={e => recepHour(e.target)}
                        />
                    </label>
                    <label htmlFor="" className='box-label'>¿Mesa sin limpiar aún?
                        <input className='box-inputText' type="checkbox" value={hasFinishedState}
                            onChange={e => setHasFinishedState(state => state = !state)}
                        />
                    </label>

                    {
                        hasFinishedState ?
                            <>
                                <label htmlFor="" className='box-label'> Timpo de limpieza
                                    <input className='box-inputText' type="text" id="limpieza" value={time2} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required maxLength="8"
                                        onChange={e => recepHour(e.target)}
                                    />
                                </label>
                                <p className='box-textHourResult'>Tiempo total: <span>{textResult}</span></p>
                            </>
                            :
                            <>
                                <label htmlFor="" className='box-label' style={{ color: '#fff' }}>Hora actual sin limpiar
                                    <input className='box-inputText' type="text" id="limpieza" value={time2} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required
                                        onChange={e => recepHour(e.target)}
                                    />
                                </label>
                                <p className='box-textHourResult'>Tiempo sin ser limpiada aún: {returnTimeExceding(time2, time1)}</p>
                            </>
                    }

                    {
                        local?.name && local.franchise === 'Mister01' ?
                            (
                                <p className='box-textHourResult' style={{ color: '#fff' }}>Tiempo excedido: <span>{returnTimeExceding(timeTotal, TIME_EXCEDING.current)}</span></p>
                            )
                            :
                            (
                                null
                            )
                    }
                    <label className='box-label' htmlFor=""> Nota
                        <textarea className='box-textArea' spellCheck="true" autoComplete='true' placeholder='en caso que lo amerite' cols="30" rows="10" value={description} onChange={e => setDescription(description = e.target.value)}></textarea>
                    </label>
                    <button className='btnSend' disabled={table === '' || timeTotal === '' ? true : false}>Enviar</button>
                </div>
            </form>
        </>
    );
}

export { Divclear }