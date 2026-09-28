import { useState, useEffect, useMemo } from 'react';
import { WrapperCell, WrapperText } from '../cells/GridCells.jsx';
import { getTimeReport } from '../../libs/date_time/calculate_time.js';




/*  LA PARRILLA DE ROTACIÓN
 *
 *  Va en el panel de abajo de la ventana flotante, debajo del espejo de la tablet.
 *  Sigue cada MESA: cuándo se ocupó, cuándo se atendió, cuándo se desocupó y cuándo
 *  se limpió.
 *
 *  SE LLENA ENTERA A MANO. Lo que la IA lee en la pantalla de cocina NO entra aquí:
 *  son pedidos, y van a la parrilla de Procesos. Antes cada mesa leída aparecía
 *  también en esta tabla, con el cronómetro de su ticket en la columna 'Demora' — pero
 *  esa columna es la demora de PRIMERA ATENCIÓN, que la tablet no ve, y el tiempo de
 *  cocina de un pedido no tiene nada que ver con ella.
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

/*  LAS FILAS, TODAS PARA ANOTAR A MANO
 *
 *  Son un bloque FIJO, con sus identidades escritas de una vez para siempre: con
 *  identidad propia y número fijo, React no las desmonta nunca y lo escrito en ellas
 *  no se pierde.
 *
 *  La clave sigue siendo 'libre-N' aunque ya no haya otras filas de las que
 *  distinguirlas: es la que usa el almacén de anotaciones de la ventana, y la parrilla
 *  de Procesos cuenta con que no coincida con las suyas ('libre-pedido-N').
 */
const FILAS = Array.from(
    { length: 30 },
    (_, i) => `libre-${i}`
);

//  El límite de primera atención por defecto, para cuando la ventana todavía no sabe
//  en qué local está. Cada local puede tener el suyo.
const LIMITE_POR_DEFECTO = '00:03:00';




export function Parrilla({ limiteAtencion = LIMITE_POR_DEFECTO, limiteLimpieza = LIMITE_POR_DEFECTO, leerAnotacion, anotar, onReportarDemora }) {


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
                FILAS.map(clave => (
                    <LineaRotacion
                        key={clave}
                        clave={clave}
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




function LineaRotacion({ clave, limiteAtencion, limiteLimpieza, leerAnotacion, anotar, onReportarDemora }) {


    /*  LA FILA NO GUARDA NADA
     *
     *  Todo lo que se escribe vive en el almacén de VentanaTablet, indexado por la
     *  clave de esta fila. Aquí solo se lee y se pide escribir.
     */
    const anotado = leerAnotacion?.(clave) ?? {};

    const escribir = (campo) => (valor) => anotar?.(clave, campo, valor);

    const mesa = anotado.mesa ?? '';

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


    //  El botón de reportar aparece cuando lo anotado a mano supera el límite del local.
    //  (Hubo un segundo camino, un ticket en rojo en la tablet. Se fue con los tickets:
    //  ese rojo es tiempo de cocina, y lo que se reporta aquí es la primera atención.)
    const hayDemora = demora.exceeded;


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




    return (
        <div className='flex w-full items-center justify-around transition-colors hover:bg-[#10203c] bg-[#0e1223]'>

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
                 Sale de restar la primera atención de la hora en que se ocupó la mesa.
                 Es un valor calculado, así que no se toca: por eso va sin 'updateValue'.  */}
            {/*  Todo en línea, sin 'absolute': el botón medía unos 80 px flotando sobre
                 la celda y tapaba la hora incluso con la ventana ancha.  */}
            <WrapperCell classStyles='gap-1.5 px-1' estilo={ANCHO_DEMORA}>
                <WrapperText
                    classStyles={sinTocar ? 'text-[#33486a]' : demora.exceeded ? 'text-[#ff4d4d] font-bold' : 'text-[#7fc79e]'}
                    value={sinTocar ? '00:00:00' : demora.timeTotal}
                />

                {/*  El botón solo aparece cuando hay demora: es el atajo para reportarla
                     sin salir de la ventana. Es un ícono —una bandera— para que quepa
                     junto a la hora aunque la ventana esté a 400 px; lo que hace lo
                     dice su 'title'.

                     Tamaño, relleno y borde van en 'style' y no en clases: la regla
                     global 'button {}' de index.css gana a las utilidades de Tailwind.  */}
                {
                    hayDemora && (
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
