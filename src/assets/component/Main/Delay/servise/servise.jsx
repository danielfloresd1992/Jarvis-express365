import { useState, useRef, useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import { useSelector } from 'react-redux';
import { useAlert } from '../../../../hook/useAlert';
import { Search } from '../../search/searchComponent.jsx';
import { useSaveNoveltie } from '../../../../hook/useSaveNoveltie';
import { useDataUser } from '../../../../hook/useTextMenu.jsx';
import { ImgBoxImg } from '../../imgBoxComponent/ImgBox';
import axiosInstance from '../../../../util/instanceAxios.js';
import { useImgAlternative } from '../../../../hook/useImgAlternative.jsx';
import URL from '../../../api_conexion.js';
import useAdapterResize from '../../../../hook/adapter_resize.jsx';
import { sendFile } from '../../../../util/multimedia.Fetching.js';
import { blobToFile } from '../../../../util/64toFile.js';



function Servises({ awaitWindow, boxModal, reset, title }) {

    const users = useSelector(state => state.users);
    const locals = useSelector(state => state.locals);
    const sectionHtmlRef = useRef(null);

    const alert = useAlert();
    const saveNoveltie = useSaveNoveltie();
    let [files, setFiles] = useState([null, null]);
    const [tableNeeded, setTableNeeded] = useState(true);
    let [table, setNumberTable] = useState(null);
    let [dish, setDish] = useState('');
    let [time1, setTime1] = useState('');
    let [time3, setTime3] = useState('');
    let [timeTotal, setTimeTotal] = useState('');
    let [description, setDescription] = useState('');
    const user = useRef(null);
    let [local, setLocal] = useState(null);
    const { htmlAdapterRef } = useAdapterResize({ breackWidth: 1350 });



    useEffect(() => {
        if (isMobile) {

        }
        else {
            setLocal(local = JSON.parse(localStorage.getItem('local_appExpress'))[0]);
        }
    }, []);



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


    const fillLocal = id => {
        const localFranchise = locals.filter(item => id === item._id);
        setLocal(local = localFranchise[0]);
    };



    const sendImg = async e => {
        try {
            e.preventDefault();
            awaitWindow.open('Enviando novedad');

            if (local.franchise === 'Mister01') {
                if (dish === '') return boxModal.open({ title: 'Error', description: 'Seleccione el tipo de plato' });
            }

            let text;
            let descriptionMenu;
            const caption = [];

            const data = useDataUser(user.current, local, sessionStorage.getItem('session'), localStorage.getItem('local_appExpress'));

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
                end: time3,
            };

            const response = await axiosInstance.post(`${URL}/novelties`, dataForRequest)

            if (response.status === 200) {
                saveNoveltie.save(`Demora de servicio`, data.userData);
                alert.request(`Novedad en ${data.localData.name}. por validar`);
                setNumberTable(table = '');
                setTime1(time1 = '');
                setTime3(time3 = '');
                setFiles(files = []);
                setDish(dish = '');
                setTimeTotal(timeTotal = '');
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


    const printDish = () => {
        return (
            <>
                <label className='box-label' htmlFor=""> Tipo de plato
                    <select className='box-inputText' onChange={e => { setDish(dish = e.target.value) }} required>
                        <option value=''>-Seleccione-</option>
                        <option value={local.lang === 'en' ? 'service' : 'servicio'}>{local.lang === 'en' ? 'service' : 'servicio'}</option>
                        <option value={local.dishMenu.appetizer}>{local.dishMenu.appetizer}</option>
                        <option value={local.dishMenu.mainDish}>{local.dishMenu.mainDish}</option>
                        <option value={local.dishMenu.dessert}>{local.dishMenu.dessert}</option>
                    </select>
                </label>
            </>
        );
    };



    const recepHour = (element) => {

        if (element.id === 'toma-orden') setTime1(time1 = element.value);
        if (element.id === 'entrega plato') setTime3(time3 = element.value);

        let hourTotal;
        let minuteTotal;
        let secondTotal;

        hourTotal = time3.split(':')[0] - time1.split(':')[0];
        minuteTotal = time3.split(':')[1] - time1.split(':')[1];
        secondTotal = time3.split(':')[2] - time1.split(':')[2];

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


        setTimeTotal(timeTotal = `${isNaN(hourTotal) ? '❌' : hourTotal}:${isNaN(minuteTotal) ? '❌' : minuteTotal}:${isNaN(secondTotal) ? '❌' : secondTotal}`);
    };



    function returnForm(localData) {
        return (
            <>
                <div className='box-imgComponenContent' ref={htmlAdapterRef} style={{ zoom: ((window.innerWidth / 1350) - 0.1).toString() }}>
                    {
                        title.photos.caption.map((iteration, index) => (
                            <>
                                <ImgBoxImg data={iteration} boxModal={boxModal} setImg={(file) => pushImg(file, index)} deleteImg={() => deleteImg(index)} key={iteration.index} language={local?.lang} />
                            </>
                        ))

                    }
                </div>
                {/*/   setNumberTable   */}
                <div className='box-div-imputContain'>
                    <div className='box-inputContain box-static'>
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
                                        onChange={e => setNumberTable(table = e.target.value)}
                                    />
                                </label>
                                :
                                null
                        }




                        {
                            printDish()
                        }



                        <label className='box-label' htmlFor=""> Toma de orden
                            <input className='box-inputText' type="text" id="toma-orden" value={time1} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required
                                onChange={e => recepHour(e.target)}
                            />
                        </label>



                        <label htmlFor="" className='box-label'> Entrega de servicio
                            <input className='box-inputText' type="text" id="entrega plato" pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" value={time3} required
                                onChange={e => recepHour(e.target)}
                            />
                        </label>

                        <p className='box-textHourResult'>Tiempo total: <span>{timeTotal}</span></p>
                        <label className='box-label' htmlFor=""> Nota
                            <textarea className='box-textArea' spellCheck="true" autoComplete='true' placeholder='en caso que lo amerite' cols="30" rows="10" value={description} onChange={e => setDescription(description = e.target.value)}></textarea>
                        </label>
                        <button className='btnSend' >Enviar</button>
                    </div>
                </div>
            </>
        );
    }


    return (
        <>
            <form className='box-send' onSubmit={e => sendImg(e)}>
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

export { Servises }