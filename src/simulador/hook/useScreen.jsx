import { useState, useRef, useCallback, useEffect } from 'react';
import { temaCon } from '../pintura/temas.js';
import { maquetar, zonaEn } from '../pintura/maquetar.js';
import { pintarPantalla, ANCHO_VISTA_TOTAL } from '../pintura/pintar.js';


/*  LA PANTALLA DE TOAST: PINTARLA, PASAR DE PÁGINA Y TOCARLA
 *
 *  El lienzo NO se pinta con React: lo pinta 'paint', fuera del pintado de React, cuatro veces por
 *  segundo y cada vez que la ventana de la tablet pide una captura. Cómo se maqueta y se dibuja cada
 *  tarjeta está en pintura/; aquí solo se decide cuándo.
 *
 *  Y EL LATIDO. Una vez por segundo se avisa a React de que algo pudo cambiar: es lo que refresca el
 *  reloj de la cabecera, el estado del turno y las tablas del registro. La pantalla NO depende de él.
 */



// REPAINT_MS = «cada cuánto se repinta el lienzo, en milisegundos»
const REPAINT_MS = 250;

// HEARTBEAT_MS = «cada cuánto late la ventana, en milisegundos»
const HEARTBEAT_MS = 1000;

// FONT_URL = «la letra de Toast»
// Toast está hecho para Android y usa Roboto. Sin ella el lienzo pinta con la letra del sistema, que
// es más ancha: los textos se parten por otro sitio y la pantalla deja de parecerse a la de verdad.
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,500;0,700;1,400&display=swap';

// FONT_FACES = «los pesos de Roboto que pinta el lienzo»
const FONT_FACES = ['400 18px Roboto', '500 20px Roboto', '700 18px Roboto', 'italic 400 14px Roboto'];

// FONT_RETRY_MS = «cuándo se vuelve a intentar cargar la letra»
const FONT_RETRY_MS = 1500;



// useScreen = «la pantalla de Toast»
// Recibe: { engine     el motor (useEngine)
//           settings } los ajustes (useSettings): lee los de ahora por su ref, y los cambia al tocar la barra
// Devuelve:
//   canvasRef        va en el <canvas>
//   page             qué pantalla se enseña, { pagina, paginas }, para el panel
//   heartbeat        un número que sube con cada latido: quien dependa de él se rehace una vez por segundo
//   paint            pinta YA, y devuelve la maqueta recién pintada
//   refresh          pinta y avisa a React: tras tocar algo a mano no se espera al latido
//   showPage, turnPage   ir a una pantalla · pasar adelante (1) o atrás (-1)
//   tap              un toque en el lienzo (va en su onClick)
function useScreen({ engine, settings }) {

    // settingsRef = «los ajustes de ahora». Es la ref de useSettings, que no cambia nunca.
    const { ref: settingsRef, change } = settings;

    const canvasRef = useRef(null);

    // layoutRef = «la última maqueta pintada»: dónde cayó cada tarjeta y cada botón de la barra
    const layoutRef = useRef(null);


    /*  QUÉ PANTALLA SE ENSEÑA. Con la cocina llena las tarjetas no caben en una, y Toast no las
     *  encoge: las que sobran quedan en la pantalla siguiente, a la que se pasa con «→|». Lo que ve
     *  —y lee— la ventana de la tablet es SOLO la que está a la vista.
     *
     *  Va en una ref porque quien la usa es 'paint', que corre fuera del pintado de React. El estado de
     *  al lado es solo para que el panel enseñe «Pantalla 1 de 2», y 'paint' lo pone al día únicamente
     *  cuando cambia. No es un ajuste y NO se guarda: mañana habrá otras tarjetas, y amanecer en la
     *  pantalla 3 de una cocina vacía no es nada.
     */
    const pageRef = useRef(0);
    const [page, setPage] = useState({ pagina: 0, paginas: 1 });

    const [heartbeat, setHeartbeat] = useState(0);



    // paint = «pintar la pantalla»
    const paint = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const currentSettings = settingsRef.current;

        engine.avanzar(Date.now());

        const theme = temaCon(currentSettings.tema, { idioma: currentSettings.idioma, alto: currentSettings.alto, estacion: currentSettings.estacion });

        const width = theme.ancho * currentSettings.escala;
        const height = theme.alto * currentSettings.escala;
        if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }

        const ctx = canvas.getContext('2d');
        ctx.setTransform(currentSettings.escala, 0, 0, currentSettings.escala, 0, 0);

        const measure = (text, css) => { ctx.font = css; return ctx.measureText(text).width; };

        const visible = engine.visibles();
        const layout = maquetar(visible, theme, measure, { desplazamiento: currentSettings.vistaTotal ? ANCHO_VISTA_TOTAL : 0, pagina: pageRef.current });

        //  La página pedida puede no existir ya —se despacharon tarjetas, se cerró la vista «All day» y
        //  caben más columnas—: maquetar la recorta, y aquí se apunta la que de verdad pintó. Si no,
        //  «|←» habría que tocarlo varias veces para volver de una pantalla 4 que ya no está.
        pageRef.current = layout.pagina;
        setPage(previous => (previous.pagina === layout.pagina && previous.paginas === layout.paginas ? previous : { pagina: layout.pagina, paginas: layout.paginas }));

        //  «Vista» es lo que salió en la pantalla que se enseñaba: una tarjeta que pasó toda su vida en
        //  la pantalla 2 sin que nadie fuera a verla, no salió.
        engine.marcarVistas(layout.idsVisibles);

        //  La vista «All day»: cuántos hay pendientes de cada producto.
        const pending = new Map();
        for (const card of visible) {
            if (card.estado === 'despachada') continue;
            for (const item of card.items) {
                if (!item.hecho) pending.set(item.nombre, (pending.get(item.nombre) ?? 0) + item.cantidad);
            }
        }

        const barZones = pintarPantalla(ctx, {
            tema: theme,
            maqueta: layout,
            umbrales: { amarilloS: currentSettings.amarilloS, rojoS: currentSettings.rojoS },
            estado: {
                hora: engine.reloj(),
                avisos: currentSettings.avisos,
                recientesVisibles: engine.ajustes.recientesVisibles,
                vistaTotal: currentSettings.vistaTotal,
                totalTickets: visible.length,
                conteo: [...pending.entries()].sort((first, second) => second[1] - first[1]),
            },
        });

        layoutRef.current = { ...layout, zonasDeBarra: barZones, tema: theme, visibles: visible };
        return layoutRef.current;
    }, [engine]);


    //  Tras tocar algo a mano —una tarjeta, un botón del panel— no se espera al latido: se repinta la
    //  pantalla y se pone al día todo lo que sale del motor. Devuelve la maqueta recién pintada, por si
    //  quien llama quiere saber dónde cayó algo.
    const refresh = useCallback(() => { const layout = paint(); setHeartbeat(count => count + 1); return layout; }, [paint]);

    //  Pasar de pantalla, desde el lienzo («|←» y «→|») o desde el panel. Por arriba no se acota aquí:
    //  cuántas pantallas hay solo lo sabe maquetar, que recorta.
    const showPage = useCallback((which) => { pageRef.current = Math.max(0, which); return refresh(); }, [refresh]);
    const turnPage = useCallback((jump) => showPage(pageRef.current + jump), [showPage]);



    //  Con cada cambio de ajustes se repinta. Va DESPUÉS de los efectos de useSettings (la ref al día)
    //  y de useEngine (el motor al día): se pinta ya con lo nuevo.
    useEffect(() => {
        paint();
    }, [settings.values, paint]);


    //  ARRANQUE DE LA VENTANA: su título, la letra de Toast y los dos relojes —el del lienzo y el latido—.
    useEffect(() => {
        document.title = 'Simulador de Toast';

        if (!document.getElementById('sim-roboto')) {
            const link = document.createElement('link');
            link.id = 'sim-roboto';
            link.rel = 'stylesheet';
            link.href = FONT_URL;
            document.head.appendChild(link);
        }

        const loadFont = () => Promise.all(FONT_FACES.map(face => document.fonts.load(face)))
            .then(paint)
            .catch(() => { /* sin red se queda la letra del sistema */ });

        loadFont();
        const retry = setTimeout(loadFont, FONT_RETRY_MS);

        const repaint = setInterval(paint, REPAINT_MS);
        const beat = setInterval(() => setHeartbeat(count => count + 1), HEARTBEAT_MS);

        return () => { clearTimeout(retry); clearInterval(repaint); clearInterval(beat); };
    }, [paint]);



    // tap = «un toque en la pantalla, como en la tablet»
    const tap = (event) => {
        const layout = layoutRef.current;
        const canvas = canvasRef.current;
        if (!layout || !canvas) return;

        //  Del punto del ratón a coordenadas de la tablet: el lienzo se ve encogido.
        const box = canvas.getBoundingClientRect();
        const tabletX = (event.clientX - box.left) * layout.tema.ancho / box.width;
        const tabletY = (event.clientY - box.top) * layout.tema.alto / box.height;

        //  Primero, los botones de la barra de arriba.
        const bar = layout.zonasDeBarra.find(barZone => tabletX >= barZone.x && tabletX <= barZone.x + barZone.ancho && tabletY >= barZone.y && tabletY <= barZone.y + barZone.alto);

        if (bar?.accion === 'recientes') return change({ recientesVisibles: !settingsRef.current.recientesVisibles });
        if (bar?.accion === 'vistaTotal') return change({ vistaTotal: !settingsRef.current.vistaTotal });
        if (bar?.accion === 'recuperar') { engine.recuperar(); return refresh(); }
        if (bar?.accion === 'paginaAnterior') return turnPage(-1);
        if (bar?.accion === 'paginaSiguiente') return turnPage(1);

        //  Y si no, una tarjeta: un producto, su cabecera o su HOLD.
        const zone = zonaEn(layout, tabletX, tabletY);
        if (!zone) return;

        if (zone.accion === 'producto') engine.alternarProducto(zone.tarjetaId, zone.indice);
        if (zone.accion === 'despachar') engine.despacharTarjeta(zone.tarjetaId);
        if (zone.accion === 'disparar') engine.dispararTarjeta(zone.tarjetaId);

        refresh();
    };


    return { canvasRef, page, heartbeat, paint, refresh, showPage, turnPage, tap };
}



export { useScreen };
