import { useCallback, useEffect, useRef, useState } from 'react';
import { noveltyState } from '../../../libs/bonus/stampCards.js';
import { idOf } from '../../../libs/bonus/estimateBonus.js';


/*  LO QUE ACABA DE PASAR: UNA APROBADA, UN SELLO NUEVO O UNA TARJETA LLENA
 *
 *  Compara cada versión de las novedades con la anterior. Lo que llega por el socket es 'document_updated', que la API
 *  emite en el PUT de la novedad (useMyNovelties):
 *
 *      aprobada        pasó de SIN VALIDAR a APROBADA (isApproved de null a true, pedido del usuario; una que no
 *                      estaba en la lista y llega aprobada cuenta igual). Su sello cae con golpe (freshIds, durante
 *                      FRESH_MS) y salta confeti del botón «Tarjetas» (burst, ConfettiBurst). Una rechazada que luego
 *                      se aprueba no lo dispara. El aviso de «Aprobada» ya lo da notifications.jsx: aquí no se repite.
 *      tarjeta llena   una tarjeta que llenó una más (filled sube): sale «¡Tarjeta llena!» (celebration), que se va
 *                      sola a los CELEBRATION_MS o con su ✕.
 *      rechazada       pasó de SIN VALIDAR a RECHAZADA (pedido del usuario: que la barra reaccione también al rechazo).
 *                      Sin castigo: la cuenta de rechazadas tiembla un momento y su renglón entra resaltado en el panel
 *                      (freshRejectedIds, durante FRESH_MS). Nada de confeti.
 *
 *  El confeti pesa según lo que trajo (pedido del usuario: más en las que tienen regla de bono): 'small' si ninguna da
 *  bono, 'bonus' con el bono que sumaron (Noveltie.bonus, sellado en ese mismo PUT) y 'full' si además llenó una tarjeta.
 *
 *  La primera lista de un día o de un usuario no celebra nada: todo lo que trae ya estaba.
 *
 *  @param {Array}   novelties  las del día (useMyNovelties)
 *  @param {Array}   cards      las tarjetas (buildStampCards)
 *  @param {boolean} ready      la lista ya llegó
 *  @param {string}  scope      de quién y de qué día es ('<usuario>:<día>'): si cambia, se empieza de cero
 *  @returns {{ freshIds: Set, freshRejectedIds: Set, celebration, dismissCelebration, burst }}
 *           burst: { id, strength, amount } o null
 */


// FRESH_MS = «cuánto dura el golpe del sello»: algo más que la animación 'stamp-slam' (style.css)
const FRESH_MS = 2400;

// CELEBRATION_MS = «cuánto se queda el aviso de tarjeta llena»
const CELEBRATION_MS = 8000;

// BURST_MS = «cuánto se queda el confeti»: algo más que el papelito más lento (ConfettiBurst: retraso + duración)
const BURST_MS = 1800;

// NO_FRESH = «ningún sello nuevo»
const NO_FRESH = new Set();


export default function useStampNews({ novelties, cards, ready, scope }) {

    const [freshIds, setFreshIds] = useState(NO_FRESH);
    const [freshRejectedIds, setFreshRejectedIds] = useState(NO_FRESH);
    const [celebration, setCelebration] = useState(null);
    const [burst, setBurst] = useState(null);

    // previousRef = «lo de la versión anterior»: { scope, states, filledByKey }
    const previousRef = useRef(null);

    // burstCountRef = «cuántas ráfagas van»: cada una se monta con su número, y así una nueva no reusa la anterior
    const burstCountRef = useRef(0);

    useEffect(() => {
        if (!ready) return;

        const states = new Map(novelties.map(novelty => [idOf(novelty._id), noveltyState(novelty)]));
        const filledByKey = new Map(cards.map(card => [card.key, card.filled]));
        const previous = previousRef.current;
        previousRef.current = { scope, states, filledByKey };

        if (!previous || previous.scope !== scope) return;

        // approvedNow = «las que pasaron de sin validar a aprobadas»
        const approvedNow = novelties.filter(novelty => {
            const id = idOf(novelty._id);
            return states.get(id) === 'approved' && (previous.states.get(id) ?? 'pending') === 'pending';
        });

        // rejectedNow = «las que pasaron de sin validar a rechazadas»
        const rejectedNow = novelties.filter(novelty => {
            const id = idOf(novelty._id);
            return states.get(id) === 'rejected' && (previous.states.get(id) ?? 'pending') === 'pending';
        });

        // completed = «una tarjeta que se acaba de llenar»
        const completed = cards.find(card => card.filled > (previous.filledByKey.get(card.key) ?? 0));

        if (approvedNow.length) setFreshIds(new Set(approvedNow.map(novelty => idOf(novelty._id))));
        if (rejectedNow.length) setFreshRejectedIds(new Set(rejectedNow.map(novelty => idOf(novelty._id))));

        if (approvedNow.length || completed) {
            // amount = «los bonos que trajeron», lo que selló la API al aprobarlas
            const amount = approvedNow.reduce((sum, novelty) => sum + (novelty.bonus?.applies === true ? Number(novelty.bonus.bonusPerAlert) || 0 : 0), 0);
            burstCountRef.current += 1;
            setBurst({ id: burstCountRef.current, strength: completed ? 'full' : amount > 0 ? 'bonus' : 'small', amount });
        }

        if (completed) setCelebration({ key: completed.key, title: completed.title, bonusAwarded: completed.bonusAwarded, filled: completed.filled });
    }, [novelties, cards, ready, scope]);

    //  El confeti se quita solo
    useEffect(() => {
        if (!burst) return undefined;
        const timer = setTimeout(() => setBurst(null), BURST_MS);
        return () => clearTimeout(timer);
    }, [burst]);

    //  El golpe del sello se apaga solo; el temblor del rechazo, también
    useEffect(() => {
        if (freshIds.size === 0) return undefined;
        const timer = setTimeout(() => setFreshIds(NO_FRESH), FRESH_MS);
        return () => clearTimeout(timer);
    }, [freshIds]);

    useEffect(() => {
        if (freshRejectedIds.size === 0) return undefined;
        const timer = setTimeout(() => setFreshRejectedIds(NO_FRESH), FRESH_MS);
        return () => clearTimeout(timer);
    }, [freshRejectedIds]);

    //  Y el aviso de tarjeta llena también
    const dismissCelebration = useCallback(() => setCelebration(null), []);
    useEffect(() => {
        if (!celebration) return undefined;
        const timer = setTimeout(dismissCelebration, CELEBRATION_MS);
        return () => clearTimeout(timer);
    }, [celebration, dismissCelebration]);

    return { freshIds, freshRejectedIds, celebration, dismissCelebration, burst };
}
