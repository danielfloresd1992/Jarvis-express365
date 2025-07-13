import { useState } from "react";
import { isMobile } from 'react-device-detect';
import Compressor from 'compressorjs';
import dropImg from '../../../../../public/img/drop.png';
import camera from '../../../../../public/img/camera.png';
import { sendFile } from '../../../util/multimedia.Fetching';


function ImgComponent({ saveImg, data, deleteFile, boxModal }) {

    let imgBackground;
    isMobile ? imgBackground = camera : imgBackground = dropImg;


    let [img, setImg] = useState([]);


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


    return (
        <div className='box-div'>
            <div className='box-imgContain'
                onDragLeave={e => e.preventDefault()}
                onDragEnter={e => e.preventDefault()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); recibImg(e.dataTransfer.files[0]) }}
            >
                <div className="box-imgDiv" >
                    <button className="box-deleteimg" type='button' onClick={deleteImg}>X</button>
                    <img className='box-img' src={img.length > 0 ? img[1] : imgBackground} />
                </div>
                <p className='box-text'>{data[JSON.parse(localStorage.getItem('local_appExpress'))[0].lang]}</p>
            </div>
            {
                isMobile ?
                    (
                        <>
                            <input className="box-inputCamera" type="file" accept="image/*,capture=camera" onChange={e => { e.preventDefault(); recibImg(e.target.files[0]) }} />
                        </>
                    )
                    :
                    (
                        null
                    )
            }
        </div>
    );
}


export { ImgComponent };