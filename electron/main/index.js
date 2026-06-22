import { app, BrowserWindow, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEV_PORT, PROD_PORT } from '../config.js';
import { startStaticServer } from '../server/staticServer.js';
import { registerWindowControls, trackMaximizeState } from '../ipc/windowControls.js';
import { startSystemStats } from '../ipc/systemStats.js';


const __dirname = path.dirname(fileURLToPath(import.meta.url));


let mainWindow = null;
let staticServer = null;
let stopSystemStats = null;




async function createWindow() {

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        backgroundColor: '#010c18',
        frame: false,                 //  sin barra nativa: usamos la barra personalizada
        icon: path.join(__dirname, '../renderer/app-icon.png'),
        webPreferences: {
            preload: path.join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });


    //  CONTROLES DE VENTANA + estado maximizado + estadísticas CPU/RAM
    registerWindowControls();
    trackMaximizeState(mainWindow);
    stopSystemStats = startSystemStats(mainWindow);


    //  PERMISO WEBUSB: auto-selecciona el dispositivo cuando la página lo pide
    mainWindow.webContents.session.on('select-usb-device', (event, details, callback) => {
        event.preventDefault();
        callback(details.deviceList[0]?.deviceId);
    });
    session.defaultSession.setPermissionCheckHandler(() => true);
    session.defaultSession.setDevicePermissionHandler(() => true);


    if (!app.isPackaged) {
        //  DESARROLLO: jarvis-express ya está corriendo en el dev server de Vite
        await mainWindow.loadURL(`http://localhost:${DEV_PORT}`);
        mainWindow.webContents.openDevTools();
    }
    else {
        //  PRODUCCIÓN: servimos el build de jarvis-express en un puerto único local
        const buildDir = path.join(__dirname, '../renderer');
        staticServer = await startStaticServer(buildDir, PROD_PORT);
        await mainWindow.loadURL(`http://localhost:${PROD_PORT}`);
    }
}




//  Aceptar certificados autofirmados (HTTPS con cert propio: mkcert / certificado.crt)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);   // confía en el certificado en lugar de bloquearlo
});


app.whenReady().then(createWindow);


app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});


app.on('window-all-closed', () => {
    if (stopSystemStats) stopSystemStats();
    if (staticServer) staticServer.close();
    if (process.platform !== 'darwin') app.quit();
});