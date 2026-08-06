import './style.css';
import { VIDEO_TYPES } from './videoTypes.js';
import COMPRESS_URL from '../../../libs/fetch_data/compress_conexion.js';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRef } from 'react';
import BoxVideo from './video.jsx';




/**
 * @param captions - Opcional. Títulos de cada recorte, en orden, para
 *   estampar bajo la marca de agua al unir varios videos. Los menús de las
 *   alertas ya traen sus captions (title.photos.caption), así que el
 *   componente que use esto puede pasarlos tal cual. Si falta el de una
 *   posición, el servidor rotula "video #N".
 */
export default function VideoComponent({ awaitWindow, boxModal, getVideo, captions = [] }) {


    let [video, setVideo] = useState(null);
    const [videoArrState, setVideoArrState] = useState([null]);
    const [speedVideoState, setSpeedVideoState] = useState(0.5);
    const videoOriginalRef = useRef(null);

    let [title, setTitle] = useState([]);
    let [file, setFile] = useState(null);

    // Bloquea SOLO el contador de videos. Antes un único `disableState` servía
    // para dos cosas incompatibles: evitar que se reindexaran los recuadros ya
    // cargados (correcto) y, de paso, deshabilitar la velocidad tras el primer
    // acelerado (un bloqueo permanente: la única salida era Reiniciar, que
    // borra el video y obliga a subirlo de nuevo).
    const [lockCountState, setLockCountState] = useState(false);


    let [numberVideoCompleteState, setNumberVideoCompleteState] = useState(0);



    const isMountedRef = useRef(false);
    const speedTimerRef = useRef(null);
    const fileInputRef = useRef(null);
    const previewUrlRef = useRef(null);

    // Al desmontar el componente se libera el último object URL vivo.
    useEffect(() => () => {
        if (previewUrlRef.current) window.URL.revokeObjectURL(previewUrlRef.current);
    }, []);


    // Sale de VITE_COMPRESS_URL (ver libs/fetch_data/compress_conexion.js)
    const URL = COMPRESS_URL;

    // Límites de velocidad: el servidor rechaza <= 0 con un 400, y antes el
    // stepper podía bajar hasta 0 o negativo a fuerza de clicks.
    const MIN_SPEED = 0.1;
    const MAX_SPEED = 4;

    // speedVideoState es el multiplicador de PTS que entiende ffmpeg, donde
    // MENOS es MÁS RÁPIDO (0.5 = el doble de rápido). Mostrar ese número
    // crudo engañaba: el usuario leía "0.5×" y esperaba cámara lenta.
    // Acá se traduce a la velocidad real de reproducción.
    const playbackRate = Number((1 / speedVideoState).toFixed(1));
    const speedHint = playbackRate > 1 ? 'más rápido' : playbackRate < 1 ? 'más lento' : 'velocidad real';

    // Abrir el explorador de archivos: arrastrar era la ÚNICA forma de cargar
    // un video y no había nada que lo indicara — un usuario nuevo se quedaba
    // mirando el recuadro sin saber que tenía que arrastrar.
    const openFilePicker = () => fileInputRef.current?.click();

    const handlePickedFile = (event) => {
        const picked = event.target.files?.[0];
        event.target.value = '';           // permite volver a elegir el mismo archivo
        if (!picked) return;
        awaitWindow.open('Procesando video, por favor espere...');
        onChange(picked);
    };


    /**
     * Muestra el error real al usuario. Antes todos los .catch hacían solo
     * console.log: si fallaba la conversión, la unión o el acelerado, la
     * ventana de espera se cerraba sin resultado ni explicación.
     * Ojo: con responseType 'blob' el cuerpo del error TAMBIÉN llega como
     * Blob, así que hay que leerlo para sacar el mensaje del servidor.
     */
    const showError = async (err) => {
        let detail = '';
        try {
            const data = err?.response?.data;
            if (data instanceof Blob) detail = JSON.parse(await data.text())?.message || '';
            else if (data?.message) detail = data.message;
        }
        catch { /* el cuerpo no era JSON: se usa el mensaje por código */ }

        const status = err?.response?.status;
        const fallback =
            status === 400 ? 'El archivo no es un video válido o está dañado.' :
            status === 413 ? 'El archivo excede el peso máximo permitido (70MB).' :
            status === 500 ? 'El servidor no pudo procesar el video. Intente nuevamente.' :
            'No se pudo conectar con el servicio de video.';

        console.log(err);
        boxModal.open({ title: 'Error', description: detail || fallback });
    };


    useEffect(() => {  ///  fetching de concatenación

        if (videoArrState.length < 2) return;   // en modo de un solo video no aplica

        const isUndefinex = videoArrState.filter(video => video === null)
        if (isUndefinex.length < 1) {
            awaitWindow.open('Uniendo videos y aplicando marca de agua...');

            const formData = new FormData();

            videoArrState.forEach(video => {
                formData.append(`file`, video.file);
            });

            // Título de cada recorte, en el mismo orden que los archivos. Va
            // como JSON en UN solo campo: repetir el nombre del campo en un
            // FormData no siempre llega al servidor como array. Si una
            // posición viene vacía, el servidor rotula "video #N".
            formData.append('titles', JSON.stringify(
                videoArrState.map((_, index) => captions[index] ?? '')
            ));

            // La marca de agua la estampa el servidor SOBRE EL RESULTADO de
            // la unión (las partes se convirtieron con ?watermark=0).
            axios.post(`${URL}/servise/video/concact`, formData, { responseType: 'blob' })
                .then(response => {
                    renderVideo(response.data, true);
                })
                .catch(showError)
                .finally(() => {
                    awaitWindow.close();
                })

        }

    }, [videoArrState]);



    useEffect(() => {

        if (!isMountedRef.current) return;
        // resetVideo() deja el original en null: sin este guard el efecto
        // mandaba una petición con file=null y el servidor respondía error.
        if (!videoOriginalRef.current) return;

        // Debounce: cada click del stepper es un re-encode completo. Sin esto,
        // cinco clicks seguidos disparaban cinco conversiones simultáneas.
        clearTimeout(speedTimerRef.current);
        speedTimerRef.current = setTimeout(() => {
            awaitWindow.open('Acelerando video...');
            const formData = new FormData();
            formData.append('file', videoOriginalRef.current);
            axios.post(`${URL}/servise/video/speed=${speedVideoState}`, formData, { responseType: 'blob' })
                .then(response => {
                    // Cada intento parte SIEMPRE del original (changeOrigin=false),
                    // así que se puede corregir la velocidad las veces que haga
                    // falta sin degradar el video ni duplicar la marca de agua.
                    if (response.status === 200) renderVideo(response.data, false);
                })
                .catch(showError)
                .finally(() => {
                    awaitWindow.close();
                })
        }, 600);

        return () => clearTimeout(speedTimerRef.current);
    }, [speedVideoState]);



    const onChange = (video) => {

        // Lista compartida con video.jsx (antes cada uno tenía la suya y no
        // coincidían, así que un .avi legítimo se comportaba distinto según
        // el modo). Incluye 'video/x-msvideo' —lo que reportan los navegadores
        // para un .avi real— y la cadena vacía para los .dav de IVMS-4200.
        if (!VIDEO_TYPES.includes(video.type)) {
            boxModal.open({ title: 'Aviso', description: 'Formato no soportado. Use MP4, AVI o DAV.' });
            return awaitWindow.close();
        }

        const formData = new FormData();
        formData.append('file', video);

        // Video único: el servidor convierte Y estampa la marca de agua de
        // una vez (es el resultado final, no una parte de una unión).
        axios.post(`${URL}/servise/video`, formData, { responseType: 'blob' })
            .then(response => {
                renderVideo(response.data, true);
                // Con un video ya cargado, cambiar la cantidad dejaría un
                // estado híbrido (aparece la grilla con el resultado viejo).
                setLockCountState(true);
            })
            .catch(showError)
            .finally(() => {
                awaitWindow.close();
            });
    };


    const renderVideo = (video, changeOrigin = false) => {
        isMountedRef.current = true;

        // Se revoca el object URL anterior antes de crear el nuevo: cada
        // cambio de velocidad generaba uno y ninguno se liberaba, dejando el
        // blob pineado en memoria. Tampoco se copia con new Blob([video]):
        // createObjectURL acepta el Blob directo y así se evita duplicar los
        // bytes del video.
        if (previewUrlRef.current) window.URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = window.URL.createObjectURL(video);
        setFile(file = previewUrlRef.current);

        const newFile = new File([video], 'video', { lastModified: Date.now(), type: video.type });
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
        // Se corta cualquier acelerado en espera y se apaga el flag de
        // montado ANTES de tocar los estados: así el efecto de velocidad no
        // dispara una petición con el original ya en null.
        clearTimeout(speedTimerRef.current);
        isMountedRef.current = false;
        videoOriginalRef.current = null;

        // Reiniciar también filtraba el object URL del video en pantalla
        if (previewUrlRef.current) {
            window.URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        }

        setVideoArrState([null]);
        setVideo(null);
        setSpeedVideoState(0.5);
        setFile(null);
        setLockCountState(false);
        setNumberVideoCompleteState(0);
        if (typeof getVideo === 'function') getVideo(null);
    };



    return (

        <div className='vc-wrap'>

            {/* Selector de archivo real: lo dispara la zona de carga al hacer
                clic, para no depender solo de arrastrar y soltar. */}
            <input
                ref={fileInputRef}
                type='file'
                accept='video/mp4,video/avi,video/x-msvideo,.mp4,.avi,.dav'
                style={{ display: 'none' }}
                onChange={handlePickedFile}
            />

            {/* ── Panel de control ── */}
            <div className='vc-panel'>

                {/* Cantidad de videos */}
                <div className='vc-control'>
                    <p className='vc-control__label'>Videos a unir</p>
                    <p className='vc-control__value'>{videoArrState.length}</p>
                    <p className='vc-control__hint'>
                        {videoArrState.length === 1 ? 'uno solo' : 'se unen en orden'}
                    </p>
                    {/* El contador se bloquea en cuanto hay un video cargado:
                        cambiarlo reindexaría los recuadros ya llenos. */}
                    <div className='vc-stepper'>
                        <button
                            className='vc-step-btn'
                            disabled={lockCountState}
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
                            disabled={lockCountState}
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
                    <p className='vc-control__value'>{playbackRate}×</p>
                    <p className='vc-control__hint'>{speedHint}</p>
                    {/* Los botones siguen al número que se MUESTRA (velocidad real):
                        "+" acelera, y como ffmpeg usa el multiplicador de PTS
                        invertido, acelerar significa RESTARLE al estado. */}
                    {/* Solo se habilita cuando ya hay un video: antes se podía
                        elegir velocidad sin nada cargado y el clic se descartaba
                        en silencio (el efecto salía por el guard de montado). */}
                    <div className='vc-stepper'>
                        <button
                            className='vc-step-btn'
                            disabled={!file}
                            type='button'
                            title='Más lento'
                            onClick={() => setSpeedVideoState(state => Math.min(MAX_SPEED, Number((state + 0.1).toFixed(1))))}
                        >−</button>
                        <button
                            className='vc-step-btn'
                            disabled={!file}
                            type='button'
                            title='Más rápido'
                            onClick={() => setSpeedVideoState(state => Math.max(MIN_SPEED, Number((state - 0.1).toFixed(1))))}
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
                    Carga los videos en orden: el 1 primero, luego el 2. Se unen en
                    ese orden y la marca de agua se aplica al video final.
                </p>
            )}

            {/* ── Escenario de videos ── */}
            <div className='vc-stage'>
                {videoArrState?.length < 2 ? (
                    /* Un solo video: zona de carga vacía, o el reproductor */
                    file ? (
                        <div className='vc-player-wrap'>
                            <span className='vc-player-badge'>
                                <span className='vc-player-badge__dot' />
                                Listo · con marca de agua
                            </span>
                            <video autoPlay controls loop className='vc-player' src={file} />
                        </div>
                    ) : (
                        /* Estado vacío que EXPLICA: qué arrastrar, de dónde sale,
                           qué formatos y que también se puede hacer clic. Antes
                           era un <video> con una imagen como src (no mostraba
                           nada) y la única pista era una etiqueta de 0.6rem. */
                        <div
                            className='vc-dropzone'
                            role='button'
                            tabIndex={0}
                            onClick={openFilePicker}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFilePicker(); } }}
                            onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('is-over'); }}
                            onDragEnter={e => { e.preventDefault(); e.currentTarget.classList.add('is-over'); }}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('is-over');
                                if (!e.dataTransfer.files?.length) return;
                                awaitWindow.open('Procesando video, por favor espere...');
                                onChange(e.dataTransfer.files[0]);
                            }}
                        >
                            <svg className='vc-dropzone__icon' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.3' strokeLinecap='round' strokeLinejoin='round'>
                                <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                                <polyline points='17 8 12 3 7 8' />
                                <line x1='12' y1='3' x2='12' y2='15' />
                            </svg>
                            <p className='vc-dropzone__title'>Arrastra tu video aquí</p>
                            <p className='vc-dropzone__action'>o haz clic para buscarlo</p>
                            <p className='vc-dropzone__meta'>Grabaciones de VLC o IVMS-4200 · MP4, AVI o DAV · hasta 70 MB</p>
                        </div>
                    )
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
                                    setLockCountState(true);
                                    setNumberVideoCompleteState(numberVideoCompleteState = numberVideoCompleteState + 1);
                                }}
                                setError={(error) => {
                                    // Antes se perdían dos casos sin mostrar nada: el 500
                                    // (cuando falla ffmpeg) y cualquier error sin .response
                                    // ni .message. Y el texto del 413 decía 50MB, cuando el
                                    // límite ya es 70MB.
                                    console.log(error);
                                    const status = error?.response?.status;
                                    const description =
                                        status === 400 ? 'El archivo no es un video válido o está dañado.' :
                                        status === 413 ? 'El archivo excede el peso máximo permitido (70MB).' :
                                        status === 500 ? 'El servidor no pudo procesar el video. Intente nuevamente.' :
                                        status ? `Error del servidor (${status}).` :
                                        (error?.message ?? String(error));
                                    boxModal.open({ title: 'Error', description });
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