import { memo } from 'react';
import { ESCENAS } from '../../motor/escenas.js';
import Section from './Section.jsx';


/*  LA SECCIÓN «ESCENAS: CAPTURAS REALES RECREADAS»
 *
 *  Un botón por escena (motor/escenas.js). Cada una deja la pantalla exactamente como una captura de la
 *  tablet del restaurante, con la simulación parada. Nace plegada.
 */


/*  @param {function} onLoadScene  recibe el id de la escena pulsada
 */
function ScenesSection({ onLoadScene }) {
    return (
        <Section title='Escenas: capturas reales recreadas' open={false}>
            <p className='sim-ayuda'>Dejan la pantalla exactamente como una captura de la tablet del restaurante, con la simulación parada: ni entran mesas ni la cocina marca nada. La respuesta correcta se conoce de antemano. Para seguir desde ahí, «Que cocine sola» y «Seguir recibiendo tickets», encima de la pantalla.</p>
            <div className='sim-botones'>
                {Object.entries(ESCENAS).map(([id, scene]) => (
                    <button key={id} type='button' className='sim-boton sim-boton--chico' onClick={() => onLoadScene(id)} title={scene.nombre}>{scene.nombre}</button>
                ))}
            </div>
        </Section>
    );
}


//  'memo': las escenas no cambian nunca; sin él se repintarían con cada movimiento de un deslizador.
export default memo(ScenesSection);
