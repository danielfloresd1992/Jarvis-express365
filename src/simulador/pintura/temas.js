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

    columna: { x0: 4, ancho: 254, hueco: 8, huecoVertical: 8, borde: 6, radio: 0, cuantas: 3 },

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

    m: {
        padTrasCabecera: 8,
        franjaAlto: 32, franjaPx: 14,
        rotuloPx: 28, rotuloLinea: 34, rotuloPie: 15,
        fuegoAlto: 44, fuegoPx: 26, trasFuego: 11,
        //  Las X se miden desde el borde INTERIOR de la tarjeta (ya pasado el marco).
        nombrePx: 18, nombreLinea: 24, nombreX: 68, nombreAncho: 166, cantidadX: 41,

        //  136 y no más: en la tablet «BLACK BEANS 6 OZ (M)» se parte en dos renglones
        //  y «Mojo De Yuca Aparte» no. De ese renglón de más depende que la tarjeta
        //  quepa o no bajo la anterior, es decir, en qué columna acaba.
        modPx: 14, modLinea: 18, modX: 78, modAncho: 136, modCursiva: true,
        trasNombre: 10, entreMods: 8, entreProductos: 20, pie: 10,
        continuaAlto: 30, continuaPx: 16,
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

    columna: { x0: 9, ancho: 195, hueco: 8, huecoVertical: 10, borde: 6, radio: 8, cuantas: 5 },

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
        continua: '#d40023',
        palomita: '#006400',
        pagado: '#006400',
        noPagado: '#d40023',
    },

    //  Al revés que la oscura: primero el COCINAR y debajo la franja, a la izquierda.
    franjaAntesDelFuego: false,
    franjaCentrada: false,
    cursoEnMayusculas: false,
    horaPrometidaEnCabecera: false,

    m: {
        padTrasCabecera: 7,
        franjaAlto: 28, franjaPx: 17,
        rotuloPx: 18, rotuloLinea: 28, rotuloPie: 2,
        fuegoAlto: 28, fuegoPx: 18, trasFuego: 11,
        //  Anchos ajustados para que el texto se parta donde lo parte Toast: «MULTICULT /
        //  URAL», «HALLAQUI / TAS SIDE», «FRENCH / FRIES (M)», y «AVOCADO (M)» entero.
        nombrePx: 17, nombreLinea: 24, nombreX: 62, nombreAncho: 91, cantidadX: 40,
        modPx: 15, modLinea: 21, modX: 62, modAncho: 94, modCursiva: false,
        trasNombre: 4, entreMods: 4, entreProductos: 12, pie: 12,
        continuaAlto: 34, continuaPx: 16,
        palomitaX: 11, palomitaRadio: 9,
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
    }
    else {
        tema.area = { arriba: 91, abajo: alto - 52 };
    }

    return tema;
}
