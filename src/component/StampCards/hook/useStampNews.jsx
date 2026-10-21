import { useCallback, useEffect, useRef, useState } from 'react';
import { noveltyState } from '../../../libs/bonus/stampCards.js';
import { idOf } from '../../../libs/bonus/estimateBonus.js';


/*  LO QUE ACABA DE PASAR: UN SELLO NUEVO O UNA TARJETA LLENA
 *
 *  Compara cada versión de las tarjetas con la anterior:
 *
 *      sello nuevo     una novedad que no estaba aprobada y ahora sí: su sello cae con golpe (freshIds, durante
 *                      FRESH_MS). El aviso de «Aprobada» ya lo da notifications.jsx: aquí no se repite.
 *      tarjeta llena   una tarjeta que llenó una más (filled sube): sale «¡Tarjeta llena!» (celebration), que se va
 *                      sola a los CELEBRATION_MS o con su ✕.
 *
 *  La primera lista de un día o de un usuario no celebra nada: todo lo que trae ya estaba.
 *
 *  @param {Array}   novelties  las del día (useMyNovelties)
 *  @param {Array}   cards      las tarjetas (buildStampCards)
 *  @param {boolean} ready      la lista ya llegó
 *  @param {string}  scope      de quién y de qué día es ('<usuario>:<día>'): si cambia, se empieza de cero
 *  @returns {{ freshIds: Set, celebration, dismissCelebration }}
 */


// FRESH_MS = «cuánto dura el golpe del sello»: algo más que la animación 'stamp-slam' (style.css)
const FRESH_MS = 2400;

// CELEBRATION_MS = «cuánto se queda el aviso de tarjeta llena»
const CELEBRATION_MS = 8000;

// NO_FRESH = «ningún sello nuevo»
const NO_FRESH = new Set();


export default function useStampNews({ novelties, cards, ready, scope }) {

    const [freshIds, setFreshIds] = useState(NO_FRESH);
    const [celebration, setCelebration] = useState(null);

    // previousRef = «lo de la versión anterior»: { scope, approvedIds, filledByKey }
    const previousRef = useRef(null);

    useEffect(() => {
        if (!ready) return;

        const approvedIds = new Set(novelties.filter(novelty => noveltyState(novelty) === 'approved').map(novelty => idOf(novelty._id)));
        const filledByKey = new Map(cards.map(card => [card.key, card.filled]));
        const previous = previousRef.current;
        previousRef.current = { scope, approvedIds, filledByKey };

        if (!previous || previous.scope !== scope) return;

        const stamped = [...approvedIds].filter(id => !previous.approvedIds.has(id));
        if (stamped.length) setFreshIds(new Set(stamped));

        const completed = cards.find(card => card.filled > (previous.filledByKey.get(card.key) ?? 0));
        if (completed) setCelebration({ key: completed.key, title: completed.title, bonusAwarded: completed.bonusAwarded, filled: completed.filled });
    }, [novelties, cards, ready, scope]);

    //  El golpe del sello se apaga solo
    useEffect(() => {
        if (freshIds.size === 0) return undefined;
        const timer = setTimeout(() => setFreshIds(NO_FRESH), FRESH_MS);
        return () => clearTimeout(timer);
    }, [freshIds]);

    //  Y el aviso de tarjeta llena también
    const dismissCelebration = useCallback(() => setCelebration(null), []);
    useEffect(() => {
        if (!celebration) return undefined;
        const timer = setTimeout(dismissCelebration, CELEBRATION_MS);
        return () => clearTimeout(timer);
    }, [celebration, dismissCelebration]);

    return { freshIds, celebration, dismissCelebration };
}
