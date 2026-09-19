/*  ─────────────────────────────────────────────────────────────────────────────
 *  CÓMO SE TROCEA LA PANTALLA PARA LEERLA
 *
 *  Los modelos de visión ENCOGEN la imagen antes de mirarla. La pantalla de cocina es
 *  ancha y lleva treinta tarjetas, así que tras el encogido cada número de mesa queda
 *  en un puñado de píxeles y deja de distinguirse. Por eso no se manda entera: se manda
 *  un trozo cada vez.
 *
 *  HISTORIA, PARA NO REPETIRLA
 *
 *  Pantalla completa: no leía nada. Cuadrícula 2×2: empezó a leer, pero ponía «FIRE» o
 *  «N/A» como número de mesa. Cuadrícula 4×4: pixeles de sobra y AUN ASÍ salían mesas
 *  llamadas «Arepa Llanera» o «Nestea Limon».
 *
 *  Ahí estaba el error de enfoque. El problema nunca fue solo el tamaño de la letra:
 *  era que una cuadrícula PARTE LAS TARJETAS. Un ticket es una cabecera —mesa, número
 *  y cronómetro— con sus renglones de producto debajo, y puede ser alto. Al cortar por
 *  la mitad de la pantalla, muchos recortes se quedaban con renglones sueltos y NINGUNA
 *  cabecera. Preguntarle a un modelo por el número de mesa de una imagen que solo tiene
 *  nombres de platos no le deja alternativa: contesta lo único que ve.
 *
 *  POR ESO AHORA SE CORTA EN TIRAS VERTICALES, NO EN CUADRÍCULA
 *
 *  Las tarjetas se apilan en columnas, así que una tira de altura completa contiene
 *  tickets ENTEROS. Y para que ninguna quede partida por el borde, las tiras se solapan:
 *  una tarjeta que cae a caballo entre dos está completa al menos en una de ellas.
 *
 *  LOS DOS VALORES VAN JUNTOS
 *
 *      recorrido completo = TIRAS_DE_LECTURA × INTERVALO_LECTURA_MS
 *
 *  Subir las tiras sin bajar el intervalo alarga el recorrido, y un pedido puede entrar
 *  y salir sin que nadie lo vea. Con 5 × 5 s el barrido es de 25 segundos, tres veces
 *  más vivo que el minuto largo de antes.
 *  ───────────────────────────────────────────────────────────────────────────── */


//  En cuántas tiras verticales se corta la pantalla. Cada una va de arriba abajo.
//  Es el máximo: una pantalla estrecha se corta en menos (ver 'tirasParaElAncho').
export const TIRAS_DE_LECTURA = 5;


/*  CUÁNTAS TIRAS LE TOCAN A UNA CAPTURA, SEGÚN SU ANCHO
 *
 *  Cinco tiras se ajustaron para una pantalla de cocina ANCHA, con treinta tarjetas.
 *  Pero el restaurante también tiene tablets de 1024 px, y ahí cinco son demasiadas: en
 *  la vista de tres columnas anchas (254 px cada una), NINGUNA tira contiene entera la
 *  cabecera de las columnas 2 y 3. El corte cae sobre el cronómetro, que va pegado al
 *  borde derecho de la cabecera; sin cronómetro la lectura se descarta, y dos tercios de
 *  la pantalla no se leían nunca. Lo destapó el simulador de Toast, no una tablet.
 *
 *  LA CUENTA. Con el solape, una tarjeta cabe entera en alguna tira si mide como mucho
 *
 *      2 × SOLAPE × (ancho de la captura / tiras)
 *
 *  A 1024 px: con 5 tiras eso son 164 px —menos que una tarjeta de cualquiera de las dos
 *  vistas de Toast, de 195 y 254—; con 3 tiras son 273, y caben las dos.
 *
 *  Más ancha que 1280 px se deja como estaba: esa pantalla es la que se midió con cinco.
 */
export function tirasParaElAncho(anchoPx) {
    return anchoPx > 0 && anchoPx <= 1280 ? 3 : TIRAS_DE_LECTURA;
}


/*  Cuánto se ensancha cada tira hacia sus vecinas, como fracción de su propio ancho.
 *
 *  Es lo que evita que una tarjeta se pierda por caer justo en un borde. Con 0.4 cada
 *  tira mide 1,8 veces su parte, de modo que cualquier tarjeta más estrecha que eso
 *  aparece entera en alguna. El precio es leer cada tarjeta un par de veces, que no
 *  estorba: la parrilla acumula por identidad, no por lectura.
 */
export const SOLAPE_DE_LECTURA = 0.4;


//  Cada cuánto se manda una tira al modelo.
export const INTERVALO_LECTURA_MS = 5000;


/*  Cuántas lecturas hacen falta para haber mirado la pantalla entera.
 *
 *  Lo usa el censo del seguimiento, que durante un recorrido completo apunta lo que ya
 *  estaba para no contarlo como recién llegado. Sale de aquí y no de una constante
 *  aparte a propósito: escrito en dos sitios, el día que alguien cambie el troceado
 *  esto se queda corto y el fallo no da la cara — simplemente empiezan a aparecer
 *  pedidos viejos como si acabaran de entrar.
 *
 *  Es el número MÁXIMO de tiras. En una pantalla estrecha, cortada en menos, el censo
 *  dura algo más de un recorrido: sobra, que es el lado bueno para equivocarse.
 */
export const LECTURAS_POR_RECORRIDO = TIRAS_DE_LECTURA;


//  Cuánto tarda en mirarse la pantalla entera. Es el retraso máximo con el que puede
//  aparecer un pedido nuevo, y también lo que dura el censo inicial.
export const RECORRIDO_COMPLETO_MS = TIRAS_DE_LECTURA * INTERVALO_LECTURA_MS;
