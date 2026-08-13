// ══════════════════════════════════════════════════════════════════════
// ¿ESTAMOS DENTRO DE LA APLICACIÓN DE ESCRITORIO?
// ══════════════════════════════════════════════════════════════════════
// Reportes Express está pensado para las estaciones de monitoreo, dentro de su
// aplicación de escritorio. Abrirlo en un navegador cualquiera no está previsto:
// faltan permisos del sistema, la ventana no se comporta igual y quedan sesiones
// sueltas en máquinas que no son las de monitoreo.
//
//
// HASTA DÓNDE LLEGA ESTA COMPROBACIÓN — LÉASE ANTES DE CONFIAR EN ELLA
//
// Esto NO es una medida de seguridad. Todo lo que se puede mirar desde la
// página —el agente de usuario, las variables de `window`— lo controla el
// cliente, y cambiar el agente de usuario en Chrome son tres clics en las
// herramientas de desarrollo. Quien quiera entrar desde un navegador, entra.
//
// Lo que esto sí hace es evitar el uso ACCIDENTAL: que alguien abra la
// dirección en su Chrome y crea que está trabajando donde debe.
//
// Si hiciera falta impedirlo de verdad, la decisión no puede vivir acá: tendría
// que tomarla el servidor, y no a partir de una cabecera que el cliente escribe
// —esas también se falsifican— sino de algo que solo la aplicación de escritorio
// pueda presentar. Por ejemplo, un secreto que el `preload` de Electron inyecte
// y que la API exija al abrir sesión.
//
//
// CÓMO SE RECONOCE
//
// 1. `window.jarvisDesktop` — la señal BUENA. No existe todavía: la pondría el
//    `preload` de la aplicación de escritorio con `contextBridge`. Se comprueba
//    primero para que el día que exista mande sobre lo demás, sin tocar esto.
//
// 2. El agente de usuario dice "Electron". Es lo que hay hoy, porque el
//    envoltorio de escritorio no vive en este repositorio y no expone nada.
//
// 3. `window.process.type === 'renderer'` — solo aparece con integración de
//    Node activada. Muchos montajes la desactivan por seguridad, así que sirve
//    de respaldo, no de comprobación principal.

/** La señal que dejaría el preload de la aplicación de escritorio. */
const señalDelPreload = () => {
    try {
        return window.jarvisDesktop === true || Boolean(window.jarvisDesktop?.esEscritorio);
    } catch { return false; }
};

const agenteDiceElectron = () => {
    try {
        return /electron/i.test(navigator.userAgent || '');
    } catch { return false; }
};

const tieneProcesoDeRenderizado = () => {
    try {
        return window.process?.type === 'renderer';
    } catch { return false; }
};


/**
 * Permiso explícito para trabajar en un navegador.
 *
 * Sin esto no se podría DESARROLLAR: `npm run dev` abre Chrome, y la pantalla
 * de bloqueo dejaría el proyecto inutilizable para quien lo programa.
 *
 *   · en desarrollo, siempre
 *   · con `?escritorio=no` en la dirección, que además lo recuerda
 *
 * El permiso se guarda para no tener que arrastrar el parámetro por toda la
 * navegación. Se quita con `?escritorio=si`.
 */
const CLAVE_PERMISO = 'jarvis:permitir-navegador';

const permisoExplicito = () => {
    try {
        const params = new URLSearchParams(window.location.search);

        if (params.get('escritorio') === 'no') {
            localStorage.setItem(CLAVE_PERMISO, '1');
            return true;
        }
        if (params.get('escritorio') === 'si') {
            localStorage.removeItem(CLAVE_PERMISO);
            return false;
        }

        return localStorage.getItem(CLAVE_PERMISO) === '1';
    }
    catch { return false; }
};


/** ¿La aplicación puede ejecutarse acá? */
export const puedeEjecutarse = () => {
    // Durante el desarrollo nunca se bloquea: el servidor de Vite se abre en un
    // navegador y esa es la forma normal de trabajar.
    if (import.meta.env?.DEV) return true;

    if (señalDelPreload()) return true;
    if (agenteDiceElectron()) return true;
    if (tieneProcesoDeRenderizado()) return true;

    return permisoExplicito();
};


/** Nombre del navegador, solo para poder decírselo a quien ve el aviso. */
export const nombreDelNavegador = () => {
    try {
        const ua = navigator.userAgent || '';
        // El orden importa: Brave y Edge también dicen "Chrome" en su agente,
        // así que los específicos van antes.
        if (/edg\//i.test(ua)) return 'Microsoft Edge';
        if (navigator.brave) return 'Brave';
        if (/opr\//i.test(ua)) return 'Opera';
        if (/firefox\//i.test(ua)) return 'Firefox';
        if (/chrome\//i.test(ua)) return 'Google Chrome';
        if (/safari\//i.test(ua)) return 'Safari';
        return 'este navegador';
    }
    catch { return 'este navegador'; }
};
