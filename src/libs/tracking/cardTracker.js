/*  SEGUIR CADA TARJETA DE CAPTURA EN CAPTURA (pedido del usuario: precisión en los procesos de Mesas)
 *
 *  readScreenCards (screenCards.js) dice qué tarjetas hay en UNA captura. Aquí se enlazan las de una captura con
 *  las de la anterior para que cada tarjeta tenga una identidad que dure toda su vida en la pantalla, y de esa vida
 *  salen los momentos que importan, con la hora de la captura en que pasaron:
 *
 *      aparece        la primera captura en que se la ve (la toma de orden no puede ser posterior)
 *      cocinada       la cabecera se pone verde: la cocina terminó
 *      despachada     palomitas en todo, cuerpo verde pálido: «listo en tablet», al segundo
 *      desaparece     la primera captura en que ya no está
 *
 *  Con esto el modelo de visión solo tiene que leer los números UNA vez por tarjeta (ticket, mesa, cronómetro);
 *  lo demás lo dan los píxeles, a dos capturas por segundo, sin errores de lectura.
 *
 *  CÓMO SE ENLAZAN (la pantalla de Toast se comporta así, medido en el restaurante):
 *      · las tarjetas van en el orden de pantalla (columna a columna, de arriba abajo), las despachadas primero;
 *      · ese orden se CONSERVA: cuando una se va, las demás se corren, pero no se adelantan unas a otras;
 *      · al despacharse, una tarjeta salta a la zona de las despachadas, con su misma altura y su mismo marco.
 *  Así que se alinean las dos listas —las abiertas y las despachadas, cada una por su lado— por orden, altura y
 *  marco. Una captura a mitad de la animación ('offGrid') no se usa: se espera a la siguiente.
 *
 *  Es PURO: 'advance' devuelve un estado nuevo y los sucesos de esa captura. El estado se puede guardar y repetir.
 */


// MISSING_TO_VANISH = «capturas seguidas sin verla para darla por desaparecida» (una sola puede ser un parpadeo)
export const MISSING_TO_VANISH = 2;

// TOP_TOLERANCE = «cuánto puede moverse una tarjeta sin que cuente como movimiento», en px
const TOP_TOLERANCE = 6;


// createTracker = «un seguimiento vacío»
export function createTracker() {
    return { cards: new Map(), nextId: 1, frames: 0, skipped: 0 };
}


// orderKey = «el orden de pantalla»: columna a columna, de arriba abajo
const orderKey = (card) => card.column * 10000 + card.top;

// looksAlike = «una tarjeta seguida y una vista pueden ser la misma»: misma altura (el contador no cambia la
// altura; un renglón más sí) y mismo marco. Hasta 4 px de diferencia: una tarjeta pegada a otra se mide hasta
// 3 px más corta (medido)
const looksAlike = (old, card) => Math.abs(old.height - card.height) <= 4 && old.border === card.border;


/*  align = «emparejar dos listas que conservan el orden»
 *
 *  Avanza por las dos a la vez: si la cabeza de una se parece a la de la otra, son la misma; si no, mira una
 *  posición más allá para decidir si lo que sobra es una tarjeta nueva (en las vistas) o una que se fue (en las
 *  seguidas). Devuelve los pares y lo que quedó suelto de cada lado.
 */
function align(olds, cards) {
    const pairs = [];
    const unmatchedOld = [];
    const unmatchedNew = [];
    let i = 0, j = 0;
    while (i < olds.length && j < cards.length) {
        if (looksAlike(olds[i], cards[j])) { pairs.push([olds[i], cards[j]]); i++; j++; }
        else if (j + 1 < cards.length && looksAlike(olds[i], cards[j + 1])) { unmatchedNew.push(cards[j]); j++; }
        else { unmatchedOld.push(olds[i]); i++; }
    }
    while (i < olds.length) unmatchedOld.push(olds[i++]);
    while (j < cards.length) unmatchedNew.push(cards[j++]);
    return { pairs, unmatchedOld, unmatchedNew };
}


/*  advance = «una captura más»
 *
 *  @param {object} tracker  el estado (createTracker)
 *  @param {object} screen   lo que devolvió readScreenCards: { cards, offGrid }
 *  @param {string} time     la hora de la captura ('HH:MM:SS' de la tablet, o lo que se quiera llevar)
 *  @returns {{ tracker, events }}  el estado nuevo y los sucesos: { kind, id, time, card }
 *      kind: 'appeared' | 'cooked' | 'fulfilled' | 'vanished' | 'moved'
 */
export function advance(tracker, screen, time) {
    const events = [];

    if (screen.offGrid) return { tracker: { ...tracker, skipped: tracker.skipped + 1 }, events };

    const seen = screen.cards.filter(card => !card.continued).sort((a, b) => orderKey(a) - orderKey(b));
    const previous = [...tracker.cards.values()].sort((a, b) => orderKey(a) - orderKey(b));

    const pairs = [];
    const paired = new Set();     // ids de las seguidas ya emparejadas
    const taken = new Set();      // las vistas ya emparejadas

    //  1. Las que no se movieron: mismo sitio, misma altura y marco. Es lo normal entre dos capturas.
    for (const card of seen) {
        const same = previous.find(old => !paired.has(old.id) && old.column === card.column && Math.abs(old.top - card.top) <= TOP_TOLERANCE && looksAlike(old, card));
        if (same) { pairs.push([same, card]); paired.add(same.id); taken.add(card); }
    }

    //  2. Las abiertas que se corrieron porque otra se fue: conservan el orden, y se alinean por él
    const open = align(
        previous.filter(old => !paired.has(old.id) && !old.fulfilled),
        seen.filter(card => !taken.has(card) && !card.fulfilled),
    );
    for (const [old, card] of open.pairs) { pairs.push([old, card]); paired.add(old.id); taken.add(card); }

    //  3. Lo que queda, por altura y marco sin mirar el sitio: una abierta que se despachó y saltó delante, o las
    //     despachadas, que Toast reordena entre ellas
    const loose = previous.filter(old => !paired.has(old.id));
    for (const card of seen.filter(card => !taken.has(card))) {
        const old = loose.find(candidate => !paired.has(candidate.id) && looksAlike(candidate, card) && (!candidate.fulfilled || card.fulfilled));
        if (old) { pairs.push([old, card]); paired.add(old.id); taken.add(card); }
    }

    const appeared = seen.filter(card => !taken.has(card));
    loose.splice(0, loose.length, ...previous.filter(old => !paired.has(old.id)));

    const cards = new Map();
    let nextId = tracker.nextId;

    for (const [old, card] of pairs) {
        const next = {
            ...old, column: card.column, top: card.top, height: card.height, header: card.header, checks: card.checks,
            fulfilled: old.fulfilled || card.fulfilled, lastSeenAt: time, missing: 0, missingSince: null,
            blinked: old.blinked || card.header === 'nueva',
        };
        if (old.column !== card.column || Math.abs(old.top - card.top) > TOP_TOLERANCE) events.push({ kind: 'moved', id: old.id, time, card });
        if (!old.cookedAt && card.header === 'cocinada') { next.cookedAt = time; events.push({ kind: 'cooked', id: old.id, time, card }); }
        if (!old.fulfilledAt && card.fulfilled) { next.fulfilledAt = time; events.push({ kind: 'fulfilled', id: old.id, time, card }); }
        cards.set(next.id, next);
    }

    for (const card of appeared) {
        const fresh = {
            id: nextId++, column: card.column, top: card.top, height: card.height, border: card.border,
            header: card.header, checks: card.checks, fulfilled: card.fulfilled,
            appearedAt: time, cookedAt: card.header === 'cocinada' ? time : null, fulfilledAt: card.fulfilled ? time : null,
            lastSeenAt: time, missing: 0, missingSince: null, blinked: card.header === 'nueva',
        };
        cards.set(fresh.id, fresh);
        events.push({ kind: 'appeared', id: fresh.id, time, card });
    }

    //  Las seguidas que no se vieron: una falta se perdona; a la segunda, desaparecieron (con la hora de la primera)
    for (const old of loose) {
        const missing = old.missing + 1;
        if (missing >= MISSING_TO_VANISH) {
            events.push({ kind: 'vanished', id: old.id, time: old.missingSince ?? time, card: old });
            continue;
        }
        cards.set(old.id, { ...old, missing, missingSince: old.missingSince ?? time });
    }

    return { tracker: { cards, nextId, frames: tracker.frames + 1, skipped: tracker.skipped }, events };
}


// describe = «un suceso en una línea», para los registros y los bancos
export function describe(event) {
    const card = event.card;
    const where = `c${card.column}@${card.top}`;
    const what = { appeared: 'aparece', cooked: 'cocinada', fulfilled: 'despachada', vanished: 'desaparece', moved: 'se mueve a' }[event.kind];
    return `${event.time}  #${event.id}  ${what} ${where} (${card.height} px, ${card.border}, cabecera ${card.header}, ${card.checks} ✓)`;
}
