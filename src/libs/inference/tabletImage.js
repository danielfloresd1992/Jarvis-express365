// tabletImage.js — hablar con la tablet.
// Vale igual para la tablet de verdad (USB) que para la simulada: las dos ofrecen
// adb.subprocess.noneProtocol.spawnWait([...]), que ejecuta un comando y devuelve su salida en bytes.



// SCREENSHOT_COMMAND = «el comando de la captura de pantalla» ('screencap -p' devuelve un PNG)
const SCREENSHOT_COMMAND = ['screencap', '-p'];

// TIME_COMMAND = «el comando de la hora» (la tablet contesta 'HH:MM:SS')
const TIME_COMMAND = ['date', '+%H:%M:%S'];

// TIME_PATTERN = «el patrón de una hora» (encuentra 'HH:MM:SS' en medio de cualquier texto)
const TIME_PATTERN = /\b(\d{1,2}:\d{2}:\d{2})\b/;

// PNG_SIGNATURE = «la firma de un PNG» (sus cuatro primeros bytes: 0x89 'P' 'N' 'G')
const PNG_SIGNATURE = [0x89, 0x50, 0x4E, 0x47];

// PNG_HEADER_LENGTH = «lo que ocupa la cabecera de un PNG, en bytes»
const PNG_HEADER_LENGTH = 24;

// PNG_WIDTH_POSITION = «la posición del ancho dentro del PNG»
const PNG_WIDTH_POSITION = 16;



// getTabletImage = «obtener la imagen de la tablet»
// STEP 1. Una captura de la pantalla, con la hora que marcaba la tablet en ese momento.
// Recibe: adb (la tablet conectada, la de verdad o la simulada).
// Devuelve: { png: Uint8Array, blob: Blob, time: 'HH:MM:SS' o '', width: number }
// Sin try/catch a propósito: si la tablet no contesta LANZA, y qué hacer lo decide quien llama.
async function getTabletImage(adb) {

    // 1. La captura.
    // png = «los bytes de la captura»
    const png = await adb.subprocess.noneProtocol.spawnWait(SCREENSHOT_COMMAND);

    // 2. La hora. Se pide en la misma vuelta que la foto para que las dos sean del mismo instante.
    // time = «la hora de la tablet»
    const time = await getTabletTime(adb);

    // 3. La misma captura como Blob (para pintarla y recortarla) y su ancho (decide cuántas tiras salen).
    // blob = «la captura como archivo en memoria»
    const blob = new Blob([png], { type: 'image/png' });

    // width = «el ancho de la captura, en píxeles»
    const width = getPngWidth(png);

    return { png, blob, time, width };
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



// getPngWidth = «obtener el ancho del PNG»
// PURA. Lee el ancho de la cabecera del PNG, sin decodificar la imagen: un PNG empieza siempre
// por su firma y, acto seguido, el bloque IHDR, que lleva el ancho en los bytes 16 a 19.
// Recibe: bytes (Uint8Array con el PNG).
// Devuelve: el ancho en píxeles, o 0 si eso no es un PNG (con 0 se sigue con las tiras de siempre).
function getPngWidth(bytes) {

    // 1. Sin bytes, o con menos de los que ocupa la cabecera, no hay nada que leer.
    if (!bytes || bytes.length < PNG_HEADER_LENGTH) return 0;

    // 2. Tiene que empezar por la firma de un PNG.
    for (let i = 0; i < PNG_SIGNATURE.length; i++) {
        if (bytes[i] !== PNG_SIGNATURE[i]) return 0;
    }

    // 3. El ancho es un número de cuatro bytes.
    // view = «la vista para leer números dentro de los bytes»
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    return view.getUint32(PNG_WIDTH_POSITION);
}



// getStripBounds = «obtener los límites de la tira»
// PURA. Por dónde se corta la tira 'index' en una imagen de 'imageWidth' píxeles de ancho.
// Recibe: imageWidth (ancho de la captura), strips (en cuántas tiras se corta), overlap (cuánto se
//         ensancha cada tira hacia sus vecinas, en fracción de su ancho) e index (cuál, desde 0).
// Devuelve: { startX, width }  (dónde empieza el recorte y cuánto mide de ancho)
function getStripBounds(imageWidth, strips, overlap, index) {

    // stripWidth = «el ancho de una tira, sin solape»
    const stripWidth = imageWidth / strips;

    // margin = «el solape, en píxeles»: una tarjeta a caballo entre dos tiras sale entera en una
    const margin = stripWidth * overlap;

    // Los bordes se pegan al límite de la imagen: sin esto, la primera y la última tira pedirían
    // píxeles que no existen y saldrían con una banda vacía.
    // startX = «dónde empieza la tira»
    const startX = Math.max(0, Math.floor(index * stripWidth - margin));

    // endX = «dónde termina la tira»
    const endX = Math.min(imageWidth, Math.ceil((index + 1) * stripWidth + margin));

    // width = «el ancho del recorte»
    const width = Math.max(1, endX - startX);

    return { startX, width };
}



// cropStrip = «recortar la tira»
// STEP 2. La tira número 'index' de la captura, contando de izquierda a derecha. Usa <canvas>: solo navegador.
// Las tiras van de arriba abajo, enteras, porque las tarjetas se apilan en columnas: una cuadrícula
// las partía por la mitad y dejaba recortes con productos y ninguna cabecera.
// Recibe: blob (la captura), strips, overlap e index (los mismos de getStripBounds).
// Devuelve: la tira como data URL ('data:image/png;base64,…'). No se reduce de tamaño: cuanto
//           menos contenido lleve la imagen, más píxeles le tocan a cada letra cuando el modelo la encoge.
async function cropStrip(blob, strips, overlap, index) {

    // 1. La captura, decodificada para poder recortarla.
    // bitmap = «la captura decodificada»
    const bitmap = await createImageBitmap(blob);

    // 2. Por dónde se corta.
    // bounds = «los límites de la tira»
    const bounds = getStripBounds(bitmap.width, strips, overlap, index);

    // height = «el alto del recorte» (la captura entera, de arriba abajo)
    const height = bitmap.height;

    // 3. Ese trozo se pinta en un lienzo de su mismo tamaño.
    // canvas = «el lienzo»
    const canvas = document.createElement('canvas');
    canvas.width = bounds.width;
    canvas.height = height;

    canvas.getContext('2d').drawImage(
        bitmap,
        bounds.startX, 0, bounds.width, height,   // de dónde se recorta
        0, 0, bounds.width, height                // dónde se pega
    );

    // 4. Se suelta la captura decodificada: sin esto su memoria no se libera.
    bitmap.close();

    return canvas.toDataURL('image/png');
}



export { getTabletImage, getTabletTime, getPngWidth, cropStrip };
