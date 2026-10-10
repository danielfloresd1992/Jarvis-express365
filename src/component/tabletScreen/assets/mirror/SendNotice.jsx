import Icon from '../Icon.jsx';


/*  EL RESULTADO DEL ENVÍO DE LA CAPTURA
 *
 *  Va SUPERPUESTO, no dentro del flujo. En una ventana de 400×300 una banda que aparece y desaparece
 *  empujaría la imagen hacia abajo y de vuelta cada vez, y ese salto se nota más que el propio aviso.
 *
 *  Se coloca contra el panel del espejo —que lleva 'relative'— justo debajo de la barra de título,
 *  que mide 48 px.
 *
 *  'pointer-events-none' para que no se coma un clic sobre la imagen si el aviso cae encima de algo
 *  que se quería arrastrar.
 */


/*  @param {object} result  cómo acabó el envío: { ok, text }. null = no hay nada que avisar
 */
export default function SendNotice({ result }) {

    if (!result) return null;

    return (
        <div
            role={result.ok ? 'status' : 'alert'}
            className={`absolute top-[56px] left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-md text-[11px] font-bold shadow-lg pointer-events-none flex items-center gap-1.5 max-w-[92%] ${result.ok ? 'bg-jx-verde-suave text-jx-verde-texto border border-jx-verde-barra' : 'bg-jx-critico-suave text-jx-critico-texto border border-jx-critico'}`}
        >
            <Icon name={result.ok ? 'done' : 'warning'} size={14} />
            <span className='truncate'>{result.text}</span>
        </div>
    );
}
