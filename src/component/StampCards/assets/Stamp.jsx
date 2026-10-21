/*  UNA CASILLA DE LA TARJETA
 *
 *      aprobada   el sello en tinta verde, un poco torcido, con la hora y la mesa
 *      a lápiz    la misma hora y mesa en un círculo a trazos ámbar, latiendo: espera validación
 *      vacía      un círculo punteado
 *
 *  Un sello recién aprobado ('fresh') cae con golpe (stamp-slam). Su aspecto, en 'stamp…' de style.css.
 */


// tableLabel = «la mesa, corta»: 'M15' si es un número (con o sin letra), y si no, tal cual
const tableLabel = (table) => (/^\d+[a-z]?$/i.test(String(table)) ? `M${table}` : String(table));


/*  @param {object|null} slot   { id, state: 'approved' | 'pending', time, table }, o null si está vacía
 *  @param {boolean}     fresh  acaba de aprobarse
 */
export default function Stamp({ slot, fresh = false }) {

    if (!slot) return <span className='stamp stamp--empty' aria-hidden='true' />;

    // pending = «a lápiz»
    const pending = slot.state === 'pending';

    // label = «lo que dice la casilla», para el lector de pantalla y al pasar el ratón
    const label = `${slot.time}${slot.table ? ` · mesa ${slot.table}` : ''} · ${pending ? 'esperando validación' : 'aprobada'}`;

    return (
        <span
            className={`stamp ${pending ? 'stamp--pending' : 'stamp--approved'} ${fresh ? 'stamp--fresh' : ''}`}
            role='img'
            aria-label={label}
            title={label}
        >
            <span className='stamp__time' aria-hidden='true'>{slot.time}</span>
            {slot.table && <span className='stamp__table' aria-hidden='true'>{tableLabel(slot.table)}</span>}
        </span>
    );
}
