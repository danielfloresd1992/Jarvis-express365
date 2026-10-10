import { useState, useRef, useEffect } from 'react';
import { temaCon } from '../pintura/temas.js';
import { abrirCanal, responder } from '../canal.js';
import { esNumero, conComa, plural } from '../formato.js';


/*  EL CABLE CON LA VENTANA DE LA TABLET
 *
 *  Son dos ventanas distintas —como la tablet de verdad es otro aparato— y se hablan por el canal de
 *  canal.js. Este simulador sirve la PANTALLA y la HORA, que es lo que da una tablet:
 *
 *      'hola'        quién es: el nombre de la estación y el tamaño de la captura
 *      'hora'        la hora del reloj de la tablet simulada
 *      'captura'     la pantalla, como PNG
 *
 *  Y nada más que eso: leer, lee siempre el servidor de IA, desde la ventana de la tablet. Lo que ella
 *  infiere vuelve aquí ('inferencia') solo para ponerlo junto a la verdad.
 */



// ALIVE_MS = «cuánto hace, como mucho, de la última captura para dar la ventana de la tablet por conectada»
const ALIVE_MS = 4000;



// useTabletLink = «el cable con la ventana de la tablet»
// Recibe: { engine        el motor (useEngine): da la hora
//           settingsRef   los ajustes de ahora (la ref de useSettings): dicen el tamaño de la pantalla
//           paint         pinta la pantalla (useScreen): se llama justo antes de fotografiarla
//           canvasRef }   el lienzo que se fotografía
// Devuelve: { inference, alive, captures }
//   inference   lo último que infirió la ventana de la tablet, o null
//   alive       la ventana de la tablet está pidiendo capturas ahora mismo
//   captures    cuántas capturas lleva pedidas
function useTabletLink({ engine, settingsRef, paint, canvasRef }) {

    const [inference, setInference] = useState(null);

    //  Las capturas NO van en el estado: la ventana de la tablet pide varias por segundo, y redibujar
    //  el simulador entero —tabla del registro incluida— con cada una era tirar trabajo. Si está
    //  conectada o no, lo cuenta el latido (useScreen).
    const capturesRef = useRef({ count: 0, last: 0 });


    useEffect(() => {
        const channel = abrirCanal();

        channel.onmessage = async (event) => {
            const message = event.data;
            if (!message?.t) return;

            const currentSettings = settingsRef.current;

            if (message.t === 'hola') {
                const theme = temaCon(currentSettings.tema, { idioma: currentSettings.idioma, alto: currentSettings.alto, estacion: currentSettings.estacion });
                responder(channel, message.id, { nombre: theme.estacion, ancho: theme.ancho * currentSettings.escala, alto: theme.alto * currentSettings.escala });
            }

            if (message.t === 'hora') {
                engine.avanzar(Date.now());
                responder(channel, message.id, { hora: engine.reloj() });
            }

            if (message.t === 'captura') {
                //  Se repinta JUSTO antes de fotografiar: esta ventana suele estar tapada por Jarvis, y
                //  tapada el navegador le frena los temporizadores. La captura no puede depender de
                //  cuándo tocó repintar por última vez.
                paint();

                const canvas = canvasRef.current;
                const blob = canvas && await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                if (!blob) return responder(channel, message.id, { error: 'El simulador no pudo pintar la pantalla' });

                responder(channel, message.id, { png: await blob.arrayBuffer(), hora: engine.reloj() });
                capturesRef.current = { count: capturesRef.current.count + 1, last: Date.now() };
            }

            if (message.t === 'inferencia') setInference({ ...message, recibidaEn: Date.now() });
        };

        return () => channel.close();
    }, [engine, paint]);


    return {
        inference,
        alive: Date.now() - capturesRef.current.last < ALIVE_MS,
        captures: capturesRef.current.count,
    };
}



// shortSeconds = «unos segundos, escritos cortos»: '2,4 s' por debajo de diez, '43 s' por encima
const shortSeconds = (seconds) => (seconds < 10 ? `${conComa(Math.round(seconds * 10) / 10)} s` : `${Math.round(seconds)} s`);



/*  describeLastReading = «describir la última lectura de la IA»
 *
 *  La frase de la cabecera: cómo acabó la ÚLTIMA lectura de la ventana de la tablet.
 *
 *  Este simulador solo pinta. La pantalla la lee siempre el servidor de IA —el de Opciones → Servidor
 *  de IA—, igual que con la tablet del restaurante, y aquí no se decide ni se contesta nada. Pero desde
 *  fuera «no sale nada en el register» puede ser que la lectura no ha vuelto todavía, que volvió con
 *  error o que el modelo no vio ningún ticket, y con la IA a tres cuartos de minuto por lectura
 *  conviene tenerlo a la vista.
 *
 *  El dato llega con cada inferencia que publica la ventana de la tablet: es el mismo diagnóstico que
 *  enseña su barra de abajo ('leidos', 'descartados', 'segundos', 'error'). No se cuenta nada aquí,
 *  solo se repite lo último que dijo.
 *
 *  Recibe: inference (lo último que llegó, o null) y alive (la ventana de la tablet está conectada).
 *  Devuelve: { texto, fallo, titulo }
 */
function describeLastReading(inference, alive) {
    const reading = inference?.lectura ?? null;

    if (!reading) {
        return {
            texto: alive ? 'Lee la IA de verdad · todavía no ha vuelto ninguna lectura' : 'Lee la IA de verdad',
            fallo: '',
            titulo: 'La pantalla entera viaja al servidor de IA, como con la tablet de verdad. La primera lectura puede tardar cerca de un minuto en volver.',
        };
    }

    if (reading.error) {
        return {
            texto: 'Lee la IA de verdad · última lectura',
            fallo: String(reading.error),
            titulo: 'La última lectura no llegó a hacerse. El motivo entero, al pasar el ratón por él.',
        };
    }

    const parts = ['Lee la IA de verdad'];

    if (esNumero(reading.segundos)) parts.push(shortSeconds(reading.segundos));
    if (esNumero(reading.leidos)) parts.push(plural(reading.leidos, 'ticket leído', 'tickets leídos'));
    if (reading.descartados > 0) parts.push(plural(reading.descartados, 'descartado', 'descartados'));

    return {
        texto: parts.join(' · '),
        fallo: '',
        titulo: `La última lectura que volvió del servidor de IA: cuánto tardó y cuántos tickets trajo.${reading.modelo ? ` Modelo: ${reading.modelo} (el que tiene el servidor; no está escrito en ningún sitio).` : ''}`,
    };
}



export { useTabletLink, describeLastReading };
