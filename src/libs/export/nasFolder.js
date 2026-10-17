/*  DÓNDE VA EL EXCEL EN EL NAS
 *
 *  Los Excel de atención al cliente se guardan en el NAS de la oficina, en una carpeta por mes, día, local y
 *  turno, que alguien crea por adelantado (el día de hoy ya tiene sus 45 locales con sus dos turnos, vacíos):
 *
 *      \\72.68.60.254\g.d.o \ OCTUBRE \ EXCEL \ 17 \ FRANCISCA DORAL \ DIURNO
 *                    raíz      mes      fijo   día      local          turno
 *
 *  resolveNasFolder baja por esos niveles uno a uno: lee las carpetas que hay en cada uno (listFolders, que
 *  pone la aplicación de escritorio: el navegador no puede leer una carpeta de red) y elige la que toca.
 *  Cada nivel se busca a su manera, porque cada uno se escribe distinto:
 *
 *      mes     el nombre del mes en castellano, sin mirar mayúsculas ni tildes ('SEPTIEMBRE' o 'SETIEMBRE')
 *      EXCEL   EXACTAMENTE 'EXCEL': al lado está 'EXCEL FINAL', y un parecido llevaría el archivo allí
 *      día     el número del día, con o sin cero delante ('07' o '7')
 *      local   el nombre del local (matchEstablishment), que en el NAS va en mayúsculas y a veces con
 *              erratas ('MISTER MANSFILD')
 *      turno   'DIURNO' o 'NOCTURNO'
 *
 *  El día es el DÍA OPERATIVO (libs/date_time/operationalDay.js), el mismo que enseña la pestaña Registros:
 *  la noche del 16 va en la carpeta 16 aunque se exporte de madrugada, el 17. Así está guardada en el NAS.
 *
 *  Nunca crea carpetas: si falta un nivel, o el local se parece igual a dos, se para y dice hasta dónde
 *  llegó (NasFolderError.reached). Crear una con el nombre mal escrito dejaría el Excel donde nadie lo busca.
 */


// NAS_ROOT = «la raíz del NAS». La aplicación de escritorio tiene la misma, y no deja leer ni escribir fuera de ella.
export const NAS_ROOT = '\\\\72.68.60.254\\g.d.o';

// MONTH_NAMES = «cómo se puede llamar la carpeta de cada mes», de enero a diciembre
const MONTH_NAMES = [['ENERO'], ['FEBRERO'], ['MARZO'], ['ABRIL'], ['MAYO'], ['JUNIO'], ['JULIO'], ['AGOSTO'], ['SEPTIEMBRE', 'SETIEMBRE'], ['OCTUBRE'], ['NOVIEMBRE'], ['DICIEMBRE']];

// EXCEL_FOLDER = «la carpeta de los Excel dentro del mes»
const EXCEL_FOLDER = 'EXCEL';

// SHIFT_FOLDERS = «la carpeta de cada turno»
export const SHIFT_FOLDERS = { day: 'DIURNO', night: 'NOCTURNO' };

// SIMILAR_ENOUGH / CLEAR_MARGIN = «cuánto se tiene que parecer un local para aceptarlo» y «cuánto más que el segundo»
// Con 0,8 entra una errata ('MISTER MANSFIELD' → 'MISTER MANSFILD', 0,94) y no un local vecino ('FRANCISCA DORAL' →
// 'FRANCISCA DAVIE', 0,73; 'FRANCISCA MIAMI' → 'FRANCISCA MIAMI LAKES', 0,71).
const SIMILAR_ENOUGH = 0.8;
const CLEAR_MARGIN = 0.1;


// NasFolderError = «no se encontró la carpeta»: el porqué ('message') y la última carpeta a la que se llegó ('reached'),
// para abrir ahí el «Guardar como». 'candidates' son los locales entre los que no se pudo elegir.
export class NasFolderError extends Error {
    constructor(message, reached, candidates = []) {
        super(message);
        this.name = 'NasFolderError';
        this.reached = reached;
        this.candidates = candidates;
    }
}


// normalizeName = «un nombre de carpeta, para comparar»: en mayúsculas, sin tildes, y con cualquier signo como un espacio
// 'Francisca  Doral-' → 'FRANCISCA DORAL'
export const normalizeName = (text) => String(text ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();

// joinPath = «una carpeta dentro de otra», con la barra de Windows
const joinPath = (parent, child) => `${parent.replace(/\\+$/, '')}\\${child}`;


// editDistance = «cuántas letras hay que cambiar, poner o quitar para pasar de un texto al otro» (Levenshtein)
function editDistance(first, second) {
    let previous = Array.from({ length: second.length + 1 }, (unused, index) => index);

    for (let row = 1; row <= first.length; row += 1) {
        const current = [row];
        for (let column = 1; column <= second.length; column += 1) {
            const change = first[row - 1] === second[column - 1] ? 0 : 1;
            current[column] = Math.min(previous[column] + 1, current[column - 1] + 1, previous[column - 1] + change);
        }
        previous = current;
    }

    return previous[second.length];
}

// similarity = «cuánto se parecen dos nombres ya normalizados», de 0 (nada) a 1 (iguales)
export const similarity = (first, second) => 1 - editDistance(first, second) / Math.max(first.length, second.length, 1);


/*  matchEstablishment = «la carpeta del local», entre las del día
 *
 *  Primero la que, normalizada, es IGUAL al nombre del local: es lo normal, y así un local nunca se confunde
 *  con otro que lo contiene ('FRANCISCA MIAMI' y 'FRANCISCA MIAMI LAKES'). Si no hay ninguna igual, la más
 *  parecida (similarity), siempre que se parezca lo bastante (SIMILAR_ENOUGH) y CLARAMENTE más que la segunda
 *  (CLEAR_MARGIN): entre dos igual de parecidas no se elige, se pregunta.
 *
 *  Devuelve { folder } con la elegida, { candidates } si hay dos que se parecen igual, o {} si ninguna se parece.
 */
export function matchEstablishment(folders, establishmentName) {
    const wanted = normalizeName(establishmentName);
    if (!wanted) return {};

    const exact = folders.filter(folder => normalizeName(folder) === wanted);
    if (exact.length === 1) return { folder: exact[0] };
    if (exact.length > 1) return { candidates: exact };

    const ranked = folders
        .map(folder => ({ folder, score: similarity(normalizeName(folder), wanted) }))
        .filter(item => item.score >= SIMILAR_ENOUGH)
        .sort((first, second) => second.score - first.score);

    if (ranked.length === 0) return {};
    if (ranked.length > 1 && ranked[0].score - ranked[1].score < CLEAR_MARGIN) return { candidates: ranked.map(item => item.folder) };
    return { folder: ranked[0].folder };
}


/*  resolveNasFolder = «la carpeta del NAS donde va este Excel»
 *
 *  @param {string}   day                el día operativo, 'AAAA-MM-DD'
 *  @param {string}   establishmentName  el local, como lo nombra la aplicación
 *  @param {string}   shift              'day' | 'night', o 'all': entonces se queda en la carpeta del local
 *  @param {function} listFolders        (ruta) => Promise<string[]>: las carpetas que hay dentro de esa ruta
 *  @param {string}   root               la raíz (NAS_ROOT; otra, para las pruebas)
 *  @returns {Promise<{ folder: string, complete: boolean }>} la carpeta, y si llegó hasta el turno
 *  @throws  {NasFolderError} si falta un nivel o el local no está claro, con la última carpeta a la que llegó
 */
export async function resolveNasFolder({ day, establishmentName, shift, listFolders, root = NAS_ROOT }) {
    const [year, month, date] = String(day ?? '').split('-').map(Number);
    if (!year || !month || !date) throw new NasFolderError('No se sabe de qué día es el Excel', root);

    // levels = «cada nivel: qué es, para decirlo si falta, y cómo se elige su carpeta entre las que hay»
    const levels = [
        { what: `el mes ${MONTH_NAMES[month - 1][0]}`, pick: (folders) => folders.find(folder => MONTH_NAMES[month - 1].includes(normalizeName(folder))) },
        { what: `la carpeta ${EXCEL_FOLDER}`, pick: (folders) => folders.find(folder => normalizeName(folder) === EXCEL_FOLDER) },
        { what: `el día ${String(date).padStart(2, '0')}`, pick: (folders) => folders.find(folder => /^\d+$/.test(folder.trim()) && Number(folder) === date) },
        { what: `el local ${establishmentName}`, pick: (folders, reached) => pickEstablishment(folders, establishmentName, reached) },
    ];
    if (SHIFT_FOLDERS[shift]) {
        levels.push({ what: `el turno ${SHIFT_FOLDERS[shift]}`, pick: (folders) => folders.find(folder => normalizeName(folder) === SHIFT_FOLDERS[shift]) });
    }

    let reached = root;
    for (const level of levels) {

        // folders = «las carpetas que hay en este nivel». Si no se puede leer (el NAS no contesta, sin permiso), se dice
        let folders;
        try {
            folders = await listFolders(reached);
        }
        catch (error) {
            throw new NasFolderError(`No se pudo abrir ${reached}: ${error?.message ?? error}`, reached === root ? null : reached);
        }

        const chosen = level.pick(folders, reached);
        if (!chosen) throw new NasFolderError(`No está ${level.what} en ${reached}`, reached);
        reached = joinPath(reached, chosen);
    }

    return { folder: reached, complete: Boolean(SHIFT_FOLDERS[shift]) };
}

// pickEstablishment = «la carpeta del local» (matchEstablishment), o el error de no poder elegir entre varias
function pickEstablishment(folders, establishmentName, reached) {
    const { folder, candidates } = matchEstablishment(folders, establishmentName);
    if (candidates) throw new NasFolderError(`El local ${establishmentName} se parece igual a ${candidates.join(' y a ')}, en ${reached}: no se elige uno al azar`, reached, candidates);
    return folder;
}
