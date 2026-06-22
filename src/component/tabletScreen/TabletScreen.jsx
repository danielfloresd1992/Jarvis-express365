import { useState, useRef, useEffect } from 'react';
import { Adb, AdbDaemonTransport } from '@yume-chan/adb';
import { AdbDaemonWebUsbDeviceManager } from '@yume-chan/adb-daemon-webusb';
import AdbWebCredentialStore from '@yume-chan/adb-credential-web';
import axios from 'axios';



export function TabletScreen({ refreshMs = 1000 }) {


    //  ESTADO DE CONEXIÓN
    const [connected, setConnected] = useState(false);
    const [statusText, setStatusText] = useState('Sin conectar');
    const [imgUrl, setImgUrl] = useState(null);

    const [responseRerenceState, setResponseRerenceState] = useState([]);
    const [inferenceTime, setInferenceTime] = useState(null);   // segundos que tardó la última inferencia

    //  REFS (cosas que NO disparan render: la conexión, el timer y la url anterior)
    const adbRef = useRef(null);
    const intervalRef = useRef(null);
    const lastUrlRef = useRef(null);


    const prompt = 'respondeme solo con lista de objetos de cada ticket que vez en la imagen , con las siguientes propiedades, tiket: es un digito que empueza con #, table: este seria el número de la mesa pero en algunas opcaciones no tiene mesa si no el nombre del mesero, # tiempo: que es el que lleva preparandose en el formato HH:MM:SS la cual seria 00:12:14, dish que sea un array con los nombre del plato en nameDish, en el caso de no haber nada en la imagen devuelve en arreglo vacio'
    const token = 'sk-lm-L5PlZvDm:8ovTMhDIQ6pzM70Kr2Vl'

    //  CONECTAR CON LA TABLET (debe ejecutarse dentro de un click del usuario)
    const handdlerConnect = async () => {
        try {
            setStatusText('Solicitando dispositivo...');

            const manager = AdbDaemonWebUsbDeviceManager.BROWSER;
            if (!manager) return setStatusText('Este navegador no soporta WebUSB (usa Chrome/Edge)');

            const device = await manager.requestDevice();
            if (!device) return setStatusText('No se seleccionó ningún dispositivo');

            const connection = await device.connect();

            setStatusText('Autorizando... acepta el aviso en la tablet');

            const transport = await AdbDaemonTransport.authenticate({
                serial: device.serial,
                connection,
                credentialStore: new AdbWebCredentialStore(),
            });

            adbRef.current = new Adb(transport);

            setConnected(true);
            setStatusText('Conectado');
        }
        catch (error) {
            console.log(error);
            setStatusText('Error: ' + error.message);
        }
    };




    //  DESCONECTAR
    const handdlerDisconnect = async () => {
        try {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (adbRef.current) await adbRef.current.close();
        }
        catch (error) { console.log(error); }
        finally {
            adbRef.current = null;
            setConnected(false);
            setImgUrl(null);
            setStatusText('Sin conectar');
        }
    };




    //  CAPTURAR LA PANTALLA ('screencap -p' devuelve un PNG por la salida del proceso)
    const capturarPantalla = async () => {
        try {
            if (!adbRef.current) return;

            const png = await adbRef.current.subprocess.noneProtocol.spawnWait(['screencap', '-p']);
            const blob = new Blob([png], { type: 'image/png' });
            const url = URL.createObjectURL(blob);


            if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);   // libera la imagen anterior
            lastUrlRef.current = url;

            setImgUrl(url);

            //  base64 (data URL) a partir del blob, para enviarlo a la IA
            const base64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });

            sendImg(base64);
        }
        catch (error) {
            console.log(error);
        }
    };





    const sendImg = async (img) => {
        try {
            const body = {
                model: "google/gemma-4-12b-qat",
                input: [
                    {
                        type: "text",
                        content: prompt
                    },
                    {
                        type: "image",
                        data_url: img
                    }
                ],
                reasoning: "off",
                context_length: 8000,
                temperature: 0
            }


            const header = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
            const start = performance.now();
            const response = await axios.post('http://72.68.60.171:1234/api/v1/chat', body, header);
            setInferenceTime(((performance.now() - start) / 1000).toFixed(1));   // tiempo real de respuesta
         
            const content = response?.data?.output?.[0]?.content ?? '';
            console.log(content )
            const tickets = parseTickets(content);
            if(tickets.length > 0)setResponseRerenceState([...responseRerenceState,tickets]);
        }
        catch (error) {
            console.log(error);
        }
    }





    //  REFRESCO AUTOMÁTICO MIENTRAS ESTÉ CONECTADO
    useEffect(() => {
        if (!connected) return;

        capturarPantalla();                                       // primera captura inmediata
        intervalRef.current = setInterval(capturarPantalla, refreshMs);

        return () => clearInterval(intervalRef.current);
    }, [connected, refreshMs]);




    //  LIMPIEZA AL DESMONTAR EL COMPONENTE
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
            if (adbRef.current) adbRef.current.close();
        };
    }, []);




    //  DATOS ANALÍTICOS derivados de los tickets
    console.log(responseRerenceState);




    return (
        <div className='absolute bottom-[60px] left-[20px] z-[1000] resize overflow-auto w-[340px] h-[560px] min-w-[240px] min-h-[320px] rounded-xl border border-[#0a3a66] bg-[#01122c] shadow-[0_0_40px_rgba(0,120,255,0.15)]'>


            {/*  BARRA SUPERIOR (estado + botón)  */}
            <div className='sticky top-0 z-10 flex items-center justify-between gap-2 px-3 py-2 bg-[#021a38] border-b border-[#0a3a66]'>

                <span className='text-[11px] font-bold uppercase tracking-[0.6px] text-[#5e7ba0] truncate'>
                    {statusText}
                </span>

                {
                    !connected ?
                        <button className='px-2.5 py-1 rounded-md text-[11px] font-bold text-white bg-[#066ca8] hover:bg-[#0890c0]' onClick={handdlerConnect}>
                            Conectar
                        </button>
                        :
                        <button className='px-2.5 py-1 rounded-md text-[11px] font-bold text-white bg-[#7a1f2b] hover:bg-[#9a2533]' onClick={handdlerDisconnect}>
                            Desconectar
                        </button>
                }

            </div>


            {/*  IMAGEN DE LA TABLET  */}
            <div className='w-full h-[32%] flex items-center justify-center border-b border-[#0a3a66] bg-black/20'>
                {
                    imgUrl ?
                        <img className='w-full h-full object-contain' src={imgUrl} alt='pantalla tablet' draggable={false} />
                        :
                        <p className='text-[12px] text-[#33486a] px-4 text-center'>Conecta la tablet para ver su pantalla</p>
                }
            </div>


            {/*  PANEL ANALÍTICO DE TICKETS  */}
            <div className='w-full h-[calc(68%-44px)] flex flex-col'>


            </div>


        </div>
    );
}




//  Convierte un tiempo "mm:ss" / "h:mm:ss" / "0.24" a segundos (para ordenar)
function toSeconds(t) {
    if (!t) return 0;
    const clean = String(t).replace('#', '').replace('.', ':').trim();
    const parts = clean.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return Number(clean) || 0;
}




//  Extrae el array de tickets del texto markdown que devuelve el modelo
function parseTickets(content) {
    try {
        const match = content.match(/```json\s*([\s\S]*?)```/);
        const raw = match ? match[1] : content.slice(content.indexOf('['), content.lastIndexOf(']') + 1);
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    }
    catch (error) {
        console.log('No se pudo parsear la respuesta:', error);
        return [];
    }
}