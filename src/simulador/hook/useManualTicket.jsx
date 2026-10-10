import { useState, useRef } from 'react';
import { PLATOS, SUELTOS, BEBIDAS, TIPOS_DE_ORDEN, platosDelCurso } from '../motor/carta.js';
import { ENTRADA, FUERTE, POSTRE } from '../comparacion.js';
import { esNumero } from '../formato.js';


/*  CREAR UN TICKET A MANO
 *
 *  Todo lo que se elige en el formulario vive aquí y no en los ajustes: no es una preferencia del
 *  simulador, es un pedido a medio escribir. Tras crear el ticket se vacía la lista de platos y SE
 *  CONSERVA lo demás, porque lo normal es mandar varios seguidos casi iguales: la entrada, y luego el
 *  fuerte del mismo ticket.
 *
 *  Este hook lo usa el propio formulario (ManualTicketForm), y no el controlador, a propósito: con
 *  cada tecla que se escribe cambia su estado, y si viviera en el controlador cada tecla repintaría el
 *  simulador entero.
 */



// ORDER_TYPES = «los pedidos», con el nombre con el que Toast los encabeza. La mesa no lleva rótulo.
const ORDER_TYPES = Object.entries(TIPOS_DE_ORDEN).map(([id, { rotulo }]) => ({ id, nombre: rotulo || 'Mesa' }));

// DISH_TYPES = «los tipos de plato»: su curso, cómo se nombran y qué tiempo máximo les toca
const DISH_TYPES = [
    { curso: ENTRADA, nombre: 'Entrada (Appetizer)', corto: 'Entrada', grupo: 'Entradas', limite: 'limiteEntradaMin' },
    { curso: FUERTE, nombre: 'Plato fuerte (Entree)', corto: 'Plato fuerte', grupo: 'Platos fuertes', limite: 'limiteFuerteMin' },
    { curso: POSTRE, nombre: 'Postre (Dessert)', corto: 'Postre', grupo: 'Postres', limite: 'limitePostreMin' },

    //  Lo que no tiene curso se mide con la vara del plato fuerte, como hace el motor.
    { curso: '', nombre: 'Sin curso', corto: 'sin curso', grupo: '', limite: 'limiteFuerteMin' },
];


// withoutRepeats = «sin platos repetidos»
// La carta trae la PARRILLA MULTICULTURAL dos veces —son dos variantes, para que al motor le salga de las
// dos maneras—; en un desplegable, dos renglones iguales sobran.
const withoutRepeats = (dishes) => dishes.filter((dish, position) => dishes.findIndex(other => other.nombre === dish.nombre) === position);


/*  dishGroups = «los grupos de platos del desplegable»
 *
 *  Los platos que enseña el desplegable según el tipo de plato elegido: los de ESE tipo. «Sin curso»
 *  empieza por lo que de verdad sale sin franja —los acompañantes sueltos— y debajo deja todo lo demás
 *  agrupado: un Take Out no tiene curso y lleva platos fuertes. Sale de la carta y no de una lista
 *  escrita aquí: si mañana cambia la carta del restaurante, el formulario cambia con ella.
 */
const dishGroups = (course) => (course
    ? [{ titulo: '', platos: withoutRepeats(platosDelCurso(course)) }]
    : [
        { titulo: 'Acompañantes sueltos', platos: SUELTOS },
        ...DISH_TYPES.filter(type => type.curso).map(type => ({ titulo: type.grupo, platos: withoutRepeats(platosDelCurso(type.curso)) })),
        { titulo: 'Bebidas', platos: BEBIDAS },
    ]
).filter(group => group.platos.length > 0);

// fixedModifiers = «los modificadores que un plato trae SIEMPRE en la carta» (la morcilla y el chorizo
// de la parrillita): sin ellos la tarjeta pintada no se parecería a la de verdad.
const fixedModifiers = (name) => [...PLATOS, ...SUELTOS, ...BEBIDAS].find(dish => dish.nombre === name)?.extras ?? [];

// wholeNumber = «el número entero de un campo», o null si no hay uno de 1 en adelante
const wholeNumber = (text) => { const whole = Math.floor(Number(text)); return String(text).trim() !== '' && Number.isFinite(whole) && whole >= 1 ? whole : null; };



// useManualTicket = «el ticket a mano»
// Recibe: { engine    el motor
//           refresh   repinta la pantalla y devuelve la maqueta (useScreen)
//           theme }   el tema de la pantalla: con la barra oscura no hay flechas para pasar de pantalla
// Devuelve: lo que pinta el formulario (cada campo con su valor y su función para cambiarlo) y sus
//           dos acciones: add (añadir el plato elegido) y create (mandar el ticket a la pantalla).
function useManualTicket({ engine, refresh, theme }) {

    const [orderType, setOrderType] = useState('mesa');
    const [table, setTable] = useState('');
    const [number, setNumber] = useState('');
    const [course, setCourse] = useState(ENTRADA);

    const [dish, setDish] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [note, setNote] = useState('');

    // lines = «los platos del ticket», cada uno con su id para poder quitarlo
    const [lines, setLines] = useState([]);
    const nextLine = useRef(1);

    const [cookedByHand, setCookedByHand] = useState(true);
    const [onHold, setOnHold] = useState(false);

    // notice = «el aviso de debajo del botón»: { mal, texto }, o null
    const [notice, setNotice] = useState(null);


    const isTable = orderType === 'mesa';
    const dishType = DISH_TYPES.find(type => type.curso === course) ?? DISH_TYPES[0];
    const groups = dishGroups(course);

    //  Sin plato elegido vale el primero de la lista, que es lo que el desplegable enseña.
    const names = groups.flatMap(group => group.platos.map(option => option.nombre));
    const chosenDish = names.includes(dish) ? dish : (names[0] ?? '');


    //  Otro tipo de plato es otra lista: se empieza por su primer plato, aunque el que estaba elegido
    //  siga en ella («Sin curso» los trae todos). Que el desplegable conserve a veces sí y a veces no lo
    //  elegido es peor que no conservarlo nunca.
    const changeCourse = (next) => { setCourse(next); setDish(''); };

    //  Un pedido para llevar no lleva franja de curso en Toast: al elegirlo, el tipo de plato pasa a
    //  «Sin curso» (que enseña todos los platos). Se puede volver a cambiar.
    const changeOrderType = (id) => {
        setOrderType(id);
        if (id !== 'mesa' && orderType === 'mesa') changeCourse('');
    };


    // add = «añadir el plato elegido al ticket»
    const add = () => {
        if (!chosenDish) return;

        setLines(list => [...list, {
            id: nextLine.current++,
            nombre: chosenDish,
            cantidad: Math.min(99, wholeNumber(quantity) ?? 1),
            nota: note.trim(),
            mods: fixedModifiers(chosenDish),
        }]);

        setQuantity('1');
        setNote('');
        setNotice(null);
    };

    const removeLine = (id) => setLines(list => list.filter(line => line.id !== id));


    // create = «mandar el ticket a la pantalla de cocina»
    const create = () => {
        const id = engine.crearTicketManual({
            tipoOrden: orderType,
            mesa: isTable ? wholeNumber(table) : null,
            numero: isTable ? wholeNumber(number) : null,
            curso: course,
            productos: lines.map(({ nombre, cantidad, nota, mods }) => ({ nombre, cantidad, nota, mods })),
            cocinaManual: cookedByHand,
            enPausa: onHold,
        });

        //  'refresh' repinta y devuelve la maqueta: de ahí sale en qué pantalla cayó.
        const layout = refresh();

        if (id === null || id === undefined) return setNotice({ mal: true, texto: 'No se ha creado nada: el ticket no lleva ningún plato.' });

        const log = engine.registro();
        const row = log.find(entry => entry.id === id);

        //  Mismo número y mismo tipo de plato que otra tarjeta que sigue en pantalla: las dos dan la
        //  misma clave y la ventana de la tablet las tomará por un solo pedido.
        const twin = log.some(entry => entry.id !== id && entry.clave === row?.clave && entry.estado !== 'retirada');

        /*  La nueva va la ÚLTIMA, como en Toast: con la cocina llena no cae en la pantalla que se está
         *  viendo sino en otra más a la derecha, y hay que decirlo — un ticket recién creado que no
         *  aparece se toma por un botón que no funciona. Se dice en CUÁL quedó y cómo se llega, porque
         *  la ventana de la tablet solo lee la pantalla que está a la vista: mientras nadie vaya a ella,
         *  ese ticket no existe para Jarvis.
         */
        const itsPage = layout?.paginaDeLaTarjeta?.get(id);
        const jumps = esNumero(itsPage) ? itsPage - layout.pagina : 0;

        const arrow = jumps > 0 ? '«→|»' : '«|←»';
        const times = Math.abs(jumps) > 1 ? ` (${Math.abs(jumps)} veces)` : '';

        //  La barra oscura de Toast no lleva contador de tickets: ahí solo queda el panel.
        const howToGetThere = theme === 'clara'
            ? `Se llega con ${arrow}${times}, junto al contador de tickets de la pantalla de Toast, o con ${jumps > 0 ? '▶' : '◀'} en «Pantalla de Toast».`
            : `Se llega con ${jumps > 0 ? '▶' : '◀'}${times} en «Pantalla de Toast», en este panel.`;

        //  Por si no se ve y no se sabe por qué (no debería pasar): que no quede sin decir.
        const notShown = jumps === 0 && row?.vistaEnPantalla === false;

        setLines([]);
        setNotice({
            mal: twin || jumps !== 0 || notShown,
            texto: `Creado: ${isTable ? `mesa ${row?.mesa}` : ORDER_TYPES.find(option => option.id === orderType)?.nombre} · ticket #${row?.ticket} · ${dishType.corto}${onHold ? ' · en pausa' : ''}.`
                + (twin ? ' Ojo: ya había en pantalla otra tarjeta de ese ticket con el mismo tipo de plato. Comparten clave, así que la ventana de la tablet las verá como un solo pedido.' : '')
                + (jumps !== 0 ? ` Ojo: ha quedado en la pantalla ${itsPage + 1} de ${layout.paginas} y se está viendo la ${layout.pagina + 1} —las tarjetas más antiguas van delante—, así que la ventana de la tablet todavía no lo ve: solo lee la pantalla que está a la vista. ${howToGetThere} Mientras, se maneja desde su fila del registro.` : '')
                + (notShown ? ' Ojo: ahora mismo no sale en la pantalla, así que la ventana de la tablet todavía no lo ve. Mientras, se maneja desde su fila del registro.' : '')
                + (!twin && jumps === 0 && !notShown && isTable ? ` Para mandarle otro curso, pon ${row?.ticket} en «Ticket #».` : ''),
        });
    };


    return {
        orderType, changeOrderType, isTable,
        table, setTable,
        number, setNumber,
        course, changeCourse, dishType,
        groups, chosenDish, setDish,
        quantity, setQuantity,
        note, setNote,
        lines, removeLine,
        cookedByHand, setCookedByHand,
        onHold, setOnHold,
        notice,
        add, create,
    };
}



export { useManualTicket, ORDER_TYPES, DISH_TYPES };
