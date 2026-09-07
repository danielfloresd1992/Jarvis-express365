import { ipcMain, BrowserWindow, app, session, screen } from "electron";
import { existsSync, statSync, createReadStream, writeFileSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import os from "os";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
const DEV_PORT = 5180;
const PROD_PORT = 47615;
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf"
};
function startStaticServer(rootDir, port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split("?")[0]);
      let filePath = path.join(rootDir, urlPath === "/" ? "index.html" : urlPath);
      if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
        filePath = path.join(rootDir, "index.html");
      }
      const ext = path.extname(filePath).toLowerCase();
      res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
      createReadStream(filePath).pipe(res);
    });
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}
function registerWindowControls() {
  ipcMain.on("window:minimize", (e) => {
    BrowserWindow.fromWebContents(e.sender)?.minimize();
  });
  ipcMain.on("window:maximize", (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  ipcMain.on("window:close", (e) => {
    BrowserWindow.fromWebContents(e.sender)?.close();
  });
}
function trackMaximizeState(win) {
  win.on("maximize", () => win.webContents.send("window:maximizeChange", true));
  win.on("unmaximize", () => win.webContents.send("window:maximizeChange", false));
}
function cpuTimes() {
  let idle = 0;
  let total = 0;
  for (const cpu of os.cpus()) {
    for (const type in cpu.times) total += cpu.times[type];
    idle += cpu.times.idle;
  }
  return { idle, total };
}
function startSystemStats(win, intervalMs = 1e3) {
  let prev = cpuTimes();
  const timer = setInterval(() => {
    if (win.isDestroyed()) return;
    const cur = cpuTimes();
    const idleDiff = cur.idle - prev.idle;
    const totalDiff = cur.total - prev.total;
    const cpuPercent = totalDiff > 0 ? (1 - idleDiff / totalDiff) * 100 : 0;
    prev = cur;
    const totalMem = os.totalmem();
    const usedMem = totalMem - os.freemem();
    win.webContents.send("system:stats", {
      cpu: Math.round(cpuPercent),
      ramPercent: Math.round(usedMem / totalMem * 100),
      ramUsedGb: (usedMem / 1024 / 1024 / 1024).toFixed(1),
      ramTotalGb: (totalMem / 1024 / 1024 / 1024).toFixed(1)
    });
  }, intervalMs);
  return () => clearInterval(timer);
}
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
const PRELOAD = path.join(__dirname$1, "../preload/index.js");
if (process.platform === "linux") {
  app.commandLine.appendSwitch("ozone-platform-hint", "x11");
}
let mainWindow = null;
let tabletWindow = null;
let staticServer = null;
let stopSystemStats = null;
let baseUrl = "";
const ARCHIVO_VENTANA = () => path.join(app.getPath("userData"), "ventana-tablet.json");
let guardarPendiente = null;
function leerPosicionGuardada() {
  try {
    const datos = JSON.parse(readFileSync(ARCHIVO_VENTANA(), "utf-8"));
    return posicionVisible(datos) ? datos : null;
  } catch {
    return null;
  }
}
function posicionVisible(bounds) {
  if (!bounds || typeof bounds.x !== "number" || typeof bounds.y !== "number") return false;
  return screen.getAllDisplays().some(({ workArea: a }) => bounds.x < a.x + a.width && bounds.x + (bounds.width || 0) > a.x && bounds.y < a.y + a.height && bounds.y + (bounds.height || 0) > a.y);
}
function guardarPosicion() {
  if (guardarPendiente) clearTimeout(guardarPendiente);
  guardarPendiente = setTimeout(() => {
    guardarPendiente = null;
    if (!tabletAbierta()) return;
    try {
      const { x, y, width, height } = tabletWindow.getBounds();
      writeFileSync(ARCHIVO_VENTANA(), JSON.stringify({ x, y, width, height }));
    } catch (error) {
      console.log("No se pudo guardar la posición de la tablet:", error.message);
    }
  }, 500);
}
let usbReady = false;
function setupUsbPermission() {
  if (usbReady) return;
  usbReady = true;
  session.defaultSession.setPermissionCheckHandler(() => true);
  session.defaultSession.setDevicePermissionHandler(() => true);
  let elegirDispositivo = null;
  let esperaDispositivo = null;
  const responderDispositivo = (id) => {
    if (!elegirDispositivo) return;
    const responder = elegirDispositivo;
    elegirDispositivo = null;
    if (esperaDispositivo) clearTimeout(esperaDispositivo);
    esperaDispositivo = null;
    responder(id);
  };
  session.defaultSession.on("select-usb-device", (event, details, callback) => {
    event.preventDefault();
    const lista = details.deviceList ?? [];
    console.log(`[USB] petición de dispositivo. Vistos: ${lista.length}`);
    lista.forEach((d) => console.log(`[USB]   · ${d.productName ?? "sin nombre"} — vendorId ${d.vendorId}, productId ${d.productId}`));
    if (lista[0]) return callback(lista[0].deviceId);
    console.log("[USB] lista vacía, esperando a que aparezca alguno...");
    elegirDispositivo = callback;
    esperaDispositivo = setTimeout(() => {
      console.log("[USB] no apareció ningún dispositivo en 8 s. Revisa cable y depuración USB.");
      responderDispositivo(void 0);
    }, 8e3);
  });
  session.defaultSession.on("usb-device-added", (event, device) => {
    console.log(`[USB] apareció: ${device.productName ?? "sin nombre"} — vendorId ${device.vendorId}`);
    responderDispositivo(device.deviceId);
  });
}
function tabletAbierta() {
  return !!(tabletWindow && !tabletWindow.isDestroyed());
}
function avisarEstadoTablet() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("tablet:estado", tabletAbierta());
}
function closeTabletWindow() {
  if (tabletAbierta()) tabletWindow.close();
}
function openTabletWindow() {
  if (tabletAbierta()) {
    tabletWindow.focus();
    return;
  }
  const guardada = leerPosicionGuardada();
  tabletWindow = new BrowserWindow({
    width: guardada?.width ?? 400,
    height: guardada?.height ?? 300,
    ...guardada ? { x: guardada.x, y: guardada.y } : {},
    //  sin posición previa, Electron la centra
    minWidth: 280,
    minHeight: 180,
    //  por debajo del alto pedido: si no, Electron ignora height
    resizable: true,
    frame: false,
    alwaysOnTop: true,
    backgroundColor: "#01122c",
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  tabletWindow.setAlwaysOnTop(true, "screen-saver");
  tabletWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  const keepOnTop = () => {
    if (!tabletWindow || tabletWindow.isDestroyed()) return;
    tabletWindow.setAlwaysOnTop(true, "screen-saver");
    tabletWindow.moveTop();
  };
  tabletWindow.on("blur", keepOnTop);
  const keepOnTopTimer = process.platform === "linux" ? setInterval(keepOnTop, 1e3) : null;
  tabletWindow.loadURL(`${baseUrl}?view=tablet`);
  avisarEstadoTablet();
  if (!app.isPackaged) tabletWindow.webContents.openDevTools({ mode: "detach" });
  tabletWindow.on("moved", guardarPosicion);
  tabletWindow.on("resized", guardarPosicion);
  tabletWindow.on("close", () => {
    if (guardarPendiente) clearTimeout(guardarPendiente);
    guardarPendiente = null;
    try {
      const { x, y, width, height } = tabletWindow.getBounds();
      writeFileSync(ARCHIVO_VENTANA(), JSON.stringify({ x, y, width, height }));
    } catch (error) {
      console.log("No se pudo guardar la posición de la tablet:", error.message);
    }
  });
  tabletWindow.on("closed", () => {
    if (keepOnTopTimer) clearInterval(keepOnTopTimer);
    tabletWindow = null;
    avisarEstadoTablet();
  });
}
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#010c18",
    frame: false,
    //  sin barra nativa: usamos la barra personalizada
    icon: path.join(__dirname$1, "../renderer/app-icon.png"),
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  registerWindowControls();
  trackMaximizeState(mainWindow);
  stopSystemStats = startSystemStats(mainWindow);
  ipcMain.on("tablet:open", openTabletWindow);
  ipcMain.on("tablet:close", closeTabletWindow);
  ipcMain.on("tablet:preguntarEstado", avisarEstadoTablet);
  ipcMain.on("tablet:tickets", (event, tickets) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send("tablet:tickets", tickets);
  });
  mainWindow.on("closed", () => {
    if (tabletWindow && !tabletWindow.isDestroyed()) tabletWindow.close();
    mainWindow = null;
  });
  setupUsbPermission();
  if (!app.isPackaged) {
    baseUrl = `http://localhost:${DEV_PORT}`;
    await mainWindow.loadURL(baseUrl);
    mainWindow.webContents.openDevTools();
  } else {
    const buildDir = path.join(__dirname$1, "../renderer");
    staticServer = await startStaticServer(buildDir, PROD_PORT);
    baseUrl = `http://localhost:${PROD_PORT}`;
    await mainWindow.loadURL(baseUrl);
  }
}
app.on("certificate-error", (event, webContents, url, error, certificate, callback) => {
  event.preventDefault();
  callback(true);
});
app.whenReady().then(createWindow);
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.on("window-all-closed", () => {
  if (stopSystemStats) stopSystemStats();
  if (staticServer) staticServer.close();
  if (process.platform !== "darwin") app.quit();
});
