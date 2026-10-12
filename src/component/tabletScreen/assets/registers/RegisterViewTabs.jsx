/*  LAS PESTAÑAS DEL REGISTER: «Mesas» y «Registros»
 *
 *  Cambian lo que enseña el register: la tabla de las rotaciones, o los registros, que todavía no
 *  tienen contenido. Su aspecto va en las clases 'register-tab…' de registers.css.
 */


// TABS = «las pestañas», en su orden
const TABS = [
    { id: 'mesas',     label: 'Mesas',     icon: <><rect x='3' y='4' width='18' height='16' rx='2' /><path d='M3 10h18' /><path d='M9 10v10' /></> },
    { id: 'registros', label: 'Registros', icon: <><path d='M3 12a9 9 0 1 0 3-6.7L3 8' /><path d='M3 3v5h5' /><path d='M12 7v5l3 2' /></> },
];


/*  @param {string}   view      la pestaña elegida: 'mesas' | 'registros'
 *  @param {function} onChange  recibe la pestaña pulsada
 */
export default function RegisterViewTabs({ view, onChange }) {
    return (
        <div className='register-tabs'>
            {
                TABS.map(tab => (
                    <button key={tab.id} type='button' className='register-tab' aria-pressed={view === tab.id} onClick={() => onChange(tab.id)}>
                        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                            {tab.icon}
                        </svg>
                        {tab.label}
                    </button>
                ))
            }
        </div>
    );
}
