import { diferenciaEnSegundos } from './motor/tiempo.js';
import { esNumero } from './formato.js';




/*  ─────────────────────────────────────────────────────────────────────────────
 *  LA VERDAD FRENTE A LO INFERIDO
 *
 *  El simulador sabe a qué hora entró y se terminó cada ticket: es LA VERDAD. La ventana
 *  de la tablet, leyendo la pantalla con la IA, saca su propia lista: LO INFERIDO. Este
 *  archivo pone una cosa al lado de la otra y dice cuánto se parecen.
 *
 *  No pinta nada ni sabe de React: recibe datos y devuelve datos. Así se puede probar
 *  en Node, y lo que se ve en pantalla (RegistroComparado.jsx) solo tiene que pintarlo.
 *
 *  DE AQUÍ SALEN LAS DOS TABLAS DEL REGISTRO:
 *
 *      'filas'        una por cada ticket que GENERÓ la simulación       → tabla 1
 *      'reconocidos'  una por cada ticket que RECONOCIÓ la inferencia    → tabla 2
 *
 *  Un ticket de una tabla y otro de la otra son el mismo cuando coincide su 'clave'
 *  (número de ticket + curso; ver libs/tickets/claveDeTicket.js).
 *  ───────────────────────────────────────────────────────────────────────────── */


//  Los cursos, con el valor que les da el motor. Van escritos y no importados de la
//  carta porque aquí hacen de contrato: es lo que viene en 'curso' en cada fila del registro.
export const ENTRADA = 'APPETIZER';
export const FUERTE = 'ENTREE';
export const POSTRE = 'DESSERT';


//  El «Tipo de plato» que pone Jarvis en su parrilla → el curso al que corresponde.
const CURSO_SEGUN_JARVIS = { 'Entrada': ENTRADA, 'Plato fuerte': FUERTE, 'Postre': POSTRE };

const cursoDeLaVerdad = (verdad) => verdad.curso ?? ([ENTRADA, FUERTE, POSTRE].includes(verdad.tipo) ? verdad.tipo : '');


/*  Cómo le fue a la inferencia con UN ticket. Es la última columna de la tabla 2.
 *
 *  Solo ACIERTO cuenta como acierto. Los demás dicen, en orden de gravedad, qué falló.
 */
export const RESULTADO = Object.freeze({
    ACIERTO: 'acierto',                  //  existe, la mesa es la suya y la hora cae dentro de la tolerancia
    HORA_ESTIMADA: 'hora estimada',      //  existe, pero se le vio ya listo: su hora es una estimación
    HORA_DESVIADA: 'hora desviada',      //  existe, pero la toma de orden se va más de la tolerancia
    SIN_HORA: 'sin hora',                //  existe, pero la inferencia no le sacó toma de orden
    MESA_DISTINTA: 'mesa distinta',      //  existe el ticket, pero con otra mesa
    NO_EXISTE: 'no existe',              //  la simulación nunca generó ese ticket: lo inventó la lectura
});




/*  El tiempo máximo con el que Jarvis juzgaría este pedido, en segundos.
 *
 *  Sale del TIPO QUE INFIRIÓ, no del verdadero: si tomó un postre por un plato fuerte le
 *  dará 15 minutos donde tocaban 5 y no verá la demora, y eso es justo lo que hay que
 *  enseñar. Lo que no es entrada, fuerte ni postre —un Take Out, un tipo vacío— se mide
 *  como plato fuerte, igual que hace el motor.
 *
 *  Cuando el tipo SÍ coincide se usa el límite que de verdad se le aplicó a la tarjeta:
 *  los máximos se pueden mover a mitad de turno, y una tarjeta disparada antes del
 *  cambio se juzgó con los de antes.
 */
function limiteSegunJarvis(tipoInferido, verdad, limites) {
    const curso = CURSO_SEGUN_JARVIS[tipoInferido] ?? '';

    if (esNumero(verdad.limiteS) && curso === cursoDeLaVerdad(verdad)) return verdad.limiteS;

    const minutos = curso === ENTRADA ? limites.entradaMin : curso === POSTRE ? limites.postreMin : limites.fuerteMin;
    return esNumero(minutos) ? minutos * 60 : null;
}




/**
 * El resultado de la inferencia con un ticket que SÍ existe en la simulación.
 *
 * @param {object} verdad       la fila del registro del motor
 * @param {object} ia           el pedido tal como lo infirió la ventana de la tablet
 * @param {number|null} dToma   segundos de diferencia en la toma de orden (null = sin hora)
 * @param {number} toleranciaS  cuántos segundos de desvío se dan por buenos
 */
function resultadoDe(verdad, ia, dToma, toleranciaS) {
    if (String(ia.mesa) !== verdad.mesa) return RESULTADO.MESA_DISTINTA;
    if (dToma === null) return RESULTADO.SIN_HORA;
    if (Math.abs(dToma) <= toleranciaS) return RESULTADO.ACIERTO;

    //  Se le vio por primera vez ya despachado, con el contador de la cabecera congelado:
    //  la propia ventana marca esa toma de orden como estimada.
    return ia.tomaOrdenAproximada ? RESULTADO.HORA_ESTIMADA : RESULTADO.HORA_DESVIADA;
}


//  El mismo resultado, dicho desde el lado de la verdad. Es el 'veredicto' de siempre:
//  lo conserva la exportación a CSV, que ya tenía ese nombre de columna.
const VEREDICTO_DEL_RESULTADO = {
    [RESULTADO.ACIERTO]: { texto: 'coincide', clase: 'sim-bien' },
    [RESULTADO.HORA_ESTIMADA]: { texto: 'hora estimada (se vio ya listo)', clase: 'sim-aviso' },
    [RESULTADO.HORA_DESVIADA]: { texto: 'hora desviada', clase: 'sim-mal' },
    [RESULTADO.SIN_HORA]: { texto: 'detectado, sin hora', clase: 'sim-aviso' },
};




/**
 * Compara la verdad del simulador con lo que infirió la ventana de la tablet.
 *
 * @param {object} que
 * @param {Array}  que.registro     motor.registro(): la verdad, una fila por tarjeta
 * @param {object} que.turno        leerTurno(motor): se devuelve tal cual, para el resumen
 * @param {object} que.inferencia   el último mensaje 'inferencia' de la ventana, o null
 * @param {number} que.toleranciaS  segundos de desvío que se dan por buenos
 * @param {object} que.limites      { entradaMin, fuerteMin, postreMin }
 */
export function comparar({ registro, turno, inferencia, toleranciaS, limites }) {

    const inferidos = new Map((inferencia?.pedidos ?? []).map(pedido => [pedido.clave, pedido]));
    const yaEstaban = new Set(inferencia?.yaEstaban ?? []);


    //  ── TABLA 1: un ticket por cada uno que generó la simulación, el más nuevo arriba ──
    const filas = [...registro].reverse().map((verdad) => {
        const ia = inferidos.get(verdad.clave) ?? null;

        const dToma = ia ? diferenciaEnSegundos(verdad.tomaDeOrden, ia.tomaOrden) : null;
        const dListo = ia && verdad.listoEnTablet ? diferenciaEnSegundos(verdad.listoEnTablet, ia.listoTablet) : null;

        const resultado = ia ? resultadoDe(verdad, ia, dToma, toleranciaS) : null;

        /*  ¿PODÍA reconocerlo? Un ticket que ya estaba en pantalla cuando se conectó la
         *  ventana se aparta a propósito, y uno que nunca llegó a pintarse —se quedó en
         *  otra pantalla— no lo pudo ver nadie. Ninguno de los dos es un fallo de la
         *  lectura, así que no cuentan en el porcentaje.
         */
        const yaEstaba = yaEstaban.has(verdad.clave);
        const reconocible = Boolean(inferencia) && verdad.vistaEnPantalla && !yaEstaba;

        let veredicto;
        if (ia) veredicto = resultado === RESULTADO.MESA_DISTINTA ? { texto: `mesa distinta (${ia.mesa})`, clase: 'sim-mal' } : VEREDICTO_DEL_RESULTADO[resultado];
        else if (yaEstaba) veredicto = { texto: 'ya estaba al conectar', clase: '' };
        else if (!verdad.vistaEnPantalla) veredicto = { texto: 'no salió en pantalla', clase: '' };
        else if (!inferencia) veredicto = { texto: '—', clase: '' };
        else veredicto = { texto: 'sin detectar', clase: 'sim-aviso' };

        /*  LA DEMORA, COMO LA MEDIRÍA JARVIS: de su toma de orden a su «listo en tablet»,
         *  contra el máximo del tipo que infirió. No es la misma cuenta que la de la
         *  cocina —que mide desde el FIRE— y en una tarjeta que estuvo en HOLD no puede
         *  salir igual. No se pinta en las tablas, que tienen que leerse de un vistazo,
         *  pero sí va en la exportación.
         */
        let iaPrepS = ia ? diferenciaEnSegundos(ia.tomaOrden, ia.listoTablet) : null;
        if (iaPrepS !== null && iaPrepS < 0) iaPrepS = null;

        const iaLimiteS = iaPrepS !== null ? limiteSegunJarvis(ia.tipo, verdad, limites) : null;
        const iaDemora = iaPrepS !== null && iaLimiteS !== null ? iaPrepS > iaLimiteS : null;
        const iaExcesoS = iaDemora ? iaPrepS - iaLimiteS : 0;

        const demoraCoincide = iaDemora !== null && typeof verdad.demora === 'boolean' ? iaDemora === verdad.demora : null;

        return { verdad, ia, dToma, dListo, resultado, reconocible, yaEstaba, veredicto, iaPrepS, iaLimiteS, iaDemora, iaExcesoS, demoraCoincide };
    });


    //  ── TABLA 2: un ticket por cada uno que reconoció la inferencia ──
    const porClave = new Map(filas.map(fila => [fila.verdad.clave, fila]));

    const reconocidos = [...inferidos.values()].map((ia) => {
        const fila = porClave.get(ia.clave) ?? null;

        return {
            ia,
            verdad: fila?.verdad ?? null,
            dToma: fila?.dToma ?? null,
            dListo: fila?.dListo ?? null,
            resultado: fila ? fila.resultado : RESULTADO.NO_EXISTE,
        };
    });

    //  Los que NO existen van arriba: son lo primero que hay que ver. Los demás, en el
    //  mismo orden que la tabla 1, para poder seguirlos con la vista de una a otra.
    const ordenEnLaTabla1 = new Map(filas.map((fila, i) => [fila.verdad.clave, i]));
    const puesto = (fila) => (fila.verdad ? ordenEnLaTabla1.get(fila.verdad.clave) : -1);

    reconocidos.sort((a, b) => puesto(a) - puesto(b));

    //  Lo que la lectura dio por pedido y la simulación nunca generó: números mal leídos.
    const fantasmas = reconocidos.filter(fila => fila.resultado === RESULTADO.NO_EXISTE).map(fila => fila.ia);


    //  ── EL RESUMEN ──
    const detectadas = filas.filter(fila => fila.ia);
    const conHora = detectadas.filter(fila => fila.dToma !== null);
    const aciertos = reconocidos.filter(fila => fila.resultado === RESULTADO.ACIERTO);

    const medidas = filas.filter(fila => fila.demoraCoincide !== null);
    const fallosDeDemora = medidas.filter(fila => !fila.demoraCoincide);

    //  LOS DOS FALLOS QUE SE MIRAN APARTE, cada uno con su número y su porcentaje:
    //    · los que la lectura PUDO ver y no vio;
    //    · los que sí vio pero con la toma de orden fuera de la tolerancia.
    //  Estaban dentro de los otros marcadores, restando de cabeza. Puestos así se leen de un vistazo.

    // sinReconocer = «los que se pudieron ver y no se vieron»
    const sinReconocer = filas.filter(fila => fila.reconocible && !fila.ia);

    // horaDesviada = «los que se vieron, pero su toma de orden no cuadra»
    const horaDesviada = reconocidos.filter(fila => fila.resultado === RESULTADO.HORA_DESVIADA);

    // horaEstimada = «se vieron ya listos, así que su hora es una estimación y no una medida»
    const horaEstimada = reconocidos.filter(fila => fila.resultado === RESULTADO.HORA_ESTIMADA);

    // sinHora = «se vieron, pero no se les pudo sacar la hora»
    const sinHora = reconocidos.filter(fila => fila.resultado === RESULTADO.SIN_HORA);

    return {
        filas,
        reconocidos,
        fantasmas,
        turno,
        resumen: {
            //  Tabla 1
            generados: filas.length,
            reconocibles: filas.filter(fila => fila.reconocible).length,

            //  Tabla 2
            inferidos: reconocidos.length,                        //  todo lo que dio la inferencia
            existen: reconocidos.length - fantasmas.length,       //  …lo que de verdad existe
            aciertos: aciertos.length,                            //  …y, de eso, lo que además está bien
            inventados: fantasmas.length,
            numerosInventados: fantasmas.map(pedido => `#${pedido.ticket || '?'}`),

            //  Los dos fallos que se enseñan con su número y su porcentaje
            sinReconocer: sinReconocer.length,
            numerosSinReconocer: sinReconocer.map(fila => `#${fila.verdad.ticket}`),

            horaDesviada: horaDesviada.length,
            numerosHoraDesviada: horaDesviada.map(fila => `#${fila.ia?.ticket ?? '?'}`),
            horaEstimada: horaEstimada.length,
            sinHora: sinHora.length,

            errorMedio: conHora.length ? Math.round(conHora.reduce((suma, fila) => suma + Math.abs(fila.dToma), 0) / conHora.length) : null,

            //  La demora según Jarvis: solo para la exportación.
            demorasMedidas: medidas.length,
            demorasAcertadas: medidas.length - fallosDeDemora.length,
            fallosDeDemoraPorHold: fallosDeDemora.filter(fila => fila.verdad.retenida).length,

            //  Los nombres de antes, que sigue usando la exportación.
            total: filas.length,
            detectadas: detectadas.length,
            coinciden: aciertos.length,
        },
    };
}
