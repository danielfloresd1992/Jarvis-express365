import { useState, useRef } from 'react';

import { useSelector } from 'react-redux';
import { useAlert } from '../../../../hook/useAlert';

import { useSaveNoveltie } from '../../../../hook/useSaveNoveltie';
import { useDataUser } from '../../../../hook/useTextMenu.jsx';
import { ImgBoxImg } from '../../imgBoxComponent/ImgBox';
import axiosInstance from '../../../../libs/fetch_data/instanceAxios.js';
import { useImgAlternative } from '../../../../hook/useImgAlternative.jsx';
import URL from '../../../../libs/fetch_data/api_conexion.js';
import useAdapterResize from '../../../../hook/adapter_resize.jsx';
import { sendFile } from '../../../../libs/fetch_data/multimedia.Fetching.js';
import { blobToFile } from '../../../../libs/script/64toFile.js';
import DishInputSelet from '../../../keysInputs/dishInput.jsx';

import { returnTimeExceding } from '../../../../libs/date_time/time.js';
import { TableInput } from '../../../keysInputs/tableNumber.jsx';


import FormLayaut from '@/component/layaut/form_layaut';
import ErrorWithoutMenu from '../../../print_error/error_without_menu.jsx'





function Servises({ awaitWindow, boxModal, reset, title }) {


    const seletedEstableshment = useSelector(state => state.establishment);


    const alert = useAlert();
    const saveNoveltie = useSaveNoveltie();
    let [files, setFiles] = useState([null, null]);


    let [table, setNumberTable] = useState(null);
    let [dish, setDish] = useState(null);
    let [time1, setTime1] = useState('');
    let [time2, setTime2] = useState('');
    let [description, setDescription] = useState('');

    const user = useRef(null);
    let [local, setLocal] = useState(null);
    const { htmlAdapterRef } = useAdapterResize({ breackWidth: 1350 });


    const timeTotal = returnTimeExceding(time2, time1);
    const NONE_TABLE = dish?.requiresTableNumber === false;



    const pushImg = (file, index) => {
        const newFile = [...files];
        newFile[index] = file
        setFiles(newFile);
    };


    const deleteImg = index => {
        const newFile = [...files]
        newFile[index] = null;
        setFiles(newFile);

    };


    console.log(seletedEstableshment);


    const sendImg = async e => {
        try {
            e.preventDefault();
            awaitWindow.open('Enviando novedad');


            if (!dish) return boxModal.open({ title: 'Error', description: 'Seleccione el tipo de plato' });



            let descriptionMenu;
            const caption = [];



            const data = useDataUser(user.current, seletedEstableshment, sessionStorage.getItem('session'), localStorage.getItem('local_appExpress'));

            const text = textAssembly({
                establishmentName: data.localData.name,
                dish: dish || { nameDishe: 'servicio' },
                table: NONE_TABLE ? null : table,
                alertLength: seletedEstableshment.alertLength ,
                time1,
                time2,
                timeTotal,
                note: description,
                lang: data.LANG
            })

            const dataForRequest = {};

            const html = await useImgAlternative((htmlAdapterRef.current), htmlForImg => {

                if (htmlForImg.children.length === 3) {
                    htmlForImg.style.display = 'grid';
                    htmlForImg.style.gridTemplateColumns = '1fr 1fr'
                    htmlForImg.style.gridTemplateRows = 'auto 1fr'
                    htmlForImg.children[2].style.gridRow = '2 / 3';
                    htmlForImg.children[2].style.gridColumn = '1 / 3';
                }
            }, true);



            const responseUrl = await sendFile(blobToFile(html));
            dataForRequest.imageToShare = responseUrl.data.url

            files.map((file, index) => {
                if (!file) throw new Error(`Debe ingresas las imagenes correspondiente, imagen: ${index + 1}`)
                if (!dataForRequest.imageUrl) dataForRequest.imageUrl = [];
                dataForRequest.imageUrl.push({ url: file.url, caption: file.caption });
            });


            dataForRequest.title = `Demora de servicio ${dish !== 'servicio' ? `: ${dish.nameDishe}` : ''}`;
            dataForRequest.table = NONE_TABLE ? null : table;
            dataForRequest.nameDish = dish.nameDishe;
            dataForRequest.userName = data.userData.userName;
            dataForRequest.userId = data.userData.userId;
            dataForRequest.localName = data.localData.name;
            dataForRequest.localId = data.localData.localId;
            dataForRequest.description = descriptionMenu;
            dataForRequest.menu = text;

            dataForRequest.rulesForBonus = title.rulesForBonus;
            dataForRequest.alertId = title._id;

            dataForRequest.menu = text;

            dataForRequest.timePeriod = {
                init: time1,
                end: time2,
            };

            const response = await axiosInstance.post(`${URL}/novelties`, dataForRequest)

            if (response.status === 200) {
                saveNoveltie.save(`Demora de servicio`, data.userData);
                alert.request(`Novedad en ${data.localData.name}. por validar`);
                setNumberTable(table = '');
                setTime1(time1 = '');
                setTime2(time2 = '');
                setFiles(files = []);
                setDish(dish = '');
                user.current = null;
                setLocal(local = null);
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
        <FormLayaut title={title.es} event={e => sendImg(e)} >

            <div className='box-imgComponenContent' ref={htmlAdapterRef} style={{ zoom: ((window.innerWidth / 1350) - 0.1).toString() }}>
                {
                    title.photos.caption.map((iteration, index) => (
                        <>
                            <ImgBoxImg data={iteration} boxModal={boxModal} setImg={(file) => pushImg(file, index)} deleteImg={() => deleteImg(index)} key={iteration.index} language={local?.lang} />
                        </>
                    ))

                }
            </div>

            <div className='box-div-imputContain'>
                <div className='box-inputContain box-static'>


                    <TableInput
                        value={table}
                        onChangeEvent={(value) => setNumberTable(value)}
                        disabled={dish?.requiresTableNumber === false}
                    />




                    <DishInputSelet
                        value={dish}
                        onChangeEvent={(dish) => setDish(dish)}
                        dishes={seletedEstableshment?.dishes}
                    />




                    <label className='box-label' htmlFor=""> Toma de orden
                        <input className='box-inputText' type="text" id="toma-orden" value={time1} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required
                            onChange={e => setTime1(e.target.value)}
                        />
                    </label>



                    <label htmlFor="" className='box-label'> Entrega de servicio
                        <input className='box-inputText' type="text" id="entrega plato" pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" value={time2} required
                            onChange={e => setTime2(e.target.value)}
                        />
                    </label>

                    <p className='box-textHourResult'>Tiempo total: <span>{timeTotal}</span></p>
                    <label className='box-label' htmlFor=""> Nota
                        <textarea className='box-textArea' spellCheck="true" autoComplete='true' placeholder='en caso que lo amerite' cols="30" rows="10" value={description} onChange={e => setDescription(description = e.target.value)}></textarea>
                    </label>

                </div>
            </div>

            <ErrorWithoutMenu
                arr={seletedEstableshment?.dishes}
            />
        </FormLayaut>
    );
}

export { Servises }


const textAssembly = ({ establishmentName, dish, table, alertLength, time1, time2, timeTotal, note, lang }) => {


    const headTitle = lang === 'es' ? `*${establishmentName}*\n` : `*${establishmentName}*\n`;
    const title = lang === 'es' ? `_*Demora de ${dish !== '' ? dish.nameDishe : 'servicio'}*_` : `_*${dish.nameDishe} preparation delay*_`;
    const tableText = table ? lang === 'es' ? `\nMesa: ${table}` : `\ntable ${table}` : '';

    const orderTake = alertLength === 'extended' ? lang === 'es' ? `\nToma de orden: ${time1}\nEntrega de servicio: ${time2}\nDemora total en servicio: ${timeTotal}` : `\nOrder take: ${time1}\n${dish.nameDishe} delivery: ${time2}\ntotal time: ${timeTotal}` : lang === 'es' ? `\nDemora en servicio: ${timeTotal}` : `\ntotal time: ${timeTotal}`;



    const noteText = note !== '' ? lang === 'es' ? `\nNota: ${note.toLowerCase()}` : `\nNote: ${note.toLowerCase()}` : '';


    return headTitle + title + tableText + orderTake + noteText;
}