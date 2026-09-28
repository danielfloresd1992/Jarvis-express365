import { useState, useEffect, useRef, useCallback, useMemo, useId } from 'react';
import './simulador.css';
import { crearMotor, AJUSTES_POR_DEFECTO } from './motor/motor.js';
import { ESCENAS, cargarEscena } from './motor/escenas.js';
import { PLATOS, SUELTOS, BEBIDAS, TIPOS_DE_ORDEN, platosDelCurso } from './motor/carta.js';
import { temaCon, TEMAS } from './pintura/temas.js';
import { maquetar, zonaEn } from './pintura/maquetar.js';
import { pintarPantalla, ANCHO_VISTA_TOTAL } from './pintura/pintar.js';
import { abrirCanal, responder } from './canal.js';
import { comparar, ENTRADA, FUERTE, POSTRE } from './comparacion.js';
import { RegistroComparado } from './RegistroComparado.jsx';
import { buildReportHtml, openReport } from './informeDeLaSimulacion.js';
import { esNumero, minSeg, horasMin, porCiento, conComa, plural, recortar, enUnRato } from './formato.js';




/*  ─────────────────────────────────────────────────────────────────────────────
 *  EL SIMULADOR DE TOAST
 *
 *  Una tablet de cocina de mentira, en su propia ventana. Hace tres cosas:
 *
 *      1. PINTA la pantalla del expedidor de Toast, igual que la de verdad, y se la
 *         sirve a la ventana de la tablet cada vez que esta pide una «captura».
 *      2. SE COMPORTA como un restaurante en pleno turno: se ocupan mesas, cada una
 *         pide su entrada, su plato fuerte y su postre, la cocina los va marcando
 *         listos —unos en plazo y otros con demora— y el expedidor los despacha. Solo,
 *         o a mano tocando las tarjetas como en la tablet real. Y en medio de ese turno
 *         se puede meter un ticket hecho a mano —con los platos que se elijan— y decidir
 *         uno mismo cuándo está listo y cuándo sale.
 *      3. APUNTA LA VERDAD —a qué hora entró y se despachó cada tarjeta, cuánto tardó
 *         en prepararse y si eso fue una demora— y la pone al lado de lo que la ventana
 *         de la tablet ha inferido leyendo la pantalla.
 *
 *  Lo tercero es la razón de ser de todo esto: con la tablet real nunca se sabe si la
 *  hora que salió en la parrilla es la buena. Aquí sí.
 *
 *  Solo existe en desarrollo (ver disponible.js). Se abre desde el botón «Simular» de
 *  la ventana de la tablet, o a mano con '?view=toast-sim'.
 *  ───────────────────────────────────────────────────────────────────────────── */


const CLAVE_AJUSTES = 'toast-sim:ajustes';


/*  LOS AJUSTES DEL TURNO, POR SI EL MOTOR NO LOS TRAE
 *
 *  Quien manda es AJUSTES_POR_DEFECTO, el del motor: en la mezcla de abajo va DESPUÉS y
 *  pisa todo lo de aquí. Esto solo garantiza que cada control del panel tenga siempre
 *  un valor que enseñar —un deslizador sin número es un control roto— aunque el motor
 *  que se haya cargado sea uno que todavía no sabe de turnos.
 */
const AJUSTES_DEL_TURNO = {
    turnoEnMarcha: true,
    rotacionesDelTurno: 70,
    duracionDelTurnoH: 8,
    horaPico: true,
    minimoEnPantalla: 3,
    ticketsPorRotacion: 3,
    probTodoJunto: 0.3,
    paraLlevarCadaS: 600,

    limiteEntradaMin: 7,
    limiteFuerteMin: 15,
    limitePostreMin: 5,
    probDemora: 0.2,
    excesoMaxDemoraMin: 6,

    pausaEntreCursosS: [180, 480],
};

//  Ajustes que el motor tuvo y ya no tiene: las llegadas «una cada tanto» dejaron paso
//  al turno con sus rotaciones. Pueden seguir guardados en el equipo de quien usó la
//  versión anterior; se leen, se ignoran y no se vuelven a escribir.
const CLAVES_RETIRADAS = ['autoLlegadas', 'intervaloMedioS', 'mezcla', 'probCursos', 'probPostre', 'probSegundoEnvio', 'rapidezCocina'];

const sinRetiradas = (objeto) => Object.fromEntries(Object.entries(objeto ?? {}).filter(([clave]) => !CLAVES_RETIRADAS.includes(clave)));

const AJUSTES_DEL_MOTOR = sinRetiradas({ ...AJUSTES_DEL_TURNO, ...AJUSTES_POR_DEFECTO });

const CLAVES_DEL_MOTOR = Object.keys(AJUSTES_DEL_MOTOR);

const AJUSTES_INICIALES = {
    ...AJUSTES_DEL_MOTOR,

    //  LA PANTALLA
    tema: 'clara',          //  «Expo - 2»: la que tiene el restaurante en la línea
    idioma: 'es',
    alto: 768,
    escala: 1,              //  2 = captura a doble resolución, como una tablet más densa
    estacion: '',
    amarilloS: 6 * 60,      //  a partir de cuánto la cabecera pasa a amarillo…
    rojoS: 15 * 60,         //  …y a rojo. Son los «Warning Colors» de Toast.
    avisos: 72,
    vistaTotal: false,

    toleranciaS: 10,
};

//  Los ajustes que son una lista cerrada: un valor guardado que no esté aquí no vale.
const VALORES_ADMITIDOS = {
    tema: Object.keys(TEMAS),
    idioma: ['es', 'en'],
};

//  Lo que la versión anterior traía de fábrica y esta ha cambiado (ver 'loGuardadoQueVale').
const DE_FABRICA_EN_LA_VERSION_ANTERIOR = { tema: 'oscura' };

//  Cómo amanece el simulador: con la pantalla EN BLANCO y sin que entre nadie, hasta que
//  se pulse «Empezar». La cocina sí va sola desde el principio: en cuanto entren
//  tickets, se cocinan. El porqué largo está en 'leerAjustes'.
const ARRANQUE_EN_BLANCO = { turnoEnMarcha: false, autoCocina: true };
const SIMULACION_PARADA = { turnoEnMarcha: false, autoCocina: false };


const parametros = new URLSearchParams(window.location.search);

//  '?solo=pantalla' deja únicamente el lienzo, a su tamaño real: para fotografiarlo y
//  compararlo con una captura de la tablet de verdad.
const SOLO_PANTALLA = parametros.get('solo') === 'pantalla';

const ESCENA_INICIAL = parametros.get('escena');

//  Con una escena en la dirección no se guarda nada: es una sesión de prueba y no debe
//  dejarle al siguiente arranque la cocina parada.
const GUARDAR_AJUSTES = !ESCENA_INICIAL && !SOLO_PANTALLA;


//  Lo que una escena le pide a la pantalla, más la simulación parada: una escena es una
//  foto fija, y si siguieran entrando mesas dejaría de parecerse a su captura.
const ajustesDeEscena = (id) => (ESCENAS[id] ? { ...sinRetiradas(ESCENAS[id].ajustes), ...SIMULACION_PARADA, recientesVisibles: true } : {});


const mismaForma = (valor, modelo) => {
    if (valor === null || typeof valor !== typeof modelo) return false;
    if (Array.isArray(modelo)) return Array.isArray(valor) && valor.length === modelo.length && valor.every(Number.isFinite);
    if (typeof modelo === 'number') return Number.isFinite(valor);
    return !Array.isArray(valor);
};


/*  De lo guardado en el equipo, lo que todavía sirve.
 *
 *  Lo guardado puede venir de una versión anterior del simulador, o estar a medias, o
 *  escrito a mano por una prueba. Nada de eso puede romper el arranque, así que solo
 *  pasa lo que se reconoce: una clave que sigue existiendo, con un valor de la misma
 *  forma que el de fábrica. Lo demás —las claves retiradas del motor, un texto donde
 *  iba un número— se deja caer sin más.
 *
 *  Y UN CASO APARTE. La versión anterior guardaba TODOS los ajustes, no solo los que
 *  se habían tocado: en el equipo de quien la usó pone «tema: oscura» aunque nadie lo
 *  eligiera nunca, solo porque era el de fábrica. Respetar eso como si fuera una
 *  decisión dejaría sin efecto el cambio a la apariencia clara justo para quien la
 *  pidió. Un volcado de aquella versión se reconoce
 *  porque trae TODAS las claves retiradas (una prueba que escribe cuatro ajustes a
 *  mano, no); en ese caso, y solo en ese, lo que coincide con lo que entonces era de
 *  fábrica se toma por «sin elegir». Ocurre una vez: lo que se guarde a partir de ahora
 *  ya no lleva esas claves.
 */
function loGuardadoQueVale(guardados) {
    if (!guardados || typeof guardados !== 'object' || Array.isArray(guardados)) return {};

    const esDeLaVersionAnterior = CLAVES_RETIRADAS.every(clave => clave in guardados);

    const valen = {};

    for (const [clave, valor] of Object.entries(guardados)) {
        if (!(clave in AJUSTES_INICIALES)) continue;
        if (!mismaForma(valor, AJUSTES_INICIALES[clave])) continue;
        if (VALORES_ADMITIDOS[clave] && !VALORES_ADMITIDOS[clave].includes(valor)) continue;
        if (esDeLaVersionAnterior && DE_FABRICA_EN_LA_VERSION_ANTERIOR[clave] === valor) continue;

        valen[clave] = valor;
    }

    return valen;
}


function leerAjustes() {
    let guardados = null;

    try { guardados = GUARDAR_AJUSTES ? JSON.parse(localStorage.getItem(CLAVE_AJUSTES)) : null; }
    catch { /* ajustes guardados ilegibles: se arranca con los de fábrica */ }

    return {
        ...AJUSTES_INICIALES,
        ...loGuardadoQueVale(guardados),

        /*  SIEMPRE SE ARRANCA EN BLANCO, DIGA LO QUE DIGA LO GUARDADO
         *
         *  La ventana de la tablet, al conectar, APUNTA lo que ya hay en pantalla y no lo
         *  sigue nunca: de esos pedidos no sabe cuándo entraron. Antes el simulador
         *  amanecía con mesas ya sentadas, así que los primeros tickets —justo los que
         *  uno se quedaba mirando— no llegaban jamás a la parrilla de Procesos.
         *
         *  Ahora la pantalla empieza vacía y no entra nadie hasta pulsar «Empezar»: se
         *  conecta la ventana de la tablet, lee una pantalla en blanco, y todo ticket que
         *  aparezca después es nuevo para ella y lo sigue desde su primer segundo.
         *
         *  Que entren o no tickets tampoco es una preferencia que recordar: es algo que
         *  se decide en cada sesión. (Y la cocina nunca amanece en manual: una escena la
         *  paraba, eso se guardaba, y el simulador no volvía a marcar un plato.)
         */
        ...ARRANQUE_EN_BLANCO,

        //  La escena de la dirección entra YA en el primer estado, no en un efecto: si se
        //  aplicara después, la pantalla se pintaría una vez con la apariencia equivocada.
        //  Es lo único que arranca parado, y no se guarda (ver GUARDAR_AJUSTES).
        ...ajustesDeEscena(ESCENA_INICIAL),
    };
}

const soloDelMotor = (ajustes) => Object.fromEntries(CLAVES_DEL_MOTOR.map(clave => [clave, ajustes[clave]]));





//  ── EL TURNO, TAL COMO LO CUENTA EL MOTOR ────────────────────────────────────

/*  'motor.turno()' con todos sus campos asegurados.
 *
 *  Se lee a la defensiva: un motor que no lleve la cuenta del turno (o que la lleve a
 *  medias) no puede tumbar el panel. 'disponible' dice si el dato es de verdad o si lo
 *  que hay aquí son ceros de relleno, para no enseñar «mesa 0 de 70» como si fuera cierto.
 */
function leerTurno(motor) {
    const t = (typeof motor.turno === 'function' ? motor.turno() : null) ?? {};
    const n = (valor, porOmision = 0) => (esNumero(valor) ? valor : porOmision);

    return {
        disponible: typeof motor.turno === 'function',
        terminado: t.terminado === true,
        rotacionesDelTurno: n(t.rotacionesDelTurno, n(motor.ajustes?.rotacionesDelTurno)),
        rotacionesIniciadas: n(t.rotacionesIniciadas),
        rotacionesTerminadas: n(t.rotacionesTerminadas),
        rotacionesManuales: n(t.rotacionesManuales),
        inicio: t.inicio ?? '',
        fin: t.fin ?? '',
        transcurridoS: n(t.transcurridoS),
        duracionS: n(t.duracionS, n(motor.ajustes?.duracionDelTurnoH) * 3600),
        activasEnPantalla: n(t.activasEnPantalla),
        tickets: n(t.tickets),
        proximaRotacionEnS: esNumero(t.proximaRotacionEnS) ? t.proximaRotacionEnS : null,
        demoras: {
            total: n(t.demoras?.total),
            entradas: n(t.demoras?.entradas),
            fuertes: n(t.demoras?.fuertes),
            postres: n(t.demoras?.postres),
            otros: n(t.demoras?.otros),
        },
    };
}




//  ── CÓMO LE VA A LA IA CON ESTA PANTALLA ─────────────────────────────────────

const segundosCortos = (s) => (s < 10 ? `${conComa(Math.round(s * 10) / 10)} s` : `${Math.round(s)} s`);


/*  La frase de la cabecera: cómo acabó la ÚLTIMA lectura de la ventana de la tablet.
 *
 *  Este simulador solo pinta. Las tiras las lee siempre el servidor de IA —el de
 *  Opciones → Servidor de IA—, igual que con la tablet del restaurante, y aquí no se decide ni se
 *  contesta nada. Pero desde fuera «no sale nada en la parrilla» puede ser que la tira
 *  no ha vuelto todavía, que volvió con error o que el modelo no vio ningún ticket, y
 *  con la IA a tres cuartos de minuto por tira conviene tenerlo a la vista.
 *
 *  El dato llega con cada inferencia que publica la ventana de la tablet: es el mismo
 *  diagnóstico que enseña su barra de abajo ('tira', 'tiras', 'leidos', 'segundos',
 *  'error'). No se cuenta nada aquí, solo se repite lo último que dijo.
 */
function ultimaLecturaDeLaIA(inferencia, tabletViva) {
    const lectura = inferencia?.lectura ?? null;

    if (!lectura) {
        return {
            texto: tabletViva ? 'Lee la IA de verdad · todavía no ha vuelto leída ninguna tira' : 'Lee la IA de verdad',
            fallo: '',
            titulo: 'Cada tira de esta pantalla viaja al servidor de IA, como con la tablet de verdad. La primera puede tardar cerca de un minuto en volver.',
        };
    }

    const cualTira = esNumero(lectura.tira) ? `tira ${lectura.tira + 1}${esNumero(lectura.tiras) ? ` de ${lectura.tiras}` : ''}` : 'última tira';

    if (lectura.error) {
        return {
            texto: `Lee la IA de verdad · ${cualTira}`,
            fallo: String(lectura.error),
            titulo: 'La última tira no llegó a leerse. El motivo entero, al pasar el ratón por él.',
        };
    }

    const partes = ['Lee la IA de verdad', cualTira];

    if (esNumero(lectura.segundos)) partes.push(segundosCortos(lectura.segundos));
    if (esNumero(lectura.leidos)) partes.push(plural(lectura.leidos, 'ticket leído', 'tickets leídos'));
    if (lectura.descartados > 0) partes.push(plural(lectura.descartados, 'descartado', 'descartados'));

    return {
        texto: partes.join(' · '),
        fallo: '',
        titulo: `La última tira que volvió leída del servidor de IA: cuál era, cuánto tardó y cuántos tickets trajo.${lectura.modelo ? ` Modelo: ${lectura.modelo} (el que tiene el servidor; no está escrito en ningún sitio).` : ''}`,
    };
}




export default function AppSimulador() {

    const [ajustes, setAjustes] = useState(leerAjustes);
    const ajustesRef = useRef(ajustes);

    const motorRef = useRef(null);
    if (!motorRef.current) {
        motorRef.current = crearMotor({ ajustes: soloDelMotor(ajustes) });
        if (ESCENA_INICIAL) cargarEscena(motorRef.current, ESCENA_INICIAL);
    }
    const motor = motorRef.current;

    const lienzoRef = useRef(null);
    const maquetaRef = useRef(null);

    /*  QUÉ PANTALLA SE ENSEÑA. Con la cocina llena las tarjetas no caben en una, y Toast
     *  no las encoge: las que sobran quedan en la pantalla siguiente, a la que se pasa
     *  con «→|». Lo que ve —y lee— la ventana de la tablet es SOLO la que está a la vista.
     *
     *  Va en una ref porque quien la usa es 'pintar', que corre fuera del pintado de
     *  React (cuatro veces por segundo, y cada vez que la tablet pide una captura). El
     *  estado de al lado es solo para que el panel enseñe «Pantalla 1 de 2», y 'pintar'
     *  lo pone al día únicamente cuando cambia. No es un ajuste y NO se guarda: mañana
     *  habrá otras tarjetas, y amanecer en la pantalla 3 de una cocina vacía no es nada.
     */
    const paginaRef = useRef(0);
    const [pantalla, setPantalla] = useState({ pagina: 0, paginas: 1 });

    //  Un latido por segundo: es lo que refresca el reloj, el estado del turno y la
    //  tabla del registro. La pantalla NO depende de él — se repinta sola y, sobre todo,
    //  cada vez que la ventana de la tablet pide una captura.
    const [latido, setLatido] = useState(0);

    const [inferencia, setInferencia] = useState(null);

    //  ¿Se ha pulsado ya «Empezar» en esta sesión? Hasta entonces la pantalla está en
    //  blanco a propósito. No se guarda: cada vez que se abre el simulador se empieza
    //  de cero (ver 'leerAjustes').
    const [empezado, setEmpezado] = useState(Boolean(ESCENA_INICIAL));

    //  Las capturas NO van en el estado: la ventana de la tablet pide varias por segundo,
    //  y redibujar la aplicación entera —tabla del registro incluida— con cada una era
    //  tirar trabajo. Si está conectada o no, lo cuenta el latido.
    const capturasRef = useRef({ cuantas: 0, ultima: 0 });


    //  ── PINTAR ───────────────────────────────────────────────────────────────

    const pintar = useCallback(() => {
        const lienzo = lienzoRef.current;
        if (!lienzo) return null;

        const a = ajustesRef.current;

        motor.avanzar(Date.now());

        const tema = temaCon(a.tema, { idioma: a.idioma, alto: a.alto, estacion: a.estacion });

        const ancho = tema.ancho * a.escala;
        const alto = tema.alto * a.escala;
        if (lienzo.width !== ancho || lienzo.height !== alto) { lienzo.width = ancho; lienzo.height = alto; }

        const ctx = lienzo.getContext('2d');
        ctx.setTransform(a.escala, 0, 0, a.escala, 0, 0);

        const medir = (texto, css) => { ctx.font = css; return ctx.measureText(texto).width; };

        const visibles = motor.visibles();
        const maqueta = maquetar(visibles, tema, medir, { desplazamiento: a.vistaTotal ? ANCHO_VISTA_TOTAL : 0, pagina: paginaRef.current });

        //  La página pedida puede no existir ya —se despacharon tarjetas, se cerró la
        //  vista «All day» y caben más columnas—: maquetar la recorta, y aquí se apunta la
        //  que de verdad pintó. Si no, «|←» habría que tocarlo varias veces para volver
        //  de una pantalla 4 que ya no está.
        paginaRef.current = maqueta.pagina;
        setPantalla(p => (p.pagina === maqueta.pagina && p.paginas === maqueta.paginas ? p : { pagina: maqueta.pagina, paginas: maqueta.paginas }));

        //  «Vista» es lo que salió en la pantalla que se enseñaba: una tarjeta que pasó
        //  toda su vida en la pantalla 2 sin que nadie fuera a verla, no salió.
        motor.marcarVistas(maqueta.idsVisibles);

        //  La vista «All day»: cuántos hay pendientes de cada producto.
        const conteo = new Map();
        for (const tarjeta of visibles) {
            if (tarjeta.estado === 'despachada') continue;
            for (const item of tarjeta.items) {
                if (!item.hecho) conteo.set(item.nombre, (conteo.get(item.nombre) ?? 0) + item.cantidad);
            }
        }

        const zonasDeBarra = pintarPantalla(ctx, {
            tema,
            maqueta,
            umbrales: { amarilloS: a.amarilloS, rojoS: a.rojoS },
            estado: {
                hora: motor.reloj(),
                avisos: a.avisos,
                recientesVisibles: motor.ajustes.recientesVisibles,
                vistaTotal: a.vistaTotal,
                totalTickets: visibles.length,
                conteo: [...conteo.entries()].sort((x, y) => y[1] - x[1]),
            },
        });

        maquetaRef.current = { ...maqueta, zonasDeBarra, tema, visibles };
        return maquetaRef.current;
    }, [motor]);

    //  Tras tocar algo a mano —una tarjeta, un botón del panel— no se espera al latido:
    //  se repinta la pantalla y se pone al día todo lo que sale del motor. Devuelve la
    //  maqueta recién pintada, por si quien llama quiere saber dónde cayó algo.
    const refrescar = useCallback(() => { const maqueta = pintar(); setLatido(n => n + 1); return maqueta; }, [pintar]);

    //  Pasar de pantalla, desde el lienzo («|←» y «→|») o desde el panel. Por arriba no
    //  se acota aquí: cuántas pantallas hay solo lo sabe maquetar, que recorta.
    const verPantalla = useCallback((cual) => { paginaRef.current = Math.max(0, cual); return refrescar(); }, [refrescar]);
    const pasarPagina = useCallback((salto) => verPantalla(paginaRef.current + salto), [verPantalla]);


    //  ── AJUSTES ──────────────────────────────────────────────────────────────

    const cambiar = useCallback((cambios) => setAjustes(actual => ({ ...actual, ...cambios })), []);

    useEffect(() => {
        ajustesRef.current = ajustes;
        motor.ajustar(soloDelMotor(ajustes));

        if (GUARDAR_AJUSTES) {
            try { localStorage.setItem(CLAVE_AJUSTES, JSON.stringify(ajustes)); }
            catch { /* sin almacenamiento los ajustes duran lo que la ventana */ }
        }

        pintar();
    }, [ajustes, motor, pintar]);


    //  ── ARRANQUE: la letra de Toast, la escena pedida y el latido ────────────

    useEffect(() => {
        document.title = 'Simulador de Toast';

        //  Toast está hecho para Android y usa Roboto. Sin ella el lienzo pinta con la
        //  letra del sistema, que es más ancha: los textos se parten por otro sitio y
        //  la pantalla deja de parecerse a la de verdad.
        if (!document.getElementById('sim-roboto')) {
            const enlace = document.createElement('link');
            enlace.id = 'sim-roboto';
            enlace.rel = 'stylesheet';
            enlace.href = 'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,500;0,700;1,400&display=swap';
            document.head.appendChild(enlace);
        }

        const cargarLetra = () => Promise.all(
            ['400 18px Roboto', '500 20px Roboto', '700 18px Roboto', 'italic 400 14px Roboto'].map(f => document.fonts.load(f))
        ).then(pintar).catch(() => { /* sin red se queda la letra del sistema */ });

        cargarLetra();
        const reintento = setTimeout(cargarLetra, 1500);

        const repintar = setInterval(pintar, 250);
        const latir = setInterval(() => setLatido(n => n + 1), 1000);

        return () => { clearTimeout(reintento); clearInterval(repintar); clearInterval(latir); };
    }, [pintar]);


    //  ── EL CABLE CON LA VENTANA DE LA TABLET ─────────────────────────────────

    useEffect(() => {
        const canal = abrirCanal();

        canal.onmessage = async (evento) => {
            const mensaje = evento.data;
            if (!mensaje?.t) return;

            const a = ajustesRef.current;

            if (mensaje.t === 'hola') {
                const tema = temaCon(a.tema, { idioma: a.idioma, alto: a.alto, estacion: a.estacion });
                responder(canal, mensaje.id, { nombre: tema.estacion, ancho: tema.ancho * a.escala, alto: tema.alto * a.escala });
            }

            if (mensaje.t === 'hora') {
                motor.avanzar(Date.now());
                responder(canal, mensaje.id, { hora: motor.reloj() });
            }

            if (mensaje.t === 'captura') {
                //  Se repinta JUSTO antes de fotografiar: esta ventana suele estar tapada
                //  por Jarvis, y tapada el navegador le frena los temporizadores. La
                //  captura no puede depender de cuándo tocó repintar por última vez.
                pintar();

                const lienzo = lienzoRef.current;
                const blob = lienzo && await new Promise(resolve => lienzo.toBlob(resolve, 'image/png'));
                if (!blob) return responder(canal, mensaje.id, { error: 'El simulador no pudo pintar la pantalla' });

                responder(canal, mensaje.id, { png: await blob.arrayBuffer(), hora: motor.reloj() });
                capturasRef.current = { cuantas: capturasRef.current.cuantas + 1, ultima: Date.now() };
            }

            //  Y nada más que eso: este simulador sirve la pantalla y la hora. Leer, lee
            //  siempre el servidor de IA, desde la ventana de la tablet. Lo que ella
            //  infiere vuelve aquí solo para ponerlo junto a la verdad.
            if (mensaje.t === 'inferencia') setInferencia({ ...mensaje, recibidaEn: Date.now() });
        };

        return () => canal.close();
    }, [motor, pintar]);


    //  ── TOQUES EN LA PANTALLA, como en la tablet ─────────────────────────────

    const alTocar = (evento) => {
        const maqueta = maquetaRef.current;
        const lienzo = lienzoRef.current;
        if (!maqueta || !lienzo) return;

        //  Del punto del ratón a coordenadas de la tablet: el lienzo se ve encogido.
        const caja = lienzo.getBoundingClientRect();
        const x = (evento.clientX - caja.left) * maqueta.tema.ancho / caja.width;
        const y = (evento.clientY - caja.top) * maqueta.tema.alto / caja.height;

        const barra = maqueta.zonasDeBarra.find(z => x >= z.x && x <= z.x + z.ancho && y >= z.y && y <= z.y + z.alto);

        if (barra?.accion === 'recientes') return cambiar({ recientesVisibles: !ajustesRef.current.recientesVisibles });
        if (barra?.accion === 'vistaTotal') return cambiar({ vistaTotal: !ajustesRef.current.vistaTotal });
        if (barra?.accion === 'recuperar') { motor.recuperar(); return refrescar(); }
        if (barra?.accion === 'paginaAnterior') return pasarPagina(-1);
        if (barra?.accion === 'paginaSiguiente') return pasarPagina(1);

        const zona = zonaEn(maqueta, x, y);
        if (!zona) return;

        if (zona.accion === 'producto') motor.alternarProducto(zona.tarjetaId, zona.indice);
        if (zona.accion === 'despachar') motor.despacharTarjeta(zona.tarjetaId);
        if (zona.accion === 'disparar') motor.dispararTarjeta(zona.tarjetaId);

        refrescar();
    };


    //  ── EL REGISTRO, CON LO INFERIDO AL LADO ─────────────────────────────────

    /*  Se rehace con cada latido y no con cada pintado: mientras una tarjeta se cocina
     *  su preparación y su demora cambian segundo a segundo, pero mover un deslizador
     *  del panel —que redibuja la aplicación muchas veces por segundo— no tiene por qué
     *  recalcular ni repintar una tabla de cientos de filas.
     */
    const comparacion = useMemo(() => comparar({
        registro: motor.registro(),
        turno: leerTurno(motor),
        inferencia,
        toleranciaS: ajustes.toleranciaS,
        limites: { entradaMin: ajustes.limiteEntradaMin, fuerteMin: ajustes.limiteFuerteMin, postreMin: ajustes.limitePostreMin },
    }), [motor, latido, inferencia, ajustes.toleranciaS, ajustes.limiteEntradaMin, ajustes.limiteFuerteMin, ajustes.limitePostreMin]);


    const exportar = useCallback((formato) => {

        //  El PDF no es una descarga: se arma una página con los aciertos y los desaciertos y se
        //  manda a imprimir. En el diálogo se elige «Guardar como PDF» y queda el archivo.
        if (formato === 'pdf') {
            openReport(buildReportHtml({ comparacion, semilla: motor.semilla }));

            return;
        }

        const filas = comparacion.filas.map(({ verdad, ia, dToma, dListo, veredicto, iaPrepS, iaLimiteS, iaDemora, demoraCoincide }) => ({
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

        //  En la hoja de cálculo, un «sí» se lee mejor que un TRUE y un hueco mejor que un null.
        const celda = (v) => (v === null || v === undefined ? '' : v === true ? 'sí' : v === false ? 'no' : String(v));

        const contenido = formato === 'json'
            ? JSON.stringify({
                semilla: motor.semilla,
                exportadoEn: new Date().toISOString(),
                ajustes: ajustesRef.current,
                turno: typeof motor.turno === 'function' ? motor.turno() : null,
                resumen: comparacion.resumen,
                ultimaLectura: inferencia?.lectura ?? null,
                filas,
                fantasmas: comparacion.fantasmas,
            }, null, 2)
            : [Object.keys(filas[0] ?? { vacio: '' }).join(';'), ...filas.map(f => Object.values(f).map(v => `"${celda(v).replace(/"/g, '""')}"`).join(';'))].join('\r\n');

        //  La marca de orden de bytes por delante: sin ella Excel abre el CSV como si no
        //  fuera UTF-8 y destroza los acentos.
        const enlace = document.createElement('a');
        enlace.href = URL.createObjectURL(new Blob([formato === 'json' ? contenido : `﻿${contenido}`], { type: formato === 'json' ? 'application/json' : 'text/csv' }));
        enlace.download = `simulacion-toast-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${formato}`;
        enlace.click();
        setTimeout(() => URL.revokeObjectURL(enlace.href), 5000);
    }, [comparacion, motor, inferencia]);

    const borrarRegistro = useCallback(() => { motor.borrarRegistro(); refrescar(); }, [motor, refrescar]);

    //  Los botones de cada fila del registro. Hacen lo mismo que un toque en la pantalla,
    //  pero sin tener que dar con la tarjeta —que a lo mejor está tres páginas a la
    //  derecha—, y tras cada uno se repinta sin esperar al latido. Van en un objeto que
    //  no cambia para que la tabla, que es 'memo', no se redibuje por su culpa.
    const accionesDeTarjeta = useMemo(() => ({
        disparar: (id) => { motor.dispararTarjeta(id); refrescar(); },
        lista: (id) => { motor.marcarLista(id); refrescar(); },
        despachar: (id) => { motor.despacharTarjeta(id); refrescar(); },
    }), [motor, refrescar]);


    //  ── PINTADO ──────────────────────────────────────────────────────────────

    if (SOLO_PANTALLA) return <div className='sim-solo'><canvas ref={lienzoRef} onClick={alTocar} /></div>;

    const ahora = Date.now();
    const tabletViva = ahora - capturasRef.current.ultima < 4000;

    const turno = leerTurno(motor);
    const lee = ultimaLecturaDeLaIA(inferencia, tabletViva);

    const otroTurno = () => { motor.reiniciarTurno?.(); cambiar({ turnoEnMarcha: true }); refrescar(); };

    /*  LOS DOS BOTONES DE ENCIMA DE LA PANTALLA
     *
     *  «Empezar» abre la puerta: a partir de ahí entran mesas y pedidos para llevar. La
     *  PRIMERA vez además pone el turno a cero, para que sus ocho horas cuenten desde ese
     *  momento y no desde que se abrió la ventana. Las siguientes solo reanuda.
     *
     *  «Dejar de recibir» la cierra: no entra nadie más, pero lo que ya está en cocina
     *  sigue hasta despacharse — como un restaurante que deja de sentar gente.
     */
    const empezar = () => {
        if (!empezado) motor.reiniciarTurno?.();
        setEmpezado(true);
        cambiar({ turnoEnMarcha: true });
        refrescar();
    };

    const dejarDeRecibir = () => { cambiar({ turnoEnMarcha: false }); refrescar(); };

    const parada = !ajustes.turnoEnMarcha || !ajustes.autoCocina;

    return (
        <div className='sim-app'>

            <header className='sim-barra'>
                <div className='sim-barra__titulo'>
                    <h1>Simulador de Toast · pantalla de cocina</h1>
                    <div className='sim-barra__sub'>Herramienta de desarrollo. Nada de lo que pasa aquí llega a Jarvis.</div>
                </div>

                <span className='sim-hueco' />

                <span className='sim-lee'>
                    <span className='sim-lee__texto' title={`${lee.texto}\n${lee.titulo}`}>{lee.texto}</span>
                    {lee.fallo && <span className='sim-lee__fallo sim-aviso' title={lee.fallo}> · la última falló: {recortar(lee.fallo, 48)}</span>}
                </span>

                <span className={`sim-estado ${tabletViva ? 'sim-estado--vivo' : ''}`} title={`La ventana de la tablet pide una captura varias veces por segundo mientras está conectada en modo simulación. Lleva ${capturasRef.current.cuantas}.`}>
                    <span className='sim-estado__punto' />
                    {tabletViva ? 'Ventana de la tablet conectada' : 'Esperando a la ventana de la tablet'}
                </span>

                <span className='sim-reloj' title='El reloj de la tablet simulada'>{motor.reloj()}</span>
            </header>


            <div className='sim-cuerpo'>

                <main className='sim-pantalla'>

                    {/*  Con una escena cargada —o un ticket hecho a mano— la pantalla ya no está
                         en blanco aunque nadie haya pulsado «Empezar»: el mando no debe decirlo.  */}
                    <MandoDeLaSimulacion
                        empezado={empezado || motor.visibles().length > 0}
                        entrando={ajustes.turnoEnMarcha}
                        turno={turno}
                        tabletViva={tabletViva}
                        inferencia={inferencia}
                        alEmpezar={empezar}
                        alDejarDeRecibir={dejarDeRecibir}
                    />

                    {!ajustes.autoCocina && (
                        <div className='sim-franja' role='status'>
                            <span><b>La cocina está en manual:</b> nada se marca ni se despacha solo. Toca los productos en la pantalla, o usa «Listo» y «Despachar» en el registro.</span>
                            <button type='button' className='sim-boton sim-boton--chico sim-boton--ambar' onClick={() => cambiar({ autoCocina: true })}>Que cocine sola</button>
                        </div>
                    )}

                    {!parada && turno.terminado && (
                        <div className='sim-franja sim-franja--fin' role='status'>
                            <span><b>El turno terminó:</b> ya pasaron sus {plural(turno.rotacionesDelTurno, 'mesa', 'mesas')} y no entra ninguna más.</span>
                            <button type='button' className='sim-boton sim-boton--chico' onClick={otroTurno}>↺ Empezar otro turno</button>
                        </div>
                    )}

                    <div className='sim-pantalla__lienzo'>
                        <div className='sim-tablet'>
                            <canvas ref={lienzoRef} onClick={alTocar} aria-label='Pantalla de la tablet simulada. Toca un producto para marcarlo hecho, la cabecera de una tarjeta para despacharla, o las flechas del contador de tickets para pasar de pantalla.' />
                        </div>
                    </div>

                </main>

                <Panel ajustes={ajustes} cambiar={cambiar} motor={motor} refrescar={refrescar} turno={turno} lee={lee} pantalla={pantalla} pasarPagina={pasarPagina} verPantalla={verPantalla} empezado={empezado} alEmpezar={empezar} alDejarDeRecibir={dejarDeRecibir} />

            </div>


            <RegistroComparado comparacion={comparacion} hayInferencia={Boolean(inferencia)} toleranciaS={ajustes.toleranciaS} parada={parada} cambiar={cambiar} exportar={exportar} alBorrar={borrarRegistro} acciones={accionesDeTarjeta} />

        </div>
    );
}




//  ── EL PANEL DE CONTROL ──────────────────────────────────────────────────────

/*  Cada grupo del panel se pliega. El panel ya no cabe en una pantalla, y lo que se toca
 *  a diario —el turno, los tiempos, la cocina— no tiene por qué quedar enterrado bajo
 *  lo que se ajusta una vez y se olvida. Es un <details> de los de siempre: se abre con
 *  el teclado y lo anuncia un lector de pantalla sin tener que enseñarle nada.
 */
function Seccion({ titulo, abierta = true, children }) {
    return (
        <details className='sim-seccion' open={abierta}>
            <summary><h2>{titulo}</h2></summary>
            {children}
        </details>
    );
}

function Deslizador({ rotulo, valor, min, max, paso = 1, alCambiar, formato = v => v, ayuda, pista }) {
    const id = useId();

    //  Un valor que no sea un número (un ajuste que el motor cargado no conoce) no
    //  puede dejar el control sin valor: React lo daría por «no controlado».
    const seguro = esNumero(valor) ? valor : min;

    return (
        <>
            <div className='sim-fila' title={ayuda}>
                <label htmlFor={id}>{rotulo}</label>
                <input
                    id={id} type='range' min={min} max={max} step={paso} value={seguro}
                    onChange={e => alCambiar(Number(e.target.value))}
                    aria-valuetext={String(formato(seguro))}
                    aria-describedby={pista ? `${id}-pista` : undefined}
                />
                <output className='sim-fila__valor' htmlFor={id}>{formato(seguro)}</output>
            </div>
            {pista && <p id={`${id}-pista`} className='sim-pista'>{pista}</p>}
        </>
    );
}

function Interruptor({ rotulo, valor, alCambiar, ayuda }) {
    return (
        <div className='sim-fila' title={ayuda}>
            <label className='sim-interruptor'>
                <input type='checkbox' checked={valor === true} onChange={e => alCambiar(e.target.checked)} />
                {rotulo}
            </label>
        </div>
    );
}


function EstadoDelTurno({ turno, enMarcha, empezado, velocidad }) {

    if (!turno.disponible) return <p className='sim-ayuda'>El motor que está cargado no lleva la cuenta del turno: aquí no hay nada que enseñar.</p>;

    const { rotacionesIniciadas: iniciadas, rotacionesDelTurno: total } = turno;

    const titular = turno.terminado ? `Turno terminado: ${iniciadas} de ${total}` : enMarcha ? 'Turno en marcha' : empezado ? 'Turno en pausa' : 'Turno sin empezar';

    const detalles = [];
    if (!turno.terminado) {
        detalles.push(`mesa ${iniciadas} de ${total}`);
        detalles.push(`${horasMin(turno.transcurridoS)} de ${horasMin(turno.duracionS)}`);

        if (iniciadas >= total) detalles.push(`ya entraron todas · quedan ${turno.activasEnPantalla} en cocina`);
        else if (enMarcha && turno.proximaRotacionEnS !== null) detalles.push(`próxima mesa en ${enUnRato(turno.proximaRotacionEnS)}`);
    }

    const avanceMesas = total > 0 ? Math.min(1, iniciadas / total) : 0;
    const avanceReloj = turno.duracionS > 0 ? Math.min(1, turno.transcurridoS / turno.duracionS) : 0;

    const proximaDeVerdad = velocidad > 1 && turno.proximaRotacionEnS !== null
        ? ` La próxima mesa llega en ${enUnRato(turno.proximaRotacionEnS / velocidad)} de los de verdad.`
        : '';

    return (
        <div className={`sim-turno ${turno.terminado ? 'sim-turno--fin' : enMarcha ? '' : 'sim-turno--pausa'}`}>
            <p className='sim-turno__estado' title={`Las horas son del reloj de la tablet, que corre a ×${velocidad}.${proximaDeVerdad}`}>
                <b>{titular}</b>{detalles.map(d => <span key={d}> · {d}</span>)}
            </p>

            <div
                className='sim-turno__barra' role='progressbar' aria-label='Mesas del turno que ya han entrado'
                aria-valuemin={0} aria-valuemax={total} aria-valuenow={iniciadas} aria-valuetext={`${iniciadas} de ${total} mesas`}
                title={`Relleno: mesas que ya entraron (${iniciadas} de ${total}). Marca: por dónde va el reloj del turno (${turno.inicio || '—'} → ${turno.fin || '—'}).`}
            >
                <span className='sim-turno__relleno' style={{ width: `${avanceMesas * 100}%` }} />
                <span className='sim-turno__marca' style={{ left: `${avanceReloj * 100}%` }} />
            </div>

            <p className='sim-turno__cifras'>
                en pantalla <b>{turno.activasEnPantalla}</b> · tickets <b>{turno.tickets}</b> · mesas terminadas <b>{turno.rotacionesTerminadas}</b>
                {turno.rotacionesManuales > 0 && <> · a mano <b>{turno.rotacionesManuales}</b></>} · demoras <b className={turno.demoras.total > 0 ? 'sim-mal' : ''}>{turno.demoras.total}</b>
            </p>
        </div>
    );
}


//  ── CREAR UN TICKET A MANO ───────────────────────────────────────────────────

//  Los pedidos, con el nombre con el que Toast los encabeza. La mesa no lleva rótulo.
const PEDIDOS = Object.entries(TIPOS_DE_ORDEN).map(([id, { rotulo }]) => ({ id, nombre: rotulo || 'Mesa' }));

const TIPOS_DE_PLATO = [
    { curso: ENTRADA, nombre: 'Entrada (Appetizer)', corto: 'Entrada', grupo: 'Entradas', limite: 'limiteEntradaMin' },
    { curso: FUERTE, nombre: 'Plato fuerte (Entree)', corto: 'Plato fuerte', grupo: 'Platos fuertes', limite: 'limiteFuerteMin' },
    { curso: POSTRE, nombre: 'Postre (Dessert)', corto: 'Postre', grupo: 'Postres', limite: 'limitePostreMin' },

    //  Lo que no tiene curso se mide con la vara del plato fuerte, como hace el motor.
    { curso: '', nombre: 'Sin curso', corto: 'sin curso', grupo: '', limite: 'limiteFuerteMin' },
];

//  La carta trae la PARRILLA MULTICULTURAL dos veces —son dos variantes, para que al
//  motor le salga de las dos maneras—; en un desplegable, dos renglones iguales sobran.
const sinRepetir = (platos) => platos.filter((plato, i) => platos.findIndex(p => p.nombre === plato.nombre) === i);

/*  Los platos que enseña el desplegable según el tipo de plato elegido: los de ESE
 *  tipo. «Sin curso» empieza por lo que de verdad sale sin franja —los acompañantes
 *  sueltos— y debajo deja todo lo demás agrupado: un Take Out no tiene curso y lleva
 *  platos fuertes. Sale de la carta y no de una lista escrita aquí: si mañana cambia la
 *  carta del restaurante, el formulario cambia con ella.
 */
const gruposDePlatos = (curso) => (curso
    ? [{ titulo: '', platos: sinRepetir(platosDelCurso(curso)) }]
    : [
        { titulo: 'Acompañantes sueltos', platos: SUELTOS },
        ...TIPOS_DE_PLATO.filter(tipo => tipo.curso).map(tipo => ({ titulo: tipo.grupo, platos: sinRepetir(platosDelCurso(tipo.curso)) })),
        { titulo: 'Bebidas', platos: BEBIDAS },
    ]
).filter(grupo => grupo.platos.length > 0);

//  Los modificadores que un plato trae SIEMPRE en la carta (la morcilla y el chorizo de
//  la parrillita): sin ellos la tarjeta pintada no se parecería a la de verdad.
const modificadoresFijos = (nombre) => [...PLATOS, ...SUELTOS, ...BEBIDAS].find(plato => plato.nombre === nombre)?.extras ?? [];

const enteroDelCampo = (texto) => { const n = Math.floor(Number(texto)); return String(texto).trim() !== '' && Number.isFinite(n) && n >= 1 ? n : null; };


/*  El formulario para meter en la pantalla un ticket con lo que uno quiera.
 *
 *  Todo lo que se elige aquí vive en este componente y no en los ajustes: no es una
 *  preferencia del simulador, es un pedido a medio escribir. Tras crear el ticket se
 *  vacía la lista de platos y SE CONSERVA lo demás, porque lo normal es mandar varios
 *  seguidos casi iguales: la entrada, y luego el fuerte del mismo ticket.
 */
function TicketAMano({ motor, refrescar, ajustes }) {

    const [pedido, setPedido] = useState('mesa');
    const [mesa, setMesa] = useState('');
    const [numero, setNumero] = useState('');
    const [curso, setCurso] = useState(ENTRADA);

    const [plato, setPlato] = useState('');
    const [cantidad, setCantidad] = useState('1');
    const [nota, setNota] = useState('');

    const [renglones, setRenglones] = useState([]);
    const renglonSiguiente = useRef(1);

    const [cocinaManual, setCocinaManual] = useState(true);
    const [enPausa, setEnPausa] = useState(false);

    const [aviso, setAviso] = useState(null);

    const esMesa = pedido === 'mesa';
    const tipoDePlato = TIPOS_DE_PLATO.find(tipo => tipo.curso === curso) ?? TIPOS_DE_PLATO[0];
    const grupos = gruposDePlatos(curso);

    //  Sin plato elegido vale el primero de la lista, que es lo que el desplegable enseña.
    const nombres = grupos.flatMap(grupo => grupo.platos.map(p => p.nombre));
    const platoElegido = nombres.includes(plato) ? plato : (nombres[0] ?? '');

    //  Otro tipo de plato es otra lista: se empieza por su primer plato, aunque el que
    //  estaba elegido siga en ella («Sin curso» los trae todos). Que el desplegable
    //  conserve a veces sí y a veces no lo elegido es peor que no conservarlo nunca.
    const cambiarDeCurso = (nuevo) => { setCurso(nuevo); setPlato(''); };

    //  Un pedido para llevar no lleva franja de curso en Toast: al elegirlo, el tipo de
    //  plato pasa a «Sin curso» (que enseña todos los platos). Se puede volver a cambiar.
    const cambiarDePedido = (id) => {
        setPedido(id);
        if (id !== 'mesa' && pedido === 'mesa') cambiarDeCurso('');
    };

    const anadir = () => {
        if (!platoElegido) return;

        setRenglones(lista => [...lista, {
            id: renglonSiguiente.current++,
            nombre: platoElegido,
            cantidad: Math.min(99, enteroDelCampo(cantidad) ?? 1),
            nota: nota.trim(),
            mods: modificadoresFijos(platoElegido),
        }]);

        setCantidad('1');
        setNota('');
        setAviso(null);
    };

    const crear = () => {
        const id = motor.crearTicketManual({
            tipoOrden: pedido,
            mesa: esMesa ? enteroDelCampo(mesa) : null,
            numero: esMesa ? enteroDelCampo(numero) : null,
            curso,
            productos: renglones.map(({ nombre, cantidad: cuantos, nota: apunte, mods }) => ({ nombre, cantidad: cuantos, nota: apunte, mods })),
            cocinaManual,
            enPausa,
        });

        //  'refrescar' repinta y devuelve la maqueta: de ahí sale en qué pantalla cayó.
        const maqueta = refrescar();

        if (id === null || id === undefined) return setAviso({ mal: true, texto: 'No se ha creado nada: el ticket no lleva ningún plato.' });

        const registro = motor.registro();
        const fila = registro.find(f => f.id === id);

        //  Mismo número y mismo tipo de plato que otra tarjeta que sigue en pantalla: las
        //  dos dan la misma clave y la ventana de la tablet las tomará por un solo pedido.
        const gemela = registro.some(f => f.id !== id && f.clave === fila?.clave && f.estado !== 'retirada');

        /*  La nueva va la ÚLTIMA, como en Toast: con la cocina llena no cae en la pantalla
         *  que se está viendo sino en otra más a la derecha, y hay que decirlo — un ticket
         *  recién creado que no aparece se toma por un botón que no funciona. Se dice en
         *  CUÁL quedó y cómo se llega, porque la ventana de la tablet solo lee la pantalla
         *  que está a la vista: mientras nadie vaya a ella, ese ticket no existe para Jarvis.
         */
        const suPantalla = maqueta?.paginaDeLaTarjeta?.get(id);
        const saltos = esNumero(suPantalla) ? suPantalla - maqueta.pagina : 0;

        const flecha = saltos > 0 ? '«→|»' : '«|←»';
        const veces = Math.abs(saltos) > 1 ? ` (${Math.abs(saltos)} veces)` : '';

        //  La barra oscura de Toast no lleva contador de tickets: ahí solo queda el panel.
        const comoLlegar = ajustes.tema === 'clara'
            ? `Se llega con ${flecha}${veces}, junto al contador de tickets de la pantalla de Toast, o con ${saltos > 0 ? '▶' : '◀'} en «Pantalla de Toast».`
            : `Se llega con ${saltos > 0 ? '▶' : '◀'}${veces} en «Pantalla de Toast», en este panel.`;

        //  Por si no se ve y no se sabe por qué (no debería pasar): que no quede sin decir.
        const noSeVe = saltos === 0 && fila?.vistaEnPantalla === false;

        setRenglones([]);
        setAviso({
            mal: gemela || saltos !== 0 || noSeVe,
            texto: `Creado: ${esMesa ? `mesa ${fila?.mesa}` : PEDIDOS.find(p => p.id === pedido)?.nombre} · ticket #${fila?.ticket} · ${tipoDePlato.corto}${enPausa ? ' · en pausa' : ''}.`
                + (gemela ? ' Ojo: ya había en pantalla otra tarjeta de ese ticket con el mismo tipo de plato. Comparten clave, así que la ventana de la tablet las verá como un solo pedido.' : '')
                + (saltos !== 0 ? ` Ojo: ha quedado en la pantalla ${suPantalla + 1} de ${maqueta.paginas} y se está viendo la ${maqueta.pagina + 1} —las tarjetas más antiguas van delante—, así que la ventana de la tablet todavía no lo ve: solo lee la pantalla que está a la vista. ${comoLlegar} Mientras, se maneja desde su fila del registro.` : '')
                + (noSeVe ? ' Ojo: ahora mismo no sale en la pantalla, así que la ventana de la tablet todavía no lo ve. Mientras, se maneja desde su fila del registro.' : '')
                + (!gemela && saltos === 0 && !noSeVe && esMesa ? ` Para mandarle otro curso, pon ${fila?.ticket} en «Ticket #».` : ''),
        });
    };

    return (
        <div className='sim-tm'>

            <div className='sim-fila'>
                <label htmlFor='sim-tm-pedido'>Pedido</label>
                <select id='sim-tm-pedido' value={pedido} onChange={e => cambiarDePedido(e.target.value)}>
                    {PEDIDOS.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
            </div>

            {esMesa && (
                <div className='sim-tm__par'>
                    <label htmlFor='sim-tm-mesa' title='En blanco, una mesa que esté libre'>Mesa nº</label>
                    <input id='sim-tm-mesa' type='number' min={1} max={999} value={mesa} placeholder='libre' onChange={e => setMesa(e.target.value)} />

                    <label htmlFor='sim-tm-numero' title='En blanco, un número nuevo. Con el número de un ticket que ya está en pantalla, esta tarjeta es OTRO curso de ese ticket: hereda su mesa y su mesero.'>Ticket #</label>
                    <input id='sim-tm-numero' type='number' min={1} max={99999} value={numero} placeholder='nuevo' onChange={e => setNumero(e.target.value)} />
                </div>
            )}

            <div className='sim-fila'>
                <label htmlFor='sim-tm-curso'>Tipo de plato</label>
                <select id='sim-tm-curso' value={curso} onChange={e => cambiarDeCurso(e.target.value)} aria-describedby='sim-tm-maximo'>
                    {TIPOS_DE_PLATO.map(tipo => <option key={tipo.nombre} value={tipo.curso}>{tipo.nombre}</option>)}
                </select>
                <span id='sim-tm-maximo' className='sim-tm__maximo' title='Su tiempo máximo de preparación: pasado ese tiempo desde que se dispara, cuenta como demora. Se cambia en «Tiempos máximos y demoras».'>máx. {ajustes[tipoDePlato.limite]} min</span>
            </div>

            {/*  Un formulario de verdad, para que Intro en la cantidad o en la nota añada el renglón.  */}
            <form className='sim-tm__plato' onSubmit={e => { e.preventDefault(); anadir(); }}>
                <div className='sim-fila'>
                    <label htmlFor='sim-tm-plato'>Plato</label>
                    <select id='sim-tm-plato' value={platoElegido} onChange={e => setPlato(e.target.value)}>
                        {grupos.map(grupo => (grupo.titulo
                            ? <optgroup key={grupo.titulo} label={grupo.titulo}>{grupo.platos.map(p => <option key={p.nombre} value={p.nombre}>{p.nombre}</option>)}</optgroup>
                            : grupo.platos.map(p => <option key={p.nombre} value={p.nombre}>{p.nombre}</option>)))}
                    </select>
                </div>

                <div className='sim-tm__par'>
                    <label htmlFor='sim-tm-cantidad'>Cant.</label>
                    <input id='sim-tm-cantidad' type='number' min={1} max={99} value={cantidad} onChange={e => setCantidad(e.target.value)} />

                    <label htmlFor='sim-tm-nota' title='Lo que el mesero escribe a mano: sale en la tarjeta debajo del plato'>Nota</label>
                    <input id='sim-tm-nota' className='sim-tm__nota' type='text' value={nota} maxLength={40} placeholder='opcional' onChange={e => setNota(e.target.value)} />

                    <button type='submit' className='sim-boton sim-boton--chico' disabled={!platoElegido}>Añadir</button>
                </div>
            </form>

            {renglones.length === 0
                ? <p className='sim-tm__vacia'>El ticket todavía no lleva ningún plato.</p>
                : (
                    <ul className='sim-tm__lista' aria-label='Platos del ticket'>
                        {renglones.map(renglon => (
                            <li key={renglon.id}>
                                <span className='sim-tm__cuantos'>{renglon.cantidad}</span>
                                <span className='sim-tm__nombre'>
                                    {renglon.nombre}
                                    {renglon.mods.length > 0 && <small>{renglon.mods.join(' · ')}</small>}
                                    {renglon.nota && <small><i>{renglon.nota}</i></small>}
                                </span>
                                <button type='button' className='sim-tm__quitar' onClick={() => setRenglones(lista => lista.filter(r => r.id !== renglon.id))} aria-label={`Quitar ${renglon.nombre} del ticket`} title='Quitar del ticket'>×</button>
                            </li>
                        ))}
                    </ul>
                )}

            <Interruptor rotulo='Lo preparo yo: la cocina automática no lo toca' valor={cocinaManual} alCambiar={setCocinaManual} ayuda='Encendido, a este ticket nadie le pone palomitas, ni lo despacha, ni le dispara el HOLD aunque «Cocina sola» esté en marcha: solo avanza con lo que hagas tú. Apagado, se cocina solo como cualquier otro, con su sorteo de demora.' />
            <Interruptor rotulo='Nace en pausa (HOLD)' valor={enPausa} alCambiar={setEnPausa} ayuda='La tarjeta sale retenida, como el plato fuerte de una mesa que lo mandó todo junto. Se dispara tocándola en la pantalla o con «Disparar» en su fila del registro.' />

            <div className='sim-botones' style={{ marginTop: 6 }}>
                <button type='button' className='sim-boton sim-boton--chico sim-boton--principal' onClick={crear} disabled={renglones.length === 0} title={renglones.length === 0 ? 'Añade al menos un plato' : 'Manda el ticket a la pantalla de cocina'}>
                    Crear ticket{renglones.length > 0 && ` (${plural(renglones.length, 'plato', 'platos')})`}
                </button>
            </div>

            <p className={`sim-tm__aviso ${aviso?.mal ? 'sim-aviso' : ''}`} role='status'>{aviso?.texto}</p>

            <p className='sim-ayuda'>Para marcarlo: toca un producto en la pantalla para ponerle la palomita, o usa los botones “Listo” y “Despachar” de su fila en el registro.</p>
        </div>
    );
}


/*  ─────────────────────────────────────────────────────────────────────────────
 *  EL MANDO: EMPEZAR A RECIBIR TICKETS, Y DEJAR DE RECIBIRLOS
 *
 *  Va encima de la pantalla y no en el panel porque es lo primero que hay que hacer y lo
 *  único imprescindible: el simulador amanece EN BLANCO y no entra un ticket hasta que
 *  se pulsa «Empezar».
 *
 *  El orden importa, y por eso el texto lo cuenta: primero se conecta la ventana de la
 *  tablet, que lee la pantalla vacía; después se empieza. Así no hay ningún ticket que
 *  «ya estuviera» cuando ella llegó, y los sigue todos desde su primer segundo.
 *  ───────────────────────────────────────────────────────────────────────────── */
function MandoDeLaSimulacion({ empezado, entrando, turno, tabletViva, inferencia, alEmpezar, alDejarDeRecibir }) {

    //  Lo que dice la ventana de la tablet de su primer recorrido, si ya dijo algo.
    const lectura = inferencia?.lectura ?? null;
    const apuntando = Boolean(inferencia?.censando);

    let estado;
    let detalle;

    if (!empezado) {
        estado = 'La pantalla está en blanco, esperando a que empieces';

        detalle = !tabletViva ? 'Conecta antes la ventana de la tablet (su botón «Simular»): así lee la pantalla vacía y sigue todos los tickets desde que entran.'
            : lectura?.error ? 'La ventana de la tablet está conectada, pero su última lectura falló: mira el motivo arriba. Puedes empezar igualmente.'
                : !lectura ? 'La ventana de la tablet ya está conectada y leyendo la pantalla vacía. Puedes empezar cuando quieras.'
                    : apuntando ? 'La ventana de la tablet ya está leyendo la pantalla vacía. Puedes empezar cuando quieras.'
                        : 'La ventana de la tablet ya leyó la pantalla vacía entera: todo lo que entre ahora lo sigue desde su primer segundo.';
    }
    else if (entrando && turno.rotacionesIniciadas === 0 && !turno.terminado) {
        //  Recién pulsado «Empezar»: la pantalla arranca A CERO y el primer ticket entra en
        //  un momento al azar del primer minuto. Se dice, para que no parezca que no pasa nada.
        estado = 'Turno en marcha: la pantalla empieza a cero';
        detalle = `El primer ticket entra en menos de un minuto${esNumero(turno.proximaRotacionEnS) ? ` (en ${enUnRato(turno.proximaRotacionEnS)})` : ''}. Después irán llegando al azar, según el turno del panel.`;
    }
    else if (entrando) {
        estado = turno.terminado ? 'El turno terminó' : 'Entrando tickets';
        detalle = `Mesa ${turno.rotacionesIniciadas} de ${turno.rotacionesDelTurno} · ${plural(turno.activasEnPantalla, 'ticket sin despachar', 'tickets sin despachar')}${esNumero(turno.proximaRotacionEnS) ? ` · próxima mesa en ${enUnRato(turno.proximaRotacionEnS)}` : ''}.`;
    }
    else {
        estado = 'Ya no entran tickets nuevos';
        detalle = turno.activasEnPantalla > 0
            ? `Lo que está en cocina sigue hasta despacharse: ${plural(turno.activasEnPantalla, 'queda', 'quedan')}.`
            : 'La cocina está vacía.';
    }

    return (
        <div className={`sim-mando ${entrando ? 'sim-mando--entrando' : ''}`}>
            <div className='sim-mando__texto' role='status'>
                <b>{estado}</b>
                <span>{detalle}</span>
            </div>

            <div className='sim-mando__botones'>
                <button
                    type='button'
                    className='sim-boton sim-boton--empezar'
                    onClick={alEmpezar}
                    disabled={entrando}
                    title={empezado ? 'Vuelven a entrar mesas y pedidos para llevar' : 'El turno empieza a contar desde ahora, con la pantalla a cero: el primer ticket entra en menos de un minuto y los demás van llegando al azar'}
                >
                    ▶ {empezado ? (entrando ? 'Recibiendo tickets' : 'Seguir recibiendo tickets') : 'Empezar a recibir tickets'}
                </button>

                <button
                    type='button'
                    className='sim-boton sim-boton--parar'
                    onClick={alDejarDeRecibir}
                    disabled={!entrando}
                    title='No entra ningún ticket más. Los que ya están en pantalla siguen cocinándose y se despachan.'
                >
                    ■ Dejar de recibir tickets nuevos
                </button>
            </div>
        </div>
    );
}




const TEXTO_DE_LA_VELOCIDAD ='Acelera TODO, el reloj de la tablet incluido. Un turno de 8 h a ×20 dura 24 min. La ventana de la tablet lee una tira detrás de otra, al ritmo que conteste la IA, así que a más velocidad, más margen de error en “Listo en tablet”. Con la IA de verdad déjalo en ×1.';


function Panel({ ajustes, cambiar, motor, refrescar, turno, lee, pantalla, pasarPagina, verPantalla, empezado, alEmpezar, alDejarDeRecibir }) {

    const crear = (tipo) => { motor.crearOrden(tipo); refrescar(); };

    const ponerEscena = (id) => {
        const pedidos = cargarEscena(motor, id);

        //  Quien para la simulación es esta aplicación, no la escena: así la franja de la
        //  cocina en manual y el mando de «Empezar» salen del mismo sitio que todo lo demás.
        if (pedidos) cambiar({ ...sinRetiradas(pedidos), ...SIMULACION_PARADA, recientesVisibles: true });

        //  Una escena es la foto de UNA pantalla, la primera: se vuelve a ella.
        verPantalla(0);
    };

    const variasPantallas = pantalla.paginas > 1;

    //  «Entre curso y curso» es UN número en el panel y un intervalo en el motor: lo que
    //  tarda una mesa en comerse un plato no es fijo, va de algo menos a algo más.
    const [pausaMin, pausaMax] = Array.isArray(ajustes.pausaEntreCursosS) ? ajustes.pausaEntreCursosS : [180, 480];
    const entreCursosMin = Math.min(20, Math.max(1, Math.round((pausaMin + pausaMax) / 2 / 60 * 2) / 2));

    const minutosDeTurnoDeVerdad = Math.round(ajustes.duracionDelTurnoH * 60 / Math.max(1, ajustes.velocidad));

    return (
        <aside className='sim-panel' aria-label='Controles de la simulación'>

            <Seccion titulo='Turno'>
                <EstadoDelTurno turno={turno} enMarcha={ajustes.turnoEnMarcha} empezado={empezado} velocidad={ajustes.velocidad} />

                <div className='sim-botones sim-botones--turno'>
                    <button type='button' className={`sim-boton sim-boton--chico ${ajustes.turnoEnMarcha ? '' : 'sim-boton--principal'}`} onClick={ajustes.turnoEnMarcha ? alDejarDeRecibir : alEmpezar} title={ajustes.turnoEnMarcha ? 'Dejan de entrar mesas y pedidos para llevar. Lo que ya está en cocina sigue su curso.' : 'Lo mismo que «Empezar a recibir tickets», encima de la pantalla'}>
                        {ajustes.turnoEnMarcha ? '⏸ Pausar' : empezado ? '▶ Seguir' : '▶ Empezar'}
                    </button>
                    <button type='button' className='sim-boton sim-boton--chico' onClick={() => { motor.reiniciarTurno?.(); refrescar(); }} disabled={typeof motor.reiniciarTurno !== 'function'} title='Pone la cuenta de mesas a cero y empieza el turno ahora. No borra el registro ni lo que hay en pantalla.'>↺ Reiniciar turno</button>
                </div>

                <Deslizador rotulo='Rotaciones del turno' valor={ajustes.rotacionesDelTurno} min={5} max={200} paso={5} alCambiar={v => cambiar({ rotacionesDelTurno: v })} formato={v => `${v} mesas`} ayuda='Cuántas veces se ocupa una mesa a lo largo del turno. Se puede cambiar a mitad: se reparte lo que quede.' />
                <Deslizador rotulo='Duración del turno' valor={ajustes.duracionDelTurnoH} min={1} max={12} paso={0.5} alCambiar={v => cambiar({ duracionDelTurnoH: v })} formato={v => `${conComa(v)} h`} />
                <Deslizador rotulo='Tickets por mesa' valor={ajustes.ticketsPorRotacion} min={1} max={5} paso={0.5} alCambiar={v => cambiar({ ticketsPorRotacion: v })} formato={conComa} pista='3 = entrada, plato fuerte y postre' ayuda='La media de tickets que manda cada mesa. Con 2,5, la mitad de las mesas mandan 2 y la otra mitad 3. De 4 en adelante se suman envíos sueltos de acompañantes.' />
                <Deslizador rotulo='Tickets en pantalla, como mínimo' valor={ajustes.minimoEnPantalla} min={0} max={12} alCambiar={v => cambiar({ minimoEnPantalla: v })} ayuda='Tarjetas sin despachar que se procura tener. Si hay menos, la mesa que toca se ADELANTA y entra en algún momento del próximo minuto — de una en una, nunca de golpe (y gasta una rotación del turno).' />
                <Deslizador rotulo='Mandan todo junto (HOLD)' valor={ajustes.probTodoJunto} min={0} max={1} paso={0.05} alCambiar={v => cambiar({ probTodoJunto: v })} formato={porCiento} ayuda='Mesas que mandan todos sus cursos de golpe: el primero sale en fuego y los demás esperan en HOLD. Las demás piden curso a curso, y cada uno entra como un ticket nuevo.' />
                <Interruptor rotulo='Hora pico' valor={ajustes.horaPico} alCambiar={v => cambiar({ horaPico: v })} ayuda='Las llegadas se aprietan hacia la mitad del turno, como en un servicio de verdad. Sin ella entran repartidas por igual.' />
                <Deslizador rotulo='Para llevar: uno cada' valor={Math.round(ajustes.paraLlevarCadaS / 60)} min={0} max={30} alCambiar={v => cambiar({ paraLlevarCadaS: v * 60 })} formato={v => (v === 0 ? 'nunca' : `${v} min`)} ayuda='Take Out, UberEats, DoorDash y pedidos online. No ocupan mesa: no cuentan como rotación.' />

                <div className='sim-botones' style={{ marginTop: 6 }}>
                    <button type='button' className='sim-boton sim-boton--chico' onClick={() => crear('mesa')} title='Ocupa una mesa ahora. No gasta ninguna rotación del turno.'>+ Mesa</button>
                    <button type='button' className='sim-boton sim-boton--chico' onClick={() => crear('takeout')}>+ Take Out</button>
                    <button type='button' className='sim-boton sim-boton--chico' onClick={() => crear('uber')}>+ Uber</button>
                    {TIPOS_DE_ORDEN?.doordash && <button type='button' className='sim-boton sim-boton--chico' onClick={() => crear('doordash')}>+ DoorDash</button>}
                    <button type='button' className='sim-boton sim-boton--chico' onClick={() => crear('online')}>+ Online</button>
                </div>
            </Seccion>

            <Seccion titulo='Crear un ticket a mano'>
                <TicketAMano motor={motor} refrescar={refrescar} ajustes={ajustes} />
            </Seccion>

            <Seccion titulo='Tiempos máximos y demoras'>
                <p className='sim-ayuda'>Una demora es un ticket que tarda en prepararse —desde que se dispara hasta que tiene todas sus palomitas— más que el máximo de su tipo. Los cambios valen para los tickets que se disparen desde ahora.</p>
                <Deslizador rotulo='Entrada, máximo' valor={ajustes.limiteEntradaMin} min={1} max={20} alCambiar={v => cambiar({ limiteEntradaMin: v })} formato={v => `${v} min`} />
                <Deslizador rotulo='Plato fuerte, máximo' valor={ajustes.limiteFuerteMin} min={5} max={40} alCambiar={v => cambiar({ limiteFuerteMin: v })} formato={v => `${v} min`} ayuda='Es también el máximo de lo que no tiene curso: pedidos para llevar y envíos sueltos.' />
                <Deslizador rotulo='Postre, máximo' valor={ajustes.limitePostreMin} min={1} max={15} alCambiar={v => cambiar({ limitePostreMin: v })} formato={v => `${v} min`} />
                <Deslizador rotulo='Tickets que se demoran' valor={ajustes.probDemora} min={0} max={1} paso={0.05} alCambiar={v => cambiar({ probDemora: v })} formato={porCiento} ayuda='Con qué frecuencia un ticket supera su tiempo máximo.' />
                <Deslizador rotulo='Se pasan hasta' valor={ajustes.excesoMaxDemoraMin} min={1} max={15} alCambiar={v => cambiar({ excesoMaxDemoraMin: v })} formato={v => `${v} min`} ayuda='Cuánto se pasa de su máximo, como mucho, un ticket que se demora.' />
            </Seccion>

            <Seccion titulo='Cocina'>
                <p className='sim-ayuda'>En manual nada avanza solo: toca un producto para ponerle la palomita, la cabecera para despachar la tarjeta, o un HOLD para dispararlo.</p>
                <Interruptor rotulo='Cocina sola' valor={ajustes.autoCocina} alCambiar={v => cambiar({ autoCocina: v })} ayuda='Las palomitas van saliendo solas y el expedidor despacha lo que queda listo.' />
                <Deslizador rotulo='Entre curso y curso' valor={entreCursosMin} min={1} max={20} paso={0.5} alCambiar={v => cambiar({ pausaEntreCursosS: [Math.round(v * 60 * 0.6), Math.round(v * 60 * 1.4)] })} formato={v => `${conComa(v)} min`} ayuda='Lo que una mesa tarda en comerse un curso y pedir (o soltar) el siguiente. Varía de mesa a mesa, entre un 60 % y un 140 % de este valor.' />
                <Deslizador rotulo='Velocidad del reloj' valor={ajustes.velocidad} min={1} max={30} alCambiar={v => cambiar({ velocidad: v })} formato={v => `×${v}`} ayuda={TEXTO_DE_LA_VELOCIDAD} pista={ajustes.velocidad > 1 ? `A ×${ajustes.velocidad} este turno de ${conComa(ajustes.duracionDelTurnoH)} h dura ${minutosDeTurnoDeVerdad} min de los de verdad. La ventana de la tablet lee al ritmo que conteste la IA, así que «Listo en tablet» sale con más margen de error. Con la IA de verdad déjalo en ×1.` : undefined} />

                <div className='sim-botones' style={{ marginTop: 6 }}>
                    <button type='button' className='sim-boton sim-boton--chico' onClick={() => { motor.despacharTodo(); refrescar(); }} title='Despacha de golpe todo lo que está en el fuego o listo. Los tickets que preparas tú («Lo preparo yo») no se tocan: esos se despachan desde su fila del registro.'>Despachar todo</button>
                    <button type='button' className='sim-boton sim-boton--chico sim-boton--peligro' onClick={() => { motor.vaciar(); refrescar(); }}>Vaciar pantalla</button>
                </div>
            </Seccion>

            <Seccion titulo='Quién lee la pantalla'>
                <p className='sim-ayuda'>Este simulador solo PINTA la pantalla de Toast. Leerla, la lee siempre el servidor de IA de verdad, desde la ventana de la tablet: cada tira se le manda como con la tablet del restaurante. Tarda cerca de un minuto por tira, así que la tabla se llena despacio.</p>

                <p className='sim-dato' role='status'>
                    {lee.texto}
                    {lee.fallo && <span className='sim-aviso' title={lee.fallo}> · falló: {recortar(lee.fallo, 60)}</span>}
                </p>
            </Seccion>

            {/*  El título avisa de que hay más pantallas aunque la sección esté plegada: con la
                 barra oscura, que no lleva contador de tickets, es el único sitio donde se ve.  */}
            <Seccion titulo={`Pantalla de Toast${variasPantallas ? ` · ${pantalla.pagina + 1} de ${pantalla.paginas}` : ''}`} abierta={false}>
                <div className='sim-fila sim-paginas' title='Lo mismo que «|←» y «→|», las flechas del contador de tickets de la pantalla de Toast. Las tarjetas que no caben en una pantalla quedan en la siguiente, las más antiguas delante.'>
                    <span className='sim-paginas__cual' role='status'>Pantalla <b>{pantalla.pagina + 1}</b> de <b>{pantalla.paginas}</b></span>
                    <button type='button' className='sim-boton sim-boton--chico' onClick={() => pasarPagina(-1)} disabled={pantalla.pagina <= 0} aria-label='Pantalla anterior'>◀</button>
                    <button type='button' className='sim-boton sim-boton--chico' onClick={() => pasarPagina(1)} disabled={pantalla.pagina >= pantalla.paginas - 1} aria-label='Pantalla siguiente'>▶</button>
                </div>
                {variasPantallas && <p className='sim-pista'>La ventana de la tablet solo lee la pantalla que está a la vista: lo que hay en las otras no existe para ella hasta que se pasa. Y ojo al pasar: las tarjetas que venía siguiendo dejan de verse, y para ella una tarjeta que desaparece es una que quedó lista.</p>}

                <div className='sim-fila'>
                    <label htmlFor='sim-tema'>Apariencia</label>
                    <select id='sim-tema' value={ajustes.tema} onChange={e => cambiar({ tema: e.target.value })}>
                        {Object.values(TEMAS).map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                </div>

                {ajustes.tema === 'clara' && (
                    <div className='sim-fila'>
                        <label htmlFor='sim-idioma'>Textos</label>
                        <select id='sim-idioma' value={ajustes.idioma} onChange={e => cambiar({ idioma: e.target.value })}>
                            <option value='es'>COCINAR · EN PAUSA · CONTINÚA</option>
                            <option value='en'>FIRE · HOLD · Continued</option>
                        </select>
                    </div>
                )}

                <div className='sim-fila'>
                    <label htmlFor='sim-alto'>Tablet</label>
                    <select id='sim-alto' value={`${ajustes.alto}x${ajustes.escala}`} onChange={e => { const [alto, escala] = e.target.value.split('x').map(Number); cambiar({ alto, escala }); }}>
                        <option value='768x1'>1024 × 768</option>
                        <option value='600x1'>1024 × 600 (Bar - Doral)</option>
                        <option value='768x2'>2048 × 1536 (doble densidad)</option>
                    </select>
                </div>

                <div className='sim-fila'>
                    <label htmlFor='sim-estacion'>Nombre de la estación</label>
                    <input id='sim-estacion' type='text' value={ajustes.estacion} placeholder={TEMAS[ajustes.tema]?.estacion} onChange={e => cambiar({ estacion: e.target.value })} />
                </div>

                <Interruptor rotulo='«Recently fulfilled» a la vista' valor={ajustes.recientesVisibles} alCambiar={v => cambiar({ recientesVisibles: v })} ayuda='Con él, lo despachado se queda en verde unos minutos. Sin él, desaparece en el acto.' />
                <Deslizador rotulo='Lo despachado se queda' valor={ajustes.minutosRecientes} min={1} max={15} alCambiar={v => cambiar({ minutosRecientes: v })} formato={v => `${v} min`} />
                <Interruptor rotulo='Vista «All day» abierta' valor={ajustes.vistaTotal} alCambiar={v => cambiar({ vistaTotal: v })} ayuda='Ocupa una columna a la izquierda y corre las tarjetas.' />

                <Deslizador rotulo='Cabecera amarilla a los' valor={ajustes.amarilloS} min={0} max={3600} paso={30} alCambiar={v => cambiar({ amarilloS: v })} formato={minSeg} ayuda='Los «Warning Colors» de Toast: la cabecera cambia de color por la EDAD del ticket, no por su estado.' />
                <Deslizador rotulo='Cabecera roja a los' valor={ajustes.rojoS} min={0} max={7200} paso={60} alCambiar={v => cambiar({ rojoS: v })} formato={minSeg} />
                <Deslizador rotulo='Reloj adelantado' valor={ajustes.desfaseRelojMin} min={-180} max={180} paso={15} alCambiar={v => cambiar({ desfaseRelojMin: v })} formato={v => `${v > 0 ? '+' : ''}${v} min`} ayuda='La tablet y el equipo no marcan la misma hora. Las horas inferidas tienen que salir en el reloj de la TABLET.' />
            </Seccion>

            <Seccion titulo='Escenas: capturas reales recreadas' abierta={false}>
                <p className='sim-ayuda'>Dejan la pantalla exactamente como una captura de la tablet del restaurante, con la simulación parada: ni entran mesas ni la cocina marca nada. La respuesta correcta se conoce de antemano. Para seguir desde ahí, «Que cocine sola» y «Seguir recibiendo tickets», encima de la pantalla.</p>
                <div className='sim-botones'>
                    {Object.entries(ESCENAS).map(([id, escena]) => (
                        <button key={id} type='button' className='sim-boton sim-boton--chico' onClick={() => ponerEscena(id)} title={escena.nombre}>{escena.nombre}</button>
                    ))}
                </div>
            </Seccion>

        </aside>
    );
}
