import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getNoveltiesByIds } from '../../../libs/fetch_data/noveltyFecth.js';
import { linkedIdsOf, putNovelties, keepLinked, unknownIds, noveltyIdOf } from '../../../libs/tickets/linkedNovelties.js';
import { onNoveltyUpdated, onJarvisReconnect } from '../../../libs/socket/noveltyEvents.js';


/*  LAS NOVEDADES DE LAS ROTACIONES DE MESAS, ENTERAS Y AL DÍA
 *
 *  Una rotación guarda solo el _id de cada novedad que se reportó desde ella (libs/tickets/linkedNovelties.js). Este
 *  hook tiene el documento ENTERO de cada una, para que su fila sepa si se aprobó, se invalidó o se modificó:
 *
 *      1. AL ABRIR LA APP, y cada vez que aparece un _id nuevo en las rotaciones (se reportó una demora, se cambió de
 *         local…), se piden a la API las que no se tienen (getNoveltiesByIds, en libs/fetch_data/noveltyFecth.js).
 *      2. EN VIVO: al validar o corregir una novedad, la API la manda entera por el socket ('document_updated', ver
 *         libs/socket/noveltyEvents.js). Si es de una rotación, se cambia en el acto, sin pedir nada.
 *      3. AL VOLVER LA CONEXIÓN se vuelven a pedir todas: lo que se validó mientras tanto no llegó por el socket.
 *      4. Cada RETRY_MS, las que todavía no se saben: una petición que falló (sin red, sesión vencida) se repite sola.
 *
 *  Las que dejan de estar enlazadas —la rotación se guardó y se limpió, se cambió de local— se sueltan.
 *
 *  VIVE EN LA SESIÓN (useTabletSession), y no en cada fila: UN solo oyente del socket y UNA sola tanda de peticiones
 *  para toda la tabla, que además sigue al día aunque Mesas no esté a la vista.
 *
 *  @param {Array} records  las rotaciones de Mesas (useRegisterStore)
 *  @returns {Map}  _id → el documento entero (null = la API dice que no existe). Sin entrada = todavía no se sabe.
 *                  Es el MISMO Map mientras no cambie nada: la tabla va con 'memo'.
 */


// RETRY_MS = «cada cuánto se vuelven a pedir las que todavía no se saben»
const RETRY_MS = 60_000;


export function useLinkedNovelties(records) {

    const [novelties, setNovelties] = useState(() => new Map());

    // idsKey = «los _id enlazados, en una cadena». Las rotaciones cambian en cada tecla y en cada lectura de la IA,
    // pero sus novedades casi nunca: con la cadena, los efectos de abajo solo corren cuando cambian de verdad.
    const idsKey = useMemo(() => linkedIdsOf(records).join(','), [records]);

    // linkedRef = «los _id enlazados ahora», para los oyentes, que no se vuelven a montar con cada cambio
    const linkedRef = useRef(new Set());

    // noveltiesRef = «el Map de ahora», para saber qué falta sin esperar a otro pintado
    const noveltiesRef = useRef(novelties);
    noveltiesRef.current = novelties;

    // pendingRef = «las que se están pidiendo ahora»: ninguna se pide dos veces a la vez
    const pendingRef = useRef(new Set());


    // fetchNovelties = «pedir estas novedades a la API», salvo las que ya van de camino, y ponerlas al llegar. Al
    // ponerlas se mira qué sigue enlazado en ESE momento: una que se soltó mientras tanto no vuelve a entrar.
    const fetchNovelties = useCallback((ids) => {
        const wanted = ids.filter(id => !pendingRef.current.has(id));
        if (wanted.length === 0) return;

        wanted.forEach(id => pendingRef.current.add(id));
        getNoveltiesByIds(wanted)
            .then(found => setNovelties(current => putNovelties(current, found, linkedRef.current)))
            .finally(() => wanted.forEach(id => pendingRef.current.delete(id)));
    }, []);


    //  1. CAMBIAN LAS ENLAZADAS (y al abrir la app, con lo guardado en el equipo): se sueltan las que sobran y se
    //     piden las que no se saben
    useEffect(() => {
        const linked = new Set(idsKey ? idsKey.split(',') : []);
        linkedRef.current = linked;

        setNovelties(current => keepLinked(current, linked));
        fetchNovelties(unknownIds(noveltiesRef.current, linked));
    }, [idsKey, fetchNovelties]);


    //  2. EN VIVO: la novedad que se acaba de validar o corregir, si es de una rotación
    useEffect(() => onNoveltyUpdated((doc) => {
        const id = noveltyIdOf(doc);
        if (linkedRef.current.has(id)) setNovelties(current => putNovelties(current, [[id, doc]], linkedRef.current));
    }), []);


    //  3. AL VOLVER LA CONEXIÓN: todas otra vez
    useEffect(() => onJarvisReconnect(() => fetchNovelties([...linkedRef.current])), [fetchNovelties]);


    //  4. LAS QUE NO SE SABEN, de nuevo cada RETRY_MS. Sin ninguna pendiente, no se pide nada.
    useEffect(() => {
        const timer = setInterval(() => {
            const unknown = unknownIds(noveltiesRef.current, linkedRef.current);
            if (unknown.length > 0) fetchNovelties(unknown);
        }, RETRY_MS);

        return () => clearInterval(timer);
    }, [fetchNovelties]);


    return novelties;
}
