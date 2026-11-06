import { useCallback, useEffect, useRef, useState } from 'react';
import { syncRotation, removeOpenRotation, getOpenRotations, saveRotation } from '../../../libs/fetch_data/rotationFetching.js';
import { onRotationSync } from '../../../libs/socket/rotationEvents.js';
import { onJarvisReconnect } from '../../../libs/socket/noveltyEvents.js';
import {
    planChanges, toSyncBody, fromServerRotation, placeRemote, clearRemote, syncSignature, remoteAction,
    queueUpsert, settle, isClosing, authorshipOf, readOutbox, writeOutbox,
} from '../../../libs/tickets/rotationSync.js';


/*  MESAS EN VIVO: LA VUELTA CON LA API Y EL SOCKET
 *
 *  Las reglas están en libs/tickets/rotationSync.js; aquí se mueven. Vive dentro del registro (useRegisterStore),
 *  que es quien sabe cuándo cambia algo:
 *
 *      1. CADA CAMBIO     el registro llama a notify con las rotaciones como quedaron: lo que cambió entra en la cola
 *                         (que se guarda en el equipo) y se sube un segundo después, junto con lo que se escriba en ese
 *                         rato. Lo escrito ya se ve y ya está guardado en el equipo: la subida no se espera.
 *      2. EL DISQUETE     close: la rotación entra en la cola CERRADA y se sube al momento. La fila se limpia sin
 *                         esperar (lo hace el registro). Cuando la API la guarda, va a Registros (onClosed). Si la API
 *                         no la acepta, vuelve a Mesas para corregirla: no se pierde.
 *      3. SIN CONEXIÓN    lo que no sube se queda en la cola y se reintenta cada 15 s, al volver la red del equipo
 *                         ('online') y al reconectar el socket. Se sigue trabajando igual.
 *                         Si la API todavía no tiene estas rutas (404: se despliega a mano y puede ir por detrás), lo
 *                         abierto espera, pero un CIERRE se guarda igual por el POST de siempre: el disquete no se queda
 *                         sin guardar por el orden de los despliegues.
 *      4. AL ABRIR        y al cambiar de local, al reconectar y al acabar una simulación: se piden las abiertas del
 *                         local y se juntan con las del equipo. Manda lo que aquí espera en la cola; si no, la API.
 *      5. EN VIVO         lo que suben otros equipos del local llega por el socket y entra en Mesas, con quién la
 *                         creó y quién hizo el último cambio (people), para el title de cada fila.
 *
 *  SIMULANDO (paused) no se sube lo que se toca, ni entra lo de otros: se trabaja sobre una copia de mentira. Lo que se
 *  cierra con el disquete sí va a la API de verdad, como siempre.
 *
 *  Recibe: { establishmentId   el _id del local
 *            getRecords        () => las rotaciones de ahora
 *            apply             (cambio) => deja puestas las rotaciones cambio(rotaciones) (el commit del registro)
 *            paused }          hay una simulación en marcha
 *  Devuelve: { status, people, pendingIds, notify, close, setOnClosed }
 *      status       { state: 'idle' | 'syncing' | 'offline' | 'unavailable', pending: cuántas esperan, message }
 *      people       Map id de la rotación → { createdBy, updatedBy, changedAt } (authorshipOf)
 *      pendingIds   Set de las rotaciones con algo en la cola
 *      notify(records)      después de cada cambio
 *      close(record)        el disquete: true si entró en la cola
 *      setOnClosed(fn)      qué hacer con cada rotación que la API acaba de guardar: (la rotación)
 */


// SYNC_DELAY_MS = «cuánto se espera para subir después de un cambio»: lo escrito en ese rato sube junto
const SYNC_DELAY_MS = 1000;

// RETRY_MS = «cada cuánto se reintenta lo que no subió»
const RETRY_MS = 15000;

// retryLater = «lo que no subió por algo que se arregla solo»: sin red (0), sesión vencida (401), la API todavía sin
// estas rutas (404), demasiadas peticiones (429) o el servidor con problemas (5xx). Lo demás (400) no se reintenta.
const retryLater = (status) => status === 0 || status === 401 || status === 404 || status === 429 || status >= 500;


function useRotationSync({ establishmentId, getRecords, apply, paused }) {

    const [status, setStatus] = useState({ state: 'idle', pending: 0, message: '' });
    const [people, setPeople] = useState(() => new Map());
    const [pendingIds, setPendingIds] = useState(() => new Set());

    // knownRef = «la firma de lo último subido o llegado de cada rotación» (Map id → firma)
    const knownRef = useRef(new Map());

    // outboxRef = «la cola», la misma que se guarda en el equipo
    const outboxRef = useRef({});

    // flushingRef = «se está subiendo la cola»; timerRef / retryRef = «la próxima subida» y «el próximo reintento»
    const flushingRef = useRef(false);
    const timerRef = useRef(null);
    const retryRef = useRef(null);

    // onClosedRef = «qué hacer con una rotación que la API acaba de guardar» (setOnClosed)
    const onClosedRef = useRef(null);

    //  Lo de quien nos monta, siempre al día. En refs: las funciones de abajo son SIEMPRE las mismas.
    const localRef = useRef(establishmentId);
    const pausedRef = useRef(paused);
    const getRecordsRef = useRef(getRecords);
    const applyRef = useRef(apply);
    localRef.current = establishmentId;
    pausedRef.current = paused;
    getRecordsRef.current = getRecords;
    applyRef.current = apply;

    // flushRef = «subir la cola ya», para que se pueda llamar desde las funciones que van antes que ella
    const flushRef = useRef(() => {});


    // saveOutbox = «dejar puesta la cola»: en la ref, en el equipo y en lo que se pinta
    const saveOutbox = useCallback((next) => {
        outboxRef.current = next;
        writeOutbox(localRef.current, next);
        const ids = Object.keys(next);
        setPendingIds(new Set(ids));
        setStatus(current => ({ ...current, pending: ids.length }));
    }, []);

    // remember / forget = «apuntar (o quitar) quién creó una rotación y quién hizo su último cambio»
    const remember = useCallback((rotation) => {
        if (!rotation?.clientId) return;
        setPeople(current => new Map(current).set(String(rotation.clientId), authorshipOf(rotation)));
    }, []);
    const forget = useCallback((recordId) => {
        setPeople(current => {
            if (!current.has(recordId)) return current;
            const next = new Map(current);
            next.delete(recordId);
            return next;
        });
    }, []);

    // adopt = «poner en Mesas una rotación de la API» (de otro equipo, o la más nueva que tenía la API)
    // Se apunta su firma ANTES de ponerla: así el registro no la vuelve a subir.
    const adopt = useCallback((rotation) => {
        if (pausedRef.current) return;
        const record = fromServerRotation(rotation);
        knownRef.current.set(record.id, syncSignature(record));
        applyRef.current(records => placeRemote(records, record));
    }, []);

    // drop = «quitar de Mesas una rotación»: se guardó en otro equipo, o se quitó allí
    const drop = useCallback((recordId) => {
        if (pausedRef.current) return;
        knownRef.current.delete(recordId);
        applyRef.current(records => clearRemote(records, recordId));
    }, []);

    // schedule = «subir dentro de un momento»: el primer cambio pone la hora, los siguientes van en esa misma subida
    const schedule = useCallback((delay = SYNC_DELAY_MS) => {
        if (timerRef.current) return;
        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            flushRef.current();
        }, delay);
    }, []);


    // flush = «subir la cola», de una en una y en orden. Si algo no sube por algo que se arregla solo, se para y se
    // reintenta luego (retryLater); si la API no lo acepta, se quita de la cola y se dice.
    const flush = useCallback(async () => {
        clearTimeout(timerRef.current);
        timerRef.current = null;

        const localId = localRef.current;
        if (flushingRef.current || !localId) return;
        if (Object.keys(outboxRef.current).length === 0) {
            setStatus(current => ({ ...current, state: 'idle' }));
            return;
        }

        flushingRef.current = true;
        setStatus(current => ({ ...current, state: 'syncing' }));

        // waiting = «lo que paró la subida», para decirlo y reintentar
        let waiting = null;
        try {
            for (const recordId of Object.keys(outboxRef.current)) {
                if (localRef.current !== localId) break;

                const entry = outboxRef.current[recordId];
                if (!entry) continue;

                try {
                    if (entry.kind === 'remove') {
                        await removeOpenRotation(recordId, localId);
                        forget(recordId);
                    }
                    else {
                        const { outcome, rotation } = await syncRotation(entry.body);
                        remember(rotation);
                        //  La API tenía una más nueva (de otro equipo): esa es la que vale
                        if (outcome === 'stale' && rotation?.status === 'open') adopt(rotation);
                        if (rotation?.status === 'closed') onClosedRef.current?.(rotation);
                    }
                    saveOutbox(settle(outboxRef.current, recordId, entry.at));
                }
                catch (error) {

                    // failure = «por qué no subió»: el error de la subida o, si se probó el POST de siempre, el suyo
                    let failure = error;

                    //  La API todavía sin la subida en vivo (404): un cierre se guarda igual, por el POST de siempre
                    if (failure.status === 404 && isClosing(entry)) {
                        try {
                            const saved = await saveRotation(entry.body);
                            onClosedRef.current?.(saved);
                            saveOutbox(settle(outboxRef.current, recordId, entry.at));
                            continue;
                        }
                        catch (fallback) {
                            //  409: ya estaba guardada (un reintento)
                            if (fallback.status === 409) {
                                saveOutbox(settle(outboxRef.current, recordId, entry.at));
                                continue;
                            }
                            failure = fallback;
                        }
                    }

                    if (retryLater(failure.status)) {
                        waiting = failure;
                        //  Sin estas rutas (404) se sigue con las demás: puede haber cierres detrás. Sin red, no.
                        if (failure.status === 404) continue;
                        break;
                    }

                    saveOutbox(settle(outboxRef.current, recordId, entry.at));

                    //  409: ya está guardada, es de Registros. Una abierta que todavía estaba aquí sale de Mesas.
                    if (failure.status === 409) {
                        if (failure.rotation) remember(failure.rotation);
                        if (entry.kind === 'upsert' && !isClosing(entry)) drop(recordId);
                        continue;
                    }

                    //  La API no la acepta (400). Un cierre que no entra vuelve a Mesas, para corregirlo: no se pierde.
                    if (isClosing(entry)) {
                        knownRef.current.delete(recordId);
                        if (!pausedRef.current) applyRef.current(records => placeRemote(records, fromServerRotation(entry.body)));
                    }
                    const table = entry.body?.tableNumber ? `Mesa ${entry.body.tableNumber}: ` : '';
                    setStatus(current => ({ ...current, message: `${table}${failure.message}` }));
                }
            }
        }
        finally {
            flushingRef.current = false;
        }

        if (waiting) {
            setStatus(current => ({ ...current, state: waiting.status === 404 ? 'unavailable' : 'offline', message: waiting.message }));
            clearTimeout(retryRef.current);
            retryRef.current = setTimeout(() => flushRef.current(), RETRY_MS);
            return;
        }

        //  Lo que entró mientras se subía va en la siguiente vuelta
        if (Object.keys(outboxRef.current).length > 0) schedule();
        else setStatus(current => ({ ...current, state: 'idle' }));
    }, [saveOutbox, remember, forget, adopt, drop, schedule]);

    flushRef.current = flush;


    // notify = «algo cambió en Mesas»: lo que cambió de verdad entra en la cola y se sube dentro de un momento
    const notify = useCallback((records) => {
        if (pausedRef.current || !localRef.current) return;

        const { outbox, known } = planChanges(records, knownRef.current, outboxRef.current, localRef.current, Date.now());
        knownRef.current = known;
        if (outbox === outboxRef.current) return;

        saveOutbox(outbox);
        schedule();
    }, [saveOutbox, schedule]);


    // close = «el disquete»: la rotación entra en la cola CERRADA y se sube ya
    const close = useCallback((record) => {
        if (!localRef.current) return false;

        const now = Date.now();
        knownRef.current.delete(record.id);
        saveOutbox(queueUpsert(outboxRef.current, toSyncBody(record, localRef.current, 'closed', now), now));
        flushRef.current();
        return true;
    }, [saveOutbox]);


    // setOnClosed = «qué hacer con cada rotación que la API acaba de guardar» (lo pone la sesión: rememberSaved)
    const setOnClosed = useCallback((handler) => {
        onClosedRef.current = handler;
    }, []);


    // reconcile = «juntar las abiertas de la API con las del equipo». Manda lo que aquí espera en la cola; lo demás,
    // la API. Las del equipo que la API no tiene se suben solas después (notify): no se conocen.
    const reconcile = useCallback((rotations) => {
        const outbox = outboxRef.current;
        const before = getRecordsRef.current();
        let records = before;
        const authorship = new Map();

        for (const rotation of rotations) {
            authorship.set(String(rotation.clientId), authorshipOf(rotation));
            if (outbox[rotation.clientId]) continue;

            const record = fromServerRotation(rotation);
            knownRef.current.set(record.id, syncSignature(record));
            records = placeRemote(records, record);
        }

        setPeople(authorship);
        if (records !== before) applyRef.current(() => records);
    }, []);


    // receive = «lo que avisa el socket»: lo que sube o quita otro equipo del local (y el eco de lo nuestro)
    const receive = useCallback(({ action, clientId, rotation }) => {
        if (pausedRef.current) return;

        const recordId = String(clientId);
        const entry = outboxRef.current[recordId];

        if (action === 'remove') {
            forget(recordId);
            if (!entry) drop(recordId);
            return;
        }

        if (!rotation) return;
        remember(rotation);

        const local = getRecordsRef.current().find(record => record.id === recordId);
        const decision = remoteAction({ local, entry, rotation });

        if (decision === 'drop') {
            //  Se guardó en otro equipo: lo que aquí esperaba para subirse abierto ya no vale. Un cierre nuestro
            //  (el eco del disquete) se queda: lo quita la subida cuando la API conteste.
            if (entry && !isClosing(entry)) saveOutbox(settle(outboxRef.current, recordId, entry.at));
            drop(recordId);
        }
        else if (decision === 'adopt') {
            adopt(rotation);
        }
    }, [forget, drop, remember, adopt, saveOutbox]);


    //  AL ABRIR, AL CAMBIAR DE LOCAL Y AL ACABAR UNA SIMULACIÓN: la cola de este local, las abiertas de la API, y a
    //  escuchar. El registro ya leyó del equipo las rotaciones de este local (su efecto va antes que este).
    useEffect(() => {
        knownRef.current = new Map();
        outboxRef.current = readOutbox(establishmentId);
        const ids = Object.keys(outboxRef.current);
        setPendingIds(new Set(ids));
        setPeople(new Map());
        setStatus({ state: 'idle', pending: ids.length, message: '' });

        if (!establishmentId || paused) return undefined;

        // alive = «sigue siendo este local y no se simula»: una respuesta que llega tarde no toca nada
        let alive = true;

        // load = «pedir las abiertas, juntarlas, y subir lo que haga falta». Sin conexión se trabaja con lo del equipo.
        const load = () => getOpenRotations(establishmentId)
            .then(rotations => {
                if (alive) reconcile(rotations);
            })
            .catch(() => {})
            .finally(() => {
                if (!alive) return;
                notify(getRecordsRef.current());
                flushRef.current();
            });

        load();

        const offRemote = onRotationSync(establishmentId, receive);
        const offReconnect = onJarvisReconnect(load);
        const onOnline = () => flushRef.current();
        window.addEventListener('online', onOnline);

        return () => {
            alive = false;
            offRemote();
            offReconnect();
            window.removeEventListener('online', onOnline);
            clearTimeout(timerRef.current);
            timerRef.current = null;
            clearTimeout(retryRef.current);
        };
    }, [establishmentId, paused, reconcile, notify, receive]);


    return { status, people, pendingIds, notify, close, setOnClosed };
}



export { useRotationSync };
