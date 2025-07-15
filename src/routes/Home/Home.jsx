import imgDefault from '../../../public/img/default.png';
import NavBar from '../../component/Navbar/NavBar.jsx';
import InboxImg from '../../component/inbox/images_inbox.jsx';
import AsideBar from '../../component/AsideBar/AsideBar.jsx';
import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../libs/fetch_data/instanceAxios.js';
import { isMobile, isTablet } from 'react-device-detect';
import { Main } from '../../component/Main/Main.jsx';
import Chat from '../../component/chat/Chat.jsx';
import { Await } from '../../component/Main/awaitComponent/AwaitComponent.jsx';
import { useDispatch, useSelector } from 'react-redux';
import { createIo } from '../../store/slices/socketio.js';



import { setEstablishment } from '../../store/slices/establishment.js';
import { setLocals } from '../../store/slices/locals.js';
import { BoxModal } from '../../component/Main/boxModal/BoxModal.jsx';
import URL from '../../libs/fetch_data/api_conexion.js';
import { getEstablishmentByIdFull } from '../../libs/fetch_data/establishmentFetching.js';
import { arrayBufferToBase64 } from '../../libs/script/toBase64.js';



export default function Home() {

    const selectEstablishment = useSelector(state => state.establishment);
    const dispatch = useDispatch();
    const localSelector = useSelector(state => state.locals);
    let [local, setLocal] = useState([]);
    let [listMenu, setListMenu] = useState([]);

    let [openAwaitWindow, setOpenAwait] = useState({ text: '', open: false });
    let [openModal, setOpenModal] = useState({ text: '', open: false });
    let [render, setRender] = useState(JSON.parse(localStorage.getItem('local_appExpress')));
    let [renderValue, setRenderValue] = useState(String);
    let [openSideBar, setOpenSideBar] = useState(false);



    const resetLocal = () => {
        setRender(render = false);
        localStorage.removeItem('local_appExpress');
    };


    const enter = () => {
        if (window.location.host !== 'localhost') {
            dispatch(createIo());
        }
        setRender(render = true);
    };


    const selectNovelty = (value) => {
        if ((typeof value) !== 'string') throw 'Type err, param not string';
        setRenderValue(renderValue = value);
        closeOpenAsideBar();
    };


    const configAwait = {
        open: (text) => {
            setOpenAwait(openAwaitWindow = { text: text, open: true });
        },
        close: () => {
            setOpenAwait(openAwaitWindow = { text: '', open: false });
        }
    };


    const configBoxModal = {
        open: (text) => {

            setOpenModal(openModal = { text: { title: text.title, description: text.description }, open: true });
        },
        close: () => {
            setOpenModal(openModal = { text: { title: '', description: '' }, open: false });
        }
    };


    const closeOpenAsideBar = () => {
        setOpenSideBar(!openSideBar);
    };


    useEffect(() => {
        axiosInstance.get(`${URL}/localLigth?populate=dishes`)
            .then(response => {
                dispatch(setLocals(response.data));
                if (localStorage.getItem('local_appExpress')) {
                    setLocal(local = JSON.parse(localStorage.getItem('local_appExpress')));
                }
            })
            .catch(err => {
                console.log(err);
            });


        axiosInstance.get(`${URL}/menu?alertLive=true`)
            .then(response => {
                setListMenu(response.data);
            })
            .catch(err => {
                console.log(err);
            });

        if (isMobile && !isTablet) setRender(render = true);
    }, []);




    useEffect(() => {
        const isEstablishmen = JSON.parse(localStorage.getItem('local_appExpress'));

        if (localSelector.length > 0 && !selectEstablishment && isEstablishmen && isEstablishmen.length > 0) {
            getEstablishmentByIdFull(isEstablishmen[0]._id)
                .then(response => {
                    dispatch(setEstablishment(response.data));
                    setLocal(isEstablishmen);
                })
                .catch(error => {
                    console.log(error);
                })
        }
    }, [localSelector]);



    const handdlerClickSeleted = useCallback((e) => {
        const localSelect = localSelector.filter(local => local._id === e.target.value);
        getEstablishmentByIdFull(localSelect[0]._id)
            .then(response => {
                localStorage.setItem('local_appExpress', JSON.stringify(localSelect));
                dispatch(setEstablishment(response.data));
                setLocal(localSelect);
            })
            .catch(error => {
                console.log(error);
            })
    }, [localSelector]);




    return (
        <>
            {
                render && listMenu.length > 0 ?
                    (
                        <div className="homeComponent">
                            <NavBar clearLocal={resetLocal} openCloseSidebar={closeOpenAsideBar} boxModal={configBoxModal} />
                            <AsideBar clearLocal={resetLocal} localMonitoring={local} selectNovelty={selectNovelty} openBoleanSidebar={openSideBar} />
                            <Main value={renderValue} selectNovelty={selectNovelty} awaitWindow={configAwait} boxModal={configBoxModal} menu={listMenu} />
                            <InboxImg />
                            <Chat key='chats' />
                            <Await config={openAwaitWindow} close={configAwait.close} />
                            <BoxModal config={openModal} close={configBoxModal.close} />
                        </div>
                    )
                    :
                    (
                        localSelector.length > 0 && listMenu.length > 0 ?
                            (
                                <div className='local-selectComponent'>
                                    <div className='local-selectContain'>
                                        <h1 className='local-title'>Seleciones el local a monitorear</h1>
                                        <select className='local-input-select' onChange={handdlerClickSeleted}
                                        >
                                            <option className='local-option' value="">- Selecciones un local -</option>
                                            {
                                                localSelector.map(local => (
                                                    local.status === 'activo' ?
                                                        (
                                                            <option className='local-option' key={local._id} value={local._id}>{local.name}</option>
                                                        )
                                                        :
                                                        (null)
                                                ))
                                            }
                                        </select>

                                        <img className='local-img ' src={selectEstablishment && selectEstablishment?.img?.data ? arrayBufferToBase64(selectEstablishment.img.data.data, 'image/png') : imgDefault} alt="" />

                                        <button className='local-btn-closeWindow' disabled={selectEstablishment ? false : true} onClick={enter} >Next</button>
                                    </div>
                                </div>
                            )
                            :
                            (
                                <div className='local-selectComponent'>
                                    <div className='spinner'>

                                    </div>
                                </div>
                            )
                    )
            }

        </>
    );
}