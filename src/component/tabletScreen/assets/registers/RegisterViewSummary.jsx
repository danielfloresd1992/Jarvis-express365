import { viewSummary } from '../../../../libs/tickets/tableView.js';


/*  EL PIE DE MESAS (propuesta «A · Barra de herramientas»)
 *
 *  Una línea debajo de la tabla que dice lo que se está viendo: cuántas filas, en qué orden y, si se ordena por
 *  número, que las libres van al final. Así una búsqueda o un filtro olvidados se notan sin buscarlos. Los textos
 *  salen de viewSummary (libs/tickets/tableView.js).
 *
 *  @param {object}  view       { query, show, sort } (useTableView)
 *  @param {number}  shown      cuántas filas en uso se enseñan
 *  @param {number}  inUse      cuántas hay en uso
 *  @param {boolean} filtering  se está buscando o mostrando solo una parte: el embudo de la izquierda
 */
export default function RegisterViewSummary({ view, shown, inUse, filtering }) {

    const parts = viewSummary(view, { shown, inUse });

    return (
        <p className='register-view-summary' role='status'>
            {
                filtering && (
                    <svg width='12' height='12' viewBox='0 0 24 24' fill='currentColor' stroke='currentColor' strokeWidth='2' strokeLinejoin='round' aria-hidden='true'>
                        <path d='M3 5h18l-7 8v6l-4 2v-8z' />
                    </svg>
                )
            }
            {
                parts.map((part, index) => (
                    <span key={part} className={index === 0 ? 'register-view-summary__count' : undefined}>
                        {index > 0 && <span className='register-view-summary__dot' aria-hidden='true'>·</span>}
                        {part}
                    </span>
                ))
            }
        </p>
    );
}
