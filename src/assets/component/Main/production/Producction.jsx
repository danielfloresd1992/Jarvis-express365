import { useState, useCallback, useRef } from 'react';
import { useAlert } from '../../../hook/useAlert';
import { useSaveNoveltie } from '../../../hook/useSaveNoveltie';
import './style.css';
import { toBlob, toJpeg } from 'html-to-image';
import { ImgComponent } from './imgComponent.jsx';
import axiosInstance from '../../../util/instanceAxios.js';
import URL from '../../api_conexion.js';
import useAdapterResize from '../../../hook/adapter_resize.jsx';
import { blobToFile } from '../../../util/64toFile.js';
import { sendFile } from '../../../util/multimedia.Fetching.js';


function Production({ awaitWindow, boxModal, reset, title }) {



    const alert = useAlert();
    const { htmlAdapterRef } = useAdapterResize({ breackWidth: 1350 });
    const saveNoveltie = useSaveNoveltie();
    let [count, setCount] = useState(3);
    let [verb1, setVerb1] = useState('');
    let [verb2, setVerb2] = useState('');
    let [verb3, setVerb3] = useState('');
    let [verb4, setVerb4] = useState('');

    const [fileState, setFileState] = useState([{ file: null, caption: null }, { file: null, caption: null }, { file: null, caption: null }, { file: null, caption: null }]);



    const setTextLabel = useCallback((element) => {
        const filesCopi = [...fileState]
        switch (element.id) {
            case 'im1':
                setVerb1(verb1 = element.value);
                filesCopi[0].caption = element.value;
                setFileState(filesCopi)
                break;
            case 'im2':
                setVerb2(verb2 = element.value);
                filesCopi[1].caption = element.value;
                setFileState(filesCopi)
                break;
            case 'im3':
                setVerb3(verb3 = element.value);
                filesCopi[2].caption = element.value;
                setFileState(filesCopi)
                break;
            case 'im4':
                setVerb4(verb4 = element.value);
                filesCopi[3].caption = element.value;
                setFileState(filesCopi)
                break;
            default:
                break;
        }
    }, [fileState]);


    const recibCount = (value) => {
        if (value === '') return setCount(count = '')
        if (value < 3) return 0;
        if (value > 4) return 0;
        setCount(count = value)
    };


    const base64ToFile = (base64, fileName) => {
        const byteString = atob(base64.split(',')[1]);
        const mimeString = base64.split(',')[0].split(':')[1].split(';')[0]; // Crear un ArrayBuffer y una vista de bytes 
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < byteString.length; i++) {
            uint8Array[i] = byteString.charCodeAt(i);
        } // Crear un Blob a partir del ArrayBuffer 
        const blob = new Blob([arrayBuffer], { type: mimeString }); // Crear un archivo a partir del Blob 
        const file = new File([blob], fileName, { type: mimeString });
        return file;
    };



    const handdlerSubmit = async e => {
        try {
            e.preventDefault();
            awaitWindow.open('Generando imagen');

            if (Number(count) === 4) {
                if (verb1 === '' || verb2 === '' || verb3 === '' || verb4 === '') throw new Error('Debes colocar los verbos correspondiente a las imagenes');
            }
            else if (Number(count) === 3) {
                if (verb1 === '' || verb2 === '' || verb3 === '') throw new Error('Debes colocar los verbos correspondiente a las imagenes');
            }
            else {
                return boxModal.open({ title: 'Error', description: 'Seleccione el numero de imagenes, 3 o 4' });
            }


            for (let i = 0; i < count; i++) {
                console.log(i)
                if (!fileState[i].file) throw new Error('Debes colocar todas las imagenes correspondientes.');
            }



            const dataForRequest = {};

            htmlAdapterRef.current.style.width = 'unset';
            htmlAdapterRef.current.style.height = 'unset';
            Array.from(htmlAdapterRef.current.children).forEach(element => {
                element.style.maxHeight = 'unset';
                console.log(element)
                element.querySelector('.box-text').classList.add('text-alternative');
                element.querySelector('.box-img').classList.add('box-img-alternative');
                if (element.querySelector('.box-deleteimg')) element.querySelector('.box-deleteimg').style.display = 'none';
                element.style.width = '500px';
                element.style.height = '270px';
                element.querySelector('.box-imgContain').style.width = '500px';
                element.querySelector('.box-imgContain').style.height = '270px';
            });

            htmlAdapterRef.current.style.backgroundColor = '#fff';
            htmlAdapterRef.current.style.height = 'fit-content';
            htmlAdapterRef.current.style.justifyItems = 'center';
            htmlAdapterRef.current.style.zoom = 'inherit';
            if (htmlAdapterRef.current.children.length === 3) {
                htmlAdapterRef.current.style.display = 'grid';
                htmlAdapterRef.current.style.gridTemplateColumns = '1fr 1fr'
                htmlAdapterRef.current.style.gridTemplateRows = 'auto 1fr'
                htmlAdapterRef.current.children[2].style.gridRow = '2 / 3';
                htmlAdapterRef.current.children[2].style.gridColumn = '1 / 3';
            }
            else {
                htmlAdapterRef.current.style.display = 'grid';
                htmlAdapterRef.current.style.gridTemplateColumns = '1fr 1fr'
            }
        
        
            const text = `*${JSON.parse(localStorage.getItem('local_appExpress'))[0].name}*\nEmpleado realiza producción: ${verb1}, ${verb2}, ${verb3} ${verb4 !== '' ? ` y ${verb4}` : ''}`;
            const urlImg = await toBlob(htmlAdapterRef.current, { quality: 0.1 })

            const responseUrl = await sendFile(blobToFile(urlImg));
            dataForRequest.imageToShare = responseUrl.data.url;

            fileState.map((file, index) => {
                console.log(file)
                if (file.file) {
                    if(!dataForRequest.imageUrl) dataForRequest.imageUrl = [];
                    dataForRequest.imageUrl.push({ url: file.url, caption: file.caption });
                }
            });

            
            dataForRequest.title = 'Empleado realiza producción';
            dataForRequest.userName = `${JSON.parse(sessionStorage.getItem('session')).name} ${JSON.parse(sessionStorage.getItem('session')).surName}`;
            dataForRequest.userId = JSON.parse(sessionStorage.getItem('session'))._id;
            dataForRequest.localName = JSON.parse(localStorage.getItem('local_appExpress'))[0].name;
            dataForRequest.localId = JSON.parse(localStorage.getItem('local_appExpress'))[0]._id;
            dataForRequest.description = `Empleado realiza producción: ${verb1}, ${verb2}, ${verb3} ${verb4 !== '' ? ` y ${verb4}` : ''}`;
            dataForRequest.menu = text;
            dataForRequest.alertId = title._id;


            const response = await axiosInstance.post(`${URL}/novelties`, dataForRequest);

            saveNoveltie.save(`Empleado realiza produción - ${JSON.parse(localStorage.getItem('local_appExpress'))[0].name}`, JSON.parse(sessionStorage.getItem('session')));
            alert.request(`Producción en ${JSON.parse(localStorage.getItem('local_appExpress'))[0].name}. por validar`);
            console.log(response);
            boxModal.open({ title: 'Aviso', description: 'Producción entregado.' });
            setVerb1(verb1 = '');
            setVerb2(verb2 = '');
            setVerb3(verb3 = '');
            setVerb4(verb4 = '');
            reset('');
        }
        catch (error) {
            console.log(error);
            boxModal.open({ title: 'Error', description: error.message });
        }
        finally {
            awaitWindow.close();
        }
    };




    return (
        <>
            <form className='productionContain' onSubmit={handdlerSubmit}>

                <div className='productionContain-headerContain'>
                    <label htmlFor="count-img" className='box-label productionContain-label' style={{ color: '#fff' }}>Numero de Imagen
                        <input type="number" id='count-img' className='box-inputText' value={count} min={3} max={4} onChange={e => recibCount(count = e.target.value)} />
                    </label>
                </div>

                <div className='box-imgComponenContent' ref={htmlAdapterRef} >
                    <ImgComponent
                        modal={boxModal}
                        text={setTextLabel}
                        idTarget='im1'
                        changeFile={file => {
                            const filenew = { ...fileState[0], ...file };
                            const state = [...fileState];
                            state[0] = filenew;
                            setFileState(state);
                        }}
                        file={fileState[0]}
                    />
                    <ImgComponent
                        modal={boxModal}
                        text={setTextLabel}
                        idTarget='im2'
                        changeFile={file => {
                            const filenew = { ...fileState[1], ...file };
                            const state = [...fileState];
                            state[1] = filenew;
                            setFileState(state);
                        }}
                        file={fileState[1]}
                    />
                    <ImgComponent
                        modal={boxModal}
                        text={setTextLabel}
                        idTarget='im3'
                        changeFile={file => {
                            const filenew = { ...fileState[2], ...file };
                            const state = [...fileState];
                            state[2] = filenew;
                            setFileState(state);
                        }}
                        file={fileState[2]}
                    />
                    {
                        count > 3 ?
                            (
                                <ImgComponent
                                    modal={boxModal}
                                    text={setTextLabel}
                                    idTarget='im4'
                                    changeFile={file => {
                                        const filenew = { ...fileState[3], ...file };
                                        const state = [...fileState];
                                        state[3] = filenew;
                                        setFileState(state);
                                    }}
                                    file={fileState[3]}
                                />
                            )
                            :
                            (null)
                    }
                </div>
                <div className='productionContain-headerContain'>

                    <button className='btnSend'
                    >Enviar</button>
                </div>
            </form>
        </>
    );
}

export { Production };