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
 *                           operador y de hoy, se cambia en la lista sin pedir nada. Es la que trae las aprobaciones.
 *      'created_Alert'      la emite al crear una, pero con el documento del muro (Publisher), no con la novedad: si es
 *                           de este operador, se vuelve a pedir la lista, un momento después (CREATED_DELAY_MS).
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

// CREATED_DELAY_MS = «cuánto se espera a pedir la lista después de crear una»: para que una ráfaga sea una sola petición
const CREATED_DELAY_MS = 1500;

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

        let createdTimer = null;

        // onUpdated = «validaron (o corrigieron) una novedad»: si es mía y de hoy, se cambia o se añade
        const onUpdated = (data) => {
            const doc = data?.doc;
            if (!doc || idOf(doc.sharedByUser?.user?.id) !== String(userId)) return;
            if (operationalDay(new Date(doc.createdAt)) !== day) return;

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

        // onCreated = «alguien creó una novedad»: si fui yo, se pide la lista otra vez
        const onCreated = (data) => {
            if (String(data?.user?.idUser ?? '') !== String(userId)) return;
            clearTimeout(createdTimer);
            createdTimer = setTimeout(load, CREATED_DELAY_MS);
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
            clearTimeout(createdTimer);
        };
    }, [userId, day, load]);


    return state;
}
