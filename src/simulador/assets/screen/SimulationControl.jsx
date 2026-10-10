import { esNumero, plural, enUnRato } from '../../formato.js';


/*  EL MANDO: EMPEZAR A RECIBIR TICKETS, Y DEJAR DE RECIBIRLOS
 *
 *  Va encima de la pantalla y no en el panel porque es lo primero que hay que hacer y lo único
 *  imprescindible: el simulador amanece EN BLANCO y no entra un ticket hasta que se pulsa «Empezar».
 *
 *  El orden importa, y por eso el texto lo cuenta: primero se conecta la ventana de la tablet, que lee
 *  la pantalla vacía; después se empieza. Así no hay ningún ticket que «ya estuviera» cuando ella
 *  llegó, y los sigue todos desde su primer segundo.
 */


// describeState = «qué decir»: el estado en negrita y, debajo, el detalle. PURA.
function describeState({ started, receiving, shift, tabletAlive, inference }) {

    //  Lo que dice la ventana de la tablet de su primer recorrido, si ya dijo algo.
    const reading = inference?.lectura ?? null;
    const noting = Boolean(inference?.censando);

    if (!started) {
        return {
            state: 'La pantalla está en blanco, esperando a que empieces',
            detail: !tabletAlive ? 'Conecta antes la ventana de la tablet (su botón «Simular»): así lee la pantalla vacía y sigue todos los tickets desde que entran.'
                : reading?.error ? 'La ventana de la tablet está conectada, pero su última lectura falló: mira el motivo arriba. Puedes empezar igualmente.'
                    : !reading ? 'La ventana de la tablet ya está conectada y leyendo la pantalla vacía. Puedes empezar cuando quieras.'
                        : noting ? 'La ventana de la tablet ya está leyendo la pantalla vacía. Puedes empezar cuando quieras.'
                            : 'La ventana de la tablet ya leyó la pantalla vacía entera: todo lo que entre ahora lo sigue desde su primer segundo.',
        };
    }

    if (receiving && shift.rotacionesIniciadas === 0 && !shift.terminado) {
        //  Recién pulsado «Empezar»: la pantalla arranca A CERO y el primer ticket entra en un momento
        //  al azar del primer minuto. Se dice, para que no parezca que no pasa nada.
        return {
            state: 'Turno en marcha: la pantalla empieza a cero',
            detail: `El primer ticket entra en menos de un minuto${esNumero(shift.proximaRotacionEnS) ? ` (en ${enUnRato(shift.proximaRotacionEnS)})` : ''}. Después irán llegando al azar, según el turno del panel.`,
        };
    }

    if (receiving) {
        return {
            state: shift.terminado ? 'El turno terminó' : 'Entrando tickets',
            detail: `Mesa ${shift.rotacionesIniciadas} de ${shift.rotacionesDelTurno} · ${plural(shift.activasEnPantalla, 'ticket sin despachar', 'tickets sin despachar')}${esNumero(shift.proximaRotacionEnS) ? ` · próxima mesa en ${enUnRato(shift.proximaRotacionEnS)}` : ''}.`,
        };
    }

    return {
        state: 'Ya no entran tickets nuevos',
        detail: shift.activasEnPantalla > 0
            ? `Lo que está en cocina sigue hasta despacharse: ${plural(shift.activasEnPantalla, 'queda', 'quedan')}.`
            : 'La cocina está vacía.',
    };
}


/*  @param {boolean}  started          ya se empezó (o la pantalla ya tiene tarjetas)
 *  @param {boolean}  receiving        están entrando tickets
 *  @param {object}   shift            el turno (readShift)
 *  @param {boolean}  tabletAlive      la ventana de la tablet está conectada
 *  @param {object}   inference        lo último que infirió la ventana de la tablet, o null
 *  @param {function} onStart          empezar (o seguir) a recibir tickets
 *  @param {function} onStopReceiving  dejar de recibirlos
 */
export default function SimulationControl({ started, receiving, shift, tabletAlive, inference, onStart, onStopReceiving }) {

    const { state, detail } = describeState({ started, receiving, shift, tabletAlive, inference });

    return (
        <div className={`sim-mando ${receiving ? 'sim-mando--entrando' : ''}`}>
            <div className='sim-mando__texto' role='status'>
                <b>{state}</b>
                <span>{detail}</span>
            </div>

            <div className='sim-mando__botones'>
                <button
                    type='button'
                    className='sim-boton sim-boton--empezar'
                    onClick={onStart}
                    disabled={receiving}
                    title={started ? 'Vuelven a entrar mesas y pedidos para llevar' : 'El turno empieza a contar desde ahora, con la pantalla a cero: el primer ticket entra en menos de un minuto y los demás van llegando al azar'}
                >
                    ▶ {started ? (receiving ? 'Recibiendo tickets' : 'Seguir recibiendo tickets') : 'Empezar a recibir tickets'}
                </button>

                <button
                    type='button'
                    className='sim-boton sim-boton--parar'
                    onClick={onStopReceiving}
                    disabled={!receiving}
                    title='No entra ningún ticket más. Los que ya están en pantalla siguen cocinándose y se despachan.'
                >
                    ■ Dejar de recibir tickets nuevos
                </button>
            </div>
        </div>
    );
}
