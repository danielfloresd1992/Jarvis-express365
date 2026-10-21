import { useEffect, useMemo, useState } from 'react';
import { getAlert, getBonusRules } from '../../../libs/fetch_data/stampFetching.js';
import { idOf } from '../../../libs/bonus/estimateBonus.js';


/*  LO QUE HACE FALTA PARA ADELANTAR EL BONO DE LAS QUE NO SE HAN APROBADO
 *
 *  Una novedad a lápiz no trae su regla de bono (la API la sella al aprobar), así que estimateBonus necesita:
 *
 *      las alertas   las de las novedades del día, una por una (GET /menu/id=…), con sus bonusRules
 *      las reglas    todas (GET /bonus/rules), una vez
 *
 *  Se guardan fuera del componente (alertCache, rulesCache): cambian muy poco y así no se vuelven a pedir al cambiar de
 *  usuario o de día. Una alerta que no existe se guarda como null; una que falló por la red no se guarda, y se vuelve a
 *  pedir cuando cambie la lista.
 *
 *  @param {Array} novelties  las del día (useMyNovelties): de ahí salen qué alertas pedir
 *  @returns {{ menus: Map, rulesById: Map }}  las alertas y las reglas, por su _id
 */


// alertCache = «las alertas ya pedidas», por _id (null = no existe)
const alertCache = new Map();

// rulesCache = «las reglas de bono», por _id; null mientras no se tienen
let rulesCache = null;


export default function useBonusCatalog(novelties) {

    const [menus, setMenus] = useState(() => new Map(alertCache));
    const [rulesById, setRulesById] = useState(() => rulesCache ?? new Map());

    // missing = «las alertas de hoy que todavía no se tienen», como texto para que el efecto no corra en cada pintado
    const missing = useMemo(
        () => [...new Set(novelties.map(novelty => idOf(novelty.menuRef)).filter(id => id && !alertCache.has(id)))].join(','),
        [novelties, menus],
    );

    //  Las reglas: una vez. Si fallaron, se reintenta cuando llegue otra novedad (cambia 'novelties.length').
    useEffect(() => {
        if (rulesCache) return undefined;
        let alive = true;
        getBonusRules()
            .then(rules => {
                rulesCache = new Map(rules.map(rule => [idOf(rule._id), rule]));
                if (alive) setRulesById(rulesCache);
            })
            .catch(error => console.log(error));
        return () => { alive = false; };
    }, [novelties.length]);

    //  Las alertas que faltan
    useEffect(() => {
        if (!missing) return undefined;
        let alive = true;
        Promise.all(missing.split(',').map(id => getAlert(id).then(alert => [id, alert]).catch(() => [id, undefined])))
            .then(entries => {
                entries.forEach(([id, alert]) => { if (alert !== undefined) alertCache.set(id, alert); });
                if (alive) setMenus(new Map(alertCache));
            });
        return () => { alive = false; };
    }, [missing]);

    return { menus, rulesById };
}
