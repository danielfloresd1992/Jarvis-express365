/*  COPIAR Y PEGAR EN LAS CELDAS DEL REGISTER
 *
 *  Desde el menú contextual (Copiar, Pegar) y desde la celda de hora elegida (Ctrl+C, Ctrl+V; GridCells.jsx).
 *
 *  Va al portapapeles del sistema (navigator.clipboard), para poder pegar una hora en otro sitio. Pero ese
 *  portapapeles solo existe en una página segura (https) y, para leerlo, el navegador puede pedir permiso o negarlo.
 *  Por eso se guarda además una copia aquí: si el sistema no deja leer, se pega lo último que se copió en el register.
 */


// lastCopied = «lo último que se copió desde el register», por si el portapapeles del sistema no se deja leer
let lastCopied = '';


// copyText = «copiar un texto»: al del sistema si se puede, y siempre a la copia de aquí. Devuelve lo copiado.
export async function copyText(text) {
    lastCopied = String(text ?? '');
    try {
        await navigator.clipboard?.writeText(lastCopied);
    } catch {
        //  Sin permiso, o una página sin https: queda la copia de aquí
    }
    return lastCopied;
}


// readText = «lo que hay para pegar»: lo del sistema si se deja leer; si no, lo último que se copió aquí
export async function readText() {
    try {
        const text = await navigator.clipboard?.readText();
        if (typeof text === 'string' && text !== '') return text;
    } catch {
        //  Permiso negado: vale la copia de aquí
    }
    return lastCopied;
}


/*  toTime = «un texto pegado, como hora 'HH:MM:SS'», o null si no es una hora
 *
 *      '13:58:04' → '13:58:04'    '9:05' → '09:05:00'    '135804' → '13:58:04'    '1358' → '13:58:00'
 *      'mesa 12', '25:00', '' → null
 */
export function toTime(text) {
    const clean = String(text ?? '').trim();
    const match = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/) ?? clean.match(/^(\d{2})(\d{2})(\d{2})?$/);
    if (!match) return null;

    const [hours, minutes, seconds = '00'] = match.slice(1).map(part => part ?? '00');
    if (Number(hours) > 23 || Number(minutes) > 59 || Number(seconds) > 59) return null;

    return [hours, minutes, seconds].map(part => part.padStart(2, '0')).join(':');
}
