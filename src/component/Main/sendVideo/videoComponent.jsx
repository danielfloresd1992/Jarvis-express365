import './style.css';
import dropImg from '../../../../public/img/drop.png';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRef } from 'react';
import BoxVideo from './video.jsx';




export default function VideoComponent({ awaitWindow, boxModal, getVideo }) {


    let [video, setVideo] = useState(null);
    const [videoArrState, setVideoArrState] = useState([null]);
    const [speedVideoState, setSpeedVideoState] = useState(0.5);
    const videoOriginalRef = useRef(null);

    let [title, setTitle] = useState([]);
    let [file, setFile] = useState(null);

    const [disableState, setDisableState] = useState(false);


    let [numberVideoCompleteState, setNumberVideoCompleteState] = useState(0);



    const isMountedRef = useRef(false);


    const URL = 'https://72.68.60.254:65431';


    useEffect(() => {  ///  fetching de concatenación

        const isUndefinex = videoArrState.filter(video => video === null)
        if (isUndefinex.length < 1) {
            awaitWindow.open('Preparando resultado para mostrar');

            const formData = new FormData();

            videoArrState.forEach(video => {
                formData.append(`file`, video.file);
            });

            axios.post(`${URL}/servise/video/concact`, formData, { responseType: 'blob' })
                .then(response => {
                    renderVideo(response.data, true);
                })
                .catch(err => {
                    console.log(err);
                })
                .finally(() => {
                    awaitWindow.close();
                })

        }

    }, [videoArrState]);



    useEffect(() => {

        if (isMountedRef.current) {
            awaitWindow.open('acelerando video');
            const formData = new FormData();
            formData.append('file', videoOriginalRef.current);
            axios.post(`${URL}/servise/video/speed=${speedVideoState}`, formData, { responseType: 'blob' })
                .then(response => {
                    setDisableState(true);
                    console.log(response.data)
                    if (response.status === 200) renderVideo(response.data, false);

                })
                .catch(err => {
                    console.log(err);
                })
                .finally(() => {
                    awaitWindow.close();
                })
        }
    }, [speedVideoState]);



    const onChange = (video) => {

        const type = ['video/mp4', 'video/avi', ''];
        const typeItem = type.filter(item => item === video.type);

        if (typeItem.length === 0) {
            boxModal.open({ title: 'Aviso', description: 'Extención del archivo invalido' });
            return awaitWindow.close();
        }

        const formData = new FormData();
        formData.append('file', video);

        axios.post(`${URL}/servise/video`, formData, { responseType: 'blob' })
            .then(response => {
                renderVideo(response.data, true);
            })
            .catch(err => {
                console.log(err);
            })
            .finally(() => {
                awaitWindow.close();
            });
    };


    const renderVideo = (video, changeOrigin = false) => {
        console.log(video);
        isMountedRef.current = true;
        const url = window.URL.createObjectURL(new Blob([video]));
        setFile(file = url);
        const newFile = new File([video], 'video', { lastModified: new Date().getTime(), type: video.type });
        if (changeOrigin) videoOriginalRef.current = newFile;
        setVideo(video = newFile);
        if (typeof getVideo === 'function') getVideo(newFile);
    };




    const updateArrVideo = videoRequest => {
        const newArr = [...videoArrState];
        newArr[videoRequest.order] = videoRequest;
        setVideoArrState(newArr);
    };


    const resetVideo = () => {
        setVideoArrState([null]);
        setVideo(null);
        setVideoArrState([null]);
        setSpeedVideoState(0.5);
        videoOriginalRef.current = null;
        setFile(null);
        setDisableState(false);
        setNumberVideoCompleteState(0);
        if (typeof getVideo === 'function') getVideo(null);
    };



    return (

        <div className='vc-wrap'>

            {/* ── Panel de control ── */}
            <div className='vc-panel'>

                {/* Cantidad de videos */}
                <div className='vc-control'>
                    <p className='vc-control__label'>Cantidad de videos</p>
                    <p className='vc-control__value'>{videoArrState.length}</p>
                    <div className='vc-stepper'>
                        <button
                            className='vc-step-btn'
                            disabled={disableState}
                            type='button'
                            onClick={() => {
                                if (videoArrState.length === 1) return;
                                const numberArr = [...videoArrState];
                                numberArr.pop(null);
                                setVideoArrState(numberArr);
                            }}
                        >−</button>
                        <button
                            className='vc-step-btn'
                            disabled={disableState}
                            type='button'
                            onClick={() => {
                                if (videoArrState.length === 4) return;
                                const numberArr = [...videoArrState];
                                numberArr.push(null);
                                setVideoArrState(numberArr);
                            }}
                        >+</button>
                    </div>
                </div>

                {/* Velocidad */}
                <div className='vc-control'>
                    <p className='vc-control__label'>Velocidad</p>
                    <p className='vc-control__value'>{speedVideoState}×</p>
                    <div className='vc-stepper'>
                        <button
                            className='vc-step-btn'
                            disabled={disableState}
                            type='button'
                            onClick={() => setSpeedVideoState(state => Number((state - 0.1).toFixed(1)))}
                        >−</button>
                        <button
                            className='vc-step-btn'
                            disabled={disableState}
                            type='button'
                            onClick={() => setSpeedVideoState(state => Number((state + 0.1).toFixed(1)))}
                        >+</button>
                    </div>
                </div>

                {/* Acciones */}
                {file && (
                    <div className='vc-control' style={{ justifyContent: 'center' }}>
                        <a className='vc-action' href={file} download='video.mp4'>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Descargar
                        </a>
                    </div>
                )}

                <div className='vc-control' style={{ justifyContent: 'center' }}>
                    <button type='button' className='vc-action vc-action--reset' onClick={resetVideo}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" />
                        </svg>
                        Reiniciar
                    </button>
                </div>
            </div>

            {/* Nota de orden */}
            {videoArrState.length > 1 && (
                <p className='vc-note'>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    Coloque los videos en orden ascendente, uno después del otro
                </p>
            )}

            {/* ── Escenario de videos ── */}
            <div className='vc-stage'>
                {videoArrState?.length < 2 ? (
                    /* Reproductor único / dropzone */
                    <div className='vc-player-wrap'>
                        <span className='vc-player-badge'>
                            <span className='vc-player-badge__dot' />
                            {file ? 'Video' : 'Suelta tu video aquí'}
                        </span>
                        <video
                            autoPlay
                            controls
                            loop
                            className='vc-player'
                            src={file || dropImg}
                            onDragLeave={e => e.preventDefault()}
                            onDragEnter={e => e.preventDefault()}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                                e.preventDefault();
                                awaitWindow.open('Procesando video, por favor espere...');
                                onChange(e.dataTransfer.files[0]);
                            }}
                        />
                    </div>
                ) : (
                    /* Multi-video: grid de drops + resultado */
                    <div className='vc-grid'>
                        {videoArrState.map((element, indexItem) => (
                            <BoxVideo
                                key={indexItem}
                                changeEvent={updateArrVideo}
                                index={indexItem}
                                awaitWindow={awaitWindow}
                                countVideo={numberVideoCompleteState}
                                setVideoComplete={() => {
                                    setDisableState(true);
                                    setNumberVideoCompleteState(numberVideoCompleteState = numberVideoCompleteState + 1);
                                }}
                                setError={(error) => {
                                    console.log(error);
                                    if (error?.response) {
                                        if (error.response.status === 400) boxModal.open({ title: 'Error', description: 'Error en el formato de archivo' });
                                        if (error.response.status === 413) boxModal.open({ title: 'Error', description: 'Error en el peso de archivo, excede 50MB' });
                                    }
                                    else if (error.message) {
                                        boxModal.open({ title: 'Error', description: error?.message });
                                    }
                                }}
                            />
                        ))}

                        {file && (
                            <div className='vc-result'>
                                <div className='vc-player-wrap'>
                                    <span className='vc-player-badge'>
                                        <span className='vc-player-badge__dot' />
                                        Resultado
                                    </span>
                                    <video autoPlay loop controls className='vc-player' src={file} />
                                </div>
                                <p className='vc-result__label'>Video unido listo</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}