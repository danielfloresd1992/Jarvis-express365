/*  EL INFORME DE LA SIMULACIÓN, EN PDF
 *
 *  Arma una página con los aciertos y los desaciertos de la corrida y la manda a imprimir:
 *  en el diálogo se elige «Guardar como PDF» y queda el archivo.
 *
 *  POR QUÉ ASÍ Y NO CON UNA LIBRERÍA. Un PDF hecho a mano necesitaría meter jsPDF en el
 *  proyecto —unos cientos de kilobytes— para algo que solo existe en desarrollo. Y por qué
 *  no en el servidor: escribirlo en disco pediría un servidor que escriba archivos, y eso
 *  no se quiere. Imprimir no necesita nada de eso y el PDF sale igual.
 *
 *  Lo que cuesta: hay que confirmar el diálogo de impresión. No es automático del todo.
 */


// escapar = «escapar el texto para meterlo en el HTML»
// Los nombres de los platos vienen de la carta y del modelo: un '<' suelto rompería la página.
const escapar = (valor) => String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');


// porCiento = «el porcentaje, redondeado»
// Sin nada con lo que comparar no hay porcentaje: devuelve '—' en vez de un 0 % que engaña.
const porCiento = (parte, total) => {
    if (!total) return '—';

    return `${Math.round(parte * 100 / total)} %`;
}


// hora = «la hora de ahora, para el encabezado»
const hora = (fecha) => fecha.toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });


// ESTILOS = «el aspecto del informe»
// En blanco y negro a propósito: esto se imprime o se guarda en PDF, y los fondos oscuros de
// la aplicación se comen el tóner y no se leen en papel.
const ESTILOS = `
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; color: #111; margin: 28px; font-size: 12px; }
    h1 { font-size: 19px; margin: 0 0 2px; }
    h2 { font-size: 14px; margin: 22px 0 6px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
    .sub { color: #666; font-size: 11px; margin: 0 0 18px; }

    .marcadores { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; }
    .marcador { border: 1px solid #ccc; border-radius: 6px; padding: 8px 12px; min-width: 128px; }
    .marcador b { display: block; font-size: 21px; line-height: 1.1; }
    .marcador span { color: #666; font-size: 10px; }
    .marcador--mal b { color: #a3242f; }
    .marcador--bien b { color: #1a6b3c; }

    table { border-collapse: collapse; width: 100%; margin-top: 4px; }
    th, td { border: 1px solid #ddd; padding: 3px 6px; text-align: left; }
    th { background: #f2f2f2; font-size: 10px; text-transform: uppercase; letter-spacing: .4px; }
    td { font-variant-numeric: tabular-nums; }
    tr:nth-child(even) td { background: #fafafa; }

    .mal { color: #a3242f; font-weight: 600; }
    .bien { color: #1a6b3c; }
    .aviso { color: #8a6100; }
    .vacio { color: #888; font-style: italic; }

    /*  La barra de arriba es de esta ventana, no del informe: al imprimir desaparece.  */
    .barra { position: sticky; top: 0; z-index: 2; background: #fff; padding: 10px 0 12px; border-bottom: 1px solid #e6e6e6; margin-bottom: 16px; }
    .barra button { font: inherit; font-weight: 600; padding: 7px 14px; border: 1px solid #1a6b3c; background: #1a6b3c; color: #fff; border-radius: 6px; cursor: pointer; }
    .barra button:hover { background: #22824a; }
    .barra span { color: #666; font-size: 11px; margin-left: 10px; }

    @page { size: A4 landscape; margin: 12mm; }
    @media print { body { margin: 0; } .barra { display: none; } h2 { break-after: avoid; } tr { break-inside: avoid; } }
`;


// claseDelVeredicto = «qué color le toca a un veredicto»
const claseDelVeredicto = (clase) => {
    if (clase === 'sim-bien') return 'bien';
    if (clase === 'sim-mal') return 'mal';

    return 'aviso';
}


// filasDeLaSimulacion = «la tabla de lo que generó la simulación»
function filasDeLaSimulacion(filas) {
    if (!filas.length) return '<p class="vacio">La simulación no generó ningún ticket.</p>';

    // lineas = «las filas de la tabla»
    const lineas = filas.map(fila => {
        const v = fila.verdad;

        return `<tr>
            <td>${escapar(v.mesa)}</td>
            <td>#${escapar(v.ticket)}</td>
            <td>${escapar(v.tipo)}</td>
            <td>${escapar(v.estado)}</td>
            <td>${escapar(v.tomaDeOrden)}</td>
            <td>${escapar(v.listoEnTablet || '—')}</td>
            <td class="${fila.reconocible ? (fila.ia ? 'bien' : 'mal') : 'aviso'}">${fila.reconocible ? (fila.ia ? 'sí' : 'no') : 'no se podía'}</td>
        </tr>`;
    });

    return `<table>
        <thead><tr><th>Mesa</th><th>Ticket</th><th>Tipo</th><th>Estado</th><th>Toma de orden</th><th>Listo en tablet</th><th>¿Reconocido?</th></tr></thead>
        <tbody>${lineas.join('')}</tbody>
    </table>`;
}


// filasDeLaInferencia = «la tabla de lo que reconoció la inferencia»
function filasDeLaInferencia(reconocidos) {
    if (!reconocidos.length) return '<p class="vacio">La inferencia no reconoció ningún ticket.</p>';

    const lineas = reconocidos.map(fila => {
        const ia = fila.ia ?? {};

        return `<tr>
            <td>${escapar(ia.mesa)}</td>
            <td>#${escapar(ia.ticket)}</td>
            <td>${escapar(ia.tipo)}</td>
            <td>${escapar(ia.tomaOrden)}</td>
            <td>${fila.dToma === null ? '—' : `${fila.dToma > 0 ? '+' : ''}${fila.dToma} s`}</td>
            <td>${escapar(ia.listoTablet || '—')}</td>
            <td class="${claseDelVeredicto(fila.veredicto?.clase)}">${escapar(fila.veredicto?.texto ?? '')}</td>
        </tr>`;
    });

    return `<table>
        <thead><tr><th>Mesa</th><th>Ticket</th><th>Tipo</th><th>Toma de orden</th><th>Diferencia</th><th>Listo en tablet</th><th>Resultado</th></tr></thead>
        <tbody>${lineas.join('')}</tbody>
    </table>`;
}


// buildReportHtml = «armar el informe»
// PURA: solo con los datos, sin tocar el documento. Así se puede comprobar sin navegador.
// Recibe: { comparacion, semilla, ahora (una Date) }.
// Devuelve: el HTML entero de la página, listo para imprimir.
function buildReportHtml({ comparacion, semilla, ahora = new Date() }) {

    // resumen = «los marcadores»
    const resumen = comparacion?.resumen ?? {};

    // filas = «lo que generó la simulación»  ·  reconocidos = «lo que dio la inferencia»
    const filas = comparacion?.filas ?? [];
    const reconocidos = comparacion?.reconocidos ?? [];

    // inventados = «los números que la lectura se sacó de la manga»
    const inventados = resumen.numerosInventados ?? [];

    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Simulación de Toast — ${escapar(hora(ahora))}</title>
<style>${ESTILOS}</style>
</head>
<body>

<!--  El botón vive AQUÍ, en el informe, y no en el simulador: así el diálogo de impresión
      congela esta ventana y no la de la aplicación. Al imprimir, la barra no sale.  -->
<div class="barra">
    <button type="button" onclick="window.print()">Guardar como PDF</button>
    <span>En el diálogo, elige «Guardar como PDF» en el destino.</span>
</div>

<h1>Simulación de Toast: aciertos y desaciertos</h1>
<p class="sub">${escapar(hora(ahora))}${semilla ? ` · semilla ${escapar(semilla)}` : ''}${resumen.errorMedio !== null && resumen.errorMedio !== undefined ? ` · error medio de la toma de orden: ${escapar(resumen.errorMedio)} s` : ''}</p>

<div class="marcadores">
    <div class="marcador"><b>${escapar(resumen.generados ?? 0)}</b><span>tickets generó la simulación</span></div>
    <div class="marcador"><b>${porCiento(resumen.inferidos ?? 0, resumen.reconocibles ?? 0)}</b><span>reconoció la inferencia (${escapar(resumen.inferidos ?? 0)} de ${escapar(resumen.reconocibles ?? 0)})</span></div>
    <div class="marcador marcador--bien"><b>${porCiento(resumen.aciertos ?? 0, resumen.inferidos ?? 0)}</b><span>de aciertos (${escapar(resumen.aciertos ?? 0)} de ${escapar(resumen.inferidos ?? 0)})</span></div>
    <div class="marcador ${(resumen.inventados ?? 0) > 0 ? 'marcador--mal' : 'marcador--bien'}"><b>${escapar(resumen.inventados ?? 0)}</b><span>tickets que no existen</span></div>
</div>

${inventados.length ? `<p class="sub">Se inventó: <span class="mal">${inventados.map(escapar).join(' · ')}</span></p>` : ''}

<h2>1. Generados por la simulación <small>(${escapar(filas.length)})</small></h2>
${filasDeLaSimulacion(filas)}

<h2>2. Reconocidos por la inferencia <small>(${escapar(reconocidos.length)})</small></h2>
${filasDeLaInferencia(reconocidos)}

</body>
</html>`;
}


// openReport = «abrir el informe para guardarlo en PDF»
//
//  OJO CON ESTO, QUE YA CONGELÓ LA APLICACIÓN UNA VEZ.
//
//  'window.print()' NO devuelve el control hasta que alguien cierra el diálogo: congela el hilo
//  que lo llama. Llamándolo desde aquí se paraba la página ENTERA del simulador, y con ella el
//  motor —que deja de pintar— y el canal que le contesta a la ventana de la tablet, así que la
//  inferencia también se quedaba esperando. Parecía que se hubiera colgado todo.
//
//  Por eso ahora: el informe se abre desde un Blob y con 'noopener', que lo desliga de esta
//  página y hace que el navegador lo ponga en un proceso aparte; y el «imprimir» vive DENTRO del
//  informe, en su propio botón. Desde aquí no se llama a print() nunca.
//
// Recibe: html (lo que devolvió buildReportHtml).
// Devuelve: true si se pudo abrir. Un bloqueador de ventanas emergentes lo puede impedir.
function openReport(html) {
    try {
        // url = «la dirección temporal del informe»
        const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));

        //  'noopener' es lo que corta el lazo: la ventana nueva no puede tocar esta, y el
        //  navegador ya no tiene por qué darles el mismo proceso.
        window.open(url, '_blank', 'noopener');

        //  Se suelta un minuto después: para entonces el informe ya está cargado y no la necesita.
        setTimeout(() => URL.revokeObjectURL(url), 60000);

        return true;
    }
    catch (error) {
        console.log(error);

        return false;
    }
}


export { buildReportHtml, openReport };
