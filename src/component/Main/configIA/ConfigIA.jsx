import { useState, useEffect, useRef } from 'react';
import './ConfigIA.css';
import { normalizeBaseUrl, readAiSettings, saveAiSettings, clearAiSettings, maskApiKey } from '../../../libs/inference/aiSettings.js';
import { checkAiServer } from '../../../libs/inference/aiServer.js';



/*  ─────────────────────────────────────────────────────────────────────────────
 *  OPCIONES → SERVIDOR DE IA
 *
 *  Aquí se escriben los DOS datos con los que la aplicación habla con la IA: la
 *  dirección del servidor y la clave de acceso.
 *
 *  Antes vivían en el .env (VITE_AI_URL), y eso los horneaba al compilar: en el
 *  restaurante, cambiar de servidor obligaba a volver a publicar la aplicación
 *  entera. Escritos aquí, se cambian donde se usan y sin tocar nada más.
 *
 *  Este archivo SOLO PINTA Y PIDE. Guardar, leer y avisar a las demás ventanas es
 *  cosa de 'libs/inference/aiSettings.js'; hablar con el servidor, de
 *  'libs/inference/aiServer.js'. La ventana flotante de la tablet no hay que
 *  reabrirla: está suscrita a los ajustes y rehace su primera consulta sola.
 *
 *  Cinco cosas que no son evidentes y están puestas a propósito:
 *
 *    · La clave GUARDADA no se vuelve a pintar entera. Se enseña enmascarada y,
 *      para poner otra, hay que darle a «Cambiar». Así una pantalla compartida no
 *      la enseña, y nadie se la lleva por delante al rozar el campo.
 *
 *    · Debajo de la dirección se enseña la que DE VERDAD se va a usar, ya
 *      normalizada. Un «localhost:1235» sin protocolo, o un '/api/v1' pegado de
 *      más, se ven ANTES de guardar, y no como un «sin conexión» media hora después.
 *
 *    · «Probar conexión» prueba LO QUE HAY EN PANTALLA, no lo guardado. Es lo que
 *      se quiere al teclear una dirección nueva: saber si sirve antes de dejarla.
 *
 *    · Pero la CLAVE guardada es de la DIRECCIÓN guardada, y a otra dirección no se
 *      le manda: si no, teclear una dirección cualquiera y darle a «Probar conexión»
 *      le entregaría la clave del restaurante a ese servidor en tres clics. Para
 *      probar o guardar otro servidor hay que escribir la clave de ese servidor.
 *
 *    · La lista de modelos es la de la dirección que hay ESCRITA. Se pide al abrir el
 *      menú y con «Probar conexión», y se vacía en cuanto se teclea otra dirección:
 *      enseñar los modelos de un servidor mientras se escribe otro es ofrecer a elegir
 *      algo que el nuevo no tiene. Sin elegir ninguno lee el que elija el servidor,
 *      que es lo que hacía la aplicación antes de que esto se pudiera tocar.
 *  ───────────────────────────────────────────────────────────────────────────── */



// URL_PLACEHOLDER = «el ejemplo de dirección»
// La base, SIN '/api/v1': esa parte la pone sola la aplicación al llamar.
const URL_PLACEHOLDER = 'http://192.168.1.50:1235';

// KEY_WORDS = «lo que parece una clave y no una dirección»
// Un 'sk-' o una tirada larga de letras y números seguidos. En la dirección de un servidor no hay
// nada de eso; en una clave pegada por error dentro del campo de la dirección, sí.
const KEY_WORDS = /sk-|[a-z0-9]{24,}/i;



// describeCheck = «describir el resultado de la consulta»
// PURA. Traduce lo que devolvió checkAiServer al aviso que se lee bajo los botones.
// Recibe: result ({ active: true, model, models, ms } o { active: false, cause, error, ms }).
// Devuelve: { kind: 'ok' | 'error', text }
function describeCheck(result) {

    // El servidor no contestó, o contestó que no: el motivo ya viene escrito en español.
    if (!result?.active) {
        return { kind: 'error', text: result?.error ?? 'el servidor de IA no contestó' };
    }

    //  El modelo que se eligió ya no está cargado: eso se dice ENTERO y como aviso, porque si no
    //  la pantalla enseñaría uno elegido arriba y leería con otro sin que nada lo explicara.
    if (result.missingPreferred) {
        return {
            kind: 'error',
            text: `conectado en ${result.ms} ms, pero «${result.missingPreferred}» ya no está cargado en ese ` +
                `servidor: leerá con «${result.model}». Elige otro abajo y guarda`
        };
    }

    //  El elegido está cargado pero no ve, y hay otros que sí: se leerá con otro, y se dice con cuál.
    //  (Que NINGUNO vea ya no llega aquí: checkAiServer lo devuelve como no activo, con su texto, y
    //  sale por la rama de arriba como error. Antes salía «conectado, 2 modelos» y parecía listo.)
    if (result.blindPreferred) {
        return {
            kind: 'error',
            text: `conectado en ${result.ms} ms, pero «${result.blindPreferred}» no mira imágenes: leerá con ` +
                `«${result.model}». Elige abajo uno que vea y guarda`
        };
    }

    // text = «el texto del aviso»
    let text = `conectado en ${result.ms} ms. Leerá los tickets con «${result.model}»`;

    // extraModels = «cuántos modelos más tiene cargados»
    const extraModels = Array.isArray(result.models) ? result.models.length - 1 : 0;

    if (extraModels === 1) text = `${text}, y tiene 1 modelo más`;
    if (extraModels > 1) text = `${text}, y tiene ${extraModels} modelos más`;

    return { kind: 'ok', text };
}



// findUrlWarning = «buscar lo que está mal escrito en la dirección»
// PURA. Lo que se avisa bajo el campo de la dirección cuando lo tecleado no es solo una dirección.
// El caso de verdad: pegar de un mensaje la dirección y la clave juntas. De eso solo se usa el
// primer trozo, y hay que decirlo, porque la clave NO puede acabar dentro de la dirección.
// Recibe: text (lo tecleado, tal cual) y url (esa misma dirección ya normalizada).
// Devuelve: el aviso, o '' si no hay nada que avisar.
function findUrlWarning(text, url) {

    // typed = «lo tecleado, sin los espacios de los extremos»
    const typed = String(text ?? '').trim();

    if (typed === '') return '';

    if (/\s/.test(typed)) {
        return 'solo se usa lo de antes del primer espacio: si lo de detrás es la clave, va en el campo de abajo';
    }

    if (KEY_WORDS.test(url)) {
        return 'esa dirección parece llevar una clave dentro: la clave va en el campo de abajo, nunca en la dirección';
    }

    return '';
}



// ConfigIA = «configuración de la IA»
// El menú de «Configuración → Servidor de IA», dentro del área principal de la ruta 'home'.
function ConfigIA() {

    // savedSettings = «los ajustes tal como están guardados en este equipo»
    // Se leen UNA vez, con el inicializador de useState: hacerlo en cada dibujado tocaría
    // localStorage sin motivo. Vuelven a escribirse al guardar y al borrar.
    const [savedSettings, setSavedSettings] = useState(readAiSettings);

    // urlText = «la dirección, tal como se está escribiendo»
    const [urlText, setUrlText] = useState(savedSettings.url);

    // modelChoice = «el modelo elegido», por su nombre. '' = el que elija el servidor.
    // Por NOMBRE y no por su sitio en la lista: esa lista cambia cada vez que alguien monta o
    // descarga un modelo, y guardar «el segundo» acabaría leyendo con otro sin tocar nada.
    const [modelChoice, setModelChoice] = useState(savedSettings.model);

    // models = «los modelos que contestó el servidor», por nombre
    const [models, setModels] = useState([]);

    // visionModels = «de esos, los que saben mirar imágenes»
    // Es el dato que decide si la tablet va a poder leer o no: un servidor con dos modelos
    // cargados y ninguno que vea se enseñaba como «2 modelos cargados» y parecía listo.
    const [visionModels, setVisionModels] = useState([]);

    // reportsVision = «el servidor dijo, modelo a modelo, si ve»
    // Sin esto, un LM Studio que conteste en la forma de OpenAI —que no dice quién ve— saldría con
    // todos sus modelos marcados «no ve imágenes» y el aviso rojo, y sí que lee. Lo que no se sabe
    // no se etiqueta.
    const [reportsVision, setReportsVision] = useState(false);

    // modelsFrom = «de qué dirección salió esa lista»
    // Se guarda para poder comparar: sin esto, cambiar la dirección dejaría en pantalla los
    // modelos del servidor anterior y elegir uno de ahí sería elegir algo que el nuevo no tiene.
    const [modelsFrom, setModelsFrom] = useState('');

    // apiKeyInput = «el campo donde se escribe la clave nueva»
    // Ese campo va SIN controlar a propósito, y por eso no hay un estado con la clave a medio
    // escribir: en un campo controlado React copia lo tecleado al atributo 'value' del HTML, y la
    // clave sale en crudo en cualquier copia del DOM (una captura de la página, un informe de
    // error). Se escribe una vez y no hace falta volver a pintarla: se lee del campo al usarla.
    const apiKeyInput = useRef(null);

    // editingKey = «se está escribiendo una clave nueva»
    // Sin clave guardada nace en true: no hay nada que enmascarar y el campo sale directo.
    const [editingKey, setEditingKey] = useState(savedSettings.apiKey === '');

    // notice = «el aviso de abajo»: { kind: 'ok' | 'error' | 'info', text }
    const [notice, setNotice] = useState(null);

    // checking = «se está probando la conexión»
    const [checking, setChecking] = useState(false);

    // checkAbort = «con qué cancelar la prueba en vuelo»
    const checkAbort = useRef(null);

    // isMounted = «el menú sigue en pantalla»
    // Una consulta tarda hasta 10 s: sin esto, salir del menú antes dejaría a la respuesta
    // escribiendo en un componente que ya no existe.
    const isMounted = useRef(true);


    // Al cerrar el menú se cancela la prueba que estuviera en vuelo.
    useEffect(() => {
        isMounted.current = true;

        return () => {
            isMounted.current = false;
            checkAbort.current?.abort();
        };
    }, []);


    // normalizedUrl = «la dirección que de verdad se va a usar»
    // Se recalcula en cada tecla a propósito: es lo que se enseña bajo el campo.
    const normalizedUrl = normalizeBaseUrl(urlText);

    // usesHttps = «la dirección va por https»
    const usesHttps = normalizedUrl.startsWith('https:');

    // urlWarning = «lo que está mal escrito en la dirección», o '' si está bien
    const urlWarning = findUrlWarning(urlText, normalizedUrl);

    // keyIsForAnotherServer = «la clave guardada no es de la dirección que hay escrita»
    // Mientras esto sea cierto, la clave guardada no se manda ni se vuelve a guardar: hay que
    // escribir la de este servidor. Se dice debajo del campo, para que no sea una sorpresa.
    const keyIsForAnotherServer = savedSettings.apiKey !== '' && normalizedUrl !== savedSettings.url;

    // listIsForThisUrl = «la lista de modelos que hay es la de la dirección escrita»
    const listIsForThisUrl = modelsFrom !== '' && modelsFrom === normalizedUrl;

    // choiceIsMissing = «el modelo elegido no está entre los que contestó este servidor»
    // No se quita solo de la elección: se avisa y se deja, porque el modelo puede volver a
    // montarse. Quien lee es checkAiServer, que ante uno que no está usa otro y lo dice.
    const choiceIsMissing = listIsForThisUrl && modelChoice !== '' && !models.includes(modelChoice);

    // choiceIsBlind = «el modelo elegido está cargado pero no mira imágenes, y hay otros que sí»
    // Es una pista PERMANENTE, como la de choiceIsMissing, y no solo el aviso de «Probar conexión»:
    // al abrir el menú la consulta va en silencio, y sin esto nadie veía que ese elegido no se iba
    // a usar. Solo cuando el servidor dijo quién ve: lo que no se sabe no se avisa.
    const choiceIsBlind = listIsForThisUrl && reportsVision && visionModels.length > 0
        && modelChoice !== '' && models.includes(modelChoice) && !visionModels.includes(modelChoice);


    // readTypedKey = «leer la clave que se está escribiendo»
    // Devuelve: lo que hay en el campo, sin espacios. '' si el campo no está en pantalla.
    const readTypedKey = () => String(apiKeyInput.current?.value ?? '').trim();


    // clearTypedKey = «vaciar el campo de la clave»
    const clearTypedKey = () => {
        if (apiKeyInput.current) apiKeyInput.current.value = '';
    };


    // getApiKeyToUse = «obtener la clave con la que trabajar»
    // La que se está escribiendo; si no se está escribiendo ninguna, la guardada.
    // Devuelve: la clave, o '' si no hay ninguna que valga para la dirección que hay escrita.
    const getApiKeyToUse = () => {

        // typedKey = «la clave que se está escribiendo»
        const typedKey = readTypedKey();

        if (editingKey && typedKey !== '') return typedKey;

        //  El campo vacío NO significa «quítala»: darle a «Cambiar», arrepentirse y darle a
        //  «Guardar» dejaba el equipo sin clave y sin decir ni una palabra. Para quitarla está «Borrar».

        //  Y la clave guardada es de la dirección guardada: a otra no se le manda sin volver a
        //  escribirla. Si no, teclear otra dirección y darle a «Probar conexión» se la regala.
        if (normalizedUrl !== savedSettings.url) return '';

        return savedSettings.apiKey;
    };


    // startKeyChange = «empezar a cambiar la clave»
    const startKeyChange = () => {
        setEditingKey(true);
    };


    // cancelKeyChange = «dejar la clave guardada como estaba»
    const cancelKeyChange = () => {
        clearTypedKey();
        setEditingKey(false);
    };


    // cancelCheck = «cancelar la prueba de conexión que estuviera en vuelo»
    // Una respuesta que llega tarde ya no habla de estos ajustes: sin esto, el «conectado» de una
    // prueba pedida hace seis segundos se escribía encima del «borrados» que acababa de salir.
    const cancelCheck = () => {
        checkAbort.current?.abort();
        checkAbort.current = null;
        setChecking(false);
    };


    // saveSettings = «guardar los ajustes»
    const saveSettings = () => {

        cancelCheck();

        // keyToUse = «la clave que se va a guardar»
        const keyToUse = getApiKeyToUse();

        // dropsSavedKey = «se guarda sin la clave que había»: la dirección es otra y no se ha
        // escrito la de este servidor. Guardar no puede llevarse la clave de un servidor a otro.
        const dropsSavedKey = savedSettings.apiKey !== '' && keyToUse === '';

        // saved = «lo que se pidió guardar», ya normalizado por el almacén. saveAiSettings no lanza.
        const saved = saveAiSettings({ url: urlText, apiKey: keyToUse, model: modelChoice });

        // inThisComputer = «lo que de verdad quedó guardado en este equipo»
        // En una ventana privada no se puede escribir y el almacén NO lanza: la única forma de
        // saber si quedó algo es volver a leerlo. Antes se decía «guardado» sin haber guardado nada.
        const inThisComputer = readAiSettings();

        // stored = «quedó guardado de verdad»
        const stored = inThisComputer.url === saved.url
            && inThisComputer.apiKey === saved.apiKey
            && inThisComputer.model === saved.model;

        setSavedSettings(inThisComputer);
        setUrlText(saved.url);
        setModelChoice(inThisComputer.model);
        setEditingKey(inThisComputer.apiKey === '');

        // La clave tecleada ya está en el almacén: fuera del campo, que no siga en pantalla. Si no
        // se pudo guardar se deja escrita, porque si no se pierde sin haber servido de nada.
        if (stored) clearTypedKey();

        if (!stored) {
            setNotice({
                kind: 'error',
                text: 'este navegador no deja guardar nada (ventana privada o almacenamiento bloqueado): ' +
                    'no ha quedado nada en el equipo y la tablet no va a leer'
            });
            return;
        }

        if (saved.url === '') {
            setNotice({ kind: 'error', text: 'guardado, pero sin dirección no se puede leer ningún ticket' });
            return;
        }

        if (dropsSavedKey) {
            setNotice({
                kind: 'error',
                text: `guardado en ${saved.url}, pero SIN clave: la que había era de otra dirección. ` +
                    'Escribe la de este servidor y vuelve a guardar'
            });
            return;
        }

        //  Se guardó un modelo que está cargado pero no ve: se guarda igual —es lo que se pidió— pero
        //  el aviso no puede decir «leerá con él», porque no es verdad: la tablet leerá con otro que sí
        //  vea, o con ninguno. Antes salía en verde y la pantalla se contradecía con su propio select.
        if (listIsForThisUrl && reportsVision && saved.model !== '' && models.includes(saved.model) && !visionModels.includes(saved.model)) {
            setNotice({
                kind: 'error',
                text: `guardado en ${saved.url}, pero «${saved.model}» no mira imágenes: ` +
                    (visionModels.length === 0
                        ? 'la tablet no va a poder leer tickets hasta que ese servidor monte uno que sí'
                        : 'la tablet leerá con otro que sí ve. Elige arriba uno que vea y guarda')
            });
            return;
        }

        setNotice({
            kind: 'ok',
            text: saved.model === ''
                ? `guardado: la IA se buscará en ${saved.url}, y leerá con el modelo que elija el servidor`
                : `guardado: la IA se buscará en ${saved.url}, y leerá con «${saved.model}»`
        });

        //  Guardar también PREGUNTA, en silencio: si el servidor contesta, la lista de modelos se rellena
        //  sola y el «guardado» se queda; si no contesta, su error sustituye al verde. Antes, guardar una
        //  dirección que no contestaba dejaba un «guardado» tranquilizador encima de un servidor mudo,
        //  y la lista vacía sin explicación. La clave va explícita: ver la nota de askServer.
        void askServer({ quiet: true, apiKey: keyToUse });
    };


    // clearSettings = «borrar los ajustes de este equipo»
    const clearSettings = () => {

        cancelCheck();

        // emptySettings = «los ajustes vacíos», los que devuelve el propio almacén al borrar
        const emptySettings = clearAiSettings();

        setSavedSettings(emptySettings);
        setUrlText(emptySettings.url);
        setModelChoice(emptySettings.model);
        setModels([]);
        setVisionModels([]);
        setReportsVision(false);
        setModelsFrom('');
        clearTypedKey();
        setEditingKey(true);
        setNotice({ kind: 'info', text: 'borrados: en este equipo ya no queda ni la dirección, ni la clave, ni el modelo' });
    };


    // askServer = «preguntar al servidor»
    // Pregunta con lo que hay EN PANTALLA, aunque todavía no se haya guardado, y de paso se queda
    // con su lista de modelos: es la única forma de saber entre cuáles se puede elegir.
    // Recibe: { quiet } — en silencio solo se avisa si FALLA. Es como se pide la lista al abrir el
    //         menú: un «conectado en 14 ms» que nadie pidió tapa el aviso de lo último que se hizo.
    //         { apiKey } — la clave con la que preguntar, cuando quien llama la tiene más a mano que el
    //         campo: al guardar, el campo ya se vació y savedSettings aún no se ha actualizado en este
    //         cierre, así que getApiKeyToUse() devolvería '' contra una dirección recién cambiada.
    const askServer = async ({ quiet = false, apiKey } = {}) => {

        if (normalizedUrl === '') {
            if (!quiet) setNotice({ kind: 'error', text: 'escribe primero la dirección del servidor de IA' });
            return;
        }

        // Una prueba anterior que siga en vuelo se cancela: manda la última que se pidió.
        checkAbort.current?.abort();

        // controller = «con qué cancelar esta prueba»
        const controller = new AbortController();
        checkAbort.current = controller;

        // askedUrl = «la dirección a la que se está preguntando»
        // Se guarda ANTES: mientras la respuesta viene, se puede haber teclado otra, y la lista que
        // llegue es de esta y no de la que haya en el campo cuando conteste.
        const askedUrl = normalizedUrl;

        setChecking(true);
        if (!quiet) setNotice({ kind: 'info', text: `preguntando a ${askedUrl}…` });

        try {
            // result = «lo que contestó el servidor». checkAiServer nunca lanza.
            const result = await checkAiServer({
                baseUrl: askedUrl,
                apiKey: apiKey ?? getApiKeyToUse(),
                preferred: modelChoice,
                signal: controller.signal
            });

            // Se salió del menú, llegó tarde una prueba ya cancelada, o mientras tanto se guardó o
            // se borró: en cualquiera de los tres casos, esta respuesta ya no habla de lo que hay.
            if (!isMounted.current || controller.signal.aborted || checkAbort.current !== controller) return;

            //  Las listas llegan también cuando el servidor contestó pero ninguno de sus modelos ve:
            //  hay que poder verlas para entender QUÉ hay montado, aunque con eso no se pueda leer.
            //  Y con 'no-model' (contestó, pero sin ningún modelo) se vacían: la lista de la consulta
            //  anterior ya no dice nada de este servidor.
            if (result.active || result.cause === 'no-vision-model' || result.cause === 'no-model') {
                setModels(Array.isArray(result.models) ? result.models : []);
                setVisionModels(Array.isArray(result.visionModels) ? result.visionModels : []);
                setReportsVision(result.reportsVision === true);
                setModelsFrom(askedUrl);
            }

            //  En silencio se calla lo bueno, no lo malo: un aviso de error —el elegido no ve, o ya no
            //  está— tiene que salir también al abrir el menú, que es cuando alguien viene a mirar
            //  por qué la tablet no lee.
            // said = «lo que hay que decir de esta consulta»
            // Lleva pegada la dirección que el servidor SÍ atiende, cuando la hay: con ella el aviso
            // trae un botón para cambiarla, en vez de mandar a copiarla a mano.
            const said = { ...describeCheck(result), suggestedUrl: result.suggestedUrl ?? null };
            if (!quiet || said.kind === 'error') setNotice(said);
        }
        catch (error) {
            console.log(error);
            if (isMounted.current && checkAbort.current === controller) setNotice({ kind: 'error', text: 'no se pudo probar la conexión' });
        }
        finally {
            if (isMounted.current && checkAbort.current === controller) setChecking(false);
        }
    };


    // checkServer = «probar la conexión con el servidor», lo que hace el botón
    const checkServer = () => askServer();


    //  Al abrir el menú se pide la lista de modelos de la dirección guardada, para poder elegir
    //  uno sin tener que darle antes a «Probar conexión». En silencio: solo habla si falla.
    useEffect(() => {
        if (savedSettings.url !== '') void askServer({ quiet: true });
    }, []);



    return (
        <div className='cia-panel'>

            <header className='cia-cabecera'>
                <h1 className='cia-titulo'>Servidor de IA</h1>
                <p className='cia-subtitulo'>
                    La dirección y la clave con las que esta aplicación lee los tickets de la tablet.
                    Se guardan en este equipo, no en el programa: se pueden cambiar sin volver a instalarlo.
                </p>
            </header>


            {/*  LA DIRECCIÓN. Debajo, la que de verdad se va a usar.  */}
            <div className='cia-campo'>
                <label className='cia-etiqueta' htmlFor='cia-url'>Dirección del servidor</label>

                <input
                    id='cia-url'
                    className='cia-input'
                    type='text'
                    value={urlText}
                    onChange={event => setUrlText(event.target.value)}
                    placeholder={URL_PLACEHOLDER}
                    spellCheck='false'
                    autoComplete='off'
                />

                {
                    normalizedUrl === ''
                        ? <p className='cia-pista cia-pista--flojo'>todavía no hay dirección: la lectura de tickets está parada</p>
                        : <p className='cia-pista'>se usará: <code className='cia-codigo'>{normalizedUrl}</code></p>
                }

                {
                    urlWarning !== '' && <p className='cia-pista cia-pista--ojo'>{urlWarning}</p>
                }

                <p className='cia-pista cia-pista--flojo'>
                    Solo la base, sin <code className='cia-codigo'>/api/v1</code>: esa parte la pone sola la aplicación.
                </p>
            </div>


            {/*  LA CLAVE. Guardada, se enseña tapada; para poner otra hay que pedirlo.  */}
            <div className='cia-campo'>
                <label className='cia-etiqueta' htmlFor='cia-clave'>Clave de acceso</label>

                {
                    editingKey
                        ? (
                            <>
                                {/*  Sin 'value': el campo va sin controlar para que lo tecleado no
                                     se copie al atributo del HTML. Se lee del campo al usarlo.  */}
                                <input
                                    id='cia-clave'
                                    ref={apiKeyInput}
                                    className='cia-input'
                                    type='password'
                                    defaultValue=''
                                    placeholder='sk-…'
                                    spellCheck='false'
                                    autoComplete='off'
                                />

                                {
                                    savedSettings.apiKey !== '' && (
                                        <button type='button' className='cia-boton cia-boton--suave cia-boton--pequeno' onClick={cancelKeyChange}>
                                            Dejar la que estaba
                                        </button>
                                    )
                                }
                            </>
                        )
                        : (
                            <div className='cia-guardada'>
                                <code className='cia-guardada__valor'>{maskApiKey(savedSettings.apiKey)}</code>
                                <button type='button' className='cia-boton cia-boton--suave cia-boton--pequeno' onClick={startKeyChange}>
                                    Cambiar
                                </button>
                            </div>
                        )
                }

                {
                    keyIsForAnotherServer && (
                        <p className='cia-pista cia-pista--ojo'>
                            esta dirección no es la guardada: la clave que hay guardada es de la otra y no se le manda
                            a esta. Escribe la de este servidor para probarla o para guardarla.
                        </p>
                    )
                }

                <p className='cia-pista cia-pista--flojo'>
                    Si el servidor no pide clave —LM Studio a secas no la pide—, déjala vacía.
                </p>
            </div>


            {/*  CON QUÉ MODELO LEER. La lista es la de la dirección escrita: sin ella,
                 solo queda lo elegido y la opción de dejar que elija el servidor.  */}
            <div className='cia-campo'>
                <label className='cia-etiqueta' htmlFor='cia-modelo'>Modelo con el que leer</label>

                <select
                    id='cia-modelo'
                    className='cia-input cia-select'
                    value={modelChoice}
                    onChange={event => setModelChoice(event.target.value)}
                    disabled={checking}
                >
                    <option value=''>El que elija el servidor (automático)</option>

                    {/*  Cada opción dice si ve. Es lo único que importa para elegir: dos gemma
                         del mismo tamaño se distinguen por un .mmproj al lado que aquí no se ve.  */}
                    {
                        listIsForThisUrl && models.map(name => (
                            <option key={name} value={name}>
                                {!reportsVision ? name : visionModels.includes(name) ? `${name}  · ve imágenes` : `${name}  · no ve imágenes`}
                            </option>
                        ))
                    }

                    {/*  El elegido, cuando no está en la lista de este servidor: si no
                         estuviera aquí, el select se quedaría enseñando «automático» y
                         guardar se llevaría por delante una elección que nadie cambió.  */}
                    {
                        modelChoice !== '' && !(listIsForThisUrl && models.includes(modelChoice)) && (
                            <option value={modelChoice}>{modelChoice} (guardado)</option>
                        )
                    }
                </select>

                {
                    checking
                        ? <p className='cia-pista cia-pista--flojo'>preguntando qué modelos hay…</p>
                        : !listIsForThisUrl
                            ? <p className='cia-pista cia-pista--flojo'>dale a «Probar conexión» para ver los modelos de esta dirección</p>
                            : models.length === 0
                                ? <p className='cia-pista cia-pista--ojo'>ese servidor no tiene ningún modelo cargado</p>
                                : !reportsVision
                                    ? <p className='cia-pista'>{models.length === 1 ? '1 modelo' : `${models.length} modelos`}; ese servidor no dice cuáles miran imágenes</p>
                                    : visionModels.length === 0
                                        ? <p className='cia-pista cia-pista--ojo'>{models.length === 1 ? 'el único modelo cargado no mira imágenes' : `ninguno de los ${models.length} modelos cargados mira imágenes`}: la tablet no va a poder leer tickets hasta que ese servidor monte uno que sí</p>
                                        : <p className='cia-pista'>{models.length === 1 ? '1 modelo' : `${models.length} modelos`}, {visionModels.length === 1 ? '1 ve imágenes' : `${visionModels.length} ven imágenes`}</p>
                }

                {
                    choiceIsMissing && (
                        <p className='cia-pista cia-pista--ojo'>
                            «{modelChoice}» ya no está cargado en ese servidor: se leerá con otro hasta que vuelva a
                            estarlo. Elige uno de la lista si quieres fijarlo.
                        </p>
                    )
                }

                {
                    choiceIsBlind && (
                        <p className='cia-pista cia-pista--ojo'>
                            «{modelChoice}» no mira imágenes: la tablet leerá con otro que sí ve. Elige uno marcado
                            «ve imágenes» y guarda.
                        </p>
                    )
                }

                <p className='cia-pista cia-pista--flojo'>
                    Para leer tickets hace falta uno que MIRE imágenes. En automático se elige solo el que sabe.
                </p>
            </div>


            {/*  LAS TRES ACCIONES.  */}
            <div className='cia-botones'>
                <button type='button' className='cia-boton cia-boton--principal' onClick={saveSettings}>
                    Guardar
                </button>

                <button type='button' className='cia-boton' onClick={checkServer} disabled={checking}>
                    {checking ? 'Probando…' : 'Probar conexión'}
                </button>

                <button type='button' className='cia-boton cia-boton--peligro' onClick={clearSettings}>
                    Borrar
                </button>
            </div>


            {
                notice && (
                    <p className={`cia-aviso cia-aviso--${notice.kind}`} role='status'>
                        {notice.text}
                        {/*  El servidor contestó por http: se ofrece la dirección buena con un botón.
                             Solo cambia el campo, NO guarda: guardar sigue siendo cosa del operador.  */}
                        {
                            notice.suggestedUrl && (
                                <button
                                    type='button'
                                    className='cia-boton cia-boton--suave cia-boton--pequeno cia-aviso__accion'
                                    onClick={() => {
                                        setUrlText(notice.suggestedUrl);
                                        setNotice({ kind: 'info', text: `dirección cambiada a ${notice.suggestedUrl}: dale a «Guardar»` });
                                    }}
                                >
                                    Usar {notice.suggestedUrl}
                                </button>
                            )
                        }
                    </p>
                )
            }


            {/*  LO QUE HAY QUE SABER ANTES DE QUE FALLE.  */}
            <div className='cia-notas'>

                {
                    usesHttps && (
                        <p className='cia-nota'>
                            <strong>Certificado propio.</strong> Si ese <code className='cia-codigo'>https</code> usa un
                            certificado hecho en casa, el navegador lo rechaza en silencio y la lectura sale como «sin
                            conexión». Hay que abrir <a className='cia-enlace' href={normalizedUrl} target='_blank' rel='noreferrer'>{normalizedUrl}</a> una
                            vez en este navegador y aceptar el certificado. Dentro del programa de escritorio no hace falta:
                            ahí ya se aceptan.
                        </p>
                    )
                }

                <p className='cia-nota'>
                    <strong>Dónde queda la clave.</strong> Se guarda en este equipo, en el almacenamiento de este
                    navegador. No viaja a ningún otro sitio ni se comparte con las demás estaciones, y con «Borrar» se
                    quita de aquí. En un equipo compartido, bórrala al terminar.
                </p>
            </div>

        </div>
    );
}



export { ConfigIA };
