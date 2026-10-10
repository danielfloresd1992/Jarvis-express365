import Icon from '../Icon.jsx';


/*  SIMULAR
 *
 *  Abre (o encuentra) el simulador de Toast y se conecta a él en vez de al USB. Solo se pinta sin
 *  tablet conectada.
 */


/*  @param {boolean}  disabled    se está conectando ahora mismo
 *  @param {function} onSimulate  conectar con la tablet de mentira
 */
export default function SimulateButton({ disabled, onSimulate }) {
    return (
        <button
            type='button'
            className='vt-icono'
            onClick={onSimulate}
            disabled={disabled}
            aria-label='Simular una tablet de Toast'
            title='Simular: conecta con una tablet de Toast de mentira, para probar sin USB'
        >
            <Icon name='simulate' />
        </button>
    );
}
