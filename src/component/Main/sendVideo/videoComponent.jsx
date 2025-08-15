import './style.css';
import dropImg from '../../../../public/img/drop.png';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRef } from 'react';
import NavBar from '../../layaut/NasBar.jsx';
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


    const URL = location.hostname === 'jarvis-express.netlify.app' ? 'https://72.68.60.254:65431' : 'https://72.68.60.201:3001';


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

        <div className='box-send-videoContent' >
            <NavBar>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        color: '#fff'
                    }}
                >

                    <p>Cantidad de videos</p> <p style={{ fontSize: '1.2rem' }}>{videoArrState.length}</p>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '.5rem'
                        }}
                    >
                        <button
                            className='btn'
                            disabled={disableState}
                            type='button'
                            onClick={e => {
                                if (videoArrState.length === 1) return;
                                let numberArr = [...videoArrState];
                                numberArr.pop(null);
                                setVideoArrState(numberArr)
                            }}
                        >-</button>

                        <button
                            className='btn'
                            disabled={disableState}
                            type='button'
                            onClick={e => {
                                if (videoArrState.length === 4) return;

                                let numberArr = [...videoArrState];
                                numberArr.push(null);
                                setVideoArrState(numberArr);
                            }}
                        >+</button>

                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        color: '#fff'
                    }}
                >
                    <p>Velodidad</p>
                    <p>{speedVideoState}</p>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '.5rem'
                        }}
                    >
                        <button
                            className='btn'
                            disabled={disableState}
                            type='button'
                            onClick={e => {
                                setSpeedVideoState(state => state = Number((state - 0.1).toFixed(1)));
                            }}
                        >-</button>

                        <button
                            className='btn'
                            disabled={disableState}
                            type='button'
                            onClick={e => {
                                setSpeedVideoState(state => state = Number((state + 0.1).toFixed(1)));
                            }}
                        >+</button>

                    </div>
                </div>
                {
                    file ?
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ top: '20px', right: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #fff', height: '40%', padding: '1rem', borderRadius: '5px' }}>
                                <a style={{ color: '#fff' }} href={file} download='video.mp4'>Descargar video</a>
                            </div>
                        </div>
                        :
                        null
                }
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <button type='button' onClick={resetVideo} style={{ backgroundColor: 'transparent', top: '20px', right: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #fff', height: '40%', padding: '1rem', borderRadius: '5px' }}>
                        Reset
                    </button>
                </div>
            </NavBar>

            <div className={{ width: '100%' }}>
                {
                    videoArrState.length > 1 ?
                        <p style={{ fontSize: '.8rem', color: '#fff' }}>Nota: Coloque los videos en orden acendente uno despues del otro</p>
                        :
                        null
                }

            </div>

            <div className=''
                style={{
                    width: '100%'
                }}
            >
                {
                    videoArrState?.length < 2 ?

                        <video autoPlay controls className='box-imgContain' src={file ? file : dropImg}
                            value={file}
                            onDragLeave={e => e.preventDefault()}
                            onDragEnter={e => e.preventDefault()}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                                e.preventDefault();

                                awaitWindow.open('Procesando video, por favor espere...');
                                onChange(e.dataTransfer.files[0])
                            }}
                            style={{ border: 'solid 1px #fff', width: '100%', }}>
                            <p className='box-text'>Novedad</p>
                        </video>
                        :
                        <div
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItem: 'center',
                                justifyContent: 'center',
                                flexWrap: 'wrap',
                                gap: '1rem'
                            }}
                        >
                            {
                                videoArrState.map((element, indexItem) => (
                                    <BoxVideo
                                        changeEvent={updateArrVideo}
                                        index={indexItem}
                                        awaitWindow={awaitWindow}
                                        countVideo={numberVideoCompleteState}
                                        setVideoComplete={() => {
                                            setDisableState(true);
                                            setNumberVideoCompleteState(numberVideoCompleteState = numberVideoCompleteState + 1)
                                        }}
                                        setError={(error) => {
                                            console.log(error);
                                            if (error?.response) {
                                                if (error.response.status === 400) boxModal.open({ title: 'Error', description: 'Error en el formato de archivo' });
                                                if (error.response.status === 413) boxModal.open({ title: 'Error', description: 'Error en el peso de archivo, excede 50MB' })
                                            }
                                            else if (error.message) {
                                                console.log(error);
                                                boxModal.open({ title: 'Error', description: error?.message })
                                            }
                                        }}
                                    />
                                ))
                            }
                            {
                                file ?
                                    <>
                                        <div
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexDirection: 'column',
                                                position: 'relative'
                                            }}
                                        >
                                            <video autoPlay loop={true} controls className='box-imgContain' src={file ? file : null} value={file}
                                                style={{
                                                    width: '100%',
                                                    backgroundColor: '#000',

                                                }}
                                            >
                                            </video>
                                            <p style={{ textAlign: 'center' }}>Resultado</p>
                                        </div>

                                    </>
                                    :
                                    null
                            }
                        </div>
                }
            </div>
        </div>
    );
}