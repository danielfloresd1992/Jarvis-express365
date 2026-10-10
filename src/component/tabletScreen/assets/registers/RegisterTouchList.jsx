import { WrapperCell, WrapperText } from '../../../cells/GridCells.jsx';


/*  LOS TOQUES DE GERENTE DE UNA ROTACIÓN, FLOTANDO DEBAJO DE SU FILA
 *
 *  Uno por cada clic en un botón de gerente: quién y a qué hora. Va 'absolute', pegado a la derecha y
 *  justo debajo de la fila: flota encima de las de abajo sin empujarlas. 'z-[5]' lo pone encima de
 *  ellas pero debajo de la cabecera fija (z-10), para que al desplazar pase por detrás de ella.
 *
 *  La hora se corrige como las de los procesos —un clic estampa la de ahora, dos clics abren el campo—
 *  y la ✕ borra el toque. Usa la tarjeta y las líneas de los procesos (registers.css).
 */


// TOUCH_GRID = «la rejilla de un toque»: el gerente, la hora y el botón de borrar
const TOUCH_GRID = { display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr) 28px' };


/*  @param {Array}    touches          los toques de la rotación: [{ id, ref, name, hourTouch }]
 *  @param {number}   widthOfManagers  lo que mide la columna de los gerentes: la tarjeta mide al menos eso
 *  @param {function} onWrite          corrige la hora de un toque (id del toque, hora)
 *  @param {function} onDelete         borra un toque (id del toque)
 */
export default function RegisterTouchList({ touches, widthOfManagers, onWrite, onDelete }) {
    return (
        <div
            className='register-process-card absolute right-0 top-full z-[5]'
            style={{ width: Math.max(widthOfManagers, 240), boxShadow: '0 8px 20px rgb(0 0 0 / 0.14)' }}
        >

            <div style={TOUCH_GRID}>
                {
                    ['Gerente', 'Hora del toque', ''].map(title => (
                        <div key={title} className='min-h-[22px] py-[3px] flex items-center justify-center uppercase text-[10px] font-semibold tracking-[0.5px] text-jx-tinta3 border-b border-b-jx-regla'>
                            {title}
                        </div>
                    ))
                }
            </div>

            {
                touches.map(touch => (
                    <div key={touch.id} className='register-process-line' style={TOUCH_GRID}>
                        <WrapperCell classStyles='cursor-default text-jx-tinta2'>{touch.name}</WrapperCell>

                        <WrapperCell classStyles='text-jx-tinta2'>
                            <WrapperText value={touch.hourTouch} updateValue={hourTouch => onWrite(touch.id, hourTouch)} />
                        </WrapperCell>

                        {/*  El relleno y la letra van en línea: la regla global 'button {}' gana a Tailwind.  */}
                        <WrapperCell>
                            <button
                                type='button'
                                className='text-jx-tinta3 hover:text-red-600'
                                style={{ padding: 0, fontSize: 12, background: 'transparent' }}
                                onClick={() => onDelete(touch.id)}
                                title='Borrar este toque'
                                aria-label='Borrar este toque'
                            >
                                ✕
                            </button>
                        </WrapperCell>
                    </div>
                ))
            }

        </div>
    );
}
