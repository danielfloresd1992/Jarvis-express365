/*  QUÉ SE ESTÁ REPORTANDO, EN PALABRAS
 *
 *  Cuando un formulario de Demoras se abre desde el reloj rojo del register, encabeza el formulario esta
 *  descripción en vez del título (FormLayaut, prop 'description'): la mesa, sus dos horas, lo que tardó y el
 *  tiempo de referencia del local con que el register la marcó como demora. Se arma con lo que el formulario
 *  tiene en ese momento, así que si alguien corrige una hora, la descripción la sigue.
 *
 *      Mesa 59: se ocupó a las 12:41:31 y recibió la primera atención a las 12:48:32. Tardó 00:07:01, más que
 *      el tiempo de referencia del local (00:03:30). Adjunta las dos capturas y envía la alerta.
 */


// KINDS = «cómo se cuenta cada demora»: qué pasa a la primera hora y qué a la segunda
const KINDS = {
    'primera atención': { start: 'se ocupó', end: 'recibió la primera atención', took: 'Tardó' },
    limpieza: { start: 'se desocupó', end: 'quedó limpia', took: 'La limpieza tardó' },
};


/*  reportDescription = «la descripción de una demora del register»
 *
 *  @param {string} kind    'primera atención' | 'limpieza'
 *  @param {object} fields  { table, start, end, total, limit }: la mesa, las dos horas, lo que tardó y el tiempo de
 *                          referencia del local (los dos últimos pueden faltar)
 */
export function reportDescription(kind, { table, start, end, total, limit }) {
    const words = KINDS[kind] ?? KINDS['primera atención'];
    const tookPart = String(total ?? '').trim()
        ? ` ${words.took} ${String(total).trim()}${limit ? `, más que el tiempo de referencia del local (${limit})` : ''}.`
        : '';

    return `Mesa ${table || '?'}: ${words.start} a las ${start || '?'} y ${words.end} a las ${end || '?'}.${tookPart} Adjunta las dos capturas y envía la alerta.`;
}


// SHIFT_WORDS = «cómo se dice cada turno»
const SHIFT_WORDS = { day: 'de día', night: 'de noche' };


/*  preparationDescription = «la descripción de una demora de preparación» (pedido del usuario)
 *
 *  Para el formulario «Tablet» abierto desde el icono de cocina de un proceso en Mesas: el ticket, la mesa (si la
 *  tiene: un pedido para llevar no), el plato, de la toma de orden a listo en tablet, listo en cocina, lo que tardó y
 *  el tiempo de preparación del plato en el turno con que Mesas la marcó.
 *
 *      Ticket #21 · mesa 20 · Cheeseburger: se tomó la orden a las 11:00:00 y se marcó listo en tablet a las
 *      11:14:30; listo en cocina a las 11:16:00. Tardó 00:14:30, más que el tiempo de preparación del plato de día
 *      (00:12:00). Adjunta la captura y envía la alerta.
 *
 *  @param {object} fields  { ticket, table, dish, start, end, kitchen, total, limit, shift, photos }: el ticket, la mesa,
 *                          el nombre del plato, la toma de orden, listo en tablet, listo en cocina, lo que tardó, el
 *                          tiempo del plato, el turno ('day' | 'night') y cuántas capturas pide la alerta. Pueden
 *                          faltar todos menos las dos primeras horas.
 */
export function preparationDescription({ ticket, table, dish, start, end, kitchen, total, limit, shift, photos = 1 }) {
    const who = [
        `Ticket #${String(ticket ?? '').trim() || '?'}`,
        String(table ?? '').trim() && `mesa ${String(table).trim()}`,
        String(dish ?? '').trim(),
    ].filter(Boolean).join(' · ');

    const kitchenPart = String(kitchen ?? '').trim() ? `; listo en cocina a las ${String(kitchen).trim()}` : '';

    const limitPart = limit ? `, más que el tiempo de preparación del plato${SHIFT_WORDS[shift] ? ` ${SHIFT_WORDS[shift]}` : ''} (${limit})` : '';
    const tookPart = String(total ?? '').trim() ? ` Tardó ${String(total).trim()}${limitPart}.` : '';

    const capturesPart = photos > 1 ? `las ${photos} capturas` : 'la captura';

    return `${who}: se tomó la orden a las ${start || '?'} y se marcó listo en tablet a las ${end || '?'}${kitchenPart}.${tookPart} Adjunta ${capturesPart} y envía la alerta.`;
}


// WAITING = «cómo se cuenta cada espera que sigue abierta»: desde qué y qué le falta todavía
const WAITING = {
    'primera atención': { start: 'se ocupó', missing: 'sigue sin primera atención' },
    limpieza: { start: 'se desocupó', missing: 'sigue sin limpiar' },
};


/*  waitingDescription = «la descripción del aviso de una mesa que sigue esperando»
 *
 *  Para el formulario de primera atención o de limpieza abierto desde el triángulo de Ocupa o de Desocupa en Mesas,
 *  con su casilla «¿… aún?» marcada: lo que se espera todavía no ha pasado, así que la segunda hora es la de ahora.
 *
 *      Mesa 23: se ocupó a las 17:07:40 y a las 17:12:10 sigue sin primera atención. Lleva 00:04:30, más que el
 *      tiempo de referencia del local (00:03:30). Adjunta la captura en vivo y envía el aviso.
 *
 *  @param {string} kind    'primera atención' | 'limpieza'
 *  @param {object} fields  { table, start, now, total, limit }: la mesa, la hora desde la que espera, la de ahora, lo
 *                          que lleva esperando y el tiempo de referencia del local (los dos últimos pueden faltar)
 */
export function waitingDescription(kind, { table, start, now, total, limit }) {
    const words = WAITING[kind] ?? WAITING['primera atención'];
    const waitedPart = String(total ?? '').trim()
        ? ` Lleva ${String(total).trim()}${limit ? `, más que el tiempo de referencia del local (${limit})` : ''}.`
        : '';

    return `Mesa ${table || '?'}: ${words.start} a las ${start || '?'} y a las ${now || '?'} ${words.missing}.${waitedPart} Adjunta la captura en vivo y envía el aviso.`;
}
