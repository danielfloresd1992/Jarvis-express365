import { recortar } from '../../formato.js';
import Section from './Section.jsx';


/*  LA SECCIÓN «QUIÉN LEE LA PANTALLA»
 *
 *  Para que no haya duda: este simulador solo PINTA. Leer, lee el servidor de IA de verdad. Debajo, cómo
 *  le fue con la última lectura.
 */


/*  @param {object} reading  { texto, fallo }: lo que devuelve describeLastReading
 */
export default function ReaderSection({ reading }) {
    return (
        <Section title='Quién lee la pantalla'>
            <p className='sim-ayuda'>Este simulador solo PINTA la pantalla de Toast. Leerla, la lee siempre el servidor de IA de verdad, desde la ventana de la tablet: se le manda la pantalla entera, como con la tablet del restaurante. Puede tardar cerca de un minuto por lectura, así que la tabla se llena despacio.</p>

            <p className='sim-dato' role='status'>
                {reading.texto}
                {reading.fallo && <span className='sim-aviso' title={reading.fallo}> · falló: {recortar(reading.fallo, 60)}</span>}
            </p>
        </Section>
    );
}
