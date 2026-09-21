/*  ─────────────────────────────────────────────────────────────────────────────
 *  PIEZAS PARA ENTENDER LO QUE CONTESTA EL MODELO
 *
 *  El texto que se le manda al modelo (INFERENCE_PROMPT) y la función que entiende su
 *  respuesta (parseModelResponse) viven en libs/inference/modelResponse.js. Aquí quedan las
 *  dos piezas que esa función importa: los rótulos de la pantalla que nunca son una mesa, y
 *  el lector de la cabecera transcrita ("Table 53 #118 3:04"), que es el formato ANTERIOR de
 *  la respuesta y se sigue aceptando.
 *  ───────────────────────────────────────────────────────────────────────────── */


/*  Palabras que la pantalla escribe por su cuenta y que NO son tickets.
 *
 *  Todas han llegado a aparecer como número de mesa en la parrilla: 'FIRE' encabeza el
 *  cronómetro de cada tarjeta, y 'DRINKS' y 'ENTREE' separan secciones dentro de un
 *  mismo ticket, así que un recorte que pille una de esas franjas y nada más las lee
 *  como si fueran el nombre del pedido.
 *
 *  Va en mayúsculas porque se compara en mayúsculas: el modelo no es constante con eso.
 */
export const ETIQUETAS_DE_PANTALLA = new Set([
    'FIRE', 'DRINKS', 'ENTREE', 'ENTRÉE', 'APPETIZER', 'DESSERT', 'SIDES',
    'N/A', 'NA', 'RECALL', 'ALL DAY', 'SHOW ALL DAY VIEW', 'HIDE RECENTLY FULFILLED',

    //  Las de la pantalla con botones de borde, que además puede ir en español.
    'HOLD', 'COCINAR', 'EN PAUSA', 'CONTINUED', 'CONTINÚA', 'CONTINUA', 'RECALLED',
    'PAID', 'NOT PAID', 'PAGADO', 'NO PAGADO', 'RECUPERAR', 'RECIENTEMENTE',
    'ALL DAY VIEW', 'RECENTLY FULFILLED', 'VISTA EN TOTAL',
    'TAKE OUT', 'ONLINE ORDERING', 'UBEREATS DELIVERY', 'UBEREATS TAKEOUT',

    //  Los dos rótulos de DoorDash que enseñan las capturas de «Expo - 2». Estos NO se
    //  han visto todavía colados como mesa: entran por simetría con los de UberEats,
    //  que son el mismo rótulo grande en el mismo sitio de la tarjeta.
    'DOORDASH DELIVERY', 'DOORDASH TAKEOUT',
]);


/*  ─────────────────────────────────────────────────────────────────────────────
 *  LA CABECERA SE PARTE AQUÍ, NO EN EL MODELO
 *
 *  Recibe la transcripción literal de la cabecera de una tarjeta y saca de ella la
 *  mesa, el número de ticket y el cronómetro.
 *
 *  Sacando los tres de la MISMA cadena, el cruce entre tarjetas vecinas no es menos
 *  probable — es imposible. Una expresión regular no se distrae.
 *
 *  DE LA CABECERA SOLO INTERESAN DOS COSAS, y así lo pidió quien usa la parrilla:
 *
 *      · la MESA, que en pantalla va siempre con la palabra 'Table' delante
 *      · el TICKET, que va siempre con '#' delante
 *
 *  Y una regla para cuando falta la primera: SI NO HAY MESA, EN SU LUGAR VA EL TICKET,
 *  escrito con su '#'. Los nombres de cliente o de mesero no se usan para nada.
 *
 *      "Table 34 #149 17:31:53"    →  mesa 34,   ticket 149, 17:31:53
 *      "#3 3:17:12"                →  mesa #3,   ticket 3,   3:17:12
 *      "Sofia #3 3:17:12"          →  mesa #3,   ticket 3,   3:17:12   (el nombre se ignora)
 *      "6 #34 1:03:01"             →  mesa #34,  ticket 34,  1:03:01   (cabecera cortada)
 *
 *  El cronómetro se sigue leyendo aunque no se enseñe como dato de la cabecera: de él
 *  sale la toma de orden (reloj de la tablet − cronómetro = el momento en que el
 *  contador del ticket estaba en 00:00:00).
 *
 *  Devuelve null si no hay nada que partir. Quien llama tiene los campos sueltos de
 *  respaldo, así que devolver null no pierde la lectura: solo la deja en manos del
 *  camino antiguo.
 */
export function leerCabecera(texto) {
    const linea = String(texto ?? '')
        .replace(/\s+/g, ' ')

        /*  LA HORA PROMETIDA NO ES UN CRONÓMETRO
         *
         *  En una de las dos vistas de Toast, un pedido online enseña arriba a la
         *  derecha a qué hora se prometió —'@3:35p'— en lugar de cuánto lleva esperando.
         *  El prompt pide copiar entonces el tiempo del FIRE, pero si el modelo copia
         *  la hora prometida de todos modos, aquí se tira: leída como cronómetro diría
         *  que el pedido lleva 3 minutos y 35 segundos, y la toma de orden saldría
         *  inventada. Sin cronómetro la lectura se descarta, que es lo honrado.
         */
        .replace(/@\s*\d{1,2}:\d{2}\s*(?:[ap]\.?\s?m?\.?)?/gi, ' ')
        .trim();
    if (!linea) return null;

    //  El cronómetro es el primer 'h:mm:ss' o 'mm:ss'. El 'G/2' de la cabecera no
    //  estorba: no lleva dos puntos.
    const conTiempo = linea.match(/\b(\d{1,2}:\d{2}(?::\d{2})?)\b/);

    //  La mesa: 'Table N'. La palabra 'Table' es además la prueba de que la cabecera se
    //  vio ENTERA, y por eso solo esta lectura cuenta como fiable.
    const conMesa = linea.match(/\bTable\s*#?\s*(\d+)/i);

    //  El ticket: lo que sigue al '#'. Se busca con el tramo de la mesa ya quitado,
    //  porque hay cabeceras que escriben 'Table #16' y ese '#' no es el del ticket.
    const sinMesa = conMesa ? linea.replace(conMesa[0], ' ') : linea;
    const ticket = sinMesa.match(/#\s*([A-Za-z0-9]+)/)?.[1] ?? '';

    /*  SIN MESA, EL TICKET OCUPA SU LUGAR — PERO COMO LECTURA NO FIABLE
     *
     *  Que falte 'Table' puede ser por dos motivos que desde aquí no se distinguen:
     *  que el pedido de verdad no tenga mesa, o que la tarjeta haya caído en el borde
     *  de una tira y el modelo solo viera "6 #34 1:03:01" de "Table 16 #34 1:03:01".
     *  De ese segundo caso salía la mesa «6», que apareció cuatro veces sin existir.
     *
     *  Marcándola no fiable, quien llama no deja que pise a una lectura con 'Table' del
     *  mismo ticket hecha desde la tira vecina, que sí ve la tarjeta entera. Y si el
     *  pedido de verdad no tiene mesa, nunca llegará nada mejor y se queda el '#N'.
     */
    const mesa = conMesa?.[1] ?? (ticket ? `#${ticket}` : '');
    const mesaFiable = Boolean(conMesa);

    //  Los pedidos por internet traen un identificador de sistema con barras
    //  ('owner-com|Ashley Marin|ZEIq…'). Ya no se usa como mesa, pero sirve para
    //  saber de qué tipo es el pedido cuando el modelo lo copia.
    const canal = linea.includes('|') ? 'Online Ordering' : '';

    return { mesa, ticket, tiempo: conTiempo?.[1] ?? '', mesaFiable, canal };
}
