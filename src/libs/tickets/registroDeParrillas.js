/*  EL REGISTRO DE LAS DOS PARRILLAS
 *
 *  Lo que se ve en ROTACIÓN y en PROCESOS se guarda en el equipo según se escribe, y se
 *  recupera al volver a abrir la ventana.
 *
 *  ANTES SE PERDÍA. Las horas que el monitorista escribía a mano vivían en un Map dentro
 *  de la ventana y en ningún sitio más: recargar, cerrar la flotante o que Electron la
 *  reabriera se las llevaba todas, sin aviso y sin forma de recuperarlas.
 *
 *  Se guarda en el almacenamiento del navegador y no en un archivo porque desde una
 *  página no se puede escribir en el disco, y montar un servidor que lo hiciera es abrir
 *  una puerta para escribir archivos: no compensa para unos pocos kilobytes de horas.
 *
 *  UNA LLAVE POR LOCAL, y esto arregla un fallo que ya estaba: las filas de dos
 *  establecimientos usan las mismas claves ('libre-0', 'pedido-tk-48·entree'…), así que
 *  con una sola llave lo anotado en uno se veía en el otro al cambiar de local.
 */


// CLAVE_REGISTRO = «el principio de la llave donde se guarda cada local»
const CLAVE_REGISTRO = 'parrillas';


// MAXIMO_DE_PEDIDOS = «cuántos pedidos se guardan como mucho»
// Un turno largo puede dejar cientos de filas, y el almacenamiento del navegador no es
// infinito. Se guardan los últimos, que son los que alguien va a mirar.
const MAXIMO_DE_PEDIDOS = 400;


// claveDelLocal = «la llave de este local»
// Sin local no hay llave: lo anotado sin saber de quién es no se guarda en ninguna parte.
const claveDelLocal = (localId) => {
    if (!localId) return '';

    return `${CLAVE_REGISTRO}:${localId}`;
}



// readRecord = «leer el registro guardado»
// NUNCA lanza y NUNCA devuelve null: sin nada guardado, o con el almacenamiento bloqueado
// (una ventana privada), devuelve un registro vacío y se trabaja como si fuera la primera vez.
// Recibe: localId (el _id del establecimiento).
// Devuelve: { anotaciones: {}, pedidos: [], guardadoEn: '' }
function readRecord(localId) {

    // vacio = «el registro vacío»
    const vacio = { anotaciones: {}, pedidos: [], guardadoEn: '' };

    // clave = «la llave de este local»
    const clave = claveDelLocal(localId);
    if (!clave) return vacio;

    try {
        // guardado = «lo guardado, tal cual»
        const guardado = localStorage.getItem(clave);
        if (!guardado) return vacio;

        // registro = «el registro»
        const registro = JSON.parse(guardado);

        return {
            anotaciones: registro?.anotaciones ?? {},
            pedidos: Array.isArray(registro?.pedidos) ? registro.pedidos : [],
            guardadoEn: String(registro?.guardadoEn ?? ''),
        };
    }
    catch (error) {
        //  No se apunta en la consola: esto se lee al abrir y llenaría la consola de lo mismo.
        return vacio;
    }
}



// writeRecord = «guardar el registro»
// Escribe el registro entero de un local. NUNCA lanza: si el almacenamiento está lleno o
// bloqueado, devuelve false y quien llame decide si avisar.
// Recibe: localId y registro ({ anotaciones, pedidos }).
// Devuelve: true si quedó guardado.
function writeRecord(localId, registro) {

    // clave = «la llave de este local»
    const clave = claveDelLocal(localId);
    if (!clave) return false;

    try {
        localStorage.setItem(clave, JSON.stringify({
            anotaciones: registro?.anotaciones ?? {},
            pedidos: (registro?.pedidos ?? []).slice(-MAXIMO_DE_PEDIDOS),
            guardadoEn: new Date().toISOString(),
        }));

        return true;
    }
    catch (error) {
        console.log(error);

        return false;
    }
}



// clearRecord = «borrar el registro de un local»
// Se usa desde el botón de limpiar la parrilla. NUNCA lanza.
// Recibe: localId.
// Devuelve: true si quedó borrado.
function clearRecord(localId) {

    // clave = «la llave de este local»
    const clave = claveDelLocal(localId);
    if (!clave) return false;

    try {
        localStorage.removeItem(clave);

        return true;
    }
    catch (error) {
        console.log(error);

        return false;
    }
}



// clearNotes = «quitar las anotaciones de una de las dos parrillas»
// Las dos comparten el mismo almacén y se distinguen por cómo empieza la clave de cada fila:
// 'libre-N' son de Rotación, y 'pedido-…' y 'libre-pedido-N' son de Procesos. Ojo con el orden
// de las comprobaciones: 'libre-pedido-3' TAMBIÉN empieza por 'libre-', así que hay que mirar
// primero si es de procesos.
// Recibe: notes (el Map de la ventana) y cual ('rotacion' | 'procesos').
// Devuelve: un Map NUEVO con lo que se queda.
function clearNotes(notes, cual) {

    // quedan = «las anotaciones que sobreviven»
    const quedan = new Map();

    for (const [clave, valores] of notes) {
        // deProcesos = «esta fila es de la parrilla de procesos»
        const deProcesos = clave.startsWith('pedido-') || clave.startsWith('libre-pedido-');

        // deRotacion = «es de la de rotación»
        const deRotacion = !deProcesos && clave.startsWith('libre-');

        if (cual === 'procesos' && deProcesos) continue;
        if (cual === 'rotacion' && deRotacion) continue;

        quedan.set(clave, valores);
    }

    return quedan;
}



// notesToObject = «las anotaciones, como objeto que se pueda guardar»
// El Map de la ventana no se puede convertir a JSON tal cual.
// Recibe: notes (Map clave de fila → { campo: valor }).
function notesToObject(notes) {

    // objeto = «las anotaciones como objeto»
    const objeto = {};

    for (const [clave, valores] of notes) {
        //  Una fila que se tocó y se volvió a dejar en blanco no se guarda: solo ocuparía sitio.
        if (!valores) continue;

        // conAlgo = «tiene algo escrito»
        let conAlgo = false;
        for (const campo in valores) if (String(valores[campo] ?? '').trim() !== '') conAlgo = true;

        if (conAlgo) objeto[clave] = valores;
    }

    return objeto;
}



// notesToMap = «las anotaciones guardadas, como el Map que usa la ventana»
// Recibe: objeto (lo que devolvió readRecord en 'anotaciones').
function notesToMap(objeto) {

    // notes = «las anotaciones»
    const notes = new Map();

    for (const clave in (objeto ?? {})) notes.set(clave, objeto[clave]);

    return notes;
}



// rowsToRecord = «las filas de la parrilla, como se guardan»
// Todo lo que hace falta para PINTAR la fila igual al volver a abrir, y nada de los apuntes
// internos del seguimiento (votos, ausencias, qué tira la vio): eso solo sirve mientras se está
// leyendo, y guardarlo multiplicaría el tamaño del registro.
// Recibe: rows (las filas que publica la parrilla de procesos).
function rowsToRecord(rows) {

    // record = «las filas, ya recortadas»
    const record = [];

    for (const row of (rows ?? [])) {
        record.push({
            clave: row.clave,
            mesa: row.mesa,
            ticket: row.ticket,
            tipo: row.tipo,
            plato: row.plato ?? '',
            tomaOrden: row.tomaOrden,
            listoTablet: row.listoTablet,
            cerrado: row.cerrado === true,

            //  Para que la fila se pinte igual: la franja de color y la hora en ámbar.
            color: row.color ?? '',
            tomaOrdenAproximada: row.tomaOrdenAproximada === true,

            //  Por aquí se ordena la parrilla: sin esto, lo restaurado saldría en cualquier orden.
            tomaOrdenSegundos: Number.isFinite(row.tomaOrdenSegundos) ? row.tomaOrdenSegundos : null,
        });
    }

    return record;
}



// HORAS_QUE_VALE_EL_REGISTRO = «cuántas horas se siguen enseñando los pedidos guardados»
// Lo bastante para cubrir un turno entero, incluido uno que cruce la medianoche, y no tanto como
// para que los pedidos de ayer aparezcan mezclados con los de hoy. No se cuenta por días: un
// turno de noche se partiría en dos justo a mitad.
const HORAS_QUE_VALE_EL_REGISTRO = 16;


// isRecentRecord = «el registro es de este turno»
// Recibe: guardadoEn (lo que devolvió readRecord) y ahora (una Date, para poder probarlo).
function isRecentRecord(guardadoEn, ahora = new Date()) {
    if (!guardadoEn) return false;

    // cuando = «cuándo se guardó»
    const cuando = new Date(guardadoEn).getTime();
    if (!Number.isFinite(cuando)) return false;

    return (ahora.getTime() - cuando) < HORAS_QUE_VALE_EL_REGISTRO * 3600 * 1000;
}



// mergeRows = «juntar lo guardado con lo de ahora»
// El registro NO se pisa con lo que haya en pantalla: un pedido que ya se despachó y se fue de
// la parrilla tiene que seguir ahí. Manda la fila de ahora cuando la clave coincide: es el mismo
// pedido, y lo de ahora está más al día.
//
// El orden es el mismo que usa la parrilla —por la toma de orden, y el que no la tenga al final—,
// para que lo restaurado y lo que se está leyendo se mezclen sin saltos.
// Recibe: saved (lo que había guardado) y rows (las filas de ahora).
function mergeRows(saved, rows) {

    // porClave = «las filas, por su clave»
    const porClave = new Map();

    for (const row of (saved ?? [])) porClave.set(row.clave, row);
    for (const row of (rows ?? [])) porClave.set(row.clave, row);

    // juntas = «todas las filas»
    const juntas = [...porClave.values()];

    juntas.sort((a, b) => {
        // deA / deB = «la toma de orden de cada una, en segundos»
        const deA = Number.isFinite(a.tomaOrdenSegundos) ? a.tomaOrdenSegundos : Infinity;
        const deB = Number.isFinite(b.tomaOrdenSegundos) ? b.tomaOrdenSegundos : Infinity;

        return deA - deB;
    });

    return juntas;
}



export { readRecord, writeRecord, clearRecord, clearNotes, notesToObject, notesToMap, rowsToRecord, mergeRows, isRecentRecord, MAXIMO_DE_PEDIDOS, HORAS_QUE_VALE_EL_REGISTRO };
