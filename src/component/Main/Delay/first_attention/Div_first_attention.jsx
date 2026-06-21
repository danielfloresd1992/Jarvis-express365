//import './style.css';
import { useState, useRef, useEffect } from 'react';
import axiosInstance from '../../../../libs/fetch_data/instanceAxios.js';
import { sendFile } from '../../../../libs/fetch_data/multimedia.Fetching.js';
import URL from '../../../../libs/fetch_data/api_conexion.js';
import { isMobile } from 'react-device-detect';
import { useSelector } from 'react-redux';
import { useAlert } from '../../../../hook/useAlert';
import { Search } from '../../search/searchComponent.jsx';
import { returnTimeExceding } from '../../../../libs/date_time/time.js';
import calculateTime from '../../../../libs/date_time/calculate_time.js';

import { useDataUser } from '../../../../hook/useTextMenu.jsx';
import { useSaveNoveltie } from '../../../../hook/useSaveNoveltie.jsx';
import { ImgBoxImg } from '../../imgBoxComponent/ImgBox';
import { useImgAlternative } from '../../../../hook/useImgAlternative';
import useAdapterResize from '../../../../hook/adapter_resize.jsx';
import { blobToFile } from '../../../../libs/script/64toFile.js';
import FormLayaut from '@/component/layaut/form_layaut';
import FieldInput from '../../../inputs/FieldInput.jsx';





export function DivAttention({ awaitWindow, boxModal, reset, title, data }) {


    const user = useSelector(store => store.user);
    const establishment = useSelector(store => store.establishment);

    const alert = useAlert();
    const saveNoveltie = useSaveNoveltie();

    let [table, setNumberTable] = useState(data?.tableNumber || '');

    let [time1, setTime1] = useState(data?.customerSeatedTime || '');
    let [time2, setTime2] = useState(data?.firtAtenttionTime ||  '');

    let timeTotal = calculateTime(time1, time2);
    let [description, setDescription] = useState('');

    const [hasFinishedState, setHasFinishedState] = useState(true);

    let file1 = useRef(null);
    let file2 = useRef(null);

    let TIME_EXCEDING = useRef('00:03:00');

    const { htmlAdapterRef } = useAdapterResize({ breackWidth: 1350 });




    useEffect(() => {
        if (
            establishment.name === 'Mister Aventura' ||
            establishment.name === 'Mister Brickell P.' ||
            establishment.name === 'Mister Coconut' ||
            establishment.name === 'Mister Wynwood' ||
            establishment.name === 'Mister PineCrest'
        ) {
            TIME_EXCEDING.current = '00:02:00';
        }
        else {
            TIME_EXCEDING.current = '00:03:30';
        }
    }, []);




    const deleteImg = number => {
        if (number === 0) file1.current = null;
        if (number === 1) file2.current = null;
    };




    function catBoxImg() {
        return (
            <div className='box-imgComponenContent gridx4' ref={htmlAdapterRef}>
                {
                    hasFinishedState ?
                        <>
                            <ImgBoxImg data={title.photos.caption[0]} boxModal={boxModal} setImg={files => { file1.current = files }} deleteImg={() => deleteImg(0)} language={establishment?.lang} />
                            <ImgBoxImg data={title.photos.caption[1]} boxModal={boxModal} setImg={files => { file2.current = files }} deleteImg={() => deleteImg(1)} language={establishment?.lang} />
                        </>
                        :
                        <ImgBoxImg data={{ index: 1, es: 'En vivo', en: 'now' }} boxModal={boxModal} setImg={files => { file1.current = files }} deleteImg={deleteImg} language={establishment?.lang} />

                }
            </div>
        );
    }


    const sendImg = async e => {
        try {
            e.preventDefault();
            awaitWindow.open('Enviando novedad...');

            let text;

            const data = useDataUser(user, establishment);

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
                text = `*${data.localData.name}*\n_*Demora de primera atención*_\nMesa: ${table}\n${establishment.alertLength === 'extended' ? `Ocupa: ${time1}\nPrimera atención: ${time2}\nTiempo total de demora: ${timeTotal}\n*Mesa no cumple protocolo de primera atención ❌*` : `Hora: ${time2}\nTiempo total: ${timeTotal}`}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
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
                setNumberTable('');
                setTime1(time1 = '');
                setTime2(time2 = '');
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






    return (
        <FormLayaut 
            title={title.es} 
            icon='/ico/icons8-waiter-24.png' 
            event={e => sendImg(e)} 
            description='Registra el tiempo desde que una mesa se ocupa hasta que recibe su primera atención. Si supera el protocolo, se genera una novedad de incumplimiento'
        >
            {
                catBoxImg()
            }

                 <FieldInput
                    type='text'
                    required={true}
                    label='Número de mesa'
                    value={table}
                    onChange={v => setNumberTable(v)}

                />

                <FieldInput
                    type='hour'
                    required={true}
                    label='Tiempo del ocupa de la mesa'
                    value={time1}
                    onChange={v => setTime1(v)}
                />


                <div className='w-full flex justify-center'>
                    <FieldInput
                        type='checkbox'
                        label='ya tiene la primera atención'
                        value={hasFinishedState}
                        onChange={v => setHasFinishedState(v)}
                    />
                </div>

                {
                    hasFinishedState ?
                        <>
                            <FieldInput
                                type='hour'
                                required={true}
                                label='Timpo de la primera atención a la mesa'
                                value={time2}
                                onChange={v => setTime2(v)}
                            />

                            <p className='box-textHourResult' >Tiempo total en recibir la primera atención a la mesa: <span>{calculateTime(time1, time2)}</span></p>

                            {
                                establishment.franchise === 'Mister01' ?
                                    (
                                        <p className='box-textHourResult' >Tiempo excedido: <span>{calculateTime(calculateTime(time1, time2), TIME_EXCEDING.current)}</span></p>
                                    )
                                    :
                                    (
                                        null
                                    )
                            }
                        </>
                        :
                        <>
                            <FieldInput
                                type='hour'
                                label='Tiempo en vivo sin la primera atención'
                                value={time2}
                                onChange={e => setTime2(e)}
                            />



                            <p className='box-textHourResult'>Tiempo en que continua sin primera atención: {returnTimeExceding(time2, time1)}</p>
                        </>
                }
                <label className='box-label' htmlFor=''>Nota
                    <textarea className='box-textArea' spellCheck='true' autoComplete='true' placeholder='en caso que lo amerite' cols='30' rows='10' value={description} onChange={e => setDescription(description = e.target.value)}></textarea>
                </label>
        </FormLayaut >
    );
} 