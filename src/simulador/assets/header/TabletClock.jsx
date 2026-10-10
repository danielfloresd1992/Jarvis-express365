/*  EL RELOJ DE LA TABLET SIMULADA
 *
 *  No es el del equipo: corre a la velocidad elegida y puede ir adelantado (ver «Reloj adelantado» en
 *  el panel). Las horas que infiere la ventana de la tablet tienen que salir en ESTE reloj.
 */


/*  @param {string} time  la hora, 'HH:MM:SS'
 */
export default function TabletClock({ time }) {
    return <span className='sim-reloj' title='El reloj de la tablet simulada'>{time}</span>;
}
