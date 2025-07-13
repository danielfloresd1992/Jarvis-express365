//import './style.css';
import { useState, useRef, useEffect } from 'react';
import axiosInstance from '../../../../util/instanceAxios.js';
import { isMobile } from 'react-device-detect';
import { useSelector } from 'react-redux';
import { useAlert } from '../../../../hook/useAlert';
import { Search } from '../../search/searchComponent.jsx';
import { returnTimeExceding } from '../../../../util/time';
import { useDataUser } from '../../../../hook/useTextMenu.jsx';
import { useSaveNoveltie } from '../../../../hook/useSaveNoveltie.jsx';
import { ImgBoxImg } from '../../imgBoxComponent/ImgBox';
import { useImgAlternative } from '../../../../hook/useImgAlternative';
import URL from '../../../api_conexion.js';
import useAdapterResize from '../../../../hook/adapter_resize.jsx';
import { blobToFile } from '../../../../util/64toFile.js';
import { sendFile } from '../../../../util/multimedia.Fetching.js';


function DivAttention({ awaitWindow, boxModal, reset, title }) {


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

    const [hasFinishedState, setHasFinishedState] = useState(true);

    let file1 = useRef(null);
    let file2 = useRef(null);

    let TIME_EXCEDING = useRef('00:03:00');

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
        if (number === 0) file1.current = null;
        if (number === 1) file2.current = null;
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
                            <ImgBoxImg data={title.photos.caption[0]} boxModal={boxModal} setImg={files => { file1.current = files }} deleteImg={() => deleteImg(0)} language={local?.lang} />
                            <ImgBoxImg data={title.photos.caption[1]} boxModal={boxModal} setImg={files => { file2.current = files }} deleteImg={() => deleteImg(1)} language={local?.lang} />
                        </div>
                        :
                        <div className='box-imgComponenContent' ref={htmlAdapterRef}>
                            <ImgBoxImg data={{ index: 1, es: 'En vivo', en: 'now' }} boxModal={boxModal} setImg={files => { file1.current = files }} deleteImg={deleteImg} language={local?.lang} />
                        </div>
                }
            </>
        );
    }


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


            const caption = [
                data.LANG === 'es' ? `ocupa - mesa ${table}` : `occupies - table ${table}`,
                data.LANG === 'es' ? `primera atencion - mesa ${table}` : `first attention - table ${table}`
            ];

            if (data.LANG === 'es' && hasFinishedState) {
                text = `*${data.localData.name}*\n_*Demora de primera atención*_\nMesa: ${table}\n${local.alertLength === 'extended' ? `Ocupa: ${time1}\nPrimera atención: ${time2}\nTiempo total de demora: ${timeTotal}\n*Mesa no cumple protocolo de primera atención ❌*` : `Hora: ${time2}\nTiempo total: ${timeTotal}`}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
            }
            else if (data.LANG === 'en' && hasFinishedState) {
                if (data.localData.name === 'Mister Turtle Creek' || data.localData.name === 'Mister Grapevine' || data.localData.name === 'Mister Fort Lauderdale' || data.localData.name === 'Mister Wynwood' || data.localData.name === 'Mister Coconut' || data.localData.name === 'Mister Brickell P.' || data.localData.name === 'Mister Aventura' || data.localData.name === 'Mister Bay Harbor') {

                    text = `*${data.localData.name}*\n_*First attention delay*_\nTable: ${table}\nOccupies: ${time1}\nFirst attention: ${time2}\nTime exceeding minutes: ${returnTimeExceding(timeTotal, TIME_EXCEDING.current)}\nTotal time: ${timeTotal}\n*The table does not follow the first attention protocol ❌*${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
                }
                else {


                    text = `*${data.localData.name}*\n_*First attention delay*_\nTable: ${table}\nTime exceeding: ${returnTimeExceding(timeTotal, TIME_EXCEDING.current)}\n*The table does not follow the first attention protocol ❌*${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
                }
            }
            else {
                data.LANG === 'es' ?
                    text = `*${data.localData.name}*\nMesa: *${table}* fue ocupada a las *${time1}* tiene demora de primera atención de: *${returnTimeExceding(time2, time1)}*\nAún no cumple el protocolo de primera atención ❌${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`
                    :
                    text = `*${data.localData.name}*\nTable ${table} and has a first service delay of *${returnTimeExceding(time2, time1)}\n*, it still does not comply with the first service protocol ❌*${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
            }

            let dataForRequest = {};

            const html = await useImgAlternative(htmlAdapterRef.current, htmlForImg => {

            });

            const responseUrl = await sendFile(blobToFile(html));
            dataForRequest.imageToShare = responseUrl.data.url;


            if (hasFinishedState) {
                [file1.current, file2.current].map((file, index) => {
                    if (!file) throw new Error(`Debe ingresas las imagenes cor;respondiente, imagen: ${index + 1}`);

                    if (!dataForRequest.imageUrl) dataForRequest.imageUrl = [];
                    dataForRequest.imageUrl.push({ url: file.url, caption: file.caption });
                });
            }

            console.log(title);

            dataForRequest.title = hasFinishedState ? 'Demora de primera atención' : 'Mesa no recibe protocolo de PA1 aún (aviso)';
            dataForRequest.table = table;
            dataForRequest.userName = data.userData.userName;
            dataForRequest.userId = data.userData.userId;
            dataForRequest.localName = data.localData.name;
            dataForRequest.localId = data.localData.localId;
            dataForRequest.description = `ocupa ${time1}, primera atención ${time2} total: ${timeTotal} ${FOR_MISTER01}`;
            dataForRequest.menu = text;
            dataForRequest.rulesForBonus = title.rulesForBonus;
            dataForRequest.alertId = title._id;
            dataForRequest.for_the_report = hasFinishedState ? true : false;

            dataForRequest.startTime = time1;
            dataForRequest.endTime = time2;

            dataForRequest.timePeriod = {
                init: time1,
                end: time2,
            };

            const response = await axiosInstance.post(`${URL}/novelties`, dataForRequest)

            if (response.status === 200) {
                saveNoveltie.save(`Demora de primera atención - mesa ${table}`, data.userData);
                alert.request(`Novedad en ${data.localData.name}. por validar`);
                setNumberTable('');
                setTime1(time1 = '');
                setTime2(time2 = '');
                setTimeTotal(timeTotal = '');
                setResult('00:00:00');
                boxModal.open({ title: 'Aviso', description: 'Novedad enviada' });
                reset();
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
        if (element.id === 'ocupa') setTime1(time1 = element.value);
        if (element.id === 'primera-atencion') setTime2(time2 = element.value);
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
        if (hourTotal < 10) hourTotal = `0${hourTotal}`.substr(-2);

        setResult(textResult = ` ${isNaN(hourTotal) ? '❌' : hourTotal}:${isNaN(minuteTotal) ? '❌' : minuteTotal}:${isNaN(secondTotal) ? '❌' : secondTotal}`);
        if (!isNaN(hourTotal) && !isNaN(minuteTotal) && !isNaN(secondTotal)) {
            setTimeTotal(timeTotal = `${hourTotal}:${minuteTotal}:${secondTotal}`);
        }
    };


    function returnForm(localData) {
        return (
            <div className='box-inputContain box-div-imputContain'
            >
                <label className='box-label' htmlFor=""> Número de mesa
                    <input className='box-inputText' type="text" id="table" value={table} required
                        onChange={e => {
                            setNumberTable(table = e.target.value);
                        }}
                    />
                </label>

                <label className='box-label' htmlFor=""> Tiempo de ocupa
                    <input className='box-inputText' type="text" id="ocupa" value={time1} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required
                        onChange={e => recepHour(e.target)}
                    />
                </label>

                <label htmlFor="" className='box-label'>¿Sin primera atención aún?
                    <input className='box-inputText' type="checkbox" value={hasFinishedState}
                        onChange={e => setHasFinishedState(state => state = !state)}
                    />
                </label>
                {
                    hasFinishedState ?
                        <>
                            <label htmlFor="" className='box-label'> Timpo de primera atención
                                <input className='box-inputText' type="text" id="primera-atencion" value={time2} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required
                                    onChange={e => recepHour(e.target)}
                                />
                            </label>

                            <p className='box-textHourResult' >Hora total: <span>{textResult}</span></p>

                            {
                                localData.franchise === 'Mister01' ?
                                    (
                                        <p className='box-textHourResult' >Tiempo excedido: <span>{returnTimeExceding(timeTotal, TIME_EXCEDING.current)}</span></p>
                                    )
                                    :
                                    (
                                        null
                                    )
                            }
                        </>
                        :
                        <>
                            <label htmlFor="" className='box-label'>Hora actual sin primera atención
                                <input className='box-inputText' type="text" id="primera-atencion" value={time2} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required
                                    onChange={e => recepHour(e.target)}
                                />
                            </label>
                            <p className='box-textHourResult'>Tiempo en que continua sin primera atención: {returnTimeExceding(time2, time1)}</p>
                        </>
                }
                <label className='box-label' htmlFor="">Nota
                    <textarea className='box-textArea' spellCheck="true" autoComplete='true' placeholder='en caso que lo amerite' cols="30" rows="10" value={description} onChange={e => setDescription(description = e.target.value)}></textarea>
                </label>

                <button className='btnSend' disabled={table === '' || timeTotal === '' ? true : false}>Enviar</button>

            </div>
        );
    }


    return (
        <>
            <form className='box-send' onSubmit={e => sendImg(e)} encType='multipart/form-data' acceptCharset='UTF-8' style={{ alignContent: 'center' }}>
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
                    local !== null ?
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

export { DivAttention }