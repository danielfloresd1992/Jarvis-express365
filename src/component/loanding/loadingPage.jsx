export default function LoadingPage() {
    return (
        <div className="lp-wrap">

            {/* ── Background glow ── */}
            <div className="lp-bg-glow" />

            {/* ── Scan line ── */}
            <div className="lp-scanline" />

            {/* ── Corner brackets ── */}
            <div className="lp-corner lp-corner--tl" />
            <div className="lp-corner lp-corner--tr" />
            <div className="lp-corner lp-corner--bl" />
            <div className="lp-corner lp-corner--br" />

            {/* ── HUD top-left ── */}
            <div className="lp-hud lp-hud--tl">
                <div className="lp-hud-dot lp-dot--cyan" />
                <span className="lp-hud-lbl">NETWORK</span>
                <span className="lp-hud-val lp-val--cyan">ONLINE</span>
            </div>

            {/* ── HUD top-right ── */}
            <div className="lp-hud lp-hud--tr">
                <div className="lp-hud-dot lp-dot--green" />
                <span className="lp-hud-lbl">SISTEMA</span>
                <span className="lp-hud-val lp-val--green">ACTIVO</span>
            </div>

            {/* ════ CENTER CONTENT ════ */}
            <div className="lp-center">

                {/* Rotating rings + gear */}
                <div className="lp-rings-wrap">
                    <div className="lp-ring lp-ring--1">
                        <div className="lp-orbit-dot lp-orbit-dot--1" />
                    </div>
                    <div className="lp-ring lp-ring--2">
                        <div className="lp-orbit-dot lp-orbit-dot--2" />
                    </div>
                    <div className="lp-ring lp-ring--3" />

                    {/* Gear SVG (same icon as login, large) */}
                    <div className="lp-gear-wrap">
                        <svg
                            className="lp-gear-svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.92c.04-.33.07-.67.07-1.08 0-.41-.03-.75-.07-1.08l2.3-1.8c.2-.16.27-.44.13-.67l-2.19-3.78a.51.51 0 0 0-.63-.22l-2.71 1.09c-.57-.44-1.18-.79-1.86-1.05l-.41-2.88C14.27 2.18 14.04 2 13.77 2h-3.54c-.27 0-.5.18-.54.44l-.41 2.88c-.68.26-1.29.61-1.86 1.05L4.7 5.28c-.23-.09-.5 0-.63.22L1.88 9.28c-.14.23-.07.51.13.67l2.3 1.8C4.27 12.08 4.25 12.42 4.25 12.5c0 .08.02.42.06.75l-2.3 1.8c-.2.16-.27.44-.13.67l2.19 3.78c.13.23.4.32.63.22l2.71-1.09c.57.44 1.18.79 1.86 1.05l.41 2.88c.04.26.27.44.54.44h3.54c.27 0 .5-.18.54-.44l.41-2.88c.68-.26 1.29-.61 1.86-1.05l2.71 1.09c.23.09.5 0 .63-.22l2.19-3.78c.14-.23.07-.51-.13-.67l-2.3-1.8Z" />
                        </svg>
                        <div className="lp-gear-glow" />
                        {/* Hub centre dot */}
                        <div className="lp-hub-dot" />
                    </div>
                </div>

                {/* Logo */}
                <img
                    src="/logo1.PNG"
                    alt="Jarvis 365"
                    className="lp-logo"
                />

                {/* Title */}
                <h1 className="lp-title">
                    <span className="lp-title-jarvis">JARVIS</span>
                    <svg className="lp-title-sep" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.92c.04-.33.07-.67.07-1.08 0-.41-.03-.75-.07-1.08l2.3-1.8c.2-.16.27-.44.13-.67l-2.19-3.78a.51.51 0 0 0-.63-.22l-2.71 1.09c-.57-.44-1.18-.79-1.86-1.05l-.41-2.88C14.27 2.18 14.04 2 13.77 2h-3.54c-.27 0-.5.18-.54.44l-.41 2.88c-.68.26-1.29.61-1.86 1.05L4.7 5.28c-.23-.09-.5 0-.63.22L1.88 9.28c-.14.23-.07.51.13.67l2.3 1.8C4.27 12.08 4.25 12.42 4.25 12.5c0 .08.02.42.06.75l-2.3 1.8c-.2.16-.27.44-.13.67l2.19 3.78c.13.23.4.32.63.22l2.71-1.09c.57.44 1.18.79 1.86 1.05l.41 2.88c.04.26.27.44.54.44h3.54c.27 0 .5-.18.54-.44l.41-2.88c.68-.26 1.29-.61 1.86-1.05l2.71 1.09c.23.09.5 0 .63-.22l2.19-3.78c.14-.23.07-.51-.13-.67l-2.3-1.8Z" />
                    </svg>
                    <span className="lp-title-num">365</span>
                </h1>

                {/* Divider */}
                <div className="lp-divider" />

                {/* Status */}
                <p className="lp-status">
                    INICIALIZANDO SISTEMA
                    <span className="lp-dot-anim lp-dot-anim--1">.</span>
                    <span className="lp-dot-anim lp-dot-anim--2">.</span>
                    <span className="lp-dot-anim lp-dot-anim--3">.</span>
                </p>

                {/* Progress bar */}
                <div className="lp-progress-track">
                    <div className="lp-progress-fill" />
                    <div className="lp-progress-glow" />
                </div>

                {/* Sub-status */}
                <p className="lp-sub-status">Verificando credenciales y conexión</p>
            </div>

            {/* ── Bottom bar ── */}
            <div className="lp-bottom-bar">
                <div className="lp-hud-dot lp-dot--green" />
                <span className="lp-hud-lbl">JARVIS 365 — HERRAMIENTAS AL ALCANCE DE TU MANO</span>
            </div>
        </div>
    );
}
