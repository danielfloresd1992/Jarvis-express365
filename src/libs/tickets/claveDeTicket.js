/*  ─────────────────────────────────────────────────────────────────────────────
 *  LA IDENTIDAD DE UNA TARJETA
 *
 *  En la pantalla del expedidor de Toast UN MISMO TICKET SALE EN VARIAS TARJETAS, una
 *  por curso. La mesa 8 con el ticket #80 aparece a la vez como
 *
 *      Table 8 #80 · APPETIZER · FIRE 5:38      (la entrada, ya en marcha)
 *      Table 8 #80 · ENTREE    · HOLD           (el plato fuerte, retenido)
 *
 *  Con el número de ticket a secas por clave, las dos chocan: en el acumulado la
 *  segunda pisa a la primera, y en la parrilla queda UNA fila cuyo 'listo' baila según
 *  cuál de las dos nombró el modelo al final. La entrada se despacha, la fila se sella
 *  como lista… y el plato fuerte seguía retenido.
 *
 *  Así que la clave lleva también el curso. Y cuadra con lo que la parrilla quería
 *  desde el principio: la columna «Tipo de plato» es exactamente eso, una fila por
 *  curso de cada ticket.
 *
 *  SOLO ENTRAN EN LA CLAVE LOS CURSOS CONOCIDOS, y es a propósito. El rótulo de los
 *  pedidos para llevar («Take Out», «UberEats Delivery») no distingue tarjetas —de esos
 *  hay una sola por ticket— y meterlo en la clave solo añadiría una forma más de que
 *  una errata del modelo parta un pedido en dos filas.
 *
 *  Lo usan dos sitios que TIENEN que coincidir: el espejo de la tablet, al acumular lo
 *  que lee, y el simulador, al apuntar la verdad con la que se compara.
 *
 *  ⚠  LÍMITE CONOCIDO: dos envíos del mismo ticket con el MISMO curso (la mesa pide un
 *     segundo plato fuerte más tarde) siguen compartiendo clave. Se ha visto en
 *     pantalla, pero es raro; distinguirlos exigiría comparar sus horas de entrada.
 *  ───────────────────────────────────────────────────────────────────────────── */


//  Las formas en que puede venir escrito cada curso, en la pantalla o por el modelo.
const CURSOS_CONOCIDOS = {
    appetizer: 'appetizer',
    appetizers: 'appetizer',
    entrada: 'appetizer',
    entradas: 'appetizer',

    entree: 'entree',
    entrees: 'entree',
    'plato fuerte': 'entree',
    principal: 'entree',
    main: 'entree',

    dessert: 'dessert',
    desserts: 'dessert',
    postre: 'dessert',
    postres: 'dessert',

    drinks: 'drinks',
    drink: 'drinks',
    bebida: 'drinks',
    bebidas: 'drinks',

    sides: 'sides',
    side: 'sides',
};


/**
 * El curso de una tarjeta en su forma canónica, o '' si el texto no es un curso.
 *
 * @param {string} texto  el rótulo tal como se lee: 'APPETIZER', 'Entrée', 'Take Out'…
 * @returns {'appetizer'|'entree'|'dessert'|'drinks'|'sides'|''}
 */
export function cursoDeTarjeta(texto) {
    const limpio = String(texto ?? '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')   //  'Entrée' → 'Entree'
        .trim()
        .toLowerCase();

    return CURSOS_CONOCIDOS[limpio] ?? '';
}


/**
 * La clave de una tarjeta que sí muestra su número de ticket.
 *
 * @param {string|number} numero      el número que sigue al '#'
 * @param {string}        [tipoLeido] el rótulo de la tarjeta, si lo hay
 */
export function claveDeTicket(numero, tipoLeido) {
    const curso = cursoDeTarjeta(tipoLeido);

    return curso ? `tk-${numero}·${curso}` : `tk-${numero}`;
}
