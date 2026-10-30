import { SHOW_OPTIONS, SORT_OPTIONS } from '../../../../libs/tickets/tableView.js';


/*  LA BARRA DE HERRAMIENTAS DE MESAS (pedido del usuario; propuesta «A · Barra de herramientas», elegida en el lienzo
 *  https://claude.ai/artifact/BvC9TtMFwyu3i3qD9Z6hBo)
 *
 *  Entre la barra del register y la tabla, solo en la pestaña Mesas. Tres mandos, siempre a la vista:
 *
 *      [🔍 Buscar mesa…  ✕]   (Todas 9) (En curso 8) (Terminadas 1) (● Con demora 3)        Ordenar [Llegada│1 → 9│9 → 1]
 *
 *  Buscar manda sobre mostrar: mientras se busca, las cápsulas se apagan (se ven todas las mesas que coinciden), y
 *  pulsar una borra la búsqueda. Escape en el buscador también lo borra.
 *
 *  Solo pinta y avisa: lo elegido lo guarda useTableView, y las reglas están en libs/tickets/tableView.js. El aspecto,
 *  en las clases 'register-toolbar…' de registers.css: la regla global 'button {}' de index.css gana a Tailwind.
 */


// SHOW_TITLES = «lo que se lee al pasar el ratón por cada cápsula»
const SHOW_TITLES = {
    all: 'Mostrar todas las filas, también las libres',
    open: 'Mostrar solo las mesas en curso: todavía sin limpiar',
    finished: 'Mostrar solo las mesas terminadas: ya se limpiaron',
    late: 'Mostrar solo las mesas con demora: lo que está en rojo, esperando de más o ya reportado',
};


/*  @param {object}   view          { query, show, sort } (useTableView)
 *  @param {object}   counts        cuántas rotaciones en uso hay de cada clase: { all, open, finished, late }
 *  @param {function} onQuery       recibe lo escrito en el buscador
 *  @param {function} onClearQuery  borrar la búsqueda
 *  @param {function} onShow        recibe qué mostrar: 'all' | 'open' | 'finished' | 'late'
 *  @param {function} onSort        recibe el orden: 'arrival' | 'asc' | 'desc'
 */
export default function RegisterToolbar({ view, counts, onQuery, onClearQuery, onShow, onSort }) {

    // searching = «se está buscando una mesa»: entonces lo que se muestra no cuenta
    const searching = view.query !== '';

    return (
        <div className='register-toolbar'>

            {/*  BUSCAR UNA MESA POR SU NÚMERO  */}
            <div role='search' className={`register-search ${searching ? 'register-search--active' : ''}`}>
                <svg className='register-search__icon' width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' aria-hidden='true'>
                    <circle cx='11' cy='11' r='7' />
                    <path d='M20 20l-3.5-3.5' />
                </svg>
                <input
                    type='text'
                    inputMode='numeric'
                    enterKeyHint='search'
                    className='register-search__input'
                    placeholder='Buscar mesa…'
                    aria-label='Buscar una mesa por su número'
                    title='Escribe el número de la mesa: salen todas las que llevan esas cifras. Escape borra la búsqueda.'
                    value={view.query}
                    onChange={event => onQuery(event.target.value)}
                    onKeyDown={event => {
                        if (event.key === 'Escape' && searching) {
                            event.preventDefault();
                            onClearQuery();
                        }
                    }}
                />
                {
                    searching && (
                        <button type='button' className='register-search__clear' onClick={onClearQuery} aria-label='Borrar la búsqueda' title='Borrar la búsqueda'>
                            <svg width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round' aria-hidden='true'>
                                <path d='M6 6l12 12' />
                                <path d='M18 6L6 18' />
                            </svg>
                        </button>
                    )
                }
            </div>

            {/*  QUÉ MOSTRAR, con cuántas hay de cada una  */}
            <div role='group' aria-label='Mostrar' className={`register-chips ${searching ? 'register-chips--muted' : ''}`}>
                {
                    SHOW_OPTIONS.map(option => (
                        <button
                            key={option.id}
                            type='button'
                            className='register-chip'
                            aria-pressed={!searching && view.show === option.id}
                            title={searching ? `${SHOW_TITLES[option.id]}. Borra la búsqueda.` : SHOW_TITLES[option.id]}
                            onClick={() => onShow(option.id)}
                        >
                            {option.dot && <span className='register-chip__dot' aria-hidden='true' />}
                            {option.label}
                            <span className='register-chip__count'>{counts[option.id]}</span>
                        </button>
                    ))
                }
            </div>

            {/*  CÓMO ORDENAR, a la derecha  */}
            <div role='group' aria-label='Ordenar las filas' className='register-sort'>
                <span className='register-sort__label' aria-hidden='true'>Ordenar</span>
                <span className='register-sort__options'>
                    {
                        SORT_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                type='button'
                                className='register-sort__option'
                                aria-pressed={view.sort === option.id}
                                aria-label={option.title}
                                title={option.title}
                                onClick={() => onSort(option.id)}
                            >
                                {option.label}
                            </button>
                        ))
                    }
                </span>
            </div>

        </div>
    );
}
