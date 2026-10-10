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
// Una tarjeta que asoma cortada por el borde de la pantalla pierde el PRINCIPIO de su cabecera: de
// «Table 16» queda «6».
// Recibe: newTable (la mesa recién leída) y previousTable (la que ya había).
// Devuelve: true si la nueva es más corta y es justo el final de la de antes ('6' de '16', '12' de '112').
const isTableTail = (newTable, previousTable) => {
    if (newTable.length >= previousTable.length) return false;

    return previousTable.endsWith(newTable);
}



// chooseTable = «elegir la mesa»
// UNA LECTURA DUDOSA NO PISA A UNA BUENA. Si la lectura anterior sacó bien la mesa y esta la trae mal
// —o no la trae—, se queda la de antes.
// Recibe: ticket (el recién leído) y previous (el mismo ticket en la lectura anterior, o undefined).
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



// buildScreenTicket = «armar el ticket de la pantalla»
// Deja un ticket con la forma que espera la parrilla.
// Recibe: ticket (el recién leído), clave y previous (como estaba en la lectura anterior, o undefined).
// Devuelve: { clave, mesa, mesaFiable, ticket, tiempo, tipo, plato, canal, listo, color, rojo }
function buildScreenTicket(ticket, clave, previous) {

    // table = «la mesa elegida»
    const table = chooseTable(ticket, previous);

    // waitSeconds = «los segundos que lleva esperando»
    const waitSeconds = aSegundosDeCronometro(ticket.tiempo);

    // El color no se le pregunta al modelo: es la alarma de tiempo de Toast y sale del cronómetro.
    const color = bandaPorEspera(waitSeconds);

    return {
        clave: clave,
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



// updateScreenTickets = «poner al día los tickets de la pantalla»
// STEP 5. Cada lectura mira la pantalla ENTERA, así que sus tickets SUSTITUYEN a los de la lectura anterior:
// lo que no viene ya no está en pantalla (y de eso se entera el seguimiento). De la lectura anterior solo se
// mira la mesa de cada ticket, para que una mala no pise a una buena (chooseTable).
// PURA: no modifica 'previousTickets', devuelve uno nuevo.
// Recibe: previousTickets (Map clave → ticket, el de la lectura anterior) y tickets (los de parseModelResponse).
// Devuelve: { byKey: Map nuevo, all: [ todos los tickets de la pantalla ] }
function updateScreenTickets(previousTickets, tickets) {

    // Sin lista no hubo lectura: se devuelve lo de antes, como estaba (en una copia)
    if (!Array.isArray(tickets)) {
        // sameTickets = «los mismos de antes»
        const sameTickets = new Map(previousTickets);

        return { byKey: sameTickets, all: [...sameTickets.values()] };
    }

    // byKey = «los tickets de esta lectura, por su clave»
    const byKey = new Map();

    // repeatedCount = «cuántas veces va cada nombre repetido»
    const repeatedCount = new Map();

    for (const ticket of tickets) {

        let clave = getTicketKey(ticket);

        // Sin número y sin mesa de verdad ('Take Out'…): la clave lleva un contador, para que dos pedidos
        // iguales a la vez sean dos filas y no se pisen.
        if (clave === '') {
            // count = «cuántos van con ese nombre»
            const count = (repeatedCount.get(ticket.mesa) ?? 0) + 1;
            repeatedCount.set(ticket.mesa, count);

            clave = `${ticket.mesa}·c${count}`;
        }

        byKey.set(clave, buildScreenTicket(ticket, clave, previousTickets.get(clave)));
    }

    return { byKey, all: [...byKey.values()] };
}


export { updateScreenTickets };
