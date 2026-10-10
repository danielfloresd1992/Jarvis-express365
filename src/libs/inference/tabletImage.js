// tabletImage.js — hablar con la tablet.
// Vale igual para la tablet de verdad (USB) que para la simulada: las dos ofrecen
// adb.subprocess.noneProtocol.spawnWait([...]), que ejecuta un comando y devuelve su salida en bytes.
//
// LA CAPTURA VIAJA ENTERA AL MODELO (desde el 2026-10-05, a petición del usuario).
// Antes se cortaba en tiras verticales que se solapaban, y en cada vuelta se mandaba una. El motivo: los
// modelos de visión ENCOGEN la imagen antes de mirarla, y con una pantalla de cocina ancha, de treinta
// tarjetas, los números de mesa quedaban en un puñado de píxeles y dejaban de leerse. La historia entera
// estaba en libs/tickets/configLectura.js (está en git). Si el modelo empieza a confundir números de mesa
// o de ticket, es lo primero que hay que mirar.



// SCREENSHOT_COMMAND = «el comando de la captura de pantalla» ('screencap -p' devuelve un PNG)
const SCREENSHOT_COMMAND = ['screencap', '-p'];

// TIME_COMMAND = «el comando de la hora» (la tablet contesta 'HH:MM:SS')
const TIME_COMMAND = ['date', '+%H:%M:%S'];

// TIME_PATTERN = «el patrón de una hora» (encuentra 'HH:MM:SS' en medio de cualquier texto)
const TIME_PATTERN = /\b(\d{1,2}:\d{2}:\d{2})\b/;



// getTabletImage = «obtener la imagen de la tablet»
// STEP 1. Una captura de la pantalla, con la hora que marcaba la tablet en ese momento.
// Recibe: adb (la tablet conectada, la de verdad o la simulada).
// Devuelve: { png: Uint8Array, blob: Blob, time: 'HH:MM:SS' o '' }
// Sin try/catch a propósito: si la tablet no contesta LANZA, y qué hacer lo decide quien llama.
async function getTabletImage(adb) {

    // 1. La captura.
    // png = «los bytes de la captura»
    const png = await adb.subprocess.noneProtocol.spawnWait(SCREENSHOT_COMMAND);

    // 2. La hora. Se pide en la misma vuelta que la foto para que las dos sean del mismo instante.
    // time = «la hora de la tablet»
    const time = await getTabletTime(adb);

    // 3. La misma captura como Blob: para pintarla en el espejo y para mandarla al modelo.
    // blob = «la captura como archivo en memoria»
    const blob = new Blob([png], { type: 'image/png' });

    return { png, blob, time };
}



// getTabletTime = «obtener la hora de la tablet»
// Se le pregunta a la tablet y no al equipo: los tiempos de los pedidos se calculan contra las
// horas de SU pantalla, y un minuto de diferencia entre relojes es un minuto de error en cada fila.
// Recibe: adb (la tablet conectada).
// Devuelve: 'HH:MM:SS', o '' si no se pudo leer (quien llama se arregla con el reloj del equipo).
async function getTabletTime(adb) {
    try {
        // output = «la salida del comando, en bytes»
        const output = await adb.subprocess.noneProtocol.spawnWait(TIME_COMMAND);

        // text = «la salida, como texto»
        const text = new TextDecoder().decode(output).trim();

        // La hora se BUSCA dentro del texto en vez de exigir que sea todo él: un aviso del shell o
        // una fecha completa alrededor dejaban la hora vacía, y las filas se sellaban con otro reloj.
        // found = «la hora encontrada»
        const found = text.match(TIME_PATTERN);

        if (!found) {
            console.log('[HORA] la tablet no devolvió una hora reconocible:', JSON.stringify(text.slice(0, 80)));
            return '';
        }

        return found[1];
    }
    catch (error) {
        console.log(error);
        return '';
    }
}



// toDataUrl = «la captura, como data URL»
// STEP 2. Es como viaja al modelo: entera y tal cual sale de la tablet, sin recortar ni reducir.
// Recibe: blob (la captura). Devuelve: 'data:image/png;base64,…'.
function toDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}



export { getTabletImage, getTabletTime, toDataUrl };
