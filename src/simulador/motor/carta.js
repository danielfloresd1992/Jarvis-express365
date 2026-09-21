/*  ─────────────────────────────────────────────────────────────────────────────
 *  LA CARTA DEL SIMULADOR
 *
 *  Es la carta REAL del restaurante, copiada de capturas de su pantalla de cocina, con
 *  cada plato bajo el tipo con el que Toast lo encabeza allí: «Appetizer», «Entree» o
 *  «Dessert». Los nombres van TAL CUAL aparecen en pantalla —mayúsculas, abreviaturas y
 *  erratas incluidas («FRESH SALD», «Pexhuga»)—. No es descuido: la lectura por IA tiene
 *  que vérselas con esos textos y no con una carta limpia, y los nombres largos
 *  («PARRILLA MULTICULTURAL») son los que se parten en varios renglones y hacen altas
 *  las tarjetas.
 *
 *  'prep' son minutos, [mínimo, máximo]. El tiempo TOTAL de una tarjeta ya no sale de
 *  aquí —lo fija el turno con los máximos de cada tipo de plato—, pero se conserva como
 *  peso relativo: dentro de un mismo ticket la ensalada sale antes que la parrilla.
 *  ───────────────────────────────────────────────────────────────────────────── */


export const CURSO = {
    ENTRADA: 'APPETIZER',
    FUERTE: 'ENTREE',
    POSTRE: 'DESSERT',
};


//  Guarniciones que van DENTRO de un plato, como modificadores. La '(M)' es de Toast.
export const GUARNICIONES = [
    'WHITE RICE (M)', 'BLACK BEANS 6 OZ (M)', 'FRESH SALD (M)', 'BOILED YUCCA (M)',
    'AVOCADO (M)', 'FRENCH FRIES (M)', 'COLESLAW SALAD (M)', 'RIPE PLANTAINS (M)',
    'TOSTONES (M)', 'FRIED YUCCA (M)', 'MAMPOSTEAO RICE (M)', 'HALLAQUITAS (M-4)',
];

export const TERMINOS = ['MEDIUM', 'MEDIUM WELL', 'MEDIUM RARE', 'WELL DONE'];

//  Lo que el mesero escribe a mano. Toast lo enseña con mayúscula inicial en cada
//  palabra, y con las erratas de quien teclea con prisa: «Pexhuga», «Yucab», «Sos».
export const NOTAS = [
    'No Queso', 'Sin Queso', 'Pechuga', 'Pexhuga', 'Muslo', 'Solo Muslo', 'Sos',
    'Pollo Mojo Aparte', 'Yuca No Mojo', 'Pollo Sin Mojo', 'Chimichurri Aparte',
    'Mojo Aparte De Yucab', 'Mojo De Yuca Aparte', 'Ensalada Aparte', 'Lechuga Tomate',
    'Sin Azucar', 'No Cebolla', 'Bien Cocido El Pollo',
];


/*  'guarniciones' es cuántas lleva el plato; 'termino' si se le pide punto de cocción;
 *  'extras' son modificadores fijos que ese plato trae siempre.
 *
 *  La PARRILLA MULTICULTURAL está dos veces a propósito: en pantalla sale unas veces con
 *  dos morcillas y otras con morcilla y chorizo, y 'extras' es una lista fija, no una
 *  elección. Dos entradas dan las dos variantes sin cambiar la forma del plato — y de
 *  paso hacen que salga el doble, que es el plato de la casa.
 */
export const PLATOS = [
    { nombre: 'PARRILLITA FRANCISCA',   curso: CURSO.ENTRADA, prep: [6, 10], extras: ['MORCILLA (M-2)', 'CHORIZO (M-1)'] },
    { nombre: 'PAN DE BONO',            curso: CURSO.ENTRADA, prep: [3, 6] },
    { nombre: 'QUESO TELITA AL CARBON', curso: CURSO.ENTRADA, prep: [4, 7] },
    { nombre: 'AREPITAS DE TIA MICA',   curso: CURSO.ENTRADA, prep: [4, 8] },
    { nombre: 'TEQUEÑOS (6)',           curso: CURSO.ENTRADA, prep: [5, 9] },
    { nombre: 'CHICHARRON DE POLLO',    curso: CURSO.ENTRADA, prep: [6, 10] },

    { nombre: '1/4 CHICKEN',            curso: CURSO.FUERTE, prep: [7, 12],  guarniciones: 2 },
    { nombre: '1/2 CHICKEN',            curso: CURSO.FUERTE, prep: [8, 14],  guarniciones: 2 },
    { nombre: 'WHOLE CHICKEN',          curso: CURSO.FUERTE, prep: [10, 18], guarniciones: 2 },
    { nombre: 'PARRILLA MULTICULTURAL', curso: CURSO.FUERTE, prep: [14, 22], guarniciones: 1, termino: true, extras: ['MORCILLA (M-2)', 'MORCILLA (M-2)'] },
    { nombre: 'PARRILLA MULTICULTURAL', curso: CURSO.FUERTE, prep: [14, 22], guarniciones: 1, termino: true, extras: ['MORCILLA (M-2)', 'CHORIZO (M-1)'] },
    { nombre: 'SNAPPER FISH',           curso: CURSO.FUERTE, prep: [12, 18] },
    { nombre: 'ENTRAÑA 10 OZ',          curso: CURSO.FUERTE, prep: [10, 16], guarniciones: 2, termino: true },
    { nombre: 'TAPA CUADRIL 16 OZ',     curso: CURSO.FUERTE, prep: [12, 20], guarniciones: 2, termino: true },
    { nombre: 'FRANCISCA CHICKEN BOWL', curso: CURSO.FUERTE, prep: [8, 13] },
    { nombre: 'FRANCISCA MEAT BOWL',    curso: CURSO.FUERTE, prep: [9, 15],  termino: true },
    { nombre: 'CRUZADO DE RES Y AVE',   curso: CURSO.FUERTE, prep: [12, 18] },
    { nombre: 'PABELLON',               curso: CURSO.FUERTE, prep: [8, 13] },
    { nombre: 'CHEESEBURGER',           curso: CURSO.FUERTE, prep: [8, 12],  termino: true },
    { nombre: 'CHICKEN TENDERS',        curso: CURSO.FUERTE, prep: [7, 11],  guarniciones: 1 },

    { nombre: 'BATI BATI BARQUILLITA',  curso: CURSO.POSTRE, prep: [2, 4] },
    { nombre: 'HULA HULA DULCE LECHE',  curso: CURSO.POSTRE, prep: [2, 4] },
    { nombre: 'BROWNIE',                curso: CURSO.POSTRE, prep: [3, 5] },
    { nombre: 'TRES LECHES',            curso: CURSO.POSTRE, prep: [2, 4] },
    { nombre: 'QUESILLO',               curso: CURSO.POSTRE, prep: [2, 4] },
];


//  Acompañantes que se piden sueltos, como un producto más del ticket. No son de ningún
//  curso: una tarjeta que solo lleve de estos sale sin franja.
export const SUELTOS = [
    { nombre: 'FRENCH FRIES SIDE',    prep: [4, 7] },
    { nombre: 'FRESH SALAD SIDE',     prep: [2, 4] },
    { nombre: 'HALLAQUITAS SIDE (4)', prep: [4, 7] },
    { nombre: 'LETTUCE CAESAR SALAD', prep: [3, 6] },
    { nombre: 'CRIOLLA SALAD',        prep: [3, 5] },
    { nombre: 'AVOCADO SIDE',         prep: [1, 3] },
    { nombre: 'RIPE PLANTAINS SIDE',  prep: [4, 7] },
    { nombre: 'GREEN SAUCE SIDE',     prep: [1, 2] },
    { nombre: 'TOSTONES SIDE',        prep: [4, 7] },
    { nombre: 'COLESLAW SALAD SIDE',  prep: [2, 4] },
    { nombre: 'BOILED YUCCA SIDE',    prep: [4, 7] },
    { nombre: 'GUASACACA 12 OZ',      prep: [1, 2] },
];


//  Lo que sale en la pantalla del bar («Bar - Doral»). Con la forma de un plato para
//  que se cocinen igual, pero con el curso vacío: no son entrada, fuerte ni postre.
export const BEBIDAS = [
    { nombre: 'COCA-COLA ZERO',  curso: '', prep: [1, 2] },
    { nombre: 'SPRITE',          curso: '', prep: [1, 2] },
    { nombre: 'MANGO JUICE',     curso: '', prep: [2, 4] },
    { nombre: 'PASSION F JUICE', curso: '', prep: [2, 4] },
    { nombre: 'TAP WATER',       curso: '', prep: [1, 2] },
    { nombre: 'COCONUT LIMEADE', curso: '', prep: [2, 5] },
    { nombre: 'LIMEADE',         curso: '', prep: [2, 4] },
    { nombre: 'POLAR',           curso: '', prep: [1, 2] },
    { nombre: 'STELLA ARTOIS',   curso: '', prep: [1, 2] },
];


export const MESEROS = ['Sofia P', 'Joselayne G', 'Andrea P', 'Jessuly R', 'Yadira S', 'Elena S', 'Edmily R', 'Laleska S'];

export const CLIENTES = ['Muiguel', 'Nathaly', 'Ana', 'Eduardo', 'Guillermo', 'Robert Paret', 'Ashley Marin', 'Julitsa'];

export const REPARTIDORES = ['Jose L.', 'Ana P.', 'Luis M.', 'Kevin R.', 'Daniela S.'];


/*  Los pedidos que no son de mesa, y el rótulo con el que Toast los encabeza. El rótulo
 *  va donde una mesa llevaría la franja del curso, y es lo que la lectura devuelve como
 *  «tipo» de esos pedidos. DoorDash tiene dos: el que reparte y el que pasan a recoger.
 */
export const TIPOS_DE_ORDEN = {
    mesa:            { rotulo: '' },
    takeout:         { rotulo: 'Take Out' },
    uber:            { rotulo: 'UberEats Delivery' },
    doordash:        { rotulo: 'DoorDash Delivery' },
    doordashTakeout: { rotulo: 'DoorDash Takeout' },
    online:          { rotulo: 'Online Ordering' },
};


export const platosDelCurso = (curso) => PLATOS.filter(plato => plato.curso === curso);
