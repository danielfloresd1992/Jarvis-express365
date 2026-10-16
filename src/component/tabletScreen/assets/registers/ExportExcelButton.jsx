import { useState } from 'react';


/*  EXPORTAR A EXCEL: el botón de la pestaña «Registros»
 *
 *  El logo de Excel —la hoja verde con su «X» blanca, dibujada aquí en SVG para no depender de una
 *  imagen— y la palabra «Exportar». Su aspecto va en la clase 'register-export-button' de registers.css.
 *
 *  'onExport' devuelve una promesa (exportCustomerServiceWorkbook, en libs/export): mientras no termina,
 *  el botón se apaga y dice «Exportando…» —la primera vez tarda un poco más, porque carga ExcelJS—, y
 *  si falla se avisa con el motivo. Sin 'onExport' sale apagado.
 */


/*  @param {function} onExport  exportar: () => Promise (opcional; sin él, el botón sale apagado)
 *  @param {boolean}  disabled  apagarlo aunque tenga 'onExport' (por ejemplo, si no hay nada que exportar)
 */
export default function ExportExcelButton({ onExport, disabled = false }) {

    // busy = «está exportando»: el botón se apaga para no lanzar dos descargas
    const [busy, setBusy] = useState(false);

    // off = «el botón no hace nada ahora mismo»
    const off = disabled || busy || !onExport;

    const handleClick = async () => {
        setBusy(true);
        try {
            await onExport();
        }
        catch (error) {
            console.log(error);
            window.alert(`No se pudo exportar a Excel: ${error?.message ?? error}`);
        }
        finally {
            setBusy(false);
        }
    };

    return (
        <button
            type='button'
            className='register-export-button'
            onClick={handleClick}
            disabled={off}
            aria-busy={busy}
            aria-label='Exportar a Excel'
            title={onExport ? 'Exportar a Excel: los datos del día y su resumen' : 'Exportar a Excel: todavía no está conectado'}
        >
            <svg width='18' height='18' viewBox='0 0 24 24' aria-hidden='true'>
                {/*  La hoja, detrás, con sus rayas de celdas  */}
                <rect x='7' y='3' width='15' height='18' rx='2' fill='#21a366' />
                <path d='M14.5 3v18M7 9h15M7 15h15' stroke='#ffffff' strokeOpacity='0.45' strokeWidth='1' />
                {/*  La tapa verde oscura con la «X»  */}
                <rect x='2' y='6' width='12' height='12' rx='2' fill='#107c41' />
                <path d='M5.4 9.2l5.2 5.6M10.6 9.2l-5.2 5.6' stroke='#ffffff' strokeWidth='1.9' strokeLinecap='round' />
            </svg>
            <span>{busy ? 'Exportando…' : 'Exportar'}</span>
        </button>
    );
}
