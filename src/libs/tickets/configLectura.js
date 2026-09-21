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
 *  CUÁNTO DURA UN RECORRIDO
 *
 *      recorrido completo = tiras × lo que tarde el modelo en contestar cada una
 *
 *  Ya no hay un intervalo fijo entre lecturas: el bucle de inferencia manda la tira
 *  siguiente en cuanto contesta la anterior (libs/inference/inferenceLoop.js). Subir las
 *  tiras alarga el recorrido, y un pedido puede entrar y salir sin que nadie lo vea.
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


/*  Cuántas lecturas hacen falta para haber mirado la pantalla entera.
 *
 *  Lo usa el censo del seguimiento, que durante un recorrido completo apunta lo que ya
 *  estaba para no contarlo como recién llegado. Sale de aquí y no de una constante
 *  aparte a propósito: escrito en dos sitios, el día que alguien cambie el troceado
 *  esto se queda corto y el fallo no da la cara — simplemente empiezan a aparecer
 *  pedidos viejos como si acabaran de entrar.
 *
 *  Es el número MÁXIMO de tiras, y para el censo es solo EL RESPALDO: lo que se usa
 *  cuando no se sabe en cuántas tiras se corta la pantalla que se está mirando.
 *
 *  Aquí ponía que en una pantalla estrecha, cortada en menos, el censo duraba algo más
 *  de un recorrido y que eso era «el lado bueno para equivocarse». No lo era. Con una
 *  tablet de 1024 px —tres tiras— el censo gastaba cinco lecturas, y en las dos de más
 *  la pantalla ya estaba mirada entera: lo único que podían apartar eran pedidos que
 *  habían entrado DESPUÉS de conectar, que son justo los que hay que seguir. Se quedaban
 *  marcados como «ya estaban» y no aparecían nunca en la parrilla.
 *
 *  Ahora el espejo dice en cada entrega en cuántas tiras corta ('tiras', que sale de
 *  'tirasParaElAncho') y el censo dura exactamente eso. Ver libs/inference/processGrid.js.
 *
 *  Sigue contando los recorridos de REOPEN_ROUNDS (processGrid.js), donde pasarse sí es el
 *  lado bueno: allí esperar de más solo retrasa, y esperar de menos inventa un pedido.
 */
export const LECTURAS_POR_RECORRIDO = TIRAS_DE_LECTURA;
