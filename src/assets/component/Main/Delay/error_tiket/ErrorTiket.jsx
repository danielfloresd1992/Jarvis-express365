import { useState, usEfect, useRef, memo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import calculateTime from '../../../../util/calculate_time.js';
import LayautAlert from '../../../layaut/LayoutAlert.jsx'
import useAdapterResize from '../../../../hook/adapter_resize.jsx';
import { ImgComponent } from '../../SendNovelties/ImageComponent.jsx';
import { useSaveNoveltie } from '../../../../hook/useSaveNoveltie.jsx';
import { isMobile } from 'react-device-detect';
import { useDataUser } from '../../../../hook/useTextMenu.jsx';
import { useImgAlternative } from '../../../../hook/useImgAlternative.jsx';
import axiosInstance from '../../../../util/instanceAxios.js';
import URL from '../../../api_conexion.js';
import { useAlert } from '../../../../hook/useAlert.jsx';
import { blobToFile } from '../../../../util/64toFile.js'; 
import { sendFile } from '../../../../util/multimedia.Fetching.js';


export default function ErrorTiket({ awaitWindow, boxModal, reset, title }) {


    const [files, setFiles] = useState([]);
    const [table, setNumberTable] = useState('');
    const [ticket, setTiket] = useState('');
    const [setDescription, description] = useState('');
    const { htmlAdapterRef } = useAdapterResize({ breackWidth: 1350 });

    const saveNoveltie = useSaveNoveltie();
    const users = useSelector(state => state.users);
    let [local, setLocal] = useState(null);


    const alert = useAlert();

    useEffect(() => {
        isMobile ? null : setLocal(local = JSON.parse(localStorage.getItem('local_appExpress'))[0]);
    }, []);



    const printImg = () => {

        return (
            <div className='box-div-imgContain' style={{ zoom: window.innerWidth < 1350 ? ((window.innerWidth / 1350) - 0.1).toString() : '1' }} ref={htmlAdapterRef}>
                {
                    title[0].photos.caption.map((img, index) => (

                        <ImgComponent
                            saveImg={file => {
                                file.caption = img[local.lang]
                                const arrState = [...files]
                                arrState[index] = file;
                                setFiles(arrState);
                            }}
                            data={img}
                            deleteFile={() => {
                                //removeFile
                                const arrState = [...files]
                                arrState[index] = undefined;
                                setFiles(arrState);
                            }}
                            boxModal={boxModal}
                            key={img.index}
                        />
                    ))
                }
            </div>
        );
    };


    const handlerSubmit = async () => {
        try {
            if (files.length < title[0].photos.caption.length) throw new Error('Imagenes incompletas');

            const data = useDataUser(null, local, sessionStorage.getItem('session'), localStorage.getItem('local_appExpress'));
            let text;


            if (data.LANG === 'es') {
                text = `*${data.localData.name}*\nBuenas tardes, tenemos orden #${ticket} en la mesa ${table}, la cual no se encuentra ocupada\n*Enviamos imagen para su verificación, quedamos atentos a sus comentarios.*`;
            }
            else {
                text = `*${data.localData.name}*\nGood afternoon, we have order #${ticket} at table ${table}, which is not currently occupied.\n*We are sending an image for verification and await your comments.*`;
            }

            
            let dataForRequest = {};


            files.map((file, index) => {
                if(!dataForRequest.imageUrl) dataForRequest.imageUrl = [];
                dataForRequest.imageUrl.push({ url: file.url, caption: file.caption });
            });
    

            const html = await useImgAlternative(htmlAdapterRef.current, htmlForImg => {
            }, false, files.length > 3 ? 2 : files.length);

         

            const responseUrl = await sendFile(blobToFile(html));
            dataForRequest.imageToShare = responseUrl.data.url;

            dataForRequest.title = `Tiket de ${ticket} en mesa: ${table}`;
            dataForRequest.table = table;
            dataForRequest.userName = data.userData.userName;
            dataForRequest.userId = data.userData.userId;
            dataForRequest.localName = data.localData.name;
            dataForRequest.localId = data.localData.localId;
            dataForRequest.description = `Error de tiket: mesa ${table}, tiket: ${ticket}`;
            dataForRequest.menu = text;
   
            dataForRequest.rulesForBonus= title[0].rulesForBonus;
            dataForRequest.alertId = title[0]._id;
            dataForRequest.numberTiket = ticket;


            const response = await axiosInstance.post(`${URL}/novelties`, dataForRequest)
            
            if (response.status === 200) {
                saveNoveltie.save(`Demora de tablet - mesa ${table}`, data.userData);
                alert.request(`demora de tablet en ${data.localData.name}. por validar`);
                setNumberTable('');
                setTiket('');
                setFiles(files => files = []);
                boxModal.open({ title: 'Aviso', description: 'Novedad enviada' });
                reset();
            }

        }
        catch(error) {
            console.log(error);
            if (error.message) boxModal.open({ title: 'Error', description: error.message });
            else boxModal.open('Error', error);
        }
        finally {
            awaitWindow.close();
        }
    };



    return (
        <LayautAlert titleMenu='Error de tiket' eventForm={handlerSubmit}>


            {printImg()}

            <div className='box-inputContain box-div-imputContain'>
                <label className='box-label' htmlFor=""> Número de tiket
                    <input className='box-inputText' type="text" id="toma-orden" required value={ticket}
                        onChange={e => setTiket(e.target.value)}
                    />
                </label>

                <label className='box-label' htmlFor=""> Número de mesa
                    <input className='box-inputText' type="text" id="table" value={table} required
                        onChange={e => {
                            setNumberTable(e.target.value);
                        }}
                    />
                </label>
                <br />
                <label className='box-label' htmlFor="">Nota
                    <textarea className='box-textArea' spellCheck="true" autoComplete='true' placeholder='en caso que lo amerite' cols="30" rows="10" value={description} onChange={e => setDescription(description = e.target.value)}></textarea>
                </label>
                <button className='btnSend' >Enviar</button>
            </div>

        </LayautAlert>
    );
};