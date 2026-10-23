import { useCallback, useEffect, useRef, useState } from 'react';
import { socketAppManager } from '../../../store/slices/socketio.js';
import { getMyNovelties, leanNovelty } from '../../../libs/fetch_data/stampFetching.js';
import { operationalDay } from '../../../libs/date_time/operationalDay.js';
import { idOf } from '../../../libs/bonus/estimateBonus.js';
import useOperationalDay from '../../tabletScreen/hook/useOperationalDay.jsx';


/*  MIS NOVEDADES DE HOY, AL DÍA
 *
 *  Las novedades que reportó el operador en el día operativo (GET /novelties/by-user, en stampFetching.js), y que se
 *  ponen al día solas:
 *
 *      'document_updated'   la API la emite al validar (PUT /novelties/id=…) con la novedad entera: si es de este
 *                           operador y de hoy, se cambia en la lista en el acto, sin pedir nada. Es la que trae las
 *                           aprobaciones y los rechazos. Y además se vuelve a pedir la lista un momento después
 *                           (RELOAD_DELAY_MS): si el documento del socket viniera de una API vieja, con otra forma
 *                           (sin el usuario populado, sin createdAt…), la barra se pone al día igual.
 *      'created_Alert'      la emite al crear una, pero con el documento del muro (Publisher), no con la novedad: si es
 *                           de este operador, se vuelve a pedir la lista, un momento después.
 *      'connect'            al volver la conexión: lo que pasó mientras tanto no llegó por el socket.
 *      cada REFRESH_MS      por si se perdió algún aviso.
 *
 *  Al cambiar de día operativo (08:00) o de usuario, la lista empieza de cero.
 *
 *  @param {string} userId  el _id del operador (Redux 'user'); sin él no se pide nada
 *  @returns {{ status, day, novelties, message }}  status: 'loading' | 'ready' | 'error'
 */


// REFRESH_MS = «cada cuánto se vuelve a pedir la lista, por si acaso»
const REFRESH_MS = 5 * 60 * 1000;

// RELOAD_DELAY_MS = «cuánto se espera a volver a pedir la lista tras un aviso del socket»: para que una ráfaga de avisos
// sea una sola petición
const RELOAD_DELAY_MS = 1500;

// EMPTY = «la lista antes de pedirla»
const EMPTY = { status: 'loading', day: '', novelties: [], message: '' };


export default function useMyNovelties(userId) {

    const day = useOperationalDay();
    const [state, setState] = useState(EMPTY);

    // requestRef = «el número de la última petición»: la respuesta de una vieja no pisa la de una nueva
    const requestRef = useRef(0);

    // load = «pedir la lista de este operador y este día»
    // Si falla con la lista ya enseñada, se queda la que había: un corte de red no vacía la barra.
    const load = useCallback(() => {
        if (!userId) return;
        const request = ++requestRef.current;

        getMyNovelties({ userId, day })
            .then(novelties => {
                if (request === requestRef.current) setState({ status: 'ready', day, novelties, message: '' });
            })
            .catch(error => {
                if (request !== requestRef.current) return;
                setState(current => (current.day === day && current.status === 'ready'
                    ? { ...current, message: error.message }
                    : { status: 'error', day, novelties: [], message: error.message }));
            });
    }, [userId, day]);


    //  Otro día u otro usuario: de cero
    useEffect(() => {
        setState({ ...EMPTY, day });
        load();
    }, [load, day]);


    //  En vivo
    useEffect(() => {
        if (!userId) return undefined;

        let reloadTimer = null;

        // reloadSoon = «volver a pedir la lista en un momento»: varios avisos seguidos, una sola petición
        const reloadSoon = () => {
            clearTimeout(reloadTimer);
            reloadTimer = setTimeout(load, RELOAD_DELAY_MS);
        };

        // isMine = «la novedad del aviso es de este operador»; null si el aviso no trae con qué saberlo
        const isMine = (doc) => {
            const owner = doc?.sharedByUser?.user?.id;
            return owner ? idOf(owner) === String(userId) : null;
        };

        // onUpdated = «validaron (o corrigieron) una novedad»: si es mía y de hoy, se cambia o se añade en el acto; y en
        // todo caso se vuelve a pedir la lista, por si el aviso vino con otra forma. Si no se sabe de quién es, se pide
        // la lista y listo: una petición de más es más barata que una barra que no reacciona.
        const onUpdated = (data) => {
            const doc = data?.doc;
            const mine = isMine(doc);
            if (mine === false) return;
            reloadSoon();
            if (mine === null || !doc.createdAt || operationalDay(new Date(doc.createdAt)) !== day) return;

            const novelty = leanNovelty(doc);
            setState(current => {
                if (current.day !== day || current.status !== 'ready') return current;
                const index = current.novelties.findIndex(item => idOf(item._id) === idOf(novelty._id));
                const novelties = [...current.novelties];
                if (index === -1) novelties.push(novelty);
                else novelties[index] = novelty;
                return { ...current, novelties };
            });
        };

        // onCreated = «alguien creó una novedad»: si fui yo (o no se sabe), se pide la lista otra vez
        const onCreated = (data) => {
            const creator = data?.user?.idUser;
            if (creator && String(creator) !== String(userId)) return;
            reloadSoon();
        };

        socketAppManager.on('document_updated', onUpdated);
        socketAppManager.on('created_Alert', onCreated);
        socketAppManager.on('connect', load);
        const refresh = setInterval(load, REFRESH_MS);

        return () => {
            socketAppManager.off('document_updated', onUpdated);
            socketAppManager.off('created_Alert', onCreated);
            socketAppManager.off('connect', load);
            clearInterval(refresh);
            clearTimeout(reloadTimer);
        };
    }, [userId, day, load]);


    return state;
}
