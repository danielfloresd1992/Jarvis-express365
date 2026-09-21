import axios from 'axios';


// HABLAR CON EL SERVIDOR DE IA (LM Studio)
//
//   STEP 0  checkAiServer      la primera solicitud: ¿está activo? ¿qué modelo tiene?
//   STEP 3  requestInference   manda UNA imagen al modelo y devuelve su texto
//
// Ninguna de las dos lanza: los fallos esperables se devuelven ({ active: false } / { ok: false }).
// Este archivo no lee el .env: la dirección y el tiempo máximo le llegan por parámetro.



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

// MISSING_URL_ERROR = «el aviso de que falta la dirección»
const MISSING_URL_ERROR = 'falta la dirección del servidor de IA: pon VITE_AI_URL en el .env';

// NO_MODEL_ERROR = «el aviso de que el servidor no tiene modelo»
const NO_MODEL_ERROR = 'el servidor de IA no tiene ningún modelo de lenguaje: descarga y carga uno en LM Studio';

// MODEL_UNLOADED_WORDS = «las palabras con las que LM Studio dice que el modelo ya no está cargado»
// Son las suyas, tal cual: «Model unloaded by user or API request.» y «Cannot find model of instance reference…».
const MODEL_UNLOADED_WORDS = /model.*unloaded|cannot find model/i;



// getLanguageModels = «obtener los modelos de lenguaje»
// De lo que contesta /api/v1/models, solo los que conversan ('llm'). Los de embeddings no leen.
// Recibe: modelsResponse. Vale la forma de LM Studio ({ models: [{ key, type, loaded_instances, capabilities }] })
//         y la compatible con OpenAI ({ data: [{ id }] }), que no dice ni el tipo ni si está cargado.
// Devuelve: [ { name: 'google/gemma-4-12b', loaded: true, vision: true } ]
function getLanguageModels(modelsResponse) {

    // modelList = «la lista de modelos, tal como la manda el servidor»
    let modelList = [];
    if (Array.isArray(modelsResponse?.models)) modelList = modelsResponse.models;
    else if (Array.isArray(modelsResponse?.data)) modelList = modelsResponse.data;

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
        if (type !== 'llm') continue;

        // loaded = «cargado en memoria»
        let loaded = model?.state === 'loaded';
        if (Array.isArray(model?.loaded_instances)) loaded = model.loaded_instances.length > 0;

        // vision = «sabe mirar imágenes»
        const vision = model?.capabilities?.vision === true || model?.vision === true;

        languageModels.push({ name, loaded, vision });
    }

    return languageModels;
}



// chooseModel = «elegir el modelo»
// PURA. De la lista de /api/v1/models, el nombre del modelo con el que leer.
// Orden: cargado y con visión > cargado > con visión (LM Studio lo carga solo) > cualquier otro llm.
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
        // score = «la puntuación»: 2 por estar cargado, 1 por tener visión
        let score = 0;
        if (model.loaded) score = score + 2;
        if (model.vision) score = score + 1;

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
// Devuelve: el servidor, o '' si la dirección no vale (viene del .env y puede estar vacía).
function getServerHost(url) {
    try {
        return new URL(url).host;
    }
    catch (error) {
        return '';
    }
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
// Devuelve: 'cancelled' | 'timeout' | 'model-rejected' | 'http' | 'cors' | 'network'
async function getFailureCause(error, baseUrl) {

    if (axios.isCancel(error)) return 'cancelled';
    if (isTimeoutError(error)) return 'timeout';
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

    if (cause === 'cors') {
        return `CORS apagado en la IA (${host}): activa «Enable CORS» en LM Studio. ` +
            'El servidor está encendido, pero así el navegador no puede hablarle';
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

    // Con https se dice primero qué probar: LM Studio sirve en http a secas, y un .env con https daba
    // este mismo fallo con el servidor perfectamente encendido. Costó una tarde.
    if (String(url).startsWith('https:')) {
        hint = 'si ese servidor no usa https (LM Studio a secas no lo usa), pon http:// en VITE_AI_URL; ' +
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
// Recibe: baseUrl (la dirección del servidor, sin la ruta) y signal (para cancelar).
// Devuelve: { active: true,  model: 'google/gemma-4-12b', models: ['google/gemma-4-12b', …], ms: 14 }
//        o  { active: false, cause: 'network' | 'cors' | 'no-model' | 'timeout' | 'http' | 'cancelled', error: 'texto en español', ms }
async function checkAiServer(baseUrl, signal) {

    // 1. Sin dirección no hay a quién preguntar
    if (!baseUrl) {
        return { active: false, cause: 'network', error: MISSING_URL_ERROR, ms: 0 };
    }

    // startTime = «hora de inicio»
    const startTime = Date.now();

    // modelsUrl = «la dirección de la lista de modelos»
    const modelsUrl = `${baseUrl}/api/v1/models`;

    try {
        // 2. Se pide la lista de modelos
        // response = «la respuesta del servidor»
        const response = await axios.get(modelsUrl, { timeout: CHECK_TIMEOUT_MS, signal });

        // 3. De la lista, el modelo con el que leer
        // model = «el modelo elegido»
        const model = chooseModel(response.data);

        // ms = «los milisegundos que tardó»
        const ms = Date.now() - startTime;

        // 4. Contesta, pero no tiene con qué leer
        if (model === null) {
            return { active: false, cause: 'no-model', error: NO_MODEL_ERROR, ms };
        }

        // models = «los nombres de todos sus modelos de lenguaje»
        const models = [];
        for (const languageModel of getLanguageModels(response.data)) {
            models.push(languageModel.name);
        }

        return { active: true, model, models, ms };
    }
    catch (error) {
        // ms = «los milisegundos que tardó en fallar» (sin contar la sonda de CORS)
        const ms = Date.now() - startTime;

        // cause = «la causa del fallo»
        const cause = await getFailureCause(error, baseUrl);

        // Cancelar no es un fallo: no se apunta en la consola.
        if (cause !== 'cancelled') console.log(error);

        return { active: false, cause, error: explainFailure(cause, error, modelsUrl, CHECK_TIMEOUT_MS, ''), ms };
    }
}



// requestInference = «solicitar la inferencia»
// STEP 3. Manda UNA imagen al modelo y devuelve su texto, tal cual. NUNCA lanza.
// Recibe: { baseUrl (la dirección del servidor), model (el que dijo checkAiServer), prompt (el texto que acompaña
//           a la imagen), image (la tira, como data URL), timeoutMs (lo que se le espera) y signal (para cancelar) }
// Devuelve: { ok: true,  text, seconds, status, stats: { inputTokens, outputTokens, tokensPerSecond, secondsToFirstToken } }
//        o  { ok: false, cause: 'network' | 'cors' | 'timeout' | 'http' | 'model-rejected' | 'cancelled',
//             error: 'texto en español', seconds, status, detail: { code, message, data } }
// Con 'model-rejected', 'network' o 'cors', quien llama vuelve a hacer checkAiServer antes de la siguiente.
async function requestInference({ baseUrl, model, prompt, image, timeoutMs, signal }) {

    // 1. Sin dirección no hay a quién mandársela
    if (!baseUrl) {
        return { ok: false, cause: 'network', error: MISSING_URL_ERROR, seconds: 0, status: null, detail: null };
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
        // 3. Sale la imagen. SIEMPRE con tiempo máximo: una conexión colgada dejaría el bucle parado para siempre.
        // response = «la respuesta del servidor»
        const response = await axios.post(chatUrl, body, { timeout: timeoutMs, signal });

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

        // cause = «la causa del fallo»
        const cause = await getFailureCause(error, baseUrl);

        // Cancelar (desconectar la tablet o pausar la IA) no es un fallo: no se apunta en la consola.
        if (cause !== 'cancelled') console.log(error);

        // detail = «lo que dijo de verdad la red», para el registro de la inferencia
        const detail = {
            code: error?.code ?? null,
            message: error?.message ?? null,
            data: error?.response?.data ?? null
        };

        return {
            ok: false,
            cause,
            error: explainFailure(cause, error, chatUrl, timeoutMs, model),
            seconds,
            status: error?.response?.status ?? null,
            detail
        };
    }
}



export { chooseModel, getTimeoutMs, checkAiServer, requestInference };
