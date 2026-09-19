/*  ─────────────────────────────────────────────────────────────────────────────
 *  EL CRONÓMETRO DE LA TARJETA
 *
 *  El 'FIRE' que muestra cada ticket NO es una hora: es cuánto lleva esperando, y va
 *  subiendo solo. Se ve como 'h:mm:ss' cuando pasa de la hora y como 'mm:ss' cuando no.
 *
 *  LA PRUEBA, por si alguien duda y quiere volver a tratarlo como hora:
 *    · Con el reloj de la tablet en las 12:36 había tarjetas marcando 16:25:52.
 *    · Otra marcaba 33:43, que no es ninguna hora del día.
 *    · Y un pedido de Online Ordering mostraba '@12:30p' en la cabecera JUNTO A
 *      'FIRE 7:48' — la hora de verdad y el cronómetro, uno al lado del otro.
 *
 *  De aquí salen las dos columnas de tiempo de la parrilla:
 *
 *      tiempo de vida = el cronómetro tal cual. No hay nada que calcular: lo lleva la
 *                       propia tablet, y por eso esa columna funciona aunque falle la
 *                       lectura del reloj por ADB.
 *
 *      toma de orden  = reloj de la tablet − cronómetro.
 *
 *  Vive en su propio archivo porque lo usan dos sitios: el espejo, para descartar
 *  lecturas que no son tickets, y el seguimiento, para llenar la parrilla.
 *  ───────────────────────────────────────────────────────────────────────────── */


/*  Un cronómetro leído de la pantalla, en segundos.
 *
 *  Devuelve null —no cero— cuando no hay nada aprovechable. Cero es un cronómetro
 *  perfectamente válido (un ticket recién entrado), y confundirlos llenaría celdas con
 *  datos falsos.
 */
export function aSegundosDeCronometro(valor) {
    const texto = String(valor ?? '').trim();
    if (!texto) return null;

    const partes = texto.split(':').map(p => p.trim());
    if (partes.length < 2 || partes.length > 3) return null;
    if (partes.some(p => !/^\d{1,2}$/.test(p))) return null;

    const numeros = partes.map(Number);

    //  Dos partes son 'mm:ss'; tres, 'h:mm:ss'.
    const [horas, minutos, segundos] = partes.length === 3 ? numeros : [0, numeros[0], numeros[1]];

    //  Los minutos y segundos de un cronómetro no llegan a 60. Si llegan, lo leído no
    //  era un cronómetro y vale más descartarlo que pintarlo.
    if (minutos > 59 || segundos > 59) return null;

    const total = horas * 3600 + minutos * 60 + segundos;

    //  Más de un día esperando es un error de lectura, no un pedido. El tope es
    //  generoso a propósito: esta pantalla arrastra tickets de la noche anterior.
    return total <= 26 * 3600 ? total : null;
}


//  De segundos a 'HH:MM:SS'. Vale igual para una duración que para una hora del día.
export function aTexto(segundos) {
    const pad = (n) => String(n).padStart(2, '0');

    return `${pad(Math.floor(segundos / 3600))}:${pad(Math.floor((segundos % 3600) / 60))}:${pad(segundos % 60)}`;
}


/*  ─────────────────────────────────────────────────────────────────────────────
 *  EL COLOR DE LA TARJETA ES UNA ALARMA DE TIEMPO, NO UN PASO DEL PROCESO
 *
 *  Esto se creyó al revés durante bastante tiempo y costó dos columnas vacías, así que
 *  queda escrito con los datos que lo zanjaron. De una captura con 24 tickets:
 *
 *      AMARILLOS:  13:30  25:41  27:24  51:04  1:13:15  1:18:24  1:19:51
 *                  1:30:33  1:33:24  1:38:31
 *      ROJOS:      1:46:01  2:14:49  2:29:32  2:32:17  2:51:21  16:40:42
 *                  16:46:58  17:05:57 … 18:35
 *
 *  El corte está entre 1:38:31 y 1:46:01. Veinticuatro tarjetas, cero excepciones: el
 *  color depende SOLO del tiempo de espera. No dice si el pedido está hecho, ni si
 *  salió de cocina, ni nada del proceso.
 *
 *  DE AHÍ SE SIGUEN DOS COSAS:
 *
 *  1. 'Listo en tablet' no se puede deducir del color. Eso lo marca la palomita verde
 *     que la cocina pone en cada renglón del ticket.
 *
 *  2. No hace falta preguntarle el color al modelo. Lo sabemos nosotros, y mejor: cada
 *     campo que se le pide de más empeora lo que lee. Antes se le pedía, y encima se
 *     le pedía 'verde', que en esa pantalla no existe como color de cabecera.
 *  ───────────────────────────────────────────────────────────────────────────── */


/*  Dónde está el corte entre amarillo y rojo.
 *
 *  1:40:00 es el punto medio entre la última tarjeta amarilla observada (1:38:31) y la
 *  primera roja (1:46:01). El valor exacto que usa Toast no lo sabemos: está en su
 *  configuración, no en la pantalla. Si alguien llega a verlo, se cambia aquí y nada
 *  más — es el único sitio donde vive este número.
 */
export const UMBRAL_ROJO_S = 100 * 60;


/*  El color de una tarjeta, deducido de su espera.
 *
 *  Queda una duda sin resolver: en capturas anteriores se vieron tarjetas que parecían
 *  ANARANJADAS a tiempos (18:07, 15:37) que en la captura buena salen amarillas. Puede
 *  que haya tres bandas y no dos, o puede que fuera cosa de la imagen. Mientras no se
 *  confirme se usan dos, que es lo único que la evidencia sostiene; añadir la tercera
 *  es meter un umbral más en esta función y un color más en la parrilla.
 */
export function bandaPorEspera(segundos) {
    if (segundos === null || segundos === undefined) return '';

    return segundos >= UMBRAL_ROJO_S ? 'rojo' : 'amarillo';
}
