import { useEffect, useRef } from 'react';

/* ── Gear path (sharp rectangular teeth like in the reference image) ── */
function gearPath(ctx, cx, cy, outerR, innerR, teeth, angle) {
    const step = (Math.PI * 2) / teeth;
    const hw = step * 0.2;
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
        const base = step * i + angle;
        const v1 = base - step * 0.5 + hw;
        const v2 = base + step * 0.5 - hw;
        const t1 = base - hw;
        const t2 = base + hw;
        if (i === 0) ctx.moveTo(Math.cos(v1) * innerR + cx, Math.sin(v1) * innerR + cy);
        else         ctx.lineTo(Math.cos(v1) * innerR + cx, Math.sin(v1) * innerR + cy);
        ctx.lineTo(Math.cos(t1) * outerR + cx, Math.sin(t1) * outerR + cy);
        ctx.lineTo(Math.cos(t2) * outerR + cx, Math.sin(t2) * outerR + cy);
        ctx.lineTo(Math.cos(v2) * innerR + cx, Math.sin(v2) * innerR + cy);
    }
    ctx.closePath();
}

export default function Presentation() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;

        const setSize = () => {
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        setSize();
        const ro = new ResizeObserver(setSize);
        ro.observe(canvas);

        /* ── Server rack LED states (stable, only occasional flicker) ── */
        const ROWS = 22;
        const LEDS = 7;
        const rackData = Array.from({ length: ROWS * 2 }, () => ({
            leds: Array.from({ length: LEDS }, () => ({
                on:    Math.random() > 0.22,
                green: Math.random() > 0.38,
            })),
        }));

        /* ── Matrix rain ── */
        const FSZ = 11;
        const CHARS = '01アイウエカキクNETWORKSECURITYDATA';
        let drops = [];
        const initDrops = () => {
            drops = Array.from(
                { length: Math.floor(canvas.width / FSZ) },
                () => -Math.random() * 30,
            );
        };
        initDrops();
        window.addEventListener('resize', initDrops);

        /* ── Floating circuit nodes ── */
        const makeNodes = () => Array.from({ length: 22 }, () => ({
            x: Math.random() * (canvas.width || 800),
            y: Math.random() * (canvas.height || 600),
            vx: (Math.random() - 0.5) * 0.25,
            vy: (Math.random() - 0.5) * 0.25,
            r:  Math.random() * 1.2 + 0.5,
            ph: Math.random() * Math.PI * 2,
        }));
        let nodes = makeNodes();

        let t = 0;
        let gAngle = 0;
        let ledTick = 0;

        /* ════════════════════════════════════════
           SERVER ROOM — perspective + racks + LEDs
        ════════════════════════════════════════ */
        const drawServerRoom = (w, h) => {
            const vpX = w / 2, vpY = h * 0.4;

            /* ceiling strip light (centre perspective) */
            const ceil = ctx.createRadialGradient(vpX, 0, 0, vpX, 0, w * 0.35);
            ceil.addColorStop(0,   'rgba(180,220,255,0.16)');
            ceil.addColorStop(0.35,'rgba(80,160,255,0.06)');
            ceil.addColorStop(1,   'rgba(0,0,0,0)');
            ctx.fillStyle = ceil;
            ctx.fillRect(0, 0, w, h * 0.55);

            /* perspective converging lines */
            ctx.lineWidth = 0.5;
            for (let side = 0; side < 2; side++) {
                const edgeX = side === 0 ? 0 : w;
                const mid   = side === 0 ? vpX * 0.3 : w - (w - vpX) * 0.3;
                for (let i = 0; i <= 7; i++) {
                    const y = h * i / 7;
                    ctx.beginPath();
                    ctx.moveTo(edgeX, y);
                    ctx.lineTo(mid, vpY);
                    ctx.strokeStyle = `rgba(0,120,200,${0.03 + (i === 0 || i === 7 ? 0.04 : 0)})`;
                    ctx.stroke();
                }
            }

            /* floor reflection */
            const floor = ctx.createLinearGradient(0, h * 0.72, 0, h);
            floor.addColorStop(0, 'rgba(0,60,140,0)');
            floor.addColorStop(0.6,'rgba(0,50,130,0.07)');
            floor.addColorStop(1, 'rgba(0,30,100,0.18)');
            ctx.fillStyle = floor; ctx.fillRect(0, h * 0.72, w, h * 0.28);

            /* rack columns */
            const rackW = w * 0.13;
            const rh    = h / ROWS;
            for (let side = 0; side < 2; side++) {
                for (let row = 0; row < ROWS; row++) {
                    const y   = row * rh;
                    const idx = side * ROWS + row;
                    const x0  = side === 0 ? 0 : w - rackW;

                    /* rack body */
                    const bg = ctx.createLinearGradient(x0, y, x0 + rackW, y);
                    if (side === 0) {
                        bg.addColorStop(0,   'rgba(4,12,24,0.96)');
                        bg.addColorStop(0.75,'rgba(8,20,38,0.82)');
                        bg.addColorStop(1,   'rgba(14,28,50,0.4)');
                    } else {
                        bg.addColorStop(0,   'rgba(14,28,50,0.4)');
                        bg.addColorStop(0.25,'rgba(8,20,38,0.82)');
                        bg.addColorStop(1,   'rgba(4,12,24,0.96)');
                    }
                    ctx.fillStyle = bg;
                    ctx.fillRect(x0, y + 0.5, rackW, rh - 1);
                    ctx.strokeStyle = 'rgba(0,55,120,0.32)';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(x0, y + 0.5, rackW, rh - 1);

                    /* LEDs */
                    const { leds } = rackData[idx];
                    leds.forEach((led, j) => {
                        if (!led.on) return;
                        const lx = side === 0
                            ? 5 + j * 8
                            : w - 5 - j * 8;
                        const ly = y + rh / 2;
                        const clr = led.green ? '0,235,100' : '0,130,255';
                        const grd = ctx.createRadialGradient(lx, ly, 0, lx, ly, 5);
                        grd.addColorStop(0, `rgba(${clr},0.92)`);
                        grd.addColorStop(1, `rgba(${clr},0)`);
                        ctx.fillStyle = grd;
                        ctx.beginPath(); ctx.arc(lx, ly, 5, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(lx, ly, 1.6, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(${clr},1)`; ctx.fill();
                    });
                }
            }
        };

        /* ════════════════════════════════════════
           HEX GRID — large hexagons like in reference
        ════════════════════════════════════════ */
        const drawHexGrid = (w, h) => {
            const size = 56;
            const hh   = size * Math.sqrt(3);
            const cx0  = w / 2, cy0 = h * 0.58;
            const maxD = Math.sqrt(w * w + h * h) * 0.52;
            ctx.lineWidth = 0.7;
            for (let row = -1; row < h / hh + 2; row++) {
                for (let col = -1; col < w / (size * 1.5) + 2; col++) {
                    const cx = col * size * 3 + (row % 2 === 0 ? 0 : size * 1.5);
                    const cy = row * hh;
                    const d  = Math.sqrt((cx - cx0) ** 2 + (cy - cy0) ** 2);
                    const fade = Math.max(0, 1 - d / maxD);
                    /* Mix green (centre) and cyan (edges) like reference image */
                    const isCentre = d < maxD * 0.35;
                    const clr = isCentre ? '0,200,110' : '0,180,255';
                    ctx.strokeStyle = `rgba(${clr},${0.025 + fade * 0.1})`;
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const a  = (Math.PI / 3) * i - Math.PI / 6;
                        const px = cx + size * Math.cos(a);
                        const py = cy + size * Math.sin(a);
                        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.stroke();
                }
            }
        };

        /* ════════════════════════════════════════
           GEAR — metallic 3D with neon edges
        ════════════════════════════════════════ */
        const drawGear = (w, h, angle) => {
            const cx = w / 2;
            const cy = h * 0.73;
            const oR = Math.min(w * 0.38, h * 0.37);
            const iR = oR * 0.7;

            /* outer cast shadow */
            const shadow = ctx.createRadialGradient(cx, cy + oR * 0.1, oR * 0.5, cx, cy, oR * 1.5);
            shadow.addColorStop(0, 'rgba(0,10,40,0.55)');
            shadow.addColorStop(0.6,'rgba(0,5,25,0.2)');
            shadow.addColorStop(1,  'rgba(0,0,0,0)');
            ctx.fillStyle = shadow;
            ctx.beginPath(); ctx.arc(cx, cy + oR * 0.06, oR * 1.5, 0, Math.PI * 2); ctx.fill();

            /* outer ambient glow halo (blue) */
            const halo = ctx.createRadialGradient(cx, cy, iR, cx, cy, oR * 1.35);
            halo.addColorStop(0,   'rgba(0,150,255,0)');
            halo.addColorStop(0.55,'rgba(0,100,220,0.05)');
            halo.addColorStop(1,   'rgba(0,60,180,0.14)');
            ctx.fillStyle = halo;
            ctx.beginPath(); ctx.arc(cx, cy, oR * 1.35, 0, Math.PI * 2); ctx.fill();

            /* ── gear body ── */
            gearPath(ctx, cx, cy, oR, iR, 13, angle);

            /* metallic fill — top-left light source simulation */
            const metal = ctx.createLinearGradient(
                cx - oR * 0.85, cy - oR * 0.9,
                cx + oR * 0.65, cy + oR * 0.75,
            );
            metal.addColorStop(0,   'rgba(35,58,90,0.97)');
            metal.addColorStop(0.18,'rgba(28,46,74,0.95)');
            metal.addColorStop(0.45,'rgba(14,26,50,0.93)');
            metal.addColorStop(0.75,'rgba(8,16,34,0.92)');
            metal.addColorStop(1,   'rgba(4,9,20,0.90)');
            ctx.fillStyle = metal;
            ctx.fill();

            /* specular highlight (ray-tracing style reflection, top-left) */
            ctx.save();
            gearPath(ctx, cx, cy, oR, iR, 13, angle);
            ctx.clip();
            const spec = ctx.createLinearGradient(cx - oR, cy - oR, cx + oR * 0.15, cy + oR * 0.15);
            spec.addColorStop(0,   'rgba(90,150,220,0.11)');
            spec.addColorStop(0.28,'rgba(40,100,190,0.05)');
            spec.addColorStop(1,   'rgba(0,0,0,0)');
            ctx.fillStyle = spec;
            ctx.fillRect(cx - oR, cy - oR, oR * 2, oR * 2);
            ctx.restore();

            /* outer neon edge — cyan */
            ctx.strokeStyle = 'rgba(0,185,255,0.32)';
            ctx.lineWidth = 1.8;
            ctx.stroke();

            /* inner edge accent — green (like the bright lines in the image) */
            gearPath(ctx, cx, cy, oR * 0.965, iR * 1.035, 13, angle);
            ctx.strokeStyle = 'rgba(57,255,20,0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();

            /* ── hub area ── */
            /* hub outer ring */
            ctx.beginPath(); ctx.arc(cx, cy, iR * 0.55, 0, Math.PI * 2);
            const hubFill = ctx.createRadialGradient(cx, cy, 0, cx, cy, iR * 0.55);
            hubFill.addColorStop(0,   'rgba(0,190,255,0.18)');
            hubFill.addColorStop(0.55,'rgba(0,120,210,0.07)');
            hubFill.addColorStop(1,   'rgba(0,60,170,0.02)');
            ctx.fillStyle = hubFill; ctx.fill();
            ctx.strokeStyle = 'rgba(0,200,255,0.5)';
            ctx.lineWidth = 1.3;
            ctx.stroke();

            /* hub mid ring */
            ctx.beginPath(); ctx.arc(cx, cy, iR * 0.35, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0,200,255,0.28)';
            ctx.lineWidth = 0.8; ctx.stroke();

            /* hub inner ring */
            ctx.beginPath(); ctx.arc(cx, cy, iR * 0.18, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(57,255,20,0.35)';
            ctx.lineWidth = 0.7; ctx.stroke();

            /* hub centre glow (bright blue point like in image) */
            const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20);
            core.addColorStop(0,   'rgba(210,248,255,1)');
            core.addColorStop(0.18,'rgba(0,210,255,0.95)');
            core.addColorStop(0.55,'rgba(0,160,255,0.35)');
            core.addColorStop(1,   'rgba(0,80,220,0)');
            ctx.fillStyle = core;
            ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();

            ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(240,255,255,1)'; ctx.fill();

            return { cx, cy, oR };
        };

        /* ════════════════════════════════════════
           CIRCUIT TRACES — 3 branches (match reference image exactly)
        ════════════════════════════════════════ */
        const drawCircuits = (cx, topY, w, h, pulse) => {
            const BW  = Math.min(w, h) * 0.12;  /* branch horizontal width */
            const VH  = h * 0.21;               /* vertical height centre  */
            const BVH = h * 0.13;               /* branch fork height      */

            const draw = (color, lw, pts) => {
                ctx.strokeStyle = color;
                ctx.lineWidth   = lw;
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
                ctx.stroke();
            };

            const glow = (x, y, r, color, op) => {
                const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
                g.addColorStop(0, `rgba(${color},${op})`);
                g.addColorStop(1, `rgba(${color},0)`);
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(x, y, r * 2.5, 0, Math.PI * 2); ctx.fill();
            };

            const node = (x, y, r, strokeClr, fillClr, op) => {
                glow(x, y, r * 1.8, strokeClr === 'cyan' ? '0,200,255' : '57,255,20', op * 0.4);
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.strokeStyle = strokeClr === 'cyan'
                    ? `rgba(0,200,255,${op * 0.95})`
                    : `rgba(57,255,20,${op * 0.95})`;
                ctx.lineWidth = 1.8; ctx.stroke();
                ctx.beginPath(); ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
                ctx.fillStyle = fillClr; ctx.fill();
            };

            const p = pulse; /* 0.6–1 oscillating */

            /* ── Centre path (straight up, CYAN) ── */
            const cEnd = { x: cx, y: topY - VH };
            draw(`rgba(0,200,255,${p * 0.82})`, 2.2,
                [{ x: cx, y: topY }, cEnd]);
            /* wide glow behind */
            ctx.strokeStyle = `rgba(0,200,255,${p * 0.12})`;
            ctx.lineWidth = 10;
            ctx.beginPath(); ctx.moveTo(cx, topY); ctx.lineTo(cEnd.x, cEnd.y); ctx.stroke();
            node(cEnd.x, cEnd.y, 12, 'green', 'rgba(57,255,20,0.95)', p);

            /* ── Left branch (diagonal → horizontal, GREEN) ── */
            const lMid = { x: cx - BW * 0.72, y: topY - BVH };
            const lEnd = { x: cx - BW * 1.85,  y: lMid.y };
            draw(`rgba(57,255,20,${p * 0.75})`, 1.7,
                [{ x: cx, y: topY }, lMid, lEnd]);
            ctx.strokeStyle = `rgba(57,255,20,${p * 0.1})`;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(cx, topY); ctx.lineTo(lMid.x, lMid.y); ctx.lineTo(lEnd.x, lEnd.y);
            ctx.stroke();
            node(lEnd.x, lEnd.y, 10, 'cyan', 'rgba(160,230,255,0.92)', p);

            /* ── Right branch (diagonal → horizontal, CYAN→GREEN) ── */
            const rMid = { x: cx + BW * 0.72, y: topY - BVH };
            const rEnd = { x: cx + BW * 1.85,  y: rMid.y };
            draw(`rgba(0,200,255,${p * 0.75})`, 1.7,
                [{ x: cx, y: topY }, rMid, rEnd]);
            ctx.strokeStyle = `rgba(0,200,255,${p * 0.1})`;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(cx, topY); ctx.lineTo(rMid.x, rMid.y); ctx.lineTo(rEnd.x, rEnd.y);
            ctx.stroke();
            node(rEnd.x, rEnd.y, 10, 'green', 'rgba(57,255,20,0.92)', p);
        };

        /* ════════════════════════════════════════
           MATRIX RAIN — sides only
        ════════════════════════════════════════ */
        const drawRain = (w, h) => {
            const sideW = w * 0.18;
            ctx.font = `${FSZ}px monospace`;
            drops.forEach((y, i) => {
                const x = i * FSZ;
                if (x > sideW && x < w - sideW) return;
                const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
                ctx.fillStyle = y < 2
                    ? 'rgba(200,255,210,0.88)'
                    : `rgba(0,210,90,${0.08 + Math.random() * 0.18})`;
                ctx.fillText(ch, x, y * FSZ);
                drops[i]++;
                if (y * FSZ > h && Math.random() > 0.975) drops[i] = -Math.random() * 28;
            });
        };

        /* ════════════════════════════════════════
           MAIN LOOP
        ════════════════════════════════════════ */
        const animate = () => {
            const { width: w, height: h } = canvas;
            ctx.clearRect(0, 0, w, h);
            t      += 0.009;
            gAngle += 0.0016;
            ledTick++;

            /* occasional LED flicker */
            if (ledTick % 48 === 0) {
                rackData.forEach(row =>
                    row.leds.forEach(led => {
                        if (Math.random() > 0.965) led.on = !led.on;
                    }),
                );
            }

            /* ─ 1. Server room ─ */
            drawServerRoom(w, h);

            /* ─ 2. Hex grid ─ */
            drawHexGrid(w, h);

            /* ─ 3. Central atmospheric glow ─ */
            const atmo = ctx.createRadialGradient(w / 2, h * 0.62, 0, w / 2, h * 0.62, h * 0.62);
            atmo.addColorStop(0,   'rgba(0,100,230,0.1)');
            atmo.addColorStop(0.42,'rgba(0,60,190,0.05)');
            atmo.addColorStop(1,   'rgba(0,0,0,0)');
            ctx.fillStyle = atmo; ctx.fillRect(0, 0, w, h);

            /* ─ 4. Gear ─ */
            const { cx, cy, oR } = drawGear(w, h, gAngle);

            /* ─ 5. Radar pulses from gear centre ─ */
            for (let i = 0; i < 3; i++) {
                const prog = ((t * 0.22 + i / 3) % 1);
                const r    = prog * oR * 1.25;
                const op   = (1 - prog) * 0.22;
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(0,190,255,${op})`;
                ctx.lineWidth = 0.9; ctx.stroke();
            }

            /* ─ 6. Circuit traces ─ */
            const pulse = 0.62 + 0.38 * Math.sin(t * 2.6);
            drawCircuits(cx, cy - oR, w, h, pulse);

            /* ─ 7. Matrix rain ─ */
            drawRain(w, h);

            /* ─ 8. Floating circuit nodes ─ */
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const d  = Math.sqrt(dx * dx + dy * dy);
                    if (d < 95) {
                        ctx.strokeStyle = `rgba(0,180,255,${(1 - d / 95) * 0.09})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.stroke();
                    }
                }
            }
            nodes.forEach(n => {
                n.x += n.vx; n.y += n.vy;
                if (n.x < 0 || n.x > w) n.vx *= -1;
                if (n.y < 0 || n.y > h) n.vy *= -1;
                n.ph += 0.04;
                const r = n.r * (0.85 + 0.15 * Math.sin(n.ph));
                const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 5);
                g.addColorStop(0, 'rgba(0,200,255,0.4)');
                g.addColorStop(1, 'rgba(0,200,255,0)');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(n.x, n.y, r * 5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(160,230,255,0.95)'; ctx.fill();
            });

            /* ─ 9. Horizontal data-stream flares ─ */
            for (let i = 0; i < 5; i++) {
                const y   = h * (0.12 + i * 0.16);
                const spd = 0.45 + i * 0.11;
                const off = ((t * spd * 80) % (w * 2)) - w * 0.5;
                const grd = ctx.createLinearGradient(off - 110, 0, off + 110, 0);
                grd.addColorStop(0,   'rgba(0,200,255,0)');
                grd.addColorStop(0.5, `rgba(0,200,255,${0.07 + (i % 2) * 0.04})`);
                grd.addColorStop(1,   'rgba(0,200,255,0)');
                ctx.strokeStyle = grd; ctx.lineWidth = 0.6;
                ctx.beginPath();
                ctx.moveTo(Math.max(0, off - 110), y);
                ctx.lineTo(Math.min(w, off + 110), y);
                ctx.stroke();
            }

            animId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animId);
            ro.disconnect();
            window.removeEventListener('resize', initDrops);
        };
    }, []);

    /* ── JSX ── */
    return (
        <div className="fp-brand">
            <canvas ref={canvasRef} className="fp-canvas" />

            {/* Corner brackets */}
            <div className="fp-corner fp-corner--tl" />
            <div className="fp-corner fp-corner--tr" />
            <div className="fp-corner fp-corner--bl" />
            <div className="fp-corner fp-corner--br" />

            {/* Scan line */}
            <div className="fp-scanline" />

            {/* ══ HUD PANELS ══ */}

            {/* Top-left: Analytics / Radar */}
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
