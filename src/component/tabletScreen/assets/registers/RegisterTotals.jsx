import { useMemo } from 'react';
import { rotationTotals, rotationsInUse } from '../../../../libs/tickets/rotationTotals.js';
import { touchCounts } from './managers.js';


/*  LOS TOTALES DEL DÍA, EN LA BARRA DEL REGISTRO — la propuesta «B · Medidores», elegida por el usuario
 *
 *  En el sitio donde estaba cómo iba la lectura de la IA (eso ya se ve en el «Registro de la inferencia»).
 *  Dos medidores, sumando las dos pestañas:
 *
 *      rotaciones   la cifra grande y, debajo, una barra con lo guardado (verde) frente a lo que sigue en
 *                   Mesas sin guardar (ocre): se ve de un vistazo cuánto falta guardar
 *      toques       la cifra grande y una barra con lo que aporta cada gerente, con su leyenda
 *
 *  Las cuentas salen de libs/tickets/rotationTotals.js —la misma que usa la pestaña Registros— y de
 *  touchCounts (managers.js), la que cuenta la burbuja de cada tecla de gerente. Así nunca discrepan. Una
 *  rotación que se guarda sale de Mesas y entra en Registros: no se cuenta dos veces. Sin los pedidos para
 *  llevar, que no son rotación.
 *
 *  Mientras Registros no ha llegado de la API —o si falló— se suman solo las de Mesas: la barra de las
 *  rotaciones va a trazos y lo dice.
 *
 *  Los tramos de cada barra crecen con 'flex' según su cifra, así que nunca se salen aunque haya muchos.
 *  El aspecto va en las clases 'register-totals…' y 'register-meter…' de registers.css.
 */


// MANAGER_SHADES / ASSISTANT_SHADES = «los colores de los tramos de cada gerente»: verdes los gerentes y ocres
// los asistentes, como sus teclas, del más oscuro al más claro para que se distingan también por la luz (no
// solo por el tono). Si hay más gerentes que tonos, se repiten.
const MANAGER_SHADES = [
    'var(--color-jx-verde-texto)',
    'color-mix(in srgb, var(--color-jx-verde-texto) 55%, #ffffff)',
    'color-mix(in srgb, var(--color-jx-verde-texto) 30%, #ffffff)',
];
const ASSISTANT_SHADES = [
    'var(--color-jx-ocre)',
    'var(--color-jx-tabaco)',
    'color-mix(in srgb, var(--color-jx-ocre) 55%, #ffffff)',
];

// OTHERS_SHADE = «el color de los toques cuyo gerente ya no tiene botón»
const OTHERS_SHADE = 'var(--color-jx-tinta4)';


/*  Meter = «un medidor»: la cifra grande, lo que es, y la barra con su leyenda
 *
 *  @param {number} value     la cifra
 *  @param {string} label     lo que es: 'rotaciones', 'toques de gerente'
 *  @param {Array}  parts     los tramos: [{ key, count, color, legend }] (legend: lo que se lee en la leyenda)
 *  @param {string} waiting   opcional. La barra no se puede pintar todavía: va a trazos, con este texto debajo
 *  @param {string} title     lo que se lee al pasar el ratón
 *  @param {node}   icon      opcional. Un icono delante de la cifra
 */
function Meter({ value, label, parts, waiting, title, icon }) {
    // shown = «los tramos que tienen algo»
    const shown = parts.filter(part => part.count > 0);

    return (
        <div className='register-meter' title={title}>
            {icon}
            <strong className='register-meter__value'>{value}</strong>
            <div className='register-meter__body'>
                <span className='register-meter__label'>{label}</span>
                {
                    waiting || shown.length === 0
                        ? <span className={`register-meter__track ${waiting ? 'register-meter__track--waiting' : ''}`} aria-hidden='true' />
                        : (
                            <span className='register-meter__track' aria-hidden='true'>
                                {shown.map(part => <span key={part.key} className='register-meter__part' style={{ flex: part.count, background: part.color }} />)}
                            </span>
                        )
                }
                <span className='register-meter__legend'>
                    {
                        waiting
                            ? waiting
                            : shown.map(part => (
                                <span key={part.key} className='register-meter__legend-item'>
                                    <span className='register-meter__swatch' style={{ background: part.color }} aria-hidden='true' />
                                    {part.legend}
                                </span>
                            ))
                    }
                </span>
            </div>
        </div>
    );
}


/*  @param {Array}  records    las filas de Mesas (session.store.records)
 *  @param {object} saved      las rotaciones guardadas (useSavedRotations): { status, documents }
 *  @param {Array}  managers   los botones de los gerentes del local (managers.js)
 */
export default function RegisterTotals({ records, saved, managers }) {

    // inUse = «las rotaciones de Mesas que ya son una mesa»
    const inUse = useMemo(() => rotationsInUse(records), [records]);

    // fromSaved / fromTables = «los totales de Registros» y «los de Mesas»
    const fromSaved = useMemo(() => rotationTotals(saved.documents), [saved.documents]);
    const fromTables = useMemo(() => rotationTotals(inUse), [inUse]);

    // touchParts = «los tramos de los toques»: uno por gerente con toques, en el orden de sus botones, con su
    // color; y al final los de gerentes que ya no tienen botón, si hay
    const touchParts = useMemo(() => {
        const touches = [...saved.documents, ...inUse].flatMap(rotation => rotation.touch ?? []);
        const counts = touchCounts(touches, managers);

        let managerIndex = 0;
        let assistantIndex = 0;
        const parts = managers.map((manager, index) => {
            const assistant = manager.label.startsWith('A');
            const color = assistant
                ? ASSISTANT_SHADES[assistantIndex++ % ASSISTANT_SHADES.length]
                : MANAGER_SHADES[managerIndex++ % MANAGER_SHADES.length];
            return { key: manager.id, count: counts[index], color, legend: <>{manager.label} <b>{counts[index]}</b></> };
        });

        const others = touches.length - counts.reduce((sum, count) => sum + count, 0);
        if (others > 0) parts.push({ key: 'otros', count: others, color: OTHERS_SHADE, legend: <>otros <b>{others}</b></> });
        return parts;
    }, [saved.documents, inUse, managers]);

    // savedReady = «se sabe lo que hay en Registros»: ya llegó de la API, o se está volviendo a pedir con la lista
    // de antes todavía a la vista (cada vez que se abre la pestaña; así la barra no parpadea). Si no, solo Mesas.
    const savedReady = saved.status === 'ready' || saved.documents.length > 0;

    const rotations = fromSaved.rotations + fromTables.rotations;
    const touches = fromSaved.touches + fromTables.touches;

    // waiting = «por qué la barra de las rotaciones todavía no se puede pintar», o '' si se puede
    const waiting = savedReady ? ''
        : saved.status === 'error' ? 'solo Mesas · no se pudo traer Registros'
        : 'solo Mesas · trayendo Registros…';

    return (
        <div className='register-totals ml-auto' aria-label='Totales del día'>

            <Meter
                value={rotations}
                label={rotations === 1 ? 'rotación' : 'rotaciones'}
                waiting={waiting}
                title={savedReady ? `${fromSaved.rotations} guardadas en Registros y ${fromTables.rotations} en Mesas, sin guardar` : waiting}
                parts={[
                    { key: 'guardadas', count: fromSaved.rotations, color: 'var(--color-jx-verde-barra)', legend: `${fromSaved.rotations} ${fromSaved.rotations === 1 ? 'guardada' : 'guardadas'}` },
                    { key: 'mesas', count: fromTables.rotations, color: 'var(--color-jx-ocre)', legend: `${fromTables.rotations} en mesas` },
                ]}
            />

            <span aria-hidden='true' className='register-totals__divider' />

            <Meter
                value={touches}
                label={touches === 1 ? 'toque de gerente' : 'toques de gerente'}
                title={savedReady ? 'Toques de gerente del día, en Registros y en Mesas' : 'Toques de gerente de Mesas: los de Registros todavía no han llegado'}
                parts={touchParts}
                icon={
                    <svg className='register-meter__icon' width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                        <path d='M9 11V5.5a1.5 1.5 0 0 1 3 0V11' />
                        <path d='M12 10.5V9a1.5 1.5 0 0 1 3 0v2' />
                        <path d='M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.8-2.4L4 15.5a1.6 1.6 0 0 1 2.4-2.1L9 15' />
                    </svg>
                }
            />

        </div>
    );
}
