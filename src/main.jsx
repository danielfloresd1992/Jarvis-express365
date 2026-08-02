import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import store from "./store";
import { Provider } from "react-redux";

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

['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'].forEach(eventName =>
    window.addEventListener(eventName, resetIdleTimer, { passive: true })
);
resetIdleTimer();

document.addEventListener('visibilitychange', () => {
    rootElement.classList.toggle('app-hidden', document.hidden);
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </React.StrictMode>
);