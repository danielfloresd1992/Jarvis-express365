// LOS AJUSTES DEL SERVIDOR DE IA: SU DIRECCIÓN, SU CLAVE Y CON QUÉ MODELO LEER
//
//   normalizeBaseUrl        deja la dirección como la espera aiServer.js
//   maskApiKey              tapa la clave para poder enseñar que la hay sin enseñarla
//   readAiSettings          los tres datos, tal como están guardados en ESTE equipo
//   saveAiSettings          los guarda y avisa a todas las ventanas
//   clearAiSettings         los borra y avisa igual
//   subscribeToAiSettings   avisa cuando cambian, aquí y en las otras ventanas
//
// Antes la dirección venía de VITE_AI_URL, que se hornea al construir: en la aplicación
// instalada del restaurante nadie podía cambiarla sin volver a compilar. Desde el menú de
// Opciones, sí. Aquí se guardan las tres cosas que se eligen en ese menú.
//
// EL MODELO ES OPCIONAL, y vacío no es un olvido: vacío significa «el que elija el servidor»,
// que es lo que hacía la aplicación antes de que se pudiera elegir. Se guarda por NOMBRE y no
// por posición en la lista, porque esa lista cambia cada vez que se monta o se descarga uno.
// Un nombre guardado que ya no esté cargado no se borra solo: se lee con otro y se avisa, que
// es más útil que perder en silencio la elección de quien la hizo.
//
// Ninguna de estas funciones lanza. Sin acceso al almacenamiento —una ventana privada, el
// navegador con las cookies bloqueadas— se trabaja como si no hubiera nada guardado.
//
// CÓMO SE ENTERA LA OTRA VENTANA. El navegador dispara su evento 'storage' en las demás ventanas
// del mismo origen, pero SOLO si el texto guardado cambia: volver a escribir lo mismo no avisa a
// nadie. Y darle a «Guardar» con los mismos ajustes es justo lo que hace el operador para pedir
// que se vuelva a intentar la conexión. Por eso lo guardado lleva además un sello, 'guardadoEn',
// que nunca se repite: así el texto SIEMPRE cambia y el aviso SIEMPRE sale.



// AI_SETTINGS_KEY = «la llave con la que se guardan los ajustes»
// Se exporta para las pruebas: son las que plantan y miran a mano lo que hay guardado. La
// aplicación no la usa en ningún sitio, que para eso están readAiSettings y saveAiSettings.
const AI_SETTINGS_KEY = 'ia:servidor';

// AI_SETTINGS_EVENT = «el aviso propio de que los ajustes han cambiado»
// El evento 'storage' del navegador avisa a las OTRAS ventanas del mismo origen, pero NO a la
// que escribió. Para esa se emite este, a mano, desde saveAiSettings y clearAiSettings.
const AI_SETTINGS_EVENT = 'ia:servidor-cambiado';

// EMPTY_SETTINGS = «los ajustes vacíos»
// readAiSettings devuelve una COPIA de esto cuando no hay nada: quien la reciba puede tocarla.
const EMPTY_SETTINGS = { url: '', apiKey: '', model: '' };

// ANY_PROTOCOL_WORDS = «el protocolo del principio, sea el que sea»
// Pide al menos una barra detrás de los dos puntos, y por eso NO se lleva por delante el puerto
// de 'localhost:3010'. Vale también para uno mal escrito ('http:/casa') o equivocado ('ftp://casa').
const ANY_PROTOCOL_WORDS = /^[a-z][a-z0-9+.-]*:\/+/i;

// SECURE_PROTOCOL_WORDS = «con qué empieza una dirección que pidió https»
const SECURE_PROTOCOL_WORDS = /^https:\/+/i;

// API_PATH_WORDS = «la ruta que se pega de más al final de la dirección»
// Lo que se escribe en Opciones es la BASE: el '/api/v1' lo pone aiServer.js. Si alguien copia
// la dirección entera de la barra del navegador, se le quita aquí en vez de fallar luego.
const API_PATH_WORDS = /\/api\/v1(\/(models|chat))?\/*$/i;

// TRAILING_SLASHES = «las barras del final»
const TRAILING_SLASHES = /\/+$/;

// ONLY_SLASHES_AND_COLONS = «lo escrito son solo barras y dos puntos: no hay servidor ninguno»
// Lo que queda de 'http://', '//' o '://' cuando se les quita el protocolo: nada.
const ONLY_SLASHES_AND_COLONS = /^[/:]*$/;

// KEY_HEAD_LETTERS = «cuántas letras de la clave se enseñan por delante»
const KEY_HEAD_LETTERS = 6;

// KEY_TAIL_LETTERS = «cuántas letras de la clave se enseñan por detrás»
const KEY_TAIL_LETTERS = 4;

// MINIMUM_KEY_LETTERS = «desde cuántas letras se puede enseñar un trozo»
// El TRIPLE de las que se enseñarían: así nunca se ve más de un tercio de la clave. Con el mínimo
// pegado al trozo enseñado, una clave de doce letras salía con diez a la vista, que es regalarla.
// Una clave corta —las que se escriben a mano— se tapa entera, que es lo que hay que hacer con ella.
const MINIMUM_KEY_LETTERS = (KEY_HEAD_LETTERS + KEY_TAIL_LETTERS) * 3;

// HIDDEN_KEY = «la clave tapada del todo»
// Siempre los mismos puntos, y sin decir cuántas letras tiene: el largo también es una pista.
const HIDDEN_KEY = '••••••••';



// normalizeBaseUrl = «normalizar la dirección base»
// PURA. Deja escrita la dirección como la espera aiServer.js, que le pega '/api/v1/models' detrás.
// Quita los espacios, pone 'http://' si no hay protocolo, baja el servidor a minúsculas, quita
// la barra final y quita un '/api/v1' pegado por error.
// Recibe: text (lo que se escribió en el campo de Opciones; puede venir vacío o no ser un texto).
// Devuelve: '  LOCALHOST:3010/api/v1/ ' -> 'http://localhost:3010'. Sin nada escrito, ''.
function normalizeBaseUrl(text) {

    // typed = «lo que se escribió, y solo su PRIMER trozo»
    // Se quitan los espacios de los extremos —una dirección pegada de un mensaje trae saltos de
    // línea— pero lo que venga DETRÁS de un espacio no es parte de la dirección y se tira: pegando
    // de golpe la dirección y la clave, juntarlas haría una URL válida con la clave metida dentro,
    // y esa clave acabaría viajando en la ruta de cada petición y apuntada en el registro.
    const typed = String(text ?? '').trim().split(/\s+/)[0];

    if (typed === '') return '';

    // server = «lo escrito sin el protocolo»
    // Se le quita el que traiga para ponerle uno bueno: así 'ftp://casa' o 'http:/casa' —los dos
    // errores de escritura de siempre— acaban apuntando a donde se quería.
    const server = typed.replace(ANY_PROTOCOL_WORDS, '');

    // Si lo escrito son solo barras y dos puntos ('//', '://', 'http://' a secas), no hay servidor
    // ninguno: mejor vacío, que es «todavía no hay dirección», que un 'http:' que no dice nada.
    if (ONLY_SLASHES_AND_COLONS.test(server)) return '';

    // protocol = «el protocolo»
    // Sin él, 'localhost:3010' se leería como el protocolo 'localhost:' y no como un servidor.
    // Se respeta el https de quien lo escribió; en todo lo demás, http, que es lo que habla LM Studio.
    let protocol = 'http';
    if (SECURE_PROTOCOL_WORDS.test(typed)) protocol = 'https';

    // withProtocol = «la dirección con su protocolo»
    const withProtocol = `${protocol}://${server}`;

    try {
        // parsed = «la dirección ya entendida»
        // De paso baja el servidor a minúsculas, quita el puerto de siempre (:80, :443) y suelta
        // la pregunta, el ancla y el usuario:contraseña, que no pintan nada en una dirección base.
        const parsed = new URL(withProtocol);

        // path = «la ruta», sin el '/api/v1' de más ni las barras del final
        // El resto de la ruta SÍ se conserva: detrás de un proxy el servidor puede colgar de
        // 'https://casa/ia', y quitarle el '/ia' lo dejaría apuntando a ningún sitio.
        const path = parsed.pathname.replace(API_PATH_WORDS, '').replace(TRAILING_SLASHES, '');

        return `${parsed.origin}${path}`;
    }
    catch (error) {
        // Lo escrito no es una dirección que el navegador sepa leer ('http://' a secas, 'http://:80'…).
        // Se devuelve limpia igualmente, sin lanzar: así la pantalla de Opciones enseña debajo del
        // campo lo que se va a usar de verdad y se ve el error de escritura.
        return withProtocol.replace(API_PATH_WORDS, '').replace(TRAILING_SLASHES, '');
    }
}



// maskApiKey = «tapar la clave»
// PURA. Para poder enseñar en Opciones que hay una clave guardada SIN volver a enseñarla.
// NUNCA devuelve la clave entera: ni el texto devuelto es la clave, ni la lleva dentro.
// Recibe: apiKey (la clave guardada, o nada).
// Devuelve: 'sk-abc…c4f2'. Con una clave corta, solo los puntos. Sin clave, ''.
function maskApiKey(apiKey) {

    // key = «la clave, sin espacios de sobra»
    const key = String(apiKey ?? '').trim();

    if (key === '') return '';

    // Una clave corta no se puede enseñar a trozos sin regalarla: se tapa entera.
    if (key.length < MINIMUM_KEY_LETTERS) return HIDDEN_KEY;

    // head = «el principio de la clave», para reconocer cuál es de un vistazo ('sk-abc…')
    const head = key.slice(0, KEY_HEAD_LETTERS);

    // tail = «el final de la clave», para distinguir dos claves que empiezan igual
    const tail = key.slice(-KEY_TAIL_LETTERS);

    return `${head}…${tail}`;
}



// notifySettingsChange = «avisar de que los ajustes han cambiado»
// Solo para ESTA ventana. A las otras del mismo origen —la flotante de la tablet es otra ventana
// de Electron, mismo origen— ya las avisa solo el evento 'storage' del navegador, que en cambio
// NO dispara en la ventana que escribió.
// El aviso va VACÍO a propósito: la clave no viaja dentro de ningún evento. Quien la necesite la
// lee con readAiSettings.
function notifySettingsChange() {

    // En Node (las pruebas) no hay ventana a la que avisar.
    if (typeof window === 'undefined') return;

    try {
        window.dispatchEvent(new CustomEvent(AI_SETTINGS_EVENT));
    }
    catch (error) {
        console.log(error);
    }
}



// readAiSettings = «leer los ajustes de la IA»
// Los tres datos tal como están guardados en ESTE equipo. NUNCA lanza y NUNCA devuelve null:
// sin nada guardado, los tres vienen vacíos y quien llama no tiene que comprobar nada más.
// La dirección se vuelve a normalizar al leerla, por si la escribió una versión anterior.
// El modelo vacío es lo que leen los equipos guardados por una versión anterior a poder elegirlo:
// vacío es «el que elija el servidor», que es justo lo que hacían.
// Devuelve: { url: 'http://localhost:3010', apiKey: 'sk-…', model: 'gemma-4-12B…gguf' }
function readAiSettings() {
    try {
        // saved = «lo guardado, tal cual»
        const saved = localStorage.getItem(AI_SETTINGS_KEY);
        if (!saved) return { ...EMPTY_SETTINGS };

        // settings = «los ajustes»
        const settings = JSON.parse(saved);

        return {
            url: normalizeBaseUrl(settings?.url),
            apiKey: String(settings?.apiKey ?? '').trim(),
            model: String(settings?.model ?? '').trim()
        };
    }
    catch (error) {
        // Ventana privada, almacenamiento bloqueado o un texto roto a mano. No se apunta en la
        // consola: esto se lee en cada pintado y llenaría la consola de lo mismo.
        return { ...EMPTY_SETTINGS };
    }
}



// lastSaveStamp = «el sello del último guardado»
let lastSaveStamp = 0;

// nextSaveStamp = «el sello del guardado siguiente»
// La hora de ahora, pero sin repetirse NUNCA: dos clics en el mismo milisegundo darían el mismo
// sello, el texto guardado no cambiaría y las otras ventanas no se enterarían.
// Devuelve: un número mayor que el del guardado anterior.
function nextSaveStamp() {

    // now = «la hora de ahora»
    const now = Date.now();

    if (now > lastSaveStamp) lastSaveStamp = now;
    else lastSaveStamp = lastSaveStamp + 1;

    return lastSaveStamp;
}



// saveAiSettings = «guardar los ajustes de la IA»
// Normaliza la dirección, guarda los dos datos y AVISA: a esta ventana con el aviso propio y a
// las demás con el evento 'storage' del navegador.
// Recibe: { url (la dirección base, como se escribió), apiKey (la clave, tal cual) y model (el
//          nombre del modelo elegido; vacío = el que elija el servidor) }
// Devuelve: lo que quedó guardado, { url, apiKey, model }, para pintarlo sin volver a leer.
function saveAiSettings({ url, apiKey, model } = {}) {

    // settings = «los ajustes ya limpios»
    const settings = {
        url: normalizeBaseUrl(url),
        apiKey: String(apiKey ?? '').trim(),
        model: String(model ?? '').trim()
    };

    try {
        // Con el sello, el texto guardado cambia SIEMPRE. Sin él, volver a guardar lo mismo no
        // dispara el evento 'storage' del navegador y la ventana de la tablet no se entera: se
        // quedaría con la clave rechazada para siempre aunque el servidor ya la acepte de nuevo.
        // readAiSettings solo mira 'url' y 'apiKey', así que el sello no le estorba a nadie.
        localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify({ ...settings, guardadoEn: nextSaveStamp() }));
    }
    catch (error) {
        // En una ventana privada no se puede guardar. Se apunta el fallo —nunca la clave: esto es
        // un error del almacenamiento, no los datos— y se avisa igual, para que quien escuche
        // vuelva a leer y vea que no hay nada, en vez de seguir con una dirección que no se guardó.
        // Quien enseñe un «guardado» tiene que comprobarlo LEYENDO: aquí no se puede lanzar.
        console.log(error);
    }

    // Se avisa siempre, aunque no haya cambiado nada: darle a «Guardar» con lo mismo es, de hecho,
    // la forma de pedir que se vuelva a intentar la conexión.
    notifySettingsChange();

    return settings;
}



// clearAiSettings = «borrar los ajustes de la IA»
// Se van los dos a la vez: una clave sin dirección no sirve de nada, y es lo que espera quien le
// da al botón de borrar («que no quede nada de esto en este equipo»).
// Devuelve: los ajustes vacíos, para dejar los campos en blanco sin volver a leer.
function clearAiSettings() {
    try {
        // Borrar algo que estaba sí dispara el 'storage' de las otras ventanas. Y borrar cuando no
        // había nada no cambia nada, que es justo lo que las otras ventanas ya tienen: sin dirección.
        localStorage.removeItem(AI_SETTINGS_KEY);
    }
    catch (error) {
        console.log(error);
    }

    notifySettingsChange();

    return { ...EMPTY_SETTINGS };
}



// subscribeToAiSettings = «avisarme cuando cambien los ajustes de la IA»
// Avisa vengan de donde vengan los cambios, que es lo que hace falta para no tener que reabrir la
// ventana flotante al cambiar la clave:
//   · 'storage'          los cambió OTRA ventana del mismo origen (la principal, desde Opciones)
//   · el aviso propio    los cambió ESTA
// Recibe: listener (se le llama con los ajustes de ese momento, ya leídos: { url, apiKey }).
// Devuelve: la función con la que se deja de escuchar; va en la limpieza del useEffect.
function subscribeToAiSettings(listener) {

    // Fuera del navegador, o sin nadie a quien avisar, se devuelve una baja que no hace nada: así
    // quien llama puede llamarla siempre sin comprobar nada.
    if (typeof window === 'undefined' || typeof listener !== 'function') return () => {};

    // onSettingsChange = «qué hacer cuando cambian»
    const onSettingsChange = (event) => {

        // El evento 'storage' llega por CUALQUIER dato del origen —el local, el reparto de la
        // ventana—, así que se mira cuál cambió. Sin llave es que se vació el almacenamiento
        // entero, y eso sí nos toca.
        if (event?.type === 'storage' && typeof event.key === 'string' && event.key !== AI_SETTINGS_KEY) return;

        listener(readAiSettings());
    };

    window.addEventListener('storage', onSettingsChange);
    window.addEventListener(AI_SETTINGS_EVENT, onSettingsChange);

    return () => {
        window.removeEventListener('storage', onSettingsChange);
        window.removeEventListener(AI_SETTINGS_EVENT, onSettingsChange);
    };
}



export { AI_SETTINGS_KEY, normalizeBaseUrl, maskApiKey, readAiSettings, saveAiSettings, clearAiSettings, subscribeToAiSettings };
