import Icon from '../Icon.jsx';


/*  CONECTAR O DESCONECTAR: el mismo sitio, según cómo esté la tablet.
 */


/*  @param {boolean}  connected     la tablet está conectada
 *  @param {boolean}  connecting    se está conectando ahora mismo
 *  @param {function} onConnect     conectar la tablet por USB
 *  @param {function} onDisconnect  desconectarla
 */
export default function ConnectButton({ connected, connecting, onConnect, onDisconnect }) {

    if (connected) return (
        <button
            type='button'
            className='vt-icono vt-icono--peligro'
            onClick={onDisconnect}
            aria-label='Desconectar la tablet'
            title='Desconectar la tablet'
        >
            <Icon name='disconnect' />
        </button>
    );

    return (
        <button
            type='button'
            className='vt-icono vt-icono--principal'
            onClick={onConnect}
            disabled={connecting}
            aria-label={connecting ? 'Conectando con la tablet' : 'Conectar la tablet por USB'}
            title={connecting ? 'Conectando… acepta el aviso en la tablet' : 'Conectar la tablet por USB'}
        >
            <Icon name={connecting ? 'spinning' : 'connect'} />
        </button>
    );
}
