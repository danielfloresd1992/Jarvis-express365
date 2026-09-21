/*  ─────────────────────────────────────────────────────────────────────────────
 *  LAS DOS APARIENCIAS DE LA PANTALLA DE COCINA DE TOAST
 *
 *  Toast enseña el mismo contenido con dos aspectos, y las tablets del restaurante
 *  tienen de los dos. Se nombran por cómo se ven y no por «vieja» y «nueva», que es
 *  como empiezan las confusiones:
 *
 *      BARRA OSCURA      «Expediter - 1». Barra negra con los botones en texto, tres
 *                        columnas anchas, FIRE y HOLD en grande, modificadores en
 *                        cursiva granate. Lo despachado: cuerpo verde y cabecera gris.
 *
 *      BOTONES CON BORDE «Expo - 2», «Bar - Doral». Todo sobre gris claro, botones con
 *                        borde, cinco columnas estrechas, contador de tickets abajo a
 *                        la derecha. Puede ir en español: COCINAR, EN PAUSA, CONTINÚA,
 *                        PAGADO. Lo listo se pone crema; lo despachado, verde con
 *                        doble palomita.
 *
 *  NINGÚN NÚMERO DE AQUÍ ES A OJO. Colores y medidas están sacados píxel a píxel de
 *  capturas reales de 1024 px de ancho. Importa que sean fieles: la IA lee una imagen,
 *  y lo que se prueba contra un dibujo que no se parece al de verdad no dice nada de
 *  cómo leerá el de verdad.
 *  ───────────────────────────────────────────────────────────────────────────── */


export const fuente = (px, peso = 400, cursiva = false) =>
    `${cursiva ? 'italic ' : ''}${peso} ${px}px Roboto, "Segoe UI", Arial, sans-serif`;


const TEXTOS_INGLES = {
    fuego: 'FIRE',
    pausa: 'HOLD',
    sigue: 'Continued...',
    viene: '...Continued',
    recuperada: 'RECALLED',
    pagado: 'PAID',
    noPagado: 'NOT PAID',
    vistaTotal: 'All day view',
    recientes: 'Recently fulfilled',
    recuperar: 'Recall',
    tickets: 'Tickets',
    tituloVistaTotal: 'All Day',
};

const TEXTOS_ESPANOL = {
    fuego: 'COCINAR',
    pausa: 'EN PAUSA',
    sigue: 'CONTINÚA →',
    viene: '← CONTINÚA',
    recuperada: 'RECUPERADO',
    pagado: 'PAGADO',
    noPagado: 'NO PAGADO',
    vistaTotal: 'Vista En total',
    recientes: 'Recientemente',
    //  El rótulo entero es «Recientemente completados»: la segunda palabra no cabe y el
    //  botón la corta (ver barraClara en pintar.js).
    recientesSegundoRenglon: 'completados',
    recuperar: 'Recuperar',
    tickets: 'tickets',
    tituloVistaTotal: 'En total',
};




export const TEMA_OSCURA = {
    id: 'oscura',
    nombre: 'Barra oscura · «Expediter - 1»',
    estacion: 'Expediter - 1',

    ancho: 1024,
    alto: 768,
    fondo: '#dddde4',

    //  Dónde caben tarjetas: bajo la barra y sobre los tres botones de Android.
    area: { arriba: 91, abajo: 716 },

    columna: { x0: 4, ancho: 254, hueco: 8, huecoVertical: 6, borde: 6, radio: 0, cuantas: 3 },

    bordes: { mesa: '#00872e', llevar: '#7cb4ee' },

    cabecera: {
        alto: 64,
        normal:     { fondo: '#333333', texto: '#ffffff' },
        aviso:      { fondo: '#f1e166', texto: '#333333' },
        peligro:    { fondo: '#f53655', texto: '#ffffff' },
        despachada: { fondo: '#777a87', texto: '#ffffff' },
    },

    cuerpo: {
        normal: '#ffffff',
        lista: '#cdf9dc',
        despachada: '#cdf9dc',
        franja: '#ebebef',
        franjaHecha: '#c0e6d1',
    },

    tinta: {
        texto: '#333333',
        rotulo: '#393e4b',
        franja: '#171c19',
        fuego: '#f53655',
        modificador: '#932033',
        retenido: '#666666',
        continua: '#00b53d',
        palomita: '#00cb44',
    },

    //  La franja del curso va ENCIMA del FIRE, centrada y en mayúsculas.
    franjaAntesDelFuego: true,
    franjaCentrada: true,
    cursoEnMayusculas: true,

    //  En esta vista un pedido online enseña su hora prometida ('@3:35p') donde los
    //  demás llevan el contador. El tiempo que corre solo se ve en el FIRE.
    horaPrometidaEnCabecera: true,

    /*  Los cuerpos de letra, medidos sobre las capturas por el ancho de palabras enteras:
     *  productos a 20, modificadores y franja a 16, FIRE a 28, rótulo a 29 y cabecera a
     *  19,5 y 16. Antes iban un 10 % más pequeños: las posiciones coincidían, pero
     *  «BOILED YUCCA SIDE» cabía en un renglón —en la tablet ocupa dos— y el Uber largo
     *  de las capturas, con 24 px menos, cabía entero en su columna y no llegaba a
     *  partirse en «Continued…».
     */
    m: {
        padTrasCabecera: 8,
        franjaAlto: 32, franjaPx: 16,
        rotuloPx: 29, rotuloLinea: 34, rotuloPie: 15,
        fuegoAlto: 44, fuegoPx: 28, trasFuego: 11,
        cabTituloPx: 19.5, cabTextoPx: 16,
        //  Cuánto queda cada línea base por encima del pie de su renglón.
        nombreDescenso: 4, modDescenso: 3, rotuloSube: 0.18, fuegoCentro: 0.33,
        //  Las X se miden desde el borde INTERIOR de la tarjeta (ya pasado el marco).
        //  179: «GUASACACA 12 OZ» y «HALLAQUITAS SIDE» caben; «BOILED YUCCA SIDE» no.
        nombrePx: 20, nombreLinea: 24, nombreX: 68, nombreAncho: 179, cantidadX: 41,

        //  155 y no más: en la tablet «BLACK BEANS 6 OZ (M)» se parte en dos renglones
        //  y «Mojo De Yuca Aparte» no. De ese renglón de más depende que la tarjeta
        //  quepa o no bajo la anterior, es decir, en qué columna acaba.
        modPx: 16, modLinea: 18, modX: 78, modAncho: 155, modCursiva: true,
        trasNombre: 10, entreMods: 8, entreProductos: 20, pie: 10,

        //  El «Continued...» de abajo va pegado al pie; el «...Continued» de arriba deja
        //  aire antes del primer producto, y a cambio ese último trozo casi no lleva pie.
        continuaAlto: 21, continuaArribaAlto: 41, pieDelUltimoTrozo: 2, continuaPx: 18,
        palomitaX: 12, palomitaRadio: 9,
    },

    textos: {
        ...TEXTOS_INGLES,
        vistaTotal: 'SHOW ALL DAY VIEW',
        recientesOcultar: 'HIDE RECENTLY FULFILLED',
        recientesMostrar: 'SHOW RECENTLY FULFILLED',
        recuperar: 'RECALL',
    },
};




const TEMA_CLARA_BASE = {
    id: 'clara',
    nombre: 'Botones con borde · «Expo - 2»',
    estacion: 'Expo - 2',

    ancho: 1024,
    alto: 768,
    fondo: '#dcdcdc',

    //  El contador de tickets ocupa la esquina de abajo: las columnas acaban antes.
    area: { arriba: 96, abajo: 688 },

    columna: { x0: 9, ancho: 195, hueco: 8, huecoVertical: 8, borde: 6, radio: 8, cuantas: 5 },

    //  Las tarjetas ocupan renglones enteros de una rejilla de veinte por columna (ver
    //  maquetar.js). El alto del renglón sale del de la pantalla: lo calcula temaCon.
    rejilla: { renglones: 20, paso: 30 },

    bordes: { mesa: '#3cac10', llevar: '#9fc5f0' },

    cabecera: {
        normal:  { fondo: '#000000', texto: '#ffffff' },
        aviso:   { fondo: '#e5bf00', texto: '#252525' },
        peligro: { fondo: '#f07166', texto: '#252525' },
        //  Aquí lo despachado NO cambia de cabecera: se reconoce por el cuerpo verde.
        despachada: null,
    },

    cuerpo: {
        normal: '#ffffff',
        lista: '#fdedb4',
        despachada: '#d3eac8',
        franja: '#e5e5e5',
        franjaHecha: '#e5e5e5',
    },

    tinta: {
        texto: '#252525',
        rotulo: '#252525',
        franja: '#252525',
        fuego: '#d40023',
        modificador: '#d40023',
        retenido: '#252525',
        //  El letrero de CONTINÚA y su raya van en un rojo más apagado que el COCINAR.
        continua: '#da4545',
        palomita: '#006400',
        pagado: '#006400',
        noPagado: '#d40023',
    },

    //  Al revés que la oscura: primero el COCINAR y debajo la franja, a la izquierda.
    franjaAntesDelFuego: false,
    franjaCentrada: false,
    cursoEnMayusculas: false,

    //  También aquí un pedido con hora prometida ('@2:16p', se ve en los de DoorDash)
    //  la enseña arriba a la derecha, donde los demás llevan el contador.
    horaPrometidaEnCabecera: true,

    /*  LA LETRA ES MÁS GRANDE DE LO QUE PARECE. Medido sobre las capturas por el alto de
     *  las mayúsculas (en Roboto, 0,711 del cuerpo) y por el ancho de palabras enteras:
     *  productos a 20, modificadores a 18, COCINAR y rótulo a 22, cabecera a 22–23. Con
     *  letra más pequeña la pantalla «se parece», pero cada renglón se parte por otro
     *  sitio, las tarjetas miden otra cosa y acaban en otra columna.
     */
    m: {
        padTrasCabecera: 7,
        franjaAlto: 28, franjaPx: 20, franjaMargen: 2, franjaTextoX: 6, antesDeFranja: 7, trasFranja: 12,
        rotuloPx: 22, rotuloPeso: 500, rotuloLinea: 28, rotuloPie: 2,
        //  Con 6 de margen «UberEats Delivery» cabe en un renglón, como en la tablet, y
        //  «DoorDash Delivery» —que es más ancho que el hueco— baja a un segundo.
        rotuloMargen: 6,
        fuegoAlto: 28, fuegoPx: 22, fuegoCentro: 0.32, trasFuego: 11,

        /*  DÓNDE SE PARTE CADA RENGLÓN, que es de lo que depende el alto de la tarjeta.
         *  Los dos anchos salen de acorralar lo que en las capturas cabe y lo que no:
         *
         *      productos        «DE TIA MICA» (113,97) cabe y «MULTICULTU» (114,86) no
         *      modificadores    «MAMPOSTEAO» en cursiva (119,07) cabe; «1/2 CHICKEN»
         *                       (119,62) y «FRENCH FRIES» (119,99) no. Por eso en una
         *                       tarjeta EN PAUSA, en cursiva —que es más estrecha—,
         *                       «FRENCH FRIES» va entero y en las demás se parte
         *
         *  'nombreAnchoPartido' es una regla EMPÍRICA: cuando una palabra no cabe y hay
         *  que partirla por letras, Toast deja más aire a la derecha en TODO el nombre.
         *  No sabemos por qué, pero con 104 salen las dos particiones que hay en las
         *  capturas: «PARRILLA / MULTICULT / URAL» y «HALLAQUI / TAS SIDE / (4)» —esta
         *  última, con 114 de ancho, saldría «HALLAQUIT / AS SIDE (4)»—.
         */
        nombrePx: 20, nombreLinea: 24, nombreX: 62, nombreAncho: 114.4, nombreAnchoPartido: 104, cantidadX: 41,
        modPx: 18, modLinea: 21, modX: 62, modAncho: 119.3, modCursiva: false,
        //  Sin pie: el blanco que se ve bajo el último producto es el que sobra hasta
        //  completar el renglón de la rejilla, no un margen. Y el renglón de un
        //  modificador acaba 4 px bajo su línea base, no 5 ('modDescenso'): con uno más,
        //  la mesa 61 de las capturas (WHOLE CHICKEN con dos guarniciones) ya no cabe
        //  en sus diez renglones de rejilla y sale 30 px más alta que en la tablet.
        trasNombre: 3, entreMods: 4, modDescenso: 4, trasMods: 1, entreProductos: 12, pie: 0,

        //  El «← CONTINÚA» de arriba ocupa más que el «CONTINÚA →» de abajo: tras su
        //  línea de trazos deja el mismo aire que hay entre el COCINAR y el primer producto.
        continuaAlto: 36, continuaArribaAlto: 50, continuaPx: 20,
        //  El trozo que continúa llega SIEMPRE hasta el pie de la columna, sobre espacio
        //  o no: el letrero va pegado abajo.
        continuaHastaElPie: true,

        palomitaX: 11, palomitaRadio: 10, palomitaY: 11,
        palomitaDobleRadio: 5.5, palomitaDobleSeparacion: 11,
        palomitaModRadio: 6.75, palomitaModDobleRadio: 3.5, palomitaModX: 13, palomitaModY: 9,

        //  LA CABECERA. Título a 23 seminegro; hora, número y cliente a 22; fichas a 18.
        cabTituloPx: 23, cabTituloPeso: 500, cabTextoPx: 22, cabClienteLinea: 26,
        fichaPx: 18, fichaAlto: 25,
        //  Entre el nombre del cliente y la ficha de PAGADO queda este aire. De él sale
        //  el ancho que le queda al nombre, que es poquísimo: «Muigu / el», «An / a …».
        cabAireDelCliente: 17,
    },

    textos: TEXTOS_ESPANOL,
};


export const TEMA_CLARA = TEMA_CLARA_BASE;

export const TEMAS = { oscura: TEMA_OSCURA, clara: TEMA_CLARA };


/**
 * El tema listo para pintar, con las opciones del panel ya aplicadas.
 *
 * @param {'oscura'|'clara'} id
 * @param {object} opciones
 * @param {'es'|'en'} [opciones.idioma]   solo cambia algo en la clara
 * @param {number}    [opciones.alto]     768, o 600 como las tablets de «Bar - Doral»
 * @param {string}    [opciones.estacion] el nombre que sale en la barra
 */
export function temaCon(id, { idioma = 'es', alto = 768, estacion } = {}) {
    const base = TEMAS[id] ?? TEMA_OSCURA;

    const tema = { ...base, alto, estacion: estacion || base.estacion };

    if (base.id === 'clara') {
        tema.textos = idioma === 'en' ? TEXTOS_INGLES : TEXTOS_ESPANOL;
        tema.area = { arriba: 96, abajo: alto - 80 };

        //  Veinte renglones en lo que mida la columna: 30 px con 768 de alto, 21 con 600.
        //  Son los dos valores que se miden en las capturas de «Expo - 2» y «Bar - Doral».
        const { renglones } = base.rejilla;
        tema.rejilla = { renglones, paso: Math.floor((tema.area.abajo - tema.area.arriba + base.columna.huecoVertical) / renglones) };

        //  Las tablets de 600 de alto («Bar - Doral») no solo son más bajas: llevan otra
        //  barra, con los botones más a la derecha y un menú de tres puntos, los tipos
        //  de pedido de la estación bajo su nombre, y la campana abajo (ver pintar.js).
        tema.variante = alto <= 600 ? 'bar' : 'expo';
        tema.subtitulo = 'Take Out, UberEats Takeout, Online Ordering';
    }
    else {
        tema.area = { arriba: 91, abajo: alto - 52 };
    }

    return tema;
}
