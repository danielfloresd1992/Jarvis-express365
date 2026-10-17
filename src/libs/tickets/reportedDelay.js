/*  «ESTA DEMORA YA SE REPORTÓ»: de la alerta enviada a su rotación de Mesas
 *
 *  Al pulsar el reloj rojo de una fila de Mesas se abre su formulario de Demoras (primera atención o limpieza).
 *  Cuando la alerta se envía, la API crea una novedad y devuelve su ObjectId —en 'noveltie', ver abajo—, y ese id
 *  tiene que quedar en la rotación: en 'firstAttentionDelay' o 'cleaningDelay' (el modelo de la rotación, en
 *  api_jarvis365, los referencia a 'Noveltie' para traerlos con populate).
 *
 *  La rotación todavía está en Mesas, sin guardar: lo normal es reportar la demora mientras pasa. Así que el id
 *  se apunta en su fila (useRegisterStore) y viaja a la API con ella al pulsar el disquete.
 *
 *  EL FORMULARIO Y LA FILA NO SE CONOCEN, y pueden estar en ventanas distintas (la tablet en la ventana flotante
 *  y el formulario en la principal). El aviso va por dos caminos a la vez, y la sesión de la tablet escucha los
 *  dos (onReportedDelay):
 *
 *      · un evento de esta ventana ('register:demora-reportada'), para la tablet de la barra lateral
 *      · el almacenamiento del navegador (localStorage), cuyo evento 'storage' llega a las OTRAS ventanas del
 *        mismo origen: a la flotante
 *
 *  QUÉ DEVUELVE LA API AL CREAR LA NOVEDAD (POST /novelties, novelties.controller.ts): no la novedad, sino la
 *  PUBLICACIÓN que crea con ella (Publisher). Su '_id' es el de la publicación; el de la novedad va en 'noveltie'.
 */


// KEY = «dónde se deja el aviso en el almacenamiento del navegador», y EVENT = «el nombre del evento de esta ventana»
const KEY = 'register:demora-reportada';
const EVENT = 'register:demora-reportada';

// DELAY_FIELDS = «en qué propiedad de la rotación va cada demora», por su tipo (el 'tipo' del reporte del reloj)
export const DELAY_FIELDS = { 'primera atención': 'firstAttentionDelay', limpieza: 'cleaningDelay' };

// isObjectId = «es un ObjectId de Mongo»: 24 cifras hexadecimales
export const isObjectId = (value) => typeof value === 'string' && /^[0-9a-f]{24}$/i.test(value);

// noveltieIdOf = «el ObjectId de la novedad», de la respuesta de POST /novelties (la publicación: ver arriba), o null
export const noveltieIdOf = (publication) => {
    const id = publication?.noveltie;
    const text = typeof id === 'object' && id !== null ? String(id._id ?? id) : id;
    return isObjectId(text) ? text : null;
};


/*  announceReportedDelay = «avisar de que la demora de una fila de Mesas ya se reportó»
 *
 *  @param {string} recordId    el id de la fila de Mesas (el 'id' de la rotación, que el reloj manda en el reporte)
 *  @param {string} tipo        'primera atención' | 'limpieza'
 *  @param {string} noveltieId  el ObjectId de la novedad creada
 *  @returns {boolean} si se avisó: sin fila, sin tipo conocido o sin un id válido no hay nada que avisar
 */
export function announceReportedDelay({ recordId, tipo, noveltieId }) {
    if (!recordId || !DELAY_FIELDS[tipo] || !isObjectId(noveltieId)) return false;

    const detail = { recordId, tipo, noveltieId, at: Date.now() };
    try { localStorage.setItem(KEY, JSON.stringify(detail)); }
    catch { /* almacenamiento bloqueado: la ventana flotante no se enterará, la barra lateral sí (el evento) */ }

    window.dispatchEvent(new CustomEvent(EVENT, { detail }));
    return true;
}


/*  onReportedDelay = «escuchar los avisos»: llama a 'listener' con { recordId, field, noveltieId } por cada uno,
 *  ya con la propiedad de la rotación ('field') que le toca. Devuelve la función que deja de escuchar.
 */
export function onReportedDelay(listener) {
    const deliver = (detail) => {
        const field = DELAY_FIELDS[detail?.tipo];
        if (field && detail.recordId && isObjectId(detail.noveltieId)) listener({ recordId: detail.recordId, field, noveltieId: detail.noveltieId });
    };

    const onEvent = (event) => deliver(event.detail);
    const onStorage = (event) => {
        if (event.key !== KEY || !event.newValue) return;
        try { deliver(JSON.parse(event.newValue)); }
        catch { /* un aviso ilegible no es de nadie */ }
    };

    window.addEventListener(EVENT, onEvent);
    window.addEventListener('storage', onStorage);
    return () => {
        window.removeEventListener(EVENT, onEvent);
        window.removeEventListener('storage', onStorage);
    };
}
