/*  LOS BOTONES DE UNA FILA DE LA TABLA 1: disparar, marcar lista y despachar
 *
 *  Están en el registro y no solo en la pantalla porque en la pantalla hay que DAR con la tarjeta —que
 *  puede estar en otra página— y acertarle a un producto; aquí cada ticket tiene su fila, con su número
 *  delante. Solo los tiene una tarjeta que todavía le debe algo a la cocina.
 */


// NOT_DISPATCHED = «los estados de una tarjeta sin despachar»: son las únicas con botones
const NOT_DISPATCHED = ['pausa', 'fuego', 'lista'];

// ACTIONS_HELP = «qué hace cada botón», dicho como se diría delante de la tablet de Toast
const ACTIONS_HELP = {
    disparar: 'Dispara este curso retenido: en Toast es tocar la tarjeta que está en HOLD / EN PAUSA. Pasa a prepararse y empieza a correr su FIRE / COCINAR.',
    lista: 'Pone todas las palomitas de golpe, como si en Toast se tocaran uno a uno todos sus productos: la tarjeta cambia de color y aquí se cierra su tiempo de preparación. NO la despacha.',
    yaLista: 'Ya tiene todas las palomitas. Falta despacharla.',
    despachar: 'La despacha, como el expedidor al tocar la cabecera de la tarjeta en Toast: queda en verde con doble palomita, o desaparece si «recently fulfilled» está oculto.',
};


/*  @param {object} truth    la verdad de la fila (su tarjeta en el motor)
 *  @param {object} actions  { disparar, lista, despachar }: reciben el id de la tarjeta
 */
export default function RowActions({ truth, actions }) {
    if (!NOT_DISPATCHED.includes(truth.estado)) return null;

    // of = «de qué ticket se habla», para el lector de pantalla
    const of = `el ticket #${truth.ticket}${truth.curso ? ` (${truth.curso.toLowerCase()})` : ''}`;
    const alreadyReady = truth.estado === 'lista';

    return (
        <span className='sim-acciones__botones'>
            {truth.estado === 'pausa' && <button type='button' className='sim-boton sim-boton--mini' onClick={() => actions.disparar(truth.id)} title={ACTIONS_HELP.disparar} aria-label={`Disparar ${of}`}>Disparar</button>}
            <button type='button' className='sim-boton sim-boton--mini sim-boton--listo' onClick={() => actions.lista(truth.id)} disabled={alreadyReady} title={alreadyReady ? ACTIONS_HELP.yaLista : ACTIONS_HELP.lista} aria-label={`Marcar listo ${of}`}>Listo</button>
            <button type='button' className='sim-boton sim-boton--mini' onClick={() => actions.despachar(truth.id)} title={ACTIONS_HELP.despachar} aria-label={`Despachar ${of}`}>Despachar</button>
        </span>
    );
}
