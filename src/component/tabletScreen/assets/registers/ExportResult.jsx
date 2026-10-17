import { useEffect, useState } from 'react';


/*  DÓNDE QUEDÓ EL EXCEL: el aviso que cuelga del botón «Exportar» al terminar
 *
 *      ✓ Guardado en el NAS                                            ✕
 *        \\72.68.60.254\g.d.o\OCTUBRE\EXCEL\17\FRANCISCA DORAL\DIURNO\Atencion al cliente - … .xlsx
 *        [Copiar ruta]
 *
 *  Lo que dice sale de deliverWorkbook (libs/export/deliverWorkbook.js):
 *
 *      nas         guardado solo en su carpeta                 verde
 *      chosen      guardado donde se eligió en «Guardar como»  verde, y por qué no fue solo (si hubo un porqué)
 *      cancelled   se cerró «Guardar como» sin guardar         ámbar, con el porqué; sin porqué no se dice nada
 *      downloaded  descargado (sin aplicación de escritorio)   no se dice nada: es lo de siempre
 *
 *  La ruta se puede seleccionar y copiar. El aviso verde se va solo a los VISIBLE_MS; el ámbar se queda
 *  hasta cerrarlo, porque dice algo que hay que leer. Su aspecto, en 'register-export-result…' de registers.css.
 */


// VISIBLE_MS = «cuánto se queda el aviso verde»
const VISIBLE_MS = 20000;


/*  @param {object}   result   lo que devolvió deliverWorkbook: { kind, path, reason }
 *  @param {function} onClose  quitar el aviso
 */
export default function ExportResult({ result, onClose }) {

    // copied = «la ruta ya se copió»: el botón lo dice un momento
    const [copied, setCopied] = useState(false);

    // saved = «se guardó en algún sitio»
    const saved = result?.kind === 'nas' || result?.kind === 'chosen';

    useEffect(() => {
        if (!saved) return undefined;
        const timer = setTimeout(onClose, VISIBLE_MS);
        return () => clearTimeout(timer);
    }, [saved, onClose]);

    if (!result || result.kind === 'downloaded' || (result.kind === 'cancelled' && !result.reason)) return null;

    const copyPath = () => {
        navigator.clipboard?.writeText(result.path)
            .then(() => setCopied(true))
            .catch(() => setCopied(false));
    };

    return (
        <div className={`register-export-result ${saved ? 'register-export-result--saved' : 'register-export-result--warning'}`} role='status'>
            <div className='register-export-result__head'>
                <span className='register-export-result__title'>
                    {result.kind === 'nas' ? '✓ Guardado en el NAS' : result.kind === 'chosen' ? '✓ Guardado' : 'No se guardó el Excel'}
                </span>
                <button type='button' className='register-export-result__close' onClick={onClose} aria-label='Cerrar el aviso'>✕</button>
            </div>

            {saved && <p className='register-export-result__path'>{result.path}</p>}

            {result.reason && <p className='register-export-result__reason'>{saved ? `No se guardó solo: ${result.reason}` : result.reason}</p>}

            {
                saved && (
                    <button type='button' className='register-export-result__copy' onClick={copyPath}>
                        {copied ? 'Ruta copiada' : 'Copiar ruta'}
                    </button>
                )
            }
        </div>
    );
}
