import { socketAppManager } from '../../store/slices/socketio.js';


/*  LOS AVISOS DE LAS NOVEDADES, POR EL SOCKET DE JARVIS (jarvis_api)
 *
 *  Aquí se escribe UNA vez qué evento manda la API y con qué forma, para que quien escucha no lo repita. No hay
 *  contrato compartido con la API: si allí cambia, se cambia aquí.
 *
 *      'document_updated'   al validar o corregir una novedad (PUT /novelties/id=…, novelties.controller.ts), a TODOS
 *                           los clientes conectados: { doc: la novedad entera y populada, user: { idUser, nameUser } }.
 *                           'user' es quien hizo el PUT.
 *
 *  Y la reconexión: lo que la API avisó mientras no había conexión no llega nunca, así que al volver hay que pedirlo.
 *  Se escucha el 'reconnect' del Manager de socket.io, y no el 'connect' del socket, que sale también la primera vez.
 *
 *  Es el socket de store/slices/socketio.js, el de jarvis_api. No el de libs/socket/io.js, que es el de AVA.
 *
 *  Cada función devuelve la que deja de escuchar, para el 'return' de un useEffect (como onReportedDelay).
 */


// NOVELTY_UPDATED = «el evento de una novedad validada o corregida»
const NOVELTY_UPDATED = 'document_updated';


// onNoveltyUpdated = «escuchar las novedades que se validan o se corrigen»: llama a 'listener' con (la novedad entera,
// quién la cambió o null). Un aviso sin documento no es de nadie.
export function onNoveltyUpdated(listener) {
    const handler = (data) => {
        if (data?.doc?._id) listener(data.doc, data.user ?? null);
    };

    socketAppManager.on(NOVELTY_UPDATED, handler);
    return () => socketAppManager.off(NOVELTY_UPDATED, handler);
}


// onJarvisReconnect = «escuchar cuándo vuelve la conexión con jarvis_api», después de haberse caído
export function onJarvisReconnect(listener) {
    socketAppManager.io.on('reconnect', listener);
    return () => socketAppManager.io.off('reconnect', listener);
}
