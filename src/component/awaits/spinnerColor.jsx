export default function SpinerColor({ text }) {
    return (
        <div className="sc-overlay">

            {/* Corner brackets (top-left / bottom-right) */}
            <div className="sc-corner sc-corner--tl" />
            <div className="sc-corner sc-corner--br" />

            {/* Scan line */}
            <div className="sc-scanline" />

            {/* Dual-ring neon spinner */}
            <div className="sc-spinner-wrap">
                <div className="sc-ring sc-ring--outer" />
                <div className="sc-ring sc-ring--inner" />
                <div className="sc-ring-core" />
                <div className="sc-ring-pulse" />
            </div>

            {text && (
                <p className="sc-text">
                    {text}
                    <span className="lp-dot-anim lp-dot-anim--1">.</span>
                    <span className="lp-dot-anim lp-dot-anim--2">.</span>
                    <span className="lp-dot-anim lp-dot-anim--3">.</span>
                </p>
            )}
        </div>
    );
}
