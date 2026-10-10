import { TEMAS } from '../../pintura/temas.js';
import { minSeg } from '../../formato.js';
import Section from './Section.jsx';
import Slider from './Slider.jsx';
import Toggle from './Toggle.jsx';


/*  LA SECCIÓN «PANTALLA DE TOAST»
 *
 *  Cómo se ve la pantalla: en cuál de sus páginas se está, la apariencia, el idioma, el tamaño de la
 *  tablet, el nombre de la estación, lo despachado, la vista «All day», los colores de la cabecera y el
 *  reloj adelantado. Nace plegada: se ajusta una vez y se olvida.
 *
 *  El título avisa de que hay más pantallas aunque la sección esté plegada: con la barra oscura, que no
 *  lleva contador de tickets, es el único sitio donde se ve.
 */


/*  @param {object}   settings  los ajustes de ahora
 *  @param {function} change    cambia uno o varios ajustes
 *  @param {object}   page      qué pantalla se enseña: { pagina, paginas } (useScreen)
 *  @param {function} turnPage  pasar adelante (1) o atrás (-1)
 */
export default function ScreenSection({ settings, change, page, turnPage }) {

    const severalPages = page.paginas > 1;

    return (
        <Section title={`Pantalla de Toast${severalPages ? ` · ${page.pagina + 1} de ${page.paginas}` : ''}`} open={false}>
            <div className='sim-fila sim-paginas' title='Lo mismo que «|←» y «→|», las flechas del contador de tickets de la pantalla de Toast. Las tarjetas que no caben en una pantalla quedan en la siguiente, las más antiguas delante.'>
                <span className='sim-paginas__cual' role='status'>Pantalla <b>{page.pagina + 1}</b> de <b>{page.paginas}</b></span>
                <button type='button' className='sim-boton sim-boton--chico' onClick={() => turnPage(-1)} disabled={page.pagina <= 0} aria-label='Pantalla anterior'>◀</button>
                <button type='button' className='sim-boton sim-boton--chico' onClick={() => turnPage(1)} disabled={page.pagina >= page.paginas - 1} aria-label='Pantalla siguiente'>▶</button>
            </div>
            {severalPages && <p className='sim-pista'>La ventana de la tablet solo lee la pantalla que está a la vista: lo que hay en las otras no existe para ella hasta que se pasa. Y ojo al pasar: las tarjetas que venía siguiendo dejan de verse, y para ella una tarjeta que desaparece es una que quedó lista.</p>}

            <div className='sim-fila'>
                <label htmlFor='sim-tema'>Apariencia</label>
                <select id='sim-tema' value={settings.tema} onChange={event => change({ tema: event.target.value })}>
                    {Object.values(TEMAS).map(theme => <option key={theme.id} value={theme.id}>{theme.nombre}</option>)}
                </select>
            </div>

            {settings.tema === 'clara' && (
                <div className='sim-fila'>
                    <label htmlFor='sim-idioma'>Textos</label>
                    <select id='sim-idioma' value={settings.idioma} onChange={event => change({ idioma: event.target.value })}>
                        <option value='es'>COCINAR · EN PAUSA · CONTINÚA</option>
                        <option value='en'>FIRE · HOLD · Continued</option>
                    </select>
                </div>
            )}

            <div className='sim-fila'>
                <label htmlFor='sim-alto'>Tablet</label>
                <select id='sim-alto' value={`${settings.alto}x${settings.escala}`} onChange={event => { const [alto, escala] = event.target.value.split('x').map(Number); change({ alto, escala }); }}>
                    <option value='768x1'>1024 × 768</option>
                    <option value='600x1'>1024 × 600 (Bar - Doral)</option>
                    <option value='768x2'>2048 × 1536 (doble densidad)</option>
                </select>
            </div>

            <div className='sim-fila'>
                <label htmlFor='sim-estacion'>Nombre de la estación</label>
                <input id='sim-estacion' type='text' value={settings.estacion} placeholder={TEMAS[settings.tema]?.estacion} onChange={event => change({ estacion: event.target.value })} />
            </div>

            <Toggle label='«Recently fulfilled» a la vista' value={settings.recientesVisibles} onChange={visible => change({ recientesVisibles: visible })} help='Con él, lo despachado se queda en verde unos minutos. Sin él, desaparece en el acto.' />
            <Slider label='Lo despachado se queda' value={settings.minutosRecientes} min={1} max={15} onChange={minutes => change({ minutosRecientes: minutes })} format={minutes => `${minutes} min`} />
            <Toggle label='Vista «All day» abierta' value={settings.vistaTotal} onChange={open => change({ vistaTotal: open })} help='Ocupa una columna a la izquierda y corre las tarjetas.' />

            <Slider label='Cabecera amarilla a los' value={settings.amarilloS} min={0} max={3600} step={30} onChange={seconds => change({ amarilloS: seconds })} format={minSeg} help='Los «Warning Colors» de Toast: la cabecera cambia de color por la EDAD del ticket, no por su estado.' />
            <Slider label='Cabecera roja a los' value={settings.rojoS} min={0} max={7200} step={60} onChange={seconds => change({ rojoS: seconds })} format={minSeg} />
            <Slider label='Reloj adelantado' value={settings.desfaseRelojMin} min={-180} max={180} step={15} onChange={minutes => change({ desfaseRelojMin: minutes })} format={minutes => `${minutes > 0 ? '+' : ''}${minutes} min`} help='La tablet y el equipo no marcan la misma hora. Las horas inferidas tienen que salir en el reloj de la TABLET.' />
        </Section>
    );
}
