import Icon from '../Icon.jsx';


/*  MODO IA
 *
 *  Activa o pausa la lectura de tickets. En pausa el espejo sigue en vivo y la captura se puede
 *  enviar; solo se deja de mandar la pantalla al modelo. Se ve pulsado mientras está activo.
 */


/*  @param {boolean}  active    la lectura de tickets está activa
 *  @param {function} onToggle  activarla o pausarla
 */
export default function ModeIAButton({ active, onToggle }) {
    return (
        <button
            type='button'
            className={`vt-icono ${active ? 'vt-icono--activo' : ''}`}
            onClick={onToggle}
            aria-pressed={active}
            aria-label={active ? 'Modo IA activado: pausar la lectura de tickets' : 'Modo IA en pausa: reanudar la lectura de tickets'}
            title={active ? 'Modo IA activado: la IA lee los tickets. Pulsa para pausarla.' : 'Modo IA en pausa: solo espejo. Pulsa para reanudar la lectura.'}
        >
            <Icon name={active ? 'ai' : 'aiPaused'} />
        </button>
    );
}
