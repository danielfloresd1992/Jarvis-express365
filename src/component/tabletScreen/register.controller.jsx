import { lazy, Suspense } from 'react';

//  LA LÓGICA — la sesión entera sale de un hook, el mismo que usa la ventana principal (hook/useTabletSession.jsx)
import { useTabletSession } from './hook/useTabletSession.jsx';
import { describeAiServer } from './hook/useAiServer.jsx';
import { useSplitter } from './hook/useSplitter.jsx';

import { REGISTRO_ACTIVO } from '../../libs/tickets/registroDeInferencia.js';
import { SIMULACION_DISPONIBLE } from '../../simulador/disponible.js';

//  LO QUE SE VE — un componente por cada elemento de la pantalla (carpeta assets/)
import WindowFrame from './assets/layout/WindowFrame.jsx';
import MirrorPanel from './assets/layout/MirrorPanel.jsx';
import Splitter from './assets/layout/Splitter.jsx';
import RegisterPanel from './assets/layout/RegisterPanel.jsx';

import TitleBar from './assets/titleBar/TitleBar.jsx';
import StatusDot from './assets/titleBar/StatusDot.jsx';
import TabletStatus from './assets/titleBar/TabletStatus.jsx';
import ReadingIndicator from './assets/titleBar/ReadingIndicator.jsx';
import TitleBarActions from './assets/titleBar/TitleBarActions.jsx';
import ModeIAButton from './assets/titleBar/ModeIAButton.jsx';
import SendCaptureButton from './assets/titleBar/SendCaptureButton.jsx';
import SimulateButton from './assets/titleBar/SimulateButton.jsx';
import ConnectButton from './assets/titleBar/ConnectButton.jsx';
import CloseButton from './assets/titleBar/CloseButton.jsx';

import SendNotice from './assets/mirror/SendNotice.jsx';
import TabletMirror from './assets/mirror/TabletMirror.jsx';
import ZoomBar from './assets/mirror/ZoomBar.jsx';
import ZoomControl from './assets/mirror/ZoomControl.jsx';
import DragHint from './assets/mirror/DragHint.jsx';
import SaveFramesButton from './assets/mirror/SaveFramesButton.jsx';

import Registers from './assets/registers/Registers.jsx';


/*  ══════════════════════════════════════════════════════════════════════════════════════
 *  LA VENTANA FLOTANTE DE LA TABLET — EL CONTROLADOR
 *
 *  Todo empieza aquí. Este archivo no pinta nada por su cuenta ni sabe hacer nada por su cuenta:
 *  junta las piezas y dice dónde va cada una.
 *
 *      hook/     LA LÓGICA. Cada hook se ocupa de UNA cosa y no sabe nada de las demás.
 *                useTabletSession los junta todos: es la sesión entera, y la misma que monta la
 *                ventana principal (tablet.provider.jsx).
 *      assets/   LO QUE SE VE. Cada componente SOLO PINTA: recibe datos por props y avisa
 *                llamando a una función. Ninguno conecta, lee, guarda ni envía.
 *
 *  Para cambiar CÓMO SE VE algo: está en el JSX de abajo, con su nombre; se abre su archivo.
 *  Para cambiar QUÉ HACE algo: se mira qué función recibe ese componente, y está en useTabletSession
 *  o en el hook del que sale.
 *
 *
 *  POR DEFECTO LA TABLET NO VIVE AQUÍ: vive en la ventana principal, con el espejo en la barra de la
 *  izquierda y los registers en el centro de Home. Esta ventana es la que se abre con «Sacar tablet»,
 *  y mientras está abierta la de la ventana principal se aparta (ver tablet.provider.jsx).
 *
 *
 *  LA PANTALLA, DE ARRIBA ABAJO
 *
 *      MirrorPanel      el espejo de la tablet: barra de título, imagen y zoom
 *      Splitter         el divisor que se arrastra para repartir el alto
 *      RegisterPanel    el registro: las mesas y, dentro de cada una, sus procesos (pedidos)
 *      InferencePanel   a la derecha y solo en desarrollo: el registro de la inferencia
 *  ══════════════════════════════════════════════════════════════════════════════════════ */



/*  EL PANEL DEL REGISTRO DE LA INFERENCIA — solo en desarrollo
 *
 *  Se carga con import() y detrás de la constante: en la aplicación publicada 'REGISTRO_ACTIVO' es
 *  false, Vite ve que esta rama no se alcanza nunca y ni el panel ni su hoja de estilos entran en
 *  el paquete.
 */
const InferencePanel = REGISTRO_ACTIVO ? lazy(() => import('./assets/inference/InferencePanel.jsx')) : null;



/*  @param {boolean}  inPanel            true cuando esto vive dentro de un panel de la página en vez de
 *                                       en una ventana del sistema.
 *  @param {function} onClose            solo fuera de Electron: allí la ✕ la resuelve el sistema.
 *  @param {function} onDragBar          ídem para mover el panel.
 *  @param {function} onReportDelay      qué hacer cuando se pide reportar una demora.
 *  @param {string}   establishmentName  opcional. Si no viene, se usa el del local en curso.
 *  @param {string}   attentionLimit     opcional. Si no viene, se deduce del nombre del local.
 */
export function RegisterController({ inPanel = false, onClose, onDragBar, onReportDelay, establishmentName, attentionLimit }) {


    //  La sesión: la tablet, la lectura, los registers y el espejo.
    const session = useTabletSession({ onReportDelay, establishmentName, attentionLimit });

    const { name, tablet, ai, reading, zoom, drag, capture } = session;

    //  Y lo único que es solo de esta ventana: el reparto del alto entre el espejo y los registers.
    const splitter = useSplitter();


    // closeWindow = «…se cierra la ventana»
    const closeWindow = () => (onClose ?? window.electronAPI?.closeTabletWindow)?.();



    //  ── LA PANTALLA ───────────────────────────────────────────────────────────────────

    return (
        <WindowFrame
            inPanel={inPanel}
            columnRef={splitter.containerRef}
            splitting={splitter.splitting}
            side={InferencePanel && (
                //  'Suspense' con 'fallback' vacío: mientras el panel se descarga no hay nada que enseñar.
                <Suspense fallback={null}>
                    <InferencePanel />
                </Suspense>
            )}
        >

            {/*  ARRIBA — el espejo de la tablet  */}
            <MirrorPanel height={splitter.split}>

                <TitleBar onMouseDown={onDragBar}>

                    <StatusDot
                        simulating={tablet.simulated}
                        connected={tablet.connected}
                        connecting={tablet.connecting}
                        failed={tablet.failed}
                    />

                    <TabletStatus
                        name={name}
                        statusText={tablet.statusText}
                        simulating={tablet.simulated}
                        connecting={tablet.connecting}
                        failed={tablet.failed}
                        aiText={describeAiServer(ai.server)}
                        aiFailed={ai.server?.active === false}
                    />

                    {
                        tablet.connected && (
                            <ReadingIndicator
                                modeIA={reading.modeIA}
                                readingTime={reading.readingTime}
                                lastError={reading.lastError}
                            />
                        )
                    }

                    <TitleBarActions>
                        <ModeIAButton active={reading.modeIA} onToggle={reading.toggleModeIA} />

                        {tablet.connected && <SendCaptureButton sending={capture.sending} sent={capture.result?.ok === true} onSend={capture.send} />}

                        {SIMULACION_DISPONIBLE && !tablet.connected && <SimulateButton disabled={tablet.connecting} onSimulate={tablet.connectSimulator} />}

                        <ConnectButton
                            connected={tablet.connected}
                            connecting={tablet.connecting}
                            onConnect={tablet.connectUsb}
                            onDisconnect={session.disconnectTablet}
                        />

                        <CloseButton onClose={closeWindow} />
                    </TitleBarActions>

                </TitleBar>

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

                <ZoomBar>
                    <ZoomControl
                        zoom={zoom.value}
                        canZoomIn={zoom.canZoomIn}
                        canZoomOut={zoom.canZoomOut}
                        onZoomIn={zoom.zoomIn}
                        onZoomOut={zoom.zoomOut}
                        onReset={zoom.reset}
                    />

                    {drag.canMove && <DragHint />}

                    {import.meta.env.DEV && <SaveFramesButton disabled={!tablet.connected} onSave={tablet.saveCapture} />}
                </ZoomBar>

            </MirrorPanel>


            <Splitter onMouseDown={splitter.start} />


            {/*  ABAJO — el registro, la misma pieza que se ve en el centro de Home  */}
            <RegisterPanel>
                <Registers session={session} />
            </RegisterPanel>

        </WindowFrame>
    );
}
