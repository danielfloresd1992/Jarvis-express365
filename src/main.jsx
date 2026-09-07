import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import store from "./store";
import { Provider } from "react-redux";

// El CSS global se carga acá y no solo dentro de App: la pantalla de "solo
// escritorio" se pinta EN LUGAR de App y también necesita sus variables.
import "./index.css";
import { puedeEjecutarse } from "./libs/entorno/esEscritorio";
import SoloEscritorio from "./component/SoloEscritorio/SoloEscritorio";
import { TabletScreen } from "./component/tabletScreen/TabletScreen.jsx";
import TitleBar from "./component/titleBar/TitleBar.jsx";

const root = ReactDOM.createRoot(document.getElementById("root"));


// ── Ahorro de CPU en reposo ─────────────────────────────────────────
// 1. Ventana oculta (minimizada u otra app al frente): .app-hidden pausa
//    todas las animaciones (regla en index.css). Electron con
//    backgroundThrottling desactivado sigue pintando si no se corta acá.
// 2. Sin interacción durante IDLE_MS: se activa .lite-mode (ya definida
//    en index.css), que corta animaciones, transiciones y backdrop-filter.
//    Cualquier toque, tecla o movimiento lo desactiva al instante.
const IDLE_MS = 60_000;
const rootElement = document.documentElement;
let idleTimer = null;

const enterLiteMode = () => rootElement.classList.add('lite-mode');

const resetIdleTimer = () => {
    rootElement.classList.remove('lite-mode');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(enterLiteMode, IDLE_MS);
};

const arrancarAhorroDeCpu = () => {
    ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'].forEach(eventName =>
        window.addEventListener(eventName, resetIdleTimer, { passive: true })
    );
    resetIdleTimer();

    document.addEventListener('visibilitychange', () => {
        rootElement.classList.toggle('app-hidden', document.hidden);
    });
};


// ── ¿Es la ventana flotante de la tablet? ───────────────────────────
// La carcasa de escritorio abre esa ventana con `?view=tablet` en la
// dirección. Es la MISMA página, así que hay que distinguirla acá: sin esto
// la flotante montaría Jarvis entero —sesión, socket, chat, bandeja— dentro
// de un recuadro de 400×300.
//
// Se mira `search` y no el hash porque el enrutador de la aplicación usa
// `HashRouter`: navegar cambia el `#`, pero el `?` se queda donde está.
const esVistaTablet = new URLSearchParams(window.location.search).get('view') === 'tablet';


// ── Arranque ────────────────────────────────────────────────────────
// En la computadora, Reportes Express solo trabaja dentro de la aplicación de
// escritorio; en el teléfono, en cualquier navegador. Donde no corresponde se
// pinta el aviso y NO se monta nada más.
//
// La comprobación va ANTES de todo lo demás a propósito: el ahorro de CPU deja
// temporizadores y escuchas puestas, y App abre la sesión y el socket al
// montarse. Decidir después dejaría el aviso en pantalla con la aplicación
// funcionando por detrás.
if (!puedeEjecutarse()) {
    root.render(<SoloEscritorio />);
}

// La flotante pinta SOLO la pantalla de la tablet. Nada de Provider ni de App:
// cada ventana de Electron tiene su propio contexto, así que montar Jarvis
// otra vez abriría un segundo socket y una segunda sesión contra la API.
//
// Tampoco se arranca el ahorro de CPU: sus temporizadores y escuchas existen
// para una ventana con la que se trabaja, y acá lo único que se hace es mirar.
else if (esVistaTablet) {
    // Marca para el CSS: hace que html, body y #root ocupen la ventana entera.
    // Sin ella la pantalla de la tablet colapsa al tamaño de su contenido y
    // queda flotando en el medio (ver "VENTANA FLOTANTE DE LA TABLET" en
    // index.css).
    document.documentElement.classList.add('vista-tablet');

    root.render(
        <React.StrictMode>
            <TabletScreen />
        </React.StrictMode>
    );
}

else {
    arrancarAhorroDeCpu();

    // Marca para el CSS: dentro de la aplicación de escritorio la ventana no
    // tiene el marco de Windows, así que la barra de título la pinta la propia
    // web y ocupa 32 px arriba. La marca hace que `--titlebar-h` deje de valer
    // cero y todo lo que va pegado al borde superior baje esos 32 px.
    //
    // Se pone ANTES de pintar, no dentro de un efecto de TitleBar: si se
    // pusiera después, la interfaz aparecería arriba del todo y pegaría un
    // salto en cuanto la barra se montara.
    if (window.electronAPI?.isElectron) {
        document.documentElement.classList.add('is-electron');
    }

    root.render(
        <React.StrictMode>
            <TitleBar />
            <Provider store={store}>
                <App />
            </Provider>
        </React.StrictMode>
    );
}
