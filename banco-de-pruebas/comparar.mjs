/*  ─────────────────────────────────────────────────────────────────────────────
 *  BANCO DE PRUEBAS: QUÉ MODELO LEE MEJOR ESTA PANTALLA
 *
 *  Le pasa LAS MISMAS imágenes a varios modelos, con EL MISMO prompt que usa la
 *  ventana, y cuenta aciertos y segundos. Sale una tabla con la que decidir por
 *  números en vez de por intuición.
 *
 *  POR QUÉ IMPORTA QUE SEA EL MISMO PROMPT: se importa de
 *  src/libs/tickets/lecturaDeTickets.js, el que corre de verdad. Con una copia, el
 *  banco mediría algo parecido pero distinto, y la comparación no valdría.
 *
 *  Y POR QUÉ LAS MISMAS IMÁGENES: las tiras las guarda la propia ventana con el botón
 *  «guardar captura», ya recortadas como se le mandan al modelo. Si el banco recortara
 *  por su cuenta estaría midiendo otra cosa.
 *
 *  NO TOCA NADA. Solo lee archivos y hace peticiones al servidor de la IA.
 *
 *  USO:   node banco-de-pruebas/comparar.mjs
 *  ───────────────────────────────────────────────────────────────────────────── */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { PROMPT_DE_LECTURA, leerCabecera, extraerTickets } from '../src/libs/tickets/lecturaDeTickets.js';
import { aSegundosDeCronometro } from '../src/libs/tickets/cronometro.js';


const AQUI = path.dirname(fileURLToPath(import.meta.url));

const CAPTURAS = path.join(AQUI, 'capturas');
const VERDAD = path.join(AQUI, 'verdad.json');


/*  Dónde está el servidor de la IA. El mismo que usa la aplicación.
 *
 *  Se puede cambiar sin tocar el archivo:  AI_URL=http://otra-maquina:1234 node ...
 */
const AI_URL = process.env.AI_URL ?? 'http://localhost:1234';


/*  LOS CANDIDATOS
 *
 *  El identificador tiene que ser EXACTAMENTE el que muestra LM Studio para el modelo
 *  cargado. Y ojo: LM Studio sirve los que tenga cargados en memoria, así que hay que
 *  cargarlos antes — o pasarlos de uno en uno:
 *
 *      MODELOS=qwen2.5-vl-7b-instruct node banco-de-pruebas/comparar.mjs
 */
const MODELOS = (process.env.MODELOS ?? 'google/gemma-4-e4b').split(',').map(m => m.trim()).filter(Boolean);


//  Cuánto se espera por lectura antes de darla por perdida. Generoso: aquí lo que
//  interesa es MEDIR cuánto tarda, no que vaya rápido.
const LIMITE_MS = Number(process.env.LIMITE_MS ?? 180000);




/*  ─────────────────────────────────────────────────────────────────────────────
 *  PUNTUACIÓN
 *
 *  Un ticket cuenta como ACERTADO si coinciden las tres cosas que salen de la
 *  cabecera: mesa, número y cronómetro. Las tres, no dos de tres — porque justamente
 *  el fallo que perseguimos era que vinieran de tarjetas distintas.
 *
 *  Y se cuentan aparte los INVENTADOS: tickets que el modelo devuelve y que no están
 *  en la verdad. Un modelo que se inventa la mitad no sirve aunque acierte mucho, y
 *  sin este número no se nota.
 *  ───────────────────────────────────────────────────────────────────────────── */
function comparar(leidos, verdaderos) {
    const pendientes = verdaderos.map(v => ({ ...v, usado: false }));

    let aciertos = 0;
    const inventados = [];

    for (const leido of leidos) {
        const iguala = pendientes.find(v => !v.usado
            && String(v.mesa) === String(leido.mesa)
            && String(v.ticket) === String(leido.ticket)
            && aSegundosDeCronometro(v.tiempo) === aSegundosDeCronometro(leido.tiempo));

        if (iguala) {
            iguala.usado = true;
            aciertos += 1;
        }
        else {
            inventados.push(leido);
        }
    }

    return {
        aciertos,
        total: verdaderos.length,
        inventados,
        perdidos: pendientes.filter(v => !v.usado),
    };
}


//  Una lectura: manda una imagen y devuelve lo que se entendió, con lo que tardó.
async function leerImagen(modelo, rutaPng) {
    const png = await fs.readFile(rutaPng);
    const dataUrl = `data:image/png;base64,${png.toString('base64')}`;

    const desde = Date.now();

    const control = new AbortController();
    const reloj = setTimeout(() => control.abort(), LIMITE_MS);

    try {
        const respuesta = await fetch(`${AI_URL}/api/v1/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: control.signal,
            body: JSON.stringify({
                model: modelo,
                input: [
                    { type: 'text', content: PROMPT_DE_LECTURA },
                    { type: 'image', data_url: dataUrl },
                ],
                reasoning: 'off',
                temperature: 0,
            }),
        });

        if (!respuesta.ok) {
            return { error: `HTTP ${respuesta.status}`, segundos: (Date.now() - desde) / 1000, tickets: [] };
        }

        const datos = await respuesta.json();
        const texto = datos?.output?.[0]?.content ?? '';
        const crudos = extraerTickets(texto);

        //  null es «no se entendió nada», que no es lo mismo que «no había tickets».
        if (crudos === null) {
            return {
                error: 'respuesta ilegible',
                segundos: (Date.now() - desde) / 1000,
                tickets: [],
                muestra: texto.trim().slice(0, 120),
            };
        }

        //  Se parte la cabecera igual que en la ventana, para medir la cadena COMPLETA
        //  —modelo más parser— y no solo lo que dijo el modelo.
        const tickets = crudos
            .map(t => leerCabecera(t?.cabecera))
            .filter(t => t && aSegundosDeCronometro(t.tiempo) !== null);

        return { segundos: (Date.now() - desde) / 1000, tickets, tokens: datos?.usage?.total_tokens ?? null };
    }
    catch (error) {
        return {
            error: error?.name === 'AbortError' ? `sin respuesta en ${LIMITE_MS / 1000} s` : String(error?.message ?? error),
            segundos: (Date.now() - desde) / 1000,
            tickets: [],
        };
    }
    finally {
        clearTimeout(reloj);
    }
}




async function main() {
    let verdad;
    try {
        verdad = JSON.parse(await fs.readFile(VERDAD, 'utf8'));
    }
    catch {
        console.error(`\nNo encuentro ${VERDAD}.\nLee banco-de-pruebas/LEEME.md: hay que escribir a mano lo que se ve en cada captura.\n`);
        process.exit(1);
    }

    //  JSON no admite comentarios, así que las notas van en claves que empiezan por
    //  guión bajo. Se saltan aquí para que no se traten como si fueran imágenes.
    const imagenes = Object.keys(verdad).filter(clave => !clave.startsWith('_'));
    if (!imagenes.length) {
        console.error('\nverdad.json está vacío: no hay nada que comparar.\n');
        process.exit(1);
    }

    console.log(`\nServidor: ${AI_URL}`);
    console.log(`Imágenes: ${imagenes.length}`);
    console.log(`Modelos:  ${MODELOS.join(', ')}\n`);

    const resumen = [];

    for (const modelo of MODELOS) {
        let aciertos = 0, total = 0, inventados = 0, segundos = 0, fallos = 0;

        console.log(`── ${modelo} ${'─'.repeat(Math.max(0, 56 - modelo.length))}`);

        for (const imagen of imagenes) {
            const ruta = path.join(CAPTURAS, imagen);

            let existe = true;
            try { await fs.access(ruta); } catch { existe = false; }

            if (!existe) {
                console.log(`   ${imagen.padEnd(34)} NO ESTÁ en capturas/`);
                continue;
            }

            const r = await leerImagen(modelo, ruta);
            segundos += r.segundos;

            if (r.error) {
                fallos += 1;
                console.log(`   ${imagen.padEnd(34)} ${r.segundos.toFixed(1).padStart(6)} s  ${r.error}${r.muestra ? `  «${r.muestra}»` : ''}`);
                continue;
            }

            const p = comparar(r.tickets, verdad[imagen] ?? []);
            aciertos += p.aciertos;
            total += p.total;
            inventados += p.inventados.length;

            const detalle = [
                `${p.aciertos}/${p.total} aciertos`,
                p.inventados.length ? `${p.inventados.length} inventados` : '',
                p.perdidos.length ? `${p.perdidos.length} sin ver` : '',
            ].filter(Boolean).join(' · ');

            console.log(`   ${imagen.padEnd(34)} ${r.segundos.toFixed(1).padStart(6)} s  ${detalle}`);

            //  Lo que se inventó se enseña: es lo más útil para entender POR QUÉ falla.
            for (const inv of p.inventados.slice(0, 3)) {
                console.log(`      inventado: mesa ${inv.mesa} · #${inv.ticket} · ${inv.tiempo}`);
            }
        }

        resumen.push({ modelo, aciertos, total, inventados, fallos, segundos });
        console.log('');
    }

    console.log('\n══ RESUMEN ' + '═'.repeat(58));
    console.log('modelo'.padEnd(34) + 'acierto'.padEnd(12) + 'inventados'.padEnd(13) + 's/lectura');

    for (const r of resumen) {
        const pct = r.total ? `${Math.round((r.aciertos / r.total) * 100)} %` : '—';
        const medio = imagenes.length ? (r.segundos / imagenes.length).toFixed(1) : '—';

        console.log(
            r.modelo.slice(0, 33).padEnd(34)
            + `${pct} (${r.aciertos}/${r.total})`.padEnd(12)
            + String(r.inventados).padEnd(13)
            + `${medio} s`
            + (r.fallos ? `   ${r.fallos} lecturas fallidas` : '')
        );
    }

    console.log('\nEl recorrido completo de la pantalla es s/lectura × número de tiras.');
    console.log('Ese número es el que limita «Listo en tablet» y «Listo en cocina».\n');
}


main().catch(error => {
    console.error('\nEl banco se cayó:', error?.message ?? error, '\n');
    process.exit(1);
});
