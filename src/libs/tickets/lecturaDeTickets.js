/*  ─────────────────────────────────────────────────────────────────────────────
 *  QUÉ SE LE PIDE AL MODELO, Y CÓMO SE ENTIENDE LO QUE CONTESTA
 *
 *  Esto vive aparte de TabletScreen a propósito: no tiene nada de React, y hay un
 *  segundo cliente que lo necesita. El banco de pruebas —el que compara modelos con
 *  capturas de verdad— importa de aquí.
 *
 *  Si el banco usara su propia copia del prompt, mediría algo parecido pero distinto
 *  a lo que corre en la ventana, y la comparación no valdría para decidir nada.
 *  ───────────────────────────────────────────────────────────────────────────── */


/*  ═════════════════════════════════════════════════════════════════════════
 *  LA CABECERA SE TRANSCRIBE, NO SE DESCOMPONE
 *
 *  Este es el cambio que más ha movido la aguja, y conviene entender por qué.
 *
 *  Pidiéndole mesa, número y cronómetro como tres campos, salían filas con la hora
 *  de una tarjeta, el número de otra y una mesa que no era de ninguna. No era que
 *  leyera mal —las horas eran correctas—: era que al componer los objetos CRUZABA
 *  campos entre tarjetas vecinas. Es el fallo clásico de pedir extracción
 *  estructurada sobre una imagen con diez tarjetas, y afinar el texto no lo quita.
 *
 *  Ahora se le pide que COPIE la cabecera entera en una sola cadena, y la mesa, el
 *  número y el cronómetro se sacan de ahí con una expresión regular. Saliendo los
 *  tres del mismo texto, el cruce no es menos probable: es IMPOSIBLE.
 *
 *  Transcribir es además lo más fácil que se le puede pedir a un modelo de visión;
 *  estructurar es lo más difícil.
 *
 *  OJO CON LA LONGITUD. La primera versión pedía la cabecera ENTERA —mesero, G/2,
 *  línea FIRE y todo— y el modelo local se pasaba de los 60 s de límite: seis
 *  tarjetas por tira, cada una con su parrafada, es mucho texto que escribir. Se
 *  quedó en lo único que se parsea: mesa, # y tiempo. Si algún día hay que añadir un
 *  campo, que sea a costa de otro.
 *
 *  DOS COSAS QUE YA NO SE PIDEN, Y POR QUÉ:
 *
 *  · EL COLOR. Resultó ser una alarma de tiempo y no un paso del proceso: por
 *    debajo de hora y media la tarjeta es amarilla y por encima roja, sin más.
 *    Como el cronómetro ya se lee, el color lo deducimos nosotros —mejor y
 *    gratis—. Los datos que lo zanjaron están en cronometro.js.
 *
 *  · «rojo», el booleano viejo, que era lo mismo por otro nombre.
 *
 *  Y UNA QUE SÍ SE PIDE: si el ticket está despachado. Toast lo enseña de dos maneras
 *  y 'listo' recoge las dos en una sola pregunta, para no gastar otro campo:
 *
 *    · las PALOMITAS VERDES que la cocina pone renglón a renglón, y
 *    · la TARJETA ENTERA EN VERDE, que es como la pantalla del expedidor marca que
 *      todas las estaciones terminaron sus ítems.
 *
 *  Ese verde es el ÚNICO color que dice algo del proceso. El paso de amarillo a rojo
 *  sigue siendo la alarma de edad que configura el restaurante en Toast («Warning
 *  Colors»), y por eso sigue sin preguntarse.
 *
 *  LA INSTRUCCIÓN MÁS IMPORTANTE ES LA DE LA CABECERA. Un recorte puede caer entre
 *  dos tarjetas y quedarse con renglones de producto sueltos; sin decirle nada, el
 *  modelo contesta lo único que ve y aparecen mesas llamadas «Arepa Llanera» o
 *  «FIRE». Diciéndole que sin cabecera no hay ticket, calla.
 *  ═════════════════════════════════════════════════════════════════════════ */
const CLAVES_DEL_TICKET = [
    'Cada ticket es una tarjeta: una CABECERA de color (con la mesa, el numero de',
    'ticket y un cronometro) y debajo sus renglones de productos.',
    '',
    'REGLA PRINCIPAL: incluye SOLO los tickets cuya CABECERA se vea completa en',
    'esta imagen. Si ves renglones de productos sueltos, sin la cabecera que les',
    'corresponde, NO los incluyas: no son un ticket. Es NORMAL que en una imagen',
    'no haya ninguna cabecera completa; en ese caso responde [] y ya esta.',
    '',
    'Nunca uses como "mesa" el nombre de un producto, ni las palabras FIRE,',
    'COCINAR, HOLD, EN PAUSA, PAGADO o CONTINUA: son rotulos de la pantalla.',
    '',
    'OJO: un mismo numero de ticket puede salir en VARIAS tarjetas, una por curso',
    '(APPETIZER, ENTREE...). Cada tarjeta es un objeto aparte: no las juntes.',
    '',
    'Un objeto por cada tarjeta con cabecera visible, con estas tres claves:',
    '',
    '"cabecera": copia de la cabecera de esa tarjeta en UNA sola cadena corta, con',
    '            solo esto y en este orden: la mesa, que se escribe con la palabra',
    '            "Table" y su numero (si la tarjeta NO tiene mesa, no pongas nada',
    '            en su lugar); el "#" con el numero de ticket; y el tiempo.',
    '            El tiempo es el contador de la esquina superior derecha de la',
    '            cabecera. Si ahi no hay un contador sino una hora con "@" delante',
    '            (como "@3:35p"), copia en su lugar el tiempo que va detras de la',
    '            palabra FIRE o COCINAR.',
    '            Copialos tal como se ven, sin corregir ni completar nada. NO',
    '            incluyas nombres de clientes ni del mesero, ni el "G/2".',
    '            Ejemplos de como quedaria:',
    '              "Table 34 #149 17:31:53"',
    '              "Table 21 #35 3:53"',
    '              "#3 3:17:12"',
    '',
    '"tipo": el rotulo que la tarjeta lleva encima de sus productos: el curso',
    '        (APPETIZER, ENTREE, DESSERT...) o el tipo de pedido (Take Out,',
    '        UberEats Delivery, Online Ordering...). Copialo tal como se lee. Si la',
    '        tarjeta no lleva ninguno escribe "".',
    '',
    '"listo": true si TODOS los productos de la tarjeta tienen una palomita verde',
    '         (sencilla o doble) a su izquierda, o si el fondo de la tarjeta es',
    '         verde. En cualquier otro caso escribe false.',
    '',
    'Se breve: no añadas ninguna clave mas, ni comentarios, ni explicaciones.',
    '',
    'Formato exacto de la respuesta:',
    '[{"cabecera":"Table 26 #54 2:23","tipo":"ENTREE","listo":false}]',
];


//  El prompt entero, tal cual se manda. Lo usa la ventana y lo usa el banco de pruebas.
export const PROMPT_DE_LECTURA = [
    'Mira esta captura de una pantalla de cocina con tickets.',
    'Responde UNICAMENTE con un array JSON. Sin explicaciones, sin texto antes ni despues.',
    '',
    ...CLAVES_DEL_TICKET,
    '',
    'Si no ves ningun ticket responde: []',
].join('\n');


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


/*  Extrae el array de tickets del texto que devuelve el modelo.
 *
 *  Distingue DOS resultados que parecían el mismo y no lo son:
 *
 *    []    la pantalla estaba vacía. Es una respuesta BUENA: no había tickets.
 *    null  no se entendió nada — contestó en prosa, cortó el JSON a medias, o vino
 *          vacía.
 *
 *  Confundirlos salía caro: quien llama borra los tickets de esa tira para que los
 *  pedidos terminados desaparezcan, y hacer eso con un 'null' borraba una zona entera
 *  de la parrilla por una respuesta ilegible.
 */
export function extraerTickets(texto) {
    const crudo = String(texto ?? '').trim();
    if (!crudo) return null;

    //  El modelo suele envolver el JSON en un bloque markdown aunque se le pida que no.
    const sinMarcas = crudo.replace(/```(?:json)?/gi, '').trim();

    const desde = sinMarcas.indexOf('[');
    const hasta = sinMarcas.lastIndexOf(']');

    if (desde === -1 || hasta === -1 || hasta < desde) return null;

    try {
        const lista = JSON.parse(sinMarcas.slice(desde, hasta + 1));
        return Array.isArray(lista) ? lista : null;
    }
    catch {
        return null;
    }
}
