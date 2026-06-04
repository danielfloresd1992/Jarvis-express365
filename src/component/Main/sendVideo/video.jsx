import { useState, useRef } from 'react';
import axios from 'axios';
import SpinerColor from '../../awaits/spinnerColor';
import './style.css';





export default function boxVideo({ changeEvent, index, awaitWindow, countVideo, setVideoComplete, setError }) {

    const [urlVideoState, setUrlVideoState] = useState(null);
    const [awaitState, setAwaitState] = useState(false);
    const boxRefStyle = useRef(null);
    const progressRef = useRef('');
    const keyDrop = useRef(true);


    const concactVideoRequest = async (fileParams) => {

        setAwaitState(true);
        decodexVideo(fileParams, (error, file) => {
            awaitWindow.close()
            if (error) {
                setError(error);
                setAwaitState(false);
            }
            else {
                changeEvent({ file: file, order: index });
            }
        });
    };



    const decodexVideo = async (video, callback) => {
        try {
            const type = ['video/mp4', 'video/avi', ''];
            const typeItem = type.filter(item => item === video.type);


            if (typeItem.length === 0) {
                callback('error de tipo');
            }

            const formData = new FormData();
            formData.append('file', video);
            //`/servise/video`
            const response = await axios.post('https://72.68.60.254:65431/servise/video', formData, { responseType: 'blob' })

            if (response.status === 200) {
                setUrlVideoState(window.URL.createObjectURL(new Blob([response.data])))
                const file = new File([response.data], 'video', { lastModified: new Date().getTime(), type: response.data.type })
                const fileReader = new FileReader(file);
                fileReader.readAsDataURL(file);
                fileReader.addEventListener('load', e => {
                    setUrlVideoState(e.target.result);
                    setVideoComplete();
                    keyDrop.current = false;
                });
                callback(null, file);
            }


        }
        catch (error) {
            console.log(error)
            callback(error);

        }
        finally {
            setAwaitState(false);
        }
    }



    return (
        <div className='vc-drop' ref={boxRefStyle}>
            {/* Capa de bloqueo: aún no es su turno en el orden */}
            {index - 1 >= countVideo && (
                <div className='vc-drop__lock'>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                </div>
            )}

            {/* Placeholder de drop */}
            {!urlVideoState && !awaitState && (
                <div className='vc-drop__placeholder'>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>Video {index + 1}</span>
                </div>
            )}

            {/* Spinner de conversión */}
            {awaitState && <SpinerColor text={'Preparando video'} />}

            <video
                className='vc-drop__video'
                autoPlay
                loop
                muted
                src={urlVideoState}
                onDragLeave={e => {
                    e.preventDefault();
                    boxRefStyle.current.classList.remove('ondrop');
                }}
                onDragEnter={e => {
                    e.preventDefault();
                    boxRefStyle.current.classList.add('ondrop');
                }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                    e.preventDefault();
                    boxRefStyle.current.classList.remove('ondrop');
                    if (keyDrop.current) {
                        awaitWindow.open('Procesando video, por favor espere...');
                        setUrlVideoState(null);
                        concactVideoRequest(e.dataTransfer.files[0]);
                    }
                }}
            />
        </div>
    );
}