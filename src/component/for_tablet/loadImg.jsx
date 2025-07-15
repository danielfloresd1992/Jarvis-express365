import { useState, useRef, useEffect } from 'react';
import Compressor from 'compressorjs';
import axiosInstance from '../../libs/fetch_data/instanceAxios';
import IP from '../../libs/fetch_data/dataFetch';



export default function LoadFileForm({ awaitWindow, boxModal, reset }) {



    const [fileState, setStateFile] = useState(null);
    const styleNeverPointer = { pointerEvents: 'none', filter: 'brightness(0)' };
    const inputFileRef = useRef(null);
    const btnSubmitRef = useRef(null);
    const [local, setLocal] = useState(null);
    const [user, setUser] = useState(null);



    useEffect(() => {
        setLocal(state => state = JSON.parse(localStorage.getItem('local_appExpress'))[0]);
        setUser(state => state = JSON.parse(sessionStorage.getItem('session')));

        return () => {

        }
    }, []);


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
                cuality: .7,
                maxWidth: 500,
                maxHeight: 400,
                success: (compressedResult) => {
                    const fileReader = new FileReader();
                    fileReader.readAsDataURL(compressedResult);
                    fileReader.onload = e => {

                        resolve({ file: compressedResult, dataUrl: e.target.result })
                    };
                }
            });
        });
    };



    const handlerSubmit = async e => {
        try {
            e.preventDefault();
            awaitWindow.open('Enviando novedad...');
            if (!fileState) throw new Error('Debes selecionar una imagen');

            const formData = new FormData();
            formData.append('img', fileState.file);

            const response = await axiosInstance.post(`${IP}/noventy/imageToasdPos?id=${local._id}`, formData);
            console.log(response);
            reset('');
        }
        catch (error) {
            console.log(error);
        }
        finally {
            awaitWindow.close();
        }
    }




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
                    <>
                        <form
                            onSubmit={handlerSubmit}
                            style={{
                                height: '100%',
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1rem'
                            }}
                        >
                            <div
                                style={{
                                    position: 'relative',
                                    width: '50%',
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
                    </>
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

        </div>
    );
}