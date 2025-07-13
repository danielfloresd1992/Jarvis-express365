import axios from 'axios';
import URL from '../../assets/component/api_conexion.js';

async function sendFailedDvr(data){
    try{
        const response = await axios.post(`${URL}/failed`, data);
        console.log(response);
    }
    catch(err){
        console.log(err);
    }
}


async function removeFailedDvr(params){
    try{
        const response = await axios.delete(`${URL}/failed?idLocal=${params.idLocal}&localName=${params.localName}`);
        console.log(response);
    }
    catch(err){
        console.log(err);
    }
}


export { sendFailedDvr, removeFailedDvr };