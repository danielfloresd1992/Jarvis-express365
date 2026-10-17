import { isConfiguredLimit } from '../date_time/timeLimit.js';


/*  ─────────────────────────────────────────────────────────────────────────────
 *  LOS LÍMITES DE TIEMPO DE CADA LOCAL
 *
 *  Cuánto puede tardar una mesa en recibir su primera atención, y cuánto puede
 *  tardar en quedar limpia. Pasado ese tiempo, la demora se reporta.
 *
 *  QUIÉN USA ESTO
 *
 *  Solo la parrilla de la ventana de la tablet.
 *
 *  Los formularios de primera atención y de limpieza siguen resolviendo su límite por
 *  su cuenta, con la regla escrita dentro de cada uno. Los valores coinciden con los
 *  de aquí en escritorio, que es donde corre la parrilla, así que la parrilla y los
 *  formularios miden lo mismo.
 *
 *  PROPUESTA PENDIENTE DE APROBACIÓN
 *
 *  Unificar también los formularios para que usen esta función. No se ha hecho: son
 *  parte del flujo de reportes que ya está en producción, y cambiarlo altera lo que
 *  se envía en móvil y tablet, donde esos formularios no ejecutan la rama que fija el
 *  límite. Requiere el visto bueno del supervisor.
 *
 *  ⚠  ESTO ES UNA LISTA DE NOMBRES ESCRITA A MANO, y eso es frágil: basta que alguien
 *     renombre un local en el servidor para que pase a medirse con el límite genérico
 *     sin que nadie se entere. Lo correcto es que el límite venga en la configuración
 *     del local, junto al resto de sus datos.
 *
 *     La parrilla ya lo hace así: limitesDelLocal (al final) toma los tiempos que el
 *     local tiene configurados, y esta lista queda para los que no los tienen.
 *  ───────────────────────────────────────────────────────────────────────────── */




//  Los locales con protocolo estricto. Comparten los dos límites.
const LOCALES_ESTRICTOS = [
    'Mister Aventura',
    'Mister Brickell P.',
    'Mister Coconut',
    'Mister Wynwood',
    'Mister PineCrest',
];


const LIMITE_ESTRICTO = '00:02:00';
const LIMITE_GENERAL = '00:03:30';




//  Se compara sin distinguir mayúsculas ni espacios sobrantes: el nombre llega de
//  sitios distintos —el catálogo del servidor, lo guardado en el navegador— y una
//  diferencia tonta no debería cambiar el protocolo de un local.
function esEstricto(nombreLocal) {
    const nombre = String(nombreLocal ?? '').trim().toLowerCase();
    if (!nombre) return false;

    return LOCALES_ESTRICTOS.some(estricto => estricto.toLowerCase() === nombre);
}




/**
 * Límite de primera atención del local, en 'HH:MM:SS'.
 *
 * @param {string} nombreLocal  el nombre tal como lo da el servidor
 * @returns {string}
 */
export function limiteDeAtencion(nombreLocal) {
    return esEstricto(nombreLocal) ? LIMITE_ESTRICTO : LIMITE_GENERAL;
}


/**
 * Límite de limpieza del local, en 'HH:MM:SS'.
 *
 * Hoy es el mismo que el de primera atención —así estaba en los dos formularios—,
 * pero se expone aparte a propósito: son dos protocolos distintos y nada garantiza
 * que vayan a seguir coincidiendo.
 *
 * @param {string} nombreLocal
 * @returns {string}
 */
export function limiteDeLimpieza(nombreLocal) {
    return esEstricto(nombreLocal) ? LIMITE_ESTRICTO : LIMITE_GENERAL;
}




/**
 * Los dos límites del local, tomados de SU CONFIGURACIÓN cuando la tiene.
 *
 * Es lo que pedía el aviso de arriba: los tiempos vienen de 'timeServices' del local (api_jarvis365), que se
 * configuran en el formulario del establecimiento de Client365 —«Primera atención» es `firstAtenttion`, con
 * esa errata, y «Limpieza de mesa» es `TableCleaning`—. Uno que no está configurado (no viene, o viene en
 * '00:00:00', que es lo que la API guarda por defecto) cae en la lista de nombres de siempre.
 *
 * Lo usa la sesión de la tablet (useTabletSession): el register, Registros y el Excel miden con esto.
 *
 * @param {string} nombreLocal  el nombre del local, para la lista de siempre
 * @param {object} tiempos      su 'timeServices': { firstAtenttion, TableCleaning }, o null si no se tiene
 * @returns {{ atencion: string, limpieza: string, origen: { atencion: string, limpieza: string } }} los dos, en
 *          'HH:MM:SS', y de dónde salió cada uno: 'local' (lo configurado) o 'lista' (la lista de nombres). Así se
 *          puede decir en pantalla por qué una demora cuenta con un tiempo y no con otro.
 */
export function limitesDelLocal(nombreLocal, tiempos) {
    const atencionDelLocal = isConfiguredLimit(tiempos?.firstAtenttion);
    const limpiezaDelLocal = isConfiguredLimit(tiempos?.TableCleaning);

    return {
        atencion: atencionDelLocal ? tiempos.firstAtenttion : limiteDeAtencion(nombreLocal),
        limpieza: limpiezaDelLocal ? tiempos.TableCleaning : limiteDeLimpieza(nombreLocal),
        origen: { atencion: atencionDelLocal ? 'local' : 'lista', limpieza: limpiezaDelLocal ? 'local' : 'lista' },
    };
}
