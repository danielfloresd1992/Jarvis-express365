import { useEffect, useRef, useState } from 'react';
import { readScreenCards } from '../../../libs/tracking/screenCards.js';
import { createTracker, advance, describe } from '../../../libs/tracking/cardTracker.js';
import { registroDeInferencia, TIPO } from '../../../libs/tickets/registroDeInferencia.js';


/*  EL SEGUIMIENTO DE LAS TARJETAS POR PÍXELES (pedido del usuario: precisión en los procesos de Mesas)
 *
 *  Cada captura del espejo (useTablet, dos por segundo) pasa por readScreenCards, que dice qué tarjetas hay y cómo
 *  van, y por el rastreador (cardTracker), que les da identidad de captura en captura y apunta en el registro de la
 *  inferencia cuándo aparece cada una, cuándo la cocina la termina, cuándo se despacha y cuándo se va. Todo con la
 *  hora de la captura, al segundo, sin pasar por el modelo.
 *
 *  Además le dice a la lectura por IA (useTicketReading) qué capturas NO mandar: las que cayeron a mitad de una
 *  animación de Toast (tarjetas deslizándose, superpuestas y cortadas), que son las que el modelo lee mal.
 *
 *  No toca el seguimiento de pedidos (useProcessTracking) todavía: primero se mira en el registro lo que ve, y
 *  cuando cuadre con la pantalla se le dará la palabra para «listo en tablet» y la toma de orden.
 *
 *  Con la tablet simulada no encuentra tarjetas (otra rejilla) y no dice nada: no estorba.
 *
 *  @param {object} tablet  lo que devuelve useTablet (usa connected, frames y captureRef)
 *  @returns {{ isMidAnimation, screenOf, trackerRef, events }}
 *      isMidAnimation(captura)  esa captura cayó a mitad de una animación: no mandarla al modelo
 *      screenOf(captura)        lo que se vio en esa captura ({ cards, offGrid }), o null si no se analizó
 *      trackerRef               el estado del rastreador (para quien quiera mirar las tarjetas seguidas)
 *      events                   los últimos sucesos, para pintarlos
 */
function useCardTracking({ tablet }) {

    // trackerRef = «el seguimiento», que dura lo que la conexión
    const trackerRef = useRef(createTracker());

    // lastRef = «la última captura analizada y lo que se vio en ella»: { capture, screen }
    const lastRef = useRef(null);

    // busyRef = «hay un análisis en marcha»: las capturas llegan cada medio segundo y una se analiza en unos ms,
    // pero por si acaso no se solapan
    const busyRef = useRef(false);

    const [events, setEvents] = useState([]);

    useEffect(() => {
        if (!tablet.connected) {
            trackerRef.current = createTracker();
            lastRef.current = null;
            return undefined;
        }

        const analyze = async () => {
            const capture = tablet.captureRef.current;
            if (!capture || busyRef.current || lastRef.current?.capture === capture) return;
            busyRef.current = true;
            try {
                const screen = readScreenCards(await decode(capture.blob));
                lastRef.current = { capture, screen };

                const result = advance(trackerRef.current, screen, capture.time || '');
                trackerRef.current = result.tracker;

                for (const event of result.events) {
                    registroDeInferencia.apuntar(TIPO.SEGUIMIENTO, describe(event), {
                        tarjeta: event.id, columna: event.card.column, arriba: event.card.top, alto: event.card.height,
                        marco: event.card.border, cabecera: event.card.header, palomitas: event.card.checks,
                    });
                }
                if (result.events.length) setEvents(list => [...list, ...result.events].slice(-50));
            }
            catch (error) {
                //  El seguimiento es un extra: si falla, la lectura de siempre sigue
                console.log('[seguimiento] no se pudo analizar la captura:', error);
            }
            finally {
                busyRef.current = false;
            }
        };

        return tablet.frames.subscribe(analyze);
    }, [tablet.connected, tablet.frames, tablet.captureRef]);

    return {
        isMidAnimation: (capture) => lastRef.current?.capture === capture && lastRef.current.screen.offGrid,
        screenOf: (capture) => (lastRef.current?.capture === capture ? lastRef.current.screen : null),
        trackerRef,
        events,
    };
}


// decode = «los píxeles de una captura»: { data, width, height, channels: 4 }, con un canvas fuera de pantalla
async function decode(blob) {
    const bitmap = await createImageBitmap(blob);
    try {
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(bitmap, 0, 0);
        const { data, width, height } = context.getImageData(0, 0, bitmap.width, bitmap.height);
        return { data, width, height, channels: 4 };
    }
    finally {
        bitmap.close();
    }
}


export { useCardTracking };
