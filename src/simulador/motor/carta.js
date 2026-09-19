/*  ─────────────────────────────────────────────────────────────────────────────
 *  LA CARTA DEL SIMULADOR
 *
 *  Los nombres salen de capturas reales de la pantalla de cocina, escritos TAL CUAL
 *  aparecen allí —mayúsculas, abreviaturas y erratas incluidas («FRESH SALD»)—. No es
 *  descuido: la lectura por IA tiene que vérselas con esos textos y no con una carta
 *  limpia, y los nombres largos («PARRILLA MULTICULTURAL») son los que se parten en
 *  varios renglones y hacen altas las tarjetas.
 *
 *  'prep' son los minutos que tarda la cocina en sacarlo, [mínimo, máximo].
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

//  Lo que el mesero escribe a mano. Va con mayúsculas y minúsculas, como en pantalla.
export const NOTAS = [
    'Bien Cocido El Pollo', 'Mojo De Yuca Aparte', 'Solo Muslo', 'No Cebolla',
    'No Queso', 'Ensalada Aparte', 'Sin Sal', 'Salsa Aparte',
];


/*  'guarniciones' es cuántas lleva el plato; 'termino' si se le pide punto de cocción;
 *  'extras' son modificadores fijos que ese plato trae siempre.
 */
export const PLATOS = [
    { nombre: 'AREPITAS DE TIA MICA',   curso: CURSO.ENTRADA, prep: [4, 8] },
    { nombre: 'QUESO TELITA AL CARBON', curso: CURSO.ENTRADA, prep: [4, 7] },
    { nombre: 'TEQUEÑOS (6)',           curso: CURSO.ENTRADA, prep: [5, 9] },
    { nombre: 'CHICHARRON DE POLLO',    curso: CURSO.ENTRADA, prep: [6, 10] },

    { nombre: '1/2 CHICKEN',            curso: CURSO.FUERTE, prep: [8, 14],  guarniciones: 2 },
    { nombre: 'WHOLE CHICKEN',          curso: CURSO.FUERTE, prep: [10, 18], guarniciones: 2 },
    { nombre: 'PARRILLA MULTICULTURAL', curso: CURSO.FUERTE, prep: [14, 22], guarniciones: 1, termino: true, extras: ['MORCILLA (M-2)', 'MORCILLA (M-2)'] },
    { nombre: 'FRANCISCA MEAT BOWL',    curso: CURSO.FUERTE, prep: [9, 15],  termino: true },
    { nombre: 'TAPA CUADRIL 16 OZ',     curso: CURSO.FUERTE, prep: [12, 20], guarniciones: 2, termino: true },
    { nombre: 'PABELLON',               curso: CURSO.FUERTE, prep: [8, 13] },
    { nombre: 'CHICKEN TENDERS',        curso: CURSO.FUERTE, prep: [7, 11],  guarniciones: 1 },

    { nombre: 'TRES LECHES',            curso: CURSO.POSTRE, prep: [2, 4] },
    { nombre: 'QUESILLO',               curso: CURSO.POSTRE, prep: [2, 4] },
];


//  Acompañantes que se piden sueltos, como un producto más del ticket.
export const SUELTOS = [
    { nombre: 'TOSTONES SIDE',        prep: [4, 7] },
    { nombre: 'FRENCH FRIES SIDE',    prep: [4, 7] },
    { nombre: 'FRESH SALAD SIDE',     prep: [2, 4] },
    { nombre: 'COLESLAW SALAD SIDE',  prep: [2, 4] },
    { nombre: 'HALLAQUITAS SIDE (4)', prep: [4, 7] },
    { nombre: 'BOILED YUCCA SIDE',    prep: [4, 7] },
    { nombre: 'CRIOLLA SALAD',        prep: [3, 5] },
    { nombre: 'LETTUCE CAESAR SALAD', prep: [3, 6] },
    { nombre: 'GUASACACA 12 OZ',      prep: [1, 2] },
];


export const MESEROS = ['Edmily R', 'Laleska S', 'Sofia P', 'Jessuly R', 'Andrea M'];

export const CLIENTES = ['Robert Paret', 'Guillermo', 'Muiguel', 'Ashley Marin', 'Carlos D', 'Maria F', 'Julitsa', 'Mirna'];

export const REPARTIDORES = ['Jose L.', 'Ana P.', 'Luis M.', 'Kevin R.', 'Daniela S.'];


//  Los pedidos que no son de mesa, y el rótulo con el que Toast los encabeza.
export const TIPOS_DE_ORDEN = {
    mesa:    { rotulo: '' },
    takeout: { rotulo: 'Take Out' },
    uber:    { rotulo: 'UberEats Delivery' },
    online:  { rotulo: 'Online Ordering' },
};


export const platosDelCurso = (curso) => PLATOS.filter(plato => plato.curso === curso);
