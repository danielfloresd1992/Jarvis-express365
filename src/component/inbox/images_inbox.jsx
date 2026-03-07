import { isMobile, isTablet } from 'react-device-detect';
import { useState, useEffect, useCallback } from 'react'
import { socketAppManager } from '../../store/slices/socketio';
import { useSelector } from 'react-redux';
import BoxImg from './BoxImg';
import { getFileToastPos, deleteFileToasPos } from '../../libs/fetch_data/noveltyFecth';



export default function InboxImg() {

    if (isMobile && !isTablet) return null;

    const [keyFecthState, setKeyFecthState] = useState(true);
    const [errorState, setErrorState] = useState(null);
    const [listImgState, setListImgState] = useState([]);
    const userState = useSelector(state => state.user);
    const [localState, setLocalState] = useState(JSON.parse(localStorage.getItem('local_appExpress'))[0]);
    const [collapsed, setCollapsed] = useState(true);


    useEffect(() => {
        if (localState && userState && keyFecthState) {
            setKeyFecthState(false);
            getFileToastPos(localState._id)
                .then(response => {
                    setListImgState(response.data);
                })
                .catch(error => {
                    console.log(error);
                    setErrorState(error);
                })
        }
    }, [userState, localState, listImgState]);



    useEffect(() => {
        let key = true;

        const handdlerData = data => {
            if (data.idEstablishment === localState._id) {
                setListImgState([{ ...data, isAnimate: true }, ...listImgState]);
                setCollapsed(false);
            }
        }

        socketAppManager.on('fileLoader', handdlerData);

        return () => {
            socketAppManager.off('fileLoader', handdlerData);
            key = false;
        }
    }, [listImgState, localState]);



    const deleteItems = useCallback((id) => {
        deleteFileToasPos(id)
            .then(response => {
                const idDeleted = response.data._id;
                const newList = listImgState.filter(items => items._id !== idDeleted);
                setListImgState(newList);
            })
            .catch(error => {
                console.log(error);
            })
    }, [listImgState]);



    const renderImages = (listImgState) => { return listImgState.map(item => (<BoxImg key={item._id} {...item} deleteImg={deleteItems} />)) };

    const count = listImgState.length;

    return (
        <>
            {/* Toggle tab — always visible */}
            <button
                className="inbox-toggle z-[1001]"
                onClick={() => setCollapsed(!collapsed)}
                title='Bandeja de imagenes del Toast POS'
            >
                <img className='w-[20px]' src='/ico/icons8-imagen-50.png' alt='ico-image-box' />
                {count > 0 && <span className="inbox-toggle__badge">{count}</span>}
            </button>

            {/* Panel */}
            <aside className={`inbox-panel ${collapsed ? 'inbox-panel--collapsed' : 'inbox-panel--open'} z-[1000]`}>
                <div className="inbox-panel__header">
                    <h3 className="inbox-panel__title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                            <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
                        </svg>
                        Toast POS
                    </h3>
                    {count > 0 && <span className="inbox-panel__count">{count}</span>}
                    <button className="inbox-panel__close" onClick={() => setCollapsed(true)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="inbox-panel__body">
                    {listImgState.length > 0 ? (
                        renderImages(listImgState)
                    ) : (
                        <div className="inbox-panel__empty">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                                <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
                            </svg>
                            <p>Sin archivos nuevos</p>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}