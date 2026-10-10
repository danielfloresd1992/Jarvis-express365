/*  EL DIVISOR
 *
 *  La franja que se arrastra para repartir el alto entre el espejo y los registers.
 *
 *  'no-drag' porque dentro de una zona arrastrable de Electron el ratón mueve la ventana en lugar de
 *  accionar lo que hay debajo. Aquí no cae dentro de la barra de título, pero queda a salvo si
 *  alguien la mueve.
 */


/*  @param {function} onMouseDown  empezar a arrastrar
 */
export default function Splitter({ onMouseDown }) {
    return (
        <div
            onMouseDown={onMouseDown}
            className='group h-[7px] w-full shrink-0 flex items-center justify-center cursor-row-resize bg-jx-panel border-y border-jx-regla2'
            style={{ WebkitAppRegion: 'no-drag' }}
            title='Arrastra para repartir el espacio entre la tablet y la parrilla'
        >
            <span className='h-[3px] w-12 rounded-full bg-jx-borde-campo group-hover:bg-jx-verde-barra transition-colors' />
        </div>
    );
}
