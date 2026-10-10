import './style.css';
import { useTabletContext } from '../tabletScreen/tablet.provider.jsx';
import { describeAiServer } from '../tabletScreen/hook/useAiServer.jsx';
import { SIMULACION_DISPONIBLE } from '../../simulador/disponible.js';

import StatusDot from '../tabletScreen/assets/titleBar/StatusDot.jsx';
import TabletStatus from '../tabletScreen/assets/titleBar/TabletStatus.jsx';
import ModeIAButton from '../tabletScreen/assets/titleBar/ModeIAButton.jsx';
import SendCaptureButton from '../tabletScreen/assets/titleBar/SendCaptureButton.jsx';
import SimulateButton from '../tabletScreen/assets/titleBar/SimulateButton.jsx';
import ConnectButton from '../tabletScreen/assets/titleBar/ConnectButton.jsx';
import SendNotice from '../tabletScreen/assets/mirror/SendNotice.jsx';
import TabletMirror from '../tabletScreen/assets/mirror/TabletMirror.jsx';
import ZoomBar from '../tabletScreen/assets/mirror/ZoomBar.jsx';
import ZoomControl from '../tabletScreen/assets/mirror/ZoomControl.jsx';
import SaveFramesButton from '../tabletScreen/assets/mirror/SaveFramesButton.jsx';
import TabletAway from './TabletAway.jsx';


/*  LA TABLET EN LA BARRA DE LA IZQUIERDA
 *
 *  El hueco libre de la barra, debajo de «Configuración», lo ocupa la pantalla de la tablet: el
 *  estado, los botones, el espejo y el zoom. Son las mismas piezas de la ventana flotante
 *  (tabletScreen/assets), colocadas para los 260 px de la barra: el estado arriba y los botones
 *  debajo, porque en una sola fila no caben.
 *
 *  Lo que falta respecto a la flotante, a propósito:
 *      · la ✕: aquí no hay ventana que cerrar
 *      · qué captura está leyendo la IA y la pista de arrastre: no caben, y la barra de los registers
 *        ya dice cómo va la lectura
 *
 *  Los registers no van aquí: van en el centro de Home (component/RegisterBoard). La sesión es la
 *  misma para los dos y la monta tabletScreen/tablet.provider.jsx.
 */
function TabletDock() {

    const { available, away, session } = useTabletContext();

    //  En el teléfono no hay tablet.
    if (!available) return null;

    //  Con la tablet fuera, en su ventana, aquí solo se dice dónde está. Traerla es cerrar esa
    //  ventana: al cerrarse, la tablet vuelve sola a este sitio.
    if (away) return <TabletAway onBringBack={() => window.electronAPI?.closeTabletWindow?.()} />;

    //  La sesión arranca un instante después de montarse esto, antes de que el navegador pinte.
    if (!session) return null;

    const { tablet, ai, reading, capture, zoom, drag } = session;

    return (
        <section className='tablet-dock' aria-label='Tablet'>

            {/*  ARRIBA — cómo está la tablet y cómo está la IA  */}
            <header className='tablet-dock__header'>
                <StatusDot
                    simulating={tablet.simulated}
                    connected={tablet.connected}
                    connecting={tablet.connecting}
                    failed={tablet.failed}
                />

                {/*  El nombre del local ya está arriba del todo, en la cabecera de la barra: aquí la
                     primera línea dice qué es esto.  */}
                <TabletStatus
                    name='Tablet'
                    statusText={tablet.statusText}
                    simulating={tablet.simulated}
                    connecting={tablet.connecting}
                    failed={tablet.failed}
                    aiText={describeAiServer(ai.server)}
                    aiFailed={ai.server?.active === false}
                />
            </header>

            {/*  LOS BOTONES — en el mismo orden que en la ventana flotante, sin la ✕  */}
            <div className='tablet-dock__actions'>
                <ModeIAButton active={reading.modeIA} onToggle={reading.toggleModeIA} />

                {tablet.connected && <SendCaptureButton sending={capture.sending} sent={capture.result?.ok === true} onSend={capture.send} />}

                {SIMULACION_DISPONIBLE && !tablet.connected && <SimulateButton disabled={tablet.connecting} onSimulate={tablet.connectSimulator} />}

                <ConnectButton
                    connected={tablet.connected}
                    connecting={tablet.connecting}
                    onConnect={tablet.connectUsb}
                    onDisconnect={session.disconnectTablet}
                />
            </div>

            {/*  EL ESPEJO — se queda con el alto que sobra  */}
            <div className='tablet-dock__screen'>
                <SendNotice result={capture.result} />

                <TabletMirror
                    ref={drag.containerRef}
                    frames={tablet.frames}
                    zoom={zoom.value}
                    dragging={drag.dragging}
                    canMove={drag.canMove}
                    onMouseDown={drag.start}
                    onLoad={drag.measure}
                />
            </div>

            {/*  ABAJO — el zoom  */}
            <ZoomBar>
                <ZoomControl
                    zoom={zoom.value}
                    canZoomIn={zoom.canZoomIn}
                    canZoomOut={zoom.canZoomOut}
                    onZoomIn={zoom.zoomIn}
                    onZoomOut={zoom.zoomOut}
                    onReset={zoom.reset}
                />

                {import.meta.env.DEV && <SaveFramesButton disabled={!tablet.connected} onSave={tablet.saveCapture} />}
            </ZoomBar>

        </section>
    );
}

export default TabletDock;
