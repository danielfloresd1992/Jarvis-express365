/*  EL GERENTE POR DEFECTO DE LOS TOQUES ESCRITOS A MANO (pedido del usuario)
 *
 *  En la fila manual de la lista de toques de Mesas (RegisterTouchManual) el gerente se elige en un desplegable. Para
 *  no elegirlo una y otra vez, se puede fijar uno por defecto: la fila de cada mesa empieza con él. Se guarda en el
 *  equipo, uno por local (los gerentes de un local no son los de otro), con el id de su botón (managers.js): el _id
 *  del gerente, o 'gerente-0', 'asistente-1'… cuando el local solo tiene las cantidades.
 *
 *  Ninguna lanza: con el almacenamiento bloqueado no hay gerente por defecto y todo sigue como antes.
 */


// KEY_PREFIX = «la llave en el equipo»: 'register:defaultManager:<_id del local>'
const KEY_PREFIX = 'register:defaultManager';

// keyOf = «la llave de un local». Sin local no hay llave.
const keyOf = (localId) => (localId ? `${KEY_PREFIX}:${localId}` : '');


// readDefaultManager = «el id del gerente por defecto de un local», o '' si no hay ninguno
export function readDefaultManager(localId) {
    const key = keyOf(localId);
    if (!key) return '';
    try {
        return localStorage.getItem(key) ?? '';
    }
    catch {
        return '';
    }
}


// writeDefaultManager = «fijar (o quitar, con '') el gerente por defecto de un local». Devuelve false si no se guardó.
export function writeDefaultManager(localId, managerId) {
    const key = keyOf(localId);
    if (!key) return false;
    try {
        if (managerId) localStorage.setItem(key, managerId);
        else localStorage.removeItem(key);
        return true;
    }
    catch {
        return false;
    }
}


// pickManager = «el gerente con que empieza la fila manual»: el por defecto si sigue entre los botones del local; si
// no, el primero. Recibe los botones (managers.js) y el id por defecto ('' si no hay).
export const pickManager = (managers, defaultId) => managers.find(button => button.id === defaultId) ?? managers[0] ?? null;
