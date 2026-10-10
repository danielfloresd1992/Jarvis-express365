import { porCiento } from '../../formato.js';
import Section from './Section.jsx';
import Slider from './Slider.jsx';


/*  LA SECCIÓN «TIEMPOS MÁXIMOS Y DEMORAS»
 *
 *  El tiempo máximo de preparación de cada tipo de plato, y cuántos tickets se pasan de él y por cuánto.
 */


/*  @param {object}   settings  los ajustes de ahora
 *  @param {function} change    cambia uno o varios ajustes
 */
export default function TimesSection({ settings, change }) {
    return (
        <Section title='Tiempos máximos y demoras'>
            <p className='sim-ayuda'>Una demora es un ticket que tarda en prepararse —desde que se dispara hasta que tiene todas sus palomitas— más que el máximo de su tipo. Los cambios valen para los tickets que se disparen desde ahora.</p>
            <Slider label='Entrada, máximo' value={settings.limiteEntradaMin} min={1} max={20} onChange={minutes => change({ limiteEntradaMin: minutes })} format={minutes => `${minutes} min`} />
            <Slider label='Plato fuerte, máximo' value={settings.limiteFuerteMin} min={5} max={40} onChange={minutes => change({ limiteFuerteMin: minutes })} format={minutes => `${minutes} min`} help='Es también el máximo de lo que no tiene curso: pedidos para llevar y envíos sueltos.' />
            <Slider label='Postre, máximo' value={settings.limitePostreMin} min={1} max={15} onChange={minutes => change({ limitePostreMin: minutes })} format={minutes => `${minutes} min`} />
            <Slider label='Tickets que se demoran' value={settings.probDemora} min={0} max={1} step={0.05} onChange={share => change({ probDemora: share })} format={porCiento} help='Con qué frecuencia un ticket supera su tiempo máximo.' />
            <Slider label='Se pasan hasta' value={settings.excesoMaxDemoraMin} min={1} max={15} onChange={minutes => change({ excesoMaxDemoraMin: minutes })} format={minutes => `${minutes} min`} help='Cuánto se pasa de su máximo, como mucho, un ticket que se demora.' />
        </Section>
    );
}
