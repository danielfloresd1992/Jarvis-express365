import { useEffect, useMemo, useState } from 'react';
import { getMyNovelties } from '../../../libs/fetch_data/stampFetching.js';
import { operationalDay } from '../../../libs/date_time/operationalDay.js';
import { buildStampCards } from '../../../libs/bonus/stampCards.js';
import { idOf } from '../../../libs/bonus/estimateBonus.js';
import useBonusCatalog from '../../StampCards/hook/useBonusCatalog.jsx';


/*  LO DE HOY, PARA EL AVISO: cuántos bonos lleva ganados y en qué casilla cae esta
 *
 *  Se pide una vez al abrirse el aviso (GET /novelties/by-user del día operativo, ya con la novedad recién creada) y
 *  se pasa por las mismas tarjetas de la barra (buildStampCards): de ahí salen los bonos ganados hoy, cuántas lleva
 *  reportadas y la tarjeta de esta alerta, que dice «2 de 4». Si la petición falla, el aviso sale sin la pila: no es
 *  motivo para no celebrar.
 *
 *  @param {string} userId  el _id del operador
 *  @param {object} user    el operador, con workSchedule (su turno decide la tarjeta)
 *  @param {string} menuId  el _id de la alerta recién enviada
 *  @param {number} openedAt  cuándo se abrió el aviso (Date.now()): cada aviso pide de nuevo
 *  @returns {{ ready, totals, card }}
 */
export default function useTodayBonus({ userId, user, menuId, openedAt }) {

    const [novelties, setNovelties] = useState([]);
    const [ready, setReady] = useState(false);
    const { menus, rulesById } = useBonusCatalog(novelties);

    useEffect(() => {
        if (!userId || !openedAt) return undefined;
        let alive = true;
        setReady(false);
        getMyNovelties({ userId, day: operationalDay() })
            .then(list => { if (alive) { setNovelties(list); setReady(true); } })
            .catch(error => console.log(error));
        return () => { alive = false; };
    }, [userId, openedAt]);

    const result = useMemo(() => buildStampCards({ novelties, menus, rulesById, user }), [novelties, menus, rulesById, user]);

    // card = «la tarjeta de esta alerta», si hoy ya tiene (la última, por si la misma alerta tuvo dos reglas)
    const card = useMemo(() => {
        const prefix = `${idOf(menuId)}:`;
        const found = result.cards.filter(item => item.key.startsWith(prefix));
        return found.length ? found[found.length - 1] : null;
    }, [result, menuId]);

    return { ready, totals: result.totals, card };
}
