import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
//import calculateTime from '../../../../libs/date_time/calculate_time.js';
import LayautAlert from '../../../layaut/LayoutAlert.jsx'
import { ImgComponent } from '../../SendNovelties/ImageComponent.jsx';
import { useSaveNoveltie } from '../../../../hook/useSaveNoveltie.jsx';
import { isMobile } from 'react-device-detect';
import { useDataUser } from '../../../../hook/useTextMenu.jsx';
import { useImgAlternative } from '../../../../hook/useImgAlternative.jsx';
import sessionAxios from '../../../../libs/fetch_data/sessionAxios.js';
import URL from '../../../../libs/fetch_data/api_conexion.js';
import { useAlert } from '../../../../hook/useAlert.jsx';
import { blobToFile } from '../../../../libs/script/64toFile.js';
import { sendFile } from '../../../../libs/fetch_data/multimedia.Fetching.js';
import AddonField from '../../../inputs/AddonField.jsx';




export default function ErrorTiket({ awaitWindow, boxModal, reset, title }) {


    const [files, setFiles] = useState([]);
    const [table, setNumberTable] = useState('');
    const [ticket, setTiket] = useState('');
    //  OJO al orden: `useState` devuelve [valor, función]. Acá estaban al revés
    //  —`setDescription` guardaba el texto y `description` la función—, y como
    //  se declaraba con `const`, escribir en la nota lanzaba un TypeError y el
    //  campo se quedaba muerto. El compilador lo avisa: «This assignment will
    //  throw because "description" is a constant».
    const [description, setDescription] = useState('');
    const htmlAdapterRef = useRef(null);

    const saveNoveltie = useSaveNoveltie();
    const users = useSelector(state => state.users);
    const sessionUser = useSelector(state => state.user);
    let [local, setLocal] = useState(null);


    const alert = useAlert();

    useEffect(() => {
        isMobile ? null : setLocal(local = JSON.parse(localStorage.getItem('local_appExpress'))[0]);
    }, []);



    const printImg = () => {

        return (
            <div className='box-div-imgContain gridx4' ref={htmlAdapterRef}>
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

            const data = useDataUser(null, local, sessionUser, localStorage.getItem('local_appExpress'));
            let text;


            //  La nota que escribe el operador, al final del mensaje.
            //
            //  Faltaba: el campo «en caso que lo amerite» se pintaba, se podía
            //  escribir en él, y lo escrito NO llegaba a ninguna parte. El
            //  `description` que se manda más abajo es un resumen fijo que arma
            //  el propio formulario, así que la nota se perdía entera.
            //
            //  Se añade como en el resto de las demoras: solo si hay algo, en
            //  minúsculas y precedida de «Nota:».
            const nota = description !== ''
                ? (data.LANG === 'es' ? `\nNota: ${description.toLowerCase()}` : `\nNote: ${description.toLowerCase()}`)
                : '';

            if (data.LANG === 'es') {
                text = `*${data.localData.name}*\nBuenas tardes, tenemos orden #${ticket} en la mesa ${table}, la cual no se encuentra ocupada\n*Enviamos imagen para su verificación, quedamos atentos a sus comentarios.*${nota}`;
            }
            else {
                text = `*${data.localData.name}*\nGood afternoon, we have order #${ticket} at table ${table}, which is not currently occupied.\n*We are sending an image for verification and await your comments.*${nota}`;
            }


            let dataForRequest = {};


            files.map((file, index) => {
                if (!dataForRequest.imageUrl) dataForRequest.imageUrl = [];
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

            dataForRequest.rulesForBonus = title[0].rulesForBonus;
            dataForRequest.alertId = title[0]._id;
            dataForRequest.numberTiket = ticket;


            const response = await sessionAxios.post(`${URL}/novelties`, dataForRequest)

            if (response.status === 200) {
                saveNoveltie.save(`Demora de tablet - mesa ${table}`, data.userData);
                setNumberTable('');
                setTiket('');
                setFiles(files => files = []);
                boxModal.open({ title: 'Aviso', description: 'Novedad enviada' });
                reset();
            }

        }
        catch (error) {
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
                {/*  Propuesta «C · Línea de tiempo» (elegida por el usuario): ticket y mesa en una fila, con la
                     etiqueta pegada al campo. Aquí los dos se piden siempre.  */}
                <div className='ff-row ff-row--two'>
                    <AddonField id='error-ticket' label='Ticket' value={ticket} onChange={setTiket} required />
                    <AddonField id='error-mesa' label='Mesa' value={table} onChange={setNumberTable} required />
                </div>
                <label className='box-label' htmlFor="">Nota
                    {/*  `setDescription(e.target.value)` a secas. El resto de los
                         formularios escriben `setDescription(description = ...)`,
                         que asigna a la variable ADEMÁS de avisar a React —un
                         truco para poder leer el valor nuevo en la misma vuelta—.
                         Acá no hace falta: la nota solo se lee al enviar, y para
                         entonces React ya repintó.  */}
                    <textarea className='box-textArea' spellCheck="true" autoComplete='true' placeholder='en caso que lo amerite' cols="30" rows="10" value={description} onChange={e => setDescription(e.target.value)}></textarea>
                </label>
                <button className='btnSend' >Enviar</button>
            </div>

        </LayautAlert>
    );
};