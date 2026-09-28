import { claveDeTicket, esMesaDeVerdad } from '../tickets/claveDeTicket.js';
import { aSegundosDeCronometro, bandaPorEspera } from '../tickets/cronometro.js';



// getTicketKey = «sacar la clave del ticket»
// La clave es la identidad del pedido: con ella la parrilla sabe a qué fila apuntarle cada lectura.
// Manda el número de ticket (con el curso: un mismo ticket sale en una tarjeta por curso). Sin número, la mesa.
// Recibe: ticket (uno de los de parseModelResponse).
// Devuelve: 'tk-118·appetizer', 'tk-118', '53'… o '' si no tiene ni número ni una mesa de verdad.
function getTicketKey(ticket) {

    // 1. con número de ticket
    if (ticket.ticket) return claveDeTicket(ticket.ticket, ticket.tipo);

    // 2. sin número: la mesa, si es una mesa de verdad (solo dígitos)
    if (esMesaDeVerdad(ticket.mesa)) return ticket.mesa;

    return '';
}



// isTableTail = «es la cola de la mesa»
// Una tarjeta cortada por el borde izquierdo de la tira pierde el PRINCIPIO de su cabecera: de «Table 16» queda «6».
// Recibe: newTable (la mesa recién leída) y previousTable (la que ya había).
// Devuelve: true si la nueva es más corta y es justo el final de la de antes ('6' de '16', '12' de '112').
const isTableTail = (newTable, previousTable) => {
    if (newTable.length >= previousTable.length) return false;

    return previousTable.endsWith(newTable);
}



// chooseTable = «elegir la mesa»
// UNA LECTURA DUDOSA NO PISA A UNA BUENA. El mismo ticket se lee desde dos tiras (se solapan), y en una
// puede caer cortado por el borde: ahí la mesa sale mal, y como llega después pisaba a la buena.
// Recibe: ticket (el recién leído) y previous (el mismo ticket como estaba en el acumulado, o undefined).
// Devuelve: { mesa, mesaFiable }
function chooseTable(ticket, previous) {

    // newIsReliable = «la mesa nueva es fiable»
    const newIsReliable = ticket.mesaFiable === true;

    // previousIsReliable = «la mesa de antes era fiable»
    const previousIsReliable = previous !== undefined && previous.mesaFiable === true;

    // 1. antes había mesa y ahora no viene ninguna: se queda la de antes
    if (previousIsReliable && !newIsReliable) {
        return { mesa: previous.mesa, mesaFiable: true };
    }

    // 2. vienen las dos, pero la nueva es un trozo de la de antes: se queda la de antes.
    //    El modelo ya no copia la palabra «Table», así que un «6» suelto no dice si la cabecera se vio entera.
    if (previousIsReliable && isTableTail(ticket.mesa, previous.mesa)) {
        return { mesa: previous.mesa, mesaFiable: true };
    }

    return { mesa: ticket.mesa, mesaFiable: newIsReliable };
}



// buildStripTicket = «armar el ticket de la tira»
// Deja un ticket con la forma que espera la parrilla.
// Recibe: ticket (el recién leído), clave, strip (la tira que lo leyó) y previous (como estaba antes, o undefined).
// Devuelve: { clave, tira, mesa, mesaFiable, ticket, tiempo, tipo, plato, canal, listo, color, rojo }
function buildStripTicket(ticket, clave, strip, previous) {

    // table = «la mesa elegida»
    const table = chooseTable(ticket, previous);

    // waitSeconds = «los segundos que lleva esperando»
    const waitSeconds = aSegundosDeCronometro(ticket.tiempo);

    // El color no se le pregunta al modelo: es la alarma de tiempo de Toast y sale del cronómetro.
    const color = bandaPorEspera(waitSeconds);

    return {
        clave: clave,
        tira: strip,
        mesa: table.mesa,
        mesaFiable: table.mesaFiable,
        ticket: ticket.ticket,
        tiempo: ticket.tiempo,
        tipo: ticket.tipo,
        plato: '',
        canal: ticket.canal,
        listo: ticket.listo === true,
        color: color,
        rojo: color === 'rojo',
    };
}



// mergeStripTickets = «juntar los tickets de la tira»
// STEP 5. Cada lectura solo ve UNA tira de la pantalla. Aquí los tickets recién leídos de esa tira se juntan
// con los que se conservan de las demás. PURA: no modifica 'accumulated', devuelve uno nuevo.
// Recibe: accumulated (Map clave → ticket, el de la vuelta anterior), tickets (los de parseModelResponse,
//         ya validados) y strip (el número de la tira que se acaba de leer).
// Devuelve: { accumulated: Map nuevo, all: [ todos los tickets de la pantalla, los de todas las tiras ] }
function mergeStripTickets(accumulated, tickets, strip) {

    // Sin lista no hubo lectura: el acumulado se devuelve como estaba (en una copia)
    if (!Array.isArray(tickets)) {
        // sameAccumulated = «el mismo acumulado»
        const sameAccumulated = new Map(accumulated);

        return { accumulated: sameAccumulated, all: [...sameAccumulated.values()] };
    }

    // newAccumulated = «el acumulado nuevo»
    const newAccumulated = new Map();

    // 1. Se conservan los de las OTRAS tiras. Los que esta misma tira trajo la vez anterior se quitan:
    //    si un pedido terminó ya no está en pantalla, y no puede quedarse pegado para siempre.
    for (const [clave, ticket] of accumulated) {
        if (ticket.tira !== strip) newAccumulated.set(clave, ticket);
    }

    // repeatedCount = «cuántas veces va cada nombre repetido»
    const repeatedCount = new Map();

    // 2. Entran los recién leídos
    for (const ticket of tickets) {

        let clave = getTicketKey(ticket);

        // Sin número y sin mesa de verdad ('Take Out'…): la clave lleva la tira y un contador,
        // para que dos pedidos iguales a la vez sean dos filas y no se pisen.
        if (clave === '') {
            // count = «cuántos van con ese nombre»
            const count = (repeatedCount.get(ticket.mesa) ?? 0) + 1;
            repeatedCount.set(ticket.mesa, count);

            clave = `${ticket.mesa}·c${strip}·${count}`;
        }

        // previous = «cómo estaba antes». Se mira en el acumulado que LLEGÓ, no en el ya limpio:
        // la mesa buena pudo leerla esta misma tira en la vuelta anterior.
        const previous = accumulated.get(clave);

        newAccumulated.set(clave, buildStripTicket(ticket, clave, strip, previous));
    }

    return { accumulated: newAccumulated, all: [...newAccumulated.values()] };
}


export { mergeStripTickets };
