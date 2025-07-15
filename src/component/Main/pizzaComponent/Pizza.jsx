import { useState, useRef, useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import { useSelector } from 'react-redux';
import { useAlert } from '../../../hook/useAlert.jsx';
import { Search } from '../search/searchComponent.jsx';
import { useSaveNoveltie } from '../../../hook/useSaveNoveltie';
import { useDataUser } from '../../../hook/useTextMenu.jsx';
import { ImgBoxImg } from '../imgBoxComponent/ImgBox.jsx';
import axiosInstance from '../../../libs/fetch_data/instanceAxios.js';

import URL from '../../../libs/fetch_data/api_conexion.js';
import { ImgComponent } from '../SendNovelties/ImageComponent.jsx';
import useAdapterResize from '../../../hook/adapter_resize.jsx';
import { sendFile } from '../../../libs/fetch_data/multimedia.Fetching.js';
import { blobToFile } from '../../../libs//script/64toFile.js';




export default function Pizza({ awaitWindow, boxModal, title, reset }) {


    const users = useSelector(state => state.users);
    const locals = useSelector(state => state.locals);
    const sectionHtmlRef = useRef(null);
    const alert = useAlert();
    const saveNoveltie = useSaveNoveltie();
    let [files, setFiles] = useState([]);
    let [description, setDescription] = useState('');
    const user = useRef(null);
    let [local, setLocal] = useState(null);
    const menuRef = useRef({});
    const { htmlAdapterRef } = useAdapterResize({ breackWidth: 1350 });


    useEffect(() => {
        if (!isMobile) setLocal(local = JSON.parse(localStorage.getItem('local_appExpress'))[0]);
    }, []);


    const pushImg = file => {
        setFiles(files = [...files, file]);
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


    const sendImg = async e => {
        e.preventDefault();
        console.log(menuRef);

        if (files.length < 1) return boxModal.open({ title: 'Error', description: 'Selecione una puta imagen, JILIPOLLAS!' });

        awaitWindow.open('Enviando novedad');
        let text;
        let descriptionMenu;
        const caption = [];

        const data = useDataUser(user.current, local, sessionStorage.getItem('session'), localStorage.getItem('local_appExpress'));

        if (data.LANG === 'es') {

            text = `*${data.localData.name}*\n_*${title.es}*_\nApariencia: ${menuRef.current.appearance}\nTamaño: ${menuRef.current.size}\nIngredientes: ${menuRef.current.ingredients}\nNumero de mesa: ${menuRef.current.table}\nEnvio por delivery: ${menuRef.current.delivery}\nNumero de ticket: ${menuRef.current.tiket}\nEs desechada: ${menuRef.current.thrown}\nTipo: ${menuRef.current.type}\nEnviamos imagen para su evaluación\n${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;

        }
        else {

            text = `*${data.localData.name}*\n_*${title.en}*_\nAppearance: ${menuRef.current.appearance}\nSize: ${menuRef.current.size}\nIngredients: ${menuRef.current.ingredients}\nSent to table: ${menuRef.current.table}\nSent to delivery: ${menuRef.current.delivery}\nTicket: ${menuRef.current.tiket}\nThrown away: ${menuRef.current.thrown}\nType: ${menuRef.current.type}\n\nWe send this image for your verification\n${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
        }

        const dataForRequest = {};

        const responseUrl = files[0].url;
        dataForRequest.imageToShare = responseUrl;


        dataForRequest.imageUrl = [{ url: dataForRequest.imageToShare, caption: 'calidad' }];

        dataForRequest.title = title.es;
        dataForRequest.userName = data.userData.userName;
        dataForRequest.userId = data.userData.userId;
        dataForRequest.localName = data.localData.name;
        dataForRequest.localId = data.localData.localId;
        dataForRequest.description = descriptionMenu;
        dataForRequest.menu = text;
        dataForRequest.alertId = title._id;


        axiosInstance.post(`${URL}/novelties`, dataForRequest)
            .then(response => {
                console.log(response);
                if (response.status === 200) {
                    saveNoveltie.save(`Pick up}`, data.userData);
                    alert.request(`Calidad de pizza en ${data.localData.name}. por validar`);
                    user.current = null;
                    setLocal(local = null);
                    boxModal.open({ title: 'Aviso', description: 'Novedad enviada' });
                    reset('');
                }
            })
            .catch(err => {
                console.log(err);
                awaitWindow.close();
                boxModal.open({ title: 'Error', description: 'Error al eviar la novedad' });
            })
            .finally(() => {
                awaitWindow.close();
            });
        awaitWindow.close();
    };






    function returnForm(localData) {
        return (
            <>
                <div className='box-imgComponenContent' ref={htmlAdapterRef} >
                    <h3 className='box-div-title' >{title.es}</h3>

                    {
                        title.photos.caption.map(iteration => (

                            <ImgComponent
                                saveImg={pushImg}
                                data={iteration}
                                deleteFile={deleteImg}
                                boxModal={boxModal}
                            />

                        ))
                    }
                </div>

                <div className='box-div-imputContain'>
                    <div className='box-inputContain box-static'>

                        <label className='box-label' htmlFor=""> Apariencia
                            <label><input onChange={e => menuRef.current.appearance = e.target.value} required={true} type='radio' name='Apariencia' value='✅' /> SI</label>
                            <label><input onChange={e => menuRef.current.appearance = e.target.value} required={true} type='radio' name='Apariencia' value='❌' /> NO</label>
                        </label>

                        <label className='box-label' htmlFor=""> Tamaño
                            <label><input onChange={e => menuRef.current.size = e.target.value} required={true} type='radio' name='Tamaño' value='✅' /> SI</label>
                            <label><input onChange={e => menuRef.current.size = e.target.value} required={true} type='radio' name='Tamaño' value='❌' /> NO</label>
                        </label>

                        <label className='box-label' htmlFor=""> Ingredientes
                            <label><input onChange={e => menuRef.current.ingredients = e.target.value} required={true} type='radio' name='Ingredientes' value='✅' /> SI</label>
                            <label><input onChange={e => menuRef.current.ingredients = e.target.value} required={true} type='radio' name='Ingredientes' value='❌' /> NO</label>
                        </label>

                        <label htmlFor="" className='box-label'> Numero de mesa
                            <input className='box-inputText' type="text" id="entrega plato" required
                                onChange={e => menuRef.current.table = e.target.value}
                            />
                        </label>

                        <label className='box-label' htmlFor=""> Envio de delivery
                            <label><input onChange={e => menuRef.current.delivery = e.target.value} required={true} type='radio' name='delivery' value='✅' /> SI</label>
                            <label><input onChange={e => menuRef.current.delivery = e.target.value} required={true} type='radio' name='delivery' value='❌' /> NO</label>
                        </label>

                        <label htmlFor="" className='box-label'> Numero de tiket
                            <input className='box-inputText' type="text" id="entrega plato" required
                                onChange={e => menuRef.current.tiket = e.target.value}
                            />
                        </label>

                        <label className='box-label' htmlFor=""> Es desechada
                            <label><input onChange={e => menuRef.current.thrown = e.target.value} required={true} type='radio' name='desechada' value='✅' /> SI</label>
                            <label><input onChange={e => menuRef.current.thrown = e.target.value} required={true} type='radio' name='desechada' value='❌' /> NO</label>
                        </label>

                        <label className='box-label' htmlFor=""> Tipo de plato

                            <select
                                className='box-inputText'
                                style={
                                    {
                                        textAlign: 'left',
                                        backgroundColor: '#000',
                                        color: '#fff'
                                    }
                                }
                                valueDefauld='Selecione'
                                required
                                onChange={e => menuRef.current.type = e.target.value}
                            >
                                <option disabled={true} selected value='Selecione'>Selecione</option>
                                <option value='Cheese Pizza'>Cheese Pizza</option>
                                <option value='Bella Margherita'>Bella Margherita</option>
                                <option value='Pepperoni'>Pepperoni</option>
                                <option value='Ham'>Ham</option>
                                <option value='Sausage'>Sausage</option>
                                <option value='Mushrooms'>Mushrooms</option>
                                <option value='Hawaiana'>Hawaiana</option>
                                <option value='Meat Lovers'>Meat Lovers</option>
                                <option value='Meat Lovers 2.0'>Meat Lovers 2.0</option>
                                <option value='Federica'>Federica</option>
                                <option value='Matteo'>Matteo</option>
                                <option value='Matteo 2.0'>Matteo 2.0</option>
                                <option value='Matteo 305'>Matteo 305</option>
                                <option value='Vittoria'>Vittoria</option>
                                <option value='Riccardo'>Riccardo</option>
                                <option value='Daniele'>Daniele</option>
                                <option value='Star Luca'>Star Luca</option>
                                <option value='Star Alessandro'>Star Alessandro</option>

                                <option value='Star Laina'>Star Laina</option>
                                <option value='Star Beckham'>Star Beckham</option>
                                <option value='Star Carlos'>Star Carlos</option>
                                <option value='Star Carlos 2.0'>Star Carlos 2.0</option>
                                <option value='Marco'>Marco</option>

                                <option value='Claudio'>Claudio</option>
                                <option value='Anchovy Bottarga Giampaolo'>Anchovy Bottarga Giampaoloo</option>
                                <option value='Ginger Lilliam'>Ginger Lilliam</option>
                                <option value='Piero'>Piero</option>
                                <option value='Elisa'>Elisa</option>
                                <option value='Coffee Paolo'>Coffee Paolo</option>
                                <option value='Calzone Onju'>Calzone Onju</option>
                                <option value='Calzone Lorenzo'>Calzone Lorenzo</option>

                                <option value='Calzone Lorenzo'>Calzone Giorgio</option>
                                <option value='Nutella Pizza'>Nutella Pizza</option>
                                <option value='Nutella & Banana Calzone'>Nutella & Banana Calzone</option>
                                <option value='Vegan Hazelnut Chocolate Pizza'>Vegan Hazelnut Chocolate Pizza</option>
                                <option value='Rosemary Focaccia'>Rosemary Focaccia</option>
                                <option value='Caprese'>Caprese</option>
                                <option value='Burrata'>Burrata</option>

                                <option value='Burrata e Balsamic Glaze'>Burrata e Balsamic Glaze</option>
                                <option value='Burrata e White Truffle Oil'>Burrata e White Truffle Oil</option>


                                <option value='Burrata e Crudo'>Burrata e Crudo</option>

                                <option value='Combination example of Burrata e White Truffle Oil with additionnal Prosciutto'>Combination example of Burrata e White Truffle Oil with additionnal Prosciutto</option>

                                <option value='Caesar Salad'>Caesar Salad</option>
                                <option value='Azzurra Salad'>Azzurra Salad</option>
                                <option value='Sabrina Salad'>Sabrina Salad</option>
                                <option value='Sonia Salad'>Sonia Salad</option>
                                <option value='Laura Salad'>Laura Salad</option>
                            </select>

                        </label>

                        <label className='box-label' htmlFor=""> Nota
                            <textarea
                                className='box-textArea'
                                spellCheck="true"
                                autoComplete='true'
                                placeholder='en caso que lo amerite'
                                cols="30"
                                rows="10"
                                value={description}
                                onChange={e => setDescription(description = e.target.value)}>
                            </textarea>
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
};