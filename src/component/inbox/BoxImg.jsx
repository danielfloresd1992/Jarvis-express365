import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../libs/fetch_data/instanceAxios';
import reemplazeUrl from '../../libs/reemplazeUrl';
import icoDelete from '../../../public/ico/delete/delete.svg'



export default function BoxImg({ date, idEstablishment, submittedByUser, path, url, deleteImg, _id, isAnimate }) {


    const [fileState, setFileState] = useState(null);
    const refContain = useRef(null);
    const imgRefSrc = useRef(null);
    const [newElementState, setNewElementState] = useState(isAnimate);

    const newDate = new Date(date); // Opciones para formatear la fecha 
    const options = {
        hour: 'numeric', minute: 'numeric', second: 'numeric', year: 'numeric', month: 'long', day: 'numeric'

    }; // Convertir la fecha a un formato legible 
    const readableDate = newDate.toLocaleDateString('es-ES', options);





    useEffect(() => {
        const fetchImage = async () => {
            try {
                const response = await axiosInstance.get(reemplazeUrl(url), { responseType: 'blob' });
                const blob = response.data;
                const file = new File([blob], 'image.jpg', { type: blob.type });
                setFileState(file);
            }
            catch (error) {
                console.error('Error fetching image:', error);
            }
        };
        fetchImage();
    }, [url]);



    useEffect(() => {
        if (fileState) {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(fileState);
            fileReader.onload = e => {
                if (isAnimate) refContain.current.classList.add('intermittence');
                imgRefSrc.current.src = e.target.result;
                fileReader.onload = null;
            }

        }
    }, [fileState]);




    return (
        <div
            className={isAnimate ? 'intermittence' : ''}
            style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', backgroundColor: '#fff', width: '85%', position: 'relative', borderRadius: '5px', boxShadow: '2px 2px 14px #000;' }}
            onClick={e => {
                refContain.current.classList.remove('intermittence');
                setNewElementState(false);
            }}
            ref={refContain}
        >
            <img style={{ width: '100%', borderRadius: '5px 5px 0 0' }} draggable={true} ref={imgRefSrc} alt='img-toast-post'
                onMouseDown={e => {
                    refContain.current.classList.remove('intermittence');
                    setNewElementState(false);
                }}
            />
            <button onClick={() => deleteImg(_id)} className='box-deleteimg' style={{ width: '30px', height: '30px', padding: '.2rem' }}>
                <img className='box-deleteimgIco' style={{ width: '100%', height: '100%' }} src={icoDelete} alt='ico-delete-inbox' />
            </button>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '.5rem'
            }}
            >
                <p className='textIncident-btnText' style={{ fontSize: '.7rem', fontWeight: '700' }}>Enviado por: {submittedByUser}</p>
                <div>
                    <p className='textIncident-btnText' style={{ fontSize: '.7rem', fontWeight: '700', lineHeight: '1.1' }}>Hora del envio: <span style={{ color: 'red' }}>{readableDate}</span></p>
                </div>
                {
                    newElementState ?
                        <div style={{
                            backgroundImage: 'linear-gradient(#af9403, gold)',
                            position: 'absolute',
                            top: '15px',
                            left: '15px',
                            padding: '0.5rem',
                            borderRadius: '3px',
                            boxShadow: 'rgb(165 139 4) 0px 0px 50px, rgb(90 76 0) 0px 0px 5px;',
                        }}
                        >
                            <p style={{ fontSize: '.8rem' }}>nueva</p>
                        </div>
                        :
                        null
                }


            </div>
        </div>
    )
}