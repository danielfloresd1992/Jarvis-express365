import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../libs/fetch_data/instanceAxios';
import reemplazeUrl from '../../libs/reemplazeUrl';
import icoDelete from '../../../public/ico/delete/delete.svg'



export default function BoxImg({ date, idEstablishment, submittedByUser, path, url, deleteImg, _id, isAnimate }) {


    const [fileState, setFileState] = useState(null);
    const refContain = useRef(null);
    const imgRefSrc = useRef(null);
    const [newElementState, setNewElementState] = useState(isAnimate);

    const newDate = new Date(date);
    const options = {
        hour: 'numeric', minute: 'numeric', second: 'numeric', year: 'numeric', month: 'long', day: 'numeric'
    };
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
                imgRefSrc.current.src = e.target.result;
                fileReader.onload = null;
            }

        }
    }, [fileState]);




    return (
        <div
            className={`inbox-card${newElementState ? ' inbox-card--new' : ''}`}
            onClick={() => setNewElementState(false)}
            ref={refContain}
        >
            {newElementState && (
                <span className="inbox-card__badge-new">nueva</span>
            )}
            <div className="inbox-card__img-wrap">
                <img
                    className="inbox-card__img"
                    draggable={true}
                    ref={imgRefSrc}
                    alt='img-toast-post'
                    onMouseDown={() => setNewElementState(false)}
                />
                <button onClick={() => deleteImg(_id)} className="inbox-card__delete" title="Eliminar">
                    <img style={{ width: '14px', height: '14px', filter: 'invert()' }} src={icoDelete} alt='delete' />
                </button>
            </div>
            <div className="inbox-card__info">
                <p className="inbox-card__sender">{submittedByUser}</p>
                <p className="inbox-card__date">{readableDate}</p>
            </div>
        </div>
    )
}