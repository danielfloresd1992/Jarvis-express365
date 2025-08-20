import { toPng } from 'html-to-image';
import { useRef, useState, useEffect } from 'react';
import { base64ToFile } from '../../../../libs/script/64toFile';
import './style.css';
import resize from '../../../../../public/ico/resize/resize.svg';
import moveImg from '../../../../../public/ico/move/move.svg';
import reply from '../../../../../public/ico/reply/reply.svg';
import save from '../../../../../public/ico/save/save.svg';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'


function EditorImg({ img, deleteImg, createNewImg, closeWindow }) {


    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);

    const imagePreviewCanvasRef = useRef(null);
    const imageRef = useRef();
    const newImg = useRef();


    const canvasStyles = {
        width: Math.round(completedCrop?.width ?? 0),
        height: Math.round(completedCrop?.height ?? 0),
    };





    const onImageLoad = (crop, pixelCrop) => {
        drawImageOnCanvas(imageRef.current, imagePreviewCanvasRef.current, crop);
        setCompletedCrop(crop);
    };



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
                width: '100%'
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

                    <div className='componentImgEdit-imgContent'>
                        <div style={{
                            width: '100%',
                            height: '50%'
                        }}>
                            <ReactCrop
                                crop={crop}
                                onChange={setCrop}
                                onComplete={onImageLoad}
                            >
                                <img src={img} ref={imageRef} />
                            </ReactCrop>
                        </div>
                        <div style={{
                            width: '100%',
                            height: '50%',
                            display: 'flex',
                            justify: 'center',
                            alignItems: 'center',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                            <p style={{
                                color: 'black'
                            }}>Resultado</p>

                            <div style={{
                                width: '400px',
                                height: '300px',
                                backgroundColor: '#000000'
                            }}
                                ref={newImg}
                            >
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <canvas ref={imagePreviewCanvasRef} style={canvasStyles}></canvas>
                                </div>
                            </div>

                        </div>

                    </div >
                </div>
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