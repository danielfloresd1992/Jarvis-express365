/*  LOS COLORES DE ALARMA DE UN PROCESO
 *
 *  La alarma es de tiempo: ámbar hasta hora y media, roja después; verde, ya listo. La pone el
 *  seguimiento de la tablet (el 'color' de cada pedido) y el porqué de los colores, con los datos que
 *  lo demostraron, está en libs/tickets/cronometro.js.
 *
 *  Los usan la raya de cada línea de proceso (RegisterProcessLine) y la cuenta de la flecha
 *  (ProcessToggle), que con la fila cerrada es lo único que avisa.
 */


// ALARM_COLOR = «cómo se pinta cada color». Los de la paleta: sobre papel una raya pastel no se ve.
export const ALARM_COLOR = {
    amarillo: 'var(--color-jx-ocre)',
    rojo: 'var(--color-jx-critico)',
    verde: 'var(--color-jx-verde-barra)',
};


// worstAlarm = «la peor alarma de unos procesos»: roja si hay alguna, si no ámbar, y si no ninguna.
// La verde no cuenta como alarma: es lo que ya está listo.
export function worstAlarm(colors) {
    if (colors.includes('rojo')) return 'rojo';
    if (colors.includes('amarillo')) return 'amarillo';
    return '';
}
