/**
 * raytracer.worker.js
 * Ray tracer en CPU (JavaScript puro) que corre en un Web Worker.
 *
 * Mismo patrón que presentation.worker.js: el main thread transfiere un
 * OffscreenCanvas con { type: 'init', canvas, width, height } y este worker
 * dibuja directamente sobre él. El trazado de rayos es 100% CPU; la GPU no
 * interviene. Para que rinda en tiempo real se renderiza a baja resolución
 * (buffer interno) y luego se escala al tamaño del canvas.
 *
 * Mensajes admitidos:
 *   { type: 'init', canvas, width, height }
 *   { type: 'resize', width, height }
 *   { type: 'stop' }   { type: 'start' }
 */

/* ─────────── Estado ─────────── */
let canvas, ctx;          // canvas visible (OffscreenCanvas) y su contexto 2D
let buffer, bctx;         // buffer interno de baja resolución
let imageData, pixels;    // ImageData del buffer y su Uint8ClampedArray
let W = 800, H = 600;     // tamaño visible
let RW = 0, RH = 0;       // tamaño de render (interno)
let running = false;
let time = 0;

// Escala de render: 0.5 = la mitad de píxeles por lado (4x más rápido).
const RENDER_SCALE = 0.5;
const SAMPLES = 1;        // muestras de antialiasing por eje (1 = sin AA, más rápido)
const MAX_DEPTH = 3;      // rebotes de reflexión

/* ─────────── Vectores (tripletas planas, sin objetos por píxel) ─────────── */
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const reflect = (d, n) => sub(d, mul(n, 2 * dot(d, n)));

/* ─────────── Escena (al estilo Jarvis: azules/cian + verde) ─────────── */
function buildScene(tms) {
    const bob = Math.sin(tms * 0.0015) * 0.25;
    return {
        spheres: [
            { c: [0, 1 + bob, 0], r: 1.0, color: [0.0, 0.6, 1.0], reflect: 0.4, spec: 90 },   // cian
            { c: [-2.2, 0.8, -1.0], r: 0.8, color: [0.05, 0.2, 0.6], reflect: 0.5, spec: 120 }, // azul
            { c: [2.0, 0.6, -0.5], r: 0.6, color: [0.22, 1.0, 0.08], reflect: 0.2, spec: 60 },  // verde
            { c: [0.4, 0.4, 1.8], r: 0.4, color: [0.8, 0.95, 1.0], reflect: 0.6, spec: 200 },   // espejo claro
        ],
        light: { pos: [5, 6, 4] },
        ambient: 0.08,
        sky: (dir) => { const t = 0.5 * (dir[1] + 1); return [0.02 + t * 0.02, 0.04 + t * 0.10, 0.10 + t * 0.25]; },
    };
}

function hitSphere(ro, rd, s) {
    const oc = sub(ro, s.c);
    const b = dot(oc, rd);
    const c = dot(oc, oc) - s.r * s.r;
    const disc = b * b - c;
    if (disc < 0) return Infinity;
    const sq = Math.sqrt(disc);
    const t1 = -b - sq;
    if (t1 > 1e-3) return t1;
    const t2 = -b + sq;
    return t2 > 1e-3 ? t2 : Infinity;
}

function hitGround(ro, rd) {
    if (Math.abs(rd[1]) < 1e-6) return Infinity;
    const t = -ro[1] / rd[1];
    return t > 1e-3 ? t : Infinity;
}

function closestHit(ro, rd, scene) {
    let best = Infinity, hit = null;
    for (let i = 0; i < scene.spheres.length; i++) {
        const t = hitSphere(ro, rd, scene.spheres[i]);
        if (t < best) {
            best = t;
            const s = scene.spheres[i];
            const p = add(ro, mul(rd, t));
            hit = { point: p, normal: norm(sub(p, s.c)), color: s.color, reflect: s.reflect, spec: s.spec };
        }
    }
    const tg = hitGround(ro, rd);
    if (tg < best) {
        const p = add(ro, mul(rd, tg));
        const check = (Math.floor(p[0]) + Math.floor(p[2])) & 1;
        const base = check ? [0.85, 0.9, 0.95] : [0.05, 0.08, 0.12];
        hit = { point: p, normal: [0, 1, 0], color: base, reflect: 0.25, spec: 30 };
    }
    return hit;
}

function inShadow(point, scene) {
    const toLight = sub(scene.light.pos, point);
    const dist = Math.hypot(toLight[0], toLight[1], toLight[2]);
    const dir = mul(toLight, 1 / dist);
    const origin = add(point, mul(dir, 1e-3));
    for (let i = 0; i < scene.spheres.length; i++) {
        if (hitSphere(origin, dir, scene.spheres[i]) < dist) return true;
    }
    return false;
}

function trace(ro, rd, scene, depth) {
    const hit = closestHit(ro, rd, scene);
    if (!hit) return scene.sky(rd);

    const n = hit.normal;
    const toLight = norm(sub(scene.light.pos, hit.point));
    let diff = scene.ambient, spec = 0;
    if (!inShadow(hit.point, scene)) {
        const nl = Math.max(0, dot(n, toLight));
        diff += nl;
        if (nl > 0) {
            const half = norm(add(toLight, mul(rd, -1)));
            spec = Math.pow(Math.max(0, dot(n, half)), hit.spec);
        }
    }
    let col = [
        Math.min(1, hit.color[0] * diff + spec),
        Math.min(1, hit.color[1] * diff + spec),
        Math.min(1, hit.color[2] * diff + spec),
    ];
    if (hit.reflect > 0 && depth < MAX_DEPTH) {
        const rdir = norm(reflect(rd, n));
        const rcol = trace(add(hit.point, mul(rdir, 1e-3)), rdir, scene, depth + 1);
        const k = hit.reflect;
        col = [col[0] * (1 - k) + rcol[0] * k, col[1] * (1 - k) + rcol[1] * k, col[2] * (1 - k) + rcol[2] * k];
    }
    return col;
}

/* ─────────── Render de un fotograma sobre el buffer ─────────── */
function renderFrame() {
    const scene = buildScene(time);

    // Cámara fija mirando al origen.
    const camPos = [0, 1.5, 6];
    const forward = norm(sub([0, 1, 0], camPos));
    const right = norm([forward[2], 0, -forward[0]]);
    const up = [
        right[1] * forward[2] - right[2] * forward[1],
        right[2] * forward[0] - right[0] * forward[2],
        right[0] * forward[1] - right[1] * forward[0],
    ];
    const fov = Math.tan((60 * Math.PI) / 180 / 2);
    const aspect = RW / RH;
    const invS = 1 / (SAMPLES * SAMPLES);

    let i = 0;
    for (let y = 0; y < RH; y++) {
        for (let x = 0; x < RW; x++) {
            let r = 0, g = 0, b = 0;
            for (let sy = 0; sy < SAMPLES; sy++) {
                for (let sx = 0; sx < SAMPLES; sx++) {
                    const px = ((x + (sx + 0.5) / SAMPLES) / RW) * 2 - 1;
                    const py = 1 - ((y + (sy + 0.5) / SAMPLES) / RH) * 2;
                    const dir = norm(add(add(mul(right, px * fov * aspect), mul(up, py * fov)), forward));
                    const c = trace(camPos, dir, scene, 0);
                    r += c[0]; g += c[1]; b += c[2];
                }
            }
            pixels[i++] = Math.sqrt(r * invS) * 255; // gamma ~2.0
            pixels[i++] = Math.sqrt(g * invS) * 255;
            pixels[i++] = Math.sqrt(b * invS) * 255;
            pixels[i++] = 255;
        }
    }

    // Volcamos el buffer de baja resolución y lo escalamos al canvas visible.
    bctx.putImageData(imageData, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(buffer, 0, 0, RW, RH, 0, 0, W, H);
}

function setupBuffers() {
    RW = Math.max(1, Math.floor(W * RENDER_SCALE));
    RH = Math.max(1, Math.floor(H * RENDER_SCALE));
    buffer = new OffscreenCanvas(RW, RH);
    bctx = buffer.getContext('2d');
    imageData = bctx.createImageData(RW, RH);
    pixels = imageData.data;
}

/* ─────────── Loop (rAF no existe en Workers → setInterval) ─────────── */
let timer = null;
function loop() {
    if (!running || !ctx) return;
    time += 16;
    renderFrame();
}

/* ─────────── Mensajes ─────────── */
self.onmessage = ({ data }) => {
    if (data.type === 'init') {
        canvas = data.canvas;
        W = data.width || 800;
        H = data.height || 600;
        canvas.width = W;
        canvas.height = H;
        ctx = canvas.getContext('2d');
        setupBuffers();
        running = true;
        renderFrame();                       // primer fotograma inmediato
        timer = setInterval(loop, 1000 / 30); // ~30 fps (CPU)
    }

    if (data.type === 'resize') {
        W = data.width; H = data.height;
        if (canvas) { canvas.width = W; canvas.height = H; }
        setupBuffers();
    }

    if (data.type === 'start') {
        if (!running) { running = true; if (!timer) timer = setInterval(loop, 1000 / 30); }
    }

    if (data.type === 'stop') {
        running = false;
        if (timer) { clearInterval(timer); timer = null; }
    }
};
