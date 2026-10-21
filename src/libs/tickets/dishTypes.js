import Fuse from 'fuse.js';
import { isConfiguredLimit } from '../date_time/timeLimit.js';
import { clockDuration } from '../date_time/waitingTime.js';


/*  EL «TIPO DE PLATO» DE UN PROCESO: SUS OPCIONES, Y CÓMO ELIGE LA IA (pedido del usuario)
 *
 *  Si el local tiene carta —'dishes' en api_jarvis365: Local.dishes → Dishes, los platos que gerencia da de alta en
 *  Client365 como «Nombre del platillo o bebida»—, las opciones del select son los nombres de esos platos. Si no
 *  tiene ninguno, las de siempre: las del formato del Excel (DISH_TYPES).
 *
 *  Lo que se guarda en el proceso es el NOMBRE ('dishType' es texto en la API), no el _id del plato: así Registros
 *  y el Excel lo enseñan sin buscarlo en ninguna parte, y un plato que luego se borre o se renombre no deja la
 *  celda en blanco.
 *
 *  LA IA. Con la lista de siempre, el tipo que resuelve la lectura (tipoDePlato.js) pasa a su opción
 *  (DISH_TYPE_FROM_READING). Con la carta del local, el nombre del plato que leyó en la tarjeta ('plato') se busca
 *  en ella por parecido —llega con erratas: «Chesburger» tiene que encontrar «Cheeseburger»—, con la misma
 *  tolerancia que tipoDePlato.js. Si no se parece a ninguno, se queda vacío para elegirlo a mano.
 *
 *  EL TIEMPO DE PREPARACIÓN. Cada plato de la carta trae cuánto puede tardar en cocina, por turno: timeLimit.day y
 *  timeLimit.night ('HH:MM:SS'; si no se entiende, timeLimitSeconds). Mesas lo usa para la demora de preparación
 *  de cada proceso, de la toma de orden a listo en tablet (limitOf). La lista de siempre no trae tiempos.
 */


// DISH_TYPES = «los tipos de plato de siempre», las opciones del select cuando el local no tiene carta. Son las del
// formato del Excel (FORMATO NUEVO 2.3).
export const DISH_TYPES = ['APPETIZER', 'ENTREE', 'DESSER', 'SALAD', 'ENTRADA 6', 'ENTRADA 7', 'ENTRADA 8', 'ENTRADA 9', 'PF', 'POSTRE', 'DRINKS', 'DRINKS BAR', 'TAKE OUT', 'PICK UP', 'UBER EATS', 'DOORDASH'];

// DISH_TYPE_FROM_READING = «el tipo que resuelve la lectura (libs/tickets/tipoDePlato.js), en su opción de la lista»
// Lo que no tiene opción en la lista —'Online Ordering', 'Delivery', 'Grubhub' o un tipo sin resolver— se queda
// vacío para elegirlo a mano.
const DISH_TYPE_FROM_READING = {
    'Entrada': 'APPETIZER',
    'Plato fuerte': 'PF',
    'Postre': 'POSTRE',
    'Bebida': 'DRINKS',
    'Take Out': 'TAKE OUT',
    'Pick Up': 'PICK UP',
    'Uber Eats': 'UBER EATS',
    'DoorDash': 'DOORDASH',
};

// SEARCH_OPTIONS = «cuánto se parece lo leído a un plato de la carta»: 0.4 aguanta un par de letras cambiadas sin
// inventarse platos (la misma que tipoDePlato.js)
const SEARCH_OPTIONS = { threshold: 0.4 };


// dishNames = «los nombres de la carta del local», sin repetir y en su orden. [] si no tiene platos, o si llegan
// solo sus _id (la versión ligera del local, la de 'local_appExpress').
export const dishNames = (dishes) => [
    ...new Set((Array.isArray(dishes) ? dishes : []).map(dish => String(dish?.nameDishe ?? '').trim()).filter(Boolean)),
];


// dishLimit = «cuánto puede tardar un plato en cocina en un turno» ('day' | 'night'), 'HH:MM:SS', o '' si no lo tiene
// configurado. timeLimit manda; si no se entiende (o está en cero), timeLimitSeconds, que es lo mismo en segundos.
export function dishLimit(dish, shift) {
    const which = shift === 'night' ? 'night' : 'day';

    const text = String(dish?.timeLimit?.[which] ?? '').trim();
    if (isConfiguredLimit(text)) return text;

    const seconds = Number(dish?.timeLimitSeconds?.[which]);
    return Number.isInteger(seconds) && seconds > 0 ? clockDuration(seconds) : '';
}


/*  createDishTypes = «el tipo de plato de un local»
 *
 *  Recibe: dishes, la carta del local (establishment.dishes, poblada).
 *  Devuelve: { options, fromMenu, fromOrder, dishOf, limitOf }
 *      options              las opciones del select: los nombres de la carta, o DISH_TYPES si no tiene
 *      fromMenu             las opciones salen de la carta del local
 *      fromOrder(order)     el tipo de un pedido que lee la IA (una fila de processGrid.js): una de 'options', o ''
 *      dishOf(name)         el plato de la carta con ese nombre, o null
 *      limitOf(name, shift) cuánto puede tardar en cocina ese plato en ese turno, 'HH:MM:SS', o '' (dishLimit)
 *
 *  Se crea una vez por carta: montar el índice de búsqueda cuesta.
 */
export function createDishTypes(dishes) {

    const names = dishNames(dishes);

    if (names.length === 0) {
        return { options: DISH_TYPES, fromMenu: false, fromOrder: (order) => DISH_TYPE_FROM_READING[order?.tipo] ?? '', dishOf: () => null, limitOf: () => '' };
    }

    // byName = «cada plato por su nombre». Con dos platos del mismo nombre, vale el primero, como en 'options'.
    const byName = new Map();
    for (const dish of dishes) {
        const name = String(dish?.nameDishe ?? '').trim();
        if (name && !byName.has(name)) byName.set(name, dish);
    }

    const dishOf = (name) => byName.get(String(name ?? '').trim()) ?? null;
    const limitOf = (name, shift) => dishLimit(dishOf(name), shift);

    const search = new Fuse(names, SEARCH_OPTIONS);

    // found = «lo ya buscado», por lo leído: la IA manda los mismos pedidos en cada lectura
    const found = new Map();

    const fromOrder = (order) => {
        const read = String(order?.plato ?? '').trim();
        if (!read) return '';
        if (!found.has(read)) found.set(read, search.search(read)[0]?.item ?? '');
        return found.get(read);
    };

    return { options: names, fromMenu: true, fromOrder, dishOf, limitOf };
}


// optionsWith = «las opciones, y delante la que ya tiene el proceso si no está entre ellas»: un tipo de antes de que el
// local tuviera carta, o el de un plato que ya no está, se sigue viendo en vez de quedarse el select en '-'
export const optionsWith = (options, value) => (!value || options.includes(value) ? options : [value, ...options]);
