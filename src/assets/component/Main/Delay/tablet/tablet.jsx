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
import { TABLET_RULES, checkTime } from './model.js';
import URL from '../../../api_conexion.js';
import useAdapterResize from '../../../../hook/adapter_resize.jsx';
import calculateTime from '../../../../util/calculate_time.js';
import { sendFile } from '../../../../util/multimedia.Fetching.js';
import { blobToFile } from '../../../../util/64toFile.js';




function TabletDelay({ awaitWindow, boxModal, reset, title: noveltyConfig }) {

    const seletedEstableshment = useSelector(state => state.establishment);
    const users = useSelector(state => state.users);
    const locals = useSelector(state => state.locals);
    const { htmlAdapterRef } = useAdapterResize({ breackWidth: 1350 });
    const config = {
        hiddenBoxText: true,
        edit: true
    }

    const alert = useAlert();
    const saveNoveltie = useSaveNoveltie();

    const user = useRef(null);
    const dish = useRef('');

    let [tiket, setTiket] = useState('');
    let [local, setLocal] = useState(null);

    let [files, setFiles] = useState([null]);
    let [table, setNumberTable] = useState('');

    let [time1, setTime1] = useState('');
    let [time2, setTime2] = useState('');
    let [time3, setTime3] = useState('');
    let [time4, setTime4] = useState('');

    let [timeTotal, setTimeTotal] = useState('');
    const [correspondingTimesState, setCorrespondingTimesState] = useState(false);
    let [textResult, setResult] = useState('00:00:00');
    let [description, setDescription] = useState('');


    useEffect(() => {
        isMobile ? null : setLocal(local = JSON.parse(localStorage.getItem('local_appExpress'))[0]);
    }, []);




    const pushImg = file => {
        setFiles([file]);
    };

    const deleteImg = text => {
        const getItems = files.filter(file => file.caption !== text);
        setFiles(files = getItems);
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
                <div className='box-imgComponenContent' ref={htmlAdapterRef}>
                    {
                        noveltyConfig.photos.caption.map(iteration => (
                            <ImgBoxImg data={iteration} boxModal={boxModal} setImg={pushImg} deleteImg={deleteImg} key={iteration.index} language={local?.lang} config={config} />

                        ))
                    }
                </div>
            </>
        );
    };



    const sendImgForm = async e => {
        try {
            e.preventDefault();
            awaitWindow.open('Enviando novedad...');


            if (isMobile) {
                if (user.current === null) {
                    awaitWindow.close();
                    return boxModal.open({ title: 'Error', description: 'El nombre del operador es invalido, o no está registrado en el sistema' });
                }
            }

            if (dish.current === '') throw new Error('Seleccione el tipo de plato');



            /*
            const key = checkTime(TABLET_RULES, local, { dishName: dish.current, time: timeTotal });

            
            if (key.indexOf > -1 && !key.result) {
                awaitWindow.close();
                return  boxModal.open({ title: 'Error', description: key.error });
            }
            */

            let text;
            const data = useDataUser(user.current, local, sessionStorage.getItem('session'), localStorage.getItem('local_appExpress'));
            const FOR_MISTER01 = `${local.franchise === 'Mister01' ? `tiempo que excede: ${returnTimeExceding(time3, time1)}` : ''}`;

            if (data.LANG === 'es') {
                text = `*${data.localData.name}*\n_*Demora en preparación de ${dish.current.nameDishe}*_\nMesa: ${table}\n${tiket !== '' ? `Número de tiket: ${tiket}\n` : ''}Toma de orden: ${time1}\nListo en tablet: ${time2}\nListo en ${dish.current?.category === 'drinks' ? 'barra' : 'cocina'}: ${time3}\nEntrega de ${dish.current.nameDishe}: ${time4}\n*Demora en preparación: ${returnTimeExceding(time2, time1)}*\nTiempo total: ${returnTimeExceding(time4, time1)}${correspondingTimesState ? '\nNota: La orden estuvo dentro de los tiempos correspondientes, sin embargo no fue marcada en pantalla al momento, por tal motivo siguió corriendo el tiempo y se registra la demora en nuestro sistema, quedamos atentos a sus comentarios.' : ''}`;
            }
            else {
                if (data.localData.name === 'Mister Boca Ratón') {

                    text = `*${data.localData.name}*\n_*${dish.current.nameDishe} preparation delay*_\nTicket: #${tiket}\nTable: ${table}\nOrder take: ${time1}\nReady in tablet: ${time2}\nReady in kitchen: ${time3}\n${dish.current.nameDishe} delivery: ${time4}\nDelay in preparation: ${returnTimeExceding(returnTimeExceding(time2, time1), key.timeExceeding)}\nTotal time: ${returnTimeExceding(time4, time1)}${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
                }
                else {
                    text = `*${data.localData.name}*\n_*${dish.current.nameDishe} preparation delay*_\nTicket: #${tiket}\nTable: ${table}\nOrden Take: ${time1}\nReady in kitchen: ${time3}\nReady in tablet: ${time2}\n${dish.current.nameDishe} delivery: ${time4}\nExceeding time at preparation: ${returnTimeExceding(returnTimeExceding(time3, time1), key.timeExceeding)}${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
                }
            }


            let dataForRequest = {};

            files.forEach((data) => {
                if (!data) throw new Error(`Debe ingresas las imagenes correspondiente, imagen: ${index + 1}`)
                if(!dataForRequest.imageUrl) dataForRequest.imageUrl = [];
                dataForRequest.imageUrl.push({ url : data.url, caption: data.caption });
            });

          //  const repsonseData = await sendFile(blobToFile(files[0].file));
            dataForRequest.imageToShare = dataForRequest.imageUrl[0].url;


            dataForRequest.title = `Demora de ${dish.current.nameDishe}`;
            dataForRequest.table = table;
            dataForRequest.nameDish = dish.current.nameDishe;
            dataForRequest.userName = data.userData.userName;
            dataForRequest.userId = data.userData.userId;
            dataForRequest.localName = data.localData.name;
            dataForRequest.localId = data.localData.localId;
            dataForRequest.description = `Demora en preparación de ${dish.current.nameDishe}, tiempo total: ${timeTotal}, ${FOR_MISTER01}`
            dataForRequest.menu = text;
            dataForRequest.rulesForBonus = noveltyConfig.rulesForBonus;
            dataForRequest.alertId = noveltyConfig?._id;
            dataForRequest.numberTiket = tiket;
            dataForRequest.timePeriod = {
                tomaOrden: time1,
                listoTablet: time2,
                listoCocina: time3,
                entregaPlato: time4
            };


            axiosInstance.post(`${URL}/novelties`, dataForRequest)
                .then(response => {
                    console.log(response);
                    if (response.status === 200) {
                        saveNoveltie.save(`Demora de tablet - mesa ${table}`, data.userData);
                        alert.request(`demora de tablet en ${data.localData.name}. por validar`);
                        setNumberTable('');
                        setFiles(files => files = []);
                        setTime1(time1 = '');
                        setTime2(time2 = '');
                        setTimeTotal(timeTotal = '');
                        dish.current = null;
                        boxModal.open({ title: 'Aviso', description: 'Novedad enviada' });
                        reset();
                    }
                })
                .catch(err => {
                    console.log(err);
                    const error = err;
                    boxModal.open({ title: 'Error', description: error });
                })
                .finally(() => {
                    awaitWindow.close();
                });
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




    function returnForm(localData) {


        return (
            <div className='box-inputContain box-div-imputContain'>
                
                {/*
                    <label className='box-label' htmlFor=""> Número de tiket
                    <input className='box-inputText' type="text" id="toma-orden" required value={tiket}
                        onChange={e => setTiket('')}
                    />
                </label>
                */}




                <label className='box-label' htmlFor=""> Número de mesa
                    <input className='box-inputText' type="text" id="table" value={table} required
                        onChange={e => {
                            setNumberTable(table = e.target.value);
                        }}
                    />
                </label>

                <label htmlFor="" className='box-label'>Tipo de plato
                    <select
                        className='box-inputText'
                        onChange={e => {
                            if (seletedEstableshment.dishes.length > 0) {
                                const dishSeleted = seletedEstableshment.dishes.filter(dish => dish.nameDishe === e.target.value);
                                dish.current = dishSeleted[0];
                            }
                            else {
                                dish.current = {
                                    nameDishe: e.target.value
                                };
                            }
                        }}
                        required
                        defaultValue={null}
                    >
                        <option value={null} selected disabled={true}>--Selecione--</option>
                        {
                            seletedEstableshment.dishes.length > 0 ?
                                seletedEstableshment.dishes.map(items => (
                                    <option key={items._id} value={items.nameDishe} style={{ color: '#000', backgroundColor: '#fff' }}>{items.nameDishe}</option>

                                ))
                                :
                                <>
                                    {
                                        localData.dishMenu.dishEvaluation === 'completo' ?
                                            <option value={local.dishMenu.dessert}>{localData.dishMenu.dessert}</option>
                                            :
                                            null
                                    }
                                    {
                                        localData.name === 'Bocas Brickell' || localData.name === 'Dando la Brasa' ?
                                            (
                                                <>
                                                    <option value='Drink'>Drink</option>
                                                    <option value='Drink bar'>Drink bar</option>
                                                    <option value='Cafe'>Cafe</option>
                                                    <option value='Uber Eats'>Uber Eats</option>
                                                    <option value='Grup hub'>Grup hub</option>
                                                    <option value='Door Dash'>Door Dash</option>
                                                    <option value='Postmates'>Postmates</option>
                                                    <option value='Take Out'>Take Out</option>
                                                </>
                                            )
                                            :
                                            (
                                                null
                                            )
                                    }
                                    {
                                        localData.name === 'Mister Turtle Creek' || localData.name === 'Mister Boca Ratón' ?
                                            (
                                                <option value='Dessert'>Dessert</option>
                                            )
                                            :
                                            (
                                                null
                                            )
                                    }
                                </>
                        }


                    </select>
                </label>



                <label className='box-label' htmlFor=""> Toma de orden
                    <input className='box-inputText' type="text" id="toma-orden" value={time1} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required maxLength="8"
                        onChange={e => setTime1(e.target.value)}
                    />
                </label>


                <label className='box-label' htmlFor=""> Listo en tablet
                    <input className='box-inputText' type="text" id="Listo-tablet" value={time2} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required maxLength="8"
                        onChange={e => setTime2(e.target.value)}
                    />
                </label>


                <label htmlFor="" className='box-label'> Listo en cocina
                    <input className='box-inputText' type="text" id="listo-cocina" value={time3} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required maxLength="8"
                        onChange={e => setTime3(e.target.value)}
                    />
                </label>



                <label htmlFor="" className='box-label'> Entrega de plato
                    <input className='box-inputText' type="text" id="entrega plato" value={time4} pattern="^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$" required maxLength="8"
                        onChange={e => setTime4(e.target.value)}
                    />
                </label>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '1rem 0' }}>
                    <p className='box-textHourResult'>Tiempo total en cocina: <span>{time1 && time3 ? returnTimeExceding(time3, time1) : ''}</span></p>
                    <p className='box-textHourResult'>Tiempo total en tablet: <span>{time1 && time2 ? returnTimeExceding(time2, time1) : ''}</span></p>
                    <p className='box-textHourResult'>Tiempo total en entrega de plato: <span>{time1 && time4 ? returnTimeExceding(time4, time1) : ''}</span></p>
                </div>


                <label htmlFor="" className='box-label' style={{ textAlign: 'center' }}>¿estuvo dentro de los tiempos correspondientes?
                    <br />
                    <p style={{ textAlign: 'center' }}>('no fue marcada en pantalla')</p>
                    <input className='box-inputText' type="checkbox" value={correspondingTimesState}
                        onChange={e => setCorrespondingTimesState(e.target.checked)}
                    />
                </label>


                {
                    correspondingTimesState ?
                        <h1 style={{ color: '#000' }}>Si</h1>
                        :
                        <h1 style={{ color: '#000' }}>No</h1>
                }
                <br />
                <label className='box-label' htmlFor="">Nota
                    <textarea className='box-textArea' spellCheck="true" autoComplete='true' placeholder='en caso que lo amerite' cols="30" rows="10" value={description} onChange={e => setDescription(description = e.target.value)}></textarea>
                </label>

                <button className='btnSend' >Enviar</button>

            </div>
        );
    }


    return (
        <>
            <form className='box-send' onSubmit={e => sendImgForm(e)}>
            <h2 style={{ color: 'rgb(92 92 92)', textDecoration: 'underline', textAlign: 'center' }}>Demora de tablet</h2>

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

export { TabletDelay } 