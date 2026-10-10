import { useState, useRef, useCallback, useEffect } from 'react';
import { AJUSTES_POR_DEFECTO } from '../motor/motor.js';
import { ESCENAS } from '../motor/escenas.js';
import { TEMAS } from '../pintura/temas.js';


/*  LOS AJUSTES DEL SIMULADOR
 *
 *  Un solo objeto con todo lo que se puede cambiar: lo del turno y la cocina (que van al motor) y lo
 *  de la pantalla (que va a la pintura). Se guarda en el equipo según cambia, y al abrir se lee lo
 *  guardado que todavía sirva.
 *
 *  Los nombres de cada ajuste ('turnoEnMarcha', 'limiteEntradaMin'…) NO se tocan: son los del motor
 *  y los que hay guardados en los equipos.
 */



// SETTINGS_KEY = «la llave donde se guardan los ajustes»
const SETTINGS_KEY = 'toast-sim:ajustes';


/*  SHIFT_DEFAULTS = «los ajustes del turno, por si el motor no los trae»
 *
 *  Quien manda es AJUSTES_POR_DEFECTO, el del motor: en la mezcla de abajo va DESPUÉS y pisa todo lo
 *  de aquí. Esto solo garantiza que cada control del panel tenga siempre un valor que enseñar —un
 *  deslizador sin número es un control roto— aunque el motor que se haya cargado sea uno que todavía
 *  no sabe de turnos.
 */
const SHIFT_DEFAULTS = {
    turnoEnMarcha: true,
    rotacionesDelTurno: 70,
    duracionDelTurnoH: 8,
    horaPico: true,
    minimoEnPantalla: 3,
    ticketsPorRotacion: 3,
    probTodoJunto: 0.3,
    paraLlevarCadaS: 600,

    limiteEntradaMin: 7,
    limiteFuerteMin: 15,
    limitePostreMin: 5,
    probDemora: 0.2,
    excesoMaxDemoraMin: 6,

    pausaEntreCursosS: [180, 480],
};

// RETIRED_KEYS = «ajustes que el motor tuvo y ya no tiene»
// Las llegadas «una cada tanto» dejaron paso al turno con sus rotaciones. Pueden seguir guardados en el
// equipo de quien usó la versión anterior; se leen, se ignoran y no se vuelven a escribir.
const RETIRED_KEYS = ['autoLlegadas', 'intervaloMedioS', 'mezcla', 'probCursos', 'probPostre', 'probSegundoEnvio', 'rapidezCocina'];

// withoutRetired = «sin los ajustes retirados»
const withoutRetired = (object) => Object.fromEntries(Object.entries(object ?? {}).filter(([key]) => !RETIRED_KEYS.includes(key)));

// ENGINE_DEFAULTS = «los ajustes que van al motor»
const ENGINE_DEFAULTS = withoutRetired({ ...SHIFT_DEFAULTS, ...AJUSTES_POR_DEFECTO });

const ENGINE_KEYS = Object.keys(ENGINE_DEFAULTS);

// INITIAL_SETTINGS = «los ajustes de fábrica»: los del motor y los de la pantalla
const INITIAL_SETTINGS = {
    ...ENGINE_DEFAULTS,

    //  LA PANTALLA
    tema: 'clara',          //  «Expo - 2»: la que tiene el restaurante en la línea
    idioma: 'es',
    alto: 768,
    escala: 1,              //  2 = captura a doble resolución, como una tablet más densa
    estacion: '',
    amarilloS: 6 * 60,      //  a partir de cuánto la cabecera pasa a amarillo…
    rojoS: 15 * 60,         //  …y a rojo. Son los «Warning Colors» de Toast.
    avisos: 72,
    vistaTotal: false,

    toleranciaS: 10,
};

// ALLOWED_VALUES = «los ajustes que son una lista cerrada»: un valor guardado que no esté aquí no vale
const ALLOWED_VALUES = {
    tema: Object.keys(TEMAS),
    idioma: ['es', 'en'],
};

// PREVIOUS_VERSION_DEFAULTS = «lo que la versión anterior traía de fábrica y esta ha cambiado» (ver validSavedSettings)
const PREVIOUS_VERSION_DEFAULTS = { tema: 'oscura' };

// BLANK_START = «cómo amanece el simulador»: con la pantalla EN BLANCO y sin que entre nadie, hasta que
// se pulse «Empezar». La cocina sí va sola desde el principio: en cuanto entren tickets, se cocinan.
// El porqué largo está en 'readSettings'.
const BLANK_START = { turnoEnMarcha: false, autoCocina: true };

// SIMULATION_STOPPED = «la simulación parada»: ni entran mesas ni la cocina marca nada
const SIMULATION_STOPPED = { turnoEnMarcha: false, autoCocina: false };


const params = new URLSearchParams(window.location.search);

// SCREEN_ONLY = «solo la pantalla»: '?solo=pantalla' deja únicamente el lienzo, a su tamaño real, para
// fotografiarlo y compararlo con una captura de la tablet de verdad.
const SCREEN_ONLY = params.get('solo') === 'pantalla';

// INITIAL_SCENE = «la escena pedida en la dirección» ('?escena=…'), o null
const INITIAL_SCENE = params.get('escena');

// SAVE_SETTINGS = «se guardan los ajustes»
// Con una escena en la dirección no se guarda nada: es una sesión de prueba y no debe dejarle al
// siguiente arranque la cocina parada.
const SAVE_SETTINGS = !INITIAL_SCENE && !SCREEN_ONLY;



// sceneRequest = «lo que pide una escena al cargarse»
// Lo que la escena le pide a la pantalla, más la simulación parada: una escena es una foto fija, y si
// siguieran entrando mesas dejaría de parecerse a su captura.
// Recibe: requested (los ajustes que pide la escena). Devuelve: los cambios que hay que aplicar.
const sceneRequest = (requested) => ({ ...withoutRetired(requested), ...SIMULATION_STOPPED, recientesVisibles: true });

// sceneSettings = «los ajustes de la escena de la dirección»
const sceneSettings = (id) => (ESCENAS[id] ? sceneRequest(ESCENAS[id].ajustes) : {});


// sameShape = «el valor guardado tiene la misma forma que el de fábrica»
const sameShape = (value, model) => {
    if (value === null || typeof value !== typeof model) return false;
    if (Array.isArray(model)) return Array.isArray(value) && value.length === model.length && value.every(Number.isFinite);
    if (typeof model === 'number') return Number.isFinite(value);
    return !Array.isArray(value);
};



/*  validSavedSettings = «de lo guardado en el equipo, lo que todavía sirve»
 *
 *  Lo guardado puede venir de una versión anterior del simulador, o estar a medias, o escrito a mano
 *  por una prueba. Nada de eso puede romper el arranque, así que solo pasa lo que se reconoce: una
 *  clave que sigue existiendo, con un valor de la misma forma que el de fábrica. Lo demás —las claves
 *  retiradas del motor, un texto donde iba un número— se deja caer sin más.
 *
 *  Y UN CASO APARTE. La versión anterior guardaba TODOS los ajustes, no solo los que se habían tocado:
 *  en el equipo de quien la usó pone «tema: oscura» aunque nadie lo eligiera nunca, solo porque era el
 *  de fábrica. Respetar eso como si fuera una decisión dejaría sin efecto el cambio a la apariencia
 *  clara justo para quien la pidió. Un volcado de aquella versión se reconoce porque trae TODAS las
 *  claves retiradas (una prueba que escribe cuatro ajustes a mano, no); en ese caso, y solo en ese, lo
 *  que coincide con lo que entonces era de fábrica se toma por «sin elegir». Ocurre una vez: lo que se
 *  guarde a partir de ahora ya no lleva esas claves.
 */
function validSavedSettings(saved) {
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};

    // fromPreviousVersion = «es un volcado de la versión anterior»
    const fromPreviousVersion = RETIRED_KEYS.every(key => key in saved);

    const valid = {};

    for (const [key, value] of Object.entries(saved)) {
        if (!(key in INITIAL_SETTINGS)) continue;
        if (!sameShape(value, INITIAL_SETTINGS[key])) continue;
        if (ALLOWED_VALUES[key] && !ALLOWED_VALUES[key].includes(value)) continue;
        if (fromPreviousVersion && PREVIOUS_VERSION_DEFAULTS[key] === value) continue;

        valid[key] = value;
    }

    return valid;
}



// readSettings = «leer los ajustes con los que arranca el simulador»
function readSettings() {
    let saved = null;

    try { saved = SAVE_SETTINGS ? JSON.parse(localStorage.getItem(SETTINGS_KEY)) : null; }
    catch { /* ajustes guardados ilegibles: se arranca con los de fábrica */ }

    return {
        ...INITIAL_SETTINGS,
        ...validSavedSettings(saved),

        /*  SIEMPRE SE ARRANCA EN BLANCO, DIGA LO QUE DIGA LO GUARDADO
         *
         *  La ventana de la tablet, al conectar, APUNTA lo que ya hay en pantalla y no lo sigue nunca:
         *  de esos pedidos no sabe cuándo entraron. Antes el simulador amanecía con mesas ya sentadas,
         *  así que los primeros tickets —justo los que uno se quedaba mirando— no llegaban jamás al
         *  register de Procesos.
         *
         *  Ahora la pantalla empieza vacía y no entra nadie hasta pulsar «Empezar»: se conecta la
         *  ventana de la tablet, lee una pantalla en blanco, y todo ticket que aparezca después es
         *  nuevo para ella y lo sigue desde su primer segundo.
         *
         *  Que entren o no tickets tampoco es una preferencia que recordar: es algo que se decide en
         *  cada sesión. (Y la cocina nunca amanece en manual: una escena la paraba, eso se guardaba, y
         *  el simulador no volvía a marcar un plato.)
         */
        ...BLANK_START,

        //  La escena de la dirección entra YA en el primer estado, no en un efecto: si se aplicara
        //  después, la pantalla se pintaría una vez con la apariencia equivocada. Es lo único que
        //  arranca parado, y no se guarda (ver SAVE_SETTINGS).
        ...sceneSettings(INITIAL_SCENE),
    };
}


// engineSettings = «de todos los ajustes, los del motor»
const engineSettings = (settings) => Object.fromEntries(ENGINE_KEYS.map(key => [key, settings[key]]));



// useSettings = «los ajustes»
// Devuelve: { values, ref, change }
//   values   los ajustes de ahora, para pintar
//   ref      lo mismo en una ref, para quien los lee FUERA del pintado de React (la pintura del
//            lienzo, el canal con la tablet): leen siempre los últimos sin tener que volver a crearse
//   change   cambia uno o varios ajustes: change({ tema: 'oscura' })
function useSettings() {

    const [values, setValues] = useState(readSettings);
    const ref = useRef(values);

    const change = useCallback((changes) => setValues(current => ({ ...current, ...changes })), []);


    //  Cada vez que cambian: la ref al día y, si toca, guardados en el equipo. Al motor se los pasa
    //  useEngine, y el lienzo lo repinta useScreen, cada uno en su efecto y en este orden.
    useEffect(() => {
        ref.current = values;

        if (SAVE_SETTINGS) {
            try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(values)); }
            catch { /* sin almacenamiento los ajustes duran lo que la ventana */ }
        }
    }, [values]);


    return { values, ref, change };
}



export { useSettings, engineSettings, sceneRequest, SCREEN_ONLY, INITIAL_SCENE };
