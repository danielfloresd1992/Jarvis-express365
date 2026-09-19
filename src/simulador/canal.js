/*  ─────────────────────────────────────────────────────────────────────────────
 *  EL CABLE ENTRE LA VENTANA DE LA TABLET Y EL SIMULADOR
 *
 *  Son dos ventanas distintas —como la tablet de verdad es otro aparato— y se hablan
 *  por un BroadcastChannel: un canal que comparten todas las ventanas del mismo origen.
 *  Funciona igual entre dos pestañas de Chrome que entre dos ventanas de la aplicación
 *  de escritorio, sin tocar el puente de Electron.
 *
 *  Encima del canal va un pregunta-respuesta mínimo, porque BroadcastChannel solo sabe
 *  difundir: cada pregunta lleva un 'id' y la respuesta lo devuelve en 're'.
 *
 *      ventana de la tablet                     simulador
 *      ────────────────────                     ─────────
 *      { t:'hola', id }                  →      { re:id, nombre, ancho, alto }
 *      { t:'captura', id }               →      { re:id, png:ArrayBuffer, hora }
 *      { t:'hora', id }                  →      { re:id, hora:'HH:MM:SS' }
 *      { t:'lectura', id, tira, … }      →      { re:id, modo:'real' }
 *                                               { re:id, modo:'simulado', contenido }
 *      { t:'inferencia', pedidos, … }           (sin respuesta: es solo para comparar)
 *  ───────────────────────────────────────────────────────────────────────────── */


const NOMBRE_DEL_CANAL = 'jarvis:toast-sim';

export const abrirCanal = () => new BroadcastChannel(NOMBRE_DEL_CANAL);


let cuenta = 0;


/**
 * Manda una pregunta y espera su respuesta.
 *
 * @param {BroadcastChannel} canal
 * @param {string} tipo
 * @param {object} [datos]
 * @param {object} [opciones]
 * @param {number} [opciones.esperaMs]  pasado este tiempo se da por perdida
 * @param {AbortSignal} [opciones.senal]
 */
export function pedir(canal, tipo, datos = {}, { esperaMs = 4000, senal } = {}) {
    return new Promise((resolve, reject) => {
        const id = `${Date.now()}-${++cuenta}`;

        const limpiar = () => {
            clearTimeout(reloj);
            canal.removeEventListener('message', alLlegar);
            senal?.removeEventListener('abort', alCancelar);
        };

        const alLlegar = (evento) => {
            if (evento.data?.re !== id) return;
            limpiar();
            if (evento.data.error) reject(new Error(evento.data.error));
            else resolve(evento.data);
        };

        const alCancelar = () => {
            limpiar();
            reject(new DOMException('Petición cancelada', 'AbortError'));
        };

        const reloj = setTimeout(() => {
            limpiar();
            reject(new Error('El simulador de Toast no responde. ¿Sigue abierta su ventana?'));
        }, esperaMs);

        canal.addEventListener('message', alLlegar);
        senal?.addEventListener('abort', alCancelar);

        canal.postMessage({ t: tipo, id, ...datos });
    });
}


export function responder(canal, id, datos = {}) {
    canal.postMessage({ re: id, ...datos });
}
