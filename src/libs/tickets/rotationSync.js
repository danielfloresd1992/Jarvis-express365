/*  ══════════════════════════════════════════════════════════════════════════════════════
 *  MESAS EN VIVO: LO QUE SE SUBE A LA API MIENTRAS SE TRABAJA
 *
 *  Cada rotación de Mesas se sube a la API ABIERTA (status 'open') en cuanto tiene mesa, y otra vez con cada
 *  cambio: PUT /rotation/client=<su id>. El disquete la CIERRA ('closed'): desde ahí es de Registros. Los demás
 *  equipos del local —otra Mesas, las verificaciones de Client365— la ven por el socket, con quién la creó y quién
 *  hizo el último cambio.
 *
 *  ES OPTIMISTA. Lo que se escribe se ve y se guarda en el equipo al momento (tableRecords.js), y la subida va
 *  detrás, por una COLA que también se guarda en el equipo (la «outbox»): sin internet se sigue trabajando igual,
 *  la cola crece, y al volver la conexión se vacía sola. Por cada rotación la cola guarda solo lo ÚLTIMO que hay
 *  que hacer con ella —subirla así, cerrarla así, o quitarla—: lo de en medio ya no importa.
 *
 *      outbox = { [id de la rotación]: { kind: 'upsert', body, at } | { kind: 'remove', at } }
 *               at = cuándo entró, en milisegundos: con él se sabe si lo que se acaba de subir sigue siendo lo último
 *
 *  LA MÁS NUEVA GANA. Cada subida lleva cuándo cambió en el equipo (clientUpdatedAt) y la API se queda con la más
 *  nueva: una subida atrasada no pisa una posterior. Lo que llega de otro equipo entra en Mesas salvo que aquí
 *  haya cambios sin subir de esa misma rotación: entonces mandan los de aquí, y la API decidirá.
 *
 *  Para no subir dos veces lo mismo, se recuerda la FIRMA de lo último que se subió o llegó de cada rotación
 *  (syncSignature): solo se sube la que cambió de verdad, no la que solo se desplegó.
 *
 *  Todo es puro salvo readOutbox y writeOutbox, que usan el almacenamiento del navegador. La vuelta con la API y el
 *  socket la hace hook/useRotationSync.jsx.
 *  ══════════════════════════════════════════════════════════════════════════════════════ */

import { createRecord, createProcess, isBlankRecord, isBlankProcess, OPEN_LISTS, RECORD_TIMES, PROCESS_FIELDS, TABLET_FIELDS, SHIFTS } from './tableRecords.js';
import { DELAY_FIELDS, WARNING_FIELDS, PROCESS_DELAY_FIELDS, isObjectId } from './reportedDelay.js';


// LOCAL_ONLY = «lo de una rotación que no viaja»: las listas desplegadas, que son de quien mira, y su fila en la tabla
const LOCAL_ONLY = [...OPEN_LISTS, 'row'];

// NOVELTY_FIELDS = «los campos de la rotación que apuntan a una novedad»: sus demoras y sus avisos
const NOVELTY_FIELDS = [...Object.values(DELAY_FIELDS), ...Object.values(WARNING_FIELDS)];

// OUTBOX_PREFIX = «la llave de la cola en el equipo»: una por local, como las mesas ('mesas:<_id>')
const OUTBOX_PREFIX = 'mesas-sync';

// isTicketTable = «la mesa es un '#ticket'»: un pedido para llevar (la regla de tableRecords.js y de la API)
const isTicketTable = (tableNumber) => String(tableNumber ?? '').trim().startsWith('#');


// isSyncable = «la rotación ya se sube»: nació (tiene fecha), tiene algo y tiene mesa, que la API exige.
// Una fila en la que se escribió una hora antes que la mesa se queda en el equipo hasta tener mesa.
export const isSyncable = (record) => Boolean(record?.date) && !isBlankRecord(record) && String(record.tableNumber ?? '').trim() !== '';


// shareable = «la rotación sin lo que no viaja»: sin las listas desplegadas, sin su fila y sin procesos en blanco
function shareable(record) {
    const copy = { ...record, process: record.process.filter(process => !isBlankProcess(process)) };
    for (const field of LOCAL_ONLY) delete copy[field];
    return copy;
}


// syncSignature = «la firma de una rotación»: la misma si no cambió nada que se suba. Desplegar o plegar una lista
// no la cambia.
export const syncSignature = (record) => JSON.stringify(shareable(record));


// toSyncBody = «el cuerpo de PUT /rotation/client=<id>»: la rotación entera, con su local, su estado ('open' o
// 'closed') y cuándo cambió en el equipo (changedAt, en milisegundos). Procesos y toques llevan su id como
// `clientId`, para que vuelvan tal cual al cargarlos desde la API. Lo que la API no tiene en su esquema lo descarta.
export function toSyncBody(record, establishmentId, status, changedAt) {
    const data = shareable(record);
    return {
        ...data,
        date: new Date(record.date).toISOString(),
        establishment: establishmentId,
        clientId: record.id,
        status,
        clientUpdatedAt: new Date(changedAt).toISOString(),
        process: data.process.map(process => ({ ...process, clientId: process.id })),
        touch: record.touch.map(touch => ({ ...touch, clientId: touch.id })),
    };
}


// fromServerRotation = «una rotación de la API (o un cuerpo de la cola), otra vez como rotación de Mesas»
// Su id es su clientId, y el de sus procesos y toques, el suyo (uno nuevo si no lo trae: las de antes de existir).
// No se fía de lo que llega: cada campo se rellena aunque falte, como al leerlas del equipo (reviveRecord).
export function fromServerRotation(rotation) {
    const record = createRecord({
        id: String(rotation.clientId),
        date: new Date(rotation.date),
        tableNumber: String(rotation.tableNumber ?? ''),
        shift: SHIFTS.includes(rotation.shift) ? rotation.shift : null,
    });

    record.takeOut = isTicketTable(record.tableNumber);
    for (const field of RECORD_TIMES) record[field] = String(rotation[field] ?? '');
    for (const field of NOVELTY_FIELDS) record[field] = isObjectId(rotation[field]) ? String(rotation[field]) : null;

    record.process = (Array.isArray(rotation.process) ? rotation.process : []).map(process => {
        const fields = Object.fromEntries(PROCESS_FIELDS.map(field => [field, String(process?.[field] ?? '')]));
        const delays = Object.fromEntries(Object.values(PROCESS_DELAY_FIELDS).map(field => [field, isObjectId(process?.[field]) ? String(process[field]) : null]));
        return createProcess({
            ...fields,
            ...delays,
            ...(process?.clientId ? { id: String(process.clientId) } : {}),
            key: String(process?.key ?? ''),
            edited: Array.isArray(process?.edited) ? process.edited.filter(field => TABLET_FIELDS.includes(field)) : [],
        });
    });

    record.touch = (Array.isArray(rotation.touch) ? rotation.touch : []).map(touch => ({
        id: touch?.clientId ? String(touch.clientId) : crypto.randomUUID(),
        ref: touch?.ref ? String(touch.ref) : null,
        name: String(touch?.name ?? ''),
        hourTouch: String(touch?.hourTouch ?? ''),
        hourTouchFinish: String(touch?.hourTouchFinish ?? ''),
        createdAt: touch?.createdAt ? new Date(touch.createdAt).toISOString() : null,
    }));

    return record;
}


// placeRemote = «poner en Mesas una rotación que llega de la API»: en su sitio si ya está (con las listas como las
// tenía quien mira), o en la primera fila en blanco después de las que se usan, o al final.
export function placeRemote(records, incoming) {
    const index = records.findIndex(record => record.id === incoming.id);
    if (index !== -1) {
        const current = records[index];
        const merged = { ...incoming, processesOpen: current.processesOpen === true, touchesOpen: current.touchesOpen === true };
        return records.map((record, position) => (position === index ? merged : record));
    }

    const lastUsed = records.findLastIndex(record => !isBlankRecord(record));
    const slot = records.findIndex((record, position) => position > lastUsed && isBlankRecord(record));
    if (slot === -1) return [...records, incoming];
    return records.map((record, position) => (position === slot ? incoming : record));
}


// clearRemote = «quitar de Mesas una rotación»: queda en blanco en su sitio, como al guardarla. La MISMA lista si no está.
export function clearRemote(records, recordId) {
    if (!records.some(record => record.id === recordId)) return records;
    return records.map(record => (record.id === recordId ? createRecord() : record));
}



//  ── LA COLA ───────────────────────────────────────────────────────────────────────────

// isClosing = «la entrada de la cola cierra la rotación» (el disquete)
export const isClosing = (entry) => entry?.kind === 'upsert' && entry.body?.status === 'closed';

// queueUpsert / queueRemove = «apuntar en la cola lo último que hay que hacer con una rotación»
export const queueUpsert = (outbox, body, at) => ({ ...outbox, [body.clientId]: { kind: 'upsert', body, at } });
export const queueRemove = (outbox, recordId, at) => ({ ...outbox, [recordId]: { kind: 'remove', at } });

// settle = «quitar de la cola lo que se acaba de subir», solo si sigue siendo lo último: si mientras subía entró algo
// más nuevo de esa rotación, se queda para la siguiente vuelta. La MISMA cola si no hay nada que quitar.
export function settle(outbox, recordId, at) {
    if (outbox[recordId]?.at !== at) return outbox;
    const rest = { ...outbox };
    delete rest[recordId];
    return rest;
}


/*  planChanges = «lo que hay que subir después de un cambio en Mesas»
 *
 *  Recibe: records (las rotaciones, como quedaron), known (Map id → firma de lo último subido o llegado),
 *  outbox (la cola), establishmentId y now (milisegundos).
 *  Devuelve: { outbox, known }, los dos nuevos; la MISMA cola si no hay nada que subir.
 *
 *      · una rotación que se sube y cambió de firma   → subirla abierta, así
 *      · una que se subía y ya no está, o quedó en blanco (se eliminó o se limpió sin guardar) → quitarla
 *      · una que se está cerrando (el disquete) no se quita: su cierre ya está en la cola
 *      · una que se quedó sin mesa un momento (se está corrigiendo) no se toca: vale la última subida
 */
export function planChanges(records, known, outbox, establishmentId, now) {
    let nextOutbox = outbox;
    const nextKnown = new Map(known);

    // present = «las que se suben ahora»
    const present = new Set();
    for (const record of records) {
        if (!isSyncable(record)) continue;
        present.add(record.id);

        const signature = syncSignature(record);
        if (nextKnown.get(record.id) === signature) continue;

        nextKnown.set(record.id, signature);
        nextOutbox = queueUpsert(nextOutbox, toSyncBody(record, establishmentId, 'open', now), now);
    }

    // tracked = «las que se subían»: las conocidas y las que esperan en la cola su primera subida
    const tracked = new Set([...nextKnown.keys(), ...Object.keys(nextOutbox).filter(recordId => nextOutbox[recordId].kind === 'upsert')]);
    for (const recordId of tracked) {
        if (present.has(recordId)) continue;

        const record = records.find(item => item.id === recordId);
        if (record && !isBlankRecord(record)) continue;

        nextKnown.delete(recordId);
        if (!isClosing(nextOutbox[recordId])) nextOutbox = queueRemove(nextOutbox, recordId, now);
    }

    return { outbox: nextOutbox, known: nextKnown };
}


/*  remoteAction = «qué hacer con una rotación que llega de la API» (por el socket o al cargar)
 *
 *      'drop'    se guardó (aquí o en otro equipo): sale de Mesas
 *      'ignore'  aquí hay cambios sin subir de esa rotación (mandan ellos), o es lo mismo que ya hay
 *      'adopt'   entra en Mesas: es nueva aquí, o cambió en otro equipo
 */
export function remoteAction({ local, entry, rotation }) {
    if (rotation?.status === 'closed') return 'drop';
    if (entry) return 'ignore';
    if (!local) return 'adopt';
    return syncSignature(local) === syncSignature(fromServerRotation(rotation)) ? 'ignore' : 'adopt';
}



//  ── QUIÉN LA CREÓ Y QUIÉN LA CAMBIA ───────────────────────────────────────────────────

// personName = «el nombre de una persona poblada por la API» ({ name, surName }), o ''
export const personName = (person) => [person?.name, person?.surName].filter(Boolean).join(' ');

// authorshipOf = «quién creó una rotación de la API y quién hizo su último cambio, y cuándo»
export const authorshipOf = (rotation) => ({
    createdBy: personName(rotation?.createdBy),
    updatedBy: personName(rotation?.updatedBy),
    changedAt: rotation?.clientUpdatedAt ?? rotation?.updatedAt ?? null,
});

// authorshipTitle = «el title de la fila»: 'Creó Ana Pérez · último cambio de Luis Rojas a las 14:05'
// Recibe lo de authorshipOf (o null) y si la rotación espera en la cola (pending). Sin nada que decir, ''.
export function authorshipTitle(authorship, pending = false) {
    const parts = [];
    if (authorship?.createdBy) parts.push(`Creó ${authorship.createdBy}`);
    if (authorship?.updatedBy) {
        const time = authorship.changedAt ? new Date(authorship.changedAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
        parts.push(`último cambio de ${authorship.updatedBy}${time ? ` a las ${time}` : ''}`);
    }
    if (pending) parts.push(parts.length > 0 ? 'con cambios sin subir todavía' : 'Todavía sin subir al servidor');
    return parts.join(' · ');
}



//  ── LA COLA EN EL EQUIPO ──────────────────────────────────────────────────────────────

// outboxKey = «la llave de la cola de un local». Sin local no hay llave.
const outboxKey = (localId) => (localId ? `${OUTBOX_PREFIX}:${localId}` : '');

// readOutbox = «la cola guardada de un local». NUNCA lanza: sin nada, o con el almacenamiento bloqueado, una vacía.
export function readOutbox(localId) {
    const key = outboxKey(localId);
    if (!key) return {};
    try {
        const saved = JSON.parse(localStorage.getItem(key));
        return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    }
    catch {
        return {};
    }
}

// writeOutbox = «guardar la cola de un local». NUNCA lanza: si el almacenamiento falla, devuelve false.
export function writeOutbox(localId, outbox) {
    const key = outboxKey(localId);
    if (!key) return false;
    try {
        if (Object.keys(outbox).length === 0) localStorage.removeItem(key);
        else localStorage.setItem(key, JSON.stringify(outbox));
        return true;
    }
    catch {
        return false;
    }
}
