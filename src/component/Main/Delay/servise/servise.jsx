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




function Servises({ awaitWindow, boxModal, reset, title }) {

    const users = useSelector(state => state.users);
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


    const timeTotal = returnTimeExceding(time1, time2);




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


    const setUser = id => {
        const userFill = users.filter(item => id === item._id);
        user.current = userFill[0];
    };





    const sendImg = async e => {
        try {
            e.preventDefault();
            awaitWindow.open('Enviando novedad');

            if (local.franchise === 'Mister01') {
                if (!dish) return boxModal.open({ title: 'Error', description: 'Seleccione el tipo de plato' });
            }

            let text;
            let descriptionMenu;
            const caption = [];

            const data = useDataUser(user.current, seletedEstableshment, sessionStorage.getItem('session'), localStorage.getItem('local_appExpress'));

            if (data.LANG === 'es') {
                text = `*${data.localData.name}*\n_*Demora de ${dish !== '' ? dish.toLowerCase() : 'servicio'}*_${table ? `\nMesa: ${table}` : ''}\n${local.alertLength === 'extended' ? `Toma de orden: ${time1}\nEntrega de servicio: ${time3}\nDemora total en servicio: ${timeTotal}` : `Demora en servicio: ${timeTotal}`}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
            }
            else {
                text = `*${data.localData.name}*\n_*${dish} preparation delay*_${table ? `\ntable ${table}` : ''}\nOrder take: ${time1}\n${dish.toLowerCase()} delivery: ${time3}\ntotal time: ${timeTotal}\n${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
            }

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


            dataForRequest.title = `Demora de servicio ${dish !== 'servicio' ? `: ${dish.toLowerCase()}` : ''}`;
            dataForRequest.table = table;
            dataForRequest.nameDish = dish;
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
        <>
            <form className='box-send' onSubmit={e => sendImg(e)}>
                <h2 style={{ color: 'rgb(92 92 92)', textDecoration: 'underline', textAlign: 'center' }}>{title.es}</h2>



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
                        />




                        <DishInputSelet
                            value={dish}
                            onChangeEvent={(dish) => setDish(dish)}
                            dishes={seletedEstableshment?.dishes}
                        />




                        <label className='box-label' htmlFor=""> Toma de orden
                            <input className='box-inputText' type="text" id="toma-orden" value={time1} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required
                                onChange={e => setTime1(e.target)}
                            />
                        </label>



                        <label htmlFor="" className='box-label'> Entrega de servicio
                            <input className='box-inputText' type="text" id="entrega plato" pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" value={time2} required
                                onChange={e => setTime2(e.target)}
                            />
                        </label>

                        <p className='box-textHourResult'>Tiempo total: <span>{timeTotal}</span></p>
                        <label className='box-label' htmlFor=""> Nota
                            <textarea className='box-textArea' spellCheck="true" autoComplete='true' placeholder='en caso que lo amerite' cols="30" rows="10" value={description} onChange={e => setDescription(description = e.target.value)}></textarea>
                        </label>
                        <button className='btnSend' >Enviar</button>
                    </div>
                </div>

            </form>
        </>
    );
}

export { Servises }