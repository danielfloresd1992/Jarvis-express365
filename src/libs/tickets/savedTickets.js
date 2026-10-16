/*  BUSCAR UN TICKET DE TOAST EN LAS ROTACIONES GUARDADAS
 *
 *  Un ticket de Toast está guardado si aparece en cualquier rotación guardada del día:
 *
 *      · en uno de sus procesos (process[].ticketNumber), o
 *      · en la mesa de un pedido para llevar, que es su ticket con '#' delante ('#78')
 *
 *  La usa la pestaña «Registros» (RegisterSaved, con su método expuesto hasTicket) para preguntar antes de
 *  que la IA vuelva a registrar un ticket que ya se guardó. Pura: recibe la lista y devuelve lo encontrado.
 */


// ticketKey = «un número de ticket, para comparar»: sin espacios y sin el '#' de los pedidos para llevar.
// '#78', ' 78 ' y 78 son el mismo ticket. '' si no hay número.
export const ticketKey = (ticketNumber) => String(ticketNumber ?? '').trim().replace(/^#\s*/, '');


/*  findSavedTicket = «buscar un ticket en todas las rotaciones guardadas»
 *
 *  Recorre TODAS las rotaciones y, dentro de cada una, TODOS sus procesos. Se queda con la primera vez que
 *  aparece el ticket.
 *
 *  @param {Array}         rotations     las rotaciones guardadas, como las devuelve la API (GET /rotation)
 *  @param {string|number} ticketNumber  el número que se busca ('78', '#78' o 78)
 *  @returns {{ rotation, process }|null} la rotación donde está y el proceso que lo lleva (null si lo
 *           encontró solo en la mesa '#78' de un pedido para llevar). null si no está en ninguna.
 */
export function findSavedTicket(rotations, ticketNumber) {
    const wanted = ticketKey(ticketNumber);
    if (wanted === '') return null;

    for (const rotation of rotations ?? []) {

        for (const process of rotation.process ?? []) {
            if (ticketKey(process.ticketNumber) === wanted) return { rotation, process };
        }

        // La mesa de un pedido para llevar es su ticket: '#78'
        const table = String(rotation.tableNumber ?? '').trim();
        if (table.startsWith('#') && ticketKey(table) === wanted) return { rotation, process: null };
    }

    return null;
}
