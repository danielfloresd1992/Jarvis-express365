import { CURSO } from './carta.js';




/*  ─────────────────────────────────────────────────────────────────────────────
 *  ESCENAS: PANTALLAS DE TOAST RECREADAS TAL CUAL
 *
 *  Cada una reproduce una captura real de la tablet del restaurante: los mismos
 *  tickets, los mismos tiempos y el mismo estado. Sirven para dos cosas:
 *
 *      · comparar el dibujo del simulador con el de verdad, lado a lado
 *      · tener un caso FIJO que leer. Con pedidos al azar nunca se sabe si un fallo es
 *        de la lectura o de que esta vez tocó una pantalla rara; con una escena, la
 *        respuesta correcta se conoce de antemano.
 *
 *  Una escena para el turno y la cocina: lo que hay en pantalla es lo que hay, con los
 *  cronómetros corriendo. Desde ahí se puede tocar a mano o reanudar.
 *
 *  'edadS' es lo que marca el contador de la cabecera; 'edadFuegoS', el del FIRE.
 *
 *  Lo que una captura no enseña —cuántos comensales hay tras una ficha que no se
 *  transcribió, el código de un repartidor— va puesto a ojo y dicho en su escena. Lo que
 *  SÍ se lee en la cabecera y en los productos va tal cual, porque es lo que se compara.
 *  ───────────────────────────────────────────────────────────────────────────── */


const min = (m, s = 0) => m * 60 + s;

const p = (nombre, mods = [], extra = {}) => ({
    nombre,
    mods: mods.map(texto => (typeof texto === 'string' ? { texto } : texto)),
    ...extra,
});

const nota = (texto) => ({ texto, nota: true });


export const ESCENAS = {

    //  «Expediter - 1», 15:14 — la mesa 8 con entrada despachada y fuerte retenido, y un
    //  pedido online que enseña su hora prometida en vez del contador.
    'expediter-mesa-8': {
        nombre: 'Expediter - 1 · mesa 8 con dos cursos + online',
        ajustes: { tema: 'oscura', amarilloS: min(30), rojoS: min(60) },
        tarjetas: [
            {
                numero: 80, mesa: 8, comensales: 2, mesero: 'Edmily R', tipoOrden: 'mesa',
                curso: CURSO.ENTRADA, estado: 'despachada', edadS: min(5, 38), tiempoCongeladoS: min(5, 38),
                items: [p('AREPITAS DE TIA MICA'), p('QUESO TELITA AL CARBON')],
            },
            {
                numero: 81, cliente: 'Robert Paret', tipoOrden: 'online', rotulo: 'Online Ordering', horaPrometida: '@3:35p', pagado: true,
                edadS: min(4, 20),
                items: [p('1/2 CHICKEN', ['WHITE RICE (M)', 'BLACK BEANS 6 OZ (M)']), p('TOSTONES SIDE')],
            },
            {
                numero: 80, mesa: 8, comensales: 2, mesero: 'Edmily R', tipoOrden: 'mesa',
                curso: CURSO.FUERTE, estado: 'pausa', edadS: min(5, 38),
                items: [p('WHOLE CHICKEN', ['FRESH SALD (M)', 'BOILED YUCCA (M)', nota('Bien Cocido El Pollo'), nota('Mojo De Yuca Aparte')])],
            },
        ],
    },


    //  «Expediter - 1», 20:10 — un Uber tan largo que sigue en la columna de al lado.
    'expediter-continued': {
        nombre: 'Expediter - 1 · ticket largo con «Continued…»',
        ajustes: { tema: 'oscura', amarilloS: 0, rojoS: min(60) },
        tarjetas: [
            {
                numero: 159, mesa: 4, comensales: 3, mesero: 'Edmily R', tipoOrden: 'mesa',
                curso: CURSO.ENTRADA, estado: 'despachada', edadS: min(6, 31), tiempoCongeladoS: min(6, 22),
                items: [p('AREPITAS DE TIA MICA')],
            },
            {
                numero: 163, cliente: 'UBERCB1E3 Jose L.', tipoOrden: 'uber', rotulo: 'UberEats Delivery', pagado: true,
                edadS: 27,
                items: [
                    p('WHOLE CHICKEN', ['HALLAQUITAS (M-4)', 'HALLAQUITAS (M-4)']),
                    p('CRIOLLA SALAD'),
                    p('BOILED YUCCA SIDE'),
                    p('GUASACACA 12 OZ'),
                    p('1/2 CHICKEN', ['TOSTONES (M)', 'FRIED YUCCA (M)']),
                    p('HALLAQUITAS SIDE (4)'),
                ],
            },
            {
                numero: 159, mesa: 4, comensales: 3, mesero: 'Edmily R', tipoOrden: 'mesa',
                curso: CURSO.FUERTE, estado: 'pausa', edadS: min(6, 31),
                items: [
                    p('1/2 CHICKEN', ['TOSTONES (M)', 'AVOCADO (M)']),
                    p('1/2 CHICKEN', ['BOILED YUCCA (M)', 'HALLAQUITAS (M-3)']),
                    p('COLESLAW SALAD SIDE'),
                ],
            },
        ],
    },


    //  «Expo - 2», 15:13 — tres para llevar y una mesa que continúa en la quinta columna.
    'expo-seis-tickets': {
        nombre: 'Expo - 2 · para llevar + mesa que CONTINÚA',
        ajustes: { tema: 'clara', idioma: 'es', amarilloS: 60, rojoS: min(15) },
        tarjetas: [
            {
                numero: 76, cliente: 'Muiguel', tipoOrden: 'takeout', rotulo: 'Take Out', pagado: true, edadS: min(9, 59),
                items: [p('1/2 CHICKEN', ['FRENCH FRIES (M)', 'FRESH SALD (M)'], { cantidad: 2 }), p('FRENCH FRIES SIDE'), p('FRESH SALAD SIDE')],
            },
            {
                numero: 77, cliente: 'UBER 2A0F1', tipoOrden: 'uber', rotulo: 'UberEats Delivery', pagado: true, edadS: min(9, 36),
                items: [p('1/2 CHICKEN', ['FRENCH FRIES (M)', 'AVOCADO (M)'])],
            },
            {
                numero: 80, cliente: 'UBER 5E9C2', tipoOrden: 'uber', rotulo: 'UberEats Delivery', pagado: true, edadS: min(2, 42),
                items: [p('1/2 CHICKEN', ['COLESLAW SALAD (M)', 'BOILED YUCCA (M)'])],
            },
            {
                numero: 79, mesa: 6, comensales: 5, mesero: 'Sofia P', tipoOrden: 'mesa', edadS: min(1, 32),
                items: [
                    p('PARRILLA MULTICULTURAL', ['MEDIUM', 'RIPE PLANTAINS (M)', 'MORCILLA (M-2)', 'MORCILLA (M-2)', nota('No Queso')]),
                    p('FRENCH FRIES SIDE'),
                    p('COLESLAW SALAD SIDE'),
                    p('1/2 CHICKEN', ['WHITE RICE (M)', 'BLACK BEANS 6 OZ (M)']),
                    p('HALLAQUITAS SIDE (4)'),
                    p('LETTUCE CAESAR SALAD'),
                ],
            },
        ],
    },


    //  «Expo - 2», 14:23 — el MISMO ticket #48 en tres tarjetas, y un para llevar sin pagar.
    'expo-mismo-ticket': {
        nombre: 'Expo - 2 · el ticket #48 en tres tarjetas',
        ajustes: { tema: 'clara', idioma: 'es', amarilloS: min(30), rojoS: min(60) },
        tarjetas: [
            {
                numero: 48, mesa: 59, comensales: 2, mesero: 'Jessuly R', tipoOrden: 'mesa',
                curso: CURSO.ENTRADA, estado: 'despachada', edadS: min(5, 22), tiempoCongeladoS: min(5, 0),
                items: [p('AREPITAS DE TIA MICA'), p('QUESO TELITA AL CARBON')],
            },
            {
                //  Sin mesa pero con marco verde: en la captura es un pedido de barra, en el local.
                numero: 51, cliente: '', tipoOrden: 'mesa', rotulo: '', pagado: false, edadS: min(2, 21),
                items: [p('FRANCISCA MEAT BOWL', ['MEDIUM WELL'])],
            },
            {
                numero: 48, mesa: 59, comensales: 2, mesero: 'Jessuly R', tipoOrden: 'mesa',
                curso: CURSO.FUERTE, estado: 'pausa', edadS: min(12, 6),
                items: [
                    p('PABELLON'),
                    p('1/2 CHICKEN', ['WHITE RICE (M)', 'BLACK BEANS 6 OZ (M)']),
                    p('1/2 CHICKEN', ['FRENCH FRIES (M)', 'BOILED YUCCA (M)']),
                ],
            },
            {
                numero: 48, mesa: 59, comensales: 2, mesero: 'Jessuly R', tipoOrden: 'mesa',
                curso: CURSO.FUERTE, estado: 'pausa', edadS: min(5, 22),
                items: [p('TAPA CUADRIL 16 OZ', ['MEDIUM', 'RIPE PLANTAINS (M)', 'MAMPOSTEAO RICE (M)'])],
            },
        ],
    },


    //  «Expo - 2», 16:30 — lo listo en crema y lo despachado en verde con doble palomita.
    'expo-listo-y-despachado': {
        nombre: 'Expo - 2 · uno listo (crema) y uno despachado (verde)',
        ajustes: { tema: 'clara', idioma: 'es', amarilloS: 60, rojoS: min(60) },
        tarjetas: [
            {
                numero: 84, cliente: '', tipoOrden: 'takeout', rotulo: 'Take Out', pagado: true,
                estado: 'despachada', edadS: min(18, 33), tiempoCongeladoS: min(15, 44),
                items: [p('FRANCISCA MEAT BOWL', ['MEDIUM', nota('No Cebolla')]), p('FRANCISCA MEAT BOWL', ['MEDIUM'])],
            },
            {
                numero: 85, mesa: 61, comensales: 2, mesero: 'Jessuly R', tipoOrden: 'mesa',
                estado: 'lista', edadS: min(15, 24),
                items: [p('WHOLE CHICKEN', ['COLESLAW SALAD (M)', 'BOILED YUCCA (M)'])],
            },
        ],
    },


    //  «Expo - 2» — la mesa 51 con la entrada ya despachada (cabecera congelada en 6:57,
    //  COCINAR corriendo en 6:59) y su plato fuerte EN PAUSA, con un Uber despachado en
    //  medio. Es el caso de libro de «un ticket, dos tarjetas»: mismo «Table 51 #230» en
    //  la primera columna y en la tercera, una en verde y otra sin empezar.
    //  A ojo: los comensales de la mesa, el código del Uber y el COCINAR de este último
    //  (de la captura solo se transcribió su cabecera, 7:46).
    'expo-entrada-lista-fuerte-en-pausa': {
        nombre: 'Expo - 2 · entrada despachada y su plato fuerte EN PAUSA',
        ajustes: { tema: 'clara', idioma: 'es', amarilloS: 60, rojoS: min(15) },
        tarjetas: [
            {
                numero: 230, mesa: 51, comensales: 2, mesero: 'Sofia P', tipoOrden: 'mesa',
                curso: CURSO.ENTRADA, estado: 'despachada', edadS: min(6, 59), tiempoCongeladoS: min(6, 57),
                items: [p('PARRILLITA FRANCISCA', ['MORCILLA (M-2)', 'CHORIZO (M-1)', nota('Sos')]), p('PAN DE BONO')],
            },
            {
                numero: 231, cliente: 'UBER 7C41D', tipoOrden: 'uber', rotulo: 'UberEats Delivery', pagado: true,
                estado: 'despachada', edadS: min(7, 52), tiempoCongeladoS: min(7, 46),
                items: [p('WHOLE CHICKEN', ['WHITE RICE (M)', 'RIPE PLANTAINS (M)']), p('RIPE PLANTAINS SIDE')],
            },
            {
                numero: 230, mesa: 51, comensales: 2, mesero: 'Sofia P', tipoOrden: 'mesa',
                curso: CURSO.FUERTE, estado: 'pausa', edadS: min(6, 59),
                items: [
                    p('FRANCISCA CHICKEN BOWL'),
                    p('AVOCADO SIDE'),
                    p('1/2 CHICKEN', ['WHITE RICE (M)', 'BLACK BEANS 6 OZ (M)']),
                ],
            },
        ],
    },


    //  «Bar - Doral» — la tablet del bar: más baja (1024 × 600), en inglés, y solo con
    //  bebidas, que no son de ningún curso: tarjetas sin franja. El nombre largo de la
    //  mesera («Joselayne G») es el que obliga a apilar las fichas a la derecha del número.
    //  A ojo: los comensales de cada mesa.
    'bar-doral-bebidas': {
        nombre: 'Bar - Doral · tres mesas con bebidas (1024 × 600, en inglés)',
        ajustes: { tema: 'clara', idioma: 'en', alto: 600, estacion: 'Bar - Doral', amarilloS: 60, rojoS: min(15) },
        tarjetas: [
            {
                numero: 66, mesa: 57, comensales: 3, mesero: 'Joselayne G', tipoOrden: 'mesa', edadS: min(2, 39),
                items: [p('COCA-COLA ZERO', [], { cantidad: 2 }), p('SPRITE')],
            },
            {
                numero: 67, mesa: 27, comensales: 1, mesero: 'Andrea P', tipoOrden: 'mesa', edadS: min(1, 35),
                items: [p('MANGO JUICE', [nota('Sin Azucar')])],
            },
            {
                numero: 68, mesa: 25, comensales: 2, mesero: 'Andrea P', tipoOrden: 'mesa', edadS: 24,
                items: [p('PASSION F JUICE'), p('TAP WATER')],
            },
        ],
    },
};


//  Lo que una escena no diga de la pantalla vuelve a su sitio. Sin esto, después de la
//  escena del bar todas las demás saldrían a 600 px de alto y con «Bar - Doral» arriba.
const PANTALLA_DE_SIEMPRE = { idioma: 'es', alto: 768, estacion: '' };


/**
 * Deja en el motor exactamente lo que hay en la escena, con el turno y la cocina parados.
 *
 * 'vaciar' levanta también a las mesas que hubiera sentadas: si no, a los pocos minutos
 * entraría en la escena el plato fuerte de una mesa que ya no existe.
 *
 * @returns {object} los ajustes que pide la escena: los de pantalla (tema, idioma,
 *                   umbrales…) y la simulación parada. Quien los aplica es AppSimulador.
 */
export function cargarEscena(motor, id) {
    const escena = ESCENAS[id];
    if (!escena) return null;

    const parada = { turnoEnMarcha: false, autoCocina: false, recientesVisibles: true };

    motor.ajustar(parada);
    motor.vaciar();
    motor.borrarRegistro();

    for (const tarjeta of escena.tarjetas) motor.agregarTarjeta(tarjeta);

    return { ...PANTALLA_DE_SIEMPRE, ...escena.ajustes, ...parada };
}
