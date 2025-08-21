import { toPng } from 'html-to-image';
import { useRef, useState, useEffect } from 'react';
import { base64ToFile } from '../../../../libs/script/64toFile';
import './style.css';
import resize from '../../../../../public/ico/resize/resize.svg';
import moveImg from '../../../../../public/ico/move/move.svg';
import reply from '../../../../../public/ico/reply/reply.svg';

import save from '../../../../../public/ico/save/save.svg';

import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';



function EditorImg({ img, deleteImg, createNewImg, closeWindow }) {



    const cropperRef = useRef(null);
    const newImg = useRef();


    /*
    
        const onImageLoad = (crop, pixelCrop) => {
            drawImageOnCanvas(imageRef.current, imagePreviewCanvasRef.current, crop);
            setCompletedCrop(crop);
        };
    
    */

    const saveChangue = () => {

        toPng(newImg.current, { quality: 10 })
            .then(dataUrl => {
                const file = base64ToFile(dataUrl, 'newImage');
                deleteImg();
                createNewImg(file, false);
            })
            .catch(err => {
                console.log(err);
            })
            .finally(() => {
                closeWindow();
            });
    };



    return (
        <>
            <div className='componentImgEdit' style={{
                width: '100%',
                height: '100%'
            }}>
                <div className='componentImgEdit-section'>
                    <div className='componentImgEdit-bannerBtn'>
                        <div className='componentImgEdit-BtnContent'>


                            <button className='componentImgEdit-Btn'
                                type='button'
                                onClick={saveChangue}
                            >
                                <img className='componentImgEdit-btnImg' src={save} alt="" />
                                <p className='componentImgEdit-BtnText'> save </p>
                            </button>
                            <button className='componentImgEdit-Btn'
                                type='button'
                                onClick={closeWindow}
                            >
                                <img className='componentImgEdit-btnImg' src={reply} alt="" />
                                <p className='componentImgEdit-BtnText'> back </p>
                            </button>
                        </div>
                        <label className='componentImgEdit-label'> Zoom
                            <input type="range" name="Zoom" min="1" max="200"

                                onChange={e => {

                                }}
                            />
                        </label>
                    </div>

                    <div className='componentImgEdit-imgContent' style={{
                        height: '85%'
                    }}
                    >
                        <Cropper
                            style={{ height: 400, width: "100%" }}
                            initialAspectRatio={1}
                            preview=".img-preview"
                            src={img}
                            ref={cropperRef}
                            viewMode={1}
                            guides={true}
                            minCropBoxHeight={10}
                            minCropBoxWidth={10}
                            background={false}
                            responsive={true}
                            checkOrientation={false}
                        />

                        <div style={{
                            width: '100%',
                            height: '50%',
                            display: 'flex',
                            justify: 'center',
                            alignItems: 'center',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '100%',
                                height: '100%'
                            }}>

                            </div>
                            <div ref={newImg} style={{
                                width: '50%',
                                backgroundColor: '#000000',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                position: 'relative'
                            }}
                            >
                                <div
                                    className='img-preview'
                                    style={{ width: '100%', float: 'left', height: '300px', overflow: 'hidden' }}
                                />
                            </div>
                            <img src='/RBG-Logo-AMAZONAS 365-Original.png' alt='logo' />
                        </div>


                    </div>
                </div >
            </div >
        </>
    )
}


export { EditorImg };


export function drawImageOnCanvas(image, canvas, crop) {
    if (!crop || !canvas || !image) {
        return;
    }
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');
    // refer https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
    const pixelRatio = window.devicePixelRatio;

    canvas.width = crop.width * pixelRatio * scaleX;
    canvas.height = crop.height * pixelRatio * scaleY;

    // refer https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setTransform
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    // refer https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
    );
}