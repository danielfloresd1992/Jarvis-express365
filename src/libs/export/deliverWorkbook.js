import { resolveNasFolder, NAS_ROOT } from './nasFolder.js';


/*  STEP 7 · DÓNDE ACABA EL EXCEL: EN SU CARPETA DEL NAS, O EN DESCARGAS
 *
 *  Con la aplicación de escritorio (window.electronAPI, que es la que sabe leer y escribir en el NAS:
 *  nas.js, junto a su main.js), el Excel NO se descarga: va a su carpeta (pedido del usuario).
 *
 *      Diurno o Nocturno   se busca su carpeta (resolveNasFolder, en nasFolder.js) y se guarda allí, solo.
 *                          Si ya hay un archivo con ese nombre, se guarda una copia numerada, «… (2).xlsx».
 *      Todas               también se guarda solo, en la carpeta del turno de la barra ('folderShift': el
 *                          de ShiftToggle, que sigue a la hora), pedido del usuario. Sin ese turno, se abre
 *                          «Guardar como» en la carpeta del local, para elegir.
 *      si algo falla       (falta una carpeta, el local se parece igual a dos, el NAS no contesta, sin
 *                          permiso…) se abre «Guardar como» en la carpeta más honda a la que se llegó, y
 *                          se dice por qué no se guardó solo.
 *
 *  En un navegador, o en una aplicación de escritorio sin actualizar, se descarga como siempre.
 *
 *  Devuelve qué pasó, para que el botón lo diga:
 *      { kind: 'nas',        path }           guardado solo en su carpeta
 *      { kind: 'chosen',     path, reason }   guardado donde se eligió; 'reason', por qué no fue solo
 *      { kind: 'cancelled',  reason }         se cerró «Guardar como» sin guardar
 *      { kind: 'downloaded' }                 descargado (sin aplicación de escritorio)
 *  Rechaza si no se pudo escribir ni eligiendo la carpeta.
 */


// XLSX_TYPE = «el tipo de archivo de un .xlsx», para la descarga
const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// ALL_SHIFTS_REASON = «por qué "Todas" no se guardó sola»: no se supo el turno de la barra
const ALL_SHIFTS_REASON = 'No se sabe el turno de la barra, y con los dos turnos no hay una carpeta de turno: elige dónde guardarlo';


/*  @param {Uint8Array} bytes     el archivo (finishWorkbook)
 *  @param {string}     fileName  su nombre (buildFileName)
 *  @param {object}     context   { day, establishmentName, shift, folderShift }: de qué día, local y turno es, y
 *                                con 'all', en la carpeta de qué turno va ('day' | 'night')
 *  @param {object}     desktop   la aplicación de escritorio (window.electronAPI); otra, para las pruebas
 */
export async function deliverWorkbook(bytes, fileName, { day, establishmentName, shift, folderShift }, desktop = globalThis.window?.electronAPI) {

    if (!desktop?.nasGuardar || !desktop?.nasCarpetas || !desktop?.nasGuardarComo) {
        downloadWorkbook(bytes, fileName);
        return { kind: 'downloaded' };
    }

    // listFolders = «las carpetas de una ruta del NAS», por la aplicación de escritorio
    const listFolders = async (path) => {
        const answer = await desktop.nasCarpetas(path);
        if (!answer?.ok) throw new Error(answer?.error ?? 'sin respuesta');
        return answer.carpetas;
    };

    // folderOf = «la carpeta de qué turno»: la del turno exportado; con «Todas», la del turno de la barra
    const folderOf = shift === 'all' ? folderShift : shift;

    //  1. La carpeta: la del turno, o hasta donde se llegó
    let folder = NAS_ROOT;
    let complete = false;
    let reason = '';
    try {
        ({ folder, complete } = await resolveNasFolder({ day, establishmentName, shift: folderOf, listFolders }));
        if (!complete) reason = ALL_SHIFTS_REASON;
    }
    catch (error) {
        folder = error?.reached ?? NAS_ROOT;
        reason = error?.message ?? String(error);
    }

    //  2. Con la carpeta del turno, se guarda solo
    if (complete) {
        const saved = await desktop.nasGuardar({ carpeta: folder, nombre: fileName, bytes });
        if (saved?.ok) return { kind: 'nas', path: saved.ruta };
        reason = saved?.error ?? 'No se pudo guardar en el NAS';
    }

    //  3. Si no, «Guardar como», abierto en esa carpeta
    const chosen = await desktop.nasGuardarComo({ carpeta: folder, nombre: fileName, bytes });
    if (chosen?.ok) return { kind: 'chosen', path: chosen.ruta, reason };
    if (chosen?.cancelado) return { kind: 'cancelled', reason };
    throw new Error(chosen?.error ?? reason ?? 'No se pudo guardar el Excel');
}


// downloadWorkbook = «los bytes → un archivo descargado»: con un enlace que se pulsa solo
function downloadWorkbook(bytes, fileName) {
    const url = URL.createObjectURL(new Blob([bytes], { type: XLSX_TYPE }));

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();

    //  Se suelta en la vuelta siguiente: soltarla en el acto puede cortar la descarga
    setTimeout(() => URL.revokeObjectURL(url), 0);
}
