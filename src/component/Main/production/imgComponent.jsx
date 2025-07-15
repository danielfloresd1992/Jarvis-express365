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




    return (
        <>
            <div className='box-div' >
                <div className='box-imgContain'>
                    <div className="box-imgDiv" >
                        <img src={img ? img : srcDefault} alt="" className='box-img'
                            onDragLeave={e => e.preventDefault()}
                            onDragEnter={e => e.preventDefault()}
                            onDragOver={e => e.preventDefault()}
                            onDrop={async e => {
                                e.preventDefault();
                                onChange(e.dataTransfer.files[0]);
                            }}
                        />
                    </div>
                    <select required={true} id={idTarget} className='box-text' value={selectValue} onChange={e => { setSelectValue(e.target.value); text(e.target) }}
                        style={{
                            fontStyle: '1rem',
                            padding: '.4rem 0.1rem'
                        }}
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