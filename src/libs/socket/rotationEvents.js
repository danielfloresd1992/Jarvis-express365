import { socketAppManager } from '../../store/slices/socketio.js';


/*  LOS AVISOS DE LAS ROTACIONES DE MESAS, POR EL SOCKET DE JARVIS (jarvis_api)
 *
 *  Aquí se escribe UNA vez qué evento manda la API y con qué forma (como noveltyEvents.js). No hay contrato
 *  compartido con la API: si allí cambia (rotation.socket.js, emitRotationSync), se cambia aquí.
 *
 *      'rotation-sync:<_id del local>'   cada vez que un equipo sube una rotación de Mesas o quita una abierta:
 *                                        { action: 'upsert', clientId, rotation }   la rotación entera, como el GET,
 *                                                                                   con createdBy y updatedBy poblados
 *                                        { action: 'remove', clientId }             se quitó de Mesas sin guardar
 *
 *  El equipo que la subió también recibe su propio aviso.
 */


// rotationSyncEvent = «el evento de las rotaciones de Mesas de un local». El mismo nombre que arma la API.
export const rotationSyncEvent = (establishmentId) => `rotation-sync:${establishmentId}`;


// onRotationSync = «escuchar las rotaciones de Mesas de un local»: llama a 'listener' con el aviso entero
// ({ action, clientId, rotation? }). Un aviso sin clientId no es de nadie. Devuelve la que deja de escuchar.
export function onRotationSync(establishmentId, listener) {
    const event = rotationSyncEvent(establishmentId);
    const handler = (data) => {
        if (data?.clientId) listener(data);
    };

    socketAppManager.on(event, handler);
    return () => socketAppManager.off(event, handler);
}
