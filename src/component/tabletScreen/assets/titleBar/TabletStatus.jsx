/*  EL NOMBRE DEL LOCAL Y, DEBAJO, EL ESTADO
 *
 *  En dos líneas. En una sola, con la ventana estrecha, el nombre empujaba los botones y la ✕ se salía.
 *
 *  'min-w-0' es imprescindible: sin él un hijo de flex no baja de su ancho natural, así que este
 *  texto empujaría los botones fuera de la ventana en lugar de recortarse con puntos suspensivos.
 */


/*  @param {string}  name        el nombre del local
 *  @param {string}  statusText  cómo está la tablet
 *  @param {boolean} simulating  lo conectado es una tablet de mentira
 *  @param {boolean} connecting  se está conectando ahora mismo
 *  @param {boolean} failed      el último intento de conexión falló
 *  @param {string}  aiText      el estado de la IA: con qué modelo se lee, o por qué no se está leyendo
 *  @param {boolean} aiFailed    el servidor de IA no está activo
 */
export default function TabletStatus({ name, statusText, simulating, connecting, failed, aiText, aiFailed }) {

    // statusColor = «el color del texto del estado»
    const statusColor = simulating ? 'text-[#5e45a8] font-semibold'
        : failed ? 'text-jx-critico-texto'
            : connecting ? 'text-jx-aviso-texto'
                : 'text-jx-tinta2';

    // aiColor = «el color del estado de la IA»
    const aiColor = aiFailed ? 'text-jx-aviso-texto' : 'text-jx-tinta2';

    return (
        <span className='min-w-0 flex-1 flex flex-col gap-[3px] leading-none'>

            <span className='min-w-0 text-[13px] font-semibold text-jx-tinta truncate' title={name}>
                {name || 'Tablet'}
            </span>

            {/*  El estado de la tablet y, a su lado, el de la IA. El de la IA es el que se recorta si
                 no cabe: entero va en su 'title', al pasar el ratón.  */}
            <span className='min-w-0 flex gap-1.5 text-[11px]'>
                <span className={`shrink-0 max-w-[70%] truncate ${statusColor}`}>
                    {statusText}
                </span>
                <span className={`min-w-0 truncate ${aiColor}`} title={aiText}>
                    · {aiText}
                </span>
            </span>

        </span>
    );
}
