import { CURSO } from './carta.js';




/*  ─────────────────────────────────────────────────────────────────────────────
 *  LAS CUENTAS DE UN TURNO DE RESTAURANTE
 *
 *  Un turno son N ROTACIONES: las veces que se ocupa una mesa. Cada rotación pide, de
 *  media, entrada, plato fuerte y postre, y cada uno de esos envíos tiene un tiempo
 *  máximo de preparación; pasado el suyo, el ticket cuenta como DEMORA.
 *
 *  Aquí solo hay CUENTAS: funciones puras, sin estado ni reloj. Todo lo que necesitan
 *  —el azar incluido— les llega por parámetro, así que se prueban en Node sin motor,
 *  sin navegador y sin esperar a que pase un turno de ocho horas. Quien lleva la cuenta
 *  de las mesas y la agenda es motor.js.
 *  ───────────────────────────────────────────────────────────────────────────── */


//  Un envío SIN curso: acompañantes sueltos que la mesa pide mientras se come el fuerte.
export const EXTRA = 'EXTRA';


const acotar = (valor, min, max) => Math.min(max, Math.max(min, valor));

//  Un ajuste puede llegar roto —guardado por una versión vieja, o a medio escribir en
//  el panel—. Las cuentas no se pueden caer por eso: se quedan con el valor de fábrica.
const numero = (valor, porDefecto) => (typeof valor === 'number' && Number.isFinite(valor) ? valor : porDefecto);




/**
 * Qué va a mandar a cocina una mesa, en orden.
 *
 * La media admite decimales: 2,5 son la mitad de las mesas con dos envíos y la otra
 * mitad con tres. Así el deslizador «tickets por mesa» se nota de medio en medio punto,
 * y la media de un turno entero sale la que se pidió.
 *
 * @param {object} azar                 el de azar.js
 * @param {number} ticketsPorRotacion   la MEDIA, de 1 a 5
 * @returns {string[]} p. ej. ['APPETIZER', 'ENTREE', 'EXTRA', 'DESSERT']
 */
export function planDeRotacion(azar, ticketsPorRotacion) {
    const media = acotar(numero(ticketsPorRotacion, 3), 1, 5);
    const entera = Math.floor(media);

    const cuantos = acotar(entera + (azar.probabilidad(media - entera) ? 1 : 0), 1, 5);

    switch (cuantos) {
        case 1: return [CURSO.FUERTE];

        //  Con dos, lo corriente es entrada y fuerte; los menos, fuerte y postre.
        case 2: return azar.probabilidad(0.7) ? [CURSO.ENTRADA, CURSO.FUERTE] : [CURSO.FUERTE, CURSO.POSTRE];

        case 3: return [CURSO.ENTRADA, CURSO.FUERTE, CURSO.POSTRE];
        case 4: return [CURSO.ENTRADA, CURSO.FUERTE, EXTRA, CURSO.POSTRE];
        default: return [CURSO.ENTRADA, CURSO.FUERTE, EXTRA, EXTRA, CURSO.POSTRE];
    }
}




/**
 * El tiempo máximo de preparación de una tarjeta, en milisegundos.
 *
 * Lo que no tiene curso —un pedido para llevar, unos acompañantes sueltos— se mide con
 * la vara del plato fuerte: es lo que lleva dentro casi siempre, y es también lo que
 * hace Jarvis cuando no reconoce el tipo de plato.
 */
export function limiteDeLaTarjetaMs(curso, ajustes) {
    const minutos = curso === CURSO.ENTRADA ? numero(ajustes?.limiteEntradaMin, 7)
        : curso === CURSO.POSTRE ? numero(ajustes?.limitePostreMin, 5)
            : numero(ajustes?.limiteFuerteMin, 15);

    return Math.max(0.25, minutos) * 60000;
}




//  Lo que se aparta del límite, por arriba o por abajo, un tiempo de preparación.
const MARGEN_DEL_LIMITE_MS = 20000;


/**
 * Cuánto va a tardar la cocina en sacar una tarjeta, y si eso es una demora.
 *
 * NUNCA CAE JUSTO EN EL LÍMITE, y es a propósito. La ventana de la tablet lee la
 * pantalla cada varios segundos y apunta las horas con ese grano; una tarjeta que
 * saliera a 14:58 de un máximo de 15:00 daría «demora» o «en plazo» según cuándo tocó
 * leer, y en la comparación no se sabría si falló la lectura o fue cuestión de suerte.
 * Con veinte segundos de margen a cada lado, la verdad no es discutible.
 *
 * @returns {{ objetivoMs: number, demoraPrevista: boolean }}
 */
export function tiempoDePreparacionMs(azar, limiteMs, ajustes) {

    if (azar.probabilidad(acotar(numero(ajustes?.probDemora, 0.2), 0, 1))) {
        const excesoMaximoMs = Math.max(MARGEN_DEL_LIMITE_MS, numero(ajustes?.excesoMaxDemoraMin, 6) * 60000);

        return { objetivoMs: Math.round(limiteMs + azar.entre(MARGEN_DEL_LIMITE_MS, excesoMaximoMs)), demoraPrevista: true };
    }

    let objetivoMs = limiteMs * azar.entre(0.45, 0.92);

    //  El margen solo se aplica si cabe: con un máximo de medio minuto, quitarle veinte
    //  segundos dejaría la preparación en nada.
    if (limiteMs - MARGEN_DEL_LIMITE_MS >= limiteMs * 0.45) objetivoMs = Math.min(objetivoMs, limiteMs - MARGEN_DEL_LIMITE_MS);

    return { objetivoMs: Math.round(objetivoMs), demoraPrevista: false };
}




/**
 * Cuánto se aprietan las llegadas según la hora: 1 es lo normal. 'f' es la fracción del
 * turno ya transcurrida. Una campana centrada en la mitad del turno: al abrir y al
 * cerrar entra poco más de la mitad de gente que de media, y en el pico casi el doble.
 * Su media a lo largo del turno es ≈ 1, así que no cambia cuántas mesas entran, solo cuándo.
 */
export const pesoDeLaHora = (f) => 0.55 + 1.3 * Math.exp(-(((f - 0.5) / 0.2) ** 2));




/**
 * Cuánto falta para que se ocupe la siguiente mesa, en milisegundos.
 *
 * LA MEDIA SE RECALCULA EN CADA LLEGADA CON LO QUE QUEDA —de tiempo y de mesas—, y por
 * eso el turno acaba dando exactamente las rotaciones pedidas aunque a mitad se cambie
 * el número, la duración, o el mínimo en pantalla haya hecho entrar mesas de más: lo
 * que se adelantó se descuenta solo de lo que falta.
 *
 * La espera es una exponencial —muchas cortas y alguna larga: la gente llega a rachas—
 * acotada para que ni entren dos mesas pegadas ni una racha de mala suerte deje el
 * comedor vacío media hora.
 *
 * @param {object}  azar
 * @param {object}  que
 * @param {number}  que.ahoraMs
 * @param {number}  que.inicioMs    cuándo empezó el turno
 * @param {number}  que.finMs       cuándo acaba
 * @param {number}  que.restantes   rotaciones que faltan por iniciar
 * @param {boolean} que.horaPico
 */
export function esperaHastaLaSiguienteRotacionMs(azar, { ahoraMs, inicioMs, finMs, restantes, horaPico }) {
    const quedan = Math.max(1, numero(restantes, 1));

    let media;

    if (ahoraMs >= finMs) {
        //  Se acabó el horario y quedan mesas por entrar: pasan seguidas, sin hora pico
        //  que valga. Ocurre al acortar el turno o al subirle las rotaciones sobre la marcha.
        media = 20000;
    }
    else {
        media = Math.max(10000, (finMs - ahoraMs) / quedan);

        if (horaPico) {
            const fraccion = acotar((ahoraMs - inicioMs) / Math.max(1, finMs - inicioMs), 0, 1);
            media /= pesoDeLaHora(fraccion);
        }
    }

    return acotar(azar.exponencial(media), 5000, 4 * media);
}
