import { useState, useRef } from 'react';
import axios from 'axios';
import SpinerColor from '../../awaits/spinnerColor';
import icoDrop from '../../../../../public/ico/icons8-arrastrar-y-soltar-100.png';



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
            else{
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

            const response = await axios.post('https://72.68.60.201:3001/servise/video', formData, { responseType: 'blob' })

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
        catch(error){
            console.log(error)
            callback(error);
            
        }
        finally {
            setAwaitState(false);
        }
    }



    return (
        <div
            style={{
                position: 'relative',
                width: '310px',
                height: '180px'
            }}
        >
            {
                index - 1 >= countVideo ?
                    <div
                        style={{ backgroundColor: 'rgb(0 0 0 / 64%)', position: 'absolute', width: '100%', height: '180px', top: '0', left: '0', zIndex: 1 }}
                    >

                    </div>
                    : null
            }

            {
                !urlVideoState && !awaitState ?
                    <div className='box-inputCamera'
                        ref={boxRefStyle}
                        style={{
                            position: 'absolute',
                            top: '0',
                            height: '100%',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexDirection: 'column',
                            gap: '.5rem'
                        }}
                    >

                        <img src={icoDrop} alt='drop' style={{ width: '50px' }} />
                        <p style={{ color: '#fff' }}>video {index + 1}</p>

                    </div>
                    : null
            }
            {
                awaitState ?
                    <SpinerColor text={'Preparando video para la conversión'} />
                    :
                    null
            }
            <video className='box-imgContain-video'
                autoPlay={true}
                loop={true}
                src={urlVideoState}
                value={null}
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
                style={{ border: 'solid 1px #fff' }}
            >

            </video>
        </div>
    );
}