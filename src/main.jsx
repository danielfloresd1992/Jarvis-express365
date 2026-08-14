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


// ── Arranque ────────────────────────────────────────────────────────
// En la computadora, Reportes Express solo trabaja dentro de la aplicación de
// escritorio; en el teléfono, en cualquier navegador. Donde no corresponde se
// pinta el aviso y NO se monta nada más.
//
// La comprobación va ANTES de todo lo demás a propósito: el ahorro de CPU deja
// temporizadores y escuchas puestas, y App abre la sesión y el socket al
// montarse. Decidir después dejaría el aviso en pantalla con la aplicación
// funcionando por detrás.
if (puedeEjecutarse()) {
    arrancarAhorroDeCpu();

    root.render(
        <React.StrictMode>
            <Provider store={store}>
                <App />
            </Provider>
        </React.StrictMode>
    );
}
else {
    root.render(<SoloEscritorio />);
}
