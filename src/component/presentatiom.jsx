export default function Presentation() {
    return (
        <div className="auth-brand">
            <div className="auth-brand__glow" />
            <div className="auth-brand__circle auth-brand__circle--1" />
            <div className="auth-brand__circle auth-brand__circle--2" />
            <div className="auth-brand__circle auth-brand__circle--3" />

            <div className="auth-brand__content">
                <img
                    className="auth-brand__logo"
                    src="/logo1.png"
                    alt="Jarvis Express"
                />
                <h1 className="auth-brand__title">JarvisExpress</h1>
                <p className="auth-brand__tagline">¡Reporta al instante ya!</p>

                <div className="auth-brand__stats">
                    <div className="auth-brand__stat">
                        <span className="auth-brand__stat-value">⚡</span>
                        <span className="auth-brand__stat-label">Rápido</span>
                    </div>
                    <div className="auth-brand__stat">
                        <span className="auth-brand__stat-value">🔒</span>
                        <span className="auth-brand__stat-label">Seguro</span>
                    </div>
                    <div className="auth-brand__stat">
                        <span className="auth-brand__stat-value">📊</span>
                        <span className="auth-brand__stat-label">Eficiente</span>
                    </div>
                </div>
            </div>
        </div>
    );
}