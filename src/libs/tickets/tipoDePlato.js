import Fuse from 'fuse.js';




/*  ─────────────────────────────────────────────────────────────────────────────
 *  DE QUÉ TIPO ES CADA PEDIDO
 *
 *  La columna «Tipo de plato» no quiere el nombre del plato: quiere de qué clase es
 *  —entrada, plato fuerte, postre, bebida—, porque es así como se agrupa el resumen
 *  del turno.
 *
 *  Se busca en tres sitios, en este orden, y gana el primero que conteste:
 *
 *    1. LA MESA. Si en lugar de un número pone «Take Out» o «Uber Eats», eso ya es el
 *       tipo de pedido y no hay nada más que mirar.
 *
 *    2. LA CARTA DEL LOCAL. Es la fuente fiable: la manda el servidor y dice si cada
 *       plato es comida o bebida. El nombre que leyó la IA se busca ahí por PARECIDO,
 *       porque va a llegar con erratas: «Chesburger» tiene que encontrar «Cheeseburger».
 *
 *    3. LO QUE DIJO LA IA. Solo si los dos anteriores no saben.
 *
 *  ⚠  LÍMITE CONOCIDO: la carta solo distingue 'foods' y 'drinks'. Entrada, plato
 *     fuerte y postre son TODOS 'foods' para el servidor, así que esa distinción hoy
 *     solo puede venir del paso 3 — el menos fiable, porque es un modelo pequeño
 *     adivinando por el nombre. Para que sea sólida hace falta que la carta traiga
 *     esas categorías, y eso es trabajo de backend.
 *  ───────────────────────────────────────────────────────────────────────────── */




//  Lo que dice la carta del servidor, traducido a lo que se enseña.
//
//  'foods' queda vacío a propósito: sabemos que es comida, pero no de qué clase, y
//  poner «Comida» taparía el hueco haciendo creer que el dato está resuelto.
const DESDE_LA_CARTA = {
    drinks: 'Bebida',
    drink: 'Bebida',
    foods: '',
    food: '',
};


//  Lo que puede contestar el modelo, en las formas en que suele hacerlo.
const DESDE_LA_IA = {
    entrada: 'Entrada',
    entradas: 'Entrada',
    aperitivo: 'Entrada',
    starter: 'Entrada',
    appetizer: 'Entrada',
    appetizers: 'Entrada',

    //  'ENTREE' es como Toast rotula el plato fuerte en la franja de la tarjeta: en
    //  mayúsculas en la apariencia oscura, «Entree» en la clara. Con acento («Entrée»)
    //  cae también aquí: 'normalizar' se lo quita antes de buscar.
    fuerte: 'Plato fuerte',
    'plato fuerte': 'Plato fuerte',
    principal: 'Plato fuerte',
    main: 'Plato fuerte',
    entree: 'Plato fuerte',
    entrees: 'Plato fuerte',

    postre: 'Postre',
    postres: 'Postre',
    dessert: 'Postre',
    desserts: 'Postre',

    bebida: 'Bebida',
    bebidas: 'Bebida',
    drink: 'Bebida',
    drinks: 'Bebida',
};


/*  Los pedidos que no son de mesa. Las claves son lo que puede escribir el modelo —el
 *  prompt le pide estos nombres literales—; el valor es lo que se enseña.
 *
 *  Es una lista cerrada a propósito: antes se devolvía cualquier texto no numérico que
 *  viniera en el campo mesa, así que una lectura rara como «Mesa 12» o «N/A» acababa
 *  en la columna del tipo y, como el tipo se congela, se quedaba ahí para siempre.
 */
const TIPOS_DE_PEDIDO = {
    'take out': 'Take Out',
    'takeout': 'Take Out',
    'to go': 'Take Out',
    'pick up': 'Pick Up',
    'pickup': 'Pick Up',
    'uber eats': 'Uber Eats',
    'ubereats': 'Uber Eats',
    'ubereats delivery': 'Uber Eats',
    'ubereats takeout': 'Uber Eats',
    'uber eats delivery': 'Uber Eats',
    'online ordering': 'Online Ordering',
    'online': 'Online Ordering',
    'delivery': 'Delivery',

    //  DoorDash rotula dos tarjetas distintas en la pantalla del expedidor —se ven en
    //  las capturas de «Expo - 2»—: la que reparte y la que pasan a recoger. Para la
    //  parrilla son el mismo tipo de pedido, igual que las dos de UberEats. Sin estas
    //  dos claves el rótulo entero no casaba con 'doordash' a secas, y como esta lista
    //  es cerrada la columna se quedaba en blanco.
    'doordash': 'DoorDash',
    'doordash delivery': 'DoorDash',
    'doordash takeout': 'DoorDash',
    'grubhub': 'Grubhub',
};


//  Tolerante con las erratas, pero no tanto como para emparejar cualquier cosa con
//  cualquier cosa: 0.4 aguanta un par de letras cambiadas sin inventarse platos.
const OPCIONES_BUSQUEDA = { keys: ['nameDishe'], threshold: 0.4 };




/**
 * Fabrica el resolutor para un local concreto.
 *
 * Se construye una vez por carta y no en cada ticket: montar el índice de búsqueda
 * cuesta, y hacerlo treinta veces por lectura sería tirar trabajo.
 *
 * @param {Array} carta  establishment.dishes
 * @returns {(ticket: {mesa?: string, plato?: string, pista?: string}) => string}
 */
export function crearResolutorDeTipo(carta) {

    const platos = Array.isArray(carta) ? carta.filter(item => item?.nameDishe) : [];

    const buscador = platos.length > 0 ? new Fuse(platos, OPCIONES_BUSQUEDA) : null;


    return function resolverTipo({ mesa, plato, pista } = {}) {

        //  1) LA MESA MANDA
        const porMesa = tipoSegunLaMesa(mesa);
        if (porMesa) return porMesa;

        //  2) LA CARTA DEL LOCAL
        if (buscador && plato) {
            const encontrado = buscador.search(String(plato))[0];
            const etiqueta = DESDE_LA_CARTA[normalizar(encontrado?.item?.category)];
            if (etiqueta) return etiqueta;
        }

        /*  3) EL RÓTULO DE LA TARJETA, QUE LEYÓ LA IA
         *
         *  Ya no es una adivinanza: la lectura copia el rótulo que la tarjeta lleva
         *  encima de sus productos, que es el curso —APPETIZER, ENTREE— en los pedidos
         *  de mesa, y el tipo de pedido —Take Out, UberEats Delivery— en los demás.
         *  Por eso aquí se mira en las DOS tablas.
         */
        return DESDE_LA_IA[normalizar(pista)] ?? TIPOS_DE_PEDIDO[normalizar(pista)] ?? '';
    };
}




/*  ¿La «mesa» es en realidad un tipo de pedido?
 *
 *  El prompt le pide al modelo que, cuando el ticket no sea de una mesa, escriba ahí
 *  el nombre tal cual. Así que un valor que no sea un número es justamente eso — pero
 *  solo se acepta si está en la lista.
 */
function tipoSegunLaMesa(mesa) {

    const texto = String(mesa ?? '').trim();
    if (!texto) return '';

    //  Una mesa de verdad: solo dígitos. No dice nada del tipo de plato.
    if (/^\d+$/.test(texto)) return '';

    return TIPOS_DE_PEDIDO[normalizar(texto)] ?? '';
}




/*  Deja un valor listo para buscarlo en las tablas de arriba, que van en minúsculas.
 *
 *  El rótulo llega con la capitalización que tenga la pantalla, y no es una sola: la
 *  apariencia oscura de Toast escribe «APPETIZER» y la clara «Appetizer». Las dos —y
 *  «appetizer», si al modelo le da por ahí— tienen que acabar en la misma clave.
 *
 *  Se quitan también los acentos y los espacios de más, igual que hace
 *  'cursoDeTarjeta' en claveDeTicket.js, y no por gusto: los dos sitios tienen que
 *  reconocer LO MISMO. Si la clave de la fila entiende «Entrée» como plato fuerte y
 *  esta tabla no, sale una fila con el curso en la clave y la columna del tipo vacía.
 */
function normalizar(valor) {
    return String(valor ?? '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')   //  'Entrée' → 'Entree'
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}
