import { DELAY_FIELDS, WARNING_FIELDS, PROCESS_DELAY_FIELDS, isObjectId } from './reportedDelay.js';


/*  LAS NOVEDADES ENLAZADAS A LAS ROTACIONES DE MESAS: cuáles son y en qué quedó cada una
 *
 *  Una rotación guarda solo el _id de cada novedad que se reportó desde ella (reportedDelay.js):
 *
 *      en la rotación    firstAttentionDelay, cleaningDelay          las demoras de la mesa
 *                        firstAttentionWarning, cleaningWarning      los avisos de que seguía esperando
 *      en cada proceso   preparationDelay, earlyMarkDelay            la demora de preparación y «Marcada antes de estar listo»
 *
 *  Las listas salen de reportedDelay.js: un campo nuevo que se apunte allí entra aquí solo.
 *
 *  El documento ENTERO de cada una lo trae y lo tiene al día component/tabletScreen/hook/useLinkedNovelties.jsx, en
 *  un Map: _id → el documento (null = la API dice que no existe; sin entrada = todavía no se sabe). Aquí está lo puro
 *  de eso, sin React ni red, para probarlo en Node: qué _id pedir, cómo se mezcla lo que llega y qué dice cada
 *  documento de su validación.
 *
 *  LA VALIDACIÓN, como la deja la API (PUT /novelties/id=…, novelties.controller.ts) y como la escribe Client365:
 *
 *      validationResult.isApproved                       true aprobada, false invalidada; sin él, sin validar
 *      validationResult.detail                           lo que escribió quien validó
 *      validationResult.validatedByUser.user.nameUser    quién validó (lo pone la API, de la sesión)
 *      isValidate.menuEditedBy                           quién corrigió el texto de la alerta: «modificada»
 */


// RECORD_FIELDS / PROCESS_FIELDS = «dónde puede haber una novedad»: en la rotación y en cada uno de sus procesos
export const RECORD_FIELDS = [...new Set([...Object.values(DELAY_FIELDS), ...Object.values(WARNING_FIELDS)])];
export const PROCESS_FIELDS = [...new Set(Object.values(PROCESS_DELAY_FIELDS))];


// linkedIdsOf = «los _id de todas las novedades enlazadas a estas rotaciones», sin repetir y ordenados: las mismas
// novedades dan siempre la misma lista. Solo ObjectIds válidos: lo demás no se puede pedir.
export const linkedIdsOf = (records = []) => {
    const ids = new Set();
    const add = (value) => { if (isObjectId(value)) ids.add(value); };

    for (const record of records) {
        RECORD_FIELDS.forEach(field => add(record?.[field]));
        for (const process of record?.process ?? []) PROCESS_FIELDS.forEach(field => add(process?.[field]));
    }

    return [...ids].sort();
};


// noveltyIdOf = «el _id de un documento de novedad, en texto», venga como texto o como ObjectId
export const noveltyIdOf = (doc) => (doc?._id == null ? '' : String(doc._id));


// timeOf = «cuándo se cambió por última vez un documento», en milisegundos (0 si no lo dice)
const timeOf = (doc) => {
    const time = Date.parse(doc?.updatedAt ?? '');
    return Number.isNaN(time) ? 0 : time;
};

// newerNovelty = «de dos versiones de una novedad, la que vale»: la más nueva, por 'updatedAt'. Una petición que salió
// antes de que llegara el aviso del socket puede contestar después con la versión vieja, y así no la pisa.
// 'current' puede faltar (undefined: no se sabía) o ser null (no existía). Un 'incoming' null (la API dice que no
// existe) solo cuenta si no se tenía el documento.
export const newerNovelty = (current, incoming) => {
    if (!incoming) return current ?? null;
    if (!current) return incoming;
    return timeOf(incoming) >= timeOf(current) ? incoming : current;
};


// putNovelties = «el Map con estas novedades puestas»: 'entries' son pares [_id, documento | null] (un Map también
// vale), y solo entran las que siguen enlazadas ('linked', un Set). Devuelve el MISMO Map si no cambia nada: la tabla
// va con 'memo', y un Map nuevo la repintaría entera.
export const putNovelties = (novelties, entries, linked) => {
    let next = null;

    for (const [id, doc] of entries) {
        if (!linked.has(id)) continue;
        const kept = newerNovelty(novelties.get(id), doc);
        if (novelties.has(id) && novelties.get(id) === kept) continue;
        if (!next) next = new Map(novelties);
        next.set(id, kept);
    }

    return next ?? novelties;
};


// keepLinked = «el Map sin las novedades que ya no están enlazadas»: la rotación se guardó y se limpió, se cambió de
// local… El MISMO Map si no sobra ninguna.
export const keepLinked = (novelties, linked) => {
    const unlinked = [...novelties.keys()].filter(id => !linked.has(id));
    if (unlinked.length === 0) return novelties;

    const next = new Map(novelties);
    unlinked.forEach(id => next.delete(id));
    return next;
};


// unknownIds = «las enlazadas que todavía no se saben»: sin entrada en el Map, porque no han llegado o porque su
// petición falló
export const unknownIds = (novelties, linked) => [...linked].filter(id => !novelties.has(id));


// NOVELTY_STATUS = «en qué quedó una novedad», dicho para leer:
//   loading   todavía no se sabe: se está pidiendo, o la petición falló y se volverá a pedir
//   missing   la API dice que no existe
//   pending   existe y nadie la ha validado todavía
//   approved  aprobada
//   rejected  invalidada
export const NOVELTY_STATUS = {
    loading: 'Consultando su validación…',
    missing: 'Ya no está en el servidor',
    pending: 'Sin validar todavía',
    approved: 'Aprobada',
    rejected: 'Invalidada',
};

// statusOf = «en qué quedó un documento»: 'approved', 'rejected' o 'pending'
const statusOf = (doc) => {
    const approved = doc.validationResult?.isApproved;
    return approved === true ? 'approved' : approved === false ? 'rejected' : 'pending';
};

// editorOf = «quién modificó la alerta», o '' si nadie. Client365 lo apunta en isValidate.menuEditedBy al corregir su
// texto; 'menuEditedBy', el objeto de la raíz del modelo, es el sitio nuevo, y hoy no lo llena nadie.
const editorOf = (doc) => {
    const legacy = doc.isValidate?.menuEditedBy;
    if (typeof legacy === 'string' && legacy.trim()) return legacy.trim();
    return doc.menuEditedBy?.user?.nameUser?.trim() ?? '';
};


// linkedNoveltyOf = «lo que se sabe de una novedad enlazada», por su _id ('id'), con el Map de useLinkedNovelties.
// null si no hay novedad (el campo está vacío). Si no:
//   { id, doc, status, edited, editedBy, validatedBy, detail }
//   doc     el documento ENTERO de la API; null mientras no se sabe ('loading') o si ya no existe ('missing')
//   status  una de las claves de NOVELTY_STATUS
export const linkedNoveltyOf = (novelties, id) => {
    if (!isObjectId(id)) return null;

    const unknown = { id, doc: null, edited: false, editedBy: '', validatedBy: '', detail: '' };
    if (!novelties?.has(id)) return { ...unknown, status: 'loading' };

    const doc = novelties.get(id);
    if (!doc) return { ...unknown, status: 'missing' };

    const editedBy = editorOf(doc);
    return {
        id,
        doc,
        status: statusOf(doc),
        edited: editedBy !== '',
        editedBy,
        validatedBy: doc.validationResult?.validatedByUser?.user?.nameUser?.trim() ?? '',
        detail: doc.validationResult?.detail?.trim() ?? '',
    };
};


// linkedNoveltiesOf = «las novedades de una rotación o de un proceso», campo a campo: { firstAttentionDelay: …, … },
// cada una con linkedNoveltyOf (null en los campos sin novedad). 'fields' es RECORD_FIELDS o PROCESS_FIELDS.
export const linkedNoveltiesOf = (owner, novelties, fields) => Object.fromEntries(fields.map(field => [field, linkedNoveltyOf(novelties, owner?.[field])]));


// isApproved = «la aprobaron»: su celda va en verde, con el texto y la bandera en blanco (pedido del usuario)
export const isApproved = (novelty) => novelty?.status === 'approved';

// isRejected = «la invalidaron»: en lugar de su bandera va la X para enviar otra alerta (pedido del usuario)
export const isRejected = (novelty) => novelty?.status === 'rejected';

// allApproved = «la celda va en verde»: todas las novedades que enseña están aprobadas (y hay al menos una). Casi
// siempre es una sola; la Duración de la tablet de un proceso puede tener dos —la demora de preparación y «Marcada
// antes de estar listo»—, y si solo se aprobó una, la otra todavía tiene algo que decir.
export const allApproved = (...novelties) => {
    const shown = novelties.filter(Boolean);
    return shown.length > 0 && shown.every(isApproved);
};


// noveltyStatusText = «en qué quedó, dicho para leer», para el 'title' de su bandera. '' sin novedad. Por ejemplo:
//   'Aprobada por Ana Pérez'   'Invalidada por Ana Pérez: no era una demora'   'Sin validar todavía · Modificada por Luis'
// Lo usa también la X de una invalidada (ResendAlertButton).
export const noveltyStatusText = (novelty) => {
    if (!novelty) return '';

    const validated = novelty.status === 'approved' || novelty.status === 'rejected';
    const by = validated && novelty.validatedBy ? ` por ${novelty.validatedBy}` : '';
    const why = validated && novelty.detail ? `: ${novelty.detail}` : '';
    const edited = novelty.edited ? ` · Modificada por ${novelty.editedBy}` : '';

    return `${NOVELTY_STATUS[novelty.status]}${by}${why}${edited}`;
};

// withNoveltyStatus = «un texto, con en qué quedó su novedad detrás»: 'Demora de limpieza reportada · Aprobada por Ana'
export const withNoveltyStatus = (text, novelty) => {
    const status = noveltyStatusText(novelty);
    return status ? `${text} · ${status}` : text;
};
