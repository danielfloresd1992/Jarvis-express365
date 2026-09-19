/*  LOS DOS FORMATOS DE TIEMPO QUE ENSEÑA TOAST
 *
 *  · El CRONÓMETRO de una tarjeta, sin ceros de relleno: '0:27', '5:38', '15:02' y, al
 *    pasar de la hora, '1:46:01'. Es el texto que la IA tiene que leer, así que aquí se
 *    escribe exactamente igual que en la pantalla de verdad.
 *
 *  · La HORA DEL RELOJ, 'HH:MM:SS', que es como la devuelve la tablet por ADB y como
 *    se apunta en el registro de la simulación.
 */


const dos = (n) => String(n).padStart(2, '0');


//  Milisegundos → '5:38' o '1:46:01'.
export function formatoCronometro(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));

    const horas = Math.floor(total / 3600);
    const minutos = Math.floor((total % 3600) / 60);
    const segundos = total % 60;

    return horas > 0
        ? `${horas}:${dos(minutos)}:${dos(segundos)}`
        : `${minutos}:${dos(segundos)}`;
}


//  Una fecha → 'HH:MM:SS', en la hora local.
export function horaDelReloj(fecha) {
    return `${dos(fecha.getHours())}:${dos(fecha.getMinutes())}:${dos(fecha.getSeconds())}`;
}


//  Una fecha → '@3:35p', que es como Toast escribe la hora prometida de un pedido online.
export function horaPrometida(fecha) {
    const horas = fecha.getHours();
    const doce = horas % 12 === 0 ? 12 : horas % 12;

    return `@${doce}:${dos(fecha.getMinutes())}${horas < 12 ? 'a' : 'p'}`;
}


//  'HH:MM:SS' → segundos desde medianoche. null si no es una hora.
export function aSegundosDelDia(hora) {
    const partes = String(hora ?? '').trim().split(':').map(Number);
    if (partes.length !== 3 || partes.some(Number.isNaN)) return null;

    return partes[0] * 3600 + partes[1] * 60 + partes[2];
}


/*  Diferencia entre dos horas del reloj, en segundos: cuánto después ocurrió 'b'.
 *
 *  Se pliega a ±12 h para que el cambio de día no dé un disparate: entre las 23:59:50 y
 *  las 00:00:05 hay 15 segundos, no −23 horas.
 */
export function diferenciaEnSegundos(a, b) {
    const sa = aSegundosDelDia(a);
    const sb = aSegundosDelDia(b);
    if (sa === null || sb === null) return null;

    let d = sb - sa;
    if (d > 43200) d -= 86400;
    if (d < -43200) d += 86400;
    return d;
}
