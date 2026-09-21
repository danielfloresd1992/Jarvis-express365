/*  ─────────────────────────────────────────────────────────────────────────────
 *  CÓMO SE ESCRIBEN LOS NÚMEROS EN EL SIMULADOR
 *
 *  Funciones pequeñas que convierten un dato en el texto que se enseña. Están aparte
 *  porque las usan el panel y el registro, y para que cada una se entienda sola: reciben
 *  un valor, devuelven un texto, y no tocan nada más.
 *  ───────────────────────────────────────────────────────────────────────────── */


/** Un número con dos cifras: 7 → '07'. */
export const dos = (n) => String(n).padStart(2, '0');


/** ¿Es un número de verdad? Descarta null, undefined, NaN, Infinity y los textos. */
export const esNumero = (valor) => typeof valor === 'number' && Number.isFinite(valor);


/** Segundos → '2:10'. Es como Toast escribe sus cronómetros. */
export const minSeg = (segundos) => {
    const total = Math.max(0, Math.round(segundos));
    return `${Math.floor(total / 60)}:${dos(total % 60)}`;
};


/** Segundos → '02:41', en horas y minutos: para lo que dura un turno. */
export const horasMin = (segundos) => {
    const minutos = Math.max(0, Math.floor(segundos / 60));
    return `${dos(Math.floor(minutos / 60))}:${dos(minutos % 60)}`;
};


/** Una fracción → '75 %'. Recibe 0.75, no 75. */
export const porCiento = (fraccion) => `${Math.round(fraccion * 100)} %`;


/** Un número con coma decimal, a la española: 2.5 → '2,5'. */
export const conComa = (n) => String(n).replace('.', ',');


/** '1 ticket' o '3 tickets': el número con su palabra en singular o plural. */
export const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;


/** Un texto recortado a 'largo' letras, con puntos suspensivos si se pasaba. */
export const recortar = (texto, largo) => (texto.length > largo ? `${texto.slice(0, largo - 1)}…` : texto);


/** Una diferencia en segundos con su signo: '+5 s', '-12 s'. Sin dato, una raya. */
export const delta = (segundos) => (segundos === null || segundos === undefined ? '—' : `${segundos > 0 ? '+' : ''}${segundos} s`);


/** Una espera dicha a ojo: '~40 s' por debajo de minuto y medio, '~3 min' por encima. */
export const enUnRato = (segundos) => (segundos < 90 ? `~${Math.max(1, Math.round(segundos))} s` : `~${Math.round(segundos / 60)} min`);
