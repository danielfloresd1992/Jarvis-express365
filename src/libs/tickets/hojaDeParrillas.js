import { getTimeReport } from '../date_time/calculate_time.js';
import { withoutBlankRows } from './tableRecords.js';


/*  EL REGISTRO DE LAS MESAS, EN UNA HOJA DE CÁLCULO
 *
 *  Un CSV con el registro —cada rotación de mesa con sus procesos—, encabezado por el establecimiento y la fecha.
 *  Se abre con doble clic en Excel o en cualquier hoja de cálculo.
 *
 *  UNA LÍNEA POR PROCESO, y en cada línea los datos de su mesa repetidos: así cada línea se entiende
 *  sola, y se puede ordenar o filtrar sin que un proceso se quede sin saber de qué mesa era. Una mesa
 *  sin procesos sale en una línea, con esas casillas vacías.
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


// COLUMNAS = «los encabezados», en el orden de la pantalla y de la estructura
const COLUMNAS = ['Fecha', 'Mesa', 'Ocupa', 'Primera atención', 'Duración', '# Ticket', 'Tipo de plato', 'Toma de orden', 'Listo en tablet', 'Duración', 'Listo en cocina', 'Entrega de plato', 'Duración', 'Desocupa', 'Limpieza', 'Duración'];


// demoraEntre = «el texto de las columnas Duración»
// La misma cuenta que hace el register en pantalla, para que el archivo y la pantalla digan lo
// mismo. Sin las dos horas no hay nada que calcular y la casilla se queda vacía.
const demoraEntre = (desde, hasta, limite) => {
    if (!desde || !hasta) return '';

    // reporte = «lo que salió de la cuenta»
    const reporte = getTimeReport(desde, hasta, limite);

    if (reporte.exceeded === null) return reporte.timeTotal;

    return `${reporte.timeTotal} (${reporte.exceeded ? 'fuera de plazo' : 'en plazo'})`;
}


// fechaDe = «la fecha de una mesa, como se lee aquí»: 04/10/2026
const fechaDe = (fecha) => (fecha instanceof Date && Number.isFinite(fecha.getTime()))
    ? fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';


// rowsOfRecords = «las líneas del registro»: una por proceso, con los datos de su mesa delante y detrás
// Recibe: registros (las mesas, con o sin las filas en blanco), limiteAtencion y limiteLimpieza.
function rowsOfRecords(registros, limiteAtencion, limiteLimpieza) {

    // filas = «las líneas»
    const filas = [];

    for (const mesa of withoutBlankRows(registros ?? [])) {

        // alLlegar / alIrse = «los datos de la mesa que van antes y después de los procesos»
        const alLlegar = [fechaDe(mesa.date), mesa.tableNumber, mesa.hourOccupies, mesa.hourFirstAttention, demoraEntre(mesa.hourOccupies, mesa.hourFirstAttention, limiteAtencion)];
        const alIrse = [mesa.breakUp, mesa.tableCleaning, demoraEntre(mesa.breakUp, mesa.tableCleaning, limiteLimpieza)];

        //  Sin procesos, una línea igual: la mesa tiene que salir.
        const procesos = mesa.process.length > 0 ? mesa.process : [null];

        for (const proceso of procesos) {
            filas.push([
                ...alLlegar,
                proceso?.ticketNumber ?? '',
                proceso?.dishType ?? '',
                proceso?.orderTaking ?? '',
                proceso?.markedReadyOnTablet ?? '',
                demoraEntre(proceso?.orderTaking, proceso?.markedReadyOnTablet),
                proceso?.readyInTheKitchen ?? '',
                proceso?.dishDelivery ?? '',
                demoraEntre(proceso?.readyInTheKitchen, proceso?.dishDelivery),
                ...alIrse,
            ]);
        }
    }

    return filas;
}


// buildSpreadsheet = «armar la hoja de cálculo»
// PURA: solo con los datos, sin tocar el documento. Devuelve el texto del CSV.
// Recibe: { establecimiento, ahora (una Date), registros (las mesas), limiteAtencion, limiteLimpieza }.
function buildSpreadsheet({ establecimiento, ahora = new Date(), registros, limiteAtencion, limiteLimpieza }) {

    // mesas = «las mesas con algo» · lineas del registro = una por proceso
    const mesas = withoutBlankRows(registros ?? []);
    const filas = rowsOfRecords(mesas, limiteAtencion, limiteLimpieza);

    // pedidos = «cuántos procesos hay en total»
    const pedidos = mesas.reduce((total, mesa) => total + mesa.process.length, 0);

    // lineas = «las líneas del archivo»
    const lineas = [
        fila(['Establecimiento', establecimiento || '(sin establecimiento)']),
        fila(['Fecha', ahora.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })]),
        fila(['Hora', ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })]),
        '',
        fila(['REGISTRO', `${mesas.length} rotaciones`, `${pedidos} procesos`]),
        fila(COLUMNAS),
    ];

    for (const linea of filas) lineas.push(fila(linea));
    if (filas.length === 0) lineas.push(fila(['(sin nada anotado)']));

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

    return `registro-${nombre}-${fecha}-${hora}.csv`;
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


export { buildSpreadsheet, buildFileName, downloadSpreadsheet, COLUMNAS };
