import { toPng } from 'html-to-image';
import { useRef, useState, useEffect } from 'react';
import { base64ToFile } from '../../../../util/64toFile.js';
import './style.css';
import resize from '../../../../../../public/ico/resize/resize.svg';
import moveImg from '../../../../../../public/ico/move/move.svg';
import reply from '../../../../../../public/ico/reply/reply.svg';
import save from '../../../../../../public/ico/save/save.svg';
import { isMobile } from 'react-device-detect';



function EditorImg({ img, deleteImg, createNewImg, closeWindow }){

    const activeDraggingRef = useRef(false);
    const inputZoonRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [ mousePosition, setMousePosition ] = useState({ x: 0, y: 0 });
    const [ position, setPosition ] = useState({ x: 0, y: 0 });

    let [ resizePosition, setResizePosition ] = useState({ x: 0, y: 0 });
    const [startWidth, setStartWidth] = useState(0);
    const [startHeight, setStartHeight] = useState(0);
    const [ cut, setVisivilityCut ] = useState(false);

    
    const newImg = useRef();
    const imgTag = useRef();
    const [ isResize, setResize ] = useState(false);


    useEffect(() => {
        inputZoonRef.current.value = '70';
    });

    
    const handleMouseDown = e => {
        setIsDragging(true);
        isMobile ? setMousePosition({ x: e.touches[0].clientX, y: e.touches[0].clientY }) : setMousePosition({ x: e.clientX, y: e.clientY });
    };

    
    const handleMouseMove = e => {
        if(activeDraggingRef.current && isDragging){
            const dx = isMobile ? e.touches[0].clientX - mousePosition.x : e.clientX - mousePosition.x;
            const dy = isMobile ? e.touches[0].clientY - mousePosition.y : e.clientY - mousePosition.y;
            setPosition({ x: position.x + dx, y: position.y + dy });
            isMobile ? setMousePosition({ x: e.touches[0].clientX, y: e.touches[0].clientY }) : setMousePosition({ x: e.clientX, y: e.clientY });
            const transform = `translate(${position.x}px, ${position.y}px)`;
            imgTag.current.style.transform = transform;
        }
    };

    
    const handleMouseUp = () => {
        setIsDragging(false);
    };


    const mouseDownResize = e => {
        setResize(true);
        isMobile ? setResizePosition({ x: e.touches[0].clientX , y: e.touches[0].clientY }) : setResizePosition({ x: e.clientX , y: e.clientY });
        setStartWidth(parseInt(getComputedStyle(newImg.current).width));
        setStartHeight(parseInt(getComputedStyle(newImg.current).height));
    };


    const mouseMoveResize = e => {
        if(isResize){
            const newWidth = isMobile ?  startWidth + e.touches[0].clientX - resizePosition.x : startWidth + e.clientX - resizePosition.x;
            const newHeight = isMobile ?  startWidth + e.touches[0].clientY - resizePosition.y : startHeight + e.clientY - resizePosition.y;
            newImg.current.style.width = `${ newWidth }px`;
            newImg.current.style.height = `${ newHeight }px`;
        }
    };


    const mouseUpResize = () => {
        setResize(false);
    };


    const saveChangue = () => {
        newImg.current.classList.remove('componentImgEdit-imgContent-move');
        newImg.current.style.border = 'none';
        if(cut === true) setVisivilityCut(false);
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
    

    return(
        <>
            <div className='componentImgEdit'>
                <div className='componentImgEdit-section'>
                    <div className='componentImgEdit-bannerBtn'>
                        <div className='componentImgEdit-BtnContent'>
                            <button className='componentImgEdit-Btn'
                                type='button'
                                onClick={ () => {
                                    newImg.current.classList.toggle('componentImgEdit-imgContent-move');
                                    if(activeDraggingRef.current){
                                        imgTag.current.style.cursor = 'unset';
                                        activeDraggingRef.current = false
                                    }
                                    else{
                                        imgTag.current.style.cursor = 'move';
                                        activeDraggingRef.current = true;
                                    }  
            
                                    if(cut) setVisivilityCut(!cut)
                                }}
                            >
                                <img className='componentImgEdit-btnImg' src={ moveImg } alt="" />
                                <p className='componentImgEdit-BtnText'> move </p>
                            </button>
                            <button className='componentImgEdit-Btn'
                                type='button'
                                onClick={ () => {
                                        setVisivilityCut(!cut) 
                                        if(activeDraggingRef.current){
                                            newImg.current.classList.remove('componentImgEdit-imgContent-move');
                                            activeDraggingRef.current ? activeDraggingRef.current = false : activeDraggingRef.current = true;
                                            imgTag.current.style.cursor = 'unset';
                                        }
                                    }
                                }
                            >
                                <img className='componentImgEdit-btnImg' src={ resize } alt="" />
                                <p className='componentImgEdit-BtnText'> resize </p>
                            </button>
                            <button className='componentImgEdit-Btn'
                                type='button'
                                onClick={ saveChangue }
                            >
                                <img className='componentImgEdit-btnImg' src={ save } alt="" />
                                <p className='componentImgEdit-BtnText'> save </p>
                            </button>
                            <button className='componentImgEdit-Btn'
                                type='button'
                                onClick={closeWindow}
                            >
                                <img className='componentImgEdit-btnImg' src={ reply } alt="" />
                                <p className='componentImgEdit-BtnText'> back </p>
                            </button>
                        </div>
                        <label className='componentImgEdit-label'> Zoom
                            <input type="range" name="Zoom" min="1" max="200"
                                ref={ inputZoonRef }
                                onChange={e => {
                                    imgTag.current.style.zoom = `${e.target.value}%`;
                                }}
                            />
                         </label>
                    </div>
                    <div className='componentImgEdit-imgContent' ref={ newImg } style={{touchAction: 'none'}} 
                    >
                        <img src={ img } 
                            ref={ imgTag }
                            draggable={ false } 
                            onMouseDown={ handleMouseDown }
                            onMouseMove={ handleMouseMove }
                            onMouseUp={ handleMouseUp }
                            onMouseLeave={ handleMouseUp }

                            onTouchStart={ handleMouseDown }
                            onTouchMove={ handleMouseMove }
                            onTouchEnd={ handleMouseUp }
                        />

                        {
                            cut ? 
                            (
                                <div className='componentImgEdit-pointerResize'
                                    onMouseDown={ mouseDownResize }
                                    onMouseMove={ mouseMoveResize }
                                    onMouseUp={ mouseUpResize }
                                    onMouseLeave={ mouseUpResize }

                                    onTouchStart={ mouseDownResize }
                                    onTouchMove={ mouseMoveResize }
                                    onTouchEnd={ mouseUpResize }
                                >
                                    <div className="Box-DecorationResize"></div>
                                    <div className="Box-DecorationResize"></div>
                                    <div className="Box-DecorationResize"></div>
                                    <div className="Box-DecorationResize"></div>
                                    <div className="Box-DecorationResize"></div>
                                    <div className="Box-DecorationResize"></div>
                                    <div className="Box-DecorationResize"></div>
                                    <div className="Box-DecorationResize"></div>
                                    <div className="Box-DecorationResize"></div>
                                </div>        
                            )
                            :
                            (
                                null
                            )
                        }     
                    </div>
                </div>
            </div>
        </>
    )
}


export { EditorImg };