import { useEffect, useMemo, useState } from 'react';
import { loadBonusRules, cachedBonusRules } from '../../../libs/bonus/rulesCache.js';
import { sentReaction } from '../../../libs/bonus/sentReaction.js';


/*  LA REACCIÓN DEL AVISO, CON LAS REGLAS A MANO
 *
 *  sentReaction (libs/bonus/sentReaction.js) necesita las reglas de bono para saber qué moneda enseñar. Se piden una
 *  vez (rulesCache) y, mientras llegan, el aviso ya se pinta con lo que se sabe sin ellas: si llegan después, la
 *  moneda cambia sola. Si no llegan nunca, la alerta se enseña como «sin regla a mano», que es verdad.
 *
 *  @param {object} sent    { menu, table, at } de la novedad que se acaba de enviar
 *  @param {object} user    el operador (Redux)
 *  @param {object} establishment  el local (Redux)
 *  @param {object} card    la tarjeta de sellos de esta alerta hoy (useTodayBonus), o null
 *  @param {number} todayCount  cuántas lleva reportadas hoy
 *  @returns {{ reaction, rulesReady }}
 */
export default function useSentReaction({ sent, user, establishment, card, todayCount }) {

    const [rulesById, setRulesById] = useState(() => cachedBonusRules());

    useEffect(() => {
        if (rulesById) return undefined;
        let alive = true;
        loadBonusRules()
            .then(rules => { if (alive) setRulesById(rules); })
            .catch(error => console.log(error));
        return () => { alive = false; };
    }, [rulesById]);

    const reaction = useMemo(
        () => (sent ? sentReaction({ menu: sent.menu, rulesById: rulesById ?? new Map(), user, establishment, at: sent.at, card, todayCount }) : null),
        [sent, rulesById, user, establishment, card, todayCount],
    );

    return { reaction, rulesReady: Boolean(rulesById) };
}
