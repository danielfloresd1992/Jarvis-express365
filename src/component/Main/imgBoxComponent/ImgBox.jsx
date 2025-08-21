import { isMobile } from 'react-device-detect';
import dropImg from '../../../../public/img/drop.png';
import camera from '../../../../public/img/camera.png';
import trash from '../../../../public/ico/delete/delete.svg';
import icoEdit from '../../../../public/ico/content_cut/content_cut.svg';
import { toBlob } from 'html-to-image';
import Compressor from 'compressorjs';
import { useState, useEffect, useRef } from 'react';
import { blobToFile } from '../../../libs/script/64toFile.js';

import { EditorImg } from '../Delay/editorImg/editor.jsx';
import { sendFile } from '../../../libs/fetch_data/multimedia.Fetching.js';




function ImgBoxImg({ data, boxModal, deleteImg, setImg, language, index_image, config, redimention = { w: 500, h: 480 } }) {

    let imgBackground;
    isMobile ? imgBackground = camera : imgBackground = dropImg;

    let [visivility, setVisivility] = useState(false);
    let [srcImg, setSrcImg] = useState(null);
    const imgCanvas = useRef(null);
    const btnDelete = useRef(null);
    const btnEdit = useRef(null);
    const img = useRef(null);
    const boxText = useRef(null);

    useEffect(() => {
        if (srcImg === null) return;

        createImg();

    }, [srcImg]);

    const createImg = async (isRequireCompression = true) => {
        if (btnEdit.current !== null) btnEdit.current.style.display = 'none';
        btnDelete.current.style.display = 'none';
        img.current.classList.add('toBorder');
        boxText.current.classList.add('boxTextSend');
        const quality = isRequireCompression ? (isMobile ? 0.8 : 0.7) : 10

        language === 'es' ? boxText.current.textContent = data.es : boxText.current.textContent = data.en;


        toBlob(imgCanvas.current, { quality: quality })
            .then(async (dataUrl) => {
                const responseUrl = await sendFile(blobToFile(dataUrl));
                const caption = language === 'es' ? boxText.current.textContent = data.es : boxText.current.textContent = data.en;
                setImg({ file: dataUrl, caption: caption, image_index: index_image, url: responseUrl.data.url });
            })
            .finally(() => {
                if (btnEdit.current !== null) btnEdit.current.style.display = 'flex';
                btnDelete.current.style.display = 'flex';
                img.current.classList.remove('toBorder');
                boxText.current.classList.remove('boxTextSend');
                boxText.current.textContent = language === 'es' ? data.es : data.en;
            });

    };

    const readtImg = file => {
        if (srcImg !== null) return boxModal.open({ title: 'Aviso', description: 'Elimine la imagen para agregar otra' });
        const type = ['image/jpg', 'image/jpeg', 'image/png'].filter(type => type === file.type);
        if (!type.length) return boxModal.open({ title: 'Aviso', description: 'Extención del archivo inválido' });



        const fileReader = new FileReader();
        fileReader.readAsDataURL(file);
        fileReader.onload = e => {
            setSrcImg(srcImg = e.target.result);
            btnDelete.current.style.display = 'flex';
        }



        new Compressor(file, {
            cuality: 0.7,
            width: redimention.w,
            height: redimention.h,
            success: (compressedResult) => {
                const fileReader = new FileReader();
                fileReader.readAsDataURL(compressedResult);
                fileReader.onload = e => {
                    setSrcImg(srcImg = e.target.result);
                    btnDelete.current.style.display = 'flex';
                }
            }
        });

    };


    const deleteSrc = () => {
        setSrcImg(srcImg = null);
        deleteImg(language === 'es' ? data.es : data.en, () => setSrcImg(srcImg => srcImg = null));
    };


    const visivilityEditImg = () => {
        setVisivility(!visivility);
    }


    return (
        <>
            <div className='box-div' ref={imgCanvas} >
                <div className='box-imgContain'
                    onDragLeave={e => e.preventDefault()}
                    onDragEnter={e => e.preventDefault()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const { items } = e.dataTransfer; readtImg(e.dataTransfer.files[0]); }}
                >
                    <div className="box-imgDiv" >
                        <button className="box-deleteimg" type='button' onClick={deleteSrc} ref={btnDelete} >
                            <img className='box-deleteimgIco' src={trash} />
                        </button>
                        {
                            config?.edit ?
                                (
                                    <button className="box-deleteimg secondBtn" type='button' ref={btnEdit} onClick={() => { srcImg !== null ? setVisivility(!visivility) : boxModal.open({ title: 'Aviso', description: 'Selecione una imagen' }) }}  >
                                        <img className='box-deleteimgIco  cut' src={icoEdit} />
                                    </button>
                                )
                                :
                                (
                                    null
                                )
                        }
                        <img className={'box-img'} src={srcImg ? srcImg : imgBackground} ref={img} draggable={false} />
                    </div>
                    <p className='box-text' ref={boxText} style={config?.hiddenBoxText ? { display: 'none' } : { display: 'block' }} >
                        {
                            language === 'es' ? data.es : data.en
                        }
                    </p>
                </div>

                {
                    isMobile && <>
                        <input className="box-inputCamera" type="file" accept="image/*,capture=camera"
                            onChange={e => { e.preventDefault(); readtImg(e.target.files[0]) }}

                        />
                    </>

                }
            </div>
            {
                visivility && <EditorImg img={srcImg} deleteImg={deleteSrc} createNewImg={readtImg} closeWindow={visivilityEditImg} />
            }

        </>
    );
}

export { ImgBoxImg };