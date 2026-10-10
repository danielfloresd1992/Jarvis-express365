/*  EL PANEL DE ABAJO: el registro
 *
 *  Dentro van la barra y la tabla de las mesas con sus procesos (Registers.jsx).
 *
 *  El mínimo va acotado en porcentaje por lo mismo que el del espejo (ver MirrorPanel).
 */


// REGISTER_MIN_HEIGHT = «el alto mínimo de los registers»
const REGISTER_MIN_HEIGHT = 'min(140px, 35%)';


export default function RegisterPanel({ children }) {
    return (
        <div
            className='w-full flex-1 min-h-0 flex flex-col overflow-hidden'
            style={{ minHeight: REGISTER_MIN_HEIGHT }}
        >
            {children}
        </div>
    );
}
