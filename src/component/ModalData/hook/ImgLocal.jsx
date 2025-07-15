import { useState, useEffect } from 'react';
import axios from 'axios';
import { arrayBufferToBase64 } from '../../../libs/script/toBase64.js';


const ImgLocal = ({ id }) => {

    const [local, setLocal] = useState(null);

    useEffect(() => {
        axios.get(`https://${window.location.hostname}/local/id=${id}`)
            .then(response => {
                setLocal(local => local = response.data);
            })
            .catch(err => {
                console.log(err);
            });
        return () => {
        };
    }, [])



    return (
        <>
            {
                local ?
                    (
                        <img className='icon-img' src={arrayBufferToBase64(local?.img?.data?.data, 'image/png')} alt="" />
                    )
                    :
                    (
                        <img className='icon-img' src='../../../../../public/img/background.jpg' />
                    )
            }
        </>
    )
}


export default ImgLocal;