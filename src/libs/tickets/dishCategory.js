import Fuse from 'fuse.js';




/*  ─────────────────────────────────────────────────────────────────────────────
 *  DE QUÉ TIPO ES CADA PEDIDO
 *
 *  La columna "Tipo de plato" no quiere el nombre del plato: quiere de qué tipo es
 *  —entrada, plato fuerte, postre, bebida—, porque es así como se agrupa el resumen
 *  del turno.
 *
 *  El dato se busca en tres sitios, en este orden, y gana el primero que conteste:
 *
 *    1. LA MESA. Si en lugar de un número pone "Take Out" o "Uber Eats", eso ya es
 *       el tipo y no hay nada más que mirar.
 *
 *    2. LA CARTA DEL LOCAL. Es la fuente fiable: la manda el servidor y dice si cada
 *       plato es comida o bebida. El nombre que leyó la IA se busca ahí por parecido,
 *       porque va a llegar con erratas: "Chesburger" tiene que encontrar "Cheeseburger".
 *
 *    3. LO QUE DIJO LA IA. Solo si los dos anteriores no saben.
 *
 *  ⚠  LÍMITE CONOCIDO, y conviene tenerlo presente:
 *
 *     La carta solo distingue 'foods' y 'drinks'. Entrada, plato fuerte y postre son
 *     TODOS 'foods' para el servidor, así que esa distinción hoy solo puede venir del
 *     paso 3 — el menos fiable de los tres, porque es un modelo pequeño adivinando
 *     por el nombre.
 *
 *     Para que sea sólida hace falta que la carta traiga esas categorías. Es trabajo
 *     de backend, no de aquí.
 *  ───────────────────────────────────────────────────────────────────────────── */




//  Lo que dice la carta del servidor, traducido a lo que se enseña en la parrilla.
//
//  'foods' queda vacío a propósito: sabemos que es comida, pero no de qué tipo, y
//  poner "Comida" taparía el hueco haciendo creer que el dato está resuelto.
const FROM_MENU = {
    drinks: 'Bebida',
    drink: 'Bebida',
    foods: '',
    food: '',
};


//  Lo que puede contestar el modelo, en cualquiera de las formas en que suele hacerlo.
const FROM_AI = {
    entrada: 'Entrada',
    entradas: 'Entrada',
    aperitivo: 'Entrada',
    starter: 'Entrada',
    appetizer: 'Entrada',

    fuerte: 'Plato fuerte',
    'plato fuerte': 'Plato fuerte',
    principal: 'Plato fuerte',
    main: 'Plato fuerte',

    postre: 'Postre',
    postres: 'Postre',
    dessert: 'Postre',

    bebida: 'Bebida',
    bebidas: 'Bebida',
    drink: 'Bebida',
    drinks: 'Bebida',
};


//  'threshold' alto tolera erratas; demasiado alto empareja cualquier cosa con
//  cualquier cosa. 0.4 aguanta un par de letras cambiadas sin inventarse platos.
const FUZZY_OPTIONS = { keys: ['nameDishe'], threshold: 0.4 };




/*  Fabrica el resolutor para un local concreto.
 *
 *  Se construye una vez por carta y no en cada ticket: montar el índice de búsqueda
 *  cuesta, y hacerlo treinta veces por lectura sería tirar trabajo a la basura.
 *
 *  @param {Array} dishes  establishment.dishes
 *  @returns {(ticket: {table?: string, dish?: string, hint?: string}) => string}
 */
export function createDishTypeResolver(dishes) {

    const menu = Array.isArray(dishes) ? dishes.filter(item => item?.nameDishe) : [];

    const search = menu.length > 0 ? new Fuse(menu, FUZZY_OPTIONS) : null;


    return function resolveDishType({ table, dish, hint } = {}) {

        //  1) LA MESA MANDA
        const fromTable = typeFromTable(table);
        if (fromTable) return fromTable;

        //  2) LA CARTA DEL LOCAL
        if (search && dish) {
            const match = search.search(String(dish))[0];
            const label = FROM_MENU[normalize(match?.item?.category)];
            if (label) return label;
        }

        //  3) LO QUE DIJO LA IA
        return FROM_AI[normalize(hint)] ?? '';
    };
}




/*  ¿La "mesa" es en realidad un tipo de pedido?
 *
 *  El prompt le pide al modelo que, cuando el ticket no sea de una mesa, escriba ahí
 *  el nombre tal cual: "Take Out", "Uber Eats", "Online Ordering". Así que un valor
 *  que no sea un número es justamente eso.
 */
function typeFromTable(table) {

    const text = String(table ?? '').trim();
    if (!text) return '';

    //  Una mesa de verdad: solo dígitos. No dice nada del tipo de plato.
    if (/^\d+$/.test(text)) return '';

    /*  Y si no es un número, TIENE QUE ESTAR EN LA LISTA.
     *
     *  Antes se devolvía el texto tal cual, y eso convertía cualquier lectura rara del
     *  campo mesa —"Mesa 12", "N/A", "26-A"— en un tipo de plato. Como esta rama gana
     *  sobre la carta y sobre la IA, y el tipo se congela en cuanto sale algo, esa
     *  basura se quedaba en la columna para siempre.
     *
     *  Es la única entrada del contrato que no filtraba: FROM_AI ya devuelve '' ante
     *  lo desconocido, y el color también.
     */
    return ORDER_TYPES[normalize(text)] ?? '';
}


//  Los pedidos que no son de mesa. Las claves son lo que puede escribir el modelo
//  —el prompt le pide estos nombres literales—; el valor es lo que se enseña.
const ORDER_TYPES = {
    'take out': 'Take Out',
    'takeout': 'Take Out',
    'to go': 'Take Out',
    'pick up': 'Pick Up',
    'pickup': 'Pick Up',
    'uber eats': 'Uber Eats',
    'ubereats': 'Uber Eats',
    'online ordering': 'Online Ordering',
    'online': 'Online Ordering',
    'delivery': 'Delivery',
    'doordash': 'DoorDash',
    'grubhub': 'Grubhub',
};




//  Deja un valor listo para buscarlo en las tablas de arriba, que van en minúsculas.
function normalize(value) {
    return String(value ?? '').trim().toLowerCase();
}
