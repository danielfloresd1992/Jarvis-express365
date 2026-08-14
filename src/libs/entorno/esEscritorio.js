// ══════════════════════════════════════════════════════════════════════
// ¿PUEDE EJECUTARSE ACÁ?
// ══════════════════════════════════════════════════════════════════════
// La regla depende del equipo:
//
//   · COMPUTADORA — solo dentro de la aplicación de escritorio. Es lo previsto
//     para las estaciones de monitoreo: en un navegador cualquiera faltan
//     permisos del sistema, la ventana no se comporta igual y quedan sesiones
//     sueltas en máquinas que no son las de monitoreo.
//
//   · TELÉFONO O TABLETA — cualquier navegador, sin restricción. Ahí no hay
//     aplicación de escritorio que abrir, así que exigirla dejaría al teléfono
//     sin ninguna forma de entrar.
//
// Por eso el móvil se comprueba PRIMERO. Al revés no funcionaría: un teléfono
// nunca va a decir "Electron" y caería en la pantalla de bloqueo.
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
// CÓMO SE RECONOCE EL ESCRITORIO
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
//
//
// CÓMO SE RECONOCE EL MÓVIL
//
// 1. `navigator.userAgentData.mobile` — el dato declarado por el navegador, sin
//    adivinar. Solo existe en los basados en Chromium; donde está, manda.
//
// 2. El agente de usuario trae una marca de móvil. Cubre Firefox y Safari, que
//    no tienen lo anterior.
//
// 3. El iPad moderno, que MIENTE: desde iPadOS 13 su agente de usuario es
//    idéntico al de una Mac de escritorio. Se lo distingue porque una Mac de
//    verdad no tiene pantalla táctil, así que `maxTouchPoints` es 0.
//
// A propósito NO se usa `pointer: coarse` ni la presencia de eventos táctiles:
// una computadora con pantalla táctil los cumple, y quedaría exenta de la regla
// que justamente se le quiere aplicar.

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
 * ¿Es un teléfono o una tableta?
 *
 * Se exporta porque no solo decide si la aplicación arranca: también sirve para
 * cualquier otra cosa que tenga que comportarse distinto en un móvil.
 */
export const esMovil = () => {
    try {
        // Lo que el navegador declara, cuando lo declara.
        if (navigator.userAgentData?.mobile === true) return true;

        const ua = navigator.userAgent || '';
        if (/android|iphone|ipod|ipad|windows phone|iemobile|blackberry|bb10|webos|opera mini|mobile safari|silk/i.test(ua)) {
            return true;
        }

        // El iPad que se hace pasar por Mac: mismo agente de usuario, pero con
        // pantalla táctil. Una Mac de escritorio informa maxTouchPoints en 0.
        if (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return true;

        return false;
    }
    catch { return false; }
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

    // El móvil va PRIMERO: no tiene aplicación de escritorio que abrir, así que
    // las comprobaciones de Electron no le aplican y lo dejarían afuera.
    if (esMovil()) return true;

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
