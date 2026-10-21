import { estimateBonus, idOf } from './estimateBonus.js';


/*  LAS TARJETAS DE SELLOS
 *
 *  Las novedades que reportó el operador en el día operativo, puestas como la tarjeta de sellos de una cafetería
 *  (pedido del usuario, propuesta «B · Tarjetas de sellos»): una tarjeta por alerta, con tantas casillas como pide su
 *  regla de bono (alertsRequired: la regla «4 × 1» tiene cuatro). Cada aprobada pone un sello; las que esperan
 *  validación van a lápiz; tarjeta llena = bonusAwarded bonos. Lo que falta para llenarla no se pierde: cada sello ya
 *  vale su parte (bonusPerAlert), como paga la API. Es la misma cuenta, pintada para que se vea cuánto falta.
 *
 *      aprobada    validationResult.isApproved === true, sin descarte. Suma lo que SELLÓ la API al aprobar
 *                  (Noveltie.bonus, congelado): eso es lo que se paga
 *      a lápiz     sin validar todavía. Su tarjeta y su valor se ADELANTAN con estimateBonus, porque la API no sella
 *                  hasta aprobar
 *      rechazada   isApproved === false, o descartada por el cliente o por el departamento. No pone sello
 *
 *  La que no da bono (la alerta no bonifica, no tiene regla, la regla no aplica en ese local…) no tiene tarjeta: va
 *  en la lista de «Sin tarjeta» con el porqué.
 *
 *  PURA: buildStampCards recibe las novedades y el catálogo y devuelve qué pintar. La usa StampCards.
 */


// TIME_ZONE = «la zona del negocio»: las horas de los sellos son las de Caracas
const TIME_ZONE = 'America/Caracas';

// NO_BONUS_REASONS = «por qué una novedad no tiene tarjeta», en palabras del operador. Las claves son las de la API
// (Noveltie.bonus.reason) y dos de aquí: 'sin-alerta' (no se encontró la alerta) y 'sin-sellar' (aprobada, pero la API
// no pudo calcular su bono).
export const NO_BONUS_REASONS = {
    'no-bonifica': 'esta alerta no da bono',
    'sin-regla': 'la alerta no tiene regla de bono',
    'fuera-de-alcance': 'su regla no aplica en este local',
    'regla-inactiva': 'su regla de bono está desactivada',
    'regla-sin-popular': 'no se encontró su regla de bono',
    'sin-alerta': 'no se encontró la alerta',
    'sin-sellar': 'aprobada, con el bono sin calcular',
};


// noveltyState = «en qué quedó la novedad»: 'approved' | 'rejected' | 'pending'. Igual que resolveStatus de los avisos
// (notifications/templates/AlertUpdateCard.jsx): descartada por el cliente o por el departamento cuenta como rechazada.
export function noveltyState(novelty) {
    const validation = novelty?.validationResult;
    const discarded = validation?.validationToDiscard?.byTheClient || validation?.validationToDiscard?.reportingDepartment;
    if (discarded || validation?.isApproved === false) return 'rejected';
    if (validation?.isApproved === true) return 'approved';
    return 'pending';
}

// clockOf = «la hora de un instante, 'HH:MM', en Caracas»
export const clockOf = (date) => new Date(date).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TIME_ZONE });

// alertName = «el nombre de la alerta de una novedad»: el de la alerta (Menu.es) o, sin ella, el título sin la mesa
// que le pegan los formularios (' - Mesa: 15', SendNoveltie)
const alertName = (novelty, menu) => menu?.es || String(novelty?.title ?? '').replace(/\s*-\s*Mesa:.*$/i, '').trim() || 'Novedad';


// toLine = «una novedad, como renglón de lista»: para las rechazadas y las que no tienen tarjeta
const toLine = (novelty, menu, extra) => ({
    id: idOf(novelty._id),
    time: clockOf(novelty.createdAt),
    title: alertName(novelty, menu),
    table: novelty.table || null,
    establishmentName: novelty.establishment?.name ?? '',
    ...extra,
});


// bonusOf = «el bono de una novedad»: el sellado si ya se aprobó; si no, el adelantado (estimateBonus)
function bonusOf(novelty, state, { menus, rulesById, user }) {
    const sealed = novelty.bonus;
    if (state === 'approved') {
        if (sealed?.applies === true) return { ...sealed, rule: idOf(sealed.rule), sealed: true };
        if (sealed?.applies === false) return { applies: false, reason: sealed.reason || 'no-bonifica' };
        return { applies: false, reason: 'sin-sellar' };
    }
    return estimateBonus({
        menu: menus.get(idOf(novelty.menuRef)),
        rulesById,
        user,
        establishment: novelty.establishment,
        at: novelty.createdAt,
    });
}


// fillSlots = «las casillas de la tarjeta que está en juego»
// Las aprobadas llenan tarjetas enteras; la que queda en juego lleva el resto de las aprobadas y, detrás, las de lápiz.
// Si las aprobadas llenaron justo una tarjeta y no hay ninguna a lápiz, se enseña esa tarjeta llena: es la que acaba
// de dar el bono. Las de lápiz que no caben se cuentan aparte (overflow).
function fillSlots(approved, pending, size) {
    const remainder = approved.length % size;

    if (remainder === 0 && approved.length > 0 && pending.length === 0) {
        return { slots: approved.slice(-size), full: true, overflow: 0, stamped: size };
    }

    const stamps = [...approved.slice(approved.length - remainder), ...pending.slice(0, size - remainder)];
    const slots = [...stamps, ...Array(size - stamps.length).fill(null)];
    return { slots, full: false, overflow: Math.max(0, pending.length - (size - remainder)), stamped: remainder };
}


/*  buildStampCards = «las novedades del día → las tarjetas»
 *
 *  @param {Array}  novelties  las del operador en el día operativo (useMyNovelties), cualquier orden
 *  @param {Map}    menus      las alertas por _id (useBonusCatalog); sin la de una novedad a lápiz, no se sabe su tarjeta
 *  @param {Map}    rulesById  las reglas de bono por _id
 *  @param {object} user       el operador, con workSchedule: su turno decide cuántos bonos da la regla
 *  @returns {{ cards, others, rejected, totals }}
 *      cards     una por alerta y regla, en el orden en que se reportó la primera:
 *                { key, title, ruleName, alertsRequired, bonusAwarded, approved, pending, bonus, filled, slots, full,
 *                  overflow, stamped }
 *                slots: las casillas de la tarjeta en juego, cada una { id, state, time, table } o null (vacía)
 *      others    las que no tienen tarjeta: { id, time, title, table, state, reason }
 *      rejected  las rechazadas: { id, time, title, table, detail }
 *      totals    { reported, approved, pending, rejected, bonus, filled }
 */
export function buildStampCards({ novelties = [], menus = new Map(), rulesById = new Map(), user = null }) {

    // byTime = «de la más vieja a la más nueva»
    const byTime = [...novelties].sort((one, other) => new Date(one.createdAt) - new Date(other.createdAt));

    // groups = «las tarjetas mientras se arman», por clave
    const groups = new Map();
    const others = [];
    const rejected = [];
    let approvedCount = 0;
    let pendingCount = 0;

    for (const novelty of byTime) {
        const state = noveltyState(novelty);
        const menu = menus.get(idOf(novelty.menuRef));

        if (state === 'rejected') {
            rejected.push(toLine(novelty, menu, { detail: novelty.validationResult?.detail || '' }));
            continue;
        }

        if (state === 'approved') approvedCount += 1;
        else pendingCount += 1;

        const bonus = bonusOf(novelty, state, { menus, rulesById, user });
        if (!bonus.applies) {
            others.push(toLine(novelty, menu, { state, reason: NO_BONUS_REASONS[bonus.reason] ?? NO_BONUS_REASONS['sin-regla'] }));
            continue;
        }

        //  Una tarjeta por alerta, por regla y por turno: la misma alerta con otra regla (otro local) u otro turno
        //  (otro valor) no puede compartir casillas
        const key = `${idOf(novelty.menuRef) || alertName(novelty, menu)}:${bonus.rule}:${bonus.workShift}`;
        if (!groups.has(key)) {
            const rule = rulesById.get(bonus.rule);
            groups.set(key, {
                key,
                title: alertName(novelty, menu),
                ruleName: rule?.name ?? '',
                alertsRequired: bonus.alertsRequired,
                bonusAwarded: bonus.bonusAwarded,
                approvedStamps: [],
                pendingStamps: [],
                bonus: 0,
            });
        }

        const group = groups.get(key);
        const stamp = { id: idOf(novelty._id), state, time: clockOf(novelty.createdAt), table: novelty.table || null };

        if (state === 'approved') {
            group.approvedStamps.push(stamp);
            group.bonus += Number(bonus.bonusPerAlert) || 0;
            //  Lo sellado manda sobre lo adelantado: la tarjeta toma los números de su última aprobada
            group.alertsRequired = bonus.alertsRequired;
            group.bonusAwarded = bonus.bonusAwarded;
        }
        else {
            group.pendingStamps.push(stamp);
        }
    }

    const cards = [...groups.values()].map(({ approvedStamps, pendingStamps, ...card }) => {
        const size = Math.max(1, Number(card.alertsRequired) || 1);
        return {
            ...card,
            alertsRequired: size,
            approved: approvedStamps.length,
            pending: pendingStamps.length,
            filled: Math.floor(approvedStamps.length / size),
            ...fillSlots(approvedStamps, pendingStamps, size),
        };
    });

    return {
        cards,
        others,
        rejected,
        totals: {
            reported: novelties.length,
            approved: approvedCount,
            pending: pendingCount,
            rejected: rejected.length,
            bonus: cards.reduce((sum, card) => sum + card.bonus, 0),
            filled: cards.reduce((sum, card) => sum + card.filled, 0),
        },
    };
}


// formatBonus = «una cantidad de bonos como se lee»: 1,5 · 0,25 · 2
export const formatBonus = (value) => (Math.round((Number(value) || 0) * 100) / 100).toLocaleString('es', { maximumFractionDigits: 2 });

// bonusWord = «bono o bonos», según la cantidad
export const bonusWord = (value) => (Number(value) === 1 ? 'bono' : 'bonos');
