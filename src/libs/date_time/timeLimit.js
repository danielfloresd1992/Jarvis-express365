/*  ¿SE PASÓ DEL TIEMPO?
 *
 *  Compara una duración con el tiempo de referencia del local: la primera atención con 'firstAtenttion' y la
 *  limpieza con 'TableCleaning' (los dos de 'timeServices', en api_jarvis365; se configuran en el formulario del
 *  establecimiento de Client365). Pasado ese tiempo, la celda va en rojo y la demora se puede reportar.
 *
 *      exceedsLimit('00:05:21', '00:03:30')   →  true      se pasó
 *      exceedsLimit('00:03:30', '00:03:30')   →  false     justo en el límite todavía vale
 *      exceedsLimit('00:05:21', '00:00:00')   →  false     un límite en cero es «sin configurar», no «cero segundos»
 *      exceedsLimit('',         '00:03:30')   →  false     sin duración no hay nada que evaluar
 *
 *  Un límite en '00:00:00' NO es «no se puede tardar nada»: es lo que guarda la API cuando el local no tiene
 *  el tiempo configurado (TimeServicesModel, con '00:00:00' por defecto). Tomarlo al pie de la letra pondría
 *  en rojo cada mesa del local.
 */


// secondsOf = «una duración 'HH:MM:SS' en segundos», o null si no lo es
export function secondsOf(time) {
    const match = /^(\d{1,3}):([0-5]\d):([0-5]\d)$/.exec(String(time ?? '').trim());
    return match ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) : null;
}

// isConfiguredLimit = «es un tiempo de referencia de verdad»: se entiende y no está en cero
export const isConfiguredLimit = (limit) => (secondsOf(limit) ?? 0) > 0;


/*  exceedsLimit = «la duración pasó del tiempo de referencia»
 *
 *  @param {string} elapsed  el tiempo a evaluar: una duración 'HH:MM:SS' (de Ocupa a Primera atención, de
 *                           Desocupa a Limpieza…)
 *  @param {string} limit    el tiempo de referencia 'HH:MM:SS': firstAtenttion o TableCleaning
 *  @returns {boolean} true solo si las dos se entienden, el límite está configurado y la duración lo supera
 */
export function exceedsLimit(elapsed, limit) {
    const time = secondsOf(elapsed);
    if (time === null || !isConfiguredLimit(limit)) return false;
    return time > secondsOf(limit);
}
