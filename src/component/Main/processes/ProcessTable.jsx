import { useState, useEffect, useMemo, useRef } from 'react';
import { WrapperCell, WrapperText } from '../../cells/GridCells.jsx';




/*  PARRILLA DE PROCESOS
 *
 *  Reemplaza la hoja de cálculo con la que se seguía cada pedido: cuándo entró, cuándo
 *  lo marcaron listo en la tablet, cuándo salió de cocina y cuándo se entregó.
 *
 *  Las tres primeras horas las estampa el seguimiento al ver que el ticket cambia de
 *  color en la pantalla de la tablet. La de entrega se anota a mano, porque esa la ve
 *  el monitorista por cámara y la tablet no la muestra.
 *
 *  Todo lo que llega automático se puede corregir encima: manda quien está mirando.
 */




//  Las columnas del formato original, en su orden exacto. 'field' dice de qué campo
//  de la fila sale cada una; sin 'field' es un encabezado sin dato propio.
const COLUMNS = [
    { label: 'Mesa',             field: 'table' },
    { label: 'N de tiket',       field: 'ticket' },
    { label: 'Tipo de plato',    field: 'dishType' },
    { label: 'Toma de orden',    field: 'orderTaken' },
    { label: 'Listo en tablet',  field: 'readyOnTablet' },
    { label: 'Listo en cocina',  field: 'readyInKitchen' },
    { label: 'Entrega de plato', field: 'dishDelivered' },
];


//  Las columnas que llevan una hora y se rellenan tocándolas.
const TIME_FIELDS = ['orderTaken', 'readyOnTablet', 'readyInKitchen', 'dishDelivered'];


//  La única columna que NO llena la IA: esa hora la ve el monitorista por cámara, no
//  la pantalla de la tablet. Se marca en la cabecera para que se sepa de un vistazo
//  cuál hay que poner a mano.
const MANUAL_FIELD = 'dishDelivered';


/*  FILAS LIBRES PARA ANOTAR A MANO
 *
 *  Son un bloque FIJO que va siempre debajo de los tickets, y sus identidades están
 *  escritas aquí de una vez para siempre.
 *
 *  Antes se calculaban restando —30 menos los tickets— y se identificaban por su
 *  posición. Eso tenía dos consecuencias malas y silenciosas: cada ticket nuevo hacía
 *  desaparecer la última fila libre, y con ella lo que hubiera escrito el monitorista;
 *  y al llegar a 30 tickets acumulados en el turno ya no quedaba ninguna, justo en
 *  hora punta, que es cuando más falta hacen.
 *
 *  Con identidad propia y número fijo, React no las desmonta nunca y lo escrito se
 *  queda donde está pase lo que pase con la lectura.
 */
const FREE_ROW_IDS = Array.from({ length: 12 }, (_, index) => `free-${index}`);


//  Los tipos que se sugieren al corregir esa columna a mano. Son los mismos por los
//  que agrupa el resumen del turno.
const SUGGESTED_TYPES = ['Entrada', 'Plato fuerte', 'Postre', 'Bebida', 'Take Out', 'Pick Up', 'Uber Eats', 'Online Ordering', 'Delivery'];


/*  COLOR DEL TICKET EN LA PANTALLA DE LA TABLET
 *
 *  Aquí solo vive cómo se PINTA cada color. Qué columna llena cada uno se decide en
 *  COLUMN_BY_COLOR, dentro de useTicketTracking: esta tabla dibuja lo que le llega ya
 *  resuelto.
 */
const TICKET_COLOR = {
    yellow: '#e0b341',
    red:    '#f08a6a',
    green:  '#7fc79e',
};




export function ProcessTable({ tickets = [] }) {


    /*  LAS FILAS
     *
     *  Primero una por cada ticket, después el bloque fijo de filas libres.
     *
     *  La clave es el ID del ticket, no su posición: cada ticket maneja el suyo propio,
     *  así que React reconoce la fila entre lecturas y no pierde lo que se haya escrito
     *  en ella cuando entra una lectura nueva.
     */
    const rows = useMemo(() => {

        const withTicket = tickets.map((ticket, index) => ({
            rowKey: `ticket-${ticket.id ?? index}`,
            ticket,
        }));

        const free = FREE_ROW_IDS.map(rowKey => ({ rowKey, ticket: null }));

        return [...withTicket, ...free];
    }, [tickets]);




    return (
        <div className='w-full flex-1 min-h-0 overflow-auto rounded-xl border border-[#0a3a66]/60 bg-[#01122c]'>

            <div className='sticky top-0 z-10 h-[45px] bg-[#021a38] flex w-full items-center justify-around'>
                {
                    COLUMNS.map(({ label, field }) => (
                        <WrapperCell
                            key={field}
                            classStyles={`h-full uppercase tracking-[0.6px] font-semibold bg-[#021a38] ${field === MANUAL_FIELD ? 'text-[#e0b341]' : 'text-[#5e7ba0]'}`}
                        >
                            <span title={field === MANUAL_FIELD ? 'Esta hora se anota a mano: la tablet no la muestra' : 'La rellena la lectura de la tablet'}>
                                {label}
                            </span>
                        </WrapperCell>
                    ))
                }
            </div>

            {
                rows.map(({ rowKey, ticket }) => (
                    <ProcessRow key={rowKey} ticket={ticket} />
                ))
            }

            {/*  Una sola lista de sugerencias para toda la tabla: repetirla en cada fila
                 metería treinta copias iguales en el documento.  */}
            <datalist id='dish-types'>
                {SUGGESTED_TYPES.map(type => <option key={type} value={type} />)}
            </datalist>

        </div>
    );
}




//  Los campos que maneja una fila. Se guardan juntos en un solo estado y no en siete
//  sueltos: así fundir una lectura de la IA con lo que ya hay es una sola operación.
const EMPTY_VALUES = {
    table: '',
    ticket: '',
    dishType: '',
    orderTaken: '',
    readyOnTablet: '',
    readyInKitchen: '',
    dishDelivered: '',
};




function ProcessRow({ ticket }) {


    const [values, setValues] = useState(() => ({ ...EMPTY_VALUES, ...(ticket ?? {}) }));

    //  Qué campos ha tocado la persona. Una vez tocado, la IA no vuelve a escribir
    //  ahí: manda quien está mirando la pantalla.
    const editedRef = useRef(new Set());


    /*  LA IA RELLENA, EL MONITORISTA MANDA
     *
     *  Aquí estaba el fallo más molesto de la parrilla, y era sutil: se comparaba lo
     *  que traía la lectura contra lo que HABÍA EN LA CELDA. Suena razonable hasta
     *  que se piensa al revés — la única situación en la que la celda difiere de lo
     *  que dijo la IA es justamente cuando alguien acaba de corregirla. O sea que la
     *  condición dejaba pasar la escritura precisamente en el caso que debía frenar:
     *  corregías la mesa 12 por la 13 y a los quince segundos volvía el 12, una y
     *  otra vez.
     *
     *  Ahora se lleva la cuenta de qué campos se han tocado a mano, y esos quedan
     *  fuera del alcance de la IA hasta que la fila se recicle.
     *
     *  Cuando no cambia nada se devuelve el MISMO objeto: React entonces no vuelve a
     *  dibujar. Si se devolviera uno nuevo, la fila se redibujaría en cada lectura
     *  aunque no hubiera novedad.
     */
    useEffect(() => {
        if (!ticket) return;

        setValues(current => {
            let changed = false;
            const merged = { ...current };

            for (const field of Object.keys(EMPTY_VALUES)) {
                if (editedRef.current.has(field)) continue;   //  lo puso una persona: no se toca

                const incoming = ticket[field];
                if (incoming === undefined || incoming === null || incoming === '') continue;
                if (String(incoming) === String(current[field])) continue;

                merged[field] = String(incoming);
                changed = true;
            }

            return changed ? merged : current;
        });
    }, [ticket]);


    //  Si la fila pasa a representar otro ticket, las marcas de "esto lo escribió una
    //  persona" ya no valen: eran de un pedido que no es este.
    useEffect(() => {
        editedRef.current = new Set();
    }, [ticket?.id]);


    const setField = (field) => (value) => {
        editedRef.current.add(field);
        setValues(current => ({ ...current, [field]: value }));
    };


    //  Franja de color a la izquierda con el estado que la IA vio en la pantalla.
    //  Mientras no haya lectura, la fila se ve como cualquier otra.
    const stripe = TICKET_COLOR[ticket?.color];

    //  Un ticket cerrado ya no está en la pantalla de la tablet: se entregó. Su fila se
    //  queda con las horas puestas pero se apaga, para que a simple vista se distinga
    //  lo que sigue en marcha de lo que ya pasó.
    const closed = !!ticket?.closed;




    return (
        <div
            className={`flex w-full items-center justify-around transition-colors hover:bg-[#10203c] ${closed ? 'bg-[#0b0f1c] opacity-55' : 'bg-[#0e1223]'}`}
            style={stripe ? { boxShadow: `inset 3px 0 0 ${stripe}` } : undefined}
        >
            {
                COLUMNS.map(({ field }) => (
                    <WrapperCell key={field} classStyles={CELL_STYLES[field] ?? 'text-[#aecbf0]'}>
                        {
                            TIME_FIELDS.includes(field)
                                ? <WrapperText value={values[field]} updateValue={setField(field)} />
                                : <TextCell field={field} values={values} ticket={ticket} onChange={setField(field)} />
                        }
                    </WrapperCell>
                ))
            }
        </div>
    );
}




//  Lo que distingue visualmente a cada columna. Fuera del render para no rehacer el
//  objeto en cada fila y en cada lectura.
const CELL_STYLES = {
    table: 'font-semibold',
    ticket: 'text-[#aecbf0] font-mono tabular-nums',
};




/*  Las tres columnas que no son horas: mesa, número de ticket y tipo de plato.
 *
 *  La de tipo lleva sugerencias y enseña, al pasar el ratón, el nombre del plato que
 *  leyó la IA — que no cabe en la columna pero es lo que explica por qué salió ese
 *  tipo y no otro.
 */
function TextCell({ field, values, ticket, onChange }) {

    const isDishType = field === 'dishType';

    const title = isDishType
        ? (ticket?.dish ? `Plato leído: ${ticket.dish}` : 'La IA no leyó el nombre del plato')
        : undefined;

    return (
        <input
            className='w-full h-full text-center bg-transparent'
            type='text'
            value={values[field]}
            list={isDishType ? 'dish-types' : undefined}
            title={title}
            placeholder={isDishType ? (ticket?.dish ?? '') : ''}
            onChange={event => onChange(event.target.value)}
        />
    );
}
