import { useState, useEffect, useMemo } from 'react';
import { WrapperCell, WrapperText } from '../cells/GridCells.jsx';
import { getTimeReport } from '../../libs/date_time/calculate_time.js';




/*  LA PARRILLA
 *
 *  Va en el panel de abajo de la ventana flotante, debajo del espejo de la tablet.
 *  La IA lee la pantalla de arriba y escribe aquí: cada mesa que detecta aparece con
 *  su número y su demora ya puestos, y el resto se completa a mano.
 *
 *  Las filas de más, vacías, están para anotar las mesas que la tablet no ve.
 */




//  Las siete columnas, en su orden. La clave de React lleva también la posición
//  porque 'Demora' sale dos veces —la de primera atención y la de limpieza— y dos
//  hermanos con la misma clave es de las pocas cosas que React no perdona.
const COLUMNAS = ['Mesa', 'Ocupa', 'Primera atención', 'Demora', 'Desocupa', 'Limpieza', 'Demora'];

//  La primera 'Demora' lleva además el botón de reportar, así que se le da algo más de
//  ancho que a las otras. Tiene que ser el mismo en la cabecera y en cada fila, o las
//  columnas dejan de cuadrar.
const COLUMNA_DEMORA = 3;
const ANCHO_DEMORA = { flexGrow: 1.35 };

/*  LAS FILAS LIBRES, PARA ANOTAR LO QUE LA TABLET NO VE
 *
 *  Son un bloque FIJO que va siempre debajo de los tickets, con sus identidades
 *  escritas de una vez para siempre.
 *
 *  Antes se calculaban restando —30 menos los tickets— y eso tenía dos consecuencias
 *  malas y silenciosas: cada ticket nuevo hacía desaparecer la última fila libre, y
 *  con ella lo que hubiera escrito el monitorista; y al llegar a 30 tickets ya no
 *  quedaba ninguna, justo en hora punta, que es cuando más falta hacen.
 *
 *  Con identidad propia y número fijo, React no las desmonta nunca.
 */
const FILAS_LIBRES = Array.from(
    { length: 30 },
    (_, i) => ({ clave: `libre-${i}`, ticket: null })
);

//  El límite de primera atención por defecto, para cuando la ventana todavía no sabe
//  en qué local está. Cada local puede tener el suyo.
const LIMITE_POR_DEFECTO = '00:03:00';




export function Parrilla({ tickets = [], limiteAtencion = LIMITE_POR_DEFECTO, limiteLimpieza = LIMITE_POR_DEFECTO, leerAnotacion, anotar, onReportarDemora }) {


    /*  LAS FILAS
     *
     *  Primero una por cada mesa que la IA detectó; después vacías hasta completar la
     *  parrilla.
     *
     *  La clave lleva el número de mesa, no la posición: así React reconoce la fila
     *  entre lecturas y no pierde lo que se haya escrito en ella cuando entra una
     *  lectura nueva o cambia el orden.
     */
    const filas = useMemo(() => {

        /*  UNA FILA POR MESA, NO POR PEDIDO
         *
         *  Esta parrilla va de MESAS: cuándo se ocupó, cuándo se atendió, cuándo se
         *  limpió. La de Procesos es la que sigue cada pedido por separado.
         *
         *  Desde que la identidad de un ticket es su número, una mesa con tres pedidos
         *  llega tres veces en la lectura. Sin agrupar aparecería tres veces en la
         *  tabla, y además con la clave repetida — de las pocas cosas que React no
         *  perdona.
         *
         *  De los pedidos de una mesa se queda el que peor va: el rojo antes que
         *  cualquiera y, a igualdad, el de más tiempo. Es el que hay que mirar.
         */
        const porMesa = new Map();

        for (const ticket of tickets) {
            if (!ticket?.mesa) continue;

            const previo = porMesa.get(ticket.mesa);
            if (!previo || esMasUrgente(ticket, previo)) porMesa.set(ticket.mesa, ticket);
        }

        const conTicket = [...porMesa.values()]
            .map(ticket => ({ clave: `mesa-${ticket.mesa}`, ticket }));

        return [...conTicket, ...FILAS_LIBRES];
    }, [tickets]);




    return (
        //  'flex-1 min-h-0' + 'overflow-y-auto': la parrilla se desplaza hacia abajo
        //  dentro de su panel sin empujar al espejo de arriba. Sin 'min-h-0' un hijo de
        //  flex no baja de su alto natural y el desplazamiento no llega a aparecer.
        //
        //  HACIA LOS LADOS NO SE DESPLAZA: las columnas se reparten el ancho que haya
        //  (antes la fila exigía 640 px y en la ventana de 400 salía una barra).
        //  '@container' es lo que deja a las celdas medir la letra por este ancho.
        <div className='@container flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden bg-[#01122c]'>

            {/*  CABECERA FIJA
                 'z-10' no es decorativo: sin él las filas que pasan por debajo al
                 desplazarse se dibujan ENCIMA de la cabecera.  */}
            <div className='sticky top-0 z-10 h-[45px] bg-[#021a38] flex w-full items-center justify-around border-b border-[#0a3a66]'>
                {
                    COLUMNAS.map((texto, i) => (
                        <WrapperCell
                            key={`${texto}-${i}`}
                            classStyles='h-full uppercase tracking-[0.6px] font-semibold text-[#5e7ba0] bg-[#021a38]'
                            estilo={i === COLUMNA_DEMORA ? ANCHO_DEMORA : undefined}
                        >
                            {texto}
                        </WrapperCell>
                    ))
                }
            </div>

            {
                filas.map(({ clave, ticket }) => (
                    <LineaRotacion
                        key={clave}
                        clave={clave}
                        ticket={ticket}
                        limiteAtencion={limiteAtencion}
                        limiteLimpieza={limiteLimpieza}
                        leerAnotacion={leerAnotacion}
                        anotar={anotar}
                        onReportarDemora={onReportarDemora}
                    />
                ))
            }

        </div>
    );
}




function LineaRotacion({ clave, ticket, limiteAtencion, limiteLimpieza, leerAnotacion, anotar, onReportarDemora }) {


    /*  LA FILA YA NO GUARDA NADA
     *
     *  Todo lo que se escribe vive en el almacén de VentanaTablet, indexado por la
     *  clave de esta fila. Aquí solo se lee y se pide escribir.
     *
     *  Es lo que hace que las horas anotadas sobrevivan: cuando una mesa desaparece de
     *  la tablet y React desmonta la fila, lo escrito no se va con ella.
     */
    const anotado = leerAnotacion?.(clave) ?? {};

    const escribir = (campo) => (valor) => anotar?.(clave, campo, valor);

    //  La mesa la pone la IA, pero quien está mirando manda: si se corrigió a mano,
    //  esa corrección gana sobre lo que traiga la lectura siguiente.
    const mesa = anotado.mesa ?? ticket?.mesa ?? '';

    const horaOcupa = anotado.horaOcupa ?? '';
    const horaAtencion = anotado.horaAtencion ?? '';
    const horaDesocupa = anotado.horaDesocupa ?? '';
    const horaLimpieza = anotado.horaLimpieza ?? '';


    const demora = useMemo(
        () => getTimeReport(horaOcupa, horaAtencion, limiteAtencion),
        [horaOcupa, horaAtencion, limiteAtencion]
    );

    //  Con AND, tener SOLO una de las dos horas se contaba como 'sin tocar' y la celda
    //  pintaba el resultado ilegible en verde, como si todo fuera bien. Con OR, mientras
    //  falte cualquiera de las dos la celda se queda en gris: no hay nada que calcular.
    const sinTocar = horaOcupa === '' || horaAtencion === '';


    //  La demora de limpieza se calcula igual, pero contra SU propio límite: lo que
    //  pasa entre que la mesa queda libre y que alguien la deja lista. Hoy los dos
    //  límites coinciden, pero son protocolos distintos y no tienen por qué seguir
    //  haciéndolo.
    const demoraLimpieza = useMemo(
        () => getTimeReport(horaDesocupa, horaLimpieza, limiteLimpieza),
        [horaDesocupa, horaLimpieza, limiteLimpieza]
    );

    //  Igual aquí, y en limpieza es el estado NORMAL entre que la mesa se desocupa y
    //  alguien la limpia: durante ese rato solo hay una de las dos horas.
    const sinLimpieza = horaDesocupa === '' || horaLimpieza === '';


    /*  EL BOTÓN APARECE POR DOS CAMINOS
     *
     *  El calculado —lo que se anotó a mano supera el límite del local— y el que dice
     *  la propia tablet: si el ticket sale en rojo, la cocina ya lo está marcando como
     *  demorado.
     *
     *  Sin el segundo, una mesa en rojo en la pantalla NO ofrecía reportar mientras
     *  nadie hubiera rellenado Ocupa y Primera atención a mano, que es justo el trabajo
     *  que esta parrilla viene a ahorrar.
     */
    const hayDemora = demora.exceeded || !!ticket?.rojo;


    //  Aviso de la propia fila, no un alert() del sistema: en la aplicación de
    //  escritorio un alert es un diálogo nativo que CONGELA la ventana entera,
    //  incluido el espejo de la tablet que está justo encima.
    const [aviso, setAviso] = useState('');

    useEffect(() => {
        if (!aviso) return;
        const t = setTimeout(() => setAviso(''), 2500);
        return () => clearTimeout(t);
    }, [aviso]);


    const pedirReporte = () => {
        if (mesa === '') return setAviso('Indica el número de mesa');

        const entregado = onReportarDemora?.({
            tableNumber: mesa,
            customerSeatedTime: horaOcupa,
            firtAtenttionTime: horaAtencion,
            demora: demora.timeTotal,
        });

        //  El puente con la ventana principal puede no existir todavía. Si no llegó,
        //  hay que decirlo: un botón que no hace nada y tampoco avisa es peor que uno
        //  que no está, porque quien lo pulsa se queda creyendo que reportó.
        if (entregado === false) setAviso('Esta versión de la aplicación todavía no puede reportar');

        //  Quien recibe el reporte puede negarse y decir por qué, con un texto.
        if (typeof entregado === 'string') setAviso(entregado);
    };




    //  Una fila 'ausente' es una mesa que ya no está en la pantalla de la tablet pero
    //  conserva lo que se anotó. Se atenúa para distinguirla de las que siguen vivas,
    //  sin que parezca un error: el dato es bueno, solo que el pedido ya terminó.
    const ausente = !!ticket?.ausente;




    return (
        <div className={`flex w-full items-center justify-around transition-colors hover:bg-[#10203c] ${ausente ? 'bg-[#0b0f1c] opacity-60' : 'bg-[#0e1223]'}`}>

            <WrapperCell classStyles='font-semibold'>
                <input
                    className='w-full h-full text-center bg-transparent'
                    type='text'
                    value={mesa}
                    onChange={e => escribir('mesa')(e.target.value)}
                />
            </WrapperCell>

            <WrapperCell classStyles='text-[#aecbf0]'>
                <WrapperText value={horaOcupa} updateValue={escribir('horaOcupa')} />
            </WrapperCell>

            <WrapperCell classStyles='text-[#aecbf0]'>
                <WrapperText value={horaAtencion} updateValue={escribir('horaAtencion')} />
            </WrapperCell>

            {/*  DEMORA
                 Si la IA leyó el tiempo del ticket manda ese, porque es el que está
                 corriendo de verdad en la pantalla de cocina. Si no, se calcula a mano
                 restando la primera atención de la hora en que se ocupó la mesa.  */}
            {/*  Todo en línea, sin 'absolute': el botón medía unos 80 px flotando sobre
                 la celda y tapaba la hora incluso con la ventana ancha.  */}
            <WrapperCell classStyles='gap-1.5 px-1' estilo={ANCHO_DEMORA}>
                {
                    ausente ?
                        //  Ya no está en la tablet: se dice, en gris y sin alarma. Lo
                        //  anotado sigue siendo válido; lo que terminó es el pedido.
                        <span className='min-w-0 truncate text-[10px] italic text-[#5e7ba0]' title='Esta mesa ya no está en la pantalla de la tablet'>fuera de tablet</span>
                        :
                        ticket?.tiempo ?
                            <WrapperText
                                classStyles={ticket.rojo ? 'text-[#f08a6a] font-bold' : 'text-[#aecbf0]'}
                                value={ticket.tiempo}
                            />
                            :
                            <WrapperText
                                classStyles={sinTocar ? 'text-[#33486a]' : demora.exceeded ? 'text-[#ff4d4d] font-bold' : 'text-[#7fc79e]'}
                                value={sinTocar ? '00:00:00' : demora.timeTotal}
                            />
                }

                {/*  El botón solo aparece cuando hay demora: es el atajo para reportarla
                     sin salir de la ventana. Es un ícono —una bandera— para que quepa
                     junto a la hora aunque la ventana esté a 400 px; lo que hace lo
                     dice su 'title'.

                     Tamaño, relleno y borde van en 'style' y no en clases: la regla
                     global 'button {}' de index.css gana a las utilidades de Tailwind.  */}
                {
                    hayDemora && !ausente && (
                        <button
                            type='button'
                            className='shrink-0 flex items-center justify-center text-white bg-[#b3303f] hover:bg-[#c93a4a] transition-colors'
                            style={{ width: 22, height: 22, padding: 0, border: 'none', borderRadius: 6 }}
                            onClick={pedirReporte}
                            aria-label={`Reportar la demora de la mesa ${mesa || '?'}`}
                            title={`Reportar la demora de la mesa ${mesa || '?'}`}
                        >
                            <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor'
                                 strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                                <path d='M5 21V4' />
                                <path d='M5 4h12l-2.5 4.5L17 13H5' />
                            </svg>
                        </button>
                    )
                }

                {
                    aviso && (
                        <span
                            className='min-w-0 truncate rounded font-bold text-[#01122c] bg-[#e0b341]'
                            style={{ padding: '2px 6px', fontSize: '9px' }}
                            title={aviso}
                        >
                            {aviso}
                        </span>
                    )
                }
            </WrapperCell>

            {/*  DESOCUPA y LIMPIEZA se anotan a mano, igual que las dos primeras
                 horas: la tablet no muestra ninguna de las dos.  */}
            <WrapperCell classStyles='text-[#aecbf0]'>
                <WrapperText value={horaDesocupa} updateValue={escribir('horaDesocupa')} />
            </WrapperCell>

            <WrapperCell classStyles='text-[#aecbf0]'>
                <WrapperText value={horaLimpieza} updateValue={escribir('horaLimpieza')} />
            </WrapperCell>

            {/*  Y la segunda DEMORA sale de restar esas dos, igual que la primera sale
                 de restar atención menos ocupa. Es un valor calculado, así que no se
                 toca: por eso va sin 'updateValue'.  */}
            <WrapperCell>
                <WrapperText
                    classStyles={sinLimpieza ? 'text-[#33486a]' : demoraLimpieza.exceeded ? 'text-[#ff4d4d] font-bold' : 'text-[#7fc79e]'}
                    value={sinLimpieza ? '00:00:00' : demoraLimpieza.timeTotal}
                />
            </WrapperCell>

        </div>
    );
}




/*  ¿Cuál de dos pedidos de la misma mesa hay que enseñar en la parrilla de rotación?
 *
 *  Manda el color: un ticket en rojo es el que tiene el problema, y es el que el
 *  monitorista necesita ver aunque la mesa tenga otros dos tranquilos.
 *
 *  A igualdad de color, el que lleve más tiempo esperando.
 */
function esMasUrgente(candidato, actual) {
    if (candidato?.rojo !== actual?.rojo) return Boolean(candidato?.rojo);
    return aSegundos(candidato?.tiempo) > aSegundos(actual?.tiempo);
}


//  'mm:ss' o 'h:mm:ss' a segundos, solo para poder comparar. Lo que no se entienda
//  cuenta como cero: un tiempo ilegible no debe ganarle a uno que sí se leyó.
function aSegundos(tiempo) {
    if (!tiempo) return 0;

    const partes = String(tiempo).trim().split(':').map(Number);
    if (partes.some(Number.isNaN)) return 0;

    if (partes.length === 3) return partes[0] * 3600 + partes[1] * 60 + partes[2];
    if (partes.length === 2) return partes[0] * 60 + partes[1];
    return 0;
}
