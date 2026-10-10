import './style.css';
import { lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { useTabletContext } from '../tabletScreen/tablet.provider.jsx';
import Registers from '../tabletScreen/assets/registers/Registers.jsx';
import { REGISTRO_ACTIVO } from '../../libs/tickets/registroDeInferencia.js';


/*  EL REGISTRO EN EL CENTRO DE HOME
 *
 *  Las mesas y sus procesos ocupando el centro entero. Es la misma pieza de abajo de la ventana
 *  flotante (tabletScreen/assets/registers/Registers.jsx); la tablet que lo llena está en la barra de
 *  la izquierda (component/TabletDock), y la sesión de los dos la monta tabletScreen/tablet.provider.jsx.
 *
 *  Donde aquí no hay tablet —en el teléfono, o con la tablet fuera en su ventana— el centro enseña
 *  lo de siempre, la bienvenida, que llega en 'fallback'.
 *
 *  En desarrollo va además, a la derecha, el registro de la inferencia, igual que en la flotante.
 */


//  Igual que en register.controller.jsx: con 'REGISTRO_ACTIVO' en false, el panel ni entra en el paquete.
const InferencePanel = REGISTRO_ACTIVO ? lazy(() => import('../tabletScreen/assets/inference/InferencePanel.jsx')) : null;


/*  @param {node} fallback  lo que va en el centro cuando aquí no hay tablet
 */
function RegisterBoard({ fallback }) {

    const { available, away, session } = useTabletContext();

    // establishment = «el local en curso», con sus gerentes poblados (Home lo pide entero)
    const establishment = useSelector(state => state.establishment);

    if (!available || away) return fallback;

    //  La sesión arranca un instante después de montarse esto, antes de que el navegador pinte.
    if (!session) return null;

    return (
        <section className='register-board' aria-label='Registers de la tablet'>

            <div className='register-board__registers'>
                <Registers session={session} establishment={establishment} />
            </div>

            {
                InferencePanel && (
                    //  'Suspense' con 'fallback' vacío: mientras el panel se descarga no hay nada que enseñar.
                    <Suspense fallback={null}>
                        <InferencePanel />
                    </Suspense>
                )
            }

        </section>
    );
}

export default RegisterBoard;
