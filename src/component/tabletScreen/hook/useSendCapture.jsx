import { useState, useRef, useEffect } from 'react';
import { enviarImagenToastPos } from '../../../libs/fetch_data/noveltyFecth.js';
import { readEstablishment } from './useEstablishment.jsx';


/*  ENVIAR LA CAPTURA A LA BANDEJA DE JARVIS
 *
 *  Manda el fotograma que se está viendo al MISMO sitio donde caen las imágenes que suben las
 *  tabletas: la bandeja del Toast POS del local. Es el endpoint que ya usaba el formulario «Subir
 *  imagen a mi Jarvis».
 *
 *  Al terminar, jarvis_api emite 'fileLoader' por el socket y la bandeja aparece sola en la ventana
 *  principal. Desde aquí no hay que avisar a nadie — y no se podría, porque cada ventana de
 *  Electron tiene su propio contexto y no se hablan directamente.
 *
 *  Quién la envía NO viaja en la petición: el servidor lo saca de la sesión.
 */


// SENDING = «hay una petición en curso»
const SENDING = 'sending';



// useSendCapture = «el envío de la captura»
// Recibe: { simulated    lo conectado es una tablet de mentira
//           captureRef }  la última captura del espejo (la ref de useTablet)
// Devuelve: { sending, result, send }
//   sending  hay una petición en curso: el botón se bloquea
//   result   cómo acabó el último envío, { ok, text }, o null. Se borra solo a los pocos segundos
//   send     enviar la captura que se está viendo
function useSendCapture({ simulated, captureRef }) {

    // state = «en qué está el envío». Tiene tres valores y cada uno dice algo distinto:
    //   null          en reposo, el botón invita a pulsar
    //   SENDING       hay una petición en curso
    //   { ok, text }  el resultado
    const [state, setState] = useState(null);

    // noticeTimerRef = «el temporizador que retira el aviso»
    const noticeTimerRef = useRef(null);

    //  Si la ventana se cierra con un aviso pendiente, el temporizador seguiría vivo e intentaría
    //  escribir en un componente que ya no existe.
    useEffect(() => () => clearTimeout(noticeTimerRef.current), []);


    // showNotice = «enseñar el resultado»
    const showNotice = (ok, text) => {
        setState({ ok, text });
        clearTimeout(noticeTimerRef.current);

        //  El acierto se va solo; el error se queda más rato, porque hay algo que leer y
        //  probablemente que hacer.
        noticeTimerRef.current = setTimeout(() => setState(null), ok ? 3000 : 6000);
    };


    const send = async () => {
        //  Doble clic o pulsación mantenida: sin esto se subirían dos imágenes iguales y quedarían
        //  las dos en la bandeja.
        if (state === SENDING) return;

        //  EN SIMULACIÓN NO SE ENVÍA NADA A JARVIS. La captura sería la de una tablet de mentira, y
        //  acabaría en la bandeja REAL del local, a la vista de todos los que lo monitorean, como si
        //  fuera de su cocina.
        if (simulated) {
            return showNotice(false, 'En simulación no se envía nada a Jarvis');
        }

        //  Se lee en el momento del clic, no del estado: es a ESE local al que se manda.
        const establishment = readEstablishment();
        if (!establishment?._id) {
            return showNotice(false, 'Elige primero un local en la ventana de Jarvis');
        }

        //  Es exactamente el fotograma que se está mirando: lo que la persona cree estar mandando.
        const blob = captureRef.current?.blob;
        if (!blob) {
            return showNotice(false, 'Todavía no hay ninguna captura que enviar');
        }

        setState(SENDING);

        try {
            const response = await enviarImagenToastPos(establishment._id, blob);

            //  Se comprueba el código de verdad y no solo que la promesa no reventara: axios da por
            //  buena cualquier respuesta 2xx-3xx, y un 302 a la pantalla de inicio de sesión llegaría
            //  hasta aquí como si todo hubiera ido bien.
            if (response?.status === 200 || response?.status === 201) {
                showNotice(true, `Enviado a ${establishment.name}`);
            }
            else {
                showNotice(false, `Respuesta inesperada del servidor (${response?.status ?? '?'})`);
            }
        }
        catch (error) {
            //  'instanceAxios' ya cambió el mensaje de axios por el que manda jarvis_api, así que
            //  esto suele ser una frase legible y no un "Request failed with status code 409".
            console.log(error);
            showNotice(false, error?.message ?? 'No se pudo enviar la captura');
        }
    };


    return {
        sending: state === SENDING,
        result: state !== null && state !== SENDING ? state : null,
        send,
    };
}



export { useSendCapture };
