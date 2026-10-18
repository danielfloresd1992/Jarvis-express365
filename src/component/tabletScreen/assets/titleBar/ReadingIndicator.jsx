import Icon from '../Icon.jsx';


/*  QUÉ ESTÁ LEYENDO LA IA
 *
 *  La hora de la captura que se le mandó al modelo en la última vuelta: si avanza, la lectura avanza.
 *  Solo desde 560 px: más estrecho se come el nombre del local, y cómo fue la última ya lo dice el
 *  «Registro de la inferencia».
 */


/*  @param {boolean} modeIA       la lectura de tickets está activa
 *  @param {string}  readingTime  la hora de la captura que se mandó al modelo. null = ninguna todavía; '' = la tablet no dio la hora
 *  @param {string}  lastError    qué falló en la última lectura, si falló
 */
export default function ReadingIndicator({ modeIA, readingTime, lastError }) {

    // title = «lo que se lee al pasar el ratón»
    const title = !modeIA ? 'La lectura de tickets está en pausa'
        : lastError ? `La última lectura falló: ${lastError}`
            : 'La hora de la captura de la pantalla que se le mandó a la IA';

    return (
        <span
            className={`hidden min-[560px]:flex shrink-0 items-center gap-2 h-[30px] px-2.5 rounded-[9px] border bg-jx-tarjeta font-mono text-[11px] ${lastError && modeIA ? 'border-jx-ocre text-jx-aviso-texto' : 'border-jx-regla2 text-jx-tinta2'}`}
            title={title}
        >
            <Icon name={modeIA ? 'ai' : 'aiPaused'} size={15} />
            {
                modeIA
                    ? <span className='text-jx-tinta tabular-nums'>{readingTime === null ? '–' : readingTime || 'sin hora'}</span>
                    : <span>IA en pausa</span>
            }
        </span>
    );
}
