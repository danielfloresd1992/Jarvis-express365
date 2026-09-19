import { crearAzar } from './azar.js';
import { CURSO, SUELTOS, GUARNICIONES, TERMINOS, NOTAS, MESEROS, CLIENTES, REPARTIDORES, TIPOS_DE_ORDEN, platosDelCurso } from './carta.js';
import { formatoCronometro, horaDelReloj, horaPrometida } from './tiempo.js';
import { claveDeTicket } from '../../libs/tickets/claveDeTicket.js';




/*  ─────────────────────────────────────────────────────────────────────────────
 *  EL MOTOR: UNA COCINA DE MENTIRA QUE SE COMPORTA COMO LA DE TOAST
 *
 *  No pinta nada. Lleva el reloj de la «tablet», crea pedidos, hace avanzar cada
 *  tarjeta por sus estados y apunta a qué hora ocurrió cada cosa. De esa última parte
 *  sale el REGISTRO: la verdad contra la que se compara lo que infiere la lectura.
 *
 *  LA VIDA DE UNA TARJETA, que es la de la pantalla del expedidor:
 *
 *      pausa       el curso está retenido: la tarjeta dice HOLD / EN PAUSA
 *        ↓         (lo dispara el curso anterior al salir, o un toque en la tarjeta)
 *      fuego       en preparación: corre el FIRE / COCINAR
 *        ↓         (cada producto recibe su palomita verde al terminarse)
 *      lista       todos los productos con palomita: la tarjeta cambia de color
 *        ↓         (el expedidor la despacha)
 *      despachada  con «recently fulfilled» a la vista se queda, en verde; sin él
 *        ↓         desaparece en el acto
 *      retirada    ya no está en pantalla
 *
 *  UN TICKET, VARIAS TARJETAS. Una mesa con entrada y plato fuerte son DOS tarjetas con
 *  la misma mesa y el mismo número: la entrada en fuego y el fuerte retenido hasta que
 *  la entrada sale. Así es en la pantalla real, y es el caso que más fácil rompe una
 *  lectura que identifique los pedidos solo por su número.
 *
 *  EL TIEMPO ES DE MENTIRA PERO NO DEPENDE DE TEMPORIZADORES. 'avanzar' recibe la hora
 *  real y pone la simulación al día procesando una agenda de sucesos. Importa, porque
 *  Chromium frena los temporizadores de una ventana que no está a la vista —y esta
 *  ventana se pasa la vida tapada por Jarvis—: con una agenda, da igual cada cuánto se
 *  la llame, el resultado es el mismo.
 *  ───────────────────────────────────────────────────────────────────────────── */


export const AJUSTES_POR_DEFECTO = {
    //  Cuánto corre el reloj de la simulación respecto al de verdad.
    velocidad: 1,

    //  Minutos que el reloj de la «tablet» va por delante del equipo. En el restaurante
    //  no coinciden —se llegaron a ver dos horas de diferencia—, y la lectura tiene que
    //  dar las horas en el reloj de la tablet. Con un desfase aquí se comprueba.
    desfaseRelojMin: 0,

    //  LLEGADA DE PEDIDOS
    autoLlegadas: true,
    intervaloMedioS: 150,       //  con esto hay unas 8–10 tarjetas a la vez, como en las capturas
    mezcla: { mesa: 60, takeout: 15, uber: 15, online: 10 },
    probCursos: 0.6,            //  mesas que piden entrada Y plato fuerte (dos tarjetas)
    probPostre: 0.15,           //  …y de esas, las que además piden postre (tres)
    probSegundoEnvio: 0.08,     //  mesas que mandan algo más al rato, con el mismo número

    //  LA COCINA
    autoCocina: true,
    rapidezCocina: 1,           //  2 = cocina el doble de rápido
    esperaExpoS: [20, 90],      //  lo que tarda el expedidor en despachar una tarjeta lista
    pausaEntreCursosS: [40, 160],

    //  LA PANTALLA
    recientesVisibles: true,    //  «recently fulfilled»: lo despachado se queda, en verde
    minutosRecientes: 3,
};


//  Más tarjetas vivas que estas y dejan de entrar pedidos: es que nadie está cocinando.
const TOPE_DE_TARJETAS_VIVAS = 40;

//  El registro no crece sin fin: en un turno largo simulado a toda velocidad se iría
//  a miles de filas.
const TOPE_DEL_REGISTRO = 600;

//  Una ventana dormida puede despertar horas después. Se pone al día como mucho esto.
const SALTO_MAXIMO_MS = 10 * 60 * 1000;

const ORDEN_DE_CURSOS = [CURSO.ENTRADA, CURSO.FUERTE, CURSO.POSTRE];




export function crearMotor({ semilla = Date.now(), ajustes: ajustesIniciales = {} } = {}) {

    const azar = crearAzar(semilla);
    const ajustes = { ...AJUSTES_POR_DEFECTO, ...ajustesIniciales };

    const relojInicialMs = Date.now();
    let ultimoRealMs = relojInicialMs;
    let simMs = 0;

    let tarjetas = [];
    let agenda = [];

    let numeroSiguiente = azar.entero(40, 160);
    let idSiguiente = 1;


    //  ── EL RELOJ ─────────────────────────────────────────────────────────────

    const fechaDe = (ms) => new Date(relojInicialMs + ajustes.desfaseRelojMin * 60000 + ms);

    const horaDe = (ms) => (ms === null || ms === undefined ? '' : horaDelReloj(fechaDe(ms)));


    //  ── LA AGENDA ────────────────────────────────────────────────────────────

    const agendar = (en, tipo, datos = {}) => {
        agenda.push({ en, tipo, ...datos });
        agenda.sort((a, b) => a.en - b.en);
    };

    const entreSegundos = ([min, max]) => azar.entre(min, max) * 1000;


    //  ── CREAR PEDIDOS ────────────────────────────────────────────────────────

    const producto = (plato, cantidad = 1) => {
        const mods = [];

        if (plato.termino) mods.push({ texto: azar.elegir(TERMINOS) });

        for (const guarnicion of azar.elegirVarios(GUARNICIONES, plato.guarniciones ?? 0)) {
            mods.push({ texto: guarnicion });
        }

        for (const extra of plato.extras ?? []) mods.push({ texto: extra });

        if (azar.probabilidad(0.22)) mods.push({ texto: azar.elegir(NOTAS), nota: true });

        return {
            cantidad,
            nombre: plato.nombre,
            mods,
            prepMs: azar.entre(plato.prep[0], plato.prep[1]) * 60000,
            hecho: false,
            hechoEn: null,
        };
    };

    const variosProductos = (lista, min, max) =>
        azar.elegirVarios(lista, azar.entero(min, max))
            .map(plato => producto(plato, azar.probabilidad(0.12) ? 2 : 1));

    const mesaLibre = () => {
        const ocupadas = new Set(tarjetas.filter(t => t.estado !== 'retirada').map(t => t.mesa));

        for (let intento = 0; intento < 30; intento++) {
            const mesa = azar.entero(1, 65);
            if (!ocupadas.has(mesa)) return mesa;
        }
        return azar.entero(1, 65);
    };


    /*  Una tarjeta nueva. 'comunes' son los datos del ticket —mesa, número, mesero—,
     *  que se repiten en todas las tarjetas del mismo pedido: en pantalla cada tarjeta
     *  lleva su cabecera completa, no hay nada que las una salvo que coinciden.
     */
    const nuevaTarjeta = (comunes, { curso = null, items, estado = 'fuego', enviadaEn = simMs }) => {
        const tarjeta = {
            ...comunes,
            id: idSiguiente++,
            curso,
            estado: 'pausa',
            items,
            enviadaEn,
            disparadaEn: null,
            listaEn: null,
            despachadaEn: null,
            retiradaEn: null,
            recuperada: false,
            vistaEnPantalla: false,
        };

        tarjetas.push(tarjeta);
        if (estado === 'fuego') disparar(tarjeta);

        return tarjeta;
    };


    function crearOrden(tipo = azar.segunPeso(Object.entries(ajustes.mezcla).map(([valor, peso]) => ({ valor, peso })))) {

        if (tarjetas.filter(t => t.estado !== 'retirada').length >= TOPE_DE_TARJETAS_VIVAS) return null;

        const numero = numeroSiguiente++;

        const comunes = {
            ordenId: numero,
            numero,
            tipoOrden: tipo,
            rotulo: TIPOS_DE_ORDEN[tipo]?.rotulo ?? '',
            mesa: null,
            comensales: null,
            mesero: '',
            cliente: '',
            pagado: null,
            horaPrometida: '',
        };

        if (tipo === 'mesa') {
            comunes.mesa = mesaLibre();
            comunes.comensales = azar.entero(1, 6);
            comunes.mesero = azar.elegir(MESEROS);

            if (azar.probabilidad(ajustes.probCursos)) {
                //  ENTRADA en fuego y FUERTE retenido: dos tarjetas, mismo número.
                nuevaTarjeta(comunes, { curso: CURSO.ENTRADA, items: variosProductos(platosDelCurso(CURSO.ENTRADA), 1, 2) });

                nuevaTarjeta(comunes, {
                    curso: CURSO.FUERTE,
                    estado: 'pausa',
                    items: [...variosProductos(platosDelCurso(CURSO.FUERTE), 1, 3), ...variosProductos(SUELTOS, 0, 1)],
                });

                if (azar.probabilidad(ajustes.probPostre)) {
                    nuevaTarjeta(comunes, { curso: CURSO.POSTRE, estado: 'pausa', items: variosProductos(platosDelCurso(CURSO.POSTRE), 1, 2) });
                }
            }
            else {
                //  Sin cursos: una sola tarjeta, sin franja.
                nuevaTarjeta(comunes, { items: [...variosProductos(platosDelCurso(CURSO.FUERTE), 1, 3), ...variosProductos(SUELTOS, 0, 2)] });
            }

            if (azar.probabilidad(ajustes.probSegundoEnvio)) {
                agendar(simMs + azar.entre(4, 10) * 60000, 'segundoEnvio', { ordenId: numero });
            }
        }
        else {
            comunes.pagado = tipo === 'takeout' ? azar.probabilidad(0.7) : true;

            comunes.cliente = tipo === 'uber'
                ? `UBER${azar.entero(0x1000, 0xFFFFF).toString(16).toUpperCase()} ${azar.elegir(REPARTIDORES)}`
                : azar.elegir(CLIENTES);

            if (tipo === 'online') {
                comunes.horaPrometida = horaPrometida(fechaDe(simMs + azar.entre(15, 40) * 60000));
            }

            nuevaTarjeta(comunes, { items: [...variosProductos(platosDelCurso(CURSO.FUERTE), 1, 3), ...variosProductos(SUELTOS, 0, 2)] });
        }

        return numero;
    }


    function segundoEnvio(ordenId) {
        const vivas = tarjetas.filter(t => t.ordenId === ordenId && t.estado !== 'retirada');
        if (vivas.length === 0) return;

        const { id, curso, estado, items, enviadaEn, disparadaEn, listaEn, despachadaEn, retiradaEn, recuperada, vistaEnPantalla, ...comunes } = vivas[0];

        nuevaTarjeta(comunes, { items: variosProductos(SUELTOS, 1, 2) });
    }


    //  ── AVANZAR UNA TARJETA ──────────────────────────────────────────────────

    function disparar(tarjeta) {
        if (tarjeta.estado !== 'pausa') return;

        tarjeta.estado = 'fuego';
        tarjeta.disparadaEn = simMs;

        programarCocina(tarjeta);
    }

    function programarCocina(tarjeta, fraccion = 1) {
        if (!ajustes.autoCocina) return;

        tarjeta.items.forEach((item, indice) => {
            if (item.hecho) return;
            agendar(simMs + (item.prepMs * fraccion) / Math.max(0.1, ajustes.rapidezCocina), 'itemListo', { tarjetaId: tarjeta.id, indice });
        });
    }

    function marcarProducto(tarjeta, indice, hecho) {
        const item = tarjeta.items[indice];
        if (!item || tarjeta.estado === 'pausa' || tarjeta.estado === 'despachada' || tarjeta.estado === 'retirada') return;

        item.hecho = hecho;
        item.hechoEn = hecho ? simMs : null;

        const todos = tarjeta.items.every(i => i.hecho);

        if (todos && tarjeta.estado === 'fuego') {
            tarjeta.estado = 'lista';
            tarjeta.listaEn = simMs;
            if (ajustes.autoCocina) agendar(simMs + entreSegundos(ajustes.esperaExpoS), 'despachar', { tarjetaId: tarjeta.id });
        }
        else if (!todos && tarjeta.estado === 'lista') {
            //  Alguien quitó una palomita: la tarjeta vuelve a estar en preparación.
            tarjeta.estado = 'fuego';
            tarjeta.listaEn = null;
        }
    }

    function despachar(tarjeta) {
        if (tarjeta.estado === 'despachada' || tarjeta.estado === 'retirada') return;

        //  Despachar una tarjeta entera da por hechos todos sus productos, como en Toast.
        for (const item of tarjeta.items) {
            if (!item.hecho) { item.hecho = true; item.hechoEn = simMs; }
        }

        if (tarjeta.disparadaEn === null) tarjeta.disparadaEn = simMs;
        if (tarjeta.listaEn === null) tarjeta.listaEn = simMs;

        tarjeta.estado = 'despachada';
        tarjeta.despachadaEn = simMs;

        if (ajustes.recientesVisibles) {
            agendar(simMs + ajustes.minutosRecientes * 60000, 'retirar', { tarjetaId: tarjeta.id });
        }
        else {
            retirar(tarjeta);
        }

        //  El curso siguiente del mismo ticket, si estaba retenido, sale al rato.
        const siguiente = siguienteCursoEnPausa(tarjeta);
        if (siguiente && ajustes.autoCocina) {
            agendar(simMs + entreSegundos(ajustes.pausaEntreCursosS), 'disparar', { tarjetaId: siguiente.id });
        }
    }

    function retirar(tarjeta) {
        if (tarjeta.estado === 'retirada') return;
        tarjeta.estado = 'retirada';
        tarjeta.retiradaEn = simMs;
    }

    /*  El curso retenido que toca disparar al despacharse 'tarjeta', o null.
     *
     *  Solo un CURSO suelta al siguiente, y solo cuando todos los anteriores han salido.
     *  Sin esas dos condiciones, un segundo envío de la mesa —que no es curso de nada—
     *  al despacharse soltaba el postre con el plato fuerte todavía en el fuego.
     */
    function siguienteCursoEnPausa(tarjeta) {
        if (!tarjeta.curso) return null;

        const delTicket = tarjetas.filter(t => t.ordenId === tarjeta.ordenId && t.curso);
        const posicion = (t) => ORDEN_DE_CURSOS.indexOf(t.curso);

        const candidato = delTicket
            .filter(t => t.estado === 'pausa')
            .sort((a, b) => posicion(a) - posicion(b))[0];
        if (!candidato) return null;

        const anterioresFuera = delTicket
            .filter(t => posicion(t) < posicion(candidato))
            .every(t => t.estado === 'despachada' || t.estado === 'retirada');

        return anterioresFuera ? candidato : null;
    }


    //  ── PROCESAR LA AGENDA ───────────────────────────────────────────────────

    const tarjetaPorId = (id) => tarjetas.find(t => t.id === id);

    function procesar(suceso) {
        const tarjeta = suceso.tarjetaId ? tarjetaPorId(suceso.tarjetaId) : null;

        switch (suceso.tipo) {

            case 'llegada':
                if (ajustes.autoLlegadas) crearOrden();
                agendar(simMs + Math.max(5000, azar.exponencial(ajustes.intervaloMedioS) * 1000), 'llegada');
                break;

            case 'segundoEnvio':
                segundoEnvio(suceso.ordenId);
                break;

            //  Lo de la cocina solo ocurre solo si la cocina va en automático. En manual
            //  los sucesos que quedaran en la agenda se dejan caer sin más.
            case 'itemListo':
                if (ajustes.autoCocina && tarjeta?.estado === 'fuego') marcarProducto(tarjeta, suceso.indice, true);
                break;

            case 'despachar':
                if (ajustes.autoCocina && tarjeta?.estado === 'lista') despachar(tarjeta);
                break;

            case 'disparar':
                if (ajustes.autoCocina && tarjeta) disparar(tarjeta);
                break;

            case 'retirar':
                if (tarjeta?.estado === 'despachada') retirar(tarjeta);
                break;
        }
    }

    function avanzar(realAhoraMs = Date.now()) {
        const delta = Math.min(SALTO_MAXIMO_MS, Math.max(0, realAhoraMs - ultimoRealMs));
        ultimoRealMs = realAhoraMs;

        const hasta = simMs + delta * ajustes.velocidad;

        while (agenda.length > 0 && agenda[0].en <= hasta) {
            const suceso = agenda.shift();
            simMs = suceso.en;
            procesar(suceso);
        }

        simMs = hasta;

        //  El registro no crece sin fin: se sueltan las retiradas más viejas.
        if (tarjetas.length > TOPE_DEL_REGISTRO) {
            const sobran = tarjetas.length - TOPE_DEL_REGISTRO;
            let quitadas = 0;
            tarjetas = tarjetas.filter(t => !(t.estado === 'retirada' && quitadas < sobran && ++quitadas));
        }
    }


    //  ── LO QUE SE VE ─────────────────────────────────────────────────────────

    const estaEnPantalla = (t) => t.estado !== 'retirada' && (t.estado !== 'despachada' || ajustes.recientesVisibles);

    /*  La tarjeta tal como hay que pintarla: con sus textos ya resueltos.
     *
     *  El tiempo de la CABECERA se congela al despachar y el del FIRE sigue corriendo.
     *  No es un capricho: en las capturas reales una entrada despachada marca 6:22
     *  arriba y FIRE 6:31 debajo.
     */
    const paraPintar = (t) => ({
        ...t,
        textoMesa: t.mesa !== null ? `Table ${t.mesa}` : '',
        textoNumero: `#${t.numero}`,
        tiempoCabecera: formatoCronometro((t.despachadaEn ?? simMs) - t.enviadaEn),
        segundosDeEspera: Math.floor(((t.despachadaEn ?? simMs) - t.enviadaEn) / 1000),
        tiempoFuego: t.disparadaEn === null ? '' : formatoCronometro(simMs - t.disparadaEn),
        todosHechos: t.items.length > 0 && t.items.every(i => i.hecho),
    });


    //  ── EL REGISTRO: LA VERDAD ───────────────────────────────────────────────

    const filaDelRegistro = (t) => ({
        id: t.id,
        clave: claveDeTicket(t.numero, t.curso ?? ''),
        mesa: t.mesa !== null ? String(t.mesa) : `#${t.numero}`,
        ticket: String(t.numero),
        tipo: t.curso ?? t.rotulo ?? '',
        tipoOrden: t.tipoOrden,
        estado: t.estado,
        productos: t.items.map(i => `${i.cantidad} ${i.nombre}`).join(' · '),

        tomaDeOrden: horaDe(t.enviadaEn),
        disparada: horaDe(t.disparadaEn),
        lista: horaDe(t.listaEn),
        despachada: horaDe(t.despachadaEn),
        retirada: horaDe(t.retiradaEn),

        //  La primera señal que da la tablet de que el pedido está listo. Es contra lo
        //  que se compara 'Listo en tablet': que se complete de palomitas, o —si se
        //  despachó a mano sin pasar por ahí— que se despache.
        listoEnTablet: horaDe(t.listaEn ?? t.despachadaEn),

        vistaEnPantalla: t.vistaEnPantalla,
    });


    //  ── ARRANQUE ─────────────────────────────────────────────────────────────

    agendar(2000, 'llegada');


    return {
        ajustes,
        semilla,

        avanzar,

        ajustar(cambios) {
            const antes = { ...ajustes };
            Object.assign(ajustes, cambios);

            //  Al pasar la cocina de manual a automático hay que reprogramar lo que
            //  quedó a medias: sus sucesos se dejaron caer mientras estaba en manual.
            if (!antes.autoCocina && ajustes.autoCocina) {
                for (const t of tarjetas) {
                    if (t.estado === 'fuego') programarCocina(t, azar.entre(0.2, 1));
                    if (t.estado === 'lista') agendar(simMs + entreSegundos(ajustes.esperaExpoS), 'despachar', { tarjetaId: t.id });
                }
            }

            //  Al ocultar lo despachado, lo que estaba en verde se va de la pantalla.
            if (antes.recientesVisibles && !ajustes.recientesVisibles) {
                tarjetas.filter(t => t.estado === 'despachada').forEach(retirar);
            }
        },

        crearOrden,

        //  TOQUES, como en la tablet de verdad
        alternarProducto(tarjetaId, indice) {
            const t = tarjetaPorId(tarjetaId);
            if (t) marcarProducto(t, indice, !t.items[indice]?.hecho);
        },
        despacharTarjeta(tarjetaId) {
            const t = tarjetaPorId(tarjetaId);
            if (t) despachar(t);
        },
        dispararTarjeta(tarjetaId) {
            const t = tarjetaPorId(tarjetaId);
            if (t) disparar(t);
        },

        //  «Recall»: vuelve a abrir la última tarjeta despachada.
        recuperar() {
            const ultima = tarjetas
                .filter(t => t.estado === 'despachada' || t.estado === 'retirada')
                .sort((a, b) => (b.despachadaEn ?? 0) - (a.despachadaEn ?? 0))[0];
            if (!ultima) return;

            ultima.estado = 'lista';
            ultima.despachadaEn = null;
            ultima.retiradaEn = null;
            ultima.recuperada = true;
        },

        despacharTodo() {
            tarjetas.filter(t => t.estado === 'fuego' || t.estado === 'lista').forEach(despachar);
        },

        vaciar() {
            tarjetas.filter(t => t.estado !== 'retirada').forEach(retirar);
        },

        borrarRegistro() {
            tarjetas = tarjetas.filter(t => t.estado !== 'retirada');
        },

        //  Para las escenas: mete una tarjeta ya hecha, con la edad y el estado que se pidan.
        agregarTarjeta(definicion) {
            const { curso = null, items = [], edadS = 0, edadFuegoS = null, estado = 'fuego', despachadaHaceS = null, tiempoCongeladoS = null, ...comunes } = definicion;

            const tarjeta = {
                ordenId: comunes.numero,
                tipoOrden: comunes.mesa !== undefined && comunes.mesa !== null ? 'mesa' : 'takeout',
                rotulo: '', mesa: null, comensales: null, mesero: '', cliente: '', pagado: null, horaPrometida: '',
                ...comunes,
                id: idSiguiente++,
                curso,
                estado,
                items: items.map(i => ({ cantidad: 1, mods: [], prepMs: 8 * 60000, hecho: false, hechoEn: null, ...i })),
                enviadaEn: simMs - edadS * 1000,
                disparadaEn: estado === 'pausa' ? null : simMs - (edadFuegoS ?? edadS) * 1000,
                listaEn: null,
                despachadaEn: null,
                retiradaEn: null,
                recuperada: false,
                vistaEnPantalla: false,
            };

            if (estado === 'lista' || estado === 'despachada') {
                tarjeta.items.forEach(i => { i.hecho = true; i.hechoEn = simMs; });
                tarjeta.listaEn = simMs - (despachadaHaceS ?? 0) * 1000;
            }
            if (estado === 'despachada') {
                //  'tiempoCongeladoS' es lo que marcaba la cabecera al despacharse.
                tarjeta.despachadaEn = tiempoCongeladoS !== null ? tarjeta.enviadaEn + tiempoCongeladoS * 1000 : simMs - (despachadaHaceS ?? 0) * 1000;

                //  Lista antes que despachada, nunca al revés.
                tarjeta.listaEn = Math.min(tarjeta.listaEn, tarjeta.despachadaEn);

                agendar(simMs + ajustes.minutosRecientes * 60000, 'retirar', { tarjetaId: tarjeta.id });
            }

            tarjetas.push(tarjeta);
            numeroSiguiente = Math.max(numeroSiguiente, (Number(comunes.numero) || 0) + 1);

            return tarjeta.id;
        },

        marcarVistas(ids) {
            for (const t of tarjetas) if (ids.has(t.id)) t.vistaEnPantalla = true;
        },

        //  LECTURAS
        reloj: () => horaDe(simMs),
        fecha: () => fechaDe(simMs),
        visibles: () => tarjetas.filter(estaEnPantalla).map(paraPintar),
        registro: () => tarjetas.map(filaDelRegistro),
    };
}
