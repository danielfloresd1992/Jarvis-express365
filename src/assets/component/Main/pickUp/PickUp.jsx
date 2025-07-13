import { useState, useRef, useEffect, useCallback } from 'react';
import { isMobile } from 'react-device-detect';
import { useSelector } from 'react-redux';
import { useAlert } from '../../../hook/useAlert.jsx';
import { Search } from '../search/searchComponent.jsx';
import { useSaveNoveltie } from '../../../hook/useSaveNoveltie';
import { useDataUser } from '../../../hook/useTextMenu.jsx';
import { ImgBoxImg } from '../imgBoxComponent/ImgBox.jsx';
import axiosInstance from '../../../util/instanceAxios.js';
import { useImgAlternative } from '../../../hook/useImgAlternative.jsx';
import URL from '../../api_conexion.js';
import useAdapterResize from '../../../hook/adapter_resize.jsx';
import calculateTime from '../../../util/calculate_time.js';
import { sendFile } from '../../../util/multimedia.Fetching.js';
import { blobToFile } from '../../../util/64toFile.js';


function PickUp({ awaitWindow, boxModal, title, reset }) {


    const users = useSelector(state => state.users);
    const locals = useSelector(state => state.locals);
    const sectionHtmlRef = useRef(null);
    const alert = useAlert();
    const saveNoveltie = useSaveNoveltie();
    let [files, setFiles] = useState([]);
    let [table, setNumberTable] = useState('');
    let [time1, setTime1] = useState('');
    let [time2, setTime2] = useState('');
    let [time3, setTime3] = useState('');
    let [timeTotal, setTimeTotal] = useState('');
    let [description, setDescription] = useState('');
    const user = useRef(null);
    let [local, setLocal] = useState(null);
    const [person, setPerson] = useState(null);
    const { htmlAdapterRef } = useAdapterResize({ breackWidth: 1350 });



    useEffect(() => {
        if (!isMobile) setLocal(local = JSON.parse(localStorage.getItem('local_appExpress'))[0]);
    }, []);


    const pushImg = useCallback((file, index) => {
        const newArrFile = [...files];
        newArrFile[index] = file;
        setFiles(newArrFile);
    }, [files]);



    const deleteImg = useCallback((index) => {
        const newArrFile = [...files];
        files[index] = null;
        setFiles(newArrFile);
    }, [files])



    const setUser = id => {
        const userFill = users.filter(item => id === item._id);
        user.current = userFill[0];
    };



    const fillLocal = id => {
        const localFranchise = locals.filter(item => id === item._id);
        setLocal(local = localFranchise[0]);
    };





    const sendImg = async e => {
        e.preventDefault();
        try {
            awaitWindow.open('Enviando novedad');

            let text;
            let descriptionMenu;
            const caption = [];

            const data = useDataUser(user.current, local, sessionStorage.getItem('session'), localStorage.getItem('local_appExpress'));
            const personMenu = Boolean(person) ? data.LANG === 'es' ? `\nDescripción: ${person.gender} con ${person.garment} ${person.color}` : `\nDescripcion:  ${person.gender} with ${person.garment} ${person.color}` : '';
            if (data.LANG === 'es') {
                if (data?.localData?.name === 'Mochima') {
                    text = `*${data.localData.name}*\n_*Servicio de Pick up*_\nCliente realiza pedido: ${time1}${time2 !== '' ? `\nPago de pedido: ${time2}` : ''}\nEntrega de pedido: ${time3}\nTiempo: ${calculateTime(time1, time3)}${personMenu}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
                }
                else {
                    text = `*${data.localData.name}*\n_*Servicio de Pick up*_\nCliente realiza pedido: ${time1}\nEntrega de pedido: ${time3}\nTiempo: ${calculateTime(time1, time3)}${personMenu}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
                }
            }
            else {

                text = `*${data.localData.name}*\n_*Pick Up service*_\nOrder Take: ${time1}\nPick-up delivery: ${time3}\ntotal time: ${calculateTime(time1, time3)}${personMenu}${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
            }

            const dataForRequest = {};


            if (data?.localData?.name === 'Mochima') {
                descriptionMenu = `Pedido de pick up ${time1},pago de pick up ${time2}, entrega de pick up ${time3} total: ${calculateTime(time1, time3)}`;
                caption[0] = data.LANG === 'es' ? `Toma de pickup` : `order take`;
                caption[1] = data.LANG === 'es' ? `Pago de pickup` : `recived - table`;
                caption[2] = data.LANG === 'es' ? `entrega de pick up` : `service delivery`;
            }
            else {
                descriptionMenu = `Pedido de pick up ${time1}, entrega de pick up ${time3} total: ${timeTotal}`;
                caption[0] = data.LANG === 'es' ? `Toma de pickup` : `order take`;
                caption[2] = data.LANG === 'es' ? `entrega de pick up` : `service delivery`;
            }



            if (files.length === 2) {
                const html = await useImgAlternative(htmlAdapterRef.current, htmlForImg => {
                }, false);


                const responseUrl = await sendFile(blobToFile(html));
                dataForRequest.imageToShare = responseUrl.data.url;
            }
            else if (files.length === 3) {
                const html = await useImgAlternative(htmlAdapterRef.current, htmlForImg => {
                    htmlForImg.style.display = 'grid';
                    htmlForImg.style.justifyItems = 'center';
                    htmlForImg.style.gridTemplateColumns = '1fr 1fr'
                    htmlForImg.style.gridTemplateRows = 'auto 1fr'
                    htmlForImg.children[2].style.gridRow = '2 / 3';
                    htmlForImg.children[2].style.gridColumn = '1 / 3';

                }, false, 4);

                const responseUrl = await sendFile(blobToFile(html));
                dataForRequest.imageToShare = responseUrl.data.url;
            }



            if (data.localData.franchise === 'Sokai') {
                dataForRequest.rulesForBonus = {
                    worth: 1,
                    amulative: 2
                };
            }
            else {
                dataForRequest.rulesForBonus = title.rulesForBonus;
            }


            files.map((file, index) => {
                if (!dataForRequest.imageUrl) dataForRequest.imageUrl = [];
                dataForRequest.imageUrl.push({ url: file.url, caption: file.caption });
            });


            dataForRequest.title = `Servicio de PickUp`;
            dataForRequest.table = table;
            dataForRequest.userName = data.userData.userName;
            dataForRequest.userId = data.userData.userId;
            dataForRequest.localName = data.localData.name;
            dataForRequest.localId = data.localData.localId;
            dataForRequest.description = descriptionMenu;
            dataForRequest.menu = text;
            dataForRequest.alertId = title._id;
            dataForRequest.rulesForBonus = title.rulesForBonus;


            dataForRequest.timePeriod = {
                init: time1,
                end: time3,
            };


            const response = await axiosInstance.post(`${URL}/novelties`, dataForRequest)

            if (response.status === 200) {
                saveNoveltie.save(`Pick up}`, data.userData);
                alert.request(`Servicio de pick up en ${data.localData.name}. por validar`);
                setNumberTable(table = '');
                setTime1(time1 = '');
                setTime2(time2 = '');
                setTime3(time3 = '');
                setFiles(files = []);
                setTimeTotal(timeTotal = '');
                user.current = null;ef
                setLocal(local = null);
                boxModal.open({ title: 'Aviso', description: 'Novedad enviada' });
                reset('');
            }
        }
        catch (err) {
            console.log(err);
            boxModal.open({ title: 'Error', description: 'Error al eviar la novedad' });
        }
        finally {
            awaitWindow.close();
        };
    };





    function returnForm(localData) {
        return (
            <>
                <div className='box-imgComponenContent' ref={htmlAdapterRef} style={{ zoom: ((window.innerWidth / 1350) - 0.1).toString() }}>
                    {
                        title.photos.caption.map((iteration, index) => (
                            localData.name !== 'Mochima' && iteration.es === 'Pago de pedido' ?
                                null
                                :
                                <ImgBoxImg
                                    data={iteration}
                                    boxModal={boxModal}
                                    setImg={file => {
                                        pushImg(file, localData.name !== 'Mochima' && index === 2 ? index - 1 : index)
                                    }}
                                    deleteImg={() => deleteImg(localData.name !== 'Mochima' && index === 2 ? index - 1 : index)}
                                    key={iteration._id}
                                    language={local?.lang}
                                />
                        ))
                    }
                </div>

                <div className='box-div-imputContain'>
                    <div className='box-inputContain box-static'>

                        <label className='box-label' htmlFor=""> Toma de orden
                            <input className='box-inputText' type="text" id="toma-orden" value={time1} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required
                                onChange={e => setTime1(e.target.value)}
                            />
                        </label>

                        {
                            localData.name === 'Mochima' ?
                                (
                                    <label className='box-label' htmlFor=""> Pago de pedido
                                        <input className='box-inputText' type="text" id="toma de envio" value={time2} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required
                                            onChange={e => setTime2(e.target.value)}
                                        />
                                    </label>
                                )
                                :
                                (
                                    null
                                )
                        }

                        <label htmlFor="" className='box-label'> Entrega de servicio
                            <input className='box-inputText' type="text" id="entrega plato" pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" value={time3} required
                                onChange={e => setTime3(e.target.value)}
                            />
                        </label>
                        {
                            title.isDescriptionPerson ?
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

                        <p className='box-textHourResult'>Tiempo total: <span>{calculateTime(time1, time3)}</span></p>
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

export { PickUp }