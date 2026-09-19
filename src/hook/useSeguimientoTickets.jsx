import { useState, useRef, useEffect, useMemo } from 'react';
import { getCurrentTime } from '../component/cells/GridCells.jsx';
import { crearResolutorDeTipo } from '../libs/tickets/tipoDePlato.js';
import { LECTURAS_POR_RECORRIDO } from '../libs/tickets/configLectura.js';
import { aSegundosDeCronometro, aTexto } from '../libs/tickets/cronometro.js';




/*  ─────────────────────────────────────────────────────────────────────────────
 *  DE DÓNDE SALE CADA UNA DE LAS CUATRO HORAS
 *
 *  Es la regla que dio quien usa la parrilla, contrastada con cómo funciona la pantalla
 *  de cocina de Toast (su documentación está enlazada en lecturaDeTickets.js):
 *
 *      Toma de orden    ← el momento en que el contador del ticket estaba en 00:00:00.
 *                         Casi nunca se le pilla justo ahí, así que se calcula: reloj
 *                         de la tablet − cronómetro de la tarjeta. Da lo mismo y da
 *                         exacto aunque el ticket se vea minutos después de entrar.
 *
 *      Listo en tablet  ← LO PRIMERO QUE OCURRA de estas dos cosas:
 *                           · el ticket se pone VERDE o completa sus palomitas
 *                             (llega en 'listo'), o
 *                           · el ticket DESAPARECE de la pantalla, confirmado: la tira
 *                             que lo tenía a la vista lo echa en falta dos veces.
 *
 *      Listo en cocina  ← A MANO. Si desaparecer ya es 'Listo en tablet', a esta
 *      Entrega de plato ← A MANO. columna no le queda señal en la tablet: las dos las
 *                         ve el monitorista por cámara.
 *
 *  EL COLOR, QUE HA DADO GUERRA. El paso de amarillo a rojo NO sella nada: es la alarma
 *  de edad del ticket («Warning Colors», la configura el restaurante en Toast) y un
 *  ticket en rojo sigue esperando en pantalla. Existió un mapa 'COLUMNA_POR_COLOR' que
 *  sellaba horas con ese cambio y llenó dos columnas de datos falsos; los datos que lo
 *  zanjaron están en cronometro.js. El único color que dice algo del proceso es el
 *  VERDE, y ese ya llega dentro de 'listo'.
 *  ───────────────────────────────────────────────────────────────────────────── */


/*  Una fila de la parrilla de procesos, vacía. Es también el contrato: estos son todos
 *  los campos que la tabla sabe pintar.
 *
 *  Es una FUNCIÓN y no un objeto suelto a propósito. Copiarlo con '{...FILA_VACIA}'
 *  era copia superficial: el array de candidatos habría sido el MISMO para todas las
 *  filas, y todos los pedidos habrían acabado votando la hora del vecino. Devolviendo
 *  uno nuevo cada vez, ese error no se puede cometer.
 */
const filaVacia = () => ({
    clave: '',
    mesa: '',
    ticket: '',
    plato: '',
    tipo: '',
    color: '',
    tomaOrden: '',
    tiempoDeVida: '',
    listoTablet: '',
    listoCocina: '',
    entregaPlato: '',
    cerrado: false,
    //  En qué número de lectura se cerró. En lecturas y no en milisegundos: ver
    //  RECORRIDOS_DE_REAPERTURA.
    cerradoEn: 0,

    //  De aquí para abajo no se pinta nada: son los apuntes que necesita el seguimiento.
    //  'segundosDeVida' es el cronómetro en crudo, que es por donde se ordena la
    //  parrilla; 'candidatosTomaOrden' son las lecturas que se votan (ver la mediana);
    //  'vistoAlgunaVez' evita sellar 'Listo en tablet' la primera vez que se ve el ticket.
    segundosDeVida: 0,
    candidatosTomaOrden: [],
    vistoAlgunaVez: false,

    //  Cómo estaba 'listo' la última vez que se le LEYÓ (null = todavía nunca). 'Listo
    //  en tablet' solo se sella al verlo pasar de false a true: verlo dos veces ya en
    //  verde no dice cuándo se puso verde.
    ultimoListo: null,

    //  Infinity y no 0: una fila sin hora todavía se va al final al ordenar, en vez de
    //  colarse en cabeza haciéndose pasar por el pedido más antiguo del turno.
    tomaOrdenSegundos: Infinity,

    //  true cuando la toma de orden no se pudo medir y es una estimación: el ticket se
    //  vio por primera vez ya listo, con el contador de su cabecera quizá congelado.
    tomaOrdenAproximada: false,

    //  Cuántas veces seguidas lo ha echado en falta SU tira, y a qué hora fue la
    //  primera. Con esos dos se decide si desapareció de verdad — y de ahí sale
    //  'Listo en tablet' cuando no se le vio ponerse verde antes.
    ausenciasSeguidas: 0,
    faltaDesde: '',

    //  Qué tira lo vio por última vez: es la única que puede echarlo en falta.
    tira: null,

    //  true si 'Listo en tablet' se selló por desaparición. Si el ticket vuelve a
    //  verse, esa hora queda desmentida y hay que retirarla.
    listoPorAusencia: false,

    //  El canal del pedido (Online Ordering…) cuando la cabecera lo delata. No se
    //  pinta: solo ayuda a resolver el tipo.
    canal: '',
});


/*  CUÁNTO PUEDE FALTAR UN TICKET Y SEGUIR SIENDO EL MISMO
 *
 *  Por debajo de esto, que falte significa que una lectura se lo saltó —pasa, el modelo
 *  no acierta siempre— y hay que reabrirlo con su historia. Por encima, el pedido
 *  terminó, y lo que aparezca luego con la misma identidad es otro distinto.
 *
 *  SE CUENTA EN RECORRIDOS, NO EN MINUTOS, y el porqué es un fallo que costó caro.
 *
 *  Antes eran «cinco minutos, porque la pantalla se recorre entera en uno». Ese uno
 *  salía de multiplicar tiras por INTERVALO_LECTURA_MS, que es lo que TARDARÍAMOS en
 *  pedir las lecturas — no lo que tarda el modelo en contestarlas. Con el modelo
 *  respondiendo en 30 s, un recorrido real son dos minutos y medio, así que aquellos
 *  cinco minutos no eran doce recorridos de margen: eran menos de dos.
 *
 *  Y quedarse corto aquí CORROMPE DATOS: dos fallos seguidos de la misma tira hacen
 *  que un pedido vivo se dé por terminado, y al reaparecer entra como pedido nuevo con
 *  horas nuevas. Una fila duplicada con toda la pinta de buena.
 *
 *  Contándolo en recorridos, el margen ya no depende de lo rápido que vaya el modelo.
 *  Doce es generoso a propósito: equivocarse por esperar de más solo retrasa el cierre
 *  de una fila; equivocarse por esperar de menos inventa un pedido.
 */
const RECORRIDOS_DE_REAPERTURA = 12;

const LECTURAS_DE_REAPERTURA = RECORRIDOS_DE_REAPERTURA * LECTURAS_POR_RECORRIDO;


/*  Cuántas veces seguidas tiene que echarlo en falta SU tira para darlo por terminado.
 *
 *  Dos, y no una, porque el modelo se deja tickets a menudo: hay vueltas que traen tres
 *  de las seis tarjetas de la tira. Con una sola ausencia, 'Listo en tablet' se llenaría
 *  de horas falsas cada vez que una lectura saliera floja.
 *
 *  OJO A QUIÉN CUENTA. Antes contaba cualquier lectura, de la tira que fuera, y eso
 *  anulaba la espera: un ticket que su tira no vio desaparece del acumulado, y la
 *  lectura de la tira SIGUIENTE —cinco segundos después, mirando otra zona de la
 *  pantalla— ya sumaba la segunda ausencia. Un solo despiste del modelo cerraba el
 *  pedido. Ahora solo cuenta la tira que lo tenía a la vista, así que las dos ausencias
 *  son de verdad dos miradas al mismo sitio, con un recorrido entero entre medias.
 *
 *  Dos tampoco es mucho esperar: como la hora que se estampa es la de la PRIMERA
 *  ausencia, confirmar más tarde no empeora el dato, solo tarda en enseñarlo.
 */
const AUSENCIAS_PARA_DAR_POR_CERRADO = 2;




/*  SEGUIMIENTO DE TICKETS
 *
 *  La pantalla de la tablet no muestra horas: muestra tickets de un color. Las
 *  columnas del formato, en cambio, son horas de reloj. Este enganche es el puente.
 *
 *  El modelo dice QUÉ hay en pantalla ahora. Aquí se guarda de qué color estaba cada
 *  ticket la vez anterior y, cuando cambia, se estampa la hora del equipo en la
 *  columna que le toque. Es decir: la IA ve, la aplicación cronometra.
 *
 *  Tres cosas que hace y que no son obvias:
 *
 *  · Una hora estampada NO se pisa. Si un ticket parpadea entre dos colores, la
 *    columna conserva la primera vez que pasó, que es la que vale.
 *
 *  · Un ticket que desaparece NO se borra: se marca cerrado y se queda con sus horas.
 *    Desaparecer es justo lo que hace un pedido al entregarse, y borrarlo ahí tiraría
 *    el dato en el momento en que está completo.
 *
 *  · El tipo de plato se reintenta mientras siga vacío, porque las piezas con las que
 *    se decide llegan por separado. En cuanto da un resultado, se fija.
 *
 *  @param {Array}  lectura   lo último que mandó el espejo de la tablet
 *  @param {string} reinicio  cuando cambia, se vacía el historial. Se le pasa el local.
 *  @param {Array}  carta     establishment.dishes, para deducir el tipo de cada pedido
 *  @returns {Array} una fila por ticket, con la forma de filaVacia()
 */
/*  ─────────────────────────────────────────────────────────────────────────────
 *  SOLO SE SIGUEN LOS PEDIDOS QUE VAN LLEGANDO
 *
 *  Al conectar, la pantalla ya trae pedidos de antes — algunos de hace horas. Esos NO
 *  interesan: nadie vio cuándo entraron, así que sus tiempos serían inventados.
 *
 *  Durante el primer recorrido completo todo lo que se vea se apunta como «ya estaba»
 *  y se descarta. A partir de ahí, lo que aparezca es genuinamente nuevo.
 *
 *  El recorrido completo es una lectura por tira. Censar menos dejaría parte de
 *  la pantalla sin mirar, y los pedidos viejos de esa zona entrarían después haciéndose
 *  pasar por nuevos.
 *
 *  Por eso el número sale de la misma configuración que usa el espejo para trocear la
 *  pantalla, y no de una constante aparte: escritos en dos sitios, el día que alguien
 *  cambie el troceado esto se queda corto y el fallo no da la cara — simplemente
 *  aparecen pedidos viejos como si acabaran de entrar.
 *  ───────────────────────────────────────────────────────────────────────────── */
const LECTURAS_DE_CENSO = LECTURAS_POR_RECORRIDO;


/*  @param {number|null} tiraLeida  qué tira de la pantalla produjo esta lectura. null
 *                                  cuando no hubo lectura: el arranque, o una
 *                                  desconexión que vació la lista. Ahí no se cuenta
 *                                  nada — ni censo ni ausencias.
 */
export function useSeguimientoTickets(lectura, horaTablet, reinicio, carta, tiraLeida = null) {


    //  El resolutor monta un índice de búsqueda por dentro: se construye una vez por
    //  carta, no en cada lectura.
    const resolverTipo = useMemo(() => crearResolutorDeTipo(carta), [carta]);


    //  El historial vive en una referencia y no en el estado: se modifica en cada
    //  lectura y lo que se publica es una copia. Tenerlo en estado obligaría a clonar
    //  el mapa entero en cada vuelta sin ganar nada.
    const historialRef = useRef(new Map());

    //  Los pedidos que ya estaban al conectar, y cuántas lecturas llevamos censando.
    const yaEstabanRef = useRef(new Set());
    const lecturasRef = useRef(0);

    //  La última lista que ya se procesó. El efecto de abajo también se dispara cuando
    //  termina de cargar la carta, con la MISMA lectura: sin esto, esa repetición
    //  contaba como una lectura más del censo y como otra ausencia de cada ticket.
    const lecturaProcesadaRef = useRef(null);

    const [filas, setFilas] = useState([]);


    //  Cambio de local: se tira el historial. Va en su propio efecto y ANTES que el de
    //  la lectura, para que una que llegue en el mismo ciclo entre ya sobre lo limpio.
    useEffect(() => {
        historialRef.current = new Map();
        yaEstabanRef.current = new Set();
        lecturasRef.current = 0;
        setFilas([]);
    }, [reinicio]);


    useEffect(() => {
        if (!Array.isArray(lectura)) return;

        const historial = historialRef.current;

        //  ¿Es una lectura que ya se procesó? Entonces lo único que ha cambiado es la
        //  carta: se rellenan los tipos que quedaron en blanco y nada más. Ni censo, ni
        //  horas, ni ausencias — todo eso ya se contó la primera vez.
        if (lecturaProcesadaRef.current === lectura) {
            for (const fila of historial.values()) {
                if (!fila.tipo) fila.tipo = resolverTipo({ mesa: fila.canal || fila.mesa, plato: fila.plato });
            }
            setFilas(filasOrdenadas(historial));
            return;
        }
        lecturaProcesadaRef.current = lectura;

        //  Sin tira no hubo lectura: es la lista vacía del arranque o la de una
        //  desconexión. Tratarla como «pantalla sin tickets» gastaba una vuelta del
        //  censo y, peor, daba por desaparecidos todos los pedidos abiertos.
        if (tiraLeida === null || tiraLeida === undefined) return;

        /*  TODAS LAS HORAS DE UNA FILA, DEL MISMO RELOJ
         *
         *  Manda el de la TABLET. 'Toma de orden' se copia de la propia tarjeta, así que
         *  ya viene en su horario; si los pasos siguientes se sellaran con el reloj del
         *  equipo, la fila mezclaría dos husos y restar una columna de otra no
         *  significaría nada.
         *
         *  No es teórico: en la primera prueba la tablet marcaba las 10:26 y el equipo
         *  las 08:26. Dos horas de diferencia dentro de la misma fila.
         *
         *  El reloj del equipo queda solo de último recurso, para cuando ADB no conteste.
         */
        const ahora = horaTablet || getCurrentTime();
        const vistosAhora = new Set();


        //  EL CENSO INICIAL
        //
        //  Un recorrido completo de la pantalla —una lectura por tira— solo
        //  sirven para apuntar qué había ya. Nada de eso entra en la parrilla.
        lecturasRef.current += 1;
        const censando = lecturasRef.current <= LECTURAS_DE_CENSO;


        for (const ticket of lectura) {
            //  La clave es la que fabricó el espejo: el número de ticket si la pantalla
            //  lo muestra, y si no una compuesta con la mesa. Sin ella no hay a qué
            //  fila atribuir lo que se lea.
            const clave = ticket?.clave ?? ticket?.mesa;
            if (!clave) continue;

            //  Mientras se censa, todo lo que se vea queda marcado como preexistente.
            if (censando) {
                yaEstabanRef.current.add(clave);
                continue;
            }

            //  Y después, lo que ya estaba se sigue ignorando: de esos pedidos no
            //  sabemos cuándo entraron, así que cualquier tiempo sería inventado.
            if (yaEstabanRef.current.has(clave)) continue;

            vistosAhora.add(clave);

            let fila = historial.get(clave) ?? { ...filaVacia(), clave };


            /*  VOLVER A APARECER: ¿EL MISMO PEDIDO, U OTRO?
             *
             *  Esto va antes de tocar nada, porque decide sobre qué fila se trabaja.
             *
             *  Reabrir sin preguntar era peligroso: la mesa 12 pide algo a la una, se
             *  le estampan sus horas y el ticket se cierra; a las dos la mesa 12 pide
             *  otra cosa y cae en la misma clave. Como las horas ya estaban puestas no
             *  se volvían a estampar, y el pedido nuevo aparecía con la hora del viejo.
             *  Un dato falso con toda la pinta de bueno.
             */
            //  'cerradoEn' guarda EN QUÉ LECTURA se cerró, no a qué hora: así el margen
            //  se mide en recorridos de pantalla y no depende de lo que tarde el modelo.
            const cerradoHaceMucho = fila.cerrado
                && fila.cerradoEn
                && (lecturasRef.current - fila.cerradoEn) > LECTURAS_DE_REAPERTURA;

            if (cerradoHaceMucho) {
                const claveArchivo = `${clave}#${fila.cerradoEn}`;
                historial.set(claveArchivo, { ...fila, clave: claveArchivo });

                //  Empieza de cero, heredando solo lo que DESCRIBE al pedido y no lo
                //  que le pasó.
                fila = { ...filaVacia(), clave, mesa: fila.mesa, ticket: fila.ticket, plato: fila.plato, tipo: fila.tipo };
            }

            fila.cerrado = false;
            fila.cerradoEn = 0;

            //  Volver a verlo cancela la cuenta de ausencias: no se había ido, lo
            //  habíamos perdido de vista.
            fila.ausenciasSeguidas = 0;
            fila.faltaDesde = '';

            //  Y si se le había sellado 'Listo en tablet' POR DESAPARECER, esa hora queda
            //  desmentida: el ticket sigue en pantalla. Se retira para que vuelva a
            //  sellarse cuando ocurra de verdad. Una hora sellada por verlo ponerse
            //  verde no se toca, y lo que alguien anotó a mano tampoco: eso vive en el
            //  almacén de la ventana y manda sobre esta fila.
            if (fila.listoPorAusencia) {
                fila.listoTablet = '';
                fila.listoPorAusencia = false;
            }

            //  La tira que lo acaba de ver pasa a ser la única que puede echarlo en falta.
            fila.tira = ticket.tira ?? tiraLeida;


            /*  ¿SE LE ACABA DE LEER, O VIENE ARRASTRADO DE OTRA TIRA?
             *
             *  Cada entrega trae la lista COMPLETA: los tickets de la tira recién leída y,
             *  con ellos, los de las demás tiras tal como quedaron en SU última lectura.
             *  Esos llegan con el cronómetro de entonces, pero la hora que acompaña a la
             *  entrega es la de AHORA. Restar una cosa de la otra da una toma de orden
             *  tardía: tanto como haya pasado entre las dos capturas.
             *
             *  No era un error de un día: era fijo. Con tres tiras a 5 s, los votos de un
             *  pedido salían +0, +5, +10, +0, +5 y la mediana se quedaba en +5 s. Con el
             *  modelo de verdad, que tarda un minuto por tira, el desvío era de un minuto.
             *  Lo destapó el simulador de Toast, donde la hora verdadera sí se conoce.
             *
             *  Así que de un ticket arrastrado solo se toma que SIGUE EN PANTALLA. Su
             *  cronómetro y su 'listo' son de otra captura, y no se mezclan con esta hora.
             */
            const recienLeido = ticket.tira === undefined || ticket.tira === null || ticket.tira === tiraLeida;


            //  Los datos se refrescan siempre que la lectura traiga algo: una tira
            //  puede leer mal el plato una vez y bien la siguiente, y no hay motivo
            //  para quedarse con la mala.
            if (ticket.mesa) fila.mesa = ticket.mesa;
            if (ticket.ticket) fila.ticket = ticket.ticket;
            if (ticket.plato) fila.plato = ticket.plato;
            if (ticket.canal) fila.canal = ticket.canal;


            //  EL TIPO SE RESUELVE, NO SE COPIA. Se reintenta mientras siga vacío: la
            //  carta del local puede cargar después de la primera lectura, y el nombre
            //  del plato puede leerse bien recién en la tercera vuelta.
            //
            //  Para el tipo, el canal del pedido hace de «mesa»: cuando no hay mesa, en
            //  ese campo va el número de ticket, que no dice nada del tipo de pedido.
            if (!fila.tipo) {
                fila.tipo = resolverTipo({ mesa: fila.canal || fila.mesa, plato: fila.plato, pista: ticket.tipo });
            }


            /*  LAS DOS COLUMNAS DE TIEMPO SALEN DEL CRONÓMETRO DE LA TARJETA
             *
             *  El 'FIRE' que muestra el ticket es cuánto lleva esperando, no a qué hora
             *  entró — ver 'aSegundosDeCronometro' más abajo, donde está la prueba.
             *
             *  De ahí salen las dos, pero al revés de como estaban:
             *
             *      tiempo de vida = el cronómetro, tal cual. No hay nada que calcular:
             *                       lo lleva la propia tablet. Por eso esta columna
             *                       funciona aunque falle la lectura del reloj por ADB.
             *
             *      toma de orden  = reloj de la tablet − cronómetro.
             */
            const espera = recienLeido ? aSegundosDeCronometro(ticket.tiempo) : null;

            if (espera !== null) {

                fila.segundosDeVida = espera;
                fila.tiempoDeVida = aTexto(espera);

                /*  LA TOMA DE ORDEN SE VOTA, NO SE CREE A LA PRIMERA
                 *
                 *  'reloj − cronómetro' tiene que dar SIEMPRE lo mismo para un pedido:
                 *  mientras el reloj avanza, el cronómetro avanza igual. Esa constancia
                 *  es una red de seguridad gratis — una lectura mala se delata sola
                 *  porque no coincide con las demás.
                 *
                 *  Así que se guardan los primeros candidatos y se usa la mediana. Con
                 *  tres, un dígito mal leído ya no puede fijar mal la hora. Sin esto, un
                 *  solo fallo en la primera lectura marcaba la fila para siempre y
                 *  además la descolocaba en el orden de la parrilla.
                 *
                 *  Se guardan en SEGUNDOS CON SIGNO, sin ajustar la medianoche todavía.
                 *  Un pedido de anoche da negativo, y sumarle el día antes de votar
                 *  mezclaría un 23:5x con un 00:0x y la mediana saldría por el otro
                 *  extremo del reloj. El ajuste se hace una sola vez, al final.
                 */
                const reloj = aSegundos(horaTablet);

                if (reloj) {
                    /*  UN TICKET YA LISTO NO VOTA: SU CRONÓMETRO PUEDE ESTAR PARADO
                     *
                     *  Al despacharse una tarjeta, Toast CONGELA el contador de su
                     *  cabecera —en las capturas reales una entrada despachada marca 6:22
                     *  arriba mientras su FIRE sigue en 6:31—. Desde ese momento «reloj −
                     *  cronómetro» ya no da la hora de entrada: da una hora cada vez más
                     *  tardía, tanto como lleve congelado. Votando con eso, un ticket visto
                     *  por primera vez ya en verde salía con la toma de orden retrasada.
                     *
                     *  Así que solo votan las lecturas de cuando el ticket aún no estaba
                     *  listo. Si no hubo ninguna —se le vio ya despachado— se guarda UNA
                     *  estimación, la primera, que es la de menos retraso, y se marca como
                     *  aproximada para que nadie la tome por medida.
                     */
                    const puedeEstarCongelado = ticket.listo === true;

                    if (!puedeEstarCongelado && fila.candidatosTomaOrden.length < 5) {
                        fila.candidatosTomaOrden.push(reloj - espera);
                    }

                    if (fila.candidatosTomaOrden.length > 0) {
                        //  El voto se guarda TAMBIÉN en crudo, con su signo, porque es por
                        //  donde se ordena la parrilla. Negativo significa «de ayer».
                        fila.tomaOrdenSegundos = mediana(fila.candidatosTomaOrden);
                        fila.tomaOrdenAproximada = false;
                    }
                    else if (fila.tomaOrdenSegundos === Infinity) {
                        fila.tomaOrdenSegundos = reloj - espera;
                        fila.tomaOrdenAproximada = true;
                    }

                    if (fila.tomaOrdenSegundos !== Infinity) {
                        fila.tomaOrden = aTexto(fila.tomaOrdenSegundos >= 0 ? fila.tomaOrdenSegundos : fila.tomaOrdenSegundos + 86400);
                    }
                }
            }

            //  Si el cronómetro no se leyó bien no se inventa nada NI se borra lo que ya
            //  había: una lectura mala no debe tirar abajo una hora buena de antes.


            //  El color solo pinta la franja de la fila: es la alarma de tiempo, no un
            //  paso del proceso. Se refresca sin más, sin sellar nada.
            fila.color = ticket.color || fila.color;


            /*  LISTO EN TABLET, PRIMERA VÍA: SE LE VE PONERSE VERDE
             *
             *  'listo' llega de la lectura y significa que la tarjeta entera está en verde
             *  o que TODOS sus renglones tienen palomita: las dos formas en que Toast
             *  marca lo despachado. (La segunda vía, que el ticket desaparezca, está más
             *  abajo, con los que ya no están.)
             *
             *  SOLO SE SELLA UN CAMBIO QUE SE HAYA VISTO OCURRIR.
             *
             *  La primera vez que se ve un ticket NO se sella, y esto importa. Ver un
             *  ticket que YA estaba listo no dice cuándo se puso listo: dice cuándo lo
             *  miramos nosotros. Sellar ahí llenaba la columna con la hora de la lectura
             *  y salían filas con el mismo segundo exacto — no era la hora del pedido,
             *  era la nuestra.
             *
             *  Así que la primera lectura solo APUNTA el estado. La hora se sella al ver
             *  el paso de «le faltan renglones» a «están todos», que es el único momento
             *  en que de verdad sabemos cuándo ocurrió.
             */
            //  Solo cuenta una lectura de AHORA. Un ticket arrastrado de otra tira trae el
            //  'listo' de su captura, no de esta: ni delata un cambio ni lo desmiente.
            if (recienLeido) {
                const seLeVioSinTerminar = fila.vistoAlgunaVez === true && fila.ultimoListo === false;

                if (ticket.listo === true && seLeVioSinTerminar && !fila.listoTablet) {
                    fila.listoTablet = ahora;
                }

                fila.ultimoListo = ticket.listo === true;
                fila.vistoAlgunaVez = true;
            }

            //  Un ticket que ya estaba verde la primera vez que se le vio no se queda sin
            //  hora para siempre: cuando desaparezca, se le sella por la segunda vía.

            historial.set(clave, fila);
        }


        /*  ─────────────────────────────────────────────────────────────────────────
         *  LOS QUE YA NO ESTÁN — LISTO EN TABLET, SEGUNDA VÍA
         *
         *  Que un ticket desaparezca de la pantalla es que la cocina lo despachó en la
         *  tablet. Si antes no se le vio ponerse verde, esa es su hora de 'Listo en
         *  tablet'. 'Listo en cocina' ya no sale de aquí: se anota a mano.
         *
         *  PERO NO SE SELLA A LA PRIMERA, y esto es lo importante.
         *
         *  El modelo pierde tickets continuamente —hay lecturas que traen tres de las
         *  seis tarjetas que hay en la tira—, así que faltar UNA vez no significa que
         *  se haya ido: significa que puede que no lo hayamos visto. Sellar ahí
         *  llenaría la columna de horas falsas, que es peor que dejarla vacía.
         *
         *  Así que se cuentan las ausencias seguidas y solo se da por cerrado cuando se
         *  repiten. Se cuenta en LECTURAS y no en minutos a propósito: así se ajusta
         *  solo si el modelo va más rápido o más lento, sin tocar ningún número.
         *
         *  Y la hora que se estampa es la de la PRIMERA ausencia, no la de la
         *  confirmación. Esperar para confirmar no cuesta precisión, solo tardanza en
         *  que la fila lo enseñe — por eso se puede ser generoso con la espera.
         *
         *  Se marcan cerrados, no se borran: desaparecer es justo lo que hace un pedido
         *  al terminarse, y borrarlo ahí tiraría el dato en el momento de estar completo.
         *  ───────────────────────────────────────────────────────────────────────── */
        for (const [clave, fila] of historial) {
            if (vistosAhora.has(clave) || fila.cerrado) continue;

            //  Solo lo puede echar en falta la tira que lo tenía a la vista. Las demás
            //  miran otra zona de la pantalla: que no lo traigan no dice nada. El porqué
            //  largo está en AUSENCIAS_PARA_DAR_POR_CERRADO.
            if (fila.tira !== tiraLeida) continue;

            fila.ausenciasSeguidas += 1;

            //  La hora de la primera ausencia se guarda ya, aunque todavía no se sella:
            //  cuando se confirme, la buena será esta y no la de entonces.
            if (!fila.faltaDesde) fila.faltaDesde = ahora;

            if (fila.ausenciasSeguidas < AUSENCIAS_PARA_DAR_POR_CERRADO) continue;

            fila.cerrado = true;
            fila.cerradoEn = lecturasRef.current;

            //  No se pisa la hora de haberlo visto ponerse verde: esa ocurrió antes y es
            //  la buena. Se deja apuntado de dónde salió esta, por si el ticket reaparece.
            if (!fila.listoTablet) {
                fila.listoTablet = fila.faltaDesde;
                fila.listoPorAusencia = true;
            }
        }


        /*  LO QUE SE PUBLICA
         *
         *  Los pedidos vivos arriba y los terminados debajo: el mapa conserva el orden
         *  de entrada, así que sin ordenar los de primera hora se quedaban en lo alto y
         *  lo que está pasando ahora acababa enterrado.
         *
         *  Se publica una copia de cada fila. Con los mismos objetos del mapa, React no
         *  vería cambio alguno —son la misma referencia— y la tabla no se redibujaría.
         */
        /*  Por ORDEN DE TOMA DE ORDEN: el primero que entró, arriba. Es como se lee un
         *  turno y como se compara con la pantalla, que también va por antigüedad.
         *
         *  Se ordena por 'tomaOrdenSegundos', el valor CON SIGNO y sin ajustar la
         *  medianoche. Eso resuelve de una vez dos problemas que las alternativas no:
         *
         *  · Ordenar por la hora ya ajustada rompe en el cambio de día: un pedido de
         *    anoche marca 20:10 y uno de hoy 12:16, así que el viejo se iría al final
         *    justo cuando debería encabezar. Con el signo, lo de ayer es negativo y cae
         *    arriba solo.
         *
         *  · Ordenar por el cronómetro se va desfasando. Es una foto del momento en que
         *    se leyó esa tira, y como cada una se revisita una vez por recorrido —y los
         *    pedidos cerrados ya no se leen nunca—, las filas se comparaban entre sí con
         *    instantes distintos y el orden bailaba. La toma de orden no envejece.
         */
        setFilas(filasOrdenadas(historial));

        //  'resolverTipo' entra en las dependencias a propósito: cuando la carta del
        //  local termina de cargar, esto vuelve a pasar y los tipos que quedaron en
        //  blanco se rellenan. Esa repetición no recuenta nada: la ataja
        //  'lecturaProcesadaRef' al principio del efecto.
    }, [lectura, horaTablet, resolverTipo, tiraLeida]);


    /*  Se devuelve también EN QUÉ PUNTO DEL CENSO va.
     *
     *  Mientras censa, la parrilla está vacía Y ESO ES CORRECTO: se está apuntando lo
     *  que ya estaba para no contarlo como recién llegado. El problema es que una
     *  parrilla vacía porque censa y una parrilla vacía porque la lectura se rompió se
     *  ven exactamente igual, y distinguirlas costaba abrir la consola.
     *
     *  Sacándolo fuera, la ventana puede decirlo en una línea.
     */
    return {
        pedidos: filas,
        censando: lecturasRef.current < LECTURAS_DE_CENSO,
        lecturasDelCenso: Math.min(lecturasRef.current, LECTURAS_DE_CENSO),
        lecturasQueDuraElCenso: LECTURAS_DE_CENSO,

        //  Las claves que el censo apartó por estar ya en pantalla al conectar. No se
        //  pintan; las pide el simulador para no dar por «sin detectar» lo que en
        //  realidad se decidió no seguir.
        yaEstaban: yaEstabanRef.current,
    };
}




/*  Deja una HORA DE RELOJ en 'HH:MM:SS'.
 *
 *  Ojo con para qué sirve esto y para qué NO. Su único cliente es el reloj que devuelve
 *  la tablet por ADB, que siempre viene completo. Los tiempos que lee el modelo en las
 *  tarjetas NO pasan por aquí: no son horas, son cronómetros, y van por
 *  'aSegundosDeCronometro'.
 *
 *  Aquí ponía que con dos partes se tomara como 'HH:MM' «que es lo que muestra una
 *  tarjeta de cocina». Era falso, y mandar los cronómetros por esta función fue el
 *  origen de las horas imposibles que salían en la parrilla. Si algún día vuelve a
 *  hacer falta, que sea para un reloj.
 *
 *  Devuelve '' cuando no hay nada aprovechable: mejor una celda vacía que una hora
 *  inventada.
 */
function normalizarHora(valor) {
    const texto = String(valor ?? '').trim();
    if (!texto) return '';

    const partes = texto.split(':').map(p => p.trim());
    if (partes.length < 2 || partes.length > 3) return '';
    if (partes.some(p => !/^\d{1,2}$/.test(p))) return '';

    const pad = (n) => String(Number(n)).padStart(2, '0');

    //  Con dos partes no se sabe si es 'HH:MM' o 'mm:ss'. Se toma como horas y minutos,
    //  que es lo que muestra una tarjeta de cocina.
    return partes.length === 3
        ? `${pad(partes[0])}:${pad(partes[1])}:${pad(partes[2])}`
        : `${pad(partes[0])}:${pad(partes[1])}:00`;
}


//  'HH:MM:SS' a segundos. Lo ilegible cuenta como cero.
function aSegundos(hora) {
    const texto = normalizarHora(hora);
    if (!texto) return 0;

    const [h, m, s] = texto.split(':').map(Number);
    return h * 3600 + m * 60 + s;
}


//  El parser del cronómetro y el formateador viven en libs/tickets/cronometro.js: los
//  usa también el espejo, para descartar lecturas que no son tickets.


//  Lo que se publica: una COPIA de cada fila, por orden de toma de orden. El porqué de
//  la copia y de ese orden está donde se llama, al final del efecto de la lectura.
function filasOrdenadas(historial) {
    return [...historial.values()]
        .map(fila => ({ ...fila }))
        .sort((a, b) => a.tomaOrdenSegundos - b.tomaOrdenSegundos);
}


//  La del medio, una vez ordenados. Con tres o más, un valor disparatado deja de contar:
//  puede arrastrar la mediana un puesto, pero no llevársela a su terreno.
function mediana(numeros) {
    const ordenados = [...numeros].sort((a, b) => a - b);

    return ordenados[Math.floor(ordenados.length / 2)];
}
