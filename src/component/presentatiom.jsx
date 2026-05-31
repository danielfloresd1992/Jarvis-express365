import { useEffect, useRef } from 'react';

/**
 * Presentation — todo el canvas corre en un Web Worker separado.
 * El main thread solo gestiona el ciclo de vida del Worker y los overlays HTML.
 */
export default function Presentation() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let worker = null;
        let ro     = null;

        try {
            /*
             * transferControlToOffscreen() solo puede llamarse UNA vez por canvas.
             * En dev, React StrictMode monta → desmonta → remonta.
             * El segundo mount lanza InvalidStateError → lo capturamos y salimos.
             * En producción (sin StrictMode double-invoke) funciona perfectamente.
             */
            if (!canvas.transferControlToOffscreen) {
                console.warn('[Presentation] OffscreenCanvas no soportado.');
                return;
            }

            const offscreen = canvas.transferControlToOffscreen();

            worker = new Worker(
                new URL('./presentation.worker.js', import.meta.url),
                { type: 'classic' }
            );

            worker.postMessage(
                {
                    type:   'init',
                    canvas: offscreen,
                    width:  canvas.offsetWidth  || 800,
                    height: canvas.offsetHeight || 600,
                },
                [offscreen]  // transferencia de propiedad al Worker
            );

            ro = new ResizeObserver(([entry]) => {
                const { width, height } = entry.contentRect;
                worker.postMessage({ type: 'resize', width, height });
            });
            ro.observe(canvas);

        } catch {
            /*
             * Canvas ya transferido (StrictMode segundo mount en dev).
             * En producción este bloque nunca se ejecuta.
             */
        }

        return () => {
            if (ro)     ro.disconnect();
            if (worker) { worker.postMessage({ type: 'stop' }); worker.terminate(); }
        };
    }, []);

    /* ─────────────────────────────────────────────────
       El JSX solo contiene: canvas + overlays HTML.
       Todo lo que se dibuja en canvas viene del Worker.
    ───────────────────────────────────────────────── */
    return (
        <div className="fp-brand">
            {/* Canvas controlado 100% por el Worker */}
            <canvas ref={canvasRef} className="fp-canvas" />

            {/* Corner brackets */}
            <div className="fp-corner fp-corner--tl" />
            <div className="fp-corner fp-corner--tr" />
            <div className="fp-corner fp-corner--bl" />
            <div className="fp-corner fp-corner--br" />

            {/* Scan line CSS */}
            <div className="fp-scanline" />

            {/* ══ HUD PANELS ══ */}

            {/* Top-left: Analytics / Radar 
            <div className="fp-panel fp-panel--tl">
                <div className="fp-panel-title">ANALYTICS</div>
                <svg viewBox="0 0 60 60" className="fp-radar-svg">
                    <circle cx="30" cy="30" r="24" className="fp-radar-ring" />
                    <circle cx="30" cy="30" r="16" className="fp-radar-ring" />
                    <circle cx="30" cy="30" r="8"  className="fp-radar-ring" />
                    <line x1="30" y1="6"  x2="30" y2="54" className="fp-radar-line" />
                    <line x1="6"  y1="30" x2="54" y2="30" className="fp-radar-line" />
                    <circle cx="37" cy="19" r="2.8" className="fp-radar-blip fp-blip--1" />
                    <circle cx="21" cy="36" r="2"   className="fp-radar-blip fp-blip--2" />
                    <circle cx="44" cy="38" r="1.8" className="fp-radar-blip fp-blip--3" />
                </svg>
                <div className="fp-panel-row">
                    <span className="fp-pl">STATUS</span>
                    <span className="fp-pv fp-pv--green">NOMINAL</span>
                </div>
                <div className="fp-panel-row">
                    <span className="fp-pl">LATENCIA</span>
                    <span className="fp-pv">12ms</span>
                </div>
            </div>
            */}
            {/* Top-right: Network */}
            <div className="fp-panel fp-panel--tr">
                <div className="fp-panel-title">NETWORK</div>
                <div className="fp-signal-bars">
                    {[0.3, 0.55, 0.72, 0.88, 1].map((h, i) => (
                        <div key={i} className="fp-sig-bar" style={{ '--sh': h }} />
                    ))}
                </div>
                <div className="fp-panel-row"><span className="fp-pl">UPTIME</span><span className="fp-pv fp-pv--green">99.8%</span></div>
                <div className="fp-panel-row"><span className="fp-pl">NODES</span><span className="fp-pv">24</span></div>
                <div className="fp-panel-row"><span className="fp-pl">ALERTAS</span><span className="fp-pv fp-pv--cyan">EN LÍNEA</span></div>
            </div>

            {/* Bottom-left: System */}
            <div className="fp-panel fp-panel--bl">
                <div className="fp-panel-title">SISTEMA</div>
                {[['CPU', '72%', ''], ['RAM', '58%', '--cyan'], ['NET', '35%', '']].map(([lbl, pct, mod]) => (
                    <div key={lbl} className="fp-panel-row fp-panel-row--bar">
                        <span className="fp-pl">{lbl}</span>
                        <div className="fp-mini-bar-wrap">
                            <div className={`fp-mini-bar${mod}`} style={{ '--pct': pct }} />
                        </div>
                        <span className="fp-pv">{pct}</span>
                    </div>
                ))}
            </div>

            {/* Bottom-right: Reports gauge */}
            <div className="fp-panel fp-panel--br">
                <div className="fp-panel-title">REPORTES</div>
                <svg viewBox="0 0 80 48" className="fp-gauge-svg">
                    <path d="M8,44 A30,30 0 0,1 72,44" className="fp-gauge-track" />
                    <path d="M8,44 A30,30 0 0,1 60,18" className="fp-gauge-fill" />
                    <text x="40" y="42" className="fp-gauge-text">87%</text>
                </svg>
                <div className="fp-panel-row"><span className="fp-pl">HOY</span><span className="fp-pv fp-pv--green">+24</span></div>
                <div className="fp-panel-row"><span className="fp-pl">SEMANA</span><span className="fp-pv">+148</span></div>
            </div>

            {/* Bottom centre bar */}
            <div className="fp-bottom-bar">
                <div className="fp-dot fp-dot--green" />
                <span className="fp-bar-label">JARVIS 365 — HERRAMIENTAS AL ALCANCE DE TU MANO</span>
            </div>
        </div>
    );
}
