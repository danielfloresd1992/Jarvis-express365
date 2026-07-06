import { app, BrowserWindow, session, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEV_PORT, PROD_PORT } from '../config.js';
import { startStaticServer } from '../server/staticServer.js';
import { registerWindowControls, trackMaximizeState } from '../ipc/windowControls.js';
import { startSystemStats } from '../ipc/systemStats.js';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRELOAD = path.join(__dirname, '../preload/index.js');


//  En Linux/Wayland el "always-on-top" NO existe en el protocolo, así que forzamos
//  el backend X11 (XWayland), donde sí se respeta. (En la app empaquetada no hay
//  variable de entorno del script, por eso lo fijamos también aquí.)
if (process.platform === 'linux') {
    app.commandLine.appendSwitch('ozone-platform-hint', 'x11');
}


let mainWindow = null;
let tabletWindow = null;
let staticServer = null;
let stopSystemStats = null;
let baseUrl = '';      //  url que sirve jarvis-express (dev o prod), la reusan ambas ventanas


//  Permiso WEBUSB: se configura UNA sola vez en la sesión compartida por todas las ventanas.
//  (Registrarlo por ventana duplicaba el listener y el callback se llamaba dos veces -> crash.)
let usbReady = false;
function setupUsbPermission() {
    if (usbReady) return;
    usbReady = true;

    session.defaultSession.setPermissionCheckHandler(() => true);
    session.defaultSession.setDevicePermissionHandler(() => true);
    session.defaultSession.on('select-usb-device', (event, details, callback) => {
        event.preventDefault();
        callback(details.deviceList[0]?.deviceId);
    });
}


//  Abre TabletScreen como ventana flotante real del sistema (frameless, siempre encima)
function openTabletWindow() {
    if (tabletWindow && !tabletWindow.isDestroyed()) {
        tabletWindow.focus();
        return;
    }

    tabletWindow = new BrowserWindow({
        width: 360,
        height: 620,
        minWidth: 260,
        minHeight: 340,
        frame: false,
        alwaysOnTop: true,
        backgroundColor: '#01122c',
        webPreferences: {
            preload: PRELOAD,
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    //  SIEMPRE ENCIMA DE TODO: nivel 'screen-saver' (el más alto) supera pantalla completa
    //  y otras ventanas always-on-top. Y visible en todos los escritorios virtuales.
    tabletWindow.setAlwaysOnTop(true, 'screen-saver');
    tabletWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });


    //  Re-afirmar el "siempre encima" al perder el foco (Windows y Linux).
    const keepOnTop = () => {
        if (!tabletWindow || tabletWindow.isDestroyed()) return;
        tabletWindow.setAlwaysOnTop(true, 'screen-saver');
        tabletWindow.moveTop();      //  sube la ventana sin robarle el foco a la otra
    };
    tabletWindow.on('blur', keepOnTop);

    //  En Linux los window managers sueltan el hint con frecuencia: intervalo de respaldo.
    //  En Windows el alwaysOnTop nativo ya es fiable, así que ahí no hace falta forzar.
    const keepOnTopTimer = process.platform === 'linux' ? setInterval(keepOnTop, 1000) : null;


    tabletWindow.loadURL(`${baseUrl}?view=tablet`);   //  el renderer detecta ?view=tablet

    tabletWindow.on('closed', () => {
        if (keepOnTopTimer) clearInterval(keepOnTopTimer);
        tabletWindow = null;
    });
}




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
            preload: PRELOAD,
            contextIsolation: true,
            nodeIntegration: false,
        },
    });


    //  CONTROLES DE VENTANA + estado maximizado + estadísticas CPU/RAM
    registerWindowControls();
    trackMaximizeState(mainWindow);
    stopSystemStats = startSystemStats(mainWindow);

    //  Abrir la ventana flotante de TabletScreen cuando el renderer lo pida
    ipcMain.on('tablet:open', openTabletWindow);

    //  Al cerrar la ventana principal, cerramos también la flotante (no debe quedar suelta)
    mainWindow.on('closed', () => {
        if (tabletWindow && !tabletWindow.isDestroyed()) tabletWindow.close();
        mainWindow = null;
    });


    //  PERMISO WEBUSB (una sola vez para toda la app)
    setupUsbPermission();


    if (!app.isPackaged) {
        //  DESARROLLO: jarvis-express ya está corriendo en el dev server de Vite
        baseUrl = `http://localhost:${DEV_PORT}`;
        await mainWindow.loadURL(baseUrl);
        mainWindow.webContents.openDevTools();
    }
    else {
        //  PRODUCCIÓN: servimos el build de jarvis-express en un puerto único local
        const buildDir = path.join(__dirname, '../renderer');
        staticServer = await startStaticServer(buildDir, PROD_PORT);
        baseUrl = `http://localhost:${PROD_PORT}`;
        await mainWindow.loadURL(baseUrl);
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