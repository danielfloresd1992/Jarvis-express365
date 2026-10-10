import Icon from '../Icon.jsx';


/*  ENVIAR LA CAPTURA A LA BANDEJA DE JARVIS
 *
 *  Solo se pinta con la tablet conectada: sin conexión no hay nada que mandar, y un botón que solo
 *  sabe dar error es peor que no tenerlo. Mientras sube, el ícono gira; al terminar bien, se vuelve
 *  una palomita verde hasta que se va el aviso.
 */


/*  @param {boolean}  sending  hay un envío en curso: el botón se bloquea
 *  @param {boolean}  sent     el último envío salió bien
 *  @param {function} onSend   enviar la captura que se está viendo
 */
export default function SendCaptureButton({ sending, sent, onSend }) {
    return (
        <button
            type='button'
            className={`vt-icono ${sent ? 'vt-icono--ok' : ''}`}
            onClick={onSend}
            disabled={sending}
            aria-label='Enviar esta captura a la bandeja de Jarvis'
            title='Enviar esta captura a la bandeja de Jarvis'
        >
            {
                sending ? <Icon name='spinning' />
                    : sent ? <Icon name='done' />
                        : <Icon name='capture' />
            }
        </button>
    );
}
