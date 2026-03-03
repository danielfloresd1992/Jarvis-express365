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
                className="inbox-toggle"
                onClick={() => setCollapsed(!collapsed)}
                title="Bandeja multimedia"
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M21 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2zM8.5 10a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm12.5 9H3l5-6.5 3 3.5 4-5 6.5 8z" />
                </svg>
                {count > 0 && <span className="inbox-toggle__badge">{count}</span>}
            </button>

            {/* Panel */}
            <aside className={`inbox-panel ${collapsed ? 'inbox-panel--collapsed' : 'inbox-panel--open'}`}>
                <div className="inbox-panel__header">
                    <h3 className="inbox-panel__title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                            <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
                        </svg>
                        Bandeja multimedia
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
    )
}