/*  LAS TARJETAS DE UNA CAPTURA, POR SUS PÍXELES (pedido del usuario: un seguimiento de los tickets en la app)
 *
 *  El modelo de visión lee los números —ticket, mesa, cronómetro— y lo hace despacio y a veces mal. Pero DÓNDE está
 *  cada tarjeta, de qué color va, si tiene palomitas y si ya se despachó, eso lo dicen los píxeles de la captura sin
 *  ninguna duda y en milisegundos. Esta pieza saca eso de una captura; cardTracker.js sigue cada tarjeta de captura en
 *  captura con ello.
 *
 *  Medido en la tablet del restaurante («Expediter - 1», tema oscuro, 1280×800, ver memoria pantalla-toast-real):
 *
 *      columnas     tarjetas en columnas de 162 px desde x = 2; cada tarjeta mide 158 de ancho
 *      marco        3 px de #00872e si es de mesa, #7cb4ee si es para llevar
 *      cabecera     41 px bajo el marco de arriba (56 si el nombre del cliente va en dos renglones)
 *                   #333333 normal · #f1e166 titilando (ticket nuevo) · #0ce055 verde (la cocina terminó) ·
 *                   #777a87 despachada
 *      cuerpo       #ffffff; #cdf9dc verde pálido cuando está despachada (todas las palomitas)
 *      palomita     un círculo #00cb44 a 12-20 px del marco izquierdo, en cada producto hecho
 *
 *  Todo es PURO sobre un buffer de píxeles ({ data, width, height, channels }): vale igual con sharp en Node (los
 *  bancos) que con un canvas en el navegador (la app). Sin ninguna dependencia.
 */


// GRID = «dónde caen las tarjetas»: el borde izquierdo de la primera columna y el paso entre columnas
export const GRID = { left: 2, pitch: 162, width: 158, border: 3, top: 56, bottom: 764, gap: 5 };

// MIN_CARD_HEIGHT = «lo más baja que puede ser una tarjeta» (con cabecera y un producto)
const MIN_CARD_HEIGHT = 60;

// MAX_HEADER_HEIGHT = «lo más alta que es una cabecera» (nombre de cliente en dos renglones)
const MAX_HEADER_HEIGHT = 64;


// distance = «cuánto se parecen dos colores»: la suma de las diferencias por canal
const distance = (r, g, b, [tr, tg, tb]) => Math.abs(r - tr) + Math.abs(g - tg) + Math.abs(b - tb);

// COLORS = «los colores de la pantalla, medidos» ([r, g, b])
export const COLORS = {
    borderTable: [0x00, 0x87, 0x2e],
    borderTakeOut: [0x7c, 0xb4, 0xee],
    headerNormal: [0x33, 0x33, 0x33],
    headerBlink: [0xf1, 0xe1, 0x66],
    headerDone: [0x0c, 0xe0, 0x55],
    headerFulfilled: [0x77, 0x7a, 0x87],
    bodyWhite: [0xff, 0xff, 0xff],
    bodyFulfilled: [0xcd, 0xf9, 0xdc],
    check: [0x00, 0xcb, 0x44],
    background: [0xdd, 0xdd, 0xe4],
};

// HEADER_CLASSES / BODY_CLASSES = «qué clase recibe cada color de cabecera y de cuerpo»
const HEADER_CLASSES = [['normal', COLORS.headerNormal], ['nueva', COLORS.headerBlink], ['cocinada', COLORS.headerDone], ['despachada', COLORS.headerFulfilled]];
const BODY_CLASSES = [['blanco', COLORS.bodyWhite], ['despachada', COLORS.bodyFulfilled]];

// TOLERANCE = «hasta cuánto se admite de diferencia para dar un color por ese»
const TOLERANCE = 40;


// classify = «a qué clase pertenece un color», o 'otro'
function classify(r, g, b, classes) {
    for (const [name, color] of classes) if (distance(r, g, b, color) <= TOLERANCE) return name;
    return 'otro';
}


/*  readScreenCards = «las tarjetas de una captura»
 *
 *  @param {object} image  { data, width, height, channels }: los píxeles, RGB o RGBA, de arriba abajo
 *  @returns {{ cards: Array, offGrid: boolean }}
 *      cards     una por tarjeta, en el orden de la pantalla (columna a columna, de arriba abajo):
 *                { column, left, top, bottom, height, border: 'mesa' | 'llevar', continued: boolean,
 *                  header: 'normal' | 'nueva' | 'cocinada' | 'despachada' | 'otro', headerHeight,
 *                  body: 'blanco' | 'despachada' | 'otro', checks, fulfilled: boolean }
 *                'continued' es un trozo que sigue de la columna anterior: no tiene cabecera propia
 *      offGrid   la captura cayó a mitad de una animación: hay marcos fuera de la rejilla, o tarjetas que se
 *                pisan. No hay que fiarse de ella (ni mandársela al modelo)
 */
export function readScreenCards(image) {
    const { data, width, height, channels } = image;

    // pixel = «el color en (x, y)»
    const pixel = (x, y) => {
        const i = (y * width + x) * channels;
        return [data[i], data[i + 1], data[i + 2]];
    };

    // borderOf = «qué marco hay en (x, y)»: 'mesa', 'llevar' o null
    const borderOf = (x, y) => {
        const [r, g, b] = pixel(x, y);
        if (distance(r, g, b, COLORS.borderTable) <= TOLERANCE) return 'mesa';
        if (distance(r, g, b, COLORS.borderTakeOut) <= TOLERANCE) return 'llevar';
        return null;
    };

    const cards = [];
    let offGrid = false;

    const columns = Math.floor((width - GRID.left) / GRID.pitch);
    const bottom = Math.min(GRID.bottom, height - 1);

    for (let column = 0; column < columns; column++) {
        const left = GRID.left + column * GRID.pitch;
        const borderX = left + 1;                       // el centro del marco izquierdo
        const rightX = left + GRID.width - 2;           // el centro del marco derecho

        let y = GRID.top;
        while (y < bottom) {
            const border = borderOf(borderX, y);
            if (!border) { y++; continue; }

            // El marco sigue hacia abajo mientras conserve su color
            let end = y;
            while (end + 1 <= bottom && borderOf(borderX, end + 1) === border) end++;

            //  Un tramo de marco puede llevar VARIAS tarjetas del mismo color: una recién llegada se pega a la de
            //  arriba sin hueco, o con su marco encima del de la otra (medido). Se separan por sus líneas de marco
            //  de arriba y de abajo, que cruzan toda la anchura (splitRun).
            for (const [top, cardBottom] of splitRun(y, end, (row) => borderOf(innerX(left), row) === border)) {
                if (cardBottom - top + 1 < MIN_CARD_HEIGHT) continue;
                //  El marco derecho tiene que estar donde la rejilla dice; si no, la tarjeta está deslizándose
                const middle = Math.floor((top + cardBottom) / 2);
                if (borderOf(rightX, middle) !== border) offGrid = true;
                cards.push(describeCard({ column, left, top, bottom: cardBottom, border, pixel }));
            }
            y = end + 1;
        }

        //  Un marco que empiece entre columnas (a mitad de un deslizamiento) también delata la animación
        for (let x = left + GRID.width + 2; x < left + GRID.pitch - 2 && x < width; x += 4) {
            if (borderOf(x, GRID.top + 40) || borderOf(x, Math.floor((GRID.top + bottom) / 2))) { offGrid = true; break; }
        }
    }

    //  Y el apilado: en cada columna la primera tarjeta empieza justo bajo la barra, y cada una sigue a la anterior
    //  con un hueco de 4 a 5 px, o sin hueco, o montada 3 px sobre ella si acaba de llegar (medido). Si no, alguna va
    //  a mitad de un deslizamiento vertical.
    for (let column = 0; column < columns; column++) {
        const stack = cards.filter(card => card.column === column);
        stack.forEach((card, index) => {
            if (index === 0) { if (Math.abs(card.top - (GRID.top + 1)) > 2) offGrid = true; return; }
            const gap = card.top - stack[index - 1].bottom - 1;
            if (gap < -GRID.border || gap > GRID.gap + 1) offGrid = true;
        });
    }

    return { cards, offGrid };
}


// innerX = «la columna de píxeles justo por dentro del marco izquierdo»
const innerX = (left) => left + GRID.border + 2;


/*  splitRun = «las tarjetas que hay dentro de un tramo de marco»: [[top, bottom], …]
 *
 *  Dentro de la tarjeta, la columna de píxeles junto al marco es cabecera o cuerpo; solo en sus líneas de marco de
 *  arriba y de abajo (3 filas cada una) vuelve a ser del color del marco. Esas líneas parten el tramo:
 *      · una línea de 3 filas al principio y otra al final: una tarjeta;
 *      · dos líneas seguidas (6 filas): el fondo de una y el techo de la siguiente, pegadas sin hueco;
 *      · una línea de 3 filas en medio del tramo: la siguiente tarjeta se montó sobre el fondo de la anterior.
 *
 *  @param {number}   start, end  el tramo de marco
 *  @param {function} isLine      (fila) => si esa fila es de marco también por dentro
 */
function splitRun(start, end, isLine) {
    const lines = [];
    let y = start;
    while (y <= end) {
        if (!isLine(y)) { y++; continue; }
        let lineEnd = y;
        while (lineEnd + 1 <= end && isLine(lineEnd + 1)) lineEnd++;
        lines.push([y, lineEnd]);
        y = lineEnd + 1;
    }
    if (lines.length < 2) return [[start, end]];

    const cards = [];
    let top = lines[0][0];
    for (let index = 1; index < lines.length; index++) {
        const [lineStart, lineEnd] = lines[index];
        const last = index === lines.length - 1;
        if (last) { cards.push([top, lineEnd]); break; }
        if (lineEnd - lineStart + 1 >= 2 * GRID.border - 1) {
            //  Dos líneas pegadas: el fondo de esta tarjeta y el techo de la siguiente
            cards.push([top, lineStart + GRID.border - 1]);
            top = lineEnd - GRID.border + 1;
        }
        else {
            //  Una línea compartida: la siguiente se montó sobre el fondo de esta
            cards.push([top, lineEnd]);
            top = lineStart;
        }
    }
    return cards;
}


// describeCard = «lo que se ve dentro de una tarjeta»: su cabecera, su cuerpo y sus palomitas
function describeCard({ column, left, top, bottom, border, pixel }) {
    const innerLeft = left + GRID.border;
    const innerTop = top + GRID.border;
    const innerBottom = bottom - GRID.border;
    const height = bottom - top + 1;

    // sampleX = «una columna del interior sin texto»: la pegada al marco izquierdo. El texto empieza 5 px más
    // adentro y las palomitas 9; medido, es la única columna limpia de arriba abajo
    const sampleX = innerLeft + 1;

    //  LA CABECERA: desde el borde de arriba, hasta donde el color de esa columna deja de ser de cabecera.
    let headerHeight = 0;
    const headerVotes = {};
    for (let y = innerTop; y <= Math.min(innerBottom, innerTop + MAX_HEADER_HEIGHT); y++) {
        const cls = classify(...pixel(sampleX, y), HEADER_CLASSES);
        if (cls === 'otro') break;
        headerVotes[cls] = (headerVotes[cls] ?? 0) + 1;
        headerHeight = y - innerTop + 1;
    }
    const header = headerHeight >= 20 ? Object.entries(headerVotes).sort((a, b) => b[1] - a[1])[0][0] : 'otro';

    // continued = «no tiene cabecera: es la continuación de una tarjeta de la columna anterior»
    const continued = headerHeight < 20;

    //  EL CUERPO: la clase dominante de la franja derecha bajo la cabecera
    const bodyVotes = {};
    for (let y = innerTop + headerHeight + 2; y <= innerBottom; y += 3) {
        const cls = classify(...pixel(sampleX, y), BODY_CLASSES);
        bodyVotes[cls] = (bodyVotes[cls] ?? 0) + 1;
    }
    const body = Object.entries(bodyVotes).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'otro';

    //  LAS PALOMITAS: tramos verdes seguidos en la columna izquierda de los círculos (a 10 px del marco). Medido:
    //  el círculo va de x = marco + 10 a + 17 y mide 9 filas; por su centro cruza la marca blanca, así que se mira
    //  por su lado izquierdo, donde el verde es seguido (5 filas)
    const checkX = left + 10;
    let checks = 0;
    let run = 0;
    for (let y = innerTop + headerHeight; y <= innerBottom; y++) {
        const isCheck = distance(...pixel(checkX, y), COLORS.check) <= 70;
        if (isCheck) run++;
        else { if (run >= 4) checks++; run = 0; }
    }
    if (run >= 4) checks++;

    return {
        column, left, top, bottom, height, border, continued,
        header, headerHeight, body, checks,
        fulfilled: header === 'despachada' || body === 'despachada',
    };
}
