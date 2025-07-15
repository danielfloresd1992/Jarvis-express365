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
            if (data.idEstablishment === localState._id) setListImgState([{ ...data, isAnimate: true }, ...listImgState]);
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



    return (
        <div
            style={{
                position: 'fixed',
                right: '0',
                width: '300px',
                height: '100vh',
                backgroundColor: '#fff',
                padding: '4rem 0.5rem',

            }}
        >
            <div style={{ height: '50px' }}>
                <p style={{ color: '#000', textAlign: 'center' }} >Bandeja de entrada multimedia</p>
                <hr />
            </div>

            <div style={{ height: 'calc(100% - 25px)', backgroundColor: '#ddd', position: 'relative' }}>
                <div style={{ height: '100%', width: '100%', overflowY: 'scroll', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                    {
                        renderImages(listImgState)
                    }
                </div>
            </div>
        </div>
    )
}