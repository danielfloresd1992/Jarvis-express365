/*  UNA LISTA DE NOVEDADES SIN SELLO, en el panel
 *
 *      Rechazadas · 1 · no ocupan sello ni quitan ninguno
 *      11:02  Demora de preparación · mesa 20 · Francisca Doral   «La captura no enseña la tablet.»
 *
 *  Dos clases ('kind'): las rechazadas, con el motivo de quien validó, y las que no tienen tarjeta, con por qué no dan
 *  bono. Su aspecto, en 'stamp-list…' de style.css.
 */


/*  @param {string} title  el título, con la cuenta
 *  @param {string} hint   lo que va detrás del título, más claro (opcional)
 *  @param {Array}  items  renglones de buildStampCards (rejected u others)
 *  @param {string} kind   'rejected' | 'other'
 *  @param {Set}    freshIds  las que acaban de llegar a esta lista: su renglón entra resaltado
 */
export default function NoveltyList({ title, hint, items, kind, freshIds = new Set() }) {

    // why = «lo que se dice a la derecha de cada una»
    const why = (item) => {
        if (kind === 'rejected') return item.detail ? `«${item.detail}»` : 'Sin motivo escrito';
        return `${item.state === 'pending' ? 'Esperando validación' : 'Aprobada'} · ${item.reason}`;
    };

    return (
        <div className={`stamp-list stamp-list--${kind}`}>
            <h3 className='stamp-list__title'>
                {title}
                {hint && <span className='stamp-list__hint'> · {hint}</span>}
            </h3>
            <ul className='stamp-list__rows'>
                {items.map(item => (
                    <li key={item.id} className={`stamp-list__row ${freshIds.has(item.id) ? 'stamp-list__row--fresh' : ''}`}>
                        <b className='stamp-list__time'>{item.time}</b>
                        <span className='stamp-list__what'>
                            {item.title}
                            {item.table ? ` · mesa ${item.table}` : ''}
                            {item.establishmentName ? ` · ${item.establishmentName}` : ''}
                        </span>
                        <span className='stamp-list__why'>{why(item)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
