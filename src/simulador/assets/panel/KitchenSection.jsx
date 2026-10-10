import { conComa } from '../../formato.js';
import Section from './Section.jsx';
import Slider from './Slider.jsx';
import Toggle from './Toggle.jsx';


/*  LA SECCIÓN «COCINA»
 *
 *  Si la cocina va sola o a mano, cuánto tarda una mesa entre curso y curso, a qué velocidad corre el
 *  reloj, y dos botones para despachar todo o vaciar la pantalla de golpe.
 */


// SPEED_HELP = «la ayuda de la velocidad del reloj»
const SPEED_HELP = 'Acelera TODO, el reloj de la tablet incluido. Un turno de 8 h a ×20 dura 24 min. La ventana de la tablet lee la pantalla una y otra vez, al ritmo que conteste la IA, así que a más velocidad, más margen de error en “Listo en tablet”. Con la IA de verdad déjalo en ×1.';


/*  @param {object}   settings       los ajustes de ahora
 *  @param {function} change         cambia uno o varios ajustes
 *  @param {function} onDispatchAll  despachar todo lo que está en el fuego o listo
 *  @param {function} onEmptyScreen  vaciar la pantalla
 */
export default function KitchenSection({ settings, change, onDispatchAll, onEmptyScreen }) {

    //  «Entre curso y curso» es UN número en el panel y un intervalo en el motor: lo que tarda una mesa
    //  en comerse un plato no es fijo, va de algo menos a algo más.
    const [pauseMin, pauseMax] = Array.isArray(settings.pausaEntreCursosS) ? settings.pausaEntreCursosS : [180, 480];
    const betweenCoursesMin = Math.min(20, Math.max(1, Math.round((pauseMin + pauseMax) / 2 / 60 * 2) / 2));

    // realShiftMinutes = «cuánto dura el turno en minutos de los de verdad», a esta velocidad
    const realShiftMinutes = Math.round(settings.duracionDelTurnoH * 60 / Math.max(1, settings.velocidad));

    return (
        <Section title='Cocina'>
            <p className='sim-ayuda'>En manual nada avanza solo: toca un producto para ponerle la palomita, la cabecera para despachar la tarjeta, o un HOLD para dispararlo.</p>
            <Toggle label='Cocina sola' value={settings.autoCocina} onChange={enabled => change({ autoCocina: enabled })} help='Las palomitas van saliendo solas y el expedidor despacha lo que queda listo.' />
            <Slider label='Entre curso y curso' value={betweenCoursesMin} min={1} max={20} step={0.5} onChange={minutes => change({ pausaEntreCursosS: [Math.round(minutes * 60 * 0.6), Math.round(minutes * 60 * 1.4)] })} format={minutes => `${conComa(minutes)} min`} help='Lo que una mesa tarda en comerse un curso y pedir (o soltar) el siguiente. Varía de mesa a mesa, entre un 60 % y un 140 % de este valor.' />
            <Slider label='Velocidad del reloj' value={settings.velocidad} min={1} max={30} onChange={speed => change({ velocidad: speed })} format={speed => `×${speed}`} help={SPEED_HELP} hint={settings.velocidad > 1 ? `A ×${settings.velocidad} este turno de ${conComa(settings.duracionDelTurnoH)} h dura ${realShiftMinutes} min de los de verdad. La ventana de la tablet lee al ritmo que conteste la IA, así que «Listo en tablet» sale con más margen de error. Con la IA de verdad déjalo en ×1.` : undefined} />

            <div className='sim-botones' style={{ marginTop: 6 }}>
                <button type='button' className='sim-boton sim-boton--chico' onClick={onDispatchAll} title='Despacha de golpe todo lo que está en el fuego o listo. Los tickets que preparas tú («Lo preparo yo») no se tocan: esos se despachan desde su fila del registro.'>Despachar todo</button>
                <button type='button' className='sim-boton sim-boton--chico sim-boton--peligro' onClick={onEmptyScreen}>Vaciar pantalla</button>
            </div>
        </Section>
    );
}
