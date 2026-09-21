import { LECTURAS_POR_RECORRIDO } from '../tickets/configLectura.js';
import { aSegundosDeCronometro, aTexto } from '../tickets/cronometro.js';


// DE DÓNDE SALE CADA HORA DE LA PARRILLA DE PROCESOS
//   Toma de orden    = reloj de la tablet − cronómetro de la tarjeta. Se vota (ver voteOrderTime).
//   Listo en tablet  = lo PRIMERO que ocurra: se le ve ponerse verde (stampReadyIfChanged)
//                      o desaparece de la pantalla, confirmado por SU tira (countAbsence).
//   Listo en cocina y Entrega de plato = A MANO: la tablet no da ninguna señal de ellas.
//   El color (amarillo / rojo) es la alarma de edad de Toast: solo pinta la fila, NO sella ninguna hora.
//   Todas las horas de una fila son del reloj de la TABLET: mezclar el del equipo metía dos husos en la misma fila.



// REOPEN_ROUNDS = «recorridos de reapertura»
// Cuánto puede faltar un ticket y seguir siendo el MISMO pedido. Por debajo, una lectura se lo saltó y se
// reabre con su historia. Por encima, el pedido terminó y lo que vuelva con esa clave es OTRO pedido.
// Va en recorridos de pantalla y no en minutos para no depender de lo que tarde el modelo. Es generoso a
// propósito: esperar de más solo retrasa un cierre; esperar de menos inventa una fila duplicada.
const REOPEN_ROUNDS = 12;

// REOPEN_READINGS = «lecturas de reapertura»
const REOPEN_READINGS = REOPEN_ROUNDS * LECTURAS_POR_RECORRIDO;

// ABSENCES_TO_CLOSE = «ausencias para dar por cerrado»
// Dos y no una: el modelo se deja tickets a menudo, y con una sola 'Listo en tablet' se llenaba de horas falsas.
const ABSENCES_TO_CLOSE = 2;

// CENSUS_READINGS_WITHOUT_DATA = «lecturas del censo cuando no llega el dato de las tiras»
const CENSUS_READINGS_WITHOUT_DATA = LECTURAS_POR_RECORRIDO;

// MAX_ORDER_TIME_VOTES = «máximo de votos de la toma de orden»
const MAX_ORDER_TIME_VOTES = 5;

// SECONDS_PER_DAY = «segundos de un día»
const SECONDS_PER_DAY = 86400;



// createEmptyRow = «crear una fila vacía»
// Una fila de la parrilla de procesos, sin datos. Estos son TODOS los campos de una fila.
// Es una función y no un objeto suelto para que cada fila estrene su propio array de votos.
// Recibe: clave (la identidad del pedido).
function createEmptyRow(clave) {
    return {
        clave: clave,
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

        // en qué número de lectura se cerró (en lecturas, no en horas: ver REOPEN_ROUNDS)
        cerradoEn: 0,

        // De aquí para abajo no se pinta nada: son los apuntes del seguimiento.
        // el cronómetro en crudo
        segundosDeVida: 0,

        // los votos de la toma de orden (ver voteOrderTime)
        candidatosTomaOrden: [],

        // cómo estaba 'listo' la última vez que se le LEYÓ (null = todavía nunca)
        vistoAlgunaVez: false,
        ultimoListo: null,

        // la toma de orden en segundos CON SIGNO (negativo = de ayer): por aquí se ordena la parrilla.
        // Infinity y no 0: una fila sin hora se va al final, en vez de colarse como la más antigua.
        tomaOrdenSegundos: Infinity,

        // true = la toma de orden es una estimación: se le vio por primera vez ya listo
        tomaOrdenAproximada: false,

        // cuántas veces seguidas lo ha echado en falta SU tira, y la hora de la primera
        ausenciasSeguidas: 0,
        faltaDesde: '',

        // qué tira lo vio por última vez: es la única que puede echarlo en falta
        tira: null,

        // true = 'Listo en tablet' se selló por desaparecer. Si reaparece, esa hora se retira.
        listoPorAusencia: false,

        // el canal del pedido (Online Ordering…): no se pinta, ayuda a resolver el tipo
        canal: '',
    };
}



// createEmptyGrid = «crear la parrilla vacía»
// La parrilla antes de la primera lectura.
// Devuelve: { rows, alreadyThere, readingsCount, census, connectionSeconds, knownStrips, lastTickets }
function createEmptyGrid() {
    return {
        // rows = «las filas»: Map clave → fila. Un pedido que termina NO se borra: se marca cerrado.
        rows: new Map(),

        // alreadyThere = «los que ya estaban»: las claves que el censo apartó al conectar
        alreadyThere: new Set(),

        // readingsCount = «cuántas lecturas buenas van». Fecha los cierres ('cerradoEn').
        readingsCount: 0,

        // census = «el censo»: si ya terminó y cuántas lecturas se gastaron en él
        census: { done: false, readings: 0 },

        // connectionSeconds = «la hora de la tablet en la primera lectura, en segundos» (null = aún no se sabe)
        connectionSeconds: null,

        // knownStrips = «las tiras conocidas»: en cuántas se corta la pantalla (null = aún no llegó el dato)
        knownStrips: null,

        // lastTickets = «la última lista procesada»
        lastTickets: null,
    };
}



// copyGrid = «copiar la parrilla»
// La copia sobre la que trabaja updateProcessGrid, para no tocar la parrilla que recibe.
// Las filas de dentro NO se copian aquí: cada regla copia la fila que cambia ({ ...row }).
function copyGrid(grid) {
    return {
        rows: new Map(grid.rows),
        alreadyThere: new Set(grid.alreadyThere),
        readingsCount: grid.readingsCount,
        census: { ...grid.census },
        connectionSeconds: grid.connectionSeconds,
        knownStrips: grid.knownStrips,
        lastTickets: grid.lastTickets,
    };
}



// clearGrid = «vaciar la parrilla»
// Para el cambio de local: se tiran las filas, el censo y los que ya estaban.
// Recibe: grid (la parrilla de hasta ahora).
// Devuelve: una parrilla vacía que conserva lo que es de la TABLET y no del local.
function clearGrid(grid) {

    // newGrid = «la parrilla nueva»
    const newGrid = createEmptyGrid();

    // Cambia el local, no la tablet que se mira: las tiras son las mismas.
    newGrid.knownStrips = grid.knownStrips;

    // Y si vuelve a llegar la MISMA lista de antes, no es una lectura nueva.
    newGrid.lastTickets = grid.lastTickets;

    return newGrid;
}



// isStripCount = «es un número de tiras»
// Un entero de uno en adelante. Lo demás (undefined, null, 0, '3'…) cuenta como «no llegó el dato».
const isStripCount = (value) => {
    return Number.isInteger(value) && value > 0;
}



// getClockSeconds = «pasar la hora del reloj a segundos»
// Solo para el RELOJ de la tablet ('HH:MM:SS' o 'HH:MM'). Los cronómetros de las tarjetas van por aSegundosDeCronometro.
// Devuelve: los segundos, o 0 si la hora no se entiende.
function getClockSeconds(time) {

    // text = «el texto de la hora»
    const text = String(time ?? '').trim();
    if (!text) return 0;

    // parts = «las partes de la hora»
    const parts = text.split(':');
    if (parts.length < 2 || parts.length > 3) return 0;

    for (const part of parts) {
        if (!/^\d{1,2}$/.test(part.trim())) return 0;
    }

    // hours, minutes, seconds = «horas, minutos y segundos»
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    let seconds = 0;
    if (parts.length === 3) seconds = Number(parts[2]);

    return hours * 3600 + minutes * 60 + seconds;
}



// getOrderTimeText = «el texto de la toma de orden»
// Recibe: orderSeconds (la toma de orden en segundos con signo; negativo = el pedido es de ayer).
// Devuelve: 'HH:MM:SS'. El ajuste de la medianoche se hace solo aquí, al final: hacerlo antes de votar
// mezclaría un 23:5x con un 00:0x y la mediana saldría por el otro extremo del reloj.
function getOrderTimeText(orderSeconds) {

    if (orderSeconds >= 0) return aTexto(orderSeconds);

    return aTexto(orderSeconds + SECONDS_PER_DAY);
}



// getMedian = «sacar la mediana»
// La del medio, una vez ordenados. Con tres o más, un valor disparatado deja de contar.
function getMedian(numbers) {

    // sorted = «ordenados»
    const sorted = [...numbers].sort((a, b) => a - b);

    return sorted[Math.floor(sorted.length / 2)];
}



// getCensusLength = «lo que dura el censo»
// Una lectura buena por cada tira en que se corta ESTA pantalla. Ni una más: en las de sobra la pantalla ya
// está mirada entera, y lo único que apartarían son pedidos recién llegados, que son los que hay que seguir.
const getCensusLength = (knownStrips) => {
    if (knownStrips === null) return CENSUS_READINGS_WITHOUT_DATA;

    return knownStrips;
}



// countCensusReading = «contar la lectura del censo»
// EL CENSO: al conectar, la pantalla ya trae pedidos de antes. De esos no se sabe cuándo entraron, así que
// durante el primer recorrido completo solo se apunta qué había, para no seguirlo.
// Recibe: census ({ done, readings }) y censusLength (cuántas lecturas dura).
// Devuelve: { isCensus: ¿esta lectura es del censo?, census: el censo con esta lectura ya contada }
function countCensusReading(census, censusLength) {

    // isCensus = «esta lectura es del censo». Se mira lo que se LLEVABA, antes de contar esta.
    const isCensus = !census.done && census.readings < censusLength;

    // newCensus = «el censo nuevo»
    const newCensus = { ...census };

    if (isCensus) newCensus.readings = census.readings + 1;

    // 'done' es un cerrojo, y se echa en cuanto las lecturas cubren la pantalla (sin esperar a la siguiente).
    // Un censo TERMINADO no se reabre aunque la pantalla pase a cortarse en más tiras: si se reabriera, los
    // pedidos que ya se siguen caerían en «ya estaban» y se cerrarían con una hora falsa.
    if (newCensus.readings >= censusLength) newCensus.done = true;

    return { isCensus, census: newCensus };
}



// getSecondsWatching = «los segundos que llevamos mirando»
// Recibe: connectionSeconds (el reloj de la tablet en la primera lectura) y clockNow (el de ahora). null = no se sabe.
// Devuelve: el tiempo TRANSCURRIDO, o null. Transcurrido y no la hora: así cruzar la medianoche no descuadra nada.
function getSecondsWatching(connectionSeconds, clockNow) {

    if (connectionSeconds === null || clockNow === null) return null;

    return (clockNow - connectionSeconds + SECONDS_PER_DAY) % SECONDS_PER_DAY;
}



// wasJustRead = «se le acaba de leer»
// Cada entrega trae la lista COMPLETA: los de la tira recién leída y, ARRASTRADOS, los de las demás tiras como
// quedaron en SU lectura. El cronómetro y el 'listo' de un arrastrado son de otra captura: con la hora de ahora
// retrasaban la toma de orden. De un arrastrado solo se toma que SIGUE EN PANTALLA.
const wasJustRead = (ticket, strip) => {
    if (ticket.tira === undefined || ticket.tira === null) return true;

    return ticket.tira === strip;
}



// arrivedWhileWatching = «llegó con nosotros mirando»
// Durante el censo NO se aparta lo que entra con la ventana ya conectada: si lleva esperando MENOS de lo que
// llevamos mirando, es nuevo y se sabe cuándo entró. Uno ya listo no cuenta: Toast le congela el contador.
// Recibe: ticket (leído AHORA por su tira) y secondsWatching (lo que llevamos mirando, o null).
function arrivedWhileWatching(ticket, secondsWatching) {

    if (ticket.listo === true) return false;
    if (secondsWatching === null) return false;

    // waitSeconds = «lo que lleva esperando»
    const waitSeconds = aSegundosDeCronometro(ticket.tiempo);
    if (waitSeconds === null) return false;

    return waitSeconds < secondsWatching;
}



// wasClosedLongAgo = «se cerró hace mucho»
// ¿El mismo pedido, u otro? La mesa 12 pide a la una y su ticket se cierra; a las dos pide otra cosa y cae en
// la misma clave. Reabrir sin preguntar le dejaba al pedido nuevo las horas del viejo.
const wasClosedLongAgo = (row, readingsCount) => {
    if (!row.cerrado || !row.cerradoEn) return false;

    return (readingsCount - row.cerradoEn) > REOPEN_READINGS;
}



// archiveRow = «archivar la fila»
// El pedido viejo se queda en la parrilla con sus horas, bajo otra clave: 'clave#lectura en que se cerró'.
function archiveRow(row) {
    return { ...row, clave: `${row.clave}#${row.cerradoEn}` };
}



// startNewOrder = «empezar un pedido nuevo»
// Empieza de cero, heredando solo lo que DESCRIBE al pedido y no lo que le pasó.
function startNewOrder(row) {

    // newRow = «la fila nueva»
    const newRow = createEmptyRow(row.clave);

    newRow.mesa = row.mesa;
    newRow.ticket = row.ticket;
    newRow.plato = row.plato;
    newRow.tipo = row.tipo;

    return newRow;
}



// reopenIfBack = «reabrir si ha vuelto»
// Volver a verlo cancela la cuenta de ausencias: no se había ido, lo habíamos perdido de vista.
// Si 'Listo en tablet' se selló POR DESAPARECER, esa hora queda desmentida y se retira. La del verde no se toca.
function reopenIfBack(row) {

    // newRow = «la fila nueva»: una copia, para no tocar la que llega
    const newRow = { ...row };

    newRow.cerrado = false;
    newRow.cerradoEn = 0;
    newRow.ausenciasSeguidas = 0;
    newRow.faltaDesde = '';

    if (row.listoPorAusencia) {
        newRow.listoTablet = '';
        newRow.listoPorAusencia = false;
    }

    return newRow;
}



// refreshRowData = «refrescar los datos de la fila»
// Los datos se refrescan siempre que la lectura traiga algo: una vuelta puede leer mal y la siguiente bien.
// Lo que venga vacío NO borra lo que ya había.
// Recibe: row, ticket y strip (la tira que se acaba de leer).
function refreshRowData(row, ticket, strip) {

    // newRow = «la fila nueva»: una copia, para no tocar la que llega
    const newRow = { ...row };

    // la tira que lo acaba de ver pasa a ser la única que puede echarlo en falta
    newRow.tira = ticket.tira ?? strip;

    if (ticket.mesa) newRow.mesa = ticket.mesa;
    if (ticket.ticket) newRow.ticket = ticket.ticket;
    if (ticket.plato) newRow.plato = ticket.plato;
    if (ticket.canal) newRow.canal = ticket.canal;

    // el color solo pinta la franja de la fila: no sella nada
    if (ticket.color) newRow.color = ticket.color;

    return newRow;
}



// resolveRowType = «resolver el tipo de la fila»
// El tipo se RESUELVE, no se copia, y se reintenta mientras siga vacío (la carta puede cargar después).
// En cuanto sale, se queda fijo. El canal va antes que la mesa: sin mesa, ahí va el ticket, que no dice el tipo.
// Recibe: row, pista (el rótulo que leyó el modelo, o undefined) y resolveType (de crearResolutorDeTipo).
function resolveRowType(row, pista, resolveType) {

    if (row.tipo) return row;

    // newRow = «la fila nueva»: una copia, para no tocar la que llega
    const newRow = { ...row };

    newRow.tipo = resolveType({ mesa: row.canal || row.mesa, plato: row.plato, pista: pista });

    return newRow;
}



// voteOrderTime = «votar la toma de orden»
// Tiempo de vida = el cronómetro tal cual. Toma de orden = reloj de la tablet − cronómetro.
// LA TOMA DE ORDEN SE VOTA: esa resta tiene que dar siempre lo mismo para un pedido, así que una lectura mala
// se delata sola. Se guardan los primeros votos y vale la mediana: un dígito mal leído ya no fija mal la hora.
// Recibe: row, ticket (leído AHORA) y tabletTime (el reloj de la tablet, 'HH:MM:SS').
function voteOrderTime(row, ticket, tabletTime) {

    // waitSeconds = «lo que lleva esperando»
    const waitSeconds = aSegundosDeCronometro(ticket.tiempo);

    // Cronómetro ilegible: ni se inventa nada ni se borra lo que ya había.
    if (waitSeconds === null) return row;

    // newRow = «la fila nueva»: una copia, para no tocar la que llega
    const newRow = { ...row };

    newRow.segundosDeVida = waitSeconds;
    newRow.tiempoDeVida = aTexto(waitSeconds);

    // clockSeconds = «el reloj de la tablet, en segundos». 0 = no se entiende (y las 00:00:00 en punto): no se vota.
    const clockSeconds = getClockSeconds(tabletTime);
    if (!clockSeconds) return newRow;

    // vote = «el voto de esta lectura». Con signo y sin ajustar la medianoche: negativo = de ayer.
    const vote = clockSeconds - waitSeconds;

    // UN TICKET YA LISTO NO VOTA: al despacharse, Toast congela el contador de su cabecera, y desde ahí
    // «reloj − cronómetro» da una hora cada vez más tardía.
    if (ticket.listo !== true && row.candidatosTomaOrden.length < MAX_ORDER_TIME_VOTES) {
        newRow.candidatosTomaOrden = [...row.candidatosTomaOrden, vote];
    }

    if (newRow.candidatosTomaOrden.length > 0) {
        newRow.tomaOrdenSegundos = getMedian(newRow.candidatosTomaOrden);
        newRow.tomaOrdenAproximada = false;
    }
    else if (row.tomaOrdenSegundos === Infinity) {
        // Nunca se le vio sin terminar: se guarda UNA estimación, la primera (la de menos retraso),
        // y se marca como aproximada para que nadie la tome por medida.
        newRow.tomaOrdenSegundos = vote;
        newRow.tomaOrdenAproximada = true;
    }

    if (newRow.tomaOrdenSegundos !== Infinity) {
        newRow.tomaOrden = getOrderTimeText(newRow.tomaOrdenSegundos);
    }

    return newRow;
}



// stampReadyIfChanged = «sellar el listo si ha cambiado»
// LISTO EN TABLET, PRIMERA VÍA: se le ve ponerse verde (o completar sus palomitas).
// SOLO SE SELLA UN CAMBIO QUE SE HAYA VISTO OCURRIR: ver un ticket que YA estaba listo no dice cuándo se puso
// listo, dice cuándo lo miramos. La primera lectura solo apunta el estado. Una hora ya sellada no se pisa.
// Recibe: row, ticket (leído AHORA) y now (la hora con la que se sella).
function stampReadyIfChanged(row, ticket, now) {

    // newRow = «la fila nueva»: una copia, para no tocar la que llega
    const newRow = { ...row };

    // wasSeenUnfinished = «se le vio sin terminar»
    const wasSeenUnfinished = row.vistoAlgunaVez === true && row.ultimoListo === false;

    if (ticket.listo === true && wasSeenUnfinished && !row.listoTablet) {
        newRow.listoTablet = now;
    }

    newRow.ultimoListo = ticket.listo === true;
    newRow.vistoAlgunaVez = true;

    return newRow;
}



// canBeMissedBy = «lo puede echar en falta»
// Solo lo puede echar en falta la tira que lo tenía a la vista: las demás miran otra zona de la pantalla.
// Antes contaba cualquier tira, y un solo despiste del modelo cerraba el pedido cinco segundos después.
const canBeMissedBy = (row, strip) => {
    if (row.cerrado) return false;

    return row.tira === strip;
}



// countAbsence = «contar una ausencia»
// LISTO EN TABLET, SEGUNDA VÍA: el ticket desaparece de la pantalla (la cocina lo despachó).
// No se sella a la primera (puede que el modelo no lo viera): se cierra cuando se repite, con la hora de la
// PRIMERA ausencia. Se marca cerrado, NO se borra: desaparecer es justo lo que hace un pedido al terminarse.
// Recibe: row, now (la hora de esta lectura) y readingsCount (el número de esta lectura).
function countAbsence(row, now, readingsCount) {

    // newRow = «la fila nueva»: una copia, para no tocar la que llega
    const newRow = { ...row };

    newRow.ausenciasSeguidas = row.ausenciasSeguidas + 1;

    if (!row.faltaDesde) newRow.faltaDesde = now;

    if (newRow.ausenciasSeguidas < ABSENCES_TO_CLOSE) return newRow;

    newRow.cerrado = true;
    newRow.cerradoEn = readingsCount;

    // La hora de haberlo visto ponerse verde no se pisa: ocurrió antes y es la buena.
    if (!row.listoTablet) {
        newRow.listoTablet = newRow.faltaDesde;
        newRow.listoPorAusencia = true;
    }

    return newRow;
}



// fillEmptyTypes = «rellenar los tipos vacíos»
// Para cuando termina de cargar la carta del local: los tipos que quedaron en blanco se vuelven a intentar.
// Recibe: rows (Map clave → fila) y resolveType.
// Devuelve: un Map nuevo.
function fillEmptyTypes(rows, resolveType) {

    // newRows = «las filas nuevas»
    const newRows = new Map();

    for (const [clave, row] of rows) {
        newRows.set(clave, resolveRowType(row, undefined, resolveType));
    }

    return newRows;
}



// updateProcessGrid = «actualizar la parrilla de procesos»
// STEP 6. ANALIZA la lectura, la COMPARA con lo que ya se sabía y devuelve la parrilla ACTUALIZADA.
// PURA: no modifica 'grid', devuelve otra. Con un matiz: la lista de tickets se compara POR REFERENCIA (paso 3).
// Recibe: grid (la parrilla de hasta ahora),
//         reading { tickets: los de mergeStripTickets, hora: 'HH:MM:SS' de la tablet, tira: la que se leyó
//                   (null = no hubo lectura: el arranque o una desconexión), tiras: en cuántas se corta la pantalla },
//         context { resolveType: la función de crearResolutorDeTipo, deviceTime: 'HH:MM:SS' del equipo }.
// Devuelve: la parrilla nueva, con la misma forma que createEmptyGrid.
function updateProcessGrid(grid, reading, context) {

    // newGrid = «la parrilla nueva»: se trabaja sobre una copia
    const newGrid = copyGrid(grid);

    // 1. Se apunta en cuántas tiras se corta la pantalla, aunque esta vuelta no traiga lectura.
    //    Una desconexión deja de mandarlo: sin este recuerdo un censo a medias pasaría de «2/3» a «2/5».
    if (isStripCount(reading.tiras)) newGrid.knownStrips = reading.tiras;

    // 2. Sin lista de tickets no hay nada que analizar.
    if (!Array.isArray(reading.tickets)) return newGrid;

    // 3. ¿Es la MISMA lista de la vez anterior? Entonces lo único que cambió es la carta: se rellenan los
    //    tipos vacíos y nada más. Ni censo, ni horas, ni ausencias: todo eso ya se contó.
    //    El MISMO array (===), no uno igual: mergeStripTickets crea uno nuevo en cada vuelta, así que un
    //    array repetido solo puede ser el hook volviendo a pasar porque cargó la carta.
    if (grid.lastTickets === reading.tickets) {
        newGrid.rows = fillEmptyTypes(grid.rows, context.resolveType);
        return newGrid;
    }

    newGrid.lastTickets = reading.tickets;

    // 4. Sin tira no hubo lectura: es la lista vacía del arranque o de una desconexión. Tratarla como
    //    «pantalla sin tickets» gastaba una vuelta del censo y daba por desaparecidos todos los pedidos.
    if (reading.tira === null || reading.tira === undefined) return newGrid;


    // 5. ANALIZA: qué lectura es esta
    // now = «la hora de ahora»: la de la tablet. La del equipo, solo si ADB no contestó.
    const now = reading.hora || context.deviceTime;

    newGrid.readingsCount = grid.readingsCount + 1;

    // censusResult = «el resultado del censo»
    const censusResult = countCensusReading(grid.census, getCensusLength(newGrid.knownStrips));
    newGrid.census = censusResult.census;

    // clockNow = «el reloj de la tablet ahora, en segundos» (null = ADB no dio la hora)
    let clockNow = null;
    if (reading.hora) clockNow = getClockSeconds(reading.hora);

    // la primera lectura buena fija «cuándo llegamos»
    if (grid.connectionSeconds === null) newGrid.connectionSeconds = clockNow;

    // secondsWatching = «los segundos que llevamos mirando»
    const secondsWatching = getSecondsWatching(newGrid.connectionSeconds, clockNow);


    // 6. COMPARA cada ticket leído con su fila
    // seenNow = «los que se han visto ahora»
    const seenNow = new Set();

    for (const ticket of reading.tickets) {

        // La clave la fabricó mergeStripTickets. Sin ella no hay a qué fila atribuir lo leído.
        const clave = ticket?.clave ?? ticket?.mesa;
        if (!clave) continue;

        // justRead = «se le acaba de leer» (o viene arrastrado de otra tira)
        const justRead = wasJustRead(ticket, reading.tira);

        // 6.1 EL CENSO: lo que ya estaba al conectar se aparta, salvo que haya entrado con nosotros mirando.
        // isUnknown = «todavía no se sabe nada de él»: ni tiene fila ni está apartado
        const isUnknown = !newGrid.rows.has(clave) && !newGrid.alreadyThere.has(clave);

        // isNewForCensus = «el censo lo ve por primera vez»
        const isNewForCensus = censusResult.isCensus && isUnknown;

        // Solo decide una lectura de AHORA: un arrastrado trae el cronómetro de entonces y parecería más joven.
        if (isNewForCensus && !justRead) continue;

        // No entró con nosotros mirando: ya estaba, y se aparta.
        if (isNewForCensus && !arrivedWhileWatching(ticket, secondsWatching)) newGrid.alreadyThere.add(clave);

        // Lo que ya estaba no se sigue nunca: cualquier tiempo suyo sería inventado.
        if (newGrid.alreadyThere.has(clave)) continue;

        seenNow.add(clave);

        // row = «la fila del pedido»: la que ya había, o una nueva
        let row = newGrid.rows.get(clave) ?? createEmptyRow(clave);

        // 6.2 Vuelve a aparecer: ¿el mismo pedido, u otro?
        if (wasClosedLongAgo(row, newGrid.readingsCount)) {
            // archivedRow = «la fila archivada»
            const archivedRow = archiveRow(row);
            newGrid.rows.set(archivedRow.clave, archivedRow);

            row = startNewOrder(row);
        }

        // 6.3 Está en pantalla: se reabre, se refrescan sus datos y se resuelve su tipo
        row = reopenIfBack(row);
        row = refreshRowData(row, ticket, reading.tira);
        row = resolveRowType(row, ticket.tipo, context.resolveType);

        // 6.4 Las horas: solo con una lectura de AHORA
        if (justRead) {
            row = voteOrderTime(row, ticket, reading.hora);
            row = stampReadyIfChanged(row, ticket, now);
        }

        newGrid.rows.set(clave, row);
    }


    // 7. ACTUALIZA los que ya no están en pantalla
    //    (cambiar el valor de una clave que ya existe no altera el recorrido del Map)
    for (const [clave, row] of newGrid.rows) {
        if (seenNow.has(clave)) continue;
        if (!canBeMissedBy(row, reading.tira)) continue;

        newGrid.rows.set(clave, countAbsence(row, now, newGrid.readingsCount));
    }

    return newGrid;
}



// getGridRows = «sacar las filas de la parrilla»
// Las filas para pintar. Son COPIAS: con los mismos objetos React no vería ningún cambio.
// Ordenadas por toma de orden, el primero que entró arriba, que es como se lee un turno. Se ordena por
// 'tomaOrdenSegundos' (con signo): lo de ayer es negativo y cae arriba solo, y no envejece como el cronómetro.
function getGridRows(grid) {

    // rows = «las filas»
    const rows = [];

    for (const row of grid.rows.values()) {
        rows.push({ ...row, candidatosTomaOrden: [...row.candidatosTomaOrden] });
    }

    rows.sort((a, b) => a.tomaOrdenSegundos - b.tomaOrdenSegundos);

    return rows;
}



// getCensusState = «el estado del censo»
// Para que la ventana pueda decir POR QUÉ la parrilla está vacía: mientras censa está vacía y es correcto.
// Recibe: grid y strips (en cuántas tiras se corta la pantalla AHORA; manda sobre el recuerdo de la parrilla).
// Devuelve: { censando, lecturasDelCenso, lecturasQueDuraElCenso, yaEstaban: Set de claves apartadas }
//           ('yaEstaban' es el Set de la propia parrilla, no una copia: es solo para leerlo)
function getCensusState(grid, strips) {

    // censusLength = «lo que dura el censo». Una vez hecho, las lecturas que de verdad se gastaron en él.
    let censusLength = getCensusLength(grid.knownStrips);

    if (isStripCount(strips)) censusLength = strips;
    if (grid.census.done) censusLength = grid.census.readings;

    return {
        censando: !grid.census.done && grid.census.readings < censusLength,
        lecturasDelCenso: Math.min(grid.census.readings, censusLength),
        lecturasQueDuraElCenso: censusLength,
        yaEstaban: grid.alreadyThere,
    };
}


export { createEmptyGrid, clearGrid, updateProcessGrid, getGridRows, getCensusState };
