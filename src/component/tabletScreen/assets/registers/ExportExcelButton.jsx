import { useCallback, useEffect, useRef, useState } from 'react';
import { Chevron } from './RegisterSavedToggle.jsx';
import ExportShiftMenu from './ExportShiftMenu.jsx';
import ExportResult from './ExportResult.jsx';


/*  EXPORTAR A EXCEL: el botón de la pestaña «Registros»
 *
 *  El logo de Excel —la hoja verde con su «X» blanca, dibujada aquí en SVG para no depender de una
 *  imagen— y la palabra «Exportar». Su aspecto va en las clases 'register-export…' de registers.css.
 *
 *  Pulsarlo no exporta todavía: abre el menú del turno (ExportShiftMenu) —todas, diurno o nocturno— y es
 *  la opción elegida la que exporta. El menú se cierra con Escape (y el cursor vuelve al botón) o con un
 *  clic fuera.
 *
 *  'onExport' devuelve una promesa (exportCustomerServiceWorkbook, en libs/export): mientras no termina,
 *  el botón se apaga y dice «Exportando…» —la primera vez tarda un poco más, porque carga ExcelJS—, y
 *  si falla se avisa con el motivo. Sin 'onExport' sale apagado.
 *
 *  Al terminar, debajo del botón se dice dónde quedó el archivo (ExportResult): con la aplicación de
 *  escritorio va a su carpeta del NAS, y la ruta se puede copiar.
 */


/*  @param {Array}    rotations  las rotaciones guardadas del día: el menú cuenta cuántas hay de cada turno
 *  @param {function} onExport   exportar un turno: ('all' | 'day' | 'night') => Promise (opcional; sin él, apagado)
 *  @param {boolean}  disabled     apagarlo aunque tenga 'onExport' (por ejemplo, si no hay nada que exportar)
 *  @param {string}   folderShift  el turno de la barra: el menú dice que «Todas» va a su carpeta del NAS
 */
export default function ExportExcelButton({ rotations = [], onExport, disabled = false, folderShift }) {

    // busy = «está exportando»: el botón se apaga para no lanzar dos descargas
    const [busy, setBusy] = useState(false);

    // menuOpen = «el menú del turno está abierto»
    const [menuOpen, setMenuOpen] = useState(false);

    // result = «dónde quedó el último Excel» (deliverWorkbook), para el aviso; null = sin aviso
    const [result, setResult] = useState(null);
    const closeResult = useCallback(() => setResult(null), []);

    // off = «el botón no hace nada ahora mismo»
    const off = disabled || busy || !onExport;

    // wrapperRef / buttonRef = «el botón con su menú» (para saber si se pinchó fuera) y «el botón» (el cursor vuelve a él)
    const wrapperRef = useRef(null);
    const buttonRef = useRef(null);

    //  Abierto, el menú se cierra con Escape o con un clic fuera. Se escucha 'click', como en las listas de
    //  Registros; el clic que lo abre cae en el botón, que está dentro, y no lo cierra.
    useEffect(() => {
        if (!menuOpen) return undefined;

        const closeOnEscape = (event) => {
            if (event.key !== 'Escape') return;
            setMenuOpen(false);
            buttonRef.current?.focus();
        };
        const closeOnClickOutside = (event) => {
            if (!wrapperRef.current?.contains(event.target)) setMenuOpen(false);
        };

        document.addEventListener('keydown', closeOnEscape);
        document.addEventListener('click', closeOnClickOutside);
        return () => {
            document.removeEventListener('keydown', closeOnEscape);
            document.removeEventListener('click', closeOnClickOutside);
        };
    }, [menuOpen]);

    // exportShift = «exportar el turno elegido en el menú»
    const exportShift = async (shift) => {
        setMenuOpen(false);
        setResult(null);
        setBusy(true);
        try {
            const exported = await onExport(shift);
            setResult(exported?.delivered ?? null);
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
        <div ref={wrapperRef} className='register-export'>
            <button
                ref={buttonRef}
                type='button'
                className='register-export-button'
                onClick={() => { setResult(null); setMenuOpen(current => !current); }}
                disabled={off}
                aria-busy={busy}
                aria-haspopup='menu'
                aria-expanded={menuOpen}
                aria-label='Exportar a Excel'
                title={onExport ? 'Exportar a Excel: el día entero o un solo turno, con su resumen' : 'Exportar a Excel: todavía no está conectado'}
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
                {!busy && <Chevron open={menuOpen} />}
            </button>

            {menuOpen && <ExportShiftMenu rotations={rotations} onPick={exportShift} folderShift={folderShift} />}
            {!menuOpen && <ExportResult result={result} onClose={closeResult} />}
        </div>
    );
}
