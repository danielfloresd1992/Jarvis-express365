import { fuente } from './temas.js';




/*  ─────────────────────────────────────────────────────────────────────────────
 *  MAQUETAR: DE UNA LISTA DE TARJETAS A RECTÁNGULOS EN PANTALLA
 *
 *  Decide dónde cae cada tarjeta, y NO pinta nada: devuelve medidas. Va aparte del
 *  pintor porque su resultado lo usan tres sitios, no uno:
 *
 *      · el pintor, que dibuja lo que aquí se colocó
 *      · los toques: para saber qué producto o qué cabecera hay bajo el ratón
 *      · el lector simulado: para saber qué cabeceras caen ENTERAS dentro de la tira
 *        de pantalla que se «lee», que es justo lo que limita a la IA de verdad
 *
 *  CÓMO REPARTE TOAST LAS TARJETAS, que es lo que aquí se imita:
 *
 *      · en columnas de ancho fijo, de arriba abajo y de izquierda a derecha
 *      · una tarjeta que no cabe en lo que queda de columna pasa a la siguiente
 *      · una que no cabe NI en una columna entera se parte: acaba con «Continued…» y
 *        sigue en la columna de al lado con «…Continued», ya SIN cabecera
 *      · lo que no cabe en las columnas de la pantalla queda en la PANTALLA SIGUIENTE:
 *        se llega con «→|» y se vuelve con «|←», los botones del contador de tickets.
 *        Cada pantalla son las columnas que caben a lo ancho, ni una más (ver 'pagina')
 *      · en la vista clara, además, sobre una REJILLA: cada columna son veinte renglones
 *        iguales y una tarjeta ocupa un número entero de ellos, así que su alto no es
 *        el de su contenido sino el siguiente múltiplo (ver 'enRejilla', más abajo)
 *
 *  Esos trozos sin cabecera importan: son los «renglones sueltos» que la IA tiene
 *  prohibido tomar por un ticket.
 *  ───────────────────────────────────────────────────────────────────────────── */




/*  Parte un texto en renglones que quepan en 'anchoMax'.
 *
 *  Por palabras, y la palabra que ni sola cabe se corta por letras — que es lo que hace
 *  Toast: en sus columnas estrechas se lee «PARRILLA MULTICULT / URAL» y «HALLAQUI /
 *  TAS SIDE».
 *
 *  'anchoSiSeParte' es opcional: el ancho que vale para TODO el texto cuando alguna de
 *  sus palabras no cabe entera. En la vista clara Toast deja entonces más aire a la
 *  derecha (ver 'nombreAnchoPartido' en temas.js).
 */
export function partirEnLineas(texto, anchoMax, fuenteCss, medir, anchoSiSeParte = null) {
    const lineas = [];
    let actual = '';

    const palabras = String(texto ?? '').split(/\s+/).filter(Boolean);

    if (anchoSiSeParte !== null && palabras.some(palabra => medir(palabra, fuenteCss) > anchoMax)) {
        anchoMax = anchoSiSeParte;
    }

    const cabe = (t) => medir(t, fuenteCss) <= anchoMax;

    for (const palabra of palabras) {
        const conEspacio = actual ? `${actual} ${palabra}` : palabra;

        if (cabe(conEspacio)) { actual = conEspacio; continue; }

        if (actual) { lineas.push(actual); actual = ''; }

        //  La palabra sola: si cabe, abre renglón; si no, se trocea por letras.
        let resto = palabra;
        while (resto && !cabe(resto)) {
            let corte = resto.length - 1;
            while (corte > 1 && !cabe(resto.slice(0, corte))) corte--;
            lineas.push(resto.slice(0, corte));
            resto = resto.slice(corte);
        }
        actual = resto;
    }

    if (actual) lineas.push(actual);
    return lineas.length > 0 ? lineas : [''];
}


//  'APPETIZER' se queda así en la vista oscura y pasa a 'Appetizer' en la clara.
const textoDelCurso = (curso, tema) =>
    tema.cursoEnMayusculas ? curso.toUpperCase() : curso.charAt(0).toUpperCase() + curso.slice(1).toLowerCase();


/*  El color de la cabecera según lo que lleva esperando: es la alarma de edad de Toast
 *  («Warning Colors»), con los umbrales que cada restaurante configura. No dice nada
 *  del estado del pedido — y precisamente por eso conviene simularla: es el cambio de
 *  color que la lectura NO debe tomar por un «listo».
 */
export function estadoDeCabecera(tarjeta, tema, umbrales) {
    if (tarjeta.estado === 'despachada' && tema.cabecera.despachada) return 'despachada';

    if (tarjeta.segundosDeEspera >= umbrales.rojoS) return 'peligro';
    if (tarjeta.segundosDeEspera >= umbrales.amarilloS) return 'aviso';
    return 'normal';
}




//  ── LAS FILAS DE UNA TARJETA ─────────────────────────────────────────────────

/*  El nombre del cliente, en la columnita que le deja la ficha de PAGADO: dos renglones
 *  como mucho, y el segundo acaba en puntos suspensivos si sobra texto.
 *
 *  NO se parte como los productos. Ahí Toast llena cada renglón hasta donde quepa; aquí
 *  reparte —es el partido «de alta calidad» de Android—: de todas las maneras de
 *  partir elige la que deja MENOS HUECO en los renglones que no son el último, y solo
 *  rompe una palabra si no le queda otra. Por eso en las capturas se lee «Guill / erm…»
 *  y no «Guille / rmo…», que es lo que saldría llenando: con el apellido detrás son tres
 *  renglones, y «Guill» + «ermo» dejan menos hueco entre los dos que «Guille» + «rmo».
 *  Con un renglón solo por debajo no hay nada que repartir y sale igual que llenando:
 *  «Muigu / el».
 */
export function partirNombreDeCliente(texto, anchoMax, fuenteCss, medir) {
    const s = String(texto ?? '').trim().replace(/\s+/g, ' ');
    if (!s) return [];

    const ancho = (t) => medir(t, fuenteCss);
    if (ancho(s) <= anchoMax) return [s];

    const n = s.length;
    const ROMPER_PALABRA = 1e10;

    //  Dónde se puede partir: en cada espacio y, dentro de las palabras que ni solas
    //  caben, entre dos letras cualesquiera (a un precio que solo se paga si no hay más remedio).
    const precio = new Array(n + 1).fill(Infinity);
    precio[n] = 0;

    let inicio = 0;
    for (const palabra of s.split(' ')) {
        const fin = inicio + palabra.length;
        if (fin < n) precio[fin] = 0;
        if (ancho(palabra) > anchoMax) for (let i = inicio + 1; i < fin; i++) precio[i] = ROMPER_PALABRA;
        inicio = fin + 1;
    }

    //  mejor[j]: lo más barato de partir s[0, j) acabando renglón justo en j.
    const mejor = new Array(n + 1).fill(Infinity);
    const desde = new Array(n + 1).fill(0);
    mejor[0] = 0;

    for (let j = 1; j <= n; j++) {
        if (precio[j] === Infinity) continue;

        //  Hacia atrás: en cuanto un renglón no cabe, los que empiezan antes tampoco.
        for (let i = j - 1; i >= 0; i--) {
            const arranque = s[i] === ' ' ? i + 1 : i;
            if (arranque >= j) continue;

            const hueco = anchoMax - ancho(s.slice(arranque, j));

            //  Un renglón que no cabe solo se admite si es una letra sola: algo hay que poner.
            if (hueco < 0 && j - arranque > 1) break;

            if (mejor[i] === Infinity) continue;

            const coste = mejor[i] + precio[j] + (j === n ? 0 : hueco * hueco);
            if (coste < mejor[j]) { mejor[j] = coste; desde[j] = i; }
        }
    }

    const cortes = [];
    for (let j = n; j > 0; j = desde[j]) cortes.unshift(j);

    const lineas = [];
    let i = 0;
    for (const j of cortes) {
        lineas.push(s.slice(s[i] === ' ' ? i + 1 : i, j));
        i = j;
    }

    if (lineas.length <= 2) return lineas;

    //  Más de dos: el segundo se queda con lo que quepa de TODO lo que falta, y «…».
    //  Sin recortar el espacio final, como Android: de «Ana Lopez» queda «An / a …».
    const comienzo = cortes[0] + (s[cortes[0]] === ' ' ? 1 : 0);
    let resto = s.slice(comienzo);
    while (resto.length > 1 && ancho(`${resto}…`) > anchoMax) resto = resto.slice(0, -1);

    return [lineas[0], `${resto}…`];
}


//  Lo que mide una ficha de la cabecera clara: el texto más el icono y los márgenes.
//  Las de mesa (comensales, mesero) llevan un icono algo mayor que las de PAGADO.
export const anchoDeFicha = (contenido, tema, medir, deMesa) =>
    medir(contenido, fuente(tema.m.fichaPx)) + (deMesa ? 34 : 30);


function altoDeCabecera(tarjeta, tema, medir) {
    if (tema.id === 'oscura') return { alto: tema.cabecera.alto, lineasNombre: [] };

    const { m } = tema;
    const anchoInterior = tema.columna.ancho - 2 * tema.columna.borde;

    /*  Clara, con mesa: mesa + hora, número, y la fila de fichas. Si las dos fichas no
     *  caben una junto a otra —un mesero de nombre largo, «Joselayne G»—, se apilan a
     *  la derecha del número, en dos renglones. La cabecera mide lo mismo.
     */
    if (tarjeta.mesa !== null) {
        const fichas = 6 + anchoDeFicha(String(tarjeta.comensales ?? ''), tema, medir, true) + 4 + anchoDeFicha(tarjeta.mesero ?? '', tema, medir, true) + 2;

        return { alto: 95, lineasNombre: [], fichasApiladas: fichas > anchoInterior };
    }

    //  Clara, sin mesa: al nombre le queda lo que no ocupa la ficha de PAGADO, que es
    //  bien poco; con la de NO PAGADO, que es más ancha, ni «Ana» cabe entero.
    const rotuloDePago = tarjeta.pagado === null || tarjeta.pagado === undefined ? ''
        : tarjeta.pagado ? tema.textos.pagado : tema.textos.noPagado;

    const anchoFicha = rotuloDePago ? anchoDeFicha(rotuloDePago, tema, medir, false) : 0;
    const anchoNombre = anchoInterior - 4 - anchoFicha - (rotuloDePago ? m.cabAireDelCliente : 0);

    const lineas = tarjeta.cliente ? partirNombreDeCliente(tarjeta.cliente, anchoNombre, fuente(m.cabTextoPx), medir) : [];

    return { alto: 34 + Math.max(1, lineas.length) * m.cabClienteLinea + 5, lineasNombre: lineas, anchoFicha };
}


export function filasDeTarjeta(tarjeta, tema, medir) {
    const { m, textos } = tema;
    const anchoInterior = tema.columna.ancho - 2 * tema.columna.borde;

    const filas = [];
    const aire = (alto) => filas.push({ tipo: 'aire', alto });

    filas.push({ tipo: 'cabecera', ...altoDeCabecera(tarjeta, tema, medir) });
    aire(m.padTrasCabecera);

    if (tarjeta.recuperada) filas.push({ tipo: 'recuperada', alto: 24, texto: textos.recuperada });

    if (tarjeta.rotulo) {
        //  En la oscura, con 28 de margen «Online Ordering» cabe en un renglón y
        //  «UberEats Delivery» no, que es como sale en la tablet. Ese segundo renglón es
        //  el que hace que un Uber largo no quepa en su columna y acabe en «Continued…».
        //  En la clara la letra es menor y el margen también: ver 'rotuloMargen'.
        const lineas = partirEnLineas(tarjeta.rotulo, anchoInterior - (m.rotuloMargen ?? 28), fuente(m.rotuloPx, m.rotuloPeso ?? 700), medir);
        filas.push({ tipo: 'rotulo', lineas, alto: lineas.length * m.rotuloLinea + m.rotuloPie });
    }

    const enPausa = tarjeta.estado === 'pausa';

    const fuego = {
        tipo: 'fuego',
        alto: m.fuegoAlto,
        pausa: enPausa,
        texto: enPausa ? textos.pausa : `${textos.fuego}${tema.id === 'oscura' ? '  ' : ' '}${tarjeta.tiempoFuego}`,
    };

    const franja = tarjeta.curso ? { tipo: 'franja', alto: m.franjaAlto, texto: textoDelCurso(tarjeta.curso, tema) } : null;

    if (tema.franjaAntesDelFuego) {
        if (franja) filas.push(franja);
        filas.push(fuego);
        aire(m.trasFuego);
    }
    else {
        filas.push(fuego);
        if (franja) { aire(m.antesDeFranja); filas.push(franja); aire(m.trasFranja); }
        else aire(m.trasFuego);
    }

    tarjeta.items.forEach((item, indice) => {
        const cursiva = enPausa;

        const lineasNombre = partirEnLineas(item.nombre, m.nombreAncho, fuente(m.nombrePx, 400, cursiva), medir, m.nombreAnchoPartido ?? null);

        const mods = (item.mods ?? []).map(mod => ({
            nota: Boolean(mod.nota),
            lineas: partirEnLineas(mod.texto, m.modAncho, fuente(m.modPx, 400, m.modCursiva || cursiva), medir),
        }));

        const altoNombre = lineasNombre.length * m.nombreLinea;

        const altoMods = mods.length === 0 ? 0
            : m.trasNombre + mods.reduce((suma, mod) => suma + mod.lineas.length * m.modLinea, 0) + (mods.length - 1) * m.entreMods;

        const ultimo = indice === tarjeta.items.length - 1;

        filas.push({
            tipo: 'item',
            indice,
            cantidad: item.cantidad,
            hecho: item.hecho,
            retenido: enPausa,
            lineasNombre,
            mods,
            altoNombre,
            //  El hueco con el producto siguiente va DENTRO de la fila: así, si la
            //  tarjeta se parte, se parte entre productos y nunca por mitad de uno.
            alto: altoNombre + altoMods + (ultimo ? 0 : m.entreProductos + (mods.length > 0 ? (m.trasMods ?? 0) : 0)),
        });
    });

    aire(m.pie);

    return filas;
}




//  ── EL REPARTO EN COLUMNAS ───────────────────────────────────────────────────

/*  LAS PANTALLAS. Toast no encoge las tarjetas para que quepan todas: reparte las que hay
 *  en tantas columnas como hagan falta y enseña las que caben a lo ancho. El resto
 *  sigue ahí, a la derecha, en la pantalla siguiente. Así que aquí se reparte SIEMPRE
 *  todo, y después se corta la ventana de columnas que toca: la página k enseña las
 *  columnas k·V … k·V+V−1, con V las que caben.
 *
 *  Pasar página NO vuelve a repartir nada: la columna 5 es la misma columna 5 se mire
 *  desde donde se mire. Por eso una tarjeta partida entre la última columna de una
 *  pantalla y la primera de la siguiente se ve como en la tablet: aquí acaba en
 *  «CONTINÚA →» y allí arranca con su «← CONTINÚA», sin cabecera.
 *
 *  Una página que ya no existe —se despacharon tarjetas y sobran columnas— se recorta a
 *  la última que sí: quien llama lee en 'pagina' la que de verdad se pintó.
 */

/**
 * @param {Array}    tarjetas  las visibles, ya con sus textos (motor.visibles())
 * @param {object}   tema
 * @param {function} medir     (texto, fuenteCss) → ancho en px
 * @param {object}   [opciones]
 * @param {number}   [opciones.desplazamiento]  px que ocupa a la izquierda la vista «All day»
 * @param {number}   [opciones.pagina]          qué pantalla se enseña; la primera es la 0
 *
 * @returns lo de LA PÁGINA PINTADA — 'fragmentos', 'zonas', 'cabeceras', 'idsVisibles' y
 *          'ocultas' (las tarjetas que no asoman en ella)—, que es lo que se ve, lo que se
 *          toca y lo que lee el lector simulado; y además 'pagina', 'paginas',
 *          'hayAntes', 'hayDespues' y 'paginaDeLaTarjeta' (id → en qué pantalla está su cabecera).
 */
export function maquetar(tarjetas, tema, medir, { desplazamiento = 0, pagina = 0 } = {}) {
    const { columna, area, m } = tema;

    const x0 = columna.x0 + desplazamiento;
    const paso = columna.ancho + columna.hueco;
    const columnasVisibles = Math.max(1, Math.floor((tema.ancho - x0 + columna.hueco) / paso));

    //  Los trozos de TODAS las columnas, quepan o no en la pantalla. 'col' es aquí la
    //  columna absoluta, contando desde la primera de la primera pantalla.
    const repartidos = [];

    let col = 0;
    let y = area.arriba;

    const nuevaColumna = () => { col += 1; y = area.arriba; };

    //  El letrero de arriba («…Continued») puede ocupar más que el de abajo.
    const altoViene = m.continuaArribaAlto ?? m.continuaAlto;

    const suma = (filas) => filas.reduce((total, fila) => total + fila.alto, 0);

    /*  EL ALTO DE UNA TARJETA NO ES EL DE SU CONTENIDO. En la vista clara Toast coloca
     *  las tarjetas sobre una rejilla de renglones iguales —veinte por columna— y cada
     *  una ocupa un número ENTERO de ellos: lo que le sobra se queda en blanco por
     *  abajo. En las capturas de 768 de alto todas miden 30·n − 8 (232, 322, 442…) y en
     *  las de 600, 21·n − 8. Sin esto las tarjetas salen unos píxeles más cortas, en
     *  una columna caben más que en la tablet, y acaban en otra columna.
     */
    const renglon = tema.rejilla?.paso ?? 0;

    const enRejilla = (alto) => (renglon > 0
        ? Math.ceil((alto + columna.huecoVertical) / renglon) * renglon - columna.huecoVertical
        : alto);

    const altoDe = (filas, { vieneDeArriba = false } = {}) =>
        enRejilla(2 * columna.borde + suma(filas) + (vieneDeArriba ? altoViene : 0));

    const colocar = (tarjeta, filas, { vieneDeArriba = false, sigueAbajo = false } = {}) => {
        //  El trozo que continúa, en la clara, llega siempre hasta el pie de la columna.
        const alto = sigueAbajo && m.continuaHastaElPie
            ? Math.max(area.abajo - y, 2 * columna.borde + suma(filas) + (vieneDeArriba ? altoViene : 0) + m.continuaAlto)
            : sigueAbajo
                ? 2 * columna.borde + suma(filas) + (vieneDeArriba ? altoViene : 0) + m.continuaAlto
                : altoDe(filas, { vieneDeArriba });

        repartidos.push({ tarjeta, col, y, ancho: columna.ancho, alto, filas, vieneDeArriba, sigueAbajo });

        y += alto + columna.huecoVertical;
    };

    for (const tarjeta of tarjetas) {
        let filas = filasDeTarjeta(tarjeta, tema, medir);

        //  No cabe en lo que queda de esta columna, pero la columna ya tiene algo:
        //  pasa entera a la siguiente.
        if (y > area.arriba && y + altoDe(filas) > area.abajo) nuevaColumna();

        if (y + altoDe(filas) <= area.abajo) {
            colocar(tarjeta, filas);
            continue;
        }

        //  Ni en una columna entera: se parte en trozos.
        let vieneDeArriba = false;

        while (filas.length > 0) {
            const hueco = area.abajo - y - 2 * columna.borde - (vieneDeArriba ? altoViene : 0);

            //  ¿Cabe todo lo que queda? Entonces es el último trozo.
            if (y + altoDe(filas, { vieneDeArriba }) <= area.abajo) {
                //  En la oscura ese último trozo acaba con menos pie que una tarjeta entera.
                const ultima = filas[filas.length - 1];
                if (vieneDeArriba && ultima?.tipo === 'aire' && m.pieDelUltimoTrozo !== undefined) ultima.alto = m.pieDelUltimoTrozo;

                colocar(tarjeta, filas, { vieneDeArriba });
                break;
            }

            //  Si no, las que quepan dejando sitio para el «Continued…» de abajo. Al
            //  menos una, o una fila imposible de alta dejaría esto dando vueltas.
            const trozo = [];
            let usado = 0;

            while (filas.length > 0 && (trozo.length === 0 || usado + filas[0].alto <= hueco - m.continuaAlto)) {
                usado += filas[0].alto;
                trozo.push(filas.shift());
            }

            colocar(tarjeta, trozo, { vieneDeArriba, sigueAbajo: true });

            //  El trozo siguiente no empieza con aire suelto.
            while (filas.length > 0 && filas[0].tipo === 'aire') filas.shift();

            vieneDeArriba = true;
            nuevaColumna();
        }
    }


    //  ── LA PANTALLA QUE SE ENSEÑA ────────────────────────────────────────────

    const columnasUsadas = repartidos.reduce((cuantas, trozo) => Math.max(cuantas, trozo.col + 1), 0);
    const paginas = Math.max(1, Math.ceil(columnasUsadas / columnasVisibles));

    //  Lo que llegue que no sea un número de página —un NaN, un decimal, uno negativo—
    //  acaba en una página que existe: aquí no se pinta nunca una pantalla en blanco
    //  habiendo tarjetas.
    const paginaPintada = Math.min(paginas - 1, Math.max(0, Math.floor(Number(pagina)) || 0));
    const primeraColumna = paginaPintada * columnasVisibles;

    //  En qué pantalla está cada tarjeta: donde cae su CABECERA, que es por donde se la
    //  reconoce. Sus trozos «…Continued» pueden asomar en la siguiente.
    const paginaDeLaTarjeta = new Map();
    for (const trozo of repartidos) {
        if (!paginaDeLaTarjeta.has(trozo.tarjeta.id)) paginaDeLaTarjeta.set(trozo.tarjeta.id, Math.floor(trozo.col / columnasVisibles));
    }

    //  Desde aquí 'col' es la columna EN PANTALLA, de 0 a V−1: es con la que se coloca.
    const fragmentos = repartidos
        .filter(trozo => trozo.col >= primeraColumna && trozo.col < primeraColumna + columnasVisibles)
        .map(({ tarjeta, col: absoluta, ...resto }) => ({ tarjeta, col: absoluta - primeraColumna, x: x0 + (absoluta - primeraColumna) * paso, ...resto }));

    const idsVisibles = new Set(fragmentos.map(fragmento => fragmento.tarjeta.id));


    //  Las zonas que responden a un toque, y las cabeceras que el lector puede ver.
    const zonas = [];
    const cabeceras = [];

    for (const fragmento of fragmentos) {
        let yFila = fragmento.y + columna.borde + (fragmento.vieneDeArriba ? altoViene : 0);

        for (const fila of fragmento.filas) {
            fila.y = yFila;

            const zona = { x: fragmento.x, y: yFila, ancho: fragmento.ancho, alto: fila.alto, tarjetaId: fragmento.tarjeta.id };

            if (fila.tipo === 'cabecera') {
                zonas.push({ ...zona, accion: 'despachar' });
                cabeceras.push({ tarjetaId: fragmento.tarjeta.id, x: fragmento.x, ancho: fragmento.ancho });
            }
            if (fila.tipo === 'fuego' && fila.pausa) zonas.push({ ...zona, accion: 'disparar' });
            if (fila.tipo === 'item') zonas.push({ ...zona, accion: 'producto', indice: fila.indice });

            yFila += fila.alto;
        }
    }

    return {
        fragmentos,
        zonas,
        cabeceras,
        idsVisibles,
        columnasVisibles,
        ocultas: tarjetas.filter(t => !idsVisibles.has(t.id)).length,

        pagina: paginaPintada,
        paginas,
        hayAntes: paginaPintada > 0,
        hayDespues: paginaPintada < paginas - 1,
        paginaDeLaTarjeta,
    };
}


//  La zona que hay bajo un punto de la pantalla, o null.
export function zonaEn(maqueta, x, y) {
    return maqueta?.zonas.find(z => x >= z.x && x <= z.x + z.ancho && y >= z.y && y <= z.y + z.alto) ?? null;
}
