/**
 * presentation.worker.js
 * Toda la lógica de canvas corre aquí — hilo separado del main thread.
 * El main thread transfiere el OffscreenCanvas y envía eventos de resize.
 */

/* ── Gear path ── */
function gearPath(ctx, cx, cy, outerR, innerR, teeth, angle) {
    const step = (Math.PI * 2) / teeth;
    const hw = step * 0.2;
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
        const base = step * i + angle;
        const v1 = base - step * 0.5 + hw, v2 = base + step * 0.5 - hw;
        const t1 = base - hw, t2 = base + hw;
        if (i === 0) ctx.moveTo(Math.cos(v1) * innerR + cx, Math.sin(v1) * innerR + cy);
        else         ctx.lineTo(Math.cos(v1) * innerR + cx, Math.sin(v1) * innerR + cy);
        ctx.lineTo(Math.cos(t1) * outerR + cx, Math.sin(t1) * outerR + cy);
        ctx.lineTo(Math.cos(t2) * outerR + cx, Math.sin(t2) * outerR + cy);
        ctx.lineTo(Math.cos(v2) * innerR + cx, Math.sin(v2) * innerR + cy);
    }
    ctx.closePath();
}

/* ─── Estado del worker ─── */
let canvas, ctx, W, H;
let t = 0, gAngle = 0, ledTick = 0;
let running = false;

/* Datos estables (inicializados una vez) */
let rackData = [], nodes = [], drops = [];

const ROWS = 22, LEDS = 7, FSZ = 11;
const CHARS = '01アイウエカキクNETWORKSECURITYDATA';

function initRacks() {
    rackData = Array.from({ length: ROWS * 2 }, () => ({
        leds: Array.from({ length: LEDS }, () => ({
            on:    Math.random() > 0.22,
            green: Math.random() > 0.38,
        })),
    }));
}

function initNodes() {
    nodes = Array.from({ length: 22 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.2 + 0.5,
        ph: Math.random() * Math.PI * 2,
    }));
}

function initDrops() {
    const cols = Math.floor(W / FSZ);
    drops = Array.from({ length: cols }, () => -Math.random() * 30);
}

/* ─── Funciones de dibujo ─── */

function drawServerRoom() {
    const vpX = W / 2, vpY = H * 0.4;
    // Ceil glow
    const ceil = ctx.createRadialGradient(vpX, 0, 0, vpX, 0, W * 0.35);
    ceil.addColorStop(0,    'rgba(180,220,255,0.16)');
    ceil.addColorStop(0.35, 'rgba(80,160,255,0.06)');
    ceil.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = ceil; ctx.fillRect(0, 0, W, H * 0.55);

    // Perspective lines
    ctx.lineWidth = 0.5;
    for (let side = 0; side < 2; side++) {
        const edgeX = side === 0 ? 0 : W;
        const mid   = side === 0 ? vpX * 0.3 : W - (W - vpX) * 0.3;
        for (let i = 0; i <= 7; i++) {
            const y = H * i / 7;
            ctx.beginPath(); ctx.moveTo(edgeX, y); ctx.lineTo(mid, vpY);
            ctx.strokeStyle = `rgba(0,120,200,${0.03 + (i===0||i===7?0.04:0)})`;
            ctx.stroke();
        }
    }

    // Floor glow
    const floor = ctx.createLinearGradient(0, H * 0.72, 0, H);
    floor.addColorStop(0,   'rgba(0,60,140,0)');
    floor.addColorStop(0.6, 'rgba(0,50,130,0.07)');
    floor.addColorStop(1,   'rgba(0,30,100,0.18)');
    ctx.fillStyle = floor; ctx.fillRect(0, H * 0.72, W, H * 0.28);

    // Rack columns
    const rackW = W * 0.13;
    const rh    = H / ROWS;
    for (let side = 0; side < 2; side++) {
        for (let row = 0; row < ROWS; row++) {
            const y   = row * rh;
            const idx = side * ROWS + row;
            const x0  = side === 0 ? 0 : W - rackW;
            const bg  = ctx.createLinearGradient(x0, y, x0 + rackW, y);
            if (side === 0) {
                bg.addColorStop(0,    'rgba(4,12,24,0.96)');
                bg.addColorStop(0.75, 'rgba(8,20,38,0.82)');
                bg.addColorStop(1,    'rgba(14,28,50,0.4)');
            } else {
                bg.addColorStop(0,    'rgba(14,28,50,0.4)');
                bg.addColorStop(0.25, 'rgba(8,20,38,0.82)');
                bg.addColorStop(1,    'rgba(4,12,24,0.96)');
            }
            ctx.fillStyle = bg;
            ctx.fillRect(x0, y + 0.5, rackW, rh - 1);
            ctx.strokeStyle = 'rgba(0,55,120,0.32)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x0, y + 0.5, rackW, rh - 1);

            rackData[idx].leds.forEach((led, j) => {
                if (!led.on) return;
                const lx = side === 0 ? 5 + j * 8 : W - 5 - j * 8;
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
}

function drawHexGrid() {
    const size = 56, hh = size * Math.sqrt(3);
    const cx0 = W / 2, cy0 = H * 0.58;
    const maxD = Math.sqrt(W * W + H * H) * 0.52;
    ctx.lineWidth = 0.7;
    for (let row = -1; row < H / hh + 2; row++) {
        for (let col = -1; col < W / (size * 1.5) + 2; col++) {
            const cx = col * size * 3 + (row % 2 === 0 ? 0 : size * 1.5);
            const cy = row * hh;
            const d  = Math.sqrt((cx - cx0) ** 2 + (cy - cy0) ** 2);
            const fade = Math.max(0, 1 - d / maxD);
            const clr = d < maxD * 0.35 ? '0,200,110' : '0,180,255';
            ctx.strokeStyle = `rgba(${clr},${0.025 + fade * 0.1})`;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI / 3) * i - Math.PI / 6;
                const px = cx + size * Math.cos(a), py = cy + size * Math.sin(a);
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.closePath(); ctx.stroke();
        }
    }
}

function drawGear(angle) {
    const cx = W / 2, cy = H * 0.73;
    const oR = Math.min(W * 0.38, H * 0.37);
    const iR = oR * 0.7;

    // Shadow
    const shadow = ctx.createRadialGradient(cx, cy + oR * 0.1, oR * 0.5, cx, cy, oR * 1.5);
    shadow.addColorStop(0, 'rgba(0,10,40,0.55)'); shadow.addColorStop(0.6,'rgba(0,5,25,0.2)'); shadow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = shadow; ctx.beginPath(); ctx.arc(cx, cy + oR * 0.06, oR * 1.5, 0, Math.PI * 2); ctx.fill();

    // Halo
    const halo = ctx.createRadialGradient(cx, cy, iR, cx, cy, oR * 1.35);
    halo.addColorStop(0,'rgba(0,150,255,0)'); halo.addColorStop(0.55,'rgba(0,100,220,0.05)'); halo.addColorStop(1,'rgba(0,60,180,0.14)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, oR * 1.35, 0, Math.PI * 2); ctx.fill();

    // Body
    gearPath(ctx, cx, cy, oR, iR, 13, angle);
    const metal = ctx.createLinearGradient(cx - oR * 0.85, cy - oR * 0.9, cx + oR * 0.65, cy + oR * 0.75);
    metal.addColorStop(0,   'rgba(35,58,90,0.97)'); metal.addColorStop(0.18,'rgba(28,46,74,0.95)');
    metal.addColorStop(0.45,'rgba(14,26,50,0.93)'); metal.addColorStop(0.75,'rgba(8,16,34,0.92)');
    metal.addColorStop(1,   'rgba(4,9,20,0.90)');
    ctx.fillStyle = metal; ctx.fill();

    // Specular
    ctx.save();
    gearPath(ctx, cx, cy, oR, iR, 13, angle); ctx.clip();
    const spec = ctx.createLinearGradient(cx - oR, cy - oR, cx + oR * 0.15, cy + oR * 0.15);
    spec.addColorStop(0,'rgba(90,150,220,0.11)'); spec.addColorStop(0.28,'rgba(40,100,190,0.05)'); spec.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = spec; ctx.fillRect(cx - oR, cy - oR, oR * 2, oR * 2); ctx.restore();

    ctx.strokeStyle = 'rgba(0,185,255,0.32)'; ctx.lineWidth = 1.8; ctx.stroke();
    gearPath(ctx, cx, cy, oR * 0.965, iR * 1.035, 13, angle);
    ctx.strokeStyle = 'rgba(57,255,20,0.2)'; ctx.lineWidth = 1; ctx.stroke();

    // Hub
    ctx.beginPath(); ctx.arc(cx, cy, iR * 0.55, 0, Math.PI * 2);
    const hubF = ctx.createRadialGradient(cx, cy, 0, cx, cy, iR * 0.55);
    hubF.addColorStop(0,'rgba(0,190,255,0.18)'); hubF.addColorStop(0.55,'rgba(0,120,210,0.07)'); hubF.addColorStop(1,'rgba(0,60,170,0.02)');
    ctx.fillStyle = hubF; ctx.fill();
    ctx.strokeStyle = 'rgba(0,200,255,0.5)'; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, iR * 0.35, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(0,200,255,0.28)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, iR * 0.18, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(57,255,20,0.35)'; ctx.lineWidth = 0.7; ctx.stroke();

    // Core glow
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20);
    core.addColorStop(0,'rgba(210,248,255,1)'); core.addColorStop(0.18,'rgba(0,210,255,0.95)');
    core.addColorStop(0.55,'rgba(0,160,255,0.35)'); core.addColorStop(1,'rgba(0,80,220,0)');
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(240,255,255,1)'; ctx.fill();

    return { cx, cy, oR };
}

function drawCircuits(cx, topY, pulse) {
    const BW = Math.min(W, H) * 0.12;
    const VH = H * 0.21, BVH = H * 0.13;

    const draw = (color, lw, pts) => {
        ctx.strokeStyle = color; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
    };
    const glow = (x, y, r, clr, op) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
        g.addColorStop(0, `rgba(${clr},${op})`); g.addColorStop(1, `rgba(${clr},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.5, 0, Math.PI * 2); ctx.fill();
    };
    const node = (x, y, r, isCyan, op) => {
        glow(x, y, r * 1.8, isCyan ? '0,200,255' : '57,255,20', op * 0.4);
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = isCyan ? `rgba(0,200,255,${op*0.95})` : `rgba(57,255,20,${op*0.95})`;
        ctx.lineWidth = 1.8; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = isCyan ? 'rgba(160,230,255,0.92)' : 'rgba(57,255,20,0.92)'; ctx.fill();
    };

    const cEnd = { x: cx, y: topY - VH };
    draw(`rgba(0,200,255,${pulse*0.82})`, 2.2, [{ x:cx, y:topY }, cEnd]);
    ctx.strokeStyle = `rgba(0,200,255,${pulse*0.12})`; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(cx, topY); ctx.lineTo(cEnd.x, cEnd.y); ctx.stroke();
    node(cEnd.x, cEnd.y, 12, false, pulse);

    const lMid = { x: cx - BW*0.72, y: topY - BVH };
    const lEnd = { x: cx - BW*1.85, y: lMid.y };
    draw(`rgba(57,255,20,${pulse*0.75})`, 1.7, [{ x:cx,y:topY }, lMid, lEnd]);
    node(lEnd.x, lEnd.y, 10, true, pulse);

    const rMid = { x: cx + BW*0.72, y: topY - BVH };
    const rEnd = { x: cx + BW*1.85, y: rMid.y };
    draw(`rgba(0,200,255,${pulse*0.75})`, 1.7, [{ x:cx,y:topY }, rMid, rEnd]);
    node(rEnd.x, rEnd.y, 10, false, pulse);
}

function drawRain() {
    const sideW = W * 0.18;
    ctx.font = `${FSZ}px monospace`;
    drops.forEach((y, i) => {
        const x = i * FSZ;
        if (x > sideW && x < W - sideW) return;
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillStyle = y < 2
            ? 'rgba(200,255,210,0.88)'
            : `rgba(0,210,90,${0.08 + Math.random() * 0.18})`;
        ctx.fillText(ch, x, y * FSZ);
        drops[i]++;
        if (y * FSZ > H && Math.random() > 0.975) drops[i] = -Math.random() * 28;
    });
}

/* ─── Loop de animación ─── */
function animate() {
    if (!running || !ctx) return;

    ctx.clearRect(0, 0, W, H);
    t += 0.009; gAngle += 0.0016; ledTick++;

    if (ledTick % 48 === 0) {
        rackData.forEach(row =>
            row.leds.forEach(led => { if (Math.random() > 0.965) led.on = !led.on; })
        );
    }

    drawServerRoom();
    drawHexGrid();

    // Atmospheric glow
    const atmo = ctx.createRadialGradient(W/2, H*0.62, 0, W/2, H*0.62, H*0.62);
    atmo.addColorStop(0,'rgba(0,100,230,0.1)'); atmo.addColorStop(0.42,'rgba(0,60,190,0.05)'); atmo.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = atmo; ctx.fillRect(0, 0, W, H);

    const { cx, cy, oR } = drawGear(gAngle);

    // Radar
    for (let i = 0; i < 3; i++) {
        const prog = ((t * 0.22 + i/3) % 1);
        ctx.beginPath(); ctx.arc(cx, cy, prog * oR * 1.25, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,190,255,${(1-prog)*0.22})`; ctx.lineWidth = 0.9; ctx.stroke();
    }

    drawCircuits(cx, cy - oR, 0.62 + 0.38 * Math.sin(t * 2.6));
    drawRain();

    // Nodes
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i+1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
            const d = Math.sqrt(dx*dx + dy*dy);
            if (d < 95) {
                ctx.strokeStyle = `rgba(0,180,255,${(1-d/95)*0.09})`; ctx.lineWidth = 0.5;
                ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
            }
        }
    }
    nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        n.ph += 0.04;
        const r = n.r * (0.85 + 0.15 * Math.sin(n.ph));
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r*5);
        g.addColorStop(0,'rgba(0,200,255,0.4)'); g.addColorStop(1,'rgba(0,200,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, r*5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI*2); ctx.fillStyle = 'rgba(160,230,255,0.95)'; ctx.fill();
    });
/*
    // Data streams
    for (let i = 0; i < 5; i++) {
        const y = H * (0.12 + i * 0.16);
        const off = ((t * (0.45 + i * 0.11) * 80) % (W * 2)) - W * 0.5;
        const grd = ctx.createLinearGradient(off - 110, 0, off + 110, 0);
        grd.addColorStop(0,'rgba(0,200,255,0)'); grd.addColorStop(0.5,`rgba(0,200,255,${0.07+(i%2)*0.04})`); grd.addColorStop(1,'rgba(0,200,255,0)');
        ctx.strokeStyle = grd; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(Math.max(0,off-110), y); ctx.lineTo(Math.min(W,off+110), y); ctx.stroke();
    }
        */
}

/* ─── Mensajes del main thread ─── */
self.onmessage = ({ data }) => {
    if (data.type === 'init') {
        canvas = data.canvas;
        W = data.width  || 800;
        H = data.height || 600;
        canvas.width  = W;
        canvas.height = H;
        ctx = canvas.getContext('2d');

        initRacks();
        initNodes();
        initDrops();

        running = true;

        /* requestAnimationFrame no existe en Workers — usamos setInterval a 60fps */
        setInterval(animate, 1000 / 60);
    }

    if (data.type === 'resize') {
        W = data.width;
        H = data.height;
        if (canvas) { canvas.width = W; canvas.height = H; }
        initDrops();
        initNodes();
    }

    if (data.type === 'stop') {
        running = false;
    }
};
