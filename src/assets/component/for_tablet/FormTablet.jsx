import { useState, useRef, useEffect, useCallback } from 'react';
import { isTablet, isMobile } from 'react-device-detect';
import Compressor from 'compressorjs';
import { useAlert } from '../../hook/useAlert.jsx';
import { TABLET_RULES, checkTime } from '../Main/Delay/tablet/model.js';
import InputHour from '../inputs/inputHours';
import InputBorderBlue from '../inputs/Input.jsx';
import { returnTimeExceding } from '../../util/time.js';
import axiosInstance from '../../util/instanceAxios.js';
import IP from '../../util/dataFetch.js';
import { isTimeGreaterThanOther } from '../../util/timeValidator.js';
import { sendFile } from '../../util/multimedia.Fetching.js';
import { blobToFile } from '../../util/64toFile.js';



const configDefault = {
    typeDish: null,
    numberTiket: null,
    numberTable: null,
    establishment: null,
    eventHours: {
        tomaOrden: null,
        listoTablet: null,
        listoCocina: null,
        entregaPlato: null,
        totalidad: null
    },
    description: ''
}


export default function FormTablet({ awaitWindow, boxModal, reset, title }) {


    const [fileState, setStateFile] = useState(null);

    const inputFileRef = useRef(null);
    const styleNeverPointer = { pointerEvents: 'none' };
    const [local, setLocal] = useState(null);
    const [user, setUser] = useState(null);

    const [noveltyState, setNoveltyState] = useState(configDefault);
    const [correspondingTimesState, setCorrespondingTimesState] = useState(false);
    const selectDishRef = useRef();
    const btnSubmitRef = useRef(null);
    const alert = useAlert();

    const [keySubmit, setKeySubmit] = useState(true);


    useEffect(() => {
        setLocal(state => state = JSON.parse(localStorage.getItem('local_appExpress'))[0]);
        setUser(state => state = JSON.parse(sessionStorage.getItem('session')));

        return () => {
            //    setNoveltyState(configDefault);
        }
    }, []);


    console.log(local);


    const onchangeInputFile = async e => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const type = ['image/jpg', 'image/jpeg', 'image/png'].filter(type => type === file.type);
            if (type.length < 1) return boxModal.open({ title: 'Error de formato', description: 'Asegurece que sea una imagen' });

            setStateFile(await compressAndReadUrlImage(file));
        }
    };


    const compressAndReadUrlImage = file => {
        return new Promise((resolve, reject) => {
            new Compressor(file, {
                cuality: 0.7,
                width: 500,
                height: 480,
                success: async (compressedResult) => {
                    const responseUrl = await sendFile(blobToFile(compressedResult));
                    const fileReader = new FileReader();
                    fileReader.readAsDataURL(compressedResult);
                    fileReader.onload = e => {
                        resolve({ file: compressedResult, dataUrl: e.target.result, url: responseUrl.data.url });
                    };
                }
            });
        });
    };



    const handdlerSubmit = useCallback(async callback => {
        try {
            awaitWindow.open('Enviando novedad...');
            if (keySubmit) {
                setKeySubmit(false);

                let text = '';
                if (btnSubmitRef.current.disabled) return;
                btnSubmitRef.current.disabled = true;

                if (!noveltyState.typeDish) throw new Error('El tipo de plato no esta selecionado');
                if (!noveltyState.numberTiket) throw new Error('El número de tiket no esta espesificado');
                if (!noveltyState.numberTable) throw new Error('El número de mesa no esta especificado');
                if (!noveltyState.eventHours.tomaOrden) throw new Error('El tiempo de toma de orden esta vacio');
                if (!noveltyState.eventHours.listoCocina) throw new Error('El tiempo de listo en cocina esta vacio');
                if (!noveltyState.eventHours.listoTablet) throw new Error('El tiempo de listo en tablet esta vacio');
                if (!noveltyState.eventHours.entregaPlato) throw new Error('El tiempo de entrega de plato esta vacio');
                if (!fileState) throw new Error('Debe selecionar una imagen');


                const caption = [
                    local.lang === 'es' ? `${local.name} - mesa: ${noveltyState.numberTable}` : `${local.name} - table ${noveltyState.numberTable}`,
                    local.lang === 'es' ? `${local.name} - mesa:${noveltyState.numberTable}` : `${local.name} - table ${noveltyState.numberTable}`
                ];

                if (local.lang === 'es') {
                    text = `*${local.name}*\n_*Demora en preparación de ${selectDishRef.current.nameDishe}*_\nMesa: ${noveltyState.numberTable}\nToma de orden: ${noveltyState.eventHours.tomaOrden}\nListo en tablet: ${noveltyState.eventHours.listoTablet}\nListo en ${selectDishRef.current?.category === 'drinks' ? 'barra' : 'cocina'}: ${noveltyState.eventHours.listoCocina}\nEntrega de ${selectDishRef.current.nameDishe}: ${noveltyState.eventHours.entregaPlato}\n*Demora en preparación: ${returnTimeExceding(noveltyState.eventHours.listoTablet, noveltyState.eventHours.tomaOrden)}*\nTiempo total: ${returnTimeExceding(noveltyState.eventHours.entregaPlato, noveltyState.eventHours.tomaOrden)}${correspondingTimesState ? '\nNota: La orden estuvo dentro de los tiempos correspondientes, sin embargo no fue marcada en pantalla al momento, por tal motivo siguió corriendo el tiempo y se registra la demora en nuestro sistema, quedamos atentos a sus comentarios.' : ''}`;
                }
                else {
                    if (local.name === 'Mister Boca Ratón') {

                        //text = `*${local.name}*\n_*${noveltyState.typeDish} preparation delay*_\nTicket: #${noveltyState.numberTiket}\nTable: ${noveltyState.numberTable}\nOrder take: ${noveltyState.eventHours.tomaOrden}\nReady in tablet: ${noveltyState.eventHours.listoTablet}\nReady in kitchen: ${noveltyState.eventHours.entregaPLato}\n${noveltyState.typeDish} delivery: ${noveltyState.eventHours.entregaPLato}\nDelay in preparation: ${returnTimeExceding(returnTimeExceding(noveltyState.eventHours.listoTablet, noveltyState.eventHours.entregaPLato), key.timeExceeding)}\nTotal time: ${returnTimeExceding(noveltyState.eventHours.entregaPLato, noveltyState.eventHours.tomaOrden)}${noveltyState.description && noveltyState.description !== '' ? `\nNote: ${noveltyState.description.toLowerCase()}` : ''}`;
                    }
                    else {
                        //text = `*${local.name}*\n_*${noveltyState.typeDish} preparation delay*_\nTicket: #${noveltyState.numberTiket}\nTable: ${noveltyState.numberTable}\nOrden Take: ${noveltyState.eventHours.tomaOrden}\nReady in kitchen: ${noveltyState.eventHours.listoCocina}\nReady in tablet: ${noveltyState.eventHours.listoTablet}\n${noveltyState.typeDish} delivery: ${noveltyState.eventHours.entregaPLato}\nExceeding time at preparation: ${ returnTimeExceding(returnTimeExceding(noveltyState.eventHours.listoCocina ,noveltyState.eventHours.), key.timeExceeding) }${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
                    }

                    throw new Error('Novedad en ingles aun no esta displonible');
                }

                let dataForRequest = {};
                console.log(fileState);
                dataForRequest.imageToShare = fileState.url;
                dataForRequest.imageUrl = [{ url: fileState.url, caption: local.lang === 'es' ? 'Listo en tablet' : 'Ready in Toast pos' }]


                dataForRequest.title = `Demora de ${selectDishRef.current.nameDishe}`;
                dataForRequest.table = noveltyState.numberTable;
                dataForRequest.nameDish = selectDishRef.current.nameDishe
                dataForRequest.userName = `${user.name} ${user.surName}`;
                dataForRequest.userId = user._id;
                dataForRequest.localName = local.name;
                dataForRequest.localId = local._id;
                dataForRequest.description = `Demora en preparación de ${noveltyState.typeDish}, tiempo total: ${returnTimeExceding(noveltyState.eventHours.entregaPlato, noveltyState.eventHours.tomaOrden)}`;
                dataForRequest.menu = text;
                dataForRequest.rulesForBonus = JSON.stringify(title.rulesForBonus);
                dataForRequest.alertId = title._id;
                dataForRequest.numberTiket = noveltyState.numberTiket;
                dataForRequest.timePeriod = {
                    ...noveltyState.eventHours
                };

                callback(dataForRequest, null);
            }
        }
        catch (error) {
            console.log(error)
            if (error.message) {
                boxModal.open({ title: 'Error', description: error.message });
            }
            callback(null, error);
        }
        finally {
            awaitWindow.close();
            btnSubmitRef.current.disabled = false;
        }
    }, [noveltyState, correspondingTimesState, fileState, keySubmit]);



    const requestNovelty = () => {
        handdlerSubmit(async (body, err) => {
            try {
                if (err) throw err;
                const response = await axiosInstance.post(`${IP}/novelties`, body);
                alert.request(`demora de tablet en ${local.name}. por validar`);
                boxModal.open({ title: 'Aviso', description: 'Novedad enviada' });
                reset('');
            }
            catch (error) {
                console.log(error);
            }
            finally{
                setKeySubmit(true);
            }
        });
    };



    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '1rem',
                gap: '1rem'
            }}
        >
            {
                fileState ?
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            requestNovelty();
                        }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1rem',
                            width: '100%'
                        }}
                    >
                        <div
                            style={{
                                position: 'relative',
                                width: '100%',
                                minHeight: '60px',
                                border: '2px solid rgb(205, 5, 231)',
                                padding: '1rem',
                                borderRadius: '5px',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '1rem'
                            }}
                        >
                            <img
                                style={{
                                    width: '100%',
                                    height: '100%'
                                }}
                                src={fileState.dataUrl}

                            />
                            <button
                                onClick={() => {
                                    setStateFile(null);
                                }}
                                style={{
                                    position: 'absolute',
                                    top: '15px',
                                    right: '15px',
                                    color: '#000'
                                }}
                            >
                                <img style={{ width: '100%', height: '100%' }} src="/ico/delete/delete.svg" alt="" />
                            </button>
                        </div>
                        <div
                            className='__width-complete'
                            style={{ display: 'flex', gap: '.5rem' }}
                        >
                            <InputBorderBlue
                                textLabel='Número de mesa'
                                important={true}
                                type='text'
                                eventChengue={text => {
                                    setNoveltyState({ ...noveltyState, numberTable: text });
                                }}
                            />
                            <InputBorderBlue
                                textLabel='Tipo de plato'
                                important={true}
                                type='select'
                                eventChengue={text => {
                                    setNoveltyState({ ...noveltyState, typeDish: text });
                                    if (local.dishes.length > 0) {
                                        const dishSleted = local.dishes.filter(item => item._id === text);
                                        selectDishRef.current = dishSleted[0];
                                    }
                                }}
                                childSelect={
                                    Array.isArray(local.dishes) && local.dishes.length > 0 ?
                                        local.dishes.map(dish => { return { value: dish._id, text: dish.nameDishe } })
                                        :
                                        [
                                            { value: local.dishMenu.appetizer, text: local.dishMenu.appetizer },
                                            { value: local.dishMenu.dessert, text: local.dishMenu.dessert },
                                            { value: local.dishMenu.mainDish, text: local.dishMenu.mainDish }
                                        ]
                                }
                            />
                        </div>
                        <div
                            className='__width-complete'
                            style={{ display: 'flex', gap: '.5rem' }}
                        >
                            <InputBorderBlue
                                textLabel='Número de Tiket'
                                important={true}
                                type='text'
                                eventChengue={text => {
                                    setNoveltyState({ ...noveltyState, numberTiket: text });
                                }}
                            />

                        </div>
                        <div
                            style={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '.5rem'
                            }}
                        >
                            <InputHour title='Toma de orden' result={time => {
                                setNoveltyState({
                                    ...noveltyState, eventHours: {
                                        ...noveltyState.eventHours,
                                        tomaOrden: time
                                    }
                                })
                            }} />

                            <InputHour title='Listo en cocina' result={time => {
                                console.log(time);
                                if (noveltyState.eventHours.tomaOrden && isTimeGreaterThanOther(noveltyState.eventHours.tomaOrden, time)) {
                                    boxModal.open({ title: 'Error en tiempo', description: 'El tiempo de toma de orden, no puede ser mayor a listo en cocina' });
                                }

                                setNoveltyState({
                                    ...noveltyState, eventHours: {
                                        ...noveltyState.eventHours,
                                        listoCocina: time
                                    }
                                })
                            }} />
                            <InputHour title='Listo en tablet' result={time => {

                                if (noveltyState.eventHours.tomaOrden && isTimeGreaterThanOther(noveltyState.eventHours.tomaOrden, time)) {
                                    boxModal.open({ title: 'Error en tiempo', description: 'El tiempo de toma de orden, no puede ser mayor a listo en tablet' });
                                }

                                setNoveltyState({
                                    ...noveltyState, eventHours: {
                                        ...noveltyState.eventHours,
                                        listoTablet: time
                                    }
                                })
                            }} />
                            <InputHour title='Entrega de plato' result={time => {

                                if (noveltyState.eventHours.tomaOrden && isTimeGreaterThanOther(noveltyState.eventHours.tomaOrden, time)) {
                                    boxModal.open({ title: 'Error en tiempo', description: 'El tiempo de toma de orden, no puede ser mayor a la entrega de plato' });
                                }

                                setNoveltyState({
                                    ...noveltyState, eventHours: {
                                        ...noveltyState.eventHours,
                                        entregaPlato: time
                                    }
                                })
                            }} />
                        </div>
                        <div
                            style={{
                                width: '100%',
                                fontSize: '1.1rem',
                                color: 'red'
                            }}
                        >
                            {
                                typeof noveltyState.eventHours?.tomaOrden === 'string' && typeof noveltyState.eventHours?.listoCocina === 'string' ?
                                    <p>Tiempo en preparación con listo en cocina: {returnTimeExceding(noveltyState.eventHours.listoCocina, noveltyState.eventHours.tomaOrden)}</p>
                                    :
                                    null
                            }
                            {
                                typeof noveltyState.eventHours?.tomaOrden === 'string' && typeof noveltyState.eventHours?.listoTablet === 'string' ?
                                    <p>Tiempo en preparación con tablet: {returnTimeExceding(noveltyState.eventHours.listoTablet, noveltyState.eventHours.tomaOrden)}</p>
                                    :
                                    null
                            }
                            {
                                typeof noveltyState.eventHours?.tomaOrden === 'string' && typeof noveltyState.eventHours?.entregaPlato === 'string' ?
                                    <p>Tiempo total: {returnTimeExceding(noveltyState.eventHours.entregaPlato, noveltyState.eventHours.tomaOrden)}</p>
                                    :
                                    null
                            }
                        </div>

                        <label htmlFor="" className='box-label' style={{ color: '#000' }}>¿estuvo dentro de los tiempos correspondientes?
                            <input className='box-inputText' type="checkbox" value={correspondingTimesState}
                                onChange={e => setCorrespondingTimesState(e.target.checked)}
                            />
                        </label>


                        {
                            correspondingTimesState ?
                                <h1 style={{ color: '#000' }}>Si</h1>
                                :
                                <h1 style={{ color: '#000' }}>No</h1>
                        }
                        <button
                            ref={btnSubmitRef}

                            style={{
                                width: '300px',
                                height: '50px',
                                fontSize: '1.1rem',
                                color: '#000',
                                backgroundColor: 'transparent',
                                border: '2px solid #800c71',
                                margin: '2rem 0'
                            }}
                        >Enviar</button>
                    </form>
                    :
                    <div
                        style={{
                            position: 'relative',
                            width: '300px',
                            height: '60px',
                            border: '2px solid #cd05e7',
                            borderRadius: '5px',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '1rem'
                        }}
                    >
                        <label htmlFor="fileInput" style={{ ...{ color: '#000' }, ...styleNeverPointer }}>Selecionar una imagen</label>

                        <img style={styleNeverPointer} src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADL0lEQVR4nO2ZQWxMURSGHxVRNGlTtagiqVIrsRNSykJ3FsReGqwIq6YsLGhSxLqRiJWNBEUECRYVbJCU2KhESCWDhFY1tJGGT87M/+SazHTm9b2Z98r8ySTv3HvPved/555z7zvjeRVUUMH/BWANcBUYJ/n4ClwBWnKRGGX2YeQvMkC/Om4Cy7yEA2gCbsnmy26HucrQ5M0SAMtl85jbmIY3y0C23RUi/6pHgDqgE7gODAHf9LPna+qrC7tOyYgA1cBRC7wiUuYX4AiwIFFEgEbgqWPoHWAf0Aos0m+t2u46456YbiKIkCHxTuq2fdqK0NmssUi3MVYiZLaT74kBoFbtS4Ee4JkTI4PACaBBY2qB+9J9PNNtRkRELCYMLx0Suwvc1ezg3eUkhldq746FCBkj/MBuc0j8UptlqHYnRrYqkxl+AjulY2P8BBA4m0VBpNMPbGc7+Z7omkavW2PsJSxR2z217YmDiL1xw17JPb4nJM8HTgPvgRRw0trUd0Njj0veL7k/DiL+3m6V/Fxyu+RTOeKjV33bJA9KttRsGIqDiL+NarLkxZLNC4aNwCY9p9RXI3k8l1xuIpNSSadN4CHwIN98OeQ/45XGDRNxEBkSmepiFphufp0plslex0FkJbCu2AUKzQ9sB9YXzSAqIkEXiHp+HxUiYT0CvAA+AgdLsY5Xrq2VhT7gbRhixEjEPVfyEUu5N4FEEglIrDeJRLIPzEfWVoBYqqxE7EoOnAfOAM0zmU8fWQNB7YmMCHAsazvY12BHWA8TgkjgkqnuSD+AKeAwcEFzTJaDCLAiV8nUSvSoMNwU4JpiGAbmAnOUeSg1ETJ139sadsntWK0SfTFIB6kMf6O2PskumamIk0UufAJWZSu3yDP+NssHN/tscbaSS6YLOFBCImPAxbB1sVw31wktcM6IRDBnGtFYGGzhjmzPhJirQfOMRmtlmcmQKSvhnitxkzkLVAXUr1JNmDAxVgoyVtCuL1JvnmIMZcOFpbe2sFF2X/ogo0aUxZrzjK23MqpqwIbvwAYvKbB/h+WRIBi2i6OXRAA79L+I1Xdz4bOdTcChfFWZCirw4sNviiYNppSbEGsAAAAASUVORK5CYII=' alt="Upload Icon" />
                        <input
                            onChange={onchangeInputFile}
                            ref={inputFileRef}
                            type="file"
                            id="fileInput"
                            style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                filter: 'opacity(0)',
                                color: '#000'
                            }}
                        />
                    </div>
            }
        </div >
    );
}