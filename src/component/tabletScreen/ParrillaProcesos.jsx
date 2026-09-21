import { useState, useEffect, useMemo } from 'react';
import { WrapperCell, WrapperText } from '../cells/GridCells.jsx';




/*  LA PARRILLA DE PROCESOS
 *
 *  Sigue cada PEDIDO: cuándo entró, cuándo lo marcaron listo en la tablet, cuándo
 *  salió de cocina y cuándo se entregó.
 *
 *  Es distinta de la de rotación, que sigue cada MESA. Por eso son dos tablas y no
 *  una: una mesa puede tener tres pedidos, y cada uno lleva sus propios tiempos.
 *
 *  Las dos primeras horas las pone el seguimiento: la toma de orden sale del
 *  cronómetro del ticket, y 'Listo en tablet' de verlo ponerse verde o desaparecer.
 *  Las otras dos —listo en cocina y entrega— se anotan a mano: las ve el monitorista
 *  por cámara y la tablet no las muestra. El detalle de la regla está en
 *  libs/inference/processGrid.js.
 *
 *  En 'Mesa' va el número de mesa y, cuando el pedido no tiene mesa, su número de
 *  ticket con el '#' delante.
 */




//  Las columnas del formato que esta parrilla viene a reemplazar, en su orden exacto.
//  'campo' dice de qué dato de la fila sale cada una.
const COLUMNAS = [
    { titulo: 'Mesa',             campo: 'mesa' },
    { titulo: 'N de tiket',       campo: 'ticket' },
    { titulo: 'Tipo de plato',    campo: 'tipo' },
    { titulo: 'Toma de orden',    campo: 'tomaOrden' },
    { titulo: 'Listo en tablet',  campo: 'listoTablet' },
    { titulo: 'Listo en cocina',  campo: 'listoCocina' },
    { titulo: 'Entrega de plato', campo: 'entregaPlato' },
];


//  Las que llevan una hora y se rellenan tocándolas.
const CAMPOS_DE_HORA = ['tomaOrden', 'listoTablet', 'listoCocina', 'entregaPlato'];


//  Las que NO llena la lectura de la tablet: esas horas se ven por cámara. Se marcan en
//  la cabecera para que se sepa de un vistazo cuáles hay que poner a mano.
const CAMPOS_MANUALES = ['listoCocina', 'entregaPlato'];


//  Los tipos que se sugieren al corregir esa columna. Son los mismos por los que
//  agrupa el resumen del turno, más DoorDash, que la lectura ya reconoce (ver
//  tipoDePlato.js) y sin él aquí no se podía poner a mano lo que sí salía solo.
const TIPOS_SUGERIDOS = ['Entrada', 'Plato fuerte', 'Postre', 'Bebida', 'Take Out', 'Pick Up', 'Uber Eats', 'DoorDash', 'Online Ordering'];


/*  FILAS LIBRES, PARA ANOTAR LO QUE LA TABLET NO VE
 *
 *  Bloque FIJO con identidades escritas de una vez. Calcularlas restando —30 menos los
 *  tickets— hacía que cada pedido nuevo desmontara la última y se llevara lo escrito.
 *
 *  La clave lleva 'pedido' para no coincidir con las filas libres de Rotación
 *  ('libre-0'…): las dos parrillas guardan lo anotado en el mismo almacén, y con la
 *  misma clave lo escrito en la fila libre de una aparecía en la de la otra.
 */
const FILAS_LIBRES = Array.from(
    { length: 10 },
    (_, i) => ({ clave: `libre-pedido-${i}`, fila: null })
);


//  Cómo se pinta cada color. NO llena ninguna columna: el color de la cabecera es una
//  alarma de tiempo —amarilla hasta hora y media, roja después—, no un paso del proceso.
//  El porqué, con los datos que lo demostraron, está en cronometro.js.
const COLOR_TICKET = {
    amarillo: '#e0c341',
    rojo: '#f08a6a',
    verde: '#7fc79e',
};




/*  POR QUÉ ESTÁ VACÍA LA PARRILLA, DICHO EN LA PROPIA PARRILLA
 *
 *  Sin ningún pedido, esta tabla son diez filas en blanco, y eso mismo se veía en cinco
 *  situaciones que no tienen nada que ver: todavía no se ha leído nada, la lectura
 *  falla, se está apuntando lo que ya había, todo lo que hay en pantalla estaba de
 *  antes, o sencillamente no ha entrado nadie. Quien estrenaba la ventana veía la
 *  pantalla de Toast llena arriba y esto vacío abajo, y concluía que no funcionaba.
 *
 *  La barra de las pestañas ya lo resume, pero en letra de 9 px y en una esquina. Aquí
 *  va con todas las letras, donde se está mirando.
 *
 *  EL ORDEN IMPORTA: gana la primera que se cumpla. El fallo va antes que el censo
 *  porque mientras falle no avanza ni el censo: decir «apuntando (0 de 3)» sería
 *  dar por bueno algo que no está pasando.
 *
 *  Devuelve { texto, alerta }; 'alerta' es para lo único que pide mirar algo: el fallo.
 */
function motivoDeEstarVacia({ hayLectura, falloDeLectura, censando, lecturasDelCenso, lecturasQueDuraElCenso, yaEstaban }) {

    if (!hayLectura) {
        return { texto: 'Esperando la primera lectura de la pantalla…', alerta: false };
    }

    if (falloDeLectura) {
        return { texto: `La última lectura falló: ${falloDeLectura}. Hasta que una salga bien no entra nada aquí.`, alerta: true };
    }

    if (censando) {
        return {
            texto: `Apuntando lo que ya estaba en pantalla (${lecturasDelCenso} de ${lecturasQueDuraElCenso}). Esos pedidos no se siguen: no se sabe cuándo entraron. Aquí aparecen los que lleguen a partir de ahora.`,
            alerta: false,
        };
    }

    if (yaEstaban > 0) {
        const cuantas = yaEstaban === 1
            ? '1 tarjeta ya estaba en pantalla al conectar y no se sigue.'
            : `${yaEstaban} tarjetas ya estaban en pantalla al conectar y no se siguen.`;

        return { texto: `${cuantas} Esperando al próximo pedido…`, alerta: false };
    }

    return { texto: 'Esperando al próximo pedido…', alerta: false };
}




/*  @param {boolean} censando                 el seguimiento sigue apuntando lo que ya estaba
 *  @param {number}  lecturasDelCenso         cuántas lecturas lleva en ello…
 *  @param {number}  lecturasQueDuraElCenso   …y cuántas son: las tiras de esta pantalla
 *  @param {number}  yaEstaban                cuántas tarjetas apartó el censo
 *  @param {string}  falloDeLectura           el motivo, si la última lectura falló
 *  @param {boolean} hayLectura               false antes de la primera entrega y tras desconectar
 *
 *  Los seis son solo para explicar una parrilla vacía; con pedidos no se usan.
 */
export function ParrillaProcesos({
    filas = [], leerAnotacion, anotar,
    censando = false, lecturasDelCenso = 0, lecturasQueDuraElCenso = 0, yaEstaban = 0, falloDeLectura = '', hayLectura = false,
}) {


    const lineas = useMemo(() => {
        const conPedido = filas.map(fila => ({ clave: `pedido-${fila.clave}`, fila }));
        return [...conPedido, ...FILAS_LIBRES];
    }, [filas]);


    //  Solo con la parrilla SIN NINGÚN pedido. En cuanto hay una fila, la tabla se
    //  explica sola y la franja estorbaría.
    const vacia = filas.length === 0
        ? motivoDeEstarVacia({ hayLectura, falloDeLectura, censando, lecturasDelCenso, lecturasQueDuraElCenso, yaEstaban })
        : null;




    return (
        //  Se desplaza hacia abajo, nunca hacia los lados: las siete columnas se
        //  reparten el ancho que haya (antes la fila exigía 700 px y en la ventana de
        //  400 salía una barra). '@container' deja a las celdas medir la letra por él.
        <div className='@container flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden bg-[#01122c]'>

            {/*  'z-10' no es decorativo: sin él las filas se dibujan ENCIMA al desplazar  */}
            <div className='sticky top-0 z-10 h-[45px] bg-[#021a38] flex w-full items-center justify-around border-b border-[#0a3a66]'>
                {
                    COLUMNAS.map(({ titulo, campo }) => (
                        <WrapperCell
                            key={campo}
                            classStyles={`h-full uppercase tracking-[0.6px] font-semibold bg-[#021a38] ${CAMPOS_MANUALES.includes(campo) ? 'text-[#e0b341]' : 'text-[#5e7ba0]'}`}
                        >
                            <span title={CAMPOS_MANUALES.includes(campo) ? 'Esta hora se anota a mano: la tablet no la muestra' : 'La rellena la lectura de la tablet'}>
                                {titulo}
                            </span>
                        </WrapperCell>
                    ))
                }
            </div>

            {/*  POR QUÉ NO HAY NADA
                 Una franja ENCIMA de las filas libres, que no las sustituye: siguen ahí
                 para anotar a mano lo que la tablet no ve. Discreta, con el color de la
                 barra de estado; en ámbar solo si la lectura falla. 'role=status' para
                 que un lector de pantalla la anuncie al cambiar sin interrumpir.  */}
            {
                vacia && (
                    <p
                        role='status'
                        className={`w-full m-0 px-3 py-1.5 border-b border-[#0a3a66]/40 bg-[#021a38]/60 text-center text-[11px] leading-[1.35] ${vacia.alerta ? 'text-[#e0b341]' : 'text-[#5e7ba0]'}`}
                    >
                        {vacia.texto}
                    </p>
                )
            }

            {
                lineas.map(({ clave, fila }) => (
                    <LineaProceso
                        key={clave}
                        clave={clave}
                        fila={fila}
                        leerAnotacion={leerAnotacion}
                        anotar={anotar}
                    />
                ))
            }

            {/*  Una sola lista de sugerencias para toda la tabla  */}
            <datalist id='tipos-de-plato'>
                {TIPOS_SUGERIDOS.map(tipo => <option key={tipo} value={tipo} />)}
            </datalist>

        </div>
    );
}




function LineaProceso({ clave, fila, leerAnotacion, anotar }) {


    /*  LO QUE SE ESCRIBE A MANO MANDA
     *
     *  Vive en el almacén de la ventana, no en esta fila: así sobrevive a que el
     *  pedido desaparezca de la tablet y React desmonte la fila.
     *
     *  Y gana sobre lo que traiga la lectura — si alguien corrigió un dato, la IA no
     *  se lo vuelve a pisar.
     */
    const anotado = leerAnotacion?.(clave) ?? {};

    const escribir = (campo) => (valor) => anotar?.(clave, campo, valor);

    const valor = (campo) => anotado[campo] ?? fila?.[campo] ?? '';


    //  Un pedido cerrado ya no está en la pantalla: se entregó. Su fila se queda con
    //  las horas puestas pero se atenúa, para distinguir lo que sigue en marcha.
    const cerrado = !!fila?.cerrado;

    const franja = COLOR_TICKET[fila?.color];

    //  La toma de orden de un ticket que se vio por primera vez YA despachado no es una
    //  medida: su contador podía llevar un rato congelado. Se pinta distinta para que
    //  nadie la tome por buena — salvo que alguien la haya corregido a mano.
    const tomaEstimada = Boolean(fila?.tomaOrdenAproximada) && anotado.tomaOrden === undefined;




    return (
        <div
            className={`flex w-full items-center justify-around transition-colors hover:bg-[#10203c] ${cerrado ? 'bg-[#0b0f1c] opacity-60' : 'bg-[#0e1223]'}`}
            style={franja ? { boxShadow: `inset 3px 0 0 ${franja}` } : undefined}
        >
            {
                //  Ya no hay celda «sin medir»: existía para el pedido que se ponía listo
                //  entre dos lecturas y se quedaba sin hora. Ahora a ese pedido se le
                //  sella 'Listo en tablet' cuando desaparece, así que el hueco no se da.
                COLUMNAS.map(({ campo }) => (
                    <WrapperCell
                        key={campo}
                        classStyles={campo === 'tomaOrden' && tomaEstimada ? 'text-[#e0b341] italic' : (ESTILO_CELDA[campo] ?? 'text-[#aecbf0]')}
                        titulo={campo === 'tomaOrden' && tomaEstimada ? 'Hora estimada: el ticket ya estaba despachado cuando se le vio, y su contador podía estar parado' : undefined}
                    >
                        {
                            CAMPOS_DE_HORA.includes(campo)
                                ? <WrapperText value={valor(campo)} updateValue={escribir(campo)} />
                                : <CeldaTexto campo={campo} valor={valor(campo)} plato={fila?.plato} onChange={escribir(campo)} />
                        }
                    </WrapperCell>
                ))
            }
        </div>
    );
}




//  Fuera del render para no rehacer el objeto en cada fila y en cada lectura.
const ESTILO_CELDA = {
    mesa: 'font-semibold',
    ticket: 'text-[#aecbf0] font-mono tabular-nums',
};




/*  Las tres columnas que no son horas: mesa, número de ticket y tipo de plato.
 *
 *  La del tipo lleva sugerencias y enseña, al pasar el ratón, el nombre del plato que
 *  leyó la IA — no cabe en la columna, pero es lo que explica por qué salió ese tipo.
 */
function CeldaTexto({ campo, valor, plato, onChange }) {

    const esTipo = campo === 'tipo';

    return (
        <input
            className='w-full h-full text-center bg-transparent'
            type='text'
            value={valor}
            list={esTipo ? 'tipos-de-plato' : undefined}
            title={esTipo ? (plato ? `Plato leído: ${plato}` : 'La IA no leyó el nombre del plato') : undefined}
            placeholder={esTipo ? (plato ?? '') : ''}
            onChange={evento => onChange(evento.target.value)}
        />
    );
}
