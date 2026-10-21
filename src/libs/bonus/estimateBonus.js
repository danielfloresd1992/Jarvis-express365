/*  CUÁNTO VA A BONIFICAR UNA NOVEDAD QUE TODAVÍA NO SE APROBÓ
 *
 *  La cifra que vale es la que sella la API al APROBAR (Noveltie.bonus: bonusPerAlert, alertsRequired, bonusAwarded,
 *  workShift…), y después ya no cambia. Antes de eso la novedad no trae nada, y las tarjetas de sellos (StampCards)
 *  necesitan saber en qué tarjeta va su sello a lápiz y cuántas casillas tiene: eso lo adelanta este archivo.
 *
 *  Es una copia de resolveBonusForNovelty (api_jarvis365/src/apiServises/bonus/resolveBonus.lib.ts), porque entre los
 *  dos repos no hay código compartido. Si allá cambia la regla, hay que cambiarla aquí. Dos diferencias, las dos a
 *  sabiendas:
 *
 *      · Sin la asistencia del día: el turno cambiado a mano en Attendance (scheduleOverride.shift) no llega al
 *        front. Se usa el horario de ese día de la semana, la jornada base o, sin nada, el diurno.
 *      · Sin pointValue: aquí se cuentan bonos, no dólares.
 *
 *  PURA: todo entra por parámetro.
 */


// TIME_ZONE = «la zona del negocio»: el día de la semana del horario es el de Caracas
const TIME_ZONE = 'America/Caracas';

// WEEKDAYS = «los días como los da Intl en inglés, en el orden de Date.getDay()»: 0 es domingo
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


// idOf = «un id como texto», venga como string, ObjectId o documento con _id
export const idOf = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && '_id' in value) return String(value._id);
    return String(value);
};

// isNight = «el texto dice nocturno»: 'Nocturno', 'noche'… (la API mira igual el comienzo)
const isNight = (value) => String(value || '').trim().toLowerCase().startsWith('noc');

// numberOr = «un número usable, o el de reserva». Igual que `numero` en la API, a propósito también en que un null
// vale 0 (Number(null)): si aquí se leyera distinto, el sello a lápiz no coincidiría con el que pone la API.
const numberOr = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

// weekdayOf = «el día de la semana de un instante, en Caracas»: 0 domingo … 6 sábado
const weekdayOf = (at) => WEEKDAYS.indexOf(new Date(at).toLocaleDateString('en-US', { weekday: 'short', timeZone: TIME_ZONE }));


// workShiftOf = «el turno del operador cuando reportó»: 'day' | 'night'
// El horario de ese día de la semana, si lo tiene; si no, su jornada base; si no, diurno.
export function workShiftOf(user, at) {
    const byDay = user?.workSchedule?.scheduleByDay;
    const ofTheDay = byDay?.[String(weekdayOf(at))];
    if (ofTheDay?.shift) return isNight(ofTheDay.shift) ? 'night' : 'day';

    const base = user?.workSchedule?.shiftType;
    if (base) return isNight(base) ? 'night' : 'day';

    return 'day';
}


// isInScope = «este alcance cubre este local»: 'all' siempre; 'only' si lo nombra (por local o por marca); 'except'
// si no lo nombra
const isInScope = (scope, establishment) => {
    if (!scope?.mode || scope.mode === 'all') return true;

    const local = idOf(establishment?._id ?? establishment);
    const brand = idOf(establishment?.franchiseReference?.franchise);
    const listed = (Boolean(local) && (scope.locals || []).some(item => idOf(item) === local))
        || (Boolean(brand) && (scope.franchises || []).some(item => idOf(item) === brand));

    return scope.mode === 'only' ? listed : !listed;
};

// specificity = «cuánto se ajusta un alcance a este local»: 3 lo nombra · 2 nombra su marca · 1 general · 0 no aplica
const specificity = (scope, establishment) => {
    if (!isInScope(scope, establishment)) return 0;
    if (scope?.mode !== 'only') return 1;

    const local = idOf(establishment?._id ?? establishment);
    const brand = idOf(establishment?.franchiseReference?.franchise);
    if (local && (scope.locals || []).some(item => idOf(item) === local)) return 3;
    if (brand && (scope.franchises || []).some(item => idOf(item) === brand)) return 2;
    return 1;
};

// pickAssignment = «de las reglas de la alerta, la que aplica en este local»: gana la más específica
const pickAssignment = (assignments, establishment) => {
    let best = null;
    let weight = 0;
    for (const assignment of assignments || []) {
        const fit = specificity(assignment?.scope, establishment);
        if (fit > weight) {
            best = assignment;
            weight = fit;
        }
    }
    return best;
};

// findOverride = «la excepción de la regla para este local», o la de su marca
const findOverride = (rule, establishment) => {
    const local = idOf(establishment?._id ?? establishment);
    const brand = idOf(establishment?.franchiseReference?.franchise);
    const overrides = rule?.overrides || [];
    return (local && overrides.find(item => idOf(item.local) === local))
        || (brand && overrides.find(item => idOf(item.franchise) === brand))
        || null;
};


/*  estimateBonus = «lo que sellará la API si aprueban esta novedad»
 *
 *  @param {object} menu           la alerta (Menu), con bonusRules[].rule SIN popular (como la da GET /menu/id=…)
 *  @param {Map}    rulesById      las reglas (GET /bonus/rules), por su _id
 *  @param {object} user           el operador, con workSchedule
 *  @param {object} establishment  el local de la novedad, con franchiseReference
 *  @param {Date}   at             cuándo se reportó
 *  @returns {object}  como el sello de la API: { applies: true, rule, alertsRequired, bonusAwarded, bonusPerAlert,
 *           workShift } o { applies: false, reason }
 */
export function estimateBonus({ menu, rulesById, user, establishment, at }) {
    if (!menu) return { applies: false, reason: 'sin-alerta' };

    //  Solo un false EXPLÍCITO corta: null es lo que traen las alertas anteriores a ese campo
    if (menu.bonifies === false) return { applies: false, reason: 'no-bonifica' };

    const assignments = menu.bonusRules || [];
    if (!assignments.length) return { applies: false, reason: 'sin-regla' };

    const assignment = pickAssignment(assignments, establishment);
    if (!assignment) return { applies: false, reason: 'fuera-de-alcance' };

    const rule = rulesById?.get(idOf(assignment.rule));
    if (!rule) return { applies: false, reason: 'regla-sin-popular' };
    if (rule.active === false) return { applies: false, reason: 'regla-inactiva' };

    const workShift = workShiftOf(user, at);
    const override = findOverride(rule, establishment);
    const alertsRequired = Math.max(1, numberOr(override?.alertsRequired, numberOr(rule.alertsRequired, 1)));
    const bonusAwarded = numberOr(override?.bonusAwarded?.[workShift], numberOr(rule.bonusAwarded?.[workShift], 1));

    return { applies: true, rule: idOf(rule._id), alertsRequired, bonusAwarded, bonusPerAlert: bonusAwarded / alertsRequired, workShift };
}
