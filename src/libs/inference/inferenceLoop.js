// inferenceLoop.js — el bucle de inferencia.
// Dos piezas: 'runInferenceOnce' da UNA vuelta (recorta la tira, la manda al modelo y entiende lo
// que contestó) y 'startInferenceLoop' repite vueltas sin fin, una detrás de otra.

import { cropStrip } from './tabletImage.js';
import { requestInference } from './aiServer.js';
import { INFERENCE_PROMPT, parseModelResponse } from './modelResponse.js';
import { TIPO } from '../tickets/registroDeInferencia.js';



// DEFAULT_PAUSE_AFTER_ERROR_MS = «pausa por omisión tras una vuelta fallida, en milisegundos»
const DEFAULT_PAUSE_AFTER_ERROR_MS = 5000;

// DEFAULT_PAUSE_BETWEEN_ROUNDS_MS = «pausa por omisión entre dos vueltas buenas, en milisegundos»
const DEFAULT_PAUSE_BETWEEN_ROUNDS_MS = 0;

// EXPECTED_FORMAT = «el formato que se espera del modelo» (se enseña cuando su respuesta no se entiende)
const EXPECTED_FORMAT = 'un array JSON: [{ "ticket": "118", "mesa": "53", "tiempo": "3:04", "tipo": "Appetizer", "listo": false }]';



// roundToOneDecimal = «redondear a un decimal»
// PURA. Recibe: value (un número, o nada). Devuelve: el número con un decimal, o null si no era un número.
function roundToOneDecimal(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) return null;

    return Number(value.toFixed(1));
}



// summarizeTicket = «resumir el ticket»
// PURA. Un ticket ya entendido, con solo lo que interesa ver en el registro de la inferencia.
// Recibe: ticket (uno de los de parseModelResponse). Devuelve: { mesa, ticket, cronometro, tipo, listo }
function summarizeTicket(ticket) {
    return {
        mesa: ticket.mesa,
        ticket: ticket.ticket,
        cronometro: ticket.tiempo,
        tipo: ticket.tipo || '—',
        listo: ticket.listo,
    };
}



// buildRoundResult = «armar el resultado de la vuelta»
// PURA. El resultado de una vuelta, siempre con las mismas claves, acabe como acabe.
// Recibe: params (los de runInferenceOnce) y changes (las claves que cambian en este final).
// Devuelve: { ok, strip, strips, time, model, seconds, tickets, discarded, error, cause, text, imageKB }
function buildRoundResult(params, changes) {
    return {
        ok: false,
        strip: params.strip,
        strips: params.strips,

        // La hora es la de la FOTO, no la de cuando contesta el modelo: la toma de orden es
        // «hora − cronómetro», y el cronómetro es el de la foto.
        time: params.capture.time,

        model: params.server.model,
        seconds: 0,
        tickets: [],
        discarded: [],
        error: null,
        cause: null,
        text: '',
        imageKB: 0,
        ...changes,
    };
}



// getChatUrl = «obtener la dirección del chat»
// PURA. La dirección a la que viaja la imagen (solo para enseñarla en el registro).
// Recibe: baseUrl (la dirección del servidor de IA). Devuelve: el texto de la dirección.
function getChatUrl(baseUrl) {
    return `${baseUrl}/api/v1/chat`;
}



// LOS APUNTES DEL REGISTRO DE LA INFERENCIA (el panel lateral de desarrollo). Son los mismos de siempre:
// apunte 1 (la tira), 2 (el servidor), 3 (el envío), 4 (la respuesta), 5 (los tickets) y el FALLO.
// Todas reciben 'note' (la función que apunta) y no devuelven nada.
//
// CUIDADO CON LA CLAVE: dentro de 'server' viaja la clave del servidor de IA, y el registro se enseña
// en pantalla y se copia al portapapeles. Por eso los apuntes escriben el servidor CAMPO A CAMPO
// (direccion, modelo) y nunca el objeto entero: ni '...server', ni 'server' suelto, ni su JSON.


// noteStripToSend = «apuntar la tira que se va a mandar»
// Apuntes 1, 2 y 3: qué se va a leer, con qué servidor y qué modelo, y que sale la imagen.
// Recibe: note, params (los de runInferenceOnce), image (la tira, como data URL) e imageKB (lo que pesa).
function noteStripToSend(note, params, image, imageKB) {

    // Los parámetros de la vuelta, cada uno por su nombre (están traducidos en el «Recibe:» de runInferenceOnce).
    const { capture, strip, strips, server, timeoutMs } = params;

    // Apunte 1 · qué se va a leer
    note(TIPO.TIRA, `Tira ${strip + 1} de ${strips} · captura de las ${capture.time || '(sin hora)'}`, {
        imagenKB: imageKB,
        formato: image.slice(5, image.indexOf(';')),
    });

    // Apunte 2 · con qué servidor y qué modelo (se averiguó al abrir la ventana, con checkAiServer)
    note(TIPO.SERVIDOR, `Se lee con «${server.model}»`, { direccion: server.baseUrl, modelo: server.model });

    // Apunte 3 · sale la imagen
    note(TIPO.ENVIO, `Enviando la tira al modelo (${imageKB} KB)`, {
        direccion: getChatUrl(server.baseUrl),
        modelo: server.model,
        imagenKB: imageKB,
        letrasDelPrompt: INFERENCE_PROMPT.length,
        esperaMaximaSegundos: timeoutMs / 1000,
    });
}



// noteRequestFailed = «apuntar que la solicitud falló»
// Recibe: note, server ({ baseUrl, model }) y response (la de requestInference, con ok: false).
function noteRequestFailed(note, server, response) {

    // Cancelada (se desconectó la tablet o se pausó la IA): no es un fallo y no hay a quién avisar.
    if (response.cause === 'cancelled') {
        note(TIPO.TABLET, 'Lectura cancelada a mitad: se desconectó la tablet o se pausó la IA');
        return;
    }

    // FALLO · el motivo en español y, debajo, lo que dijo de verdad el servidor
    note(TIPO.FALLO, response.error, {
        direccion: getChatUrl(server.baseUrl),
        modelo: server.model || '(no se llegó a saber)',
        causa: response.cause,
        estadoHTTP: response.status ?? null,
        respuestaDelServidor: response.detail ?? null,
    });
}



// noteModelAnswer = «apuntar lo que contestó el modelo»
// Apunte 4: la respuesta tal cual, con lo que tardó y las estadísticas del servidor.
// Recibe: note, response (la de requestInference, con ok: true), text (su texto) y seconds (lo que tardó).
function noteModelAnswer(note, response, text, seconds) {

    // stats = «las estadísticas que da el servidor»
    const stats = response.stats ?? {};

    note(TIPO.RESPUESTA, `El modelo contestó en ${seconds.toFixed(1)} s`, {
        estadoHTTP: response.status ?? null,
        segundos: roundToOneDecimal(seconds),
        segundosHastaLaPrimeraLetra: roundToOneDecimal(stats.secondsToFirstToken),
        tokensDeEntrada: stats.inputTokens ?? null,
        tokensDeSalida: stats.outputTokens ?? null,
        tokensPorSegundo: roundToOneDecimal(stats.tokensPerSecond),
        texto: text || '(respuesta vacía)',
    });
}



// noteUnreadableAnswer = «apuntar que la respuesta no se entiende»
// FALLO: el modelo contestó, pero ahí no había una lista de tickets.
// Recibe: note y text (lo que contestó el modelo).
function noteUnreadableAnswer(note, text) {
    note(TIPO.FALLO, 'Respuesta ilegible: no se encontró una lista de tickets en lo que contestó', {
        seEsperaba: EXPECTED_FORMAT,
        seRecibio: text || '(nada)',
    });
}



// noteTicketsFound = «apuntar los tickets encontrados»
// Apunte 5: los tickets que salieron de esta tira, ya entendidos.
// Recibe: note y parsed (lo que devuelve parseModelResponse: { tickets, discarded }).
function noteTicketsFound(note, parsed) {

    // discardedForPanel = «los descartados, como los enseña el panel»: el panel los pinta tal cual, así que en español
    const discardedForPanel = [];

    for (const item of parsed.discarded) {
        discardedForPanel.push({ motivo: item.reason, loQueDijoElModelo: item.object });
    }

    note(TIPO.RESULTADO, `${parsed.tickets.length} tickets de esta tira · ${parsed.discarded.length} descartados`, {
        ticketsDeEstaTira: parsed.tickets.map(summarizeTicket),
        descartados: discardedForPanel,
    });
}



// runInferenceOnce = «dar una vuelta de inferencia»
// UNA vuelta completa: STEP 2 (recortar la tira), STEP 3 (mandarla al modelo) y STEP 4 (entender
// su respuesta). No toca React ni guarda nada: todo lo recibe y todo lo devuelve.
// Recibe: { capture: { blob, time, width },     la última captura de la tablet
//           strip, strips, overlap,              qué tira toca, de cuántas, y con cuánto solape
//           server: { baseUrl, apiKey, model },  el servidor de IA, su clave y el modelo (de checkAiServer)
//           timeoutMs, signal,                   cuánto se espera al modelo, y con qué se cancela
//           note }                               note(tipo, titulo, detalle): apunta en el registro de la inferencia
// Devuelve: { ok, strip, strips, time, model, seconds, tickets, discarded, error, cause, text, imageKB }
//   cause: los de requestInference ('network', 'cors', 'timeout', 'http', 'model-rejected', 'auth',
//          'no-url', 'cancelled'), 'unreadable' (contestó, pero ahí no había un array de tickets)
//          o 'unexpected'. Con 'auth' y 'no-url' quien llama para el bucle: insistir no arregla nada.
// NUNCA lanza: un fallo vuelve como { ok: false, error: 'texto en español', cause }.
// Lo que se apunta en el registro en cada paso está en las funciones 'note…' de aquí arriba.
async function runInferenceOnce(params) {

    // Los parámetros, cada uno por su nombre (están traducidos arriba, en el «Recibe:»).
    const { capture, strip, strips, overlap, server, timeoutMs, signal } = params;

    // note = «apuntar en el registro» (si no la pasan, no se apunta nada)
    const note = params.note ?? (() => {});

    try {
        // STEP 2 · de la última captura, la tira que toca
        // image = «la tira, como data URL»
        const image = await cropStrip(capture.blob, strips, overlap, strip);

        // imageKB = «lo que pesa la tira, en KB»
        const imageKB = Math.round(image.length / 1024);

        noteStripToSend(note, params, image, imageKB);
        console.log(`[IA] mandando imagen a ${server.model}: ${imageKB} KB`);

        // STEP 3 · la tira viaja al modelo; vuelve su texto
        // response = «la respuesta de la solicitud de inferencia»
        const response = await requestInference({
            baseUrl: server.baseUrl,

            // La clave va en la cabecera Authorization y no sale de aiServer.js: aquí solo se pasa.
            // Sin clave (LM Studio a secas) viene vacía y la cabecera no se manda.
            apiKey: server.apiKey,

            model: server.model,
            prompt: INFERENCE_PROMPT,
            image,
            timeoutMs,
            signal,
        });

        // Sin respuesta (falló, o se canceló): la vuelta acaba aquí, con su motivo.
        if (!response.ok) {
            noteRequestFailed(note, server, response);

            return buildRoundResult(params, {
                error: response.error,
                cause: response.cause,
                seconds: response.seconds ?? 0,
                imageKB,
            });
        }

        // text = «lo que contestó el modelo, tal cual»
        const text = response.text ?? '';

        // seconds = «lo que tardó el modelo en contestar»
        const seconds = response.seconds ?? 0;

        console.log(`[IA] ${response.stats?.outputTokens ?? '?'} tokens en ${seconds.toFixed(1)} s`);
        console.log(text);
        noteModelAnswer(note, response, text, seconds);

        // STEP 4 · del texto, el array de tickets
        // parsed = «la respuesta ya entendida»
        const parsed = parseModelResponse(text);

        // Ilegible NO es lo mismo que una pantalla vacía: la vuelta se descarta entera, para que
        // quien llama no borre de la parrilla las mesas que siguen en pantalla.
        if (!parsed.readable) {
            noteUnreadableAnswer(note, text);

            return buildRoundResult(params, {
                error: 'respuesta ilegible',
                cause: 'unreadable',
                seconds,
                text,
                imageKB,
            });
        }

        noteTicketsFound(note, parsed);

        return buildRoundResult(params, {
            ok: true,
            seconds,
            tickets: parsed.tickets,
            discarded: parsed.discarded,
            text,
            imageKB,
        });
    }
    catch (error) {
        // Aquí solo se llega por algo que no se esperaba (por ejemplo, una captura que no se deja recortar).
        console.log(error);

        // reason = «el motivo, en español»
        const reason = `no se pudo leer la tira: ${error?.message ?? error}`;

        note(TIPO.FALLO, reason, { mensajeOriginal: error?.message ?? null });

        return buildRoundResult(params, { error: reason, cause: 'unexpected' });
    }
}



// startInferenceLoop = «arrancar el bucle de inferencia»
// EL BUCLE RECURSIVO. No sabe qué es una tablet ni una IA: solo da vueltas llamando a 'runOnce'.
// CADA VUELTA EMPIEZA CUANDO HA TERMINADO LA ANTERIOR: nunca hay dos en vuelo. El ritmo lo pone
// lo que tarde 'runOnce' (el servidor de IA), no un reloj.
// Recibe: { runOnce: async () => ({ ok }),      la vuelta; si devuelve ok: false o lanza, es una vuelta fallida
//           pauseAfterErrorMs = 5000,            cuánto se espera tras una vuelta fallida
//           pauseBetweenRoundsMs = 0 }           cuánto se espera tras una vuelta buena
// Devuelve: { stop: () => void,                 para el bucle (aunque haya una vuelta en vuelo, ya no programa otra)
//             getRounds: () => number }          cuántas vueltas han terminado
function startInferenceLoop(options) {

    // Las opciones, cada una por su nombre (están traducidas arriba, en el «Recibe:»).
    const {
        runOnce,
        pauseAfterErrorMs = DEFAULT_PAUSE_AFTER_ERROR_MS,
        pauseBetweenRoundsMs = DEFAULT_PAUSE_BETWEEN_ROUNDS_MS,
    } = options;

    // running = «el bucle sigue en marcha»
    let running = true;

    // rounds = «las vueltas terminadas»
    let rounds = 0;

    // timer = «el temporizador de la vuelta siguiente»
    let timer = null;


    // nextRound = «la vuelta siguiente»
    // Da una vuelta y, al terminarla, se programa a sí misma.
    const nextRound = async () => {
        if (!running) return;

        // roundWentWell = «la vuelta salió bien»
        let roundWentWell = false;

        try {
            // result = «el resultado de la vuelta»
            const result = await runOnce();

            roundWentWell = result?.ok === true;
        }
        catch (error) {
            // Una vuelta que lanza no mata el bucle: cuenta como fallida y se sigue.
            console.log(error);
        }

        rounds = rounds + 1;

        // Pudieron parar el bucle mientras se esperaba a esta vuelta: ya no se programa otra.
        if (!running) return;

        // pause = «la pausa antes de la vuelta siguiente»
        const pause = roundWentWell ? pauseBetweenRoundsMs : pauseAfterErrorMs;

        // LA RECURSIÓN: la vuelta siguiente la lanza setTimeout, y no un 'await nextRound()' aquí dentro. Así esta
        // llamada TERMINA antes de empezar la otra, y ni la pila ni la cadena de promesas crecen aunque dure horas.
        timer = setTimeout(nextRound, pause);
    };


    // stop = «parar el bucle»
    const stop = () => {
        running = false;
        clearTimeout(timer);
    };


    // getRounds = «obtener las vueltas terminadas»
    const getRounds = () => {
        return rounds;
    };


    // La primera vuelta también la lanza setTimeout: así un stop() inmediato la cancela antes de empezar.
    timer = setTimeout(nextRound, 0);

    return { stop, getRounds };
}



export { runInferenceOnce, startInferenceLoop };
