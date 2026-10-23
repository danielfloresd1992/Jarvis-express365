import { estimateBonus } from './estimateBonus.js';
import { formatBonus, bonusWord, NO_BONUS_REASONS } from './stampCards.js';
import { categoryOf } from '../alerts/categories.js';


/*  CÓMO REACCIONA EL AVISO DE «ENTREGADA CON ÉXITO», SEGÚN LA REGLA DE BONO
 *
 *  Al enviar una novedad se abre un aviso distinto por alerta (pedido del usuario, propuesta «B · La moneda»): el
 *  color lo pone la categoría de la alerta (libs/alerts/categories.js) y la reacción, su regla de bono. Las seis que
 *  salen del modelo (api_jarvis365: Menu.bonusRules, BonusRule, Menu.dvrEffect):
 *
 *      'dvr'       la alerta restablece las cámaras (dvrEffect 'up'): el local queda desbloqueado
 *      'none'      no da bono (no bonifica, sin regla, fuera de alcance, regla apagada): cuenta igual
 *      'override'  este local tiene excepción en la regla: aquí vale distinto que en general
 *      'night'     la regla paga distinto de noche, y se reportó en turno nocturno
 *      'full'      1 alerta = el bono entero: la moneda entera
 *      'step'      N alertas = 1 bono: un trozo de moneda, un sello más en la tarjeta
 *
 *  PURA: recibe lo que ya se sabe al enviar y devuelve qué pintar. La usa useSentReaction (component/SentNovelty).
 */


// FRACTIONS = «un trozo de moneda, en un carácter»: lo que vale una alerta de una regla N × 1
const FRACTIONS = { 2: '½', 3: '⅓', 4: '¼', 5: '⅕', 6: '⅙', 8: '⅛' };

// ordinal = «6.ª de hoy»
const ordinal = (count) => `${count}.ª`;


/*  sentReaction = «la reacción del aviso»
 *
 *  @param {object} menu           la alerta (Menu), con category, bonifies, bonusRules y dvrEffect
 *  @param {Map}    rulesById      las reglas de bono por _id (rulesCache)
 *  @param {object} user           el operador (Redux), con workSchedule
 *  @param {object} establishment  el local (Redux), con name y franchiseReference
 *  @param {Date}   at             cuándo se envió
 *  @param {object} card           la tarjeta de sellos de esta alerta hoy (buildStampCards), si se tiene: dice «2 de 4»
 *  @param {number} todayCount     cuántas lleva reportadas hoy, con esta
 *  @returns {{ kind, category, alert, bonus, reward, headline, sub, coin }}
 *      reward   los bonos en juego con esta novedad (0 si no da)
 *      coin     { face: 'full' | 'quarter' | 'night' | 'override' | 'stub' | 'disc', text, word, fraction, label }
 */
export function sentReaction({ menu, rulesById, user, establishment, at = new Date(), card = null, todayCount = 0 }) {

    const category = categoryOf(menu?.category);
    const alert = menu?.es ?? 'Novedad';
    const bonus = estimateBonus({ menu, rulesById, user, establishment, at });
    const localName = establishment?.name ?? 'este local';

    // base = «lo común a todas»
    const base = { category, alert, bonus, reward: bonus.applies ? bonus.bonusPerAlert : 0 };

    if (menu?.dvrEffect === 'up') {
        return {
            ...base,
            kind: 'dvr',
            headline: 'Local desbloqueado',
            sub: `Ya se pueden cargar novedades de ${localName}`,
            coin: { face: 'disc', text: '', word: 'de vuelta', fraction: 1, label: 'Las cámaras volvieron: el local queda desbloqueado' },
        };
    }

    if (!bonus.applies) {
        const reason = NO_BONUS_REASONS[bonus.reason] ?? NO_BONUS_REASONS['sin-regla'];
        return {
            ...base,
            kind: 'none',
            headline: 'Sin bono, pero cuenta',
            sub: `Entra en el reporte diario del local y en tu registro · ${reason}`,
            coin: { face: 'stub', text: todayCount > 0 ? ordinal(todayCount) : '', word: 'de hoy', fraction: 0, label: 'Un resguardo: sin bono, pero cuenta' },
        };
    }

    const { alertsRequired, bonusAwarded, bonusPerAlert, awarded, workShift, general } = bonus;
    const word = bonusWord(bonusAwarded);

    if (bonus.appliedFrom === 'override' && general) {
        return {
            ...base,
            kind: 'override',
            headline: `En ${localName} esta alerta vale ${formatBonus(bonusPerAlert)} ${bonusWord(bonusPerAlert)}`,
            sub: `En general es ${general.alertsRequired} × ${formatBonus(general.bonusAwarded)}; este local tiene excepción: ${alertsRequired} × ${formatBonus(bonusAwarded)}`,
            coin: { face: 'override', text: formatBonus(bonusPerAlert), word: 'aquí', fraction: bonusPerAlert / bonusAwarded, label: `Moneda de ${formatBonus(bonusPerAlert)} por la excepción de este local` },
        };
    }

    if (workShift === 'night' && awarded.night !== awarded.day) {
        const more = awarded.night > awarded.day;
        return {
            ...base,
            kind: 'night',
            headline: `De noche vale ${more ? 'más' : 'distinto'}: ${formatBonus(bonusPerAlert)} ${bonusWord(bonusPerAlert)}`,
            sub: `Tu regla: ${formatBonus(awarded.day)} de día, ${formatBonus(awarded.night)} de noche${alertsRequired > 1 ? ` por cada ${alertsRequired}` : ''} · reportaste en turno nocturno`,
            coin: { face: 'night', text: formatBonus(bonusPerAlert), word: 'noche', fraction: bonusPerAlert / bonusAwarded, label: `Moneda de noche: ${formatBonus(bonusPerAlert)} ${bonusWord(bonusPerAlert)}` },
        };
    }

    if (alertsRequired === 1) {
        return {
            ...base,
            kind: 'full',
            headline: bonusAwarded >= 1 ? '¡Bono completo con una sola aprobada!' : `Esta vale ${formatBonus(bonusAwarded)} ${word}`,
            sub: `Tu regla: 1 alerta = ${formatBonus(bonusAwarded)} ${word}`,
            coin: { face: 'full', text: formatBonus(bonusAwarded), word, fraction: 1, label: `Una moneda entera: ${formatBonus(bonusAwarded)} ${word}` },
        };
    }

    // position = «qué casilla ocupa esta en su tarjeta»: las aprobadas que sobran más las que esperan (esta incluida,
    // si la lista ya la trae); sin tarjeta a mano, la primera
    const waiting = card ? card.slots.filter(slot => slot?.state === 'pending').length : 0;
    const position = card ? Math.min(alertsRequired, card.stamped + Math.max(1, waiting)) : 1;
    const missing = alertsRequired - position;
    const piece = bonusAwarded === 1 && FRACTIONS[alertsRequired] ? FRACTIONS[alertsRequired] : formatBonus(bonusPerAlert);

    return {
        ...base,
        kind: 'step',
        headline: missing > 0
            ? `${piece === formatBonus(bonusPerAlert) ? '+' : 'Un '}${piece} más: te ${missing === 1 ? 'falta 1' : `faltan ${missing}`} para el bono`
            : `Con esta se llena la tarjeta: +${formatBonus(bonusAwarded)} ${word}`,
        sub: `Tu regla: ${alertsRequired} alertas = ${formatBonus(bonusAwarded)} ${word} · cada una vale ${formatBonus(bonusPerAlert)}`,
        coin: { face: 'quarter', text: piece, word: `${position} de ${alertsRequired}`, fraction: 1 / alertsRequired, label: `Un trozo de moneda: ${position} de ${alertsRequired}` },
    };
}
