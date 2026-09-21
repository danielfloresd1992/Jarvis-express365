import { crearAzar } from './azar.js';
import { CURSO, PLATOS, SUELTOS, BEBIDAS, GUARNICIONES, TERMINOS, NOTAS, MESEROS, CLIENTES, REPARTIDORES, TIPOS_DE_ORDEN, platosDelCurso } from './carta.js';
import { formatoCronometro, horaDelReloj, horaPrometida } from './tiempo.js';
import { EXTRA, planDeRotacion, limiteDeLaTarjetaMs, tiempoDePreparacionMs, esperaHastaLaSiguienteRotacionMs } from './turno.js';
import { claveDeTicket } from '../../libs/tickets/claveDeTicket.js';




/*  ─────────────────────────────────────────────────────────────────────────────
 *  EL MOTOR: UNA COCINA DE MENTIRA QUE SE COMPORTA COMO LA DE TOAST
 *
 *  No pinta nada. Lleva el reloj de la «tablet», sienta mesas, hace avanzar cada
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
 *  UN TURNO SON ROTACIONES. Una rotación es una mesa ocupada: se sienta, pide —de
 *  media— entrada, plato fuerte y postre, y se va. Toda la rotación lleva UN número de
 *  ticket, como la cuenta de Toast, y cada envío a cocina es una tarjeta con ese número.
 *  Hay dos maneras de mandar, y en el restaurante se ven las dos:
 *
 *      uno a uno   lo normal. La mesa pide la entrada; cuando se la han servido y se la
 *                  ha comido, pide el fuerte: una tarjeta NUEVA, con su propia hora de
 *                  entrada, que nace ya en fuego. Es el «aparece ticket nuevo en la comanda».
 *      todo junto  el mesero lo marca todo de golpe: salen todas las tarjetas a la vez,
 *                  la primera en fuego y las demás RETENIDAS (HOLD), con la misma hora
 *                  de entrada. Cada una se dispara al rato de salir la anterior. Es el
 *                  caso que más fácil rompe una lectura que identifique los pedidos solo
 *                  por su número, o que mida la preparación desde que entró la tarjeta.
 *
 *  CADA TARJETA TIENE UN TIEMPO MÁXIMO DE PREPARACIÓN según su tipo de plato. Al
 *  dispararse se sortea cuánto va a tardar la cocina —dentro del máximo o, con la
 *  frecuencia que se pida, pasándose—, y las palomitas van cayendo solas hasta la
 *  última, que cae justo a esa hora. Las cuentas están en turno.js.
 *
 *  Y HAY TICKETS HECHOS A MANO ('crearTicketManual'): quien prueba elige el pedido, el
 *  tipo de plato y los platos, y —si quiere— lo cocina él. Una tarjeta 'cocinaManual' es
 *  intocable para la cocina automática: ni palomitas, ni despacho, ni disparo de su HOLD,
 *  esté 'autoCocina' como esté. Solo avanza con toques ('alternarProducto', 'marcarLista',
 *  'despacharTarjeta', 'dispararTarjeta'), y su demora se mide igual que la de todas: de
 *  FIRE a «todas las palomitas» contra el máximo de su tipo. Es la manera de tener en
 *  pantalla un ticket cuya verdad se decide al segundo, en medio de un turno que sigue
 *  su marcha alrededor.
 *
 *  EL TIEMPO ES DE MENTIRA PERO NO DEPENDE DE TEMPORIZADORES. 'avanzar' recibe la hora
 *  real y pone la simulación al día procesando una agenda de sucesos. Importa, porque
 *  Chromium frena los temporizadores de una ventana que no está a la vista —y esta
 *  ventana se pasa la vida tapada por Jarvis—: con una agenda, da igual cada cuánto se
 *  la llame, el resultado es el mismo.
 *  ───────────────────────────────────────────────────────────────────────────── */


export const AJUSTES_POR_DEFECTO = {
    //  Cuánto corre el reloj de la simulación respecto al de verdad. Es lo único que
    //  hay para ir más deprisa: acelera el reloj entero, no solo la cocina.
    velocidad: 1,

    //  Minutos que el reloj de la «tablet» va por delante del equipo. En el restaurante
    //  no coinciden —se llegaron a ver dos horas de diferencia—, y la lectura tiene que
    //  dar las horas en el reloj de la tablet. Con un desfase aquí se comprueba.
    desfaseRelojMin: 0,

    //  EL TURNO
    turnoEnMarcha: true,          //  en pausa no entra nadie nuevo (lo que ya está en cocina sigue)
    rotacionesDelTurno: 70,       //  cuántas veces se ocupa una mesa en el turno
    duracionDelTurnoH: 8,
    horaPico: true,               //  las llegadas se aprietan hacia la mitad del turno
    minimoEnPantalla: 3,          //  tarjetas SIN despachar que hay como mínimo; si bajan, entra otra mesa
    ticketsPorRotacion: 3,        //  MEDIA (admite decimales, 1–5). 3 = entrada, plato fuerte y postre
    probTodoJunto: 0.3,           //  mesas que mandan todos los cursos de golpe: los siguientes salen en HOLD
    paraLlevarCadaS: 600,         //  0 = no entran pedidos para llevar. No cuentan como rotación
    mezclaParaLlevar: { takeout: 35, uber: 30, doordash: 15, doordashTakeout: 5, online: 15 },

    //  TIEMPOS MÁXIMOS DE PREPARACIÓN, en minutos. Pasado el suyo, el ticket cuenta como DEMORA
    limiteEntradaMin: 7,
    limiteFuerteMin: 15,
    limitePostreMin: 5,
    probDemora: 0.2,              //  con qué frecuencia un ticket supera su límite
    excesoMaxDemoraMin: 6,        //  cuánto se pasa, como mucho, uno que se demora

    //  LA COCINA
    autoCocina: true,
    esperaExpoS: [20, 90],        //  lo que tarda el expedidor en despachar una tarjeta lista

    //  ENTRE CURSO Y CURSO: lo que la mesa tarda en comerse uno y pedir (o soltar) el siguiente
    pausaEntreCursosS: [180, 480],

    //  LA PANTALLA
    recientesVisibles: true,      //  «recently fulfilled»: lo despachado se queda, en verde
    minutosRecientes: 3,
};


//  Entre qué valores tiene sentido cada número. El tercero marca los que van sin decimales.
const RANGOS = {
    velocidad: [0.1, 1000],
    desfaseRelojMin: [-1440, 1440],
    rotacionesDelTurno: [0, 2000, true],
    duracionDelTurnoH: [0.05, 48],
    minimoEnPantalla: [0, 30, true],
    ticketsPorRotacion: [1, 5],
    probTodoJunto: [0, 1],
    paraLlevarCadaS: [0, 86400],
    limiteEntradaMin: [0.25, 600],
    limiteFuerteMin: [0.25, 600],
    limitePostreMin: [0.25, 600],
    probDemora: [0, 1],
    excesoMaxDemoraMin: [0, 600],
    minutosRecientes: [0, 600],
};

const esNumero = (valor) => typeof valor === 'number' && Number.isFinite(valor);


/*  De lo que llegue, solo lo que el motor entiende y con un valor que pueda usar.
 *
 *  Los ajustes vienen del panel, pero también de lo que el navegador guardó de una
 *  versión anterior: claves que ya no existen ('autoLlegadas', 'rapidezCocina'…),
 *  valores a medias, un null donde iba un número. Nada de eso puede parar la cocina:
 *  lo que no se entiende se ignora y se queda el valor que había.
 */
function saneados(cambios) {
    const limpios = {};

    for (const [clave, valor] of Object.entries(cambios ?? {})) {
        if (!Object.hasOwn(AJUSTES_POR_DEFECTO, clave)) continue;

        const deFabrica = AJUSTES_POR_DEFECTO[clave];

        if (typeof deFabrica === 'boolean') {
            if (typeof valor === 'boolean') limpios[clave] = valor;
        }
        else if (typeof deFabrica === 'number') {
            if (!esNumero(valor)) continue;

            const [min, max, sinDecimales] = RANGOS[clave] ?? [-Infinity, Infinity];
            const acotado = Math.min(max, Math.max(min, valor));

            limpios[clave] = sinDecimales ? Math.round(acotado) : acotado;
        }
        else if (Array.isArray(deFabrica)) {
            //  Un intervalo en segundos: [mínimo, máximo].
            if (Array.isArray(valor) && valor.length === 2 && valor.every(n => esNumero(n) && n >= 0)) {
                limpios[clave] = [Math.min(...valor), Math.max(...valor)];
            }
        }
        else if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
            //  La mezcla de pedidos para llevar: pesos por tipo. Una mesa no es para llevar.
            const pesos = Object.entries(valor).filter(([tipo, peso]) => tipo !== 'mesa' && esNumero(peso) && peso >= 0);
            if (pesos.length > 0) limpios[clave] = Object.fromEntries(pesos);
        }
    }

    return limpios;
}


//  Más tarjetas vivas que estas y dejan de entrar pedidos: es que nadie está cocinando.
//  Es también lo que impide que el mínimo en pantalla meta mesas sin fin.
const TOPE_DE_TARJETAS_VIVAS = 40;

//  El registro no crece sin fin: en un turno largo simulado a toda velocidad se iría
//  a miles de filas.
const TOPE_DEL_REGISTRO = 600;

//  Una ventana dormida puede despertar horas después. Se pone al día como mucho esto.
const SALTO_MAXIMO_MS = 10 * 60 * 1000;

//  «El lapso de un minuto»: el margen dentro del cual entra, al azar, la primera mesa del
//  turno y cada mesa que se adelanta porque faltan tickets en pantalla (ver
//  'programarSiguienteRotacion'). Es tiempo de la SIMULACIÓN: con el reloj a ×10 son seis
//  segundos de los de verdad.
const LAPSO_DE_LLEGADA_MS = 60 * 1000;

//  Cada cuánto vuelve a intentarlo una mesa que quiere pedir con la puerta cerrada (ver
//  'siguienteEnvio' en 'procesar'). Corto, para que al reanudar pida enseguida.
const ESPERA_CON_LA_PUERTA_CERRADA_MS = 10 * 1000;

const ORDEN_DE_CURSOS = [CURSO.ENTRADA, CURSO.FUERTE, CURSO.POSTRE];

//  Las que cuentan para el mínimo en pantalla: las que todavía le deben algo a la cocina.
const ESTADOS_ACTIVOS = new Set(['pausa', 'fuego', 'lista']);

//  Si la mezcla guardada se queda sin ningún peso, se reparte como de fábrica.
const MEZCLA_DE_FABRICA = Object.entries(AJUSTES_POR_DEFECTO.mezclaParaLlevar).map(([valor, peso]) => ({ valor, peso }));

const cuentaVacia = () => ({ tickets: 0, total: 0, entradas: 0, fuertes: 0, postres: 0, otros: 0 });

const grupoDelCurso = (curso) => (curso === CURSO.ENTRADA ? 'entradas' : curso === CURSO.FUERTE ? 'fuertes' : curso === CURSO.POSTRE ? 'postres' : 'otros');




/**
 * @param {object}   [que]
 * @param {number}   [que.semilla]   misma semilla, misma historia
 * @param {object}   [que.ajustes]
 * @param {number}   [que.ahoraMs]   la hora real de arranque. Solo la pasan las pruebas,
 *                                   para que ni las horas del registro dependan del día
 * @param {function} [que.alSuceso]  se llama tras procesar cada suceso de la agenda. Es
 *                                   para las pruebas: deja medir «en cada suceso» sin
 *                                   tener que avanzar el reloj de milisegundo en milisegundo
 */
export function crearMotor({ semilla = Date.now(), ajustes: ajustesIniciales = {}, ahoraMs = Date.now(), alSuceso = null } = {}) {

    const azar = crearAzar(semilla);
    const ajustes = { ...AJUSTES_POR_DEFECTO, ...saneados(ajustesIniciales) };

    const relojInicialMs = ahoraMs;
    let ultimoRealMs = relojInicialMs;
    let simMs = 0;

    let tarjetas = [];
    let agenda = [];

    let numeroSiguiente = azar.entero(40, 160);
    let idSiguiente = 1;


    //  ── EL TURNO ─────────────────────────────────────────────────────────────

    let turnoInicioMs = 0;

    //  Cambia al reiniciar el turno. Las mesas que seguían sentadas del turno anterior
    //  terminan de comer, pero ni ellas ni sus tickets cuentan ya en el nuevo.
    let turnoSerie = 1;

    //  El número de la próxima rotación. Lo comparten las del turno y las manuales,
    //  así que NO sirve para saber cuánto cupo se ha gastado: eso es 'rotacionesIniciadas'.
    let rotacionSiguiente = 1;
    let rotacionIdSiguiente = 1;

    let rotacionesIniciadas = 0;    //  las del turno; las manuales no gastan cupo
    let rotacionesTerminadas = 0;   //  ídem
    let rotacionesManuales = 0;

    //  Las mesas que siguen sentadas, por su id interno. Una mesa puede no tener NINGUNA
    //  tarjeta en pantalla y seguir aquí: está comiéndose la entrada.
    const rotaciones = new Map();

    //  Lo que aportaron al turno las tarjetas que ya se soltaron del registro.
    let sueltas = cuentaVacia();

    const duracionDelTurnoMs = () => ajustes.duracionDelTurnoH * 3600000;

    const quedanRotaciones = () => rotacionesIniciadas < ajustes.rotacionesDelTurno;

    //  Abierto = entra gente. Cerrado el cupo se acaban también los pedidos para llevar:
    //  si no, el turno no terminaría nunca.
    const turnoAbierto = () => ajustes.turnoEnMarcha && quedanRotaciones();

    const vivas = () => tarjetas.reduce((n, t) => n + (t.estado !== 'retirada' ? 1 : 0), 0);

    const activas = () => tarjetas.reduce((n, t) => n + (ESTADOS_ACTIVOS.has(t.estado) ? 1 : 0), 0);


    //  ── EL RELOJ ─────────────────────────────────────────────────────────────

    const fechaDe = (ms) => new Date(relojInicialMs + ajustes.desfaseRelojMin * 60000 + ms);

    const horaDe = (ms) => (ms === null || ms === undefined ? '' : horaDelReloj(fechaDe(ms)));


    //  ── LA AGENDA ────────────────────────────────────────────────────────────

    //  Al milisegundo entero: el azar da decimales, y con ellos «lista a disparada + objetivo»
    //  dejaba de ser una igualdad exacta por una cuestión de coma flotante.
    const agendar = (en, tipo, datos = {}) => {
        agenda.push({ en: Math.round(en), tipo, ...datos });
        agenda.sort((a, b) => a.en - b.en);
    };

    const entreSegundos = ([min, max]) => azar.entre(min, max) * 1000;


    //  Un momento al azar dentro del próximo minuto (nunca antes de dos segundos, para que
    //  no parezca que la mesa ya estaba ahí).
    const enElProximoMinuto = () => azar.entre(2000, LAPSO_DE_LLEGADA_MS);

    //  ¿Hay menos tarjetas sin despachar que el mínimo que pide el panel?
    const faltanTickets = () => activas() < ajustes.minimoEnPantalla;


    /*  CUÁNDO ENTRA LA SIGUIENTE MESA
     *
     *  Solo hay UNA llegada agendada a la vez, y solo mientras el turno está abierto.
     *
     *  Se rehace en cada llegada y cada vez que cambia algo de lo que depende —las
     *  rotaciones, la duración, la hora pico, la pausa—: si no, subir las rotaciones de
     *  70 a 200 no se notaría hasta que venciera la espera calculada con las de antes.
     *
     *  LA ESPERA SALE DEL PATRÓN DEL PANEL —rotaciones del turno, duración, hora pico—,
     *  al azar, con DOS excepciones, y en las dos la mesa entra «en algún momento del
     *  próximo minuto»:
     *
     *    · LA PRIMERA MESA DEL TURNO. Al pulsar «Empezar» la pantalla está a cero, y así
     *      tiene que verse: vacía. Pero con 70 mesas en 8 horas la espera normal ronda
     *      los siete minutos, y nadie se queda mirando una pantalla en blanco ese rato.
     *
     *    · CUANDO FALTAN TICKETS para el mínimo en pantalla. La mesa que toca se
     *      adelanta. Entra UNA, y si sigue faltando se adelanta la siguiente: la pantalla
     *      se va llenando de una en una, nunca de golpe.
     */
    function programarSiguienteRotacion(esperaMs = null) {
        agenda = agenda.filter(s => s.tipo !== 'rotacion');
        if (!turnoAbierto()) return;

        const segunElPatron = esperaMs ?? esperaHastaLaSiguienteRotacionMs(azar, {
            ahoraMs: simMs,
            inicioMs: turnoInicioMs,
            finMs: turnoInicioMs + duracionDelTurnoMs(),
            restantes: ajustes.rotacionesDelTurno - rotacionesIniciadas,
            horaPico: ajustes.horaPico,
        });

        const hayPrisa = esperaMs === null && (rotacionesIniciadas === 0 || faltanTickets());

        const espera = hayPrisa ? Math.min(segunElPatron, enElProximoMinuto()) : segunElPatron;

        agendar(simMs + espera, 'rotacion');
    }

    function programarParaLlevar() {
        agenda = agenda.filter(s => s.tipo !== 'paraLlevar');
        if (!turnoAbierto() || !(ajustes.paraLlevarCadaS > 0)) return;

        agendar(simMs + Math.max(5000, azar.exponencial(ajustes.paraLlevarCadaS) * 1000), 'paraLlevar');
    }


    //  ── LOS PRODUCTOS ────────────────────────────────────────────────────────

    const producto = (plato, cantidad = 1) => {
        const mods = [];

        if (plato.termino) mods.push({ texto: azar.elegir(TERMINOS) });

        for (const guarnicion of azar.elegirVarios(GUARNICIONES, plato.guarniciones ?? 0)) {
            mods.push({ texto: guarnicion });
        }

        for (const extra of plato.extras ?? []) mods.push({ texto: extra });

        if (azar.probabilidad(0.22)) mods.push({ texto: azar.elegir(NOTAS), nota: true });

        const [prepMin, prepMax] = plato.prep ?? [4, 8];

        return {
            cantidad,
            nombre: plato.nombre,
            mods,

            //  Lo que pesa este producto frente a los demás de su tarjeta: la parrilla
            //  es la última en salir y la ensalada la primera. Cuánto tarda de verdad
            //  ('prepMs') no se sabe hasta que la tarjeta se dispara.
            peso: azar.entre(prepMin, prepMax),
            prepMs: null,
            hecho: false,
            hechoEn: null,
        };
    };

    const variosProductos = (lista, min, max) =>
        azar.elegirVarios(lista, azar.entero(min, max))
            .map(plato => producto(plato, azar.probabilidad(0.12) ? 2 : 1));

    //  Lo que pide la mesa de un curso. Una persona sola no pide tres platos fuertes.
    function productosDelCurso(curso, comensales) {
        const hasta = (tope) => Math.max(1, Math.min(tope, comensales ?? tope));

        const items = curso === CURSO.ENTRADA ? variosProductos(platosDelCurso(CURSO.ENTRADA), 1, hasta(2))
            : curso === CURSO.POSTRE ? variosProductos(platosDelCurso(CURSO.POSTRE), 1, hasta(2))
                : [...variosProductos(platosDelCurso(CURSO.FUERTE), 1, hasta(3)), ...variosProductos(SUELTOS, 0, 1)];

        //  Una tarjeta sin productos no se completaría nunca. Solo pasaría con una carta
        //  a la que le faltara un curso entero.
        return items.length > 0 ? items : variosProductos(SUELTOS, 1, 1);
    }

    const mesaLibre = () => {
        //  Ocupada está también la mesa que espera su siguiente curso sin tarjeta en pantalla.
        const ocupadas = new Set([
            ...tarjetas.filter(t => t.estado !== 'retirada').map(t => t.mesa),
            ...[...rotaciones.values()].map(r => r.comunes.mesa),
        ]);

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
    const nuevaTarjeta = (comunes, { curso = null, items, estado = 'fuego', enviadaEn = simMs, aMano = false, cocinaManual = false }) => {
        const tarjeta = {
            rotacion: null,
            rotacionId: null,
            manual: false,
            modoDeEnvio: '',
            turno: turnoSerie,
            ...comunes,
            id: idSiguiente++,
            curso,

            //  Hecha a mano con 'crearTicketManual', y si además la cocina la lleva quien
            //  prueba. Van ANTES de disparar: es 'disparar' quien decide si agenda palomitas.
            aMano,
            cocinaManual,

            estado: 'pausa',
            items,
            enviadaEn,
            disparadaEn: null,
            listaEn: null,
            despachadaEn: null,
            retiradaEn: null,

            //  Nació en HOLD: su contador de cabecera corre desde antes que su FIRE. Quien
            //  mida la preparación desde que vio entrar la tarjeta le cuenta de más.
            retenida: estado === 'pausa',

            limiteMs: null,
            objetivoMs: null,
            demoraPrevista: null,

            recuperada: false,
            vistaEnPantalla: false,
        };

        tarjetas.push(tarjeta);
        if (estado === 'fuego') disparar(tarjeta);

        return tarjeta;
    };


    //  ── LAS MESAS ────────────────────────────────────────────────────────────

    /*  Sienta una mesa y manda su primer envío.
     *
     *  Las MANUALES (el botón «+ Mesa») llevan número de rotación como las demás, pero no
     *  gastan cupo del turno: quien prueba a mano no quiere que el turno se le acorte.
     */
    function crearRotacion({ manual = false } = {}) {
        if (vivas() >= TOPE_DE_TARJETAS_VIVAS) return null;
        if (!manual && !quedanRotaciones()) return null;

        const plan = planDeRotacion(azar, ajustes.ticketsPorRotacion);
        const todoJunto = azar.probabilidad(ajustes.probTodoJunto);
        const numero = numeroSiguiente++;

        const rotacion = {
            id: rotacionIdSiguiente++,
            n: rotacionSiguiente++,
            serie: turnoSerie,
            manual,
            plan,
            cursos: plan.filter(envio => envio !== EXTRA),
            extras: plan.filter(envio => envio === EXTRA).length,
            todoJunto,

            enviados: 0,                //  cursos que ya tienen tarjeta
            ultimoCursoId: null,        //  la última tarjeta de curso que se mandó
            siguienteAgendado: false,
            extrasAgendados: false,
            extrasEnviados: 0,
            despachadas: new Set(),     //  por id: recuperar una tarjeta y volver a despacharla no cuenta dos veces

            comunes: null,
        };

        rotacion.comunes = {
            ordenId: numero,
            numero,
            tipoOrden: 'mesa',
            rotulo: TIPOS_DE_ORDEN.mesa?.rotulo ?? '',
            mesa: mesaLibre(),
            comensales: azar.entero(1, 6),
            mesero: azar.elegir(MESEROS),
            cliente: '',
            pagado: null,
            horaPrometida: '',

            rotacion: rotacion.n,
            rotacionId: rotacion.id,
            manual,
            modoDeEnvio: todoJunto ? 'junto' : 'unoAUno',
            turno: turnoSerie,
        };

        rotaciones.set(rotacion.id, rotacion);

        if (manual) rotacionesManuales++;
        else rotacionesIniciadas++;

        if (todoJunto) {
            //  Todas de golpe y con la misma hora: la primera en fuego, las demás retenidas.
            rotacion.cursos.forEach((_, i) => enviarCurso(rotacion, i === 0 ? 'fuego' : 'pausa'));
        }
        else {
            enviarCurso(rotacion);
        }

        return rotacion.n;
    }

    function enviarCurso(rotacion, estado = 'fuego') {
        const curso = rotacion.cursos[rotacion.enviados++];

        const tarjeta = nuevaTarjeta(rotacion.comunes, { curso, estado, items: productosDelCurso(curso, rotacion.comunes.comensales) });
        rotacion.ultimoCursoId = tarjeta.id;

        return tarjeta;
    }


    /*  Los acompañantes que la mesa pide mientras se come el fuerte: un envío aparte,
     *  sin curso, que no retrasa el postre.
     *
     *  ⚠  EL PRIMERO LLEVA EL NÚMERO DE LA ROTACIÓN; DEL SEGUNDO EN ADELANTE ESTRENAN
     *     NÚMERO. No es lo que hace Toast —allí todo va a la misma cuenta—, pero la clave
     *     de una tarjeta es su número más su curso (src/libs/tickets/claveDeTicket.js), y
     *     dos tarjetas SIN curso del mismo ticket compartirían la clave 'tk-N': en la
     *     parrilla serían una sola fila y en el registro no habría forma de casarlas. Es
     *     el límite conocido que ese archivo ya avisa; aquí se esquiva en vez de tropezar.
     */
    function enviarExtra(rotacion) {
        const comunes = rotacion.extrasEnviados === 0 ? rotacion.comunes : { ...rotacion.comunes, numero: numeroSiguiente++ };
        rotacion.extrasEnviados++;

        return nuevaTarjeta(comunes, { items: variosProductos(SUELTOS, 1, 2) });
    }

    function agendarExtras(tarjeta) {
        const rotacion = rotaciones.get(tarjeta.rotacionId);
        if (!rotacion || rotacion.extras === 0 || rotacion.extrasAgendados) return;

        rotacion.extrasAgendados = true;

        for (let i = 0; i < rotacion.extras; i++) {
            agendar(simMs + azar.entre(2, 5) * 60000, 'extra', { rotacionId: rotacion.id });
        }
    }

    function terminarRotacion(rotacion) {
        if (!rotaciones.delete(rotacion.id)) return;

        if (!rotacion.manual && rotacion.serie === turnoSerie) rotacionesTerminadas++;
    }


    //  ── LOS PEDIDOS PARA LLEVAR ──────────────────────────────────────────────

    function crearParaLlevar(tipo) {
        if (vivas() >= TOPE_DE_TARJETAS_VIVAS) return null;

        if (!tipo || tipo === 'mesa') {
            const mezcla = Object.entries(ajustes.mezclaParaLlevar).map(([valor, peso]) => ({ valor, peso }));
            tipo = azar.segunPeso(mezcla.some(o => o.peso > 0) ? mezcla : MEZCLA_DE_FABRICA);
        }

        const numero = numeroSiguiente++;

        nuevaTarjeta(cabeceraParaLlevar(tipo, numero), { items: [...variosProductos(platosDelCurso(CURSO.FUERTE), 1, 3), ...variosProductos(SUELTOS, 0, 2)] });

        return numero;
    }

    //  La cabecera de un pedido que no es de mesa: su rótulo, su cliente, si viene cobrado
    //  y su hora de recogida. Aparte de 'crearParaLlevar' porque los tickets hechos a mano
    //  la llevan IGUAL que los que entran solos: lo único que cambia es quién elige los platos.
    function cabeceraParaLlevar(tipo, numero) {
        const esDoorDash = tipo === 'doordash' || tipo === 'doordashTakeout';

        const comunes = {
            ordenId: numero,
            numero,
            tipoOrden: tipo,

            //  Un tipo que la carta no conozca sale sin rótulo, pero sale.
            rotulo: TIPOS_DE_ORDEN[tipo]?.rotulo ?? '',
            mesa: null,
            comensales: null,
            mesero: '',

            //  Así los escribe cada plataforma en la cabecera: «UBER 2A0F1…», «DD bc1f…».
            cliente: tipo === 'uber' ? `UBER${azar.entero(0x1000, 0xFFFFF).toString(16).toUpperCase()} ${azar.elegir(REPARTIDORES)}`
                : esDoorDash ? `DD ${azar.entero(0, 0xFFFF).toString(16).padStart(4, '0')} ${azar.elegir(CLIENTES)}`
                    : azar.elegir(CLIENTES),

            //  Lo que viene de una plataforma llega cobrado. En el mostrador, no siempre.
            pagado: tipo === 'takeout' ? azar.probabilidad(0.7) : true,
            horaPrometida: '',
        };

        //  Los pedidos con hora de recogida la enseñan donde los demás llevan el contador.
        //  No todos: DoorDash se ve de las dos maneras en las capturas.
        if (azar.probabilidad(tipo === 'online' ? 0.7 : esDoorDash ? 0.5 : 0)) {
            comunes.horaPrometida = horaPrometida(fechaDe(simMs + azar.entre(15, 40) * 60000));
        }

        return comunes;
    }

    //  El botón «+ Mesa» sienta una mesa a mano; los demás, un pedido para llevar.
    const crearOrden = (tipo) => (tipo === 'mesa' ? crearRotacion({ manual: true }) : crearParaLlevar(tipo));


    //  ── LOS TICKETS HECHOS A MANO ────────────────────────────────────────────

    const enteroPositivo = (valor) => {
        const n = typeof valor === 'string' && valor.trim() !== '' ? Number(valor) : valor;
        return esNumero(n) && n >= 1 ? Math.floor(n) : null;
    };

    //  Lo que pesa un producto frente a los demás de su tarjeta sale de la carta, como
    //  en los pedidos que entran solos. Un texto que no esté en ella pesa lo corriente.
    const pesoSegunLaCarta = (nombre) => {
        const [prepMin, prepMax] = [...PLATOS, ...SUELTOS, ...BEBIDAS].find(plato => plato.nombre === nombre)?.prep ?? [4, 8];
        return azar.entre(prepMin, prepMax);
    };

    /*  De lo que pide el formulario a los productos de una tarjeta. Se acepta cualquier
     *  texto como nombre —no solo los de la carta: a veces lo que se quiere probar es
     *  justo un plato que la lectura no ha visto nunca—, y lo que venga sin nombre se cae.
     */
    const productosAMano = (productos) => (Array.isArray(productos) ? productos : [])
        .map(({ nombre, cantidad = 1, mods = [], nota = '' } = {}) => ({
            nombre: String(nombre ?? '').trim(),
            cantidad: Math.min(99, enteroPositivo(cantidad) ?? 1),
            mods: [
                ...(Array.isArray(mods) ? mods : []).map(texto => String(texto ?? '').trim()).filter(Boolean).map(texto => ({ texto })),

                //  La nota a mano va la última, como la escribe Toast debajo de los modificadores.
                ...(String(nota ?? '').trim() ? [{ texto: String(nota).trim(), nota: true }] : []),
            ],
        }))
        .filter(item => item.nombre !== '')
        .map(item => ({ ...item, peso: pesoSegunLaCarta(item.nombre), prepMs: null, hecho: false, hechoEn: null }));


    /*  Un ticket con lo que diga quien prueba: qué pedido es, de qué tipo de plato y con
     *  qué platos. Devuelve el id de la tarjeta, o null si no trae ningún producto.
     *
     *  NO ES UNA ROTACIÓN: no gasta cupo del turno, no pide más cursos por su cuenta y no
     *  tiene mesa «sentada» que levantar. Sí es una tarjeta como las demás para todo lo
     *  otro: cuenta para el mínimo en pantalla, en los tickets del turno y en sus demoras.
     *
     *  Tampoco le aplica el tope de tarjetas vivas. Ese tope frena lo que entra SOLO, para
     *  que una cocina parada no llene la pantalla sin fin; a quien pide un ticket a
     *  propósito no se le puede contestar con un botón que no hace nada.
     *
     *  'numero' sirve para mandar OTRO curso del mismo ticket. Si ya hay una tarjeta de
     *  mesa con ese número, la nueva hereda su mesa, su mesero y sus comensales —en Toast
     *  todas las tarjetas de una cuenta llevan la misma cabecera—, salvo que se pida otra
     *  mesa a propósito. Con el mismo número Y el mismo curso que otra tarjeta viva las
     *  dos compartirían clave (ver claveDeTicket.js): se permite, porque en pantalla se ha
     *  visto y es un caso que merece prueba, pero es cosa de quien lo pide.
     */
    function crearTicketManual({ tipoOrden = 'mesa', mesa = null, numero = null, curso = '', productos, cocinaManual = true, enPausa = false } = {}) {
        const items = productosAMano(productos);
        if (items.length === 0) return null;

        const numeroPedido = enteroPositivo(numero);
        const numeroDelTicket = numeroPedido ?? numeroSiguiente++;

        //  Un número puesto a mano no puede volver a salir de la cuenta automática.
        numeroSiguiente = Math.max(numeroSiguiente, numeroDelTicket + 1);

        let comunes;

        if (tipoOrden === 'mesa') {
            //  La más reciente, siga o no en pantalla: la entrada pudo irse hace rato.
            const hermana = numeroPedido === null ? null
                : [...tarjetas].reverse().find(t => t.numero === numeroDelTicket && t.tipoOrden === 'mesa');

            comunes = {
                ordenId: numeroDelTicket,
                numero: numeroDelTicket,
                tipoOrden: 'mesa',
                rotulo: TIPOS_DE_ORDEN.mesa?.rotulo ?? '',
                mesa: enteroPositivo(mesa) ?? hermana?.mesa ?? mesaLibre(),
                comensales: hermana?.comensales ?? azar.entero(1, 6),
                mesero: hermana?.mesero ?? azar.elegir(MESEROS),
                cliente: '',
                pagado: null,
                horaPrometida: '',
            };
        }
        else {
            comunes = cabeceraParaLlevar(tipoOrden, numeroDelTicket);
        }

        const tarjeta = nuevaTarjeta(comunes, {
            //  Sin curso es null, no '': el registro y la pantalla preguntan con '??'.
            curso: ORDEN_DE_CURSOS.includes(curso) ? curso : null,
            items,
            estado: enPausa ? 'pausa' : 'fuego',
            aMano: true,
            cocinaManual: cocinaManual !== false,
        });

        return tarjeta.id;
    }


    //  ── AVANZAR UNA TARJETA ──────────────────────────────────────────────────

    /*  ¿Esta tarjeta la lleva la cocina automática? Es LA pregunta antes de hacer nada
     *  solo con una tarjeta: agendarle una palomita, despacharla o dispararle el HOLD.
     *  Una 'cocinaManual' contesta siempre que no, esté 'autoCocina' como esté; por eso
     *  se pregunta aquí y no mirando el ajuste a secas.
     */
    const laLlevaLaCocina = (tarjeta) => ajustes.autoCocina && !tarjeta.cocinaManual;

    function disparar(tarjeta) {
        if (tarjeta.estado !== 'pausa') return;

        tarjeta.estado = 'fuego';
        tarjeta.disparadaEn = simMs;

        //  El máximo se fija AQUÍ, con los ajustes de este momento: mover un límite en el
        //  panel vale para lo que se dispare desde ahora y no reescribe lo ya cocinado.
        tarjeta.limiteMs = limiteDeLaTarjetaMs(tarjeta.curso, ajustes);

        //  Cuánto tarda una tarjeta que cocina quien prueba lo decide él: no hay nada que
        //  sortear ni que repartir entre sus productos.
        if (tarjeta.cocinaManual) return;

        const { objetivoMs, demoraPrevista } = tiempoDePreparacionMs(azar, tarjeta.limiteMs, ajustes);
        tarjeta.objetivoMs = objetivoMs;
        tarjeta.demoraPrevista = demoraPrevista;

        repartirPreparacion(tarjeta);
        programarCocina(tarjeta);

        if (tarjeta.curso === CURSO.FUERTE) agendarExtras(tarjeta);
    }

    /*  Cuándo cae la palomita de cada producto. EL MÁS LENTO VALE EXACTAMENTE EL
     *  OBJETIVO, así que la tarjeta queda lista justo a 'disparadaEn + objetivoMs'; los
     *  demás salen antes, según lo que pese cada uno, y nunca antes de un tercio.
     */
    function repartirPreparacion(tarjeta) {
        const pesos = tarjeta.items.map(item => item.peso ?? azar.entre(4, 10));
        const mayor = Math.max(...pesos);
        const elMasLento = pesos.indexOf(mayor);

        tarjeta.items.forEach((item, i) => {
            item.prepMs = i === elMasLento
                ? tarjeta.objetivoMs
                : Math.round(tarjeta.objetivoMs * Math.min(0.97, Math.max(0.35, pesos[i] / mayor)));
        });
    }

    /*  Agenda las palomitas que faltan. 'reanudando' es volver de la cocina manual: lo
     *  que ya debería haber salido no sale todo de golpe, sino en los próximos segundos.
     */
    function programarCocina(tarjeta, reanudando = false) {
        if (!laLlevaLaCocina(tarjeta)) return;

        tarjeta.items.forEach((item, indice) => {
            if (item.hecho) return;

            const aSuHora = tarjeta.disparadaEn + (item.prepMs ?? 8 * 60000);
            const en = reanudando ? Math.max(aSuHora, simMs + azar.entre(5, 40) * 1000) : aSuHora;

            agendar(en, 'itemListo', { tarjetaId: tarjeta.id, indice });
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
            if (laLlevaLaCocina(tarjeta)) agendar(simMs + entreSegundos(ajustes.esperaExpoS), 'despachar', { tarjetaId: tarjeta.id });
        }
        else if (!todos && tarjeta.estado === 'lista') {
            //  Alguien quitó una palomita: la tarjeta vuelve a estar en preparación.
            tarjeta.estado = 'fuego';
            tarjeta.listaEn = null;
        }
    }

    /*  «Ya está»: todas las palomitas de golpe. La tarjeta queda LISTA a esta hora —que
     *  es la que cierra su preparación y decide si hubo demora—, pero NO se despacha:
     *  despachar es otro gesto, el del expedidor, y quien prueba quiere ver los dos
     *  momentos por separado, como los ve la lectura. Si la tarjeta es de las que lleva
     *  la cocina automática, el expedidor la despachará al rato, como a cualquiera.
     *
     *  Una retenida se dispara primero: no se puede terminar lo que no se ha empezado, y
     *  así su preparación consta (de cero segundos) en vez de quedarse sin medir.
     */
    function marcarLista(tarjeta) {
        if (tarjeta.estado === 'pausa') disparar(tarjeta);
        if (tarjeta.estado !== 'fuego') return;

        //  Pasa por 'marcarProducto' para que el cambio a 'lista' ocurra en un solo sitio:
        //  lo provoca la última palomita, igual que si se hubieran tocado una a una.
        tarjeta.items.forEach((item, indice) => { if (!item.hecho) marcarProducto(tarjeta, indice, true); });
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

        //  TODO JUNTO: el curso siguiente, que estaba retenido, se dispara al rato. Manda la
        //  RETENIDA, no la que sale: un HOLD hecho a mano para cocinarlo uno mismo espera a
        //  que lo toquen aunque el curso anterior se haya despachado solo.
        for (const retenida of cursosEnPausaQueTocan(tarjeta).filter(laLlevaLaCocina)) {
            agendar(simMs + entreSegundos(ajustes.pausaEntreCursosS), 'disparar', { tarjetaId: retenida.id });
        }

        alSalirDeCocina(tarjeta);
    }

    /*  Lo que le pasa a la MESA cuando sale una de sus tarjetas.
     *
     *  UNO A UNO: al salir el último curso que mandó, la mesa se lo come y pide el
     *  siguiente. Eso es cosa de la sala, no de la cocina, y por eso ocurre también con
     *  la cocina en manual: quien despacha a mano quiere ver entrar el ticket nuevo.
     */
    function alSalirDeCocina(tarjeta) {
        const rotacion = rotaciones.get(tarjeta.rotacionId);
        if (!rotacion) return;

        rotacion.despachadas.add(tarjeta.id);

        //  Un fuerte retenido que se despachó a mano sin dispararlo antes: sus extras
        //  no se habían pedido, y sin ellos la rotación no terminaría nunca.
        if (tarjeta.curso === CURSO.FUERTE) agendarExtras(tarjeta);

        if (tarjeta.id === rotacion.ultimoCursoId && rotacion.enviados < rotacion.cursos.length && !rotacion.siguienteAgendado) {
            rotacion.siguienteAgendado = true;
            agendar(simMs + entreSegundos(ajustes.pausaEntreCursosS), 'siguienteEnvio', { rotacionId: rotacion.id });
        }

        if (rotacion.despachadas.size >= rotacion.plan.length) terminarRotacion(rotacion);
    }

    function retirar(tarjeta) {
        if (tarjeta.estado === 'retirada') return;
        tarjeta.estado = 'retirada';
        tarjeta.retiradaEn = simMs;
    }

    /*  Los cursos retenidos que toca disparar al despacharse 'tarjeta'.
     *
     *  Solo un CURSO suelta al siguiente, y solo cuando todos los anteriores han salido.
     *  Sin esas dos condiciones, un envío suelto de la mesa —que no es curso de nada—
     *  al despacharse soltaba el postre con el plato fuerte todavía en el fuego.
     *
     *  Son varios y no uno porque en pantalla se ha visto el mismo curso de un ticket
     *  partido en dos tarjetas retenidas (el #48 de las escenas): salen las dos a la vez.
     */
    function cursosEnPausaQueTocan(tarjeta) {
        if (!tarjeta.curso) return [];

        const delTicket = tarjetas.filter(t => t.ordenId === tarjeta.ordenId && t.curso);
        const posicion = (t) => ORDEN_DE_CURSOS.indexOf(t.curso);

        const enPausa = delTicket.filter(t => t.estado === 'pausa');
        if (enPausa.length === 0) return [];

        const primera = Math.min(...enPausa.map(posicion));

        const anterioresFuera = delTicket
            .filter(t => posicion(t) < primera)
            .every(t => t.estado === 'despachada' || t.estado === 'retirada');

        return anterioresFuera ? enPausa.filter(t => posicion(t) === primera) : [];
    }


    /*  EL MÍNIMO EN PANTALLA: si las tarjetas sin despachar bajan del mínimo, la mesa que
     *  toca SE ADELANTA y entra en algún momento del próximo minuto.
     *
     *  Antes entraban de golpe todas las que faltaran: con el mínimo en 3, pulsar
     *  «Empezar» llenaba la pantalla en el acto, y eso no se parece a un restaurante.
     *  Ahora no aparece nada de repente: llega una mesa, al azar dentro del minuto, y si
     *  aún falta se adelanta la siguiente.
     *
     *  Gasta cupo del turno igual que antes, y como la espera entre llegadas se calcula
     *  con lo que queda, lo adelantado se compensa solo.
     *
     *  Se llama a menudo —tras cada suceso, cada toque y cada 'avanzar'—, así que NO
     *  vuelve a sortear una llegada que ya cae dentro del minuto: si lo hiciera, cada
     *  llamada la empujaría un poco más lejos y no llegaría nunca.
     */
    function mantenerMinimo() {
        if (!turnoAbierto() || !faltanTickets()) return;

        const agendada = agenda.find(s => s.tipo === 'rotacion');
        const yaEstaAlCaer = agendada && agendada.en - simMs <= LAPSO_DE_LLEGADA_MS;

        if (!yaEstaAlCaer) programarSiguienteRotacion();
    }


    //  ── PROCESAR LA AGENDA ───────────────────────────────────────────────────

    const tarjetaPorId = (id) => tarjetas.find(t => t.id === id);

    function procesar(suceso) {
        const tarjeta = suceso.tarjetaId ? tarjetaPorId(suceso.tarjetaId) : null;
        const rotacion = suceso.rotacionId ? rotaciones.get(suceso.rotacionId) : null;

        switch (suceso.tipo) {

            //  Abrir el turno: lo único que ocurre es el 'mantenerMinimo' del final.
            case 'abrir':
                break;

            case 'rotacion':
                if (turnoAbierto()) crearRotacion();
                programarSiguienteRotacion();
                break;

            case 'paraLlevar':
                if (turnoAbierto()) crearParaLlevar();
                programarParaLlevar();
                break;

            /*  CON LA PUERTA CERRADA NO APARECE NINGÚN TICKET NUEVO — TAMPOCO DE LAS MESAS
             *  QUE YA ESTÁN SENTADAS
             *
             *  «Dejar de recibir tickets nuevos» tiene que significar eso en la pantalla:
             *  que no entre una tarjeta más. Antes solo dejaban de sentarse mesas; las que
             *  ya estaban seguían pidiendo su plato fuerte y su postre, y quien había
             *  pulsado el botón veía aparecer tickets igual.
             *
             *  El envío no se pierde: se queda esperando y se vuelve a intentar al rato,
             *  así que al reanudar la mesa pide lo que le tocaba. Lo que YA está en
             *  pantalla sigue su curso — se cocina, se despacha, y un curso en HOLD se
             *  dispara, que ese no es un ticket nuevo.
             *
             *  La mesa ya no está si se vació la pantalla entre medias: no manda nada.
             */
            case 'siguienteEnvio':
                if (rotacion && !ajustes.turnoEnMarcha) {
                    agendar(simMs + ESPERA_CON_LA_PUERTA_CERRADA_MS, 'siguienteEnvio', { rotacionId: suceso.rotacionId });
                    break;
                }
                if (rotacion) {
                    rotacion.siguienteAgendado = false;
                    if (rotacion.enviados < rotacion.cursos.length) enviarCurso(rotacion);
                }
                break;

            case 'extra':
                if (rotacion && !ajustes.turnoEnMarcha) {
                    agendar(simMs + ESPERA_CON_LA_PUERTA_CERRADA_MS, 'extra', { rotacionId: suceso.rotacionId });
                    break;
                }
                if (rotacion) enviarExtra(rotacion);
                break;

            //  Lo de la cocina solo ocurre solo si la cocina va en automático. En manual
            //  los sucesos que quedaran en la agenda se dejan caer sin más. A una tarjeta
            //  'cocinaManual' no se le agenda ninguno; si aun así llegara uno, también se cae.
            case 'itemListo':
                if (tarjeta?.estado === 'fuego' && laLlevaLaCocina(tarjeta) && !tarjeta.items[suceso.indice]?.hecho) marcarProducto(tarjeta, suceso.indice, true);
                break;

            case 'despachar':
                if (tarjeta?.estado === 'lista' && laLlevaLaCocina(tarjeta)) despachar(tarjeta);
                break;

            case 'disparar':
                if (tarjeta && laLlevaLaCocina(tarjeta)) disparar(tarjeta);
                break;

            case 'retirar':
                if (tarjeta?.estado === 'despachada') retirar(tarjeta);
                break;
        }

        mantenerMinimo();
    }

    function avanzar(realAhoraMs = Date.now()) {
        const delta = Math.min(SALTO_MAXIMO_MS, Math.max(0, realAhoraMs - ultimoRealMs));
        ultimoRealMs = realAhoraMs;

        const hasta = simMs + delta * ajustes.velocidad;

        while (agenda.length > 0 && agenda[0].en <= hasta) {
            const suceso = agenda.shift();
            simMs = suceso.en;
            procesar(suceso);
            alSuceso?.(suceso);
        }

        simMs = hasta;

        mantenerMinimo();

        //  El registro no crece sin fin: se sueltan las retiradas más viejas.
        if (tarjetas.length > TOPE_DEL_REGISTRO) {
            const sobran = tarjetas.length - TOPE_DEL_REGISTRO;
            let quitadas = 0;
            soltar(t => t.estado === 'retirada' && quitadas < sobran && ++quitadas);
        }
    }

    //  Quita tarjetas del registro sin que el turno pierda la cuenta de ellas.
    function soltar(sobra) {
        tarjetas = tarjetas.filter(t => {
            if (!sobra(t)) return true;
            apuntarEnLaCuenta(sueltas, t);
            return false;
        });
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

    /*  Lo que tardó la cocina con una tarjeta, contra su máximo.
     *
     *  La preparación va de FIRE a «todas las palomitas». HAY DEMORA en cuanto lo que
     *  lleva supera el máximo, aunque siga en el fuego: ya no tiene arreglo. Que NO la
     *  hay solo se sabe cuando queda lista a tiempo; hasta entonces, null.
     *
     *  Se hace en milisegundos y no con las horas redondeadas del registro: un segundo
     *  de redondeo no puede decidir si un ticket se demoró.
     */
    const medir = (t) => {
        const limiteMs = t.limiteMs ?? limiteDeLaTarjetaMs(t.curso, ajustes);

        //  Una tarjeta que se quitó de la pantalla sin terminar deja de contar ahí.
        const finMs = t.listaEn ?? t.despachadaEn ?? t.retiradaEn ?? simMs;

        const preparacionMs = t.disparadaEn === null ? null : Math.max(0, finMs - t.disparadaEn);

        const demora = preparacionMs === null ? null
            : preparacionMs > limiteMs ? true
                : t.listaEn !== null ? false
                    : null;

        return { limiteMs, preparacionMs, demora, excesoMs: demora ? preparacionMs - limiteMs : 0, esperaTotalMs: Math.max(0, finMs - t.enviadaEn) };
    };

    function apuntarEnLaCuenta(cuenta, t) {
        if (t.turno !== turnoSerie) return;

        cuenta.tickets++;

        if (medir(t).demora === true) {
            cuenta.total++;
            cuenta[grupoDelCurso(t.curso)]++;
        }
    }

    const filaDelRegistro = (t) => {
        const { limiteMs, preparacionMs, demora, excesoMs, esperaTotalMs } = medir(t);

        return {
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

            //  EL TURNO
            rotacion: t.rotacion ?? null,
            manual: Boolean(t.manual),
            curso: t.curso ?? '',
            modoDeEnvio: t.modoDeEnvio ?? '',
            retenida: Boolean(t.retenida),

            //  HECHA A MANO ('crearTicketManual'), y si la cocina automática la tiene vetada.
            //  No es lo mismo que 'manual', que es de la ROTACIÓN: el botón «+ Mesa».
            aMano: Boolean(t.aMano),
            cocinaManual: Boolean(t.cocinaManual),

            //  LA DEMORA
            limiteS: Math.round(limiteMs / 1000),
            preparacionS: preparacionMs === null ? null : Math.round(preparacionMs / 1000),
            enPreparacion: t.estado === 'fuego',
            demora,
            excesoS: demora ? Math.max(1, Math.round(excesoMs / 1000)) : 0,

            //  De «enviada» a «lista»: lo que mide quien solo ve la cabecera. En una
            //  tarjeta que estuvo retenida es MÁS que la preparación.
            esperaTotalS: Math.round(esperaTotalMs / 1000),
        };
    };


    function turno() {
        const cuenta = { ...sueltas };
        for (const t of tarjetas) apuntarEnLaCuenta(cuenta, t);

        const { tickets, ...demoras } = cuenta;

        const proxima = turnoAbierto() ? agenda.find(s => s.tipo === 'rotacion') : null;
        const activasEnPantalla = activas();

        return {
            enMarcha: ajustes.turnoEnMarcha,

            //  Ya entraron todas Y no queda nadie: ni tarjetas por salir ni mesas a medio comer.
            terminado: !quedanRotaciones() && rotaciones.size === 0 && activasEnPantalla === 0,

            rotacionesDelTurno: ajustes.rotacionesDelTurno,
            rotacionesIniciadas,
            rotacionesTerminadas,
            rotacionesManuales,

            inicio: horaDe(turnoInicioMs),
            fin: horaDe(turnoInicioMs + duracionDelTurnoMs()),
            transcurridoS: Math.floor((simMs - turnoInicioMs) / 1000),
            duracionS: Math.round(duracionDelTurnoMs() / 1000),

            activasEnPantalla,
            tickets,
            proximaRotacionEnS: proxima ? Math.max(0, Math.ceil((proxima.en - simMs) / 1000)) : null,
            demoras,
        };
    }


    //  ── ARRANQUE ─────────────────────────────────────────────────────────────

    //  El turno empieza a contar ya, con la pantalla A CERO: la primera mesa se sienta en
    //  algún momento del primer minuto (lo decide 'programarSiguienteRotacion').
    //
    //  'abrir' no hace nada por sí mismo: existe para que la cuenta del mínimo en pantalla
    //  arranque en el instante cero POR LA AGENDA, como todo lo demás. Si la echara el
    //  primer 'avanzar', la misma semilla daría pedidos distintos según cuánto tardara en
    //  llegar esa primera llamada.
    agendar(0, 'abrir');
    programarSiguienteRotacion();
    programarParaLlevar();


    //  Un toque en la tablet o en el panel puede dejar la pantalla por debajo del mínimo.
    const trasUnToque = (resultado) => { mantenerMinimo(); return resultado; };


    return {
        ajustes,
        semilla,

        avanzar,

        ajustar(cambios) {
            const antes = { ...ajustes };
            const abiertoAntes = turnoAbierto();

            Object.assign(ajustes, saneados(cambios));

            //  El panel manda TODOS los ajustes cada vez que se toca cualquiera. Solo se
            //  rehace lo que depende de algo que haya cambiado de verdad: si no, mover el
            //  deslizador de los colores volvería a sortear cuándo llega la próxima mesa.
            const cambio = (...claves) => claves.some(clave => JSON.stringify(antes[clave]) !== JSON.stringify(ajustes[clave]));

            //  Al pasar la cocina de manual a automático hay que reprogramar lo que
            //  quedó a medias: sus sucesos se dejaron caer mientras estaba en manual.
            if (!antes.autoCocina && ajustes.autoCocina) {
                const porSoltar = new Set();

                //  Las que cocina quien prueba se quedan como están: encender la cocina
                //  automática no es permiso para tocarlas.
                for (const t of tarjetas.filter(laLlevaLaCocina)) {
                    if (t.estado === 'fuego') programarCocina(t, true);
                    if (t.estado === 'lista') agendar(simMs + entreSegundos(ajustes.esperaExpoS), 'despachar', { tarjetaId: t.id });

                    //  Un curso retenido cuyo anterior se despachó a mano: nadie lo iba a disparar.
                    if (t.estado === 'pausa') cursosEnPausaQueTocan(t).filter(laLlevaLaCocina).forEach(retenida => porSoltar.add(retenida));
                }

                for (const retenida of porSoltar) {
                    agendar(simMs + entreSegundos(ajustes.pausaEntreCursosS), 'disparar', { tarjetaId: retenida.id });
                }
            }

            //  Al ocultar lo despachado, lo que estaba en verde se va de la pantalla.
            if (antes.recientesVisibles && !ajustes.recientesVisibles) {
                tarjetas.filter(t => t.estado === 'despachada').forEach(retirar);
            }

            if (cambio('turnoEnMarcha', 'rotacionesDelTurno', 'duracionDelTurnoH', 'horaPico')) programarSiguienteRotacion();
            if (abiertoAntes !== turnoAbierto() || cambio('paraLlevarCadaS')) programarParaLlevar();

            mantenerMinimo();
        },


        //  EL TURNO
        crearRotacion: (opciones) => trasUnToque(crearRotacion(opciones)),

        //  Otro turno desde ahora mismo. Ni borra el registro ni toca lo que hay en
        //  pantalla: las mesas que seguían sentadas acaban de comer, sin contar en el nuevo.
        reiniciarTurno() {
            turnoSerie++;
            turnoInicioMs = simMs;

            rotacionSiguiente = 1;
            rotacionesIniciadas = 0;
            rotacionesTerminadas = 0;
            rotacionesManuales = 0;
            sueltas = cuentaVacia();

            //  Turno nuevo, pantalla a cero: la primera mesa, dentro del primer minuto.
            programarSiguienteRotacion();
            programarParaLlevar();
            mantenerMinimo();
        },

        turno,

        crearOrden: (tipo) => trasUnToque(crearOrden(tipo)),

        //  Un ticket con el pedido, el tipo de plato y los platos que se pidan. Devuelve el
        //  id de la tarjeta (el de 'registro' y 'visibles'), o null si no trae productos.
        crearTicketManual: (que) => trasUnToque(crearTicketManual(que)),


        //  TOQUES, como en la tablet de verdad
        alternarProducto(tarjetaId, indice) {
            const t = tarjetaPorId(tarjetaId);
            if (t) marcarProducto(t, indice, !t.items[indice]?.hecho);
            mantenerMinimo();
        },
        despacharTarjeta(tarjetaId) {
            const t = tarjetaPorId(tarjetaId);
            if (t) despachar(t);
            mantenerMinimo();
        },
        dispararTarjeta(tarjetaId) {
            const t = tarjetaPorId(tarjetaId);
            if (t) disparar(t);
            mantenerMinimo();
        },

        //  Este no existe en la tablet: allí las palomitas se ponen una a una. Es el «ya
        //  está preparado» de quien prueba, de un solo gesto. No despacha.
        marcarLista(tarjetaId) {
            const t = tarjetaPorId(tarjetaId);
            if (t) marcarLista(t);
            mantenerMinimo();
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

        /*  Despacha de golpe lo que hay en el fuego o listo… MENOS LO QUE COCINA QUIEN PRUEBA.
         *
         *  Es un atajo para quitarse de encima lo que lleva la cocina automática, y una
         *  tarjeta 'cocinaManual' está en pantalla precisamente para decidir al segundo
         *  cuándo queda lista y cuándo sale: si este botón se la llevara por delante le
         *  apuntaría una hora de «lista» que nadie eligió, y esa medida ya no se recupera.
         *  De los dos sustos posibles se elige el que se ve y se arregla con un toque: que
         *  quede una tarjeta en pantalla, con sus botones en el registro. Para llevárselo
         *  todo sin distinguir está 'vaciar'.
         */
        despacharTodo() {
            tarjetas.filter(t => (t.estado === 'fuego' || t.estado === 'lista') && !t.cocinaManual).forEach(despachar);
            mantenerMinimo();
        },

        //  Vaciar la pantalla levanta también a las mesas: si no, a los pocos minutos
        //  entraría el plato fuerte de una mesa que ya no está en ninguna parte. Es lo
        //  que deja una escena limpia aunque después se reanude la cocina.
        vaciar() {
            tarjetas.filter(t => t.estado !== 'retirada').forEach(retirar);
            [...rotaciones.values()].forEach(terminarRotacion);
            mantenerMinimo();
        },

        borrarRegistro() {
            soltar(t => t.estado === 'retirada');
        },

        //  Para las escenas: mete una tarjeta ya hecha, con la edad y el estado que se pidan.
        //  No es de ninguna rotación ni cuenta en el turno.
        agregarTarjeta(definicion) {
            const { curso = null, items = [], edadS = 0, edadFuegoS = null, estado = 'fuego', despachadaHaceS = null, tiempoCongeladoS = null, ...comunes } = definicion;

            const tarjeta = {
                ordenId: comunes.numero,
                tipoOrden: comunes.mesa !== undefined && comunes.mesa !== null ? 'mesa' : 'takeout',
                rotulo: '', mesa: null, comensales: null, mesero: '', cliente: '', pagado: null, horaPrometida: '',
                rotacion: null, rotacionId: null, manual: false, modoDeEnvio: '', turno: null,
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
                retenida: estado === 'pausa' || (edadFuegoS !== null && edadFuegoS < edadS),
                limiteMs: estado === 'pausa' ? null : limiteDeLaTarjetaMs(curso, ajustes),
                objetivoMs: null,
                demoraPrevista: null,
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
