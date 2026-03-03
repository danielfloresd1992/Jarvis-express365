import { useEffect, useState } from "react";
import srcDefault from '../../../../public/img/drop.png';
import { sendFile } from '../../../libs/fetch_data/multimedia.Fetching';



function ImgComponent({ modal, text, idTarget, changeFile, file }) {

    let [img, setImg] = useState(null);
    let [selectValue, setSelectValue] = useState('Seleccione');



    useEffect(() => {

        if (file.file) {

            const fileReader = new FileReader();
            fileReader.readAsDataURL(file.file);
            fileReader.onload = e => {
                setImg(e.target.result);
            }
        }

    }, [file]);



    const onChange = async (image) => {
        const responseUrl = await sendFile(image);
        const type = ['image/jpg', 'image/jpeg', 'image/png'].filter(type => type === image.type);
        if (!type.length) modal.open({ title: 'error', description: 'Asegurese de que sea una imagen' });
        changeFile({ file: image, caption: selectValue, url: responseUrl.data.url });
    };




    const [isDragging, setIsDragging] = useState(false);
    const hasImage = !!img;

    return (
        <>
            <div className={`dropzone${hasImage ? ' dropzone--has-image' : ''}${isDragging ? ' dropzone--dragging' : ''}`}>
                <div className='dropzone__area'
                    onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                    onDragEnter={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); onChange(e.dataTransfer.files[0]); }}
                >
                    <div className="dropzone__img-wrap">
                        {!hasImage && (
                            <div className="dropzone__placeholder">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                </svg>
                                <span>Arrastra una imagen aquí</span>
                            </div>
                        )}
                        <img className={`dropzone__img${hasImage ? '' : ' dropzone__img--hidden'}`} src={img ? img : srcDefault} alt="" draggable={false} />
                    </div>
                    <select required={true} id={idTarget} className='dropzone__label' value={selectValue} onChange={e => { setSelectValue(e.target.value); text(e.target) }}
                        style={{ cursor: 'pointer' }}
                    >
                        <option value={null}>Seleccione</option>
                        <option value="Corta">Corta</option>
                        <option value="Muele">Muele</option>
                        <option value="Pesa">Pesa</option>
                        <option value="Porciona">Porciona</option>
                        <option value="Empaqueta">Empaqueta</option>
                        <option value="Etiqueta">Etiqueta</option>
                        <option value="Guarda">Guarda</option>
                        <option value="Desecha">Desecha</option>
                    </select>
                </div>
            </div>
        </>
    );
}

export { ImgComponent };