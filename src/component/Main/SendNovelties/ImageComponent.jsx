import { useState } from "react";
import { isMobile } from 'react-device-detect';
import Compressor from 'compressorjs';
import dropImg from '../../../../public/img/drop.png';
import camera from '../../../../public/img/camera.png';
import { sendFile } from '../../../libs/fetch_data/multimedia.Fetching';




function ImgComponent({ saveImg, data, deleteFile, boxModal }) {

    let imgBackground;
    isMobile ? imgBackground = camera : imgBackground = dropImg;


    let [img, setImg] = useState([]);
    let [isDragging, setIsDragging] = useState(false);


    const recibImg = async (file) => {
        if (img.length > 0) return boxModal.open({ title: 'Aviso', description: 'Elimine la imagen para poder añadir otra' });

        const type = ['image/jpg', 'image/jpeg', 'image/png'].filter(type => type === file.type);
        let caption;

        if (!type.length) return boxModal.open({ title: 'Aviso', description: 'Extención del archivo inválido' });

        if (isMobile || JSON.parse(localStorage.getItem('local_appExpress'))[0].lang === 'es') {
            caption = data.es;
        }
        else if (isMobile) {
            caption = data.en;
        }
        else {
            caption = null;
        }



        new Compressor((file), {
            cuality: 0.5,
            width: 500,
            height: 430,
            success: async (compressedResult) => {
                const resultUrl = await sendFile(compressedResult);
                const fileReader = new FileReader();
                fileReader.readAsDataURL(compressedResult);
                fileReader.onload = e => {
                    setImg(img = [compressedResult, e.target.result]);
                    saveImg({ image: img, caption: caption, url: resultUrl.data.url });
                };
            }
        });
    };


    const deleteImg = () => {
        const delet = deleteFile(img);
        setImg(img = []);
    };

    const hasImage = img.length > 0;
    const label = data[JSON.parse(localStorage.getItem('local_appExpress'))[0].lang];

    return (
        <div className={`dropzone${hasImage ? ' dropzone--has-image' : ''}${isDragging ? ' dropzone--dragging' : ''}`}>
            <div className='dropzone__area'
                onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                onDragEnter={e => { e.preventDefault(); setIsDragging(true); }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); setIsDragging(false); recibImg(e.dataTransfer.files[0]) }}
            >
                <div className="dropzone__img-wrap">
                    <button className="dropzone__action-btn dropzone__action-btn--delete" type='button' onClick={deleteImg}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                    {!hasImage && (
                        <div className="dropzone__placeholder">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                            </svg>
                            <span>{isMobile ? 'Toca para capturar' : 'Arrastra una imagen aquí'}</span>
                        </div>
                    )}
                    <img className={`dropzone__img${hasImage ? '' : ' dropzone__img--hidden'}`} src={hasImage ? img[1] : imgBackground} draggable={false} />
                </div>
                <p className='dropzone__label'>{label}</p>
            </div>
            {isMobile && (
                <input className="dropzone__file-input" type="file" accept="image/*,capture=camera" onChange={e => { e.preventDefault(); recibImg(e.target.files[0]) }} />
            )}
        </div>
    );
}


export { ImgComponent };