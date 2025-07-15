import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../../../libs/fetch_data/instanceAxios.js';
import URL from '../../../../libs/fetch_data/api_conexion.js';
import { arrayBufferToBase64 } from '../../../../libs/script/toBase64.js';



function BoxManager({ data }) {

    const [manager, setManager] = useState(data);
    const [local, setLocal] = useState(null)
    const imgContain = useRef(null);


    useEffect(() => {
        axiosInstance.get(`${URL}/managerLocalAndImgById/id=${data._id}`)
            .then(response => {
                setManager(response.data[0]);

            })
            .catch(err => {
                console.log(err);
            });


    }, []);


    useEffect(() => {
        if (manager) {
            axios.get(`${URL}/local/id=${manager.local}`)
                .then(response => {
                    console.log(response)
                    setLocal(response.data);
                })
                .catch(err => {
                    console.log(err);
                });
        }

    }, [manager]);


    const scrollMove = element => {
        let btnLeft
        let btnRigth
        if (element.target.textContent === '>') btnRigth = element.target;
        if (element.target.textContent === '<') btnLeft = element.target;
        let leftPosition = imgContain.current.scrollLeft
        let widthDiv = imgContain.current.children[0].offsetWidth;
        //const totalWidthScroll = (imgContain.current.children[0].offsetWidth *imgContain.current.children.length) - imgContain.current.children[0].offsetWidth;

        if (element.target.textContent.trim() === '>') {
            imgContain.current.scrollLeft = leftPosition + widthDiv;
        }
        if (leftPosition > -1 && element.target.textContent.trim() === '<') {
            imgContain.current.scrollLeft = leftPosition - widthDiv;
        }
    };


    return (
        <>
            {

                manager && manager.status !== 'inactivo' && Array.isArray(manager.managerimg?.img) ?
                    (
                        <>
                            <div className='boxManager'>
                                <picture className='boxManager-imgContain' ref={imgContain} >
                                    {
                                        manager.managerimg.img.map((img, index) => (
                                            <img
                                                className={`boxManager-img`}

                                                key={index}
                                                src={arrayBufferToBase64(img.data.data, img.contentType)}
                                            />
                                        ))
                                    }

                                    <></>
                                </picture>
                                <div className='boxManager-textContain'>
                                    <h3 className='boxManager-subTitle' >{manager.burden} {manager.name}</h3>
                                    <p className='boxManager-textDescription'>{manager.characteristic}</p>
                                </div>

                                {
                                    local ?
                                        (
                                            <img className='boxManager-locallogo' src={arrayBufferToBase64(local.img.data.data, 'image/png')} alt="" srcset="" />
                                        )
                                        :
                                        (null)
                                }
                                <div className='boxManager-btnContain'>
                                    <button className="boxManager-btn" onClick={e => scrollMove(e)} >  {'<'} </button>
                                    <button className="boxManager-btn" onClick={e => scrollMove(e)} > {'>'} </button>
                                </div>
                            </div>
                        </>
                    )
                    :
                    (
                        <>
                        </>
                    )
            }
        </>
    )
}

export { BoxManager };