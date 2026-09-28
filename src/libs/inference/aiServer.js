import axios from 'axios';


// HABLAR CON EL SERVIDOR DE IA (LM Studio, o el servidor propio con clave)
//
//   STEP 0  checkAiServer      la primera solicitud: ¿está activo? ¿qué modelo tiene?
//   STEP 3  requestInference   manda UNA imagen al modelo y devuelve su texto
//
// Ninguna de las dos lanza: los fallos esperables se devuelven ({ active: false } / { ok: false }).
// Las dos reciben UN OBJETO, y dentro la dirección y la clave.
//
// Este archivo no lee el .env ni localStorage: la dirección, la clave y el tiempo máximo le llegan
// por parámetro. LA CLAVE NO SE APUNTA EN NINGÚN SITIO: ni en la consola, ni en el texto del fallo,
// ni en el 'detail' del registro. Solo viaja en la cabecera Authorization, y de ahí se borra antes
// de que nadie mire el error (un error de axios se lleva dentro la solicitud entera).



// CHECK_TIMEOUT_MS = «tiempo máximo de la consulta, en milisegundos»
// Corto a propósito: si el servidor no contesta la lista en esto, tampoco va a contestar una lectura.
const CHECK_TIMEOUT_MS = 10000;

// CORS_PROBE_TIMEOUT_MS = «tiempo máximo de la sonda de CORS, en milisegundos»
const CORS_PROBE_TIMEOUT_MS = 4000;

// DEFAULT_TIMEOUT_SECONDS = «segundos de espera por omisión»
// 120 y no 60: una tira trae hasta seis tarjetas, y perder la vuelta entera es peor que esperar de más.
const DEFAULT_TIMEOUT_SECONDS = 120;

// MINIMUM_TIMEOUT_SECONDS = «segundos de espera mínimos»
const MINIMUM_TIMEOUT_SECONDS = 10;

// SETTINGS_PLACE = «dónde se arreglan la dirección y la clave»: el sitio del menú, para no repetirlo en cada aviso
const SETTINGS_PLACE = 'Opciones → Servidor de IA';

// READING_TYPES = «los tipos de modelo que sirven para leer la pantalla»
// LM Studio llama 'vlm' a los que miran imágenes y 'llm' a los que solo conversan; los dos valen.
// Aceptar solo 'llm' dejaba fuera justo al modelo de visión que hace falta, y la ventana decía que
// el servidor no tenía ninguno. El que nunca vale es el de embeddings.
const READING_TYPES = ['llm', 'vlm'];

// MISSING_URL_ERROR = «el aviso de que falta la dirección»
// Ya no se pone en el .env: la escribe el usuario en el menú, y por eso el aviso manda al menú.
const MISSING_URL_ERROR = `todavía no hay servidor de IA: ponlo en ${SETTINGS_PLACE}`;

// HIDDEN_API_KEY = «lo que se escribe en lugar de la clave» si alguien la devuelve en su mensaje
const HIDDEN_API_KEY = '***';

// NO_MODEL_ERROR = «el aviso de que el servidor no tiene modelo»
const NO_MODEL_ERROR = 'el servidor de IA no tiene ningún modelo de lenguaje: descarga y carga uno en LM Studio';

// MODEL_UNLOADED_WORDS = «las palabras con las que LM Studio dice que el modelo ya no está cargado»
// Son las suyas, tal cual: «Model unloaded by user or API request.» y «Cannot find model of instance reference…».
const MODEL_UNLOADED_WORDS = /model.*unloaded|cannot find model/i;



// getModelList = «la lista cruda de modelos, venga en la forma que venga»
// PURA. LM Studio (y el bot, que lo imita) la mandan en 'models'; la compatible con OpenAI, en 'data'.
// Recibe: modelsResponse (lo que contestó /api/v1/models). Devuelve: la lista, o [] si no trae ninguna.
function getModelList(modelsResponse) {
    if (Array.isArray(modelsResponse?.models)) return modelsResponse.models;
    if (Array.isArray(modelsResponse?.data)) return modelsResponse.data;
    return [];
}



// getLanguageModels = «obtener los modelos de lenguaje»
// De lo que contesta /api/v1/models, solo los que conversan ('llm'). Los de embeddings no leen.
// Recibe: modelsResponse. Vale la forma de LM Studio ({ models: [{ key, type, loaded_instances, capabilities }] })
//         y la compatible con OpenAI ({ data: [{ id }] }), que no dice ni el tipo ni si está cargado.
// Devuelve: [ { name: 'google/gemma-4-12b', loaded: true, vision: true } ]
function getLanguageModels(modelsResponse) {

    // modelList = «la lista de modelos, tal como la manda el servidor»
    const modelList = getModelList(modelsResponse);

    // languageModels = «los modelos de lenguaje»
    const languageModels = [];

    for (const model of modelList) {
        // name = «el nombre del modelo»
        const name = String(model?.key ?? model?.id ?? '').trim();
        if (name === '') continue;

        // type = «el tipo de modelo». Si el servidor no lo dice, se deduce del nombre.
        let type = model?.type;
        if (!type && /embed/i.test(name)) type = 'embedding';
        if (!type) type = 'llm';
        if (!READING_TYPES.includes(String(type).toLowerCase())) continue;

        // loaded = «cargado en memoria»
        // Vale con que lo diga CUALQUIERA de los dos: un servidor que ponga 'loaded' y deje la lista
        // de instancias vacía seguía contando como no cargado, y eso lo mandaba al final de la cola.
        let loaded = model?.state === 'loaded';
        if (Array.isArray(model?.loaded_instances) && model.loaded_instances.length > 0) loaded = true;

        // vision = «sabe mirar imágenes»
        const vision = model?.capabilities?.vision === true || model?.vision === true;

        languageModels.push({ name, loaded, vision });
    }

    return languageModels;
}



// chooseModel = «elegir el modelo»
// PURA. De la lista de /api/v1/models, el nombre del modelo con el que leer.
// Orden: cargado y con visión > con visión (LM Studio lo carga solo) > cargado > cualquier otro llm.
// Recibe: modelsResponse (lo que contestó el servidor).
// Devuelve: 'google/gemma-4-12b', o null si no hay ningún modelo de lenguaje.
function chooseModel(modelsResponse) {

    // languageModels = «los modelos de lenguaje»
    const languageModels = getLanguageModels(modelsResponse);

    // bestName = «el nombre del mejor»
    let bestName = null;

    // bestScore = «la puntuación del mejor»
    let bestScore = -1;

    for (const model of languageModels) {
        // score = «la puntuación»: 2 por ver, 1 por estar cargado
        // Ver pesa MÁS que estar cargado, y no al revés como estaba: esta aplicación siempre manda
        // una foto, así que un modelo ciego ya cargado no sirve para nada, y uno que ve sin cargar
        // sí (LM Studio lo carga solo en la primera lectura). Con el peso al revés, un servidor con
        // un ciego cargado y uno con visión descargado elegía el ciego y fallaba tira tras tira.
        // Con las formas que no dicen quién ve, 'vision' es false para todos y solo cuenta cargado.
        let score = 0;
        if (model.vision) score = score + 2;
        if (model.loaded) score = score + 1;

        // Con '>' y no '>=': a igualdad de puntos gana el que el servidor puso primero.
        if (score > bestScore) {
            bestName = model.name;
            bestScore = score;
        }
    }

    return bestName;
}



// getTimeoutMs = «obtener el tiempo máximo, en milisegundos»
// PURA. Lo que se espera al modelo por cada tira.
// Recibe: secondsFromEnv (VITE_AI_TIMEOUT_S tal como viene del .env: un texto, un número o nada).
// Devuelve: los milisegundos. Si no viene, o viene menos de 10 s, los de 120 s.
function getTimeoutMs(secondsFromEnv) {

    // seconds = «los segundos pedidos»
    const seconds = Number(secondsFromEnv);

    // Un 'VITE_AI_TIMEOUT_S=3' escrito por error dejaría la ventana sin leer nada: no se le hace caso.
    if (!Number.isFinite(seconds) || seconds < MINIMUM_TIMEOUT_SECONDS) {
        return DEFAULT_TIMEOUT_SECONDS * 1000;
    }

    return seconds * 1000;
}



// getServerHost = «obtener el servidor de una dirección»
// De 'http://72.68.60.141:1235/api/v1/chat' saca '72.68.60.141:1235', para nombrarlo en un aviso.
// Devuelve: el servidor, o '' si la dirección no vale (la escribe el usuario y puede estar a medias).
function getServerHost(url) {
    try {
        return new URL(url).host;
    }
    catch (error) {
        return '';
    }
}



// cleanApiKey = «limpiar la clave»
// PURA. La clave sin espacios alrededor. Sin clave (lo normal con LM Studio a secas), ''.
// Recibe: apiKey (lo que guardó el usuario en el menú; puede no venir).
function cleanApiKey(apiKey) {
    return String(apiKey ?? '').trim();
}



// getAuthHeaders = «obtener las cabeceras con la clave»
// PURA. La cabecera que pide el servidor propio: 'Authorization: Bearer <clave>'. La clave NUNCA va en la URL.
// Recibe: apiKey. Devuelve: { Authorization } o undefined si no hay clave (LM Studio no la pide y se enfada si va).
function getAuthHeaders(apiKey) {

    // key = «la clave, ya limpia»
    const key = cleanApiKey(apiKey);
    if (key === '') return undefined;

    return { Authorization: `Bearer ${key}` };
}



// removeApiKey = «quitar la clave de un texto»
// PURA. Por si el servidor la devuelve dentro de su propio mensaje de error: lo que se enseña o se
// apunta no la puede llevar. Recibe: text y apiKey. Devuelve: el texto con la clave tapada.
function removeApiKey(text, apiKey) {

    // key = «la clave, ya limpia»
    const key = cleanApiKey(apiKey);
    if (key === '' || typeof text !== 'string') return text;

    return text.split(key).join(HIDDEN_API_KEY);
}



// hideApiKeyInData = «esconder la clave dentro del cuerpo de la respuesta»
// Lo mismo que removeApiKey, pero para el cuerpo que manda el servidor, que va al 'detail' del registro.
// Recibe: data (lo que contestó el servidor) y apiKey. Devuelve: el cuerpo sin la clave.
function hideApiKeyInData(data, apiKey) {

    // key = «la clave, ya limpia»
    const key = cleanApiKey(apiKey);
    if (key === '' || data === null || data === undefined) return data;

    try {
        // text = «el cuerpo escrito como texto»
        const text = JSON.stringify(data);
        if (typeof text !== 'string' || !text.includes(key)) return data;

        return JSON.parse(removeApiKey(text, key));
    }
    catch (error) {
        // Un cuerpo que no se puede escribir como JSON (ciclos, etc.): mejor nada que arriesgarse.
        return null;
    }
}



// hideApiKey = «esconder la clave dentro del error»
// Un error de axios se lleva dentro la solicitud ENTERA, y ahí va la cabecera Authorization con la clave:
// en error.config.headers, y en error.request escrita en crudo y repetida en sitios internos de Node.
// Y un servidor mal hecho puede devolverla en su propio mensaje: eso también se tapa.
// Se limpia ANTES de apuntarlo en la consola o de mirarle nada.
// Recibe: error y apiKey. Devuelve: el mismo error, ya limpio (null si no se pudo limpiar).
function hideApiKey(error, apiKey) {

    if (!error || typeof error !== 'object') return error;

    // Borrar algo congelado lanza, y esto se llama dentro del catch: si lanzara, la función que promete
    // «nunca lanza» lanzaría. Por eso todo va dentro de su try.
    try {
        // 1. Las cabeceras de la solicitud, en los dos sitios donde axios deja la configuración
        for (const config of [error.config, error.response?.config]) {
            // headers = «las cabeceras»
            const headers = config?.headers;
            if (!headers) continue;

            if (typeof headers.delete === 'function') headers.delete('Authorization');
            delete headers.Authorization;
            delete headers.authorization;
        }

        // 2. La solicitud entera. No sirve para nada aquí y la cabecera está dentro repetida en sitios que
        //    no se pueden borrar uno a uno (Node la guarda hasta en un símbolo interno): se quita entera.
        if (error.request) error.request = null;
        if (error.response?.request) error.response.request = null;

        // 3. El cuerpo que contestó el servidor, por si le ha dado por devolver la clave en su mensaje.
        if (error.response) error.response.data = hideApiKeyInData(error.response.data, apiKey);
    }
    catch (cleaningError) {
        // No se pudo limpiar: entonces ese error NO se apunta en ningún sitio. Quien llama ya tiene su motivo.
        return null;
    }

    return error;
}



// isTimeoutError = «¿es un fallo por tiempo agotado?»
const isTimeoutError = (error) => {
    if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') return true;

    return /timeout/i.test(error?.message ?? '');
};



// getServerMessage = «obtener lo que dijo el servidor»
// Devuelve: el texto del error que mandó el servidor, o '' si no mandó ninguno.
function getServerMessage(error) {

    // data = «el cuerpo de la respuesta»
    const data = error?.response?.data;

    if (typeof data?.error?.message === 'string') return data.error.message;
    if (typeof data?.error === 'string') return data.error;

    return error?.response?.statusText ?? '';
}



// isModelRejected = «¿el servidor rechazó el modelo?»
// El servidor señala al modelo: no existe, no lo pudo cargar (404 o 400) o ya no está cargado (500).
// Pasó al cambiar de máquina: la dirección era buena y se pedía, por su nombre, el modelo del servidor viejo.
function isModelRejected(error) {

    // status = «el estado HTTP»
    const status = error?.response?.status;

    // Descargaron el modelo (o cargaron otro) en LM Studio a media sesión: contesta un 500 y lo dice con palabras.
    // Quien llama vuelve a checkAiServer y la vuelta siguiente sale con el modelo que de verdad esté cargado.
    if (status === 500) return MODEL_UNLOADED_WORDS.test(getServerMessage(error));

    if (status !== 404 && status !== 400) return false;

    // serverError = «el error que mandó el servidor»
    const serverError = error.response.data?.error;

    if (serverError?.param === 'model') return true;
    if (serverError?.code === 'model_not_found') return true;
    if (serverError?.type === 'model_not_found') return true;

    // Por si el servidor solo lo dice con palabras: «model 'x' not found».
    return /model.*(not found|not loaded|failed to load)/i.test(getServerMessage(error));
}



// isAuthRejected = «¿el servidor rechazó la clave?»
// El servidor propio contesta 401 cuando la clave falta o no vale, y 403 cuando está revocada.
// LM Studio a secas nunca los usa: si salen, es que hay servidor propio y la clave está mal.
function isAuthRejected(error) {

    // status = «el estado HTTP»
    const status = error?.response?.status;

    return status === 401 || status === 403;
}



// isServerBlockedByCors = «¿el servidor está encendido pero bloqueado por CORS?»
// Para la página, «apagado» y «encendido pero sin CORS» son el mismo «Network Error»: el navegador no dice cuál.
// Una petición 'no-cors' no deja LEER la respuesta, pero se resuelve si alguien contesta y falla si no hay nadie.
// LM Studio solo manda las cabeceras con «Enable CORS» activado, y ese interruptor se pierde al reiniciarlo.
// Recibe: baseUrl (la dirección del servidor). Devuelve: true si ahí hay un servidor que contesta.
async function isServerBlockedByCors(baseUrl) {
    try {
        await fetch(`${baseUrl}/api/v1/models`, {
            mode: 'no-cors',
            cache: 'no-store',
            signal: AbortSignal.timeout(CORS_PROBE_TIMEOUT_MS)
        });

        return true;
    }
    catch (error) {
        // Nadie contestó: está apagado de verdad. No es un error, es la respuesta de la sonda.
        return false;
    }
}



// getFailureCause = «obtener la causa del fallo»
// Recibe: error (el que lanzó axios) y baseUrl (la dirección del servidor, para la sonda de CORS).
// Devuelve: 'cancelled' | 'timeout' | 'auth' | 'model-rejected' | 'http' | 'cors' | 'network'
// answersOverHttp = «¿ese servidor contesta por http a secas?»
// Solo para una dirección https que NO contestó. LM Studio de fábrica sirve por http, y escribir
// https:// delante da exactamente el mismo fallo que un servidor apagado: hasta ahora se decía
// «si ese servidor no usa https, pon http://» como sospecha. Esto lo comprueba: la misma ruta de
// modelos, por http, sin clave —'no-cors' ni puede mandarla— y sin leer la respuesta: basta con que
// alguien conteste. En una página servida por https el navegador bloquea la sonda (contenido
// mixto), y entonces se devuelve null y queda la sospecha de antes, que sigue siendo correcta.
// Recibe: baseUrl (la dirección que falló). Devuelve: la misma dirección con http://, o null.
async function answersOverHttp(baseUrl) {

    if (!/^https:\/\//i.test(String(baseUrl ?? ''))) return null;

    // httpUrl = «la misma dirección, por http»
    const httpUrl = String(baseUrl).replace(/^https:\/\//i, 'http://');

    try {
        await fetch(`${httpUrl}/api/v1/models`, {
            mode: 'no-cors',
            cache: 'no-store',
            signal: AbortSignal.timeout(CORS_PROBE_TIMEOUT_MS)
        });

        return httpUrl;
    }
    catch (error) {
        // Tampoco por http: entonces sí que está apagado, o es otra cosa. No es un error, es la respuesta.
        return null;
    }
}



async function getFailureCause(error, baseUrl) {

    if (axios.isCancel(error)) return 'cancelled';
    if (isTimeoutError(error)) return 'timeout';

    // La clave va antes que nada de HTTP: contestó el servidor, así que NO se hace la sonda de CORS.
    if (isAuthRejected(error)) return 'auth';

    if (isModelRejected(error)) return 'model-rejected';
    if (error?.response) return 'http';

    // Sin respuesta alguna: la sonda dice si está apagado o si está encendido y no deja entrar.
    // blockedByCors = «bloqueado por CORS»
    const blockedByCors = await isServerBlockedByCors(baseUrl);
    if (blockedByCors) return 'cors';

    return 'network';
}



// explainFailure = «explicar el fallo»
// El motivo en español que se enseña en la barra, en vez del «Network Error» o el «timeout of 120000ms» de axios.
// La barra lo recorta a 90 letras: lo importante va delante.
// Recibe: cause (la de getFailureCause), error (el de axios), url (a dónde se llamaba),
//         timeoutMs (lo que se esperó) y model (el modelo que se pidió, si se pidió alguno).
// Devuelve: el texto.
function explainFailure(cause, error, url, timeoutMs, model) {

    // host = «el servidor, para nombrarlo»
    const host = getServerHost(url);

    if (cause === 'cancelled') return 'solicitud cancelada';

    if (cause === 'timeout') return `la IA tardó más de ${Math.round(timeoutMs / 1000)} s en contestar`;

    if (cause === 'no-url') return MISSING_URL_ERROR;

    if (cause === 'cors') {
        return `CORS apagado en la IA (${host}): activa «Enable CORS» en LM Studio. ` +
            'El servidor está encendido, pero así el navegador no puede hablarle';
    }

    if (cause === 'auth') {
        // reason = «por qué no vale la clave»: el servidor distingue los dos casos
        let reason = 'falta la clave o no vale';
        if (error?.response?.status === 403) reason = 'la clave está revocada';

        // text = «el texto del aviso». Lo primero, qué pasa y dónde se arregla: la barra recorta a 90 letras.
        let text = `clave rechazada (${error.response.status}): ${reason}. Revísala en ${SETTINGS_PLACE}`;

        // serverMessage = «lo que dijo el servidor»
        const serverMessage = String(getServerMessage(error)).slice(0, 120);
        if (serverMessage !== '') text = `${text}. La IA dijo: ${serverMessage}`;

        return text;
    }

    if (cause === 'model-rejected' || cause === 'http') {
        // serverMessage = «lo que dijo el servidor»
        const serverMessage = String(getServerMessage(error)).slice(0, 120);

        // text = «el texto del aviso»
        let text = `la IA respondió ${error.response.status}`;
        if (cause === 'model-rejected') text = `la IA no acepta el modelo «${model}»: respondió ${error.response.status}`;
        if (serverMessage !== '') text = `${text}: ${serverMessage}`;

        return text;
    }

    // cause === 'network'
    // hint = «la pista de qué mirar»
    let hint = 'servidor apagado o dirección incorrecta';

    // Con https se dice primero qué probar: LM Studio sirve en http a secas, y una dirección con https daba
    // este mismo fallo con el servidor perfectamente encendido. Costó una tarde.
    if (String(url).startsWith('https:')) {
        hint = `si ese servidor no usa https (LM Studio a secas no lo usa), pon http:// en ${SETTINGS_PLACE}; ` +
            'si no, servidor apagado o certificado no aceptado';
    }

    if (host === '') return `sin conexión con la IA: ${hint}`;

    return `sin conexión con la IA en ${host}: ${hint}`;
}



// getOutputText = «obtener el texto de la respuesta»
// La API propia de LM Studio contesta en 'output' (no en 'choices'): una lista de trozos con su tipo.
// Devuelve: el texto del trozo 'message'. Si ninguno dice su tipo, el del primero. '' si no hay nada.
function getOutputText(data) {

    // output = «los trozos de la respuesta»
    const output = data?.output;
    if (!Array.isArray(output)) return '';

    for (const item of output) {
        if (item?.type === 'message' && typeof item.content === 'string') return item.content;
    }

    return String(output[0]?.content ?? '');
}



// getInferenceStats = «obtener las estadísticas de la inferencia»
// Devuelve: { inputTokens, outputTokens, tokensPerSecond, secondsToFirstToken }, con null en lo que el servidor no diga.
function getInferenceStats(data) {

    // serverStats = «las estadísticas que manda el servidor»
    const serverStats = data?.stats ?? {};

    return {
        inputTokens: serverStats.input_tokens ?? null,
        outputTokens: serverStats.total_output_tokens ?? null,
        tokensPerSecond: serverStats.tokens_per_second ?? null,
        secondsToFirstToken: serverStats.time_to_first_token_seconds ?? null
    };
}



// checkAiServer = «consultar el servidor de IA»
// STEP 0. La PRIMERA solicitud: pregunta si el servidor está activo y qué modelo tiene. NUNCA lanza.
// El modelo no está escrito ni aquí ni en el .env: cambiarlo en LM Studio no puede obligar a tocar la aplicación.
// Recibe: { baseUrl (la dirección del servidor, sin la ruta), apiKey (la clave del menú, si la hay),
//           preferred (el modelo elegido en el menú; vacío = que elija el servidor)
//           y signal (para cancelar) }. Es UN OBJETO a propósito: así un sitio sin actualizar falla a la vista.
// Devuelve: { active: true,  model: 'google/gemma-4-12b', models: ['google/gemma-4-12b', …],
//             visionModels: ['google/gemma-4-12b'], ms: 14,
//             missingPreferred: 'el-que-se-pidio' | null,   ← se pidió uno que ya no está cargado
//             blindPreferred:   'el-que-se-pidio' | null }   ← se pidió uno que está pero no ve
//        o  { active: false, cause: 'no-url' | 'network' | 'cors' | 'auth' | 'no-model' | 'no-vision-model'
//                                 | 'https-not-supported' | 'timeout' | 'http' | 'cancelled',
//             error: 'texto en español', ms }   (con 'no-vision-model' vienen además models y visionModels;
//                                                con 'https-not-supported', suggestedUrl: la misma dirección por http)
//
// EL MODELO ELEGIDO MANDA, PERO SOLO SI ESTÁ. Se comprueba contra la lista que acaba de contestar el
// servidor: uno que se descargó desde que se eligió ya no puede leer nada, y mandarle la imagen daría
// un fallo por lectura en vez de leer con otro. Cuando pasa, se lee con el que habría elegido solo y
// se dice en 'missingPreferred', que es lo que se enseña arriba: perder la elección EN SILENCIO es lo
// que haría que nadie entendiera por qué lee distinto de lo que puso.
async function checkAiServer({ baseUrl, apiKey, preferred, signal } = {}) {

    // 1. Sin dirección no hay a quién preguntar
    if (!baseUrl) {
        return { active: false, cause: 'no-url', error: MISSING_URL_ERROR, ms: 0 };
    }

    // startTime = «hora de inicio»
    const startTime = Date.now();

    // modelsUrl = «la dirección de la lista de modelos»
    const modelsUrl = `${baseUrl}/api/v1/models`;

    try {
        // 2. Se pide la lista de modelos, con la clave si la hay
        // response = «la respuesta del servidor»
        const response = await axios.get(modelsUrl, { timeout: CHECK_TIMEOUT_MS, signal, headers: getAuthHeaders(apiKey) });

        // 3. De la lista, el modelo con el que leer
        // model = «el modelo elegido»
        let model = chooseModel(response.data);

        // ms = «los milisegundos que tardó»
        const ms = Date.now() - startTime;

        // 4. Contesta, pero no tiene con qué leer
        if (model === null) {
            return { active: false, cause: 'no-model', error: NO_MODEL_ERROR, ms };
        }

        // models = «los nombres de todos sus modelos de lenguaje»
        // visionModels = «de esos, los que saben mirar imágenes»
        // Va como lista aparte y no como un booleano dentro de 'models' para no cambiarle la forma a
        // 'models', que el registro de la tablet apunta tal cual. Lo que importa de esta lista es
        // cuándo está VACÍA: entonces la lectura de tickets no puede salir bien con ninguno, y eso
        // hay que decirlo ANTES de mandar la primera tira, no después de veinte 404 seguidos.
        // loadedCount = «cuántos de esos están cargados de verdad»
        // Se cuenta aparte porque LM Studio lista también los descargados sin cargar; decir «N cargados»
        // con el largo de la lista mentiría ahí. Con el bot, que solo lista los listos, coinciden.
        const models = [];
        const visionModels = [];
        let loadedCount = 0;
        for (const languageModel of getLanguageModels(response.data)) {
            models.push(languageModel.name);
            if (languageModel.vision) visionModels.push(languageModel.name);
            if (languageModel.loaded) loadedCount = loadedCount + 1;
        }

        // 5. Si el servidor DICE qué modelos ven y ninguno ve, no está activo para leer tickets
        // reportsVision = «el servidor dijo, modelo a modelo, si ve»
        // Solo la forma propia de LM Studio (y el bot, que la imita) trae 'capabilities'. La forma
        // compatible con OpenAI ({ data: [{ id }] }) no dice nada, y ahí una visionModels vacía NO
        // significa «ninguno ve»: significa «no se sabe». Con esa forma se sigue como siempre, y
        // se devuelve reportsVision para que Opciones tampoco etiquete lo que no sabe.
        const reportsVision = getModelList(response.data).some(one => one && typeof one.capabilities === 'object');

        if (reportsVision && visionModels.length === 0) {
            // Se devuelve como NO activo a propósito. La tablet siempre manda una foto, así que con
            // esto la lectura no puede salir bien con ningún modelo. Activo, arrancaría el bucle y
            // subiría una tira cada vez para recibir un 404 que ya se sabía de antemano. No activo,
            // la barra lo dice, no sale ninguna tira, y se vuelve a preguntar cada CHECK_RETRY_MS
            // hasta que el servidor monte uno que vea. Las listas van igualmente, para que Opciones
            // pueda enseñar qué hay montado aunque con eso no se pueda leer.
            return {
                active: false,
                cause: 'no-vision-model',
                error: loadedCount === 1
                    ? 'el servidor de IA tiene 1 modelo cargado pero no mira imágenes: monta uno con su .mmproj.gguf al lado'
                    : `el servidor de IA tiene ${loadedCount} modelos cargados pero ninguno mira imágenes: monta uno con su .mmproj.gguf al lado`,
                ms,
                models,
                visionModels,
                reportsVision
            };
        }

        // 6. El elegido en el menú manda, si el servidor lo tiene Y ve
        // wanted = «el modelo que se pidió desde el menú», sin espacios de sobra
        const wanted = String(preferred ?? '').trim();

        // missingPreferred = «se pidió uno que el servidor ya no tiene», o null
        let missingPreferred = null;

        // blindPreferred = «se pidió uno que está cargado pero no ve, habiendo otros que sí», o null
        // No se usa el ciego. Si se usara, el bot lo cambiaría por uno que ve sin que este lado se
        // enterara, y la barra, el registro y Opciones enseñarían un modelo que NO es el que lee.
        // Se deja el que eligió chooseModel —que prefiere los que ven— y se dice cuál se pidió.
        let blindPreferred = null;

        if (wanted !== '') {
            if (!models.includes(wanted)) missingPreferred = wanted;
            else if (reportsVision && !visionModels.includes(wanted)) blindPreferred = wanted;
            else model = wanted;
        }

        return { active: true, model, models, visionModels, reportsVision, ms, missingPreferred, blindPreferred };
    }
    catch (error) {
        // ms = «los milisegundos que tardó en fallar» (sin contar la sonda de CORS)
        const ms = Date.now() - startTime;

        // La clave viaja dentro del error: fuera antes de que la vea la consola.
        // cleanError = «el error ya sin la clave». null si no se pudo limpiar: entonces no se apunta en ningún sitio.
        const cleanError = hideApiKey(error, apiKey);

        // cause = «la causa del fallo»
        const cause = await getFailureCause(error, baseUrl);

        // Cancelar no es un fallo: no se apunta en la consola.
        if (cause !== 'cancelled' && cleanError) console.log(cleanError);

        // Nadie contestó por https: ¿contesta por http en el mismo puerto? Si sí, el fallo no es
        // «servidor apagado» sino «dirección con https delante de un servidor que habla http», y se
        // dice como hecho, con la dirección buena, en vez de como sospecha. Nunca se cambia sola.
        // httpUrl = «la misma dirección por http, si ahí sí contestan», o null
        const httpUrl = cause === 'network' ? await answersOverHttp(baseUrl) : null;

        if (httpUrl) {
            return {
                active: false,
                cause: 'https-not-supported',
                error: `ese servidor contesta por http, no por https: cambia la dirección a ${httpUrl} en ${SETTINGS_PLACE}`,
                ms,
                suggestedUrl: httpUrl
            };
        }

        // text = «el motivo, en español y sin la clave»
        const text = removeApiKey(explainFailure(cause, error, modelsUrl, CHECK_TIMEOUT_MS, ''), apiKey);

        return { active: false, cause, error: text, ms };
    }
}



// requestInference = «solicitar la inferencia»
// STEP 3. Manda UNA imagen al modelo y devuelve su texto, tal cual. NUNCA lanza.
// Recibe: { baseUrl (la dirección del servidor), apiKey (la clave del menú, si la hay), model (el que dijo
//           checkAiServer), prompt (el texto que acompaña a la imagen), image (la tira, como data URL),
//           timeoutMs (lo que se le espera) y signal (para cancelar) }
// Devuelve: { ok: true,  text, seconds, status, stats: { inputTokens, outputTokens, tokensPerSecond, secondsToFirstToken } }
//        o  { ok: false, cause: 'no-url' | 'network' | 'cors' | 'auth' | 'timeout' | 'http' | 'model-rejected' | 'cancelled',
//             error: 'texto en español', seconds, status, detail: { code, message, data } }
// Con 'model-rejected', 'network' o 'cors', quien llama vuelve a hacer checkAiServer antes de la siguiente.
// Con 'auth' o 'no-url' no: hasta que el usuario no cambie los ajustes, volver a preguntar no arregla nada.
async function requestInference({ baseUrl, apiKey, model, prompt, image, timeoutMs, signal } = {}) {

    // 1. Sin dirección no hay a quién mandársela
    if (!baseUrl) {
        return { ok: false, cause: 'no-url', error: MISSING_URL_ERROR, seconds: 0, status: null, detail: null };
    }

    // startTime = «hora de inicio»
    const startTime = Date.now();

    // chatUrl = «la dirección a la que se manda la imagen»
    const chatUrl = `${baseUrl}/api/v1/chat`;

    // 2. Lo que se le manda
    // body = «el cuerpo de la solicitud»
    // Es la API PROPIA de LM Studio (/api/v1/chat) y no la compatible con OpenAI porque es la única que deja
    // apagar el razonamiento: razonando tardaba 29 s por lectura y a veces se quedaba sin tokens. Para leer
    // tickets no hace falta que piense, solo que copie lo que ve.
    const body = {
        model: model,
        input: [
            { type: 'text', content: prompt },
            { type: 'image', data_url: image }
        ],
        reasoning: 'off',
        temperature: 0
    };

    try {
        // 3. Sale la imagen, con la clave si la hay. SIEMPRE con tiempo máximo: una conexión colgada
        //    dejaría el bucle parado para siempre.
        // response = «la respuesta del servidor»
        const response = await axios.post(chatUrl, body, { timeout: timeoutMs, signal, headers: getAuthHeaders(apiKey) });

        // seconds = «los segundos que tardó el modelo»
        const seconds = (Date.now() - startTime) / 1000;

        // 4. Vuelve su texto
        // text = «el texto que contestó el modelo»
        const text = getOutputText(response.data);

        return { ok: true, text, seconds, status: response.status, stats: getInferenceStats(response.data) };
    }
    catch (error) {
        // seconds = «los segundos que tardó en fallar» (sin contar la sonda de CORS)
        const seconds = (Date.now() - startTime) / 1000;

        // La clave viaja dentro del error: fuera antes de que la vea la consola.
        // cleanError = «el error ya sin la clave». null si no se pudo limpiar: entonces no se apunta en ningún sitio.
        const cleanError = hideApiKey(error, apiKey);

        // cause = «la causa del fallo»
        const cause = await getFailureCause(error, baseUrl);

        // Cancelar (desconectar la tablet o pausar la IA) no es un fallo: no se apunta en la consola.
        if (cause !== 'cancelled' && cleanError) console.log(cleanError);

        // detail = «lo que dijo de verdad la red», para el registro de la inferencia. Sin la clave:
        // el registro se enseña en pantalla y se copia al portapapeles.
        const detail = {
            code: error?.code ?? null,
            message: removeApiKey(error?.message ?? null, apiKey),
            data: hideApiKeyInData(error?.response?.data ?? null, apiKey)
        };

        return {
            ok: false,
            cause,
            error: removeApiKey(explainFailure(cause, error, chatUrl, timeoutMs, model), apiKey),
            seconds,
            status: error?.response?.status ?? null,
            detail
        };
    }
}



export { chooseModel, getTimeoutMs, checkAiServer, requestInference };
