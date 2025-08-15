import { useState, useRef } from 'react';
import axios from 'axios';
import SpinerColor from '../component/awaits/spinnerColor';
import icoDrop from '../../../public/ico/icons8-arrastrar-y-soltar-100.png';



export default function BoxVideo({ changeEvent, index }){

    const [ urlVideoState, setUrlVideoState ] = useState(null);
    const [ awaitState, setAwaitState ] = useState(false);
    const boxRefStyle = useRef(null);
    const progressRef = useRef('');


    const concactVideoRequest = (fileParams) => {
        setAwaitState(true);
        decodexVideo(fileParams, (err, file) => {
            if(err) throw err;
            changeEvent({ file: file, order: index })
        });
    };


    const decodexVideo = (video, callback) => {
        const type = [ 'video/mp4', 'video/avi', '' ];
        const typeItem = type.filter(item =>  item === video.type);
     

        if(typeItem.length === 0) {
            callback('error de tipo');
        }

        const formData = new FormData();
        formData.append('file', video);
    
        axios.post(`${location.hostname === 'jarvis-express.netlify.app' ? 'https://72.68.60.254:65431' : 'https://72.68.60.201:3001'}/servise/video`, formData, { responseType: 'blob' })
            .then(response => {
                if(response.status === 200){
                    setUrlVideoState(window.URL.createObjectURL(new Blob([response.data])))
                    const file = new File([response.data], 'video', {lastModified: new Date().getTime(), type: response.data.type })
                    const fileReader = new FileReader(file);
                    fileReader.readAsDataURL(file);
                    fileReader.addEventListener('load', e => {
                        setUrlVideoState(e.target.result);
                    });
                    callback(null, file);
                }

            })
            .catch(err => {
                console.log(err)
                callback(err);
            })
            .finally(() => {
                setAwaitState(true);
            })
    }


    return(
        <div
            style={{
                position: 'relative',
                width: '310px',
                height: '180px'
            }}
        >
            {
                !urlVideoState && !awaitState ?
                    <div className='box-inputCamera'
                        ref={ boxRefStyle }
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
                        <img src={ icoDrop } alt='drop' style={{ width: '50px' }} />
                        <p style={{ color: '#fff' }}>video {index + 1}</p>
                    </div>
                : null
            }
            {
                awaitState ?
                    <SpinerColor text={ 'Preparando video para la conversión' } />
                :
                null
            }
            <video className='box-imgContain-video' 

                autoPlay={true}
                loop={ true }
                src={ urlVideoState }
                value={ null }
                onDragLeave={ e => {
                    e.preventDefault();
                    boxRefStyle.current.classList.remove('ondrop');
                }}
                onDragEnter={ e => {
                    e.preventDefault();
                    boxRefStyle.current.classList.add('ondrop');
                }}
                onDragOver={ e => e.preventDefault() }
                onDrop={ e => { 
                    e.preventDefault(); 
                        setUrlVideoState(null);
                        concactVideoRequest(e.dataTransfer.files[0]);            
                    }}
                style={{ border: 'solid 1px #fff', width: '100%' }}
            >
            </video>
        </div>
    );
}