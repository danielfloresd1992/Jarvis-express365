import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import SpinerColor from '../../awaits/spinnerColor';
import { VIDEO_TYPES } from './videoTypes.js';
import COMPRESS_URL from '../../../libs/fetch_data/compress_conexion.js';
import './style.css';





export default function boxVideo({ changeEvent, index, awaitWindow, countVideo, setVideoComplete, setError }) {

    const [urlVideoState, setUrlVideoState] = useState(null);
    const [awaitState, setAwaitState] = useState(false);
    const boxRefStyle = useRef(null);
    const progressRef = useRef('');
    const keyDrop = useRef(true);
    const fileInputRef = useRef(null);
    const previewUrlRef = useRef(null);


    // Vista previa por object URL, revocando SIEMPRE la anterior. Antes se
    // creaba un object URL y acto seguido un FileReader lo reemplazaba por un
    // data URL base64: quedaba el blob huérfano sin revocar (fuga de memoria)
    // y el base64 pesa 33% más, no admite seek y varios WebView se niegan a
    // reproducirlo — justo el caso de la tablet con Cordova.
    const setPreview = (blob) => {
        if (previewUrlRef.current) window.URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = blob ? window.URL.createObjectURL(blob) : null;
        setUrlVideoState(previewUrlRef.current);
    };

    useEffect(() => () => {
        if (previewUrlRef.current) window.URL.revokeObjectURL(previewUrlRef.current);
    }, []);


    const concactVideoRequest = async (fileParams) => {

        setAwaitState(true);
        // Guard de una sola ejecución: si el callback se invocara dos veces
        // (pasaba al rechazar por tipo), se cerraba la ventana de espera y el
        // archivo entraba igual al array de concatenación.
        let alreadyHandled = false;
        decodexVideo(fileParams, (error, file) => {
            if (alreadyHandled) return;
            alreadyHandled = true;
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
            // Faltaba el `return`: un archivo rechazado por tipo llamaba al
            // callback y AUN ASÍ se subía y entraba a la concatenación.
            // La lista incluye 'video/x-msvideo' (lo que reportan los
            // navegadores para un .avi real; 'video/avi' casi nunca se emite)
            // y la cadena vacía, que es lo único que deja pasar los .dav de
            // IVMS-4200 porque el navegador no les reconoce el tipo.
            if (!VIDEO_TYPES.includes(video.type)) {
                return callback(new Error('Formato no soportado. Use MP4, AVI o DAV.'));
            }

            const formData = new FormData();
            formData.append('file', video);

            // watermark=0: esta es una PARTE de una unión, así que se convierte
            // SIN marca de agua. El logo lo estampa el servidor una sola vez,
            // sobre el video final ya unido (endpoint /concact).
            const response = await axios.post(`${COMPRESS_URL}/servise/video?watermark=0`, formData, { responseType: 'blob' })

            if (response.status === 200) {
                const file = new File([response.data], 'video', { lastModified: Date.now(), type: response.data.type })
                setPreview(file);
                // Estos dos efectos vivían dentro del listener 'load' del
                // FileReader que se eliminó: sin ellos el recuadro siguiente
                // queda bloqueado para siempre y la unión nunca se dispara.
                setVideoComplete();
                keyDrop.current = false;
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



    const isLocked = index - 1 >= countVideo;
    const canDrop = keyDrop.current && !isLocked;

    const openFilePicker = () => { if (canDrop) fileInputRef.current?.click(); };

    const handlePickedFile = (event) => {
        const picked = event.target.files?.[0];
        event.target.value = '';
        if (!picked) return;
        awaitWindow.open('Procesando video, por favor espere...');
        setUrlVideoState(null);
        concactVideoRequest(picked);
    };

    return (
        <div
            className={`vc-drop${isLocked ? ' is-locked' : ''}`}
            ref={boxRefStyle}
            role={canDrop ? 'button' : undefined}
            tabIndex={canDrop ? 0 : undefined}
            onClick={openFilePicker}
            onKeyDown={e => { if (canDrop && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openFilePicker(); } }}
        >
            <input
                ref={fileInputRef}
                type='file'
                accept='video/mp4,video/avi,video/x-msvideo,.mp4,.avi,.dav'
                style={{ display: 'none' }}
                onChange={handlePickedFile}
            />

            {/* Capa de bloqueo: aún no es su turno en el orden.
                Antes era un candado suelto sin explicación — el usuario no
                sabía por qué ese recuadro no aceptaba nada. */}
            {isLocked && (
                <div className='vc-drop__lock'>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span className='vc-drop__lock-text'>Carga primero el video {index}</span>
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
                    <small className='vc-drop__hint'>arrastra o haz clic</small>
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