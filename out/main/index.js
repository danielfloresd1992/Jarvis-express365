import { ipcMain, BrowserWindow, app, session } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { existsSync, statSync, createReadStream } from "fs";
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
let mainWindow = null;
let staticServer = null;
let stopSystemStats = null;
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
      preload: path.join(__dirname$1, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  registerWindowControls();
  trackMaximizeState(mainWindow);
  stopSystemStats = startSystemStats(mainWindow);
  mainWindow.webContents.session.on("select-usb-device", (event, details, callback) => {
    event.preventDefault();
    callback(details.deviceList[0]?.deviceId);
  });
  session.defaultSession.setPermissionCheckHandler(() => true);
  session.defaultSession.setDevicePermissionHandler(() => true);
  if (!app.isPackaged) {
    await mainWindow.loadURL(`http://localhost:${DEV_PORT}`);
    mainWindow.webContents.openDevTools();
  } else {
    const buildDir = path.join(__dirname$1, "../renderer");
    staticServer = await startStaticServer(buildDir, PROD_PORT);
    await mainWindow.loadURL(`http://localhost:${PROD_PORT}`);
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
