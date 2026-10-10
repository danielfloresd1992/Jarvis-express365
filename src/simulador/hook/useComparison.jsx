import { useMemo, useCallback } from 'react';
import { comparar } from '../comparacion.js';
import { buildReportHtml, openReport } from '../informeDeLaSimulacion.js';
import { readShift } from './useEngine.jsx';


/*  LA VERDAD FRENTE A LO INFERIDO, Y CÓMO SE EXPORTA
 *
 *  Las cuentas están en comparacion.js; aquí solo se deciden CUÁNDO se rehacen y cómo salen del
 *  simulador (CSV, JSON o el informe para imprimir).
 */



// cell = «cómo se escribe un valor en la hoja de cálculo»: un «sí» se lee mejor que un TRUE y un hueco mejor que un null
const cell = (value) => (value === null || value === undefined ? '' : value === true ? 'sí' : value === false ? 'no' : String(value));


// rowsForExport = «las filas del registro, como se exportan»
// Todas las columnas, también las que la pantalla no pinta. Los nombres de las columnas son los de
// siempre: hay hojas de cálculo hechas sobre ellos.
function rowsForExport(comparison) {
    return comparison.filas.map(({ verdad, ia, dToma, dListo, veredicto, iaPrepS, iaLimiteS, iaDemora, demoraCoincide }) => ({
        rotacion: verdad.rotacion ?? null, rotacion_manual: verdad.manual ?? null,
        a_mano: verdad.aMano ?? null, cocina_manual: verdad.cocinaManual ?? null,
        mesa: verdad.mesa, ticket: verdad.ticket, tipo: verdad.tipo, curso: verdad.curso ?? null,
        modo_de_envio: verdad.modoDeEnvio ?? null, estuvo_en_hold: verdad.retenida ?? null,
        estado: verdad.estado, productos: verdad.productos,

        toma_de_orden: verdad.tomaDeOrden, fuego: verdad.disparada, todas_las_palomitas: verdad.lista,
        despachada: verdad.despachada, se_fue_de_pantalla: verdad.retirada, listo_en_tablet: verdad.listoEnTablet,

        limite_s: verdad.limiteS ?? null, preparacion_s: verdad.preparacionS ?? null, en_preparacion: verdad.enPreparacion ?? null,
        demora: verdad.demora ?? null, exceso_s: verdad.excesoS ?? null, espera_total_s: verdad.esperaTotalS ?? null,

        ia_mesa: ia?.mesa ?? null, ia_tipo: ia?.tipo ?? null, ia_toma_de_orden: ia?.tomaOrden ?? null, dif_toma_s: dToma,
        ia_listo_en_tablet: ia?.listoTablet ?? null, dif_listo_s: dListo,
        ia_preparacion_s: iaPrepS, ia_limite_s: iaLimiteS, ia_demora: iaDemora, ia_demora_coincide: demoraCoincide,
        veredicto: veredicto.texto,
    }));
}


// BYTE_ORDER_MARK = «la marca de orden de bytes»
// Va por delante del CSV: sin ella Excel lo abre como si no fuera UTF-8 y destroza los acentos. Escrita
// como '﻿' y no pegada tal cual: pegada es invisible, y un carácter invisible en el código acaba
// borrado por alguien que no sabía que estaba ahí.
const BYTE_ORDER_MARK = '﻿';


// download = «bajar un archivo»
function download(content, format) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([format === 'json' ? content : `${BYTE_ORDER_MARK}${content}`], { type: format === 'json' ? 'application/json' : 'text/csv' }));
    link.download = `simulacion-toast-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${format}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
}



// useComparison = «la comparación»
// Recibe: { engine      el motor (useEngine)
//           heartbeat   el latido (useScreen): la comparación se rehace con él
//           inference   lo último que infirió la ventana de la tablet (useTabletLink)
//           settings }  los ajustes (useSettings): la tolerancia y los tiempos máximos
// Devuelve: { comparison, exportLog }
//   comparison   lo que devuelve 'comparar' (comparacion.js): las filas de las dos tablas y el resumen
//   exportLog    ('csv' | 'json') descarga el registro entero; ('pdf') abre el informe para imprimirlo
function useComparison({ engine, heartbeat, inference, settings }) {

    const { values, ref: settingsRef } = settings;


    /*  Se rehace con cada latido y no con cada pintado: mientras una tarjeta se cocina su preparación
     *  y su demora cambian segundo a segundo, pero mover un deslizador del panel —que redibuja el
     *  simulador muchas veces por segundo— no tiene por qué recalcular ni repintar una tabla de cientos
     *  de filas.
     */
    const comparison = useMemo(() => comparar({
        registro: engine.registro(),
        turno: readShift(engine),
        inferencia: inference,
        toleranciaS: values.toleranciaS,
        limites: { entradaMin: values.limiteEntradaMin, fuerteMin: values.limiteFuerteMin, postreMin: values.limitePostreMin },
    }), [engine, heartbeat, inference, values.toleranciaS, values.limiteEntradaMin, values.limiteFuerteMin, values.limitePostreMin]);


    const exportLog = useCallback((format) => {

        //  El PDF no es una descarga: se arma una página con los aciertos y los desaciertos y se manda a
        //  imprimir. En el diálogo se elige «Guardar como PDF» y queda el archivo.
        if (format === 'pdf') {
            openReport(buildReportHtml({ comparacion: comparison, semilla: engine.semilla }));

            return;
        }

        const rows = rowsForExport(comparison);

        const content = format === 'json'
            ? JSON.stringify({
                semilla: engine.semilla,
                exportadoEn: new Date().toISOString(),
                ajustes: settingsRef.current,
                turno: typeof engine.turno === 'function' ? engine.turno() : null,
                resumen: comparison.resumen,
                ultimaLectura: inference?.lectura ?? null,
                filas: rows,
                fantasmas: comparison.fantasmas,
            }, null, 2)
            : [Object.keys(rows[0] ?? { vacio: '' }).join(';'), ...rows.map(row => Object.values(row).map(value => `"${cell(value).replace(/"/g, '""')}"`).join(';'))].join('\r\n');

        download(content, format);
    }, [comparison, engine, inference]);


    return { comparison, exportLog };
}



export { useComparison };
