import './style.css';
import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import LayautAlert from '../../../layaut/LayoutAlert.jsx';
import { ImgComponent } from '../../SendNovelties/ImageComponent.jsx';
import { useSaveNoveltie } from '../../../../hook/useSaveNoveltie.jsx';
import { isMobile } from 'react-device-detect';
import { useDataUser } from '../../../../hook/useTextMenu.jsx';
import { useImgAlternative } from '../../../../hook/useImgAlternative.jsx';
import sessionAxios from '../../../../libs/fetch_data/sessionAxios.js';
import URL from '../../../../libs/fetch_data/api_conexion.js';
import { blobToFile } from '../../../../libs/script/64toFile.js';
import { sendFile } from '../../../../libs/fetch_data/multimedia.Fetching.js';

import { TableInput } from '../../../keysInputs/tableNumber.jsx';
import DishInputSelet from '../../../keysInputs/dishInput.jsx';
import ErrorWithoutMenu from '../../../print_error/error_without_menu.jsx';




/**
 * Plato no comandado: se está preparando un plato que no aparece en ninguna
 * comanda. Mismo patrón que ErrorTiket — recibe en `title` el menú filtrado
 * por _id desde DelayComponent y renderiza las imágenes dinámicamente según
 * la cantidad de captions configurada en la alerta (photos.caption).
 */
export default function NoComanda({ awaitWindow, boxModal, reset, title }) {


    const seletedEstableshment = useSelector(state => state.establishment);
    const sessionUser = useSelector(state => state.user);

    const [files, setFiles] = useState([]);
    // Plato desde el selector del establecimiento (objeto con nameDishe),
    // igual que en TabletDelay — nada de texto libre.
    const [dish, setDish] = useState(null);
    const [table, setNumberTable] = useState('');
    const [description, setDescription] = useState('');
    const htmlAdapterRef = useRef(null);
    const saveNoveltie = useSaveNoveltie();
    let [local, setLocal] = useState(null);


    useEffect(() => {
        isMobile ? null : setLocal(local = JSON.parse(localStorage.getItem('local_appExpress'))[0]);
    }, []);

    console.log(title);
    // La alerta aún no existe en el menú (el filter por _id vino vacío):
    // avisar en vez de romper con title[0] undefined.
    if (!title || title.length < 1) {
        return (
            <div className='box-send'>
                <h2 style={{ color: 'rgb(255, 255, 255)', textAlign: 'center' }}>
                    La alerta &quot;Plato no comandado&quot; no está configurada en el menú.
                </h2>
            </div>
        );
    }


    // Imágenes dinámicas: una casilla por cada caption configurado en la alerta
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
            awaitWindow.open('Enviando novedad...');

            if (!dish) throw new Error('Seleccione el tipo de plato');
            if (files.filter(Boolean).length < title[0].photos.caption.length) throw new Error('Imagenes incompletas');

            const data = useDataUser(null, local, sessionUser, localStorage.getItem('local_appExpress'));

            // Texto final armado por partes, como assemble_text en TabletDelay:
            // local + encabezado + mesa (opcional) + cuerpo + cierre + nota
            const text = assembleText({
                localName: local?.name,
                dish,
                table,
                description,
            }, data.LANG);


            let dataForRequest = {};


            files.filter(Boolean).map(file => {
                if (!dataForRequest.imageUrl) dataForRequest.imageUrl = [];
                dataForRequest.imageUrl.push({ url: file.url, caption: file.caption });
            });


            const html = await useImgAlternative(htmlAdapterRef.current, htmlForImg => {
            }, false, files.length > 3 ? 2 : files.length);


            const responseUrl = await sendFile(blobToFile(html));
            dataForRequest.imageToShare = responseUrl.data.url;

            dataForRequest.title = `Plato no comandado - ${dish.nameDishe}`;
            dataForRequest.table = table;
            dataForRequest.nameDish = dish.nameDishe;
            dataForRequest.userName = data.userData.userName;
            dataForRequest.userId = data.userData.userId;
            dataForRequest.localName = data.localData.name;
            dataForRequest.localId = data.localData.localId;
            dataForRequest.description = `Plato no comandado: ${dish.nameDishe}${table !== '' ? `, mesa ${table}` : ''}`;
            dataForRequest.menu = text;

            dataForRequest.rulesForBonus = title[0].rulesForBonus;
            dataForRequest.alertId = title[0]._id;


            const response = await sessionAxios.post(`${URL}/novelties`, dataForRequest)

            if (response.status === 200) {
                saveNoveltie.save(`Plato no comandado - ${dish.nameDishe}`, data.userData);
                setDish(null);
                setNumberTable('');
                setDescription('');
                setFiles([]);
                boxModal.sent({ menu: title[0], table });
                reset();
            }

        }
        catch (error) {
            console.log(error);
            if (error.message) boxModal.open({ title: 'Error', description: error.message });
            else boxModal.open({ title: 'Error', description: 'Ha ocurrido un error al enviar la novedad.' });
        }
        finally {
            awaitWindow.close();
        }
    };



    return (
        <LayautAlert titleMenu='Plato no comandado' eventForm={handlerSubmit}>

            {/* Mueca dorada con brillo animado: firma del origen del componente
                (mismo dorado #f0a500 de las muescas de comentarios en Client365;
                estilos y destello en ./style.css) */}
            <span className='ai-badge'>
                ✦ Componente creado por AI
            </span>

            {printImg()}

            <div className='box-inputContain box-div-imputContain'>

                {/*  Propuesta «C · Línea de tiempo» (elegida por el usuario): mesa y plato en una fila  */}
                <div className='ff-row ff-row--table-dish'>
                    <TableInput
                        value={table}
                        onChangeEvent={(value) => setNumberTable(value)}
                    />

                    <DishInputSelet
                        value={dish}
                        onChangeEvent={(dish) => setDish(dish)}
                        dishes={seletedEstableshment?.dishes}
                    />
                </div>

                <label className='box-label' htmlFor="">Nota
                    <textarea className='box-textArea' spellCheck="true" autoComplete='true' placeholder='en caso que lo amerite' cols="30" rows="10" value={description} onChange={e => setDescription(e.target.value)}></textarea>
                </label>
                <button className='btnSend' >Enviar</button>
            </div>

            <ErrorWithoutMenu
                arr={seletedEstableshment?.dishes}
            />

        </LayautAlert>
    );
};



// Texto final del mensaje (menu), armado por partes como assemble_text en
// TabletDelay: la mesa solo aparece si se cargó y la nota si se escribió.
function assembleText({ localName, dish, table, description }, lang) {

    const localNameText = `*${localName}*\n`;
    const headerText = lang === 'es' ? `_*Plato no comandado*_\n` : `_*Dish not on the order ticket*_\n`;
    const tableText = table !== '' ? (lang === 'es' ? `Mesa: ${table}\n` : `Table: ${table}\n`) : '';
    const bodyText = lang === 'es'
        ? `Visualizamos la preparación de ${dish?.nameDishe}, la cual no se aprecia en comanda\n`
        : `We see the preparation of ${dish?.nameDishe}, which does not appear on any order ticket\n`;
    const footerText = lang === 'es'
        ? '*Enviamos imagen para su verificación, quedamos atentos.*'
        : '*We are sending an image for verification and await your comments.*';
    const noteText = description !== ''
        ? (lang === 'es' ? `\nNota: ${description.toLowerCase()}` : `\nNote: ${description.toLowerCase()}`)
        : '';

    return `${localNameText}${headerText}${tableText}${bodyText}${footerText}${noteText}`;
}
