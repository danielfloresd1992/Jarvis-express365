/*  POR QUÉ ESTÁ VACÍO EL REGISTRO, DICHO EN EL PROPIO REGISTER
 *
 *  Sin ninguna mesa, la tabla son filas en blanco, y eso mismo se veía en cinco situaciones
 *  que no tienen nada que ver: todavía no se ha leído nada, la lectura falla, se está apuntando lo
 *  que ya había, todo lo que hay en pantalla estaba de antes, o sencillamente no ha entrado nadie.
 *  Quien estrenaba la ventana veía la pantalla de Toast llena arriba y esto vacío abajo, y concluía
 *  que no funcionaba.
 *
 *  Aquí va con todas las letras, donde se está mirando. (La barra de encima de la tabla ya no lo dice:
 *  en su sitio van los totales del día, RegisterTotals.)
 *
 *  Es una franja ENCIMA de las filas libres, que no las sustituye: siguen ahí para anotar a mano lo
 *  que la tablet no ve. Discreta; en ámbar solo si la lectura falla. 'role=status' para que un lector
 *  de pantalla la anuncie al cambiar sin interrumpir.
 */


// reasonForBeingEmpty = «por qué no hay nada»
// PURA. EL ORDEN IMPORTA: gana la primera que se cumpla. El fallo va antes que el censo porque
// mientras falle no avanza ni el censo: decir «apuntando (0 de 3)» sería dar por bueno algo que no
// está pasando.
// Devuelve: { text, alert }. 'alert' es para lo único que pide mirar algo: el fallo.
function reasonForBeingEmpty({ hasReading, readingError, censusing, censusReadings, censusLength, alreadyThere }) {

    if (!hasReading) {
        return { text: 'Esperando la primera lectura de la pantalla…', alert: false };
    }

    if (readingError) {
        return { text: `La última lectura falló: ${readingError}. Hasta que una salga bien no entra nada aquí.`, alert: true };
    }

    if (censusing) {
        return {
            text: `Apuntando lo que ya estaba en pantalla (${censusReadings} de ${censusLength}). Esos pedidos no se siguen: no se sabe cuándo entraron. Aquí aparecen los que lleguen a partir de ahora.`,
            alert: false,
        };
    }

    if (alreadyThere > 0) {
        const howMany = alreadyThere === 1
            ? '1 tarjeta ya estaba en pantalla al conectar y no se sigue.'
            : `${alreadyThere} tarjetas ya estaban en pantalla al conectar y no se siguen.`;

        return { text: `${howMany} Esperando al próximo pedido…`, alert: false };
    }

    return { text: 'Esperando al próximo pedido…', alert: false };
}


/*  @param {boolean} hasReading      false antes de la primera lectura y tras desconectar
 *  @param {string}  readingError    el motivo, si la última lectura falló
 *  @param {boolean} censusing       el seguimiento sigue apuntando lo que ya estaba
 *  @param {number}  censusReadings  cuántas lecturas lleva en ello…
 *  @param {number}  censusLength    …y cuántas dura
 *  @param {number}  alreadyThere    cuántas tarjetas apartó el censo
 */
export default function RegisterEmptyNotice(props) {

    const reason = reasonForBeingEmpty(props);

    return (
        <p
            role='status'
            className={`w-full m-0 px-3 py-1.5 border-b border-jx-regla text-center text-[11px] leading-[1.35] ${reason.alert ? 'bg-jx-aviso-suave text-jx-aviso-texto' : 'bg-jx-panel text-jx-tinta2'}`}
        >
            {reason.text}
        </p>
    );
}
