import { abrirCanal, pedir } from './canal.js';
import { direccionDelSimulador } from './disponible.js';




/*  ─────────────────────────────────────────────────────────────────────────────
 *  UNA TABLET DE MENTIRA CON LA MISMA FORMA QUE LA DE VERDAD
 *
 *  TabletScreen no habla con «una tablet»: habla con un objeto Adb, y de él usa
 *  exactamente tres cosas — pedir una captura ('screencap -p'), pedir la hora ('date')
 *  y cerrar. Este objeto ofrece esas tres, con la misma forma, pero detrás no hay un
 *  cable USB sino la ventana del simulador.
 *
 *  Por eso la simulación prueba el camino DE VERDAD: el bucle de captura, el recorte en
 *  tiras, la petición a la IA, el parser, el acumulado, el seguimiento y las parrillas
 *  corren sin saber que la pantalla es falsa. Lo único que no se prueba es el USB.
 *
 *  Y NADA MÁS QUE ESAS TRES. El simulador PINTA la pantalla; leerla, la lee siempre el
 *  servidor de IA. Hubo un «lector simulado» que contestaba las tiras desde aquí, y se
 *  quitó: metía una rama en la lectura de TabletScreen que solo existía al simular.
 *  ───────────────────────────────────────────────────────────────────────────── */


const pausa = (ms) => new Promise(resolve => setTimeout(resolve, ms));


/*  Busca un simulador abierto; si no lo hay, abre su ventana y espera a que arranque.
 *
 *  Tiene que llamarse dentro de un clic: los navegadores solo dejan abrir ventanas
 *  como respuesta a un gesto de quien usa la página.
 */
async function encontrarSimulador(canal, alAvisar) {
    try { return await pedir(canal, 'hola', {}, { esperaMs: 1200 }); }
    catch { /* no hay ninguno abierto: se abre */ }

    alAvisar?.('Abriendo el simulador de Toast…');

    const ventana = window.open(direccionDelSimulador(), 'jarvis-toast-sim', 'width=1500,height=940');
    if (!ventana) throw new Error('No se pudo abrir la ventana del simulador (¿ventanas emergentes bloqueadas?)');

    //  La ventana tarda en cargar: se le pregunta cada medio segundo hasta que conteste.
    for (let intento = 0; intento < 40; intento++) {
        await pausa(500);
        try { return await pedir(canal, 'hola', {}, { esperaMs: 700 }); }
        catch { /* todavía no */ }
    }

    throw new Error('El simulador de Toast no llegó a arrancar');
}


/**
 * @param {object} [opciones]
 * @param {function} [opciones.alAvisar]  recibe textos de progreso para la barra de estado
 * @returns un objeto con la forma del Adb que usa TabletScreen, más lo propio de la simulación
 */
export async function conectarConSimulador({ alAvisar } = {}) {

    const canal = abrirCanal();

    let info;
    try { info = await encontrarSimulador(canal, alAvisar); }
    catch (error) { canal.close(); throw error; }


    return {
        simulado: true,
        nombre: info.nombre ?? 'Toast simulado',

        subprocess: {
            noneProtocol: {
                //  Mismo nombre y misma forma que en @yume-chan/adb: recibe el comando
                //  en una lista y devuelve los bytes de su salida.
                async spawnWait(comando) {
                    if (comando[0] === 'screencap') {
                        const respuesta = await pedir(canal, 'captura');
                        return new Uint8Array(respuesta.png);
                    }

                    if (comando[0] === 'date') {
                        const respuesta = await pedir(canal, 'hora');
                        return new TextEncoder().encode(`${respuesta.hora}\n`);
                    }

                    throw new Error(`La tablet simulada no entiende «${comando.join(' ')}»`);
                },
            },
        },

        async close() {
            canal.close();
        },
    };
}


/*  Lo que la ventana de la tablet ha inferido, mandado al simulador para que lo ponga
 *  junto a la verdad. Es una difusión sin respuesta: si no hay simulador, se pierde y
 *  no pasa nada.
 */
let canalDeInferencia = null;

export function publicarInferencia(datos) {
    try {
        canalDeInferencia ??= abrirCanal();
        canalDeInferencia.postMessage({ t: 'inferencia', ...datos });
    }
    catch { /* sin BroadcastChannel no hay comparación, pero tampoco es motivo para romper nada */ }
}
