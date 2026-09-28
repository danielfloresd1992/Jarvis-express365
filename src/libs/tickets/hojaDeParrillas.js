import { getTimeReport } from '../date_time/calculate_time.js';


/*  LAS DOS PARRILLAS, EN UNA HOJA DE CÁLCULO
 *
 *  Un CSV con las dos tablas, una debajo de la otra, encabezado por el establecimiento y la
 *  fecha. Se abre con doble clic en Excel o en cualquier hoja de cálculo.
 *
 *  CSV y no .xlsx porque un .xlsx de verdad necesita una librería —y esto tiene que funcionar
 *  en el equipo del restaurante sin instalar nada—. Un CSV lo abre todo el mundo.
 *
 *  DOS DETALLES QUE PARECEN TONTERÍAS Y NO LO SON:
 *
 *  · El separador es el PUNTO Y COMA. Excel en español espera ese, no la coma: con comas
 *    mete la fila entera en una sola casilla.
 *  · El archivo empieza por la marca de orden de bytes. Sin ella Excel abre el CSV como si no
 *    fuera UTF-8 y destroza los acentos y las eñes.
 */


// SEPARADOR = «lo que separa una casilla de la siguiente»
const SEPARADOR = ';';


// MARCA_UTF8 = «la marca de orden de bytes»
const MARCA_UTF8 = '﻿';


// casilla = «un valor, escrito como casilla del CSV»
// Todo entre comillas: así un punto y coma o un salto de línea dentro de un texto no parte la
// fila. Las comillas de dentro se duplican, que es como se escapan en un CSV.
const casilla = (valor) => {
    if (valor === null || valor === undefined) return '""';

    return `"${String(valor).replace(/"/g, '""')}"`;
}


// fila = «una fila del CSV»
const fila = (valores) => valores.map(casilla).join(SEPARADOR);


// FILAS_DE_ROTACION = «cuántas filas tiene la parrilla de rotación»
// Es un bloque fijo de 30, como en Parrilla.jsx.
const FILAS_DE_ROTACION = 30;


// COLUMNAS_DE_ROTACION = «los encabezados de la parrilla de rotación»
const COLUMNAS_DE_ROTACION = ['Mesa', 'Ocupa', 'Primera atención', 'Demora', 'Desocupa', 'Limpieza', 'Demora'];


// COLUMNAS_DE_PROCESOS = «los encabezados de la parrilla de procesos»
const COLUMNAS_DE_PROCESOS = ['Mesa', 'N de tiket', 'Tipo de plato', 'Toma de orden', 'Listo en tablet', 'Listo en cocina', 'Entrega de plato'];


// demoraEntre = «el texto de la columna Demora»
// La misma cuenta que hace la parrilla en pantalla, para que el archivo y la pantalla digan lo
// mismo. Sin las dos horas no hay nada que calcular y la casilla se queda vacía.
const demoraEntre = (desde, hasta, limite) => {
    if (!desde || !hasta) return '';

    // reporte = «lo que salió de la cuenta»
    const reporte = getTimeReport(desde, hasta, limite);

    if (reporte.exceeded === null) return reporte.timeTotal;

    return `${reporte.timeTotal} (${reporte.exceeded ? 'fuera de plazo' : 'en plazo'})`;
}


// rowsOfRotation = «las filas de la parrilla de rotación»
// Esa parrilla se llena ENTERA a mano: todo lo suyo está en las anotaciones, no en ninguna
// lectura. Se saltan las filas en blanco, que son la mayoría.
// Recibe: leerAnotacion, limiteAtencion y limiteLimpieza.
function rowsOfRotation(leerAnotacion, limiteAtencion, limiteLimpieza) {

    // filas = «las filas con algo escrito»
    const filas = [];

    for (let i = 0; i < FILAS_DE_ROTACION; i++) {
        // anotado = «lo escrito en esta fila»
        const anotado = leerAnotacion?.(`libre-${i}`) ?? {};

        // conAlgo = «tiene algo escrito»
        let conAlgo = false;
        for (const campo in anotado) if (String(anotado[campo] ?? '').trim() !== '') conAlgo = true;

        if (!conAlgo) continue;

        filas.push([
            anotado.mesa ?? '',
            anotado.horaOcupa ?? '',
            anotado.horaAtencion ?? '',
            demoraEntre(anotado.horaOcupa, anotado.horaAtencion, limiteAtencion),
            anotado.horaDesocupa ?? '',
            anotado.horaLimpieza ?? '',
            demoraEntre(anotado.horaDesocupa, anotado.horaLimpieza, limiteLimpieza),
        ]);
    }

    return filas;
}


// rowsOfProcesses = «las filas de la parrilla de procesos»
// Aquí manda lo escrito a mano sobre lo que leyó la IA, igual que en pantalla: si alguien
// corrigió un dato, es el suyo el que vale.
// Recibe: rows (las filas que se están pintando) y leerAnotacion.
function rowsOfProcesses(rows, leerAnotacion) {

    // filas = «las filas»
    const filas = [];

    for (const row of (rows ?? [])) {
        // anotado = «lo escrito a mano en esta fila»
        const anotado = leerAnotacion?.(`pedido-${row.clave}`) ?? {};

        // valor = «lo que va en una casilla»
        const valor = (campo) => anotado[campo] ?? row[campo] ?? '';

        filas.push([
            valor('mesa'),
            valor('ticket'),
            valor('tipo'),
            valor('tomaOrden'),
            valor('listoTablet'),
            valor('listoCocina'),
            valor('entregaPlato'),
        ]);
    }

    //  Y las filas libres de esa parrilla, que también se escriben a mano.
    for (let i = 0; i < 10; i++) {
        const anotado = leerAnotacion?.(`libre-pedido-${i}`) ?? {};

        let conAlgo = false;
        for (const campo in anotado) if (String(anotado[campo] ?? '').trim() !== '') conAlgo = true;

        if (!conAlgo) continue;

        filas.push([
            anotado.mesa ?? '', anotado.ticket ?? '', anotado.tipo ?? '',
            anotado.tomaOrden ?? '', anotado.listoTablet ?? '', anotado.listoCocina ?? '', anotado.entregaPlato ?? '',
        ]);
    }

    return filas;
}


// buildSpreadsheet = «armar la hoja de cálculo»
// PURA: solo con los datos, sin tocar el documento. Devuelve el texto del CSV.
// Recibe: { establecimiento, ahora (una Date), procesos (las filas que se pintan), leerAnotacion,
//           limiteAtencion, limiteLimpieza }.
function buildSpreadsheet({ establecimiento, ahora = new Date(), procesos, leerAnotacion, limiteAtencion, limiteLimpieza }) {

    // rotacion = «las filas de rotación»  ·  procesados = «las de procesos»
    const rotacion = rowsOfRotation(leerAnotacion, limiteAtencion, limiteLimpieza);
    const procesados = rowsOfProcesses(procesos, leerAnotacion);

    // lineas = «las líneas del archivo»
    const lineas = [
        fila(['Establecimiento', establecimiento || '(sin establecimiento)']),
        fila(['Fecha', ahora.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })]),
        fila(['Hora', ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })]),
        '',
        fila(['ROTACIÓN', `${rotacion.length} mesas`]),
        fila(COLUMNAS_DE_ROTACION),
    ];

    for (const linea of rotacion) lineas.push(fila(linea));
    if (rotacion.length === 0) lineas.push(fila(['(sin nada anotado)']));

    lineas.push('');
    lineas.push(fila(['PROCESOS', `${procesados.length} pedidos`]));
    lineas.push(fila(COLUMNAS_DE_PROCESOS));

    for (const linea of procesados) lineas.push(fila(linea));
    if (procesados.length === 0) lineas.push(fila(['(sin ningún pedido)']));

    //  Con retorno de carro: es lo que espera Excel en un CSV.
    return MARCA_UTF8 + lineas.join('\r\n') + '\r\n';
}


// buildFileName = «el nombre del archivo»
// Lleva el establecimiento y la fecha, que es por lo que se busca un archivo de estos meses
// después. Se le quitan los caracteres que Windows no deja en un nombre.
function buildFileName(establecimiento, ahora = new Date()) {

    // nombre = «el nombre del local, ya limpio»
    const nombre = String(establecimiento || 'sin-establecimiento')
        .replace(/[\\/:*?"<>|]/g, '')
        .trim()
        .replace(/\s+/g, '-');

    // fecha = «la fecha, en orden de año a día para que los archivos se ordenen solos»
    const fecha = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;

    // hora = «la hora, para no pisar el archivo de antes»
    const hora = `${String(ahora.getHours()).padStart(2, '0')}${String(ahora.getMinutes()).padStart(2, '0')}`;

    return `parrillas-${nombre}-${fecha}-${hora}.csv`;
}


// downloadSpreadsheet = «descargar la hoja de cálculo»
// Recibe: csv (lo que devolvió buildSpreadsheet) y nombre (el del archivo).
// Devuelve: true si se pudo. NUNCA lanza.
function downloadSpreadsheet(csv, nombre) {
    try {
        // enlace = «el enlace que dispara la descarga»
        const enlace = document.createElement('a');

        enlace.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        enlace.download = nombre;
        enlace.click();

        setTimeout(() => URL.revokeObjectURL(enlace.href), 5000);

        return true;
    }
    catch (error) {
        console.log(error);

        return false;
    }
}


export { buildSpreadsheet, buildFileName, downloadSpreadsheet, COLUMNAS_DE_ROTACION, COLUMNAS_DE_PROCESOS };
