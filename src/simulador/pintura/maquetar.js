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
 *      · lo que no cabe en las columnas de la pantalla no se ve
 *
 *  Esos trozos sin cabecera importan: son los «renglones sueltos» que la IA tiene
 *  prohibido tomar por un ticket.
 *  ───────────────────────────────────────────────────────────────────────────── */




/*  Parte un texto en renglones que quepan en 'anchoMax'.
 *
 *  Por palabras, y la palabra que ni sola cabe se corta por letras — que es lo que hace
 *  Toast: en sus columnas estrechas se lee «PARRILLA MULTICULT / URAL» y «HALLAQUI /
 *  TAS SIDE».
 */
export function partirEnLineas(texto, anchoMax, fuenteCss, medir) {
    const lineas = [];
    let actual = '';

    const cabe = (t) => medir(t, fuenteCss) <= anchoMax;

    for (const palabra of String(texto ?? '').split(/\s+/).filter(Boolean)) {
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

function altoDeCabecera(tarjeta, tema, medir) {
    if (tema.id === 'oscura') return { alto: tema.cabecera.alto, lineasNombre: [] };

    //  Clara, con mesa: mesa + hora, número, y la fila de fichas.
    if (tarjeta.mesa !== null) return { alto: 95, lineasNombre: [] };

    //  Clara, sin mesa: el nombre se parte en una columna estrecha junto a la ficha de
    //  PAGADO, como mucho en dos renglones («Guill / erm…»).
    let lineas = tarjeta.cliente ? partirEnLineas(tarjeta.cliente, 58, fuente(18), medir) : [];

    if (lineas.length > 2) {
        lineas = [lineas[0], `${lineas[1].slice(0, Math.max(1, lineas[1].length - 1))}…`];
    }

    return { alto: 34 + Math.max(25, lineas.length * 25) + 6, lineasNombre: lineas };
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
        //  Con 28 de margen «Online Ordering» cabe en un renglón y «UberEats Delivery»
        //  no, que es como sale en la tablet. Ese segundo renglón es el que hace que un
        //  Uber largo no quepa en su columna y acabe en «Continued…».
        const lineas = partirEnLineas(tarjeta.rotulo, anchoInterior - 28, fuente(m.rotuloPx, 700), medir);
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
        if (franja) { aire(8); filas.push(franja); aire(10); }
        else aire(m.trasFuego);
    }

    tarjeta.items.forEach((item, indice) => {
        const cursiva = enPausa;

        const lineasNombre = partirEnLineas(item.nombre, m.nombreAncho, fuente(m.nombrePx, 400, cursiva), medir);

        const mods = item.mods.map(mod => ({
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
            alto: altoNombre + altoMods + (ultimo ? 0 : m.entreProductos),
        });
    });

    aire(m.pie);

    return filas;
}




//  ── EL REPARTO EN COLUMNAS ───────────────────────────────────────────────────

/**
 * @param {Array}    tarjetas  las visibles, ya con sus textos (motor.visibles())
 * @param {object}   tema
 * @param {function} medir     (texto, fuenteCss) → ancho en px
 * @param {object}   [opciones]
 * @param {number}   [opciones.desplazamiento]  px que ocupa a la izquierda la vista «All day»
 */
export function maquetar(tarjetas, tema, medir, { desplazamiento = 0 } = {}) {
    const { columna, area, m } = tema;

    const x0 = columna.x0 + desplazamiento;
    const paso = columna.ancho + columna.hueco;
    const columnasVisibles = Math.max(1, Math.floor((tema.ancho - x0 + columna.hueco) / paso));

    const fragmentos = [];
    const idsVisibles = new Set();

    let col = 0;
    let y = area.arriba;

    const nuevaColumna = () => { col += 1; y = area.arriba; };

    const colocar = (tarjeta, filas, { vieneDeArriba = false, sigueAbajo = false } = {}) => {
        const alto = 2 * columna.borde
            + filas.reduce((suma, fila) => suma + fila.alto, 0)
            + (vieneDeArriba ? m.continuaAlto : 0)
            + (sigueAbajo ? m.continuaAlto : 0);

        if (col < columnasVisibles) {
            fragmentos.push({ tarjeta, col, x: x0 + col * paso, y, ancho: columna.ancho, alto, filas, vieneDeArriba, sigueAbajo });
            idsVisibles.add(tarjeta.id);
        }

        y += alto + columna.huecoVertical;
    };

    for (const tarjeta of tarjetas) {
        let filas = filasDeTarjeta(tarjeta, tema, medir);

        const altoDe = (lista) => 2 * columna.borde + lista.reduce((suma, fila) => suma + fila.alto, 0);

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
            const hueco = area.abajo - y - 2 * columna.borde - (vieneDeArriba ? m.continuaAlto : 0);

            //  ¿Cabe todo lo que queda? Entonces es el último trozo.
            if (filas.reduce((suma, fila) => suma + fila.alto, 0) <= hueco) {
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


    //  Las zonas que responden a un toque, y las cabeceras que el lector puede ver.
    const zonas = [];
    const cabeceras = [];

    for (const fragmento of fragmentos) {
        let yFila = fragmento.y + columna.borde + (fragmento.vieneDeArriba ? m.continuaAlto : 0);

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
    };
}


//  La zona que hay bajo un punto de la pantalla, o null.
export function zonaEn(maqueta, x, y) {
    return maqueta?.zonas.find(z => x >= z.x && x <= z.x + z.ancho && y >= z.y && y <= z.y + z.alto) ?? null;
}
