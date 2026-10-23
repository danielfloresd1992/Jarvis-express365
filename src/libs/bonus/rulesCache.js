import { getBonusRules } from '../fetch_data/stampFetching.js';
import { idOf } from './estimateBonus.js';


/*  LAS REGLAS DE BONO, PEDIDAS UNA SOLA VEZ
 *
 *  GET /bonus/rules trae todas (activas o no) y cambian muy poco: se piden la primera vez que alguien las necesita
 *  —las tarjetas de sellos (useBonusCatalog) o el aviso de «Entregada con éxito» (SentNovelty)— y se guardan por su _id
 *  mientras viva la página. Si la petición falla no se guarda nada, y la siguiente llamada vuelve a intentarlo.
 */


// cache = «las reglas por _id», o null mientras no se tienen
let cache = null;

// pending = «la petición en camino», para que dos que piden a la vez compartan una
let pending = null;


// loadBonusRules = «las reglas, como Map por _id»: de la caché si ya están, si no de la API
export function loadBonusRules() {
    if (cache) return Promise.resolve(cache);
    if (!pending) {
        pending = getBonusRules()
            .then(rules => {
                cache = new Map(rules.map(rule => [idOf(rule._id), rule]));
                return cache;
            })
            .finally(() => { pending = null; });
    }
    return pending;
}

// cachedBonusRules = «las reglas si ya se pidieron», o null
export const cachedBonusRules = () => cache;
