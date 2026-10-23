//import './style.css';
import { useState, useRef, useEffect } from 'react';
import sessionAxios from '../../../../libs/fetch_data/sessionAxios.js';
import { isMobile } from 'react-device-detect';
import { useSelector } from 'react-redux';
import { useAlert } from '../../../../hook/useAlert';
import { Search } from '../../search/searchComponent.jsx';
import { returnTimeExceding } from '@/libs/date_time/time';
import { useDataUser } from '../../../../hook/useTextMenu.jsx';
import { useSaveNoveltie } from '../../../../hook/useSaveNoveltie.jsx';
import { ImgBoxImg } from '../../imgBoxComponent/ImgBox';
import { TABLET_RULES, checkTime } from './model.js';
import URL from '../../../../libs/fetch_data/api_conexion.js';


import { TableInput, TikekInput } from '../../../keysInputs/tableNumber.jsx';
import DishInputSelet from '../../../keysInputs/dishInput.jsx'
import ErrorWithoutMenu from '../../../print_error/error_without_menu.jsx'
import TimeTrack, { TrackNote, isClock } from '../../../inputs/TimeTrack.jsx';
import LimitBar from '../../../inputs/LimitBar.jsx';
import SwitchRow from '../../../inputs/SwitchRow.jsx';
import { dishLimit } from '../../../../libs/tickets/dishTypes.js';
import { exceedsLimit } from '../../../../libs/date_time/timeLimit.js';

import FormLayaut from '@/component/layaut/form_layaut';
import { announceReportedDelay, noveltieIdOf } from '../../../../libs/tickets/reportedDelay.js';
import { preparationDescription } from '../reportDescription.js';



/*  @param {object} datosIniciales  cuando el formulario se abre desde el icono de cocina de un proceso de Mesas (su
 *                                  demora de preparación; askForPreparation en RegisterRecordRow): el ticket, la mesa, el
 *                                  plato de la carta, sus horas, el turno con que se midió ('shift') y de qué fila y
 *                                  proceso viene ('recordId', 'processId'), para apuntarle la novedad al enviarla. Sin él,
 *                                  el formulario en blanco de siempre.
 */
function TabletDelay({ awaitWindow, boxModal, reset, title: noveltyConfig, datosIniciales }) {


    const seletedEstableshment = useSelector(state => state.establishment);
    const sessionUser = useSelector(state => state.user);
    const htmlAdapterRef = useRef(null);
    const config = {
        hiddenBoxText: true,
        edit: true
    }

    const alert = useAlert();
    const saveNoveltie = useSaveNoveltie();

    const user = useRef(null);
    const [dish, setDish] = useState(datosIniciales?.dish ?? null);

    let [tiket, setTiket] = useState(datosIniciales?.ticketNumber ?? '');
    let [local, setLocal] = useState(null);

    let [files, setFiles] = useState([null]);
    let [table, setNumberTable] = useState(datosIniciales?.tableNumber ?? '');

    let [time1, setTime1] = useState(datosIniciales?.orderTaking ?? ''); //TOMA DE ORDEN
    let [time2, setTime2] = useState(datosIniciales?.markedReadyOnTablet ?? ''); //LISTO EN TABLET
    let [time3, setTime3] = useState(datosIniciales?.readyInTheKitchen ?? ''); //LISTO EN COCINA
    let [time4, setTime4] = useState(datosIniciales?.dishDelivery ?? ''); //ENTREGA DE PLATO



    const [correspondingTimesState, setCorrespondingTimesState] = useState(false); //PARA SABER SI ESTUVO DENTRO DE LOS TIEMPOS CORRESPONDIENTES
    let [description, setDescription] = useState('');


    //LISTO DESDE TABLET
    const delayPreparationTable = returnTimeExceding(time2, time1);
    //LISTO DESDE COCINA
    const delayPreparationInKichen = returnTimeExceding(time3, time1);
    // TOTAL HASTA LA ENTREGA
    const timeTotalDelay = returnTimeExceding(time4, time1);
    //CALCULO PARA VALIDAR TIEMPO
    //  Desde Mesas, con el turno de la rotación: el mismo tiempo con que se marcó la demora
    const timeDelaySubtraction = checkTime(dish, delayPreparationTable, datosIniciales?.shift);
    //PARA EL TEXTO DEL MENU

    // shift / limitNow = «el turno y el tiempo de preparación del plato en él», los mismos con que mide checkTime: el de
    // la rotación si viene de Mesas y, si no, el de la hora del equipo
    const shift = datosIniciales?.shift ?? (new Date().getHours() >= 18 ? 'night' : 'day');
    const limitNow = dishLimit(dish, shift);

    // preparationLate = «de la toma de orden a listo en tablet pasó del tiempo del plato»: el tramo va en rojo
    const preparationLate = isClock(time1) && isClock(time2) && exceedsLimit(delayPreparationTable, limitNow);

    // sinceOrder = «la nota de una hora del recorrido: lo que tardó desde la toma de orden», o qué falta para saberlo
    const sinceOrder = (time, duration, text, late = false) => (
        isClock(time1) && isClock(time)
            ? <TrackNote tone={late ? 'late' : 'plain'} duration={duration}>{text}</TrackNote>
            : <TrackNote tone='pending'>{isClock(time1) ? 'Falta esta hora' : 'Falta la toma de orden'}</TrackNote>
    );



    useEffect(() => {
        isMobile ? null : setLocal(local = JSON.parse(localStorage.getItem('local_appExpress'))[0]);
    }, []);



    const pushImg = file => {
        setFiles([file]);
    };


    const deleteImg = text => {
        const getItems = files.filter(file => file.caption !== text);
        setFiles(files = getItems);
    };




    const sendImgForm = async e => {
        try {
            e.preventDefault();
            awaitWindow.open('Enviando novedad...');

            if (!dish) throw new Error('Seleccione el tipo de plato');

            const data = useDataUser(user.current, local, sessionUser, localStorage.getItem('local_appExpress'));
            const text = assemble_text({
                localName: local?.name,
                dish: dish,
                ticket: tiket,
                table: table,
                takeOrder: time1,
                readtTable: time2,
                readyKichen: time3,
                delivery: time4,
                delayPreparationTable: delayPreparationTable,
                timeTotalDelay: timeTotalDelay,
                timeDelaySubtraction: timeDelaySubtraction,
                correspondingTimes: correspondingTimesState
            }, local?.lang);


            let dataForRequest = {};

            files.forEach((data, index) => {
                if (!data) throw new Error(`Debe ingresas las imagenes correspondiente, imagen: ${index + 1}`)
                if (!dataForRequest.imageUrl) dataForRequest.imageUrl = [];
                dataForRequest.imageUrl.push({ url: data.url, caption: data.caption });
            });

            //  const repsonseData = await sendFile(blobToFile(files[0].file));
            dataForRequest.imageToShare = dataForRequest.imageUrl[0].url;


            dataForRequest.title = `Demora de ${dish.nameDishe}`;
            dataForRequest.table = table;
            dataForRequest.nameDish = dish.nameDishe;
            dataForRequest.userName = data.userData.userName;
            dataForRequest.userId = data.userData.userId;
            dataForRequest.localName = data.localData.name;
            dataForRequest.localId = data.localData.localId;
            dataForRequest.description = `Demora en preparación de ${dish.nameDishe}, tiempo total: ${timeTotalDelay}, ${timeDelaySubtraction.timeExceeding}`
            dataForRequest.menu = text;
            dataForRequest.rulesForBonus = noveltyConfig.rulesForBonus;
            dataForRequest.alertId = noveltyConfig?._id;
            dataForRequest.numberTiket = tiket;
            dataForRequest.timePeriod = {
                tomaOrden: time1,
                listoTablet: time2,
                listoCocina: time3,
                entregaPlato: time4
            };


            //  Se ESPERA la respuesta: antes la petición iba suelta y el 'finally' de abajo cerraba el «Enviando…» en el
            //  acto (se podía volver a enviar), y su error llegaba al aviso como objeto, que React no puede pintar y
            //  tumbaba la pantalla. Ahora el «Enviando…» sigue abierto hasta el final —también mientras se vuelve a
            //  entrar, si la sesión venció (sessionAxios)— y el error va por el 'catch' de siempre, con su texto.
            const response = await sessionAxios.post(`${URL}/novelties`, dataForRequest);
            console.log(response);
            if (response.status === 200) {
                saveNoveltie.save(`Demora de tablet - mesa ${table}`, data.userData);

                //  Abierto desde el icono de cocina de un proceso de Mesas: el ObjectId de la novedad vuelve a ESE
                //  proceso ('preparationDelay'), que pone la bandera de «Reportada» en lugar del icono
                //  (reportedDelay.js). Y si la tablet estaba en la ventana flotante, vuelve al frente, como en
                //  primera atención.
                if (datosIniciales?.recordId && datosIniciales?.processId) announceReportedDelay({ recordId: datosIniciales.recordId, processId: datosIniciales.processId, tipo: 'tablet', noveltieId: noveltieIdOf(response.data) });
                if (datosIniciales?.deLaVentanaFlotante) window.electronAPI?.openTabletWindow?.();

                setNumberTable('');
                setFiles(files => files = []);
                setTime1(time1 = '');
                setTime2(time2 = '');
                setDish(null);
                boxModal.sent({ menu: noveltyConfig, table });
                reset();
            }
        }
        catch (error) {
            console.log(error);
            boxModal.open({ title: 'Error', description: error?.message || 'No se pudo enviar la novedad' });
        }
        finally {
            awaitWindow.close();
        }
    };




    return (
        <FormLayaut
            title='Demora de tablet'
            //  Abierto desde el icono de cocina de Mesas, encabeza el formulario la descripción de la demora de
            //  preparación, como en primera atención y limpieza. Sale de lo que tiene el formulario en cada momento:
            //  si se corrige una hora o el plato, la descripción la sigue.
            description={datosIniciales
                ? preparationDescription({
                    ticket: tiket,
                    table,
                    dish: dish?.nameDishe,
                    start: time1,
                    end: time2,
                    kitchen: time3,
                    total: delayPreparationTable,
                    limit: datosIniciales.limit,
                    shift: datosIniciales.shift,
                    photos: noveltyConfig?.photos?.caption?.length ?? 1,
                })
                : undefined}
            event={e => sendImgForm(e)}
        >


            <div className='box-imgComponenContent gridx4' ref={htmlAdapterRef}>
                {
                    noveltyConfig.photos.caption.map(iteration => (
                        <ImgBoxImg data={iteration} boxModal={boxModal} setImg={pushImg} deleteImg={deleteImg} key={iteration.index} language={local?.lang} config={config} />

                    ))
                }
            </div>



            {/*  Los campos, en la propuesta «C · Línea de tiempo» (elegida por el usuario): ticket, mesa y plato en una
                 fila; las cuatro horas sobre el recorrido del pedido, con lo que tardó hasta cada una; lo de la tablet
                 contra el límite del plato en una barra, y la pregunta de los tiempos como un interruptor.  */}
            <div className='box-inputContain box-div-imputContain'>

                <div className='ff-row'>
                    <TikekInput
                        value={tiket}
                        onChangeEvent={(value) => setTiket(value)}
                    />

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

                <TimeTrack
                    title='Recorrido del pedido'
                    steps={[
                        { id: 'toma-orden', label: 'Toma de orden', value: time1, onChange: setTime1, note: <TrackNote tone='pending'>Empieza a contar</TrackNote> },
                        { id: 'listo-tablet', label: 'Listo en tablet', value: time2, onChange: setTime2, late: preparationLate, note: sinceOrder(time2, delayPreparationTable, preparationLate ? `en tablet · +${timeDelaySubtraction.timeExceeding}` : 'en tablet', preparationLate) },
                        { id: 'listo-cocina', label: 'Listo en cocina', value: time3, onChange: setTime3, note: sinceOrder(time3, delayPreparationInKichen, 'desde la toma de orden') },
                        { id: 'entrega-plato', label: 'Entrega de plato', value: time4, onChange: setTime4, note: sinceOrder(time4, timeTotalDelay, 'en total') },
                    ]}
                />

                <LimitBar
                    title={`En tablet, contra el límite ${shift === 'night' ? 'de noche' : 'de día'}`}
                    elapsed={isClock(time1) && isClock(time2) ? delayPreparationTable : ''}
                    limit={limitNow}
                    inTimeNote={`No pasa del tiempo de preparación de ${dish?.nameDishe ?? 'este plato'}: así no es una demora. Revisa las horas antes de enviarla.`}
                />

                <SwitchRow
                    id='tablet-en-tiempo'
                    title='Estuvo dentro de los tiempos, pero no se marcó en pantalla'
                    description='El mensaje lleva la nota para el cliente'
                    checked={correspondingTimesState}
                    onChange={setCorrespondingTimesState}
                />

                <label className='box-label' htmlFor="">Nota
                    <textarea className='box-textArea' spellCheck="true" autoComplete='true' placeholder='en caso que lo amerite' cols="30" rows="10" value={description} onChange={e => setDescription(description = e.target.value)}></textarea>
                </label>

            </div>
            <ErrorWithoutMenu
                arr={seletedEstableshment?.dishes}
            />

        </FormLayaut>
    );
}

export { TabletDelay }





function assemble_text({ localName, dish, ticket, table, takeOrder, readtTable, delayPreparationTable, readyKichen, delivery, timeTotalDelay, timeDelaySubtraction, correspondingTimes }, lang) {

    const localNameText = `*${localName}*\n`;
    const headerText = lang === 'es' ? `_*Demora en preparación de ${dish?.nameDishe}*_\n` : `_*${dish?.nameDishe} preparation delay*_\n`;
    const ticketText = ticket !== '' ? lang === 'es' ? `Ticket: #${ticket}\n` : `Ticket: #${ticket}\n` : '';
    const tableText = table !== '' ? lang === 'es' ? `Mesa: ${table}\n` : `Table: ${table}\n` : '';
    const takeOrderText = lang === 'es' ? `Toma de orden: ${takeOrder}\n` : `Orden Take: ${takeOrder}\n`;
    const readtTableText = lang === 'es' ? `Listo en tablet: ${readtTable}\n` : `Ready in tablet: ${readtTable}\n`;
    const readyKichenText = lang === 'es' ? `Listo en cocina: ${readyKichen}\n` : `Ready in kitchen: ${readyKichen}\n`;
    const deliveryDushText = lang === 'es' ? `Entrega de ${dish?.nameDishe}: ${delivery}\n` : `${dish?.nameDishe} delivery: ${delivery}\n`;
    const TIME_DELAY_SUBTRACTION_MENU = ''//dish?.showDelaySubtraction ? `${lang === 'es' ? 'tiempo que excede' : `${dish?.nameDishe} in preparation`}: ${timeDelaySubtraction.timeExceeding}\n` : ''
    const delayPreparationTableText = lang === 'es' ? `Demora en preparación: ${delayPreparationTable}\n` : `delay in preparation: ${timeDelaySubtraction.timeExceeding}\n`;
    const timeTotalText = lang === 'es' ? `Tiempo total: ${timeTotalDelay}` : localName === 'Mister Mizner' ? `Total time: ${timeTotalDelay}` : '';

    const corresponding = correspondingTimes ?
        lang === 'es' ?
            '\nNota: La orden estuvo dentro de los tiempos correspondientes, sin embargo no fue marcada en pantalla al momento, por tal motivo siguió corriendo el tiempo y se registra la demora en nuestro sistema, quedamos atentos a sus comentarios.'
            : '\nNote : The order was completed within the expected time frame; however, it was not marked on screen at the appropriate moment.As a result, the timer continued running and the delay was recorded in our system.We remain available for any comments or feedback you may have.'
        :
        ''


    return `${localNameText}${headerText}${ticketText}${tableText}${takeOrderText}${readtTableText}${readyKichenText}${deliveryDushText}${delayPreparationTableText}${TIME_DELAY_SUBTRACTION_MENU}${timeTotalText}${corresponding}`;
}   