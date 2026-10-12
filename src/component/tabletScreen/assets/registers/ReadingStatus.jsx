/*  CÓMO VA LA LECTURA, EN UNA LÍNEA
 *
 *  Existe porque un register vacío puede significar cuatro cosas muy distintas y todas se veían
 *  idénticas:
 *
 *      · se está apuntando lo que ya estaba   → es correcto, hay que esperar
 *      · no ha llegado ningún pedido nuevo    → también es correcto
 *      · el modelo contesta pero se descarta todo → el filtro está de más
 *      · la lectura falla                     → hay que mirarlo
 *
 *  Distinguirlas costaba abrir la consola del navegador, y en producción nadie la abre.
 *
 *  Va discreta a propósito: es información de fondo, no un cartel. Solo se pone en ámbar cuando de
 *  verdad hay algo que mirar.
 */


/*  @param {object}  diagnosis       cómo fue la última vuelta: { leidos, descartados, segundos, modelo, error }.
 *                                   null = todavía no ha vuelto ninguna lectura
 *  @param {boolean} censusing       el seguimiento sigue apuntando lo que ya estaba
 *  @param {number}  censusReadings  cuántas lecturas lleva en ello…
 *  @param {number}  censusLength    …y cuántas son
 *  @param {number}  orders          cuántos pedidos se están siguiendo
 */
export default function ReadingStatus({ diagnosis, censusing, censusReadings, censusLength, orders }) {

    /*  ANTES DE LA PRIMERA ENTREGA NO SE CUENTA NADA DEL CENSO
     *
     *  El censo está abierto desde que se monta la ventana: sin tablet conectada, mirando solo
     *  'censusing', la barra decía «apuntando lo que ya estaba · 0/1», y no se estaba apuntando nada.
     *
     *  Sin lectura se dice eso, que no la hay. Vale igual para el rato que tarda en volver la primera
     *  —con la IA de verdad, cerca de un minuto— y para después de desconectar.
     */
    // noReading = «todavía no hay ninguna lectura»
    const noReading = !diagnosis;

    // failure = «por qué falló la última vuelta», si falló
    const failure = diagnosis?.error;

    //  'leidos' son los objetos que devolvió el modelo; 'descartados', los que no llegaron a ser un
    //  ticket por no traer cronómetro o ser una etiqueta de pantalla. Que los dos números coincidan
    //  es la señal de que el filtro se está pasando.
    // allDiscarded = «se descartó todo lo que contestó el modelo»
    const allDiscarded = !failure && diagnosis?.leidos > 0 && diagnosis.descartados === diagnosis.leidos;

    /*  CUÁNTO TARDÓ LA IA
     *
     *  Los segundos de la última lectura importan más de lo que parece: verlos acercarse al tope
     *  avisa antes de que la vuelta se pierda. «IA 43,0 s» contesta de un vistazo a «¿está saliendo
     *  la imagen?».
     */
    const seconds = diagnosis?.segundos ? `IA ${diagnosis.segundos.toFixed(1).replace('.', ',')} s` : '';

    //  El motivo viene ya en español. Se recorta para que quepa en la barra; entero va en el
    //  'title', al pasar el ratón.
    const text = noReading ? 'esperando la primera lectura…'
        : failure ? `lectura fallida: ${String(failure).slice(0, 90)}`
        : censusing
            //  «Apuntando», no «censando»: es lo que se está haciendo, dicho sin jerga.
            ? [`apuntando lo que ya estaba · ${censusReadings}/${censusLength}`, seconds].filter(Boolean).join(' · ')
            : [
                `${orders} en seguimiento`,
                `leídos ${diagnosis?.leidos ?? 0}`,
                diagnosis?.descartados ? `descartados ${diagnosis.descartados}` : '',
                seconds,
            ].filter(Boolean).join(' · ');

    //  Con qué modelo se leyó: no está escrito en ningún sitio, lo dice el servidor de IA al abrir
    //  la ventana (checkAiServer) y viaja en el diagnóstico de cada vuelta.
    // readBy = «quién la leyó»
    const readBy = diagnosis?.modelo ? ` La leyó el servidor de IA con «${diagnosis.modelo}».` : ' La leyó el servidor de IA.';

    // help = «lo que se lee al pasar el ratón»
    const help = noReading ? 'Todavía no ha vuelto ninguna lectura de la pantalla. Con la tablet conectada, la primera puede tardar lo que tarde la IA en contestar.'
        : failure ? `La última vuelta no llegó a leerse: ${failure}. Si se repite, mira la consola.`
        : censusing
            ? `En la primera lectura se apunta lo que ya estaba en pantalla, para no contarlo como recién llegado. La parrilla se queda vacía a propósito.${readBy}`
            : allDiscarded
                ? `El modelo contestó, pero nada de lo que dijo parecía un ticket: sin cronómetro legible, o era una etiqueta de la pantalla.${readBy}`
                : `Objetos que devolvió la última lectura, y cuántos no eran tickets.${readBy}`;

    return (
        <span
            className={`ml-auto min-w-0 pr-2 truncate ${failure || allDiscarded ? 'text-jx-aviso-texto' : 'text-jx-tinta2'}`}
            style={{ fontSize: '11px' }}
            title={help}
        >
            {text}
        </span>
    );
}
