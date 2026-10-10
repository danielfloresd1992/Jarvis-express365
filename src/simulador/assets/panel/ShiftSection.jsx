import { TIPOS_DE_ORDEN } from '../../motor/carta.js';
import { conComa, porCiento } from '../../formato.js';
import Section from './Section.jsx';
import Slider from './Slider.jsx';
import Toggle from './Toggle.jsx';
import ShiftStatus from './ShiftStatus.jsx';


/*  LA SECCIÓN «TURNO»
 *
 *  Cómo va el turno, pausarlo o reiniciarlo, cuántas mesas entran y cómo, y unos botones para meter
 *  una mesa o un pedido para llevar AHORA, sin esperar a que toque.
 */


/*  @param {object}   settings         los ajustes de ahora
 *  @param {function} change           cambia uno o varios ajustes
 *  @param {object}   shift            el turno (readShift)
 *  @param {boolean}  started          ya se empezó
 *  @param {function} onStart          empezar (o seguir) a recibir tickets
 *  @param {function} onStopReceiving  dejar de recibirlos
 *  @param {function} onRestartShift   poner el turno a cero desde ahora
 *  @param {boolean}  canRestartShift  el motor cargado sabe reiniciar el turno
 *  @param {function} onCreateOrder    recibe el tipo de pedido: 'mesa', 'takeout', 'uber', 'doordash' u 'online'
 */
export default function ShiftSection({ settings, change, shift, started, onStart, onStopReceiving, onRestartShift, canRestartShift, onCreateOrder }) {

    const receiving = settings.turnoEnMarcha;

    return (
        <Section title='Turno'>
            <ShiftStatus shift={shift} receiving={receiving} started={started} speed={settings.velocidad} />

            <div className='sim-botones sim-botones--turno'>
                <button type='button' className={`sim-boton sim-boton--chico ${receiving ? '' : 'sim-boton--principal'}`} onClick={receiving ? onStopReceiving : onStart} title={receiving ? 'Dejan de entrar mesas y pedidos para llevar. Lo que ya está en cocina sigue su curso.' : 'Lo mismo que «Empezar a recibir tickets», encima de la pantalla'}>
                    {receiving ? '⏸ Pausar' : started ? '▶ Seguir' : '▶ Empezar'}
                </button>
                <button type='button' className='sim-boton sim-boton--chico' onClick={onRestartShift} disabled={!canRestartShift} title='Pone la cuenta de mesas a cero y empieza el turno ahora. No borra el registro ni lo que hay en pantalla.'>↺ Reiniciar turno</button>
            </div>

            <Slider label='Rotaciones del turno' value={settings.rotacionesDelTurno} min={5} max={200} step={5} onChange={rotations => change({ rotacionesDelTurno: rotations })} format={rotations => `${rotations} mesas`} help='Cuántas veces se ocupa una mesa a lo largo del turno. Se puede cambiar a mitad: se reparte lo que quede.' />
            <Slider label='Duración del turno' value={settings.duracionDelTurnoH} min={1} max={12} step={0.5} onChange={hours => change({ duracionDelTurnoH: hours })} format={hours => `${conComa(hours)} h`} />
            <Slider label='Tickets por mesa' value={settings.ticketsPorRotacion} min={1} max={5} step={0.5} onChange={tickets => change({ ticketsPorRotacion: tickets })} format={conComa} hint='3 = entrada, plato fuerte y postre' help='La media de tickets que manda cada mesa. Con 2,5, la mitad de las mesas mandan 2 y la otra mitad 3. De 4 en adelante se suman envíos sueltos de acompañantes.' />
            <Slider label='Tickets en pantalla, como mínimo' value={settings.minimoEnPantalla} min={0} max={12} onChange={minimum => change({ minimoEnPantalla: minimum })} help='Tarjetas sin despachar que se procura tener. Si hay menos, la mesa que toca se ADELANTA y entra en algún momento del próximo minuto — de una en una, nunca de golpe (y gasta una rotación del turno).' />
            <Slider label='Mandan todo junto (HOLD)' value={settings.probTodoJunto} min={0} max={1} step={0.05} onChange={share => change({ probTodoJunto: share })} format={porCiento} help='Mesas que mandan todos sus cursos de golpe: el primero sale en fuego y los demás esperan en HOLD. Las demás piden curso a curso, y cada uno entra como un ticket nuevo.' />
            <Toggle label='Hora pico' value={settings.horaPico} onChange={enabled => change({ horaPico: enabled })} help='Las llegadas se aprietan hacia la mitad del turno, como en un servicio de verdad. Sin ella entran repartidas por igual.' />
            <Slider label='Para llevar: uno cada' value={Math.round(settings.paraLlevarCadaS / 60)} min={0} max={30} onChange={minutes => change({ paraLlevarCadaS: minutes * 60 })} format={minutes => (minutes === 0 ? 'nunca' : `${minutes} min`)} help='Take Out, UberEats, DoorDash y pedidos online. No ocupan mesa: no cuentan como rotación.' />

            <div className='sim-botones' style={{ marginTop: 6 }}>
                <button type='button' className='sim-boton sim-boton--chico' onClick={() => onCreateOrder('mesa')} title='Ocupa una mesa ahora. No gasta ninguna rotación del turno.'>+ Mesa</button>
                <button type='button' className='sim-boton sim-boton--chico' onClick={() => onCreateOrder('takeout')}>+ Take Out</button>
                <button type='button' className='sim-boton sim-boton--chico' onClick={() => onCreateOrder('uber')}>+ Uber</button>
                {TIPOS_DE_ORDEN?.doordash && <button type='button' className='sim-boton sim-boton--chico' onClick={() => onCreateOrder('doordash')}>+ DoorDash</button>}
                <button type='button' className='sim-boton sim-boton--chico' onClick={() => onCreateOrder('online')}>+ Online</button>
            </div>
        </Section>
    );
}
