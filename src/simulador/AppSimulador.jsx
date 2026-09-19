import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './simulador.css';
import { crearMotor, AJUSTES_POR_DEFECTO } from './motor/motor.js';
import { ESCENAS, cargarEscena } from './motor/escenas.js';
import { diferenciaEnSegundos } from './motor/tiempo.js';
import { temaCon, TEMAS } from './pintura/temas.js';
import { maquetar, zonaEn } from './pintura/maquetar.js';
import { pintarPantalla, ANCHO_VISTA_TOTAL } from './pintura/pintar.js';
import { leerTiraSimulada } from './lectorSimulado.js';
import { abrirCanal, responder } from './canal.js';




/*  ─────────────────────────────────────────────────────────────────────────────
 *  EL SIMULADOR DE TOAST
 *
 *  Una tablet de cocina de mentira, en su propia ventana. Hace tres cosas:
 *
 *      1. PINTA la pantalla del expedidor de Toast, igual que la de verdad, y se la
 *         sirve a la ventana de la tablet cada vez que esta pide una «captura».
 *      2. SE COMPORTA como una cocina: entran pedidos, se cocinan, reciben palomitas,
 *         se despachan. Sola, o a mano tocando las tarjetas como en la tablet real.
 *      3. APUNTA LA VERDAD —a qué hora entró y se despachó cada tarjeta— y la pone al
 *         lado de lo que la ventana de la tablet ha inferido leyendo la pantalla.
 *
 *  Lo tercero es la razón de ser de todo esto: con la tablet real nunca se sabe si la
 *  hora que salió en la parrilla es la buena. Aquí sí.
 *
 *  Solo existe en desarrollo (ver disponible.js). Se abre desde el botón «Simular» de
 *  la ventana de la tablet, o a mano con '?view=toast-sim'.
 *  ───────────────────────────────────────────────────────────────────────────── */


const CLAVE_AJUSTES = 'toast-sim:ajustes';

const CLAVES_DEL_MOTOR = Object.keys(AJUSTES_POR_DEFECTO);

const AJUSTES_INICIALES = {
    ...AJUSTES_POR_DEFECTO,

    //  LA PANTALLA
    tema: 'oscura',
    idioma: 'es',
    alto: 768,
    escala: 1,              //  2 = captura a doble resolución, como una tablet más densa
    estacion: '',
    amarilloS: 6 * 60,      //  a partir de cuánto la cabecera pasa a amarillo…
    rojoS: 15 * 60,         //  …y a rojo. Son los «Warning Colors» de Toast.
    avisos: 72,
    vistaTotal: false,

    //  QUIÉN LEE LAS TIRAS
    lector: 'real',         //  'real' = el servidor de IA; 'simulado' = contesta este simulador
    latenciaMinS: 2,
    latenciaMaxS: 6,
    probSaltar: 0.1,
    probErrorDeDigito: 0.02,
    probCabeceraCortada: 0.05,

    toleranciaS: 10,
};


const parametros = new URLSearchParams(window.location.search);

//  '?solo=pantalla' deja únicamente el lienzo, a su tamaño real: para fotografiarlo y
//  compararlo con una captura de la tablet de verdad.
const SOLO_PANTALLA = parametros.get('solo') === 'pantalla';

const ESCENA_INICIAL = parametros.get('escena');

//  Con una escena en la dirección no se guarda nada: es una sesión de prueba y no debe
//  dejarle al siguiente arranque la cocina parada.
const GUARDAR_AJUSTES = !ESCENA_INICIAL && !SOLO_PANTALLA;


//  Lo que una escena le pide a la pantalla, más la cocina parada.
const ajustesDeEscena = (id) => (ESCENAS[id] ? { ...ESCENAS[id].ajustes, autoLlegadas: false, autoCocina: false, recientesVisibles: true } : {});

function leerAjustes() {
    let guardados = null;

    try { guardados = GUARDAR_AJUSTES ? JSON.parse(localStorage.getItem(CLAVE_AJUSTES)) : null; }
    catch { /* ajustes guardados ilegibles: se arranca con los de fábrica */ }

    //  La escena de la dirección entra YA en el primer estado, no en un efecto: si se
    //  aplicara después, la pantalla se pintaría una vez con la apariencia equivocada.
    return { ...AJUSTES_INICIALES, ...(guardados ?? {}), ...ajustesDeEscena(ESCENA_INICIAL) };
}

const soloDelMotor = (ajustes) => Object.fromEntries(CLAVES_DEL_MOTOR.map(clave => [clave, ajustes[clave]]));

const pausa = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const delta = (segundos) => (segundos === null || segundos === undefined ? '—' : `${segundos > 0 ? '+' : ''}${segundos} s`);




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

    //  Un latido por segundo: es lo que refresca el reloj y la tabla del registro. La
    //  pantalla NO depende de él — se repinta sola y, sobre todo, cada vez que la
    //  ventana de la tablet pide una captura.
    const [, setLatido] = useState(0);

    const [inferencia, setInferencia] = useState(null);
    const [trafico, setTrafico] = useState({ capturas: 0, lecturas: 0, ultimaCaptura: 0 });


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
        const maqueta = maquetar(visibles, tema, medir, { desplazamiento: a.vistaTotal ? ANCHO_VISTA_TOTAL : 0 });

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
        const latido = setInterval(() => setLatido(n => n + 1), 1000);

        return () => { clearTimeout(reintento); clearInterval(repintar); clearInterval(latido); };
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
                setTrafico(t => ({ ...t, capturas: t.capturas + 1, ultimaCaptura: Date.now() }));
            }

            if (mensaje.t === 'lectura') {
                if (a.lector !== 'simulado') return responder(canal, mensaje.id, { modo: 'real' });

                //  Se «lee» lo que hay AHORA, y se contesta después de la latencia: como
                //  el modelo de verdad, que responde sobre la foto que se le mandó y no
                //  sobre cómo esté la pantalla cuando termina.
                const maqueta = pintar();
                const lectura = leerTiraSimulada({
                    maqueta,
                    visibles: maqueta.visibles,
                    tema: maqueta.tema,
                    tira: mensaje.tira,
                    tiras: mensaje.tiras,
                    solape: mensaje.solape,
                    ruido: { probSaltar: a.probSaltar, probErrorDeDigito: a.probErrorDeDigito, probCabeceraCortada: a.probCabeceraCortada },
                });

                const espera = a.latenciaMinS + Math.random() * Math.max(0, a.latenciaMaxS - a.latenciaMinS);
                await pausa(espera * 1000);

                responder(canal, mensaje.id, { modo: 'simulado', contenido: lectura.contenido });
                setTrafico(t => ({ ...t, lecturas: t.lecturas + 1 }));
            }

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
        if (barra?.accion === 'recuperar') { motor.recuperar(); return pintar(); }

        const zona = zonaEn(maqueta, x, y);
        if (!zona) return;

        if (zona.accion === 'producto') motor.alternarProducto(zona.tarjetaId, zona.indice);
        if (zona.accion === 'despachar') motor.despacharTarjeta(zona.tarjetaId);
        if (zona.accion === 'disparar') motor.dispararTarjeta(zona.tarjetaId);

        pintar();
    };


    //  ── EL REGISTRO, CON LO INFERIDO AL LADO ─────────────────────────────────

    const registro = motor.registro();

    const comparacion = useMemo(() => {
        const inferidos = new Map((inferencia?.pedidos ?? []).map(p => [p.clave, p]));
        const yaEstaban = new Set(inferencia?.yaEstaban ?? []);
        const usados = new Set();

        const filas = [...registro].reverse().map(verdad => {
            const ia = inferidos.get(verdad.clave) ?? null;
            if (ia) usados.add(verdad.clave);

            const dToma = ia ? diferenciaEnSegundos(verdad.tomaDeOrden, ia.tomaOrden) : null;
            const dListo = ia && verdad.listoEnTablet ? diferenciaEnSegundos(verdad.listoEnTablet, ia.listoTablet) : null;

            let veredicto;
            if (!ia) {
                veredicto = yaEstaban.has(verdad.clave) ? { texto: 'ya estaba al conectar', clase: '' }
                    : !verdad.vistaEnPantalla ? { texto: 'no salió en pantalla', clase: '' }
                        : !inferencia ? { texto: '—', clase: '' }
                            : { texto: 'sin detectar', clase: 'sim-aviso' };
            }
            else if (String(ia.mesa) !== verdad.mesa) veredicto = { texto: `mesa distinta (${ia.mesa})`, clase: 'sim-mal' };
            else if (dToma === null) veredicto = { texto: 'detectado, sin hora', clase: 'sim-aviso' };
            else if (Math.abs(dToma) <= ajustes.toleranciaS) veredicto = { texto: 'coincide', clase: 'sim-bien' };

            //  Se le vio por primera vez ya despachado, con el contador de la cabecera
            //  congelado: la propia ventana marca esa toma de orden como estimada.
            else if (ia.tomaOrdenAproximada) veredicto = { texto: 'hora estimada (se vio ya listo)', clase: 'sim-aviso' };
            else veredicto = { texto: 'hora desviada', clase: 'sim-mal' };

            return { verdad, ia, dToma, dListo, veredicto };
        });

        //  Lo que la lectura dio por pedido y aquí no existe: números mal leídos.
        const fantasmas = [...inferidos.values()].filter(p => !usados.has(p.clave) && !registro.some(v => v.clave === p.clave));

        const detectadas = filas.filter(f => f.ia);
        const conHora = detectadas.filter(f => f.dToma !== null);
        const coinciden = filas.filter(f => f.veredicto.texto === 'coincide');

        return {
            filas,
            fantasmas,
            resumen: {
                total: filas.length,
                detectadas: detectadas.length,
                coinciden: coinciden.length,
                errorMedio: conHora.length ? Math.round(conHora.reduce((s, f) => s + Math.abs(f.dToma), 0) / conHora.length) : null,
            },
        };
        //  'registro' se rehace en cada latido; basta con que cambie su tamaño o lo inferido.
        //  eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inferencia, registro.length, registro.map(r => r.estado).join(), ajustes.toleranciaS]);


    const exportar = (formato) => {
        const filas = comparacion.filas.map(({ verdad, ia, dToma, dListo, veredicto }) => ({
            mesa: verdad.mesa, ticket: verdad.ticket, tipo: verdad.tipo, estado: verdad.estado, productos: verdad.productos,
            toma_de_orden: verdad.tomaDeOrden, fuego: verdad.disparada, todas_las_palomitas: verdad.lista,
            despachada: verdad.despachada, se_fue_de_pantalla: verdad.retirada, listo_en_tablet: verdad.listoEnTablet,
            ia_mesa: ia?.mesa ?? '', ia_tipo: ia?.tipo ?? '', ia_toma_de_orden: ia?.tomaOrden ?? '', dif_toma_s: dToma ?? '',
            ia_listo_en_tablet: ia?.listoTablet ?? '', dif_listo_s: dListo ?? '', veredicto: veredicto.texto,
        }));

        const contenido = formato === 'json'
            ? JSON.stringify({ semilla: motor.semilla, ajustes, filas, fantasmas: comparacion.fantasmas }, null, 2)
            : [Object.keys(filas[0] ?? { vacio: '' }).join(';'), ...filas.map(f => Object.values(f).map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))].join('\r\n');

        const enlace = document.createElement('a');
        enlace.href = URL.createObjectURL(new Blob([formato === 'json' ? contenido : `﻿${contenido}`], { type: formato === 'json' ? 'application/json' : 'text/csv' }));
        enlace.download = `simulacion-toast-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${formato}`;
        enlace.click();
        setTimeout(() => URL.revokeObjectURL(enlace.href), 5000);
    };


    //  ── PINTADO ──────────────────────────────────────────────────────────────

    if (SOLO_PANTALLA) return <div className='sim-solo'><canvas ref={lienzoRef} onClick={alTocar} /></div>;

    const tabletViva = Date.now() - trafico.ultimaCaptura < 4000;

    return (
        <div className='sim-app'>

            <header className='sim-barra'>
                <div>
                    <h1>Simulador de Toast · pantalla de cocina</h1>
                    <div className='sim-barra__sub'>Herramienta de desarrollo. Nada de lo que pasa aquí llega a Jarvis.</div>
                </div>

                <span className='sim-hueco' />

                <span className={`sim-estado ${tabletViva ? 'sim-estado--vivo' : ''}`} title='La ventana de la tablet pide una captura varias veces por segundo mientras está conectada en modo simulación'>
                    <span className='sim-estado__punto' />
                    {tabletViva ? 'Ventana de la tablet conectada' : 'Esperando a la ventana de la tablet'}
                    {trafico.capturas > 0 && <span className='sim-barra__sub'>· {trafico.capturas} capturas · {trafico.lecturas} lecturas simuladas</span>}
                </span>

                <span className='sim-reloj' title='El reloj de la tablet simulada'>{motor.reloj()}</span>
            </header>


            <div className='sim-cuerpo'>

                <main className='sim-pantalla'>
                    <div className='sim-tablet'>
                        <canvas ref={lienzoRef} onClick={alTocar} aria-label='Pantalla de la tablet simulada. Toca un producto para marcarlo hecho, o la cabecera de una tarjeta para despacharla.' />
                    </div>
                </main>

                <Panel ajustes={ajustes} cambiar={cambiar} motor={motor} pintar={pintar} />

            </div>


            <Registro comparacion={comparacion} inferencia={inferencia} ajustes={ajustes} cambiar={cambiar} exportar={exportar} alBorrar={() => { motor.borrarRegistro(); pintar(); }} />

        </div>
    );
}




//  ── EL PANEL DE CONTROL ──────────────────────────────────────────────────────

function Deslizador({ rotulo, valor, min, max, paso = 1, alCambiar, formato = v => v, ayuda }) {
    return (
        <div className='sim-fila' title={ayuda}>
            <label>{rotulo}</label>
            <input type='range' min={min} max={max} step={paso} value={valor} onChange={e => alCambiar(Number(e.target.value))} aria-label={rotulo} />
            <span className='sim-fila__valor'>{formato(valor)}</span>
        </div>
    );
}

function Interruptor({ rotulo, valor, alCambiar, ayuda }) {
    return (
        <div className='sim-fila' title={ayuda}>
            <label className='sim-interruptor'>
                <input type='checkbox' checked={valor} onChange={e => alCambiar(e.target.checked)} />
                {rotulo}
            </label>
        </div>
    );
}

const minSeg = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const porCiento = (p) => `${Math.round(p * 100)} %`;


function Panel({ ajustes, cambiar, motor, pintar }) {

    const crear = (tipo) => { motor.crearOrden(tipo); pintar(); };

    const ponerEscena = (id) => {
        const pedidos = cargarEscena(motor, id);
        if (pedidos) cambiar(pedidos);
        pintar();
    };

    return (
        <aside className='sim-panel'>

            <section className='sim-seccion'>
                <h2>Pedidos</h2>
                <Interruptor rotulo='Entran solos' valor={ajustes.autoLlegadas} alCambiar={v => cambiar({ autoLlegadas: v })} />
                <Deslizador rotulo='Uno cada' valor={ajustes.intervaloMedioS} min={15} max={600} paso={15} alCambiar={v => cambiar({ intervaloMedioS: v })} formato={minSeg} ayuda='Tiempo medio entre pedidos. Llegan a rachas, como en un restaurante.' />
                <Deslizador rotulo='Mesas con dos cursos' valor={ajustes.probCursos} min={0} max={1} paso={0.05} alCambiar={v => cambiar({ probCursos: v })} formato={porCiento} ayuda='Entrada y plato fuerte: DOS tarjetas con la misma mesa y el mismo número.' />

                <div className='sim-botones' style={{ marginTop: 6 }}>
                    <button type='button' className='sim-boton sim-boton--chico' onClick={() => crear('mesa')}>+ Mesa</button>
                    <button type='button' className='sim-boton sim-boton--chico' onClick={() => crear('takeout')}>+ Take Out</button>
                    <button type='button' className='sim-boton sim-boton--chico' onClick={() => crear('uber')}>+ Uber</button>
                    <button type='button' className='sim-boton sim-boton--chico' onClick={() => crear('online')}>+ Online</button>
                </div>
            </section>

            <section className='sim-seccion'>
                <h2>Cocina</h2>
                <p className='sim-ayuda'>En manual nada avanza solo: toca un producto para ponerle la palomita, la cabecera para despachar la tarjeta, o un HOLD para dispararlo.</p>
                <Interruptor rotulo='Cocina sola' valor={ajustes.autoCocina} alCambiar={v => cambiar({ autoCocina: v })} />
                <Deslizador rotulo='Rapidez' valor={ajustes.rapidezCocina} min={0.5} max={10} paso={0.5} alCambiar={v => cambiar({ rapidezCocina: v })} formato={v => `×${v}`} />
                <Deslizador rotulo='Velocidad del reloj' valor={ajustes.velocidad} min={1} max={20} alCambiar={v => cambiar({ velocidad: v })} formato={v => `×${v}`} ayuda='Acelera TODO, el reloj de la tablet incluido. Con la IA de verdad déjalo en ×1: no lee más rápido por correr el reloj.' />

                <div className='sim-botones' style={{ marginTop: 6 }}>
                    <button type='button' className='sim-boton sim-boton--chico' onClick={() => { motor.despacharTodo(); pintar(); }}>Despachar todo</button>
                    <button type='button' className='sim-boton sim-boton--chico sim-boton--peligro' onClick={() => { motor.vaciar(); pintar(); }}>Vaciar pantalla</button>
                </div>
            </section>

            <section className='sim-seccion'>
                <h2>Pantalla de Toast</h2>
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
            </section>

            <section className='sim-seccion'>
                <h2>Quién lee la pantalla</h2>
                <div className='sim-fila'>
                    <label htmlFor='sim-lector'>Lector</label>
                    <select id='sim-lector' value={ajustes.lector} onChange={e => cambiar({ lector: e.target.value })}>
                        <option value='real'>La IA de verdad (servidor)</option>
                        <option value='simulado'>Lector simulado</option>
                    </select>
                </div>

                {ajustes.lector === 'simulado' ? (
                    <>
                        <p className='sim-ayuda'>Contesta este simulador, en el mismo formato que el modelo y viendo solo las cabeceras que caben enteras en cada tira. Sirve para probar todo lo demás cuando el servidor de IA está lento o caído.</p>
                        <Deslizador rotulo='Tarda entre' valor={ajustes.latenciaMinS} min={0} max={60} alCambiar={v => cambiar({ latenciaMinS: v, latenciaMaxS: Math.max(v, ajustes.latenciaMaxS) })} formato={v => `${v} s`} />
                        <Deslizador rotulo='…y' valor={ajustes.latenciaMaxS} min={0} max={150} alCambiar={v => cambiar({ latenciaMaxS: v, latenciaMinS: Math.min(v, ajustes.latenciaMinS) })} formato={v => `${v} s`} ayuda='Por encima de 120 s la ventana de la tablet da la lectura por perdida.' />
                        <Deslizador rotulo='Se salta una tarjeta' valor={ajustes.probSaltar} min={0} max={0.6} paso={0.05} alCambiar={v => cambiar({ probSaltar: v })} formato={porCiento} />
                        <Deslizador rotulo='Lee mal un dígito del #' valor={ajustes.probErrorDeDigito} min={0} max={0.3} paso={0.01} alCambiar={v => cambiar({ probErrorDeDigito: v })} formato={porCiento} />
                        <Deslizador rotulo='Cabecera cortada' valor={ajustes.probCabeceraCortada} min={0} max={0.5} paso={0.05} alCambiar={v => cambiar({ probCabeceraCortada: v })} formato={porCiento} ayuda='Transcribe «6 #34 1:03» donde ponía «Table 16 #34 1:03».' />
                    </>
                ) : (
                    <p className='sim-ayuda'>Cada tira se manda al servidor de IA, como con la tablet de verdad.</p>
                )}
            </section>

            <section className='sim-seccion'>
                <h2>Escenas: capturas reales recreadas</h2>
                <p className='sim-ayuda'>Dejan la pantalla exactamente como una captura de la tablet del restaurante, con la cocina parada. La respuesta correcta se conoce de antemano.</p>
                <div className='sim-botones'>
                    {Object.entries(ESCENAS).map(([id, escena]) => (
                        <button key={id} type='button' className='sim-boton sim-boton--chico' onClick={() => ponerEscena(id)} title={escena.nombre}>{escena.nombre}</button>
                    ))}
                </div>
            </section>

        </aside>
    );
}




//  ── LA TABLA DEL REGISTRO ────────────────────────────────────────────────────

const ROTULO_DE_ESTADO = { pausa: 'en pausa', fuego: 'en fuego', lista: 'lista', despachada: 'despachada', retirada: 'fuera' };


function Registro({ comparacion, inferencia, ajustes, cambiar, exportar, alBorrar }) {

    const { filas, fantasmas, resumen } = comparacion;

    return (
        <section className='sim-registro'>

            <div className='sim-registro__cabeza'>
                <h2>Registro de la simulación</h2>

                <span className='sim-resumen'>
                    <b>{resumen.total}</b> tarjetas
                    {inferencia
                        ? <> · detectadas <b>{resumen.detectadas}</b> · toma de orden dentro de ±{ajustes.toleranciaS} s: <b className={resumen.coinciden === resumen.detectadas ? 'sim-bien' : ''}>{resumen.coinciden}</b>{resumen.errorMedio !== null && <> · error medio <b>{resumen.errorMedio} s</b></>}{fantasmas.length > 0 && <> · <b className='sim-mal'>{fantasmas.length} inventadas</b></>}</>
                        : <> · todavía no ha llegado nada de la ventana de la tablet</>}
                </span>

                <span className='sim-hueco' />

                <label className='sim-resumen' htmlFor='sim-tolerancia'>Tolerancia</label>
                <input id='sim-tolerancia' type='number' min={0} max={600} value={ajustes.toleranciaS} onChange={e => cambiar({ toleranciaS: Number(e.target.value) || 0 })} />

                <button type='button' className='sim-boton sim-boton--chico' onClick={() => exportar('csv')} disabled={filas.length === 0}>Exportar CSV</button>
                <button type='button' className='sim-boton sim-boton--chico' onClick={() => exportar('json')} disabled={filas.length === 0}>JSON</button>
                <button type='button' className='sim-boton sim-boton--chico sim-boton--peligro' onClick={alBorrar} title='Quita del registro las tarjetas que ya no están en pantalla'>Limpiar</button>
            </div>

            <div className='sim-tabla-caja'>
                {filas.length === 0
                    ? <p className='sim-vacio'>Aún no ha entrado ningún pedido. Entran solos, o créalos con los botones del panel.</p>
                    : (
                        <table className='sim-tabla'>
                            <thead>
                                <tr>
                                    <th colSpan={4}>Tarjeta</th>
                                    <th colSpan={4} className='sim-grupo'>La verdad · reloj de la tablet</th>
                                    <th colSpan={6} className='sim-grupo sim-grupo--ia'>Lo que infirió la ventana de la tablet</th>
                                </tr>
                                <tr>
                                    <th>Mesa</th><th>Ticket</th><th>Tipo</th><th>Estado</th>
                                    <th className='sim-corte'>Toma de orden</th><th title='Primera señal en la tablet: se completa de palomitas o se despacha'>Listo en tablet</th><th>Despachada</th><th>Se fue</th>
                                    <th className='sim-corte'>Tipo</th><th>Toma de orden</th><th>Dif.</th><th>Listo en tablet</th><th>Dif.</th><th>Veredicto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filas.map(({ verdad, ia, dToma, dListo, veredicto }) => (
                                    <tr key={verdad.id} className={verdad.estado === 'retirada' ? 'sim-ida' : ''} title={verdad.productos}>
                                        <td><b>{verdad.mesa}</b></td>
                                        <td>#{verdad.ticket}</td>
                                        <td>{verdad.tipo || '—'}</td>
                                        <td><span className={`sim-ficha sim-ficha--${verdad.estado}`}>{ROTULO_DE_ESTADO[verdad.estado]}</span></td>

                                        <td className='sim-hora sim-corte'>{verdad.tomaDeOrden}</td>
                                        <td className='sim-hora'>{verdad.listoEnTablet || '—'}</td>
                                        <td className='sim-hora'>{verdad.despachada || '—'}</td>
                                        <td className='sim-hora'>{verdad.retirada || '—'}</td>

                                        <td className='sim-corte'>{ia?.tipo || '—'}</td>
                                        <td className='sim-hora' title={ia?.tomaOrdenAproximada ? 'Estimada: el ticket se vio por primera vez ya listo' : undefined}>{ia?.tomaOrden ? `${ia.tomaOrdenAproximada ? '≈ ' : ''}${ia.tomaOrden}` : '—'}</td>
                                        <td className={`sim-hora ${dToma !== null && Math.abs(dToma) > ajustes.toleranciaS ? (ia?.tomaOrdenAproximada ? 'sim-aviso' : 'sim-mal') : ''}`}>{delta(dToma)}</td>
                                        <td className='sim-hora'>{ia?.listoTablet || '—'}</td>
                                        <td className='sim-hora'>{delta(dListo)}</td>
                                        <td className={veredicto.clase}>{veredicto.texto}</td>
                                    </tr>
                                ))}

                                {fantasmas.map(p => (
                                    <tr key={`fantasma-${p.clave}`}>
                                        <td><b>{p.mesa}</b></td><td>#{p.ticket}</td><td colSpan={2} className='sim-mal'>no existe en la simulación</td>
                                        <td className='sim-corte' colSpan={4}>—</td>
                                        <td className='sim-corte'>{p.tipo || '—'}</td><td className='sim-hora'>{p.tomaOrden || '—'}</td><td>—</td><td className='sim-hora'>{p.listoTablet || '—'}</td><td>—</td>
                                        <td className='sim-mal'>inventada por la lectura</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
            </div>

        </section>
    );
}
