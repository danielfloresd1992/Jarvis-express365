import { leerCabecera, ETIQUETAS_DE_PANTALLA } from '../tickets/lecturaDeTickets.js';
import { aSegundosDeCronometro } from '../tickets/cronometro.js';


// INFERENCE_PROMPT = «el texto de la inferencia»
// Lo que se le pide al modelo junto con la imagen de la tira.
// Tiene que contestar un array con un objeto por ticket: { ticket, mesa, tiempo, tipo, listo }.
// Es corto y pide una sola línea a propósito: en ese servidor cada token cuesta cerca de un segundo.
const INFERENCE_PROMPT = `Esta imagen es un trozo de la pantalla de cocina de un restaurante, con tarjetas de pedidos (tickets).
Responde SOLO con un array JSON en UNA linea: sin markdown, sin saltos de linea y sin explicaciones.

Un objeto por cada tarjeta cuya CABECERA (la franja de color de arriba) se vea entera, con estas cinco claves:
"ticket": el numero que va tras el "#", con TODAS sus cifras ("#205" es "205"). Solo digitos.
"mesa": el numero que va tras la palabra "Table". Solo digitos. Si esa cabecera no dice "Table" (pedidos para llevar o a domicilio: llevan el nombre del cliente), escribe "".
"tiempo": el contador que esta DENTRO de la cabecera, arriba a la derecha, tal como se ve ("3:04", "1:12:40"). El tiempo que sigue a FIRE o COCINAR es otro y no se copia, con una excepcion: si arriba a la derecha hay una hora con "@" delante ("@3:35p") en vez de un contador, entonces si se copia el que sigue a FIRE o COCINAR.
"tipo": el rotulo que la tarjeta lleva bajo la cabecera: el curso (Appetizer, Entree, Dessert) o el tipo de pedido (Take Out, UberEats Delivery, DoorDash Delivery, Online Ordering). FIRE, COCINAR, HOLD y EN PAUSA no son el tipo. Si no hay rotulo, escribe "".
"listo": true si TODOS los productos de la tarjeta tienen una palomita verde a su izquierda, o si el cuerpo de la tarjeta es verde. Si no, false.

Copia los numeros tal como se ven y no mezcles los de una tarjeta con los de otra. Dos tarjetas con el mismo ticket (una por curso) son dos objetos.
No cuentan las tarjetas cortadas por el borde de la imagen (no enseñan su "#" o su tiempo) ni los trozos que empiezan por "CONTINUA": no tienen cabecera.

Ejemplo de una imagen con dos tarjetas:
[{"ticket":"318","mesa":"27","tiempo":"4:15","tipo":"Entree","listo":false},{"ticket":"319","mesa":"","tiempo":"0:52","tipo":"UberEats Delivery","listo":true}]

Si no hay ninguna tarjeta con su cabecera entera, responde: []`;


// TRUE_WORDS = «las palabras que valen por verdadero»
// El modelo a veces escribe el 'listo' como texto en vez de true / false.
const TRUE_WORDS = ['true', 'si', 'sí', 'yes', 'listo', '1'];



// cleanText = «limpiar texto»
// Pasa cualquier valor a texto, sin espacios a los lados. null y undefined dan ''.
const cleanText = (value) => {
    if (value === null || value === undefined) return '';

    return String(value).trim();
}



// findJsonArray = «buscar el array JSON»
// Busca el array dentro de lo que escribió el modelo, aunque venga envuelto en ```json o con texto alrededor.
// Recibe: text (el texto del modelo).
// Devuelve: el array, o null si ahí no había ninguno. OJO: [] es una respuesta BUENA (pantalla sin tickets).
function findJsonArray(text) {

    // withoutMarks = «sin las marcas de markdown»
    const withoutMarks = cleanText(text).replace(/```(?:json)?/gi, '');

    // start = «dónde empieza el array»
    const start = withoutMarks.indexOf('[');

    // end = «dónde acaba el array»
    const end = withoutMarks.lastIndexOf(']');

    if (start === -1 || end < start) return null;

    try {
        // list = «la lista leída»
        const list = JSON.parse(withoutMarks.slice(start, end + 1));

        if (!Array.isArray(list)) return null;

        return list;
    }
    catch (error) {
        // JSON cortado a medias o mal escrito: no se entiende
        return null;
    }
}



// cleanTicketNumber = «limpiar el número de ticket»
// Recibe: value (lo que vino en 'ticket': '118', 118, '#118', 'Table 53 #118'…).
// Devuelve: solo los dígitos ('118'), o '' si no hay número.
function cleanTicketNumber(value) {

    // text = «el valor, pasado a texto»
    const text = cleanText(value);

    // afterHash = «lo que va tras el #»
    const afterHash = text.match(/#\s*(\d+)/);
    if (afterHash) return afterHash[1];

    // onlyDigits = «solo dígitos»: '118' o 'Ticket 118'
    const onlyDigits = text.match(/^(?:ticket)?\s*(\d+)$/i);
    if (onlyDigits) return onlyDigits[1];

    return '';
}



// cleanTableNumber = «limpiar el número de mesa»
// Recibe: value (lo que vino en 'mesa': '53', 53, 'Table 53', '', 'Muiguel'…).
// Devuelve: solo los dígitos ('53'), o '' si eso no es una mesa (un nombre, un '#76', nada).
function cleanTableNumber(value) {

    // text = «el valor, pasado a texto»
    const text = cleanText(value);

    // withWord = «con la palabra delante»: 'Table 53', 'Table #53', 'Mesa 53'
    const withWord = text.match(/^(?:table|mesa)\s*#?\s*(\d+)$/i);
    if (withWord) return withWord[1];

    // solo dígitos: '53'
    if (/^\d+$/.test(text)) return text;

    return '';
}



// cleanTimer = «limpiar el cronómetro»
// Recibe: value (lo que vino en 'tiempo': '3:04', '1:12:40', 'FIRE 4:20', '@3:35p'…).
// Devuelve: el cronómetro ('3:04'), o '' si ahí no hay ninguno que valga.
function cleanTimer(value) {

    // 1. fuera la hora prometida ('@3:35p'): leída como cronómetro diría que el pedido lleva 3 minutos
    // text = «el valor, sin la hora prometida»
    const text = cleanText(value).replace(/@\s*\d{1,2}:\d{2}\s*(?:[ap]\.?\s?m?\.?)?/gi, ' ');

    // 2. el primer 'h:mm:ss' o 'mm:ss'
    // found = «el cronómetro encontrado»
    const found = text.match(/\b(\d{1,2}:\d{2}(?::\d{2})?)\b/);
    if (!found) return '';

    // 3. ¿es un cronómetro de verdad? (minutos y segundos por debajo de 60, menos de un día)
    if (aSegundosDeCronometro(found[1]) === null) return '';

    return found[1];
}



// toBoolean = «pasar a verdadero o falso»
// Recibe: value (lo que vino en 'listo': true, false, 'true', 'sí', 1…).
// Devuelve: true solo si de verdad dice que sí. Todo lo demás es false.
function toBoolean(value) {

    if (value === true) return true;

    // word = «la palabra, en minúsculas»
    const word = cleanText(value).toLowerCase();

    return TRUE_WORDS.includes(word);
}



// isScreenLabel = «es un rótulo de la pantalla»
// FIRE, HOLD, ENTREE, TAKE OUT… son palabras que pinta la pantalla: nunca son una mesa.
const isScreenLabel = (value) => {
    return ETIQUETAS_DE_PANTALLA.has(cleanText(value).toUpperCase());
}



// readTicketFields = «leer los campos del ticket»
// Saca el número de ticket, la mesa y el cronómetro de un objeto del modelo, venga en el formato que venga.
// Recibe: object (uno de los objetos del array).
// Devuelve: { ticketNumber, tableNumber, timer, canal }, cada uno '' si no se leyó.
function readTicketFields(object) {

    // 1. el formato de hoy: los campos sueltos
    // fields = «los campos leídos»
    const fields = {
        ticketNumber: cleanTicketNumber(object.ticket),
        tableNumber: cleanTableNumber(object.mesa),
        timer: cleanTimer(object.tiempo),
        canal: '',
    };

    // header = «la cabecera transcrita»: solo viene en el formato ANTERIOR ("Table 53 #118 3:04")
    const header = leerCabecera(object.cabecera);
    if (header === null) return fields;

    // 2. el formato anterior: manda la cabecera, y los campos sueltos solo rellenan lo que le falte
    if (header.ticket !== '') fields.ticketNumber = cleanTicketNumber(header.ticket);
    if (header.mesaFiable) fields.tableNumber = header.mesa;
    if (header.tiempo !== '') fields.timer = cleanTimer(header.tiempo);
    fields.canal = header.canal;

    return fields;
}



// cleanTicket = «limpiar un ticket»
// Valida UN objeto del modelo y lo deja con la forma que espera el resto de la app.
// Recibe: object (uno de los objetos del array).
// Devuelve: { valid: true, ticket: { ticket, mesa, mesaFiable, tiempo, tipo, listo, canal } }
//        o  { valid: false, reason: 'el motivo, en español' }
function cleanTicket(object) {

    // 1. tiene que ser un objeto: ni un texto, ni un número, ni otro array
    if (object === null || typeof object !== 'object' || Array.isArray(object)) {
        return { valid: false, reason: 'no es un objeto' };
    }

    // 2. los campos, ya limpios
    // fields = «los campos leídos»
    const fields = readTicketFields(object);

    // 3. sin ticket ni mesa no hay a quién apuntarle nada
    if (fields.ticketNumber === '' && fields.tableNumber === '') {
        if (isScreenLabel(object.mesa)) {
            return { valid: false, reason: 'es un rótulo de la pantalla (FIRE, ENTREE…), no una mesa' };
        }

        return { valid: false, reason: 'no trae ni mesa ni número de ticket' };
    }

    // 4. sin cronómetro no es la cabecera de un ticket: toda tarjeta lleva uno y ningún producto lo tiene
    if (fields.timer === '') {
        return { valid: false, reason: 'no trae cronómetro: no es la cabecera de un ticket' };
    }

    // 5. sin mesa, en su lugar va el ticket con su '#' (regla del usuario), y no cuenta como mesa fiable
    // hasTable = «tiene mesa»
    const hasTable = fields.tableNumber !== '';

    // table = «la mesa que se enseña»
    let table = fields.tableNumber;
    if (!hasTable) table = `#${fields.ticketNumber}`;

    // ticket = «el ticket ya limpio»
    const ticket = {
        ticket: fields.ticketNumber,
        mesa: table,
        mesaFiable: hasTable,
        tiempo: fields.timer,
        tipo: cleanText(object.tipo),
        listo: toBoolean(object.listo),
        canal: fields.canal,
    };

    return { valid: true, ticket };
}



// parseModelResponse = «interpretar la respuesta del modelo»
// STEP 4. Del texto del modelo, el array de tickets ya limpio y validado. PURA.
// Recibe: text (lo que contestó el modelo).
// Devuelve: { readable, tickets, discarded }
//   readable: false = ahí no había ningún array JSON: la vuelta se descarta entera
//   tickets: [ { ticket: '118', mesa: '53', mesaFiable: true, tiempo: '3:04', tipo: 'Appetizer', listo: false, canal: '' } ]
//   discarded: [ { reason: 'el motivo, en español', object: {…lo que dijo el modelo} } ]
function parseModelResponse(text) {

    // 1. el array que venga dentro del texto
    // objects = «los objetos del modelo»
    const objects = findJsonArray(text);

    if (objects === null) return { readable: false, tickets: [], discarded: [] };

    // tickets = «los tickets buenos»
    const tickets = [];

    // discarded = «los descartados»
    const discarded = [];

    // 2. cada objeto va a una de las dos listas
    for (const object of objects) {

        // result = «el resultado de limpiar ese objeto»
        const result = cleanTicket(object);

        if (!result.valid) {
            discarded.push({ reason: result.reason, object });
            continue;
        }

        tickets.push(result.ticket);
    }

    return { readable: true, tickets, discarded };
}


export { INFERENCE_PROMPT, parseModelResponse };
