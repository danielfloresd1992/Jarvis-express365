import { app, BrowserWindow, session, ipcMain, screen } from 'electron';
import { readFileSync, writeFileSync } from 'fs';
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


//  ─────────────────────────────────────────────────────────────────────────
//  MEMORIA DE LA VENTANA FLOTANTE
//
//  Dónde estaba y cuánto medía se guarda en un archivo dentro de la carpeta de
//  datos de la aplicación, no junto al programa: ahí Windows sí da permiso de
//  escritura, y sobrevive a reinstalaciones y a apagones.
//  ─────────────────────────────────────────────────────────────────────────
const ARCHIVO_VENTANA = () => path.join(app.getPath('userData'), 'ventana-tablet.json');

let guardarPendiente = null;


function leerPosicionGuardada() {
    try {
        const datos = JSON.parse(readFileSync(ARCHIVO_VENTANA(), 'utf-8'));
        return posicionVisible(datos) ? datos : null;
    }
    catch {
        return null;   //  primera vez, o el archivo quedó ilegible: se usa el valor por defecto
    }
}


//  ¿La posición guardada sigue cayendo dentro de alguna pantalla conectada?
//  Si alguien trabajaba con dos monitores y desconecta el segundo, restaurar
//  la ventana ahí la dejaría invisible y sin forma de recuperarla.
function posicionVisible(bounds) {
    if (!bounds || typeof bounds.x !== 'number' || typeof bounds.y !== 'number') return false;

    return screen.getAllDisplays().some(({ workArea: a }) => (
        bounds.x < a.x + a.width &&
        bounds.x + (bounds.width || 0) > a.x &&
        bounds.y < a.y + a.height &&
        bounds.y + (bounds.height || 0) > a.y
    ));
}


//  Mover y redimensionar disparan decenas de eventos por segundo. Escribir el
//  archivo en cada uno castigaría el disco sin necesidad, así que se espera a
//  que la ventana lleve medio segundo quieta.
function guardarPosicion() {
    if (guardarPendiente) clearTimeout(guardarPendiente);

    guardarPendiente = setTimeout(() => {
        guardarPendiente = null;
        if (!tabletAbierta()) return;

        try {
            const { x, y, width, height } = tabletWindow.getBounds();
            writeFileSync(ARCHIVO_VENTANA(), JSON.stringify({ x, y, width, height }));
        }
        catch (error) {
            console.log('No se pudo guardar la posición de la tablet:', error.message);
        }
    }, 500);
}


//  Permiso WEBUSB: se configura UNA sola vez en la sesión compartida por todas las ventanas.
//  (Registrarlo por ventana duplicaba el listener y el callback se llamaba dos veces -> crash.)
let usbReady = false;
function setupUsbPermission() {
    if (usbReady) return;
    usbReady = true;

    session.defaultSession.setPermissionCheckHandler(() => true);
    session.defaultSession.setDevicePermissionHandler(() => true);

    //  Al pedir un dispositivo, la lista puede llegar VACÍA: Chromium avisa primero
    //  y sigue enumerando después. Si en ese momento respondemos con deviceList[0]
    //  (undefined), el navegador entiende "no eligió ninguno" y la conexión muere
    //  con "No se seleccionó ningún dispositivo".
    //
    //  Por eso guardamos la respuesta pendiente y la contestamos en cuanto aparezca
    //  el primer dispositivo.
    let elegirDispositivo = null;
    let esperaDispositivo = null;


    //  Cierra la espera contestando UNA sola vez. 'id' undefined significa
    //  "ninguno", y del lado de la web eso se ve como dispositivo no elegido.
    const responderDispositivo = (id) => {
        if (!elegirDispositivo) return;
        const responder = elegirDispositivo;
        elegirDispositivo = null;
        if (esperaDispositivo) clearTimeout(esperaDispositivo);
        esperaDispositivo = null;
        responder(id);
    };


    session.defaultSession.on('select-usb-device', (event, details, callback) => {
        event.preventDefault();

        const lista = details.deviceList ?? [];
        console.log(`[USB] petición de dispositivo. Vistos: ${lista.length}`);
        lista.forEach(d => console.log(`[USB]   · ${d.productName ?? 'sin nombre'} — vendorId ${d.vendorId}, productId ${d.productId}`));

        if (lista[0]) return callback(lista[0].deviceId);   //  ya había uno: se elige

        //  Todavía no hay ninguno: Chromium sigue enumerando. Se espera, pero con
        //  un límite — si no, la promesa del navegador se quedaría colgada para
        //  siempre y el botón "Conectar" no daría ni error ni conexión.
        console.log('[USB] lista vacía, esperando a que aparezca alguno...');
        elegirDispositivo = callback;

        esperaDispositivo = setTimeout(() => {
            console.log('[USB] no apareció ningún dispositivo en 8 s. Revisa cable y depuración USB.');
            responderDispositivo(undefined);
        }, 8000);
    });


    session.defaultSession.on('usb-device-added', (event, device) => {
        console.log(`[USB] apareció: ${device.productName ?? 'sin nombre'} — vendorId ${device.vendorId}`);
        responderDispositivo(device.deviceId);
    });
}


//  ¿Está abierta ahora mismo la ventana flotante?
function tabletAbierta() {
    return !!(tabletWindow && !tabletWindow.isDestroyed());
}


//  Le avisamos a Jarvis si la flotante está abierta o cerrada, para que su botón
//  diga "Sacar tablet" o "Quitar tablet" según toque. Sin esto el botón mentiría
//  cuando alguien cierra la ventana desde su propia X.
function avisarEstadoTablet() {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send('tablet:estado', tabletAbierta());
}


//  Cierra la ventana flotante si está abierta
function closeTabletWindow() {
    if (tabletAbierta()) tabletWindow.close();
}


//  Abre TabletScreen como ventana flotante real del sistema (frameless, siempre encima)
function openTabletWindow() {
    if (tabletAbierta()) {
        tabletWindow.focus();
        return;
    }

    //  Si hay una posición guardada (y sigue siendo visible), se reabre justo ahí.
    const guardada = leerPosicionGuardada();

    tabletWindow = new BrowserWindow({
        width: guardada?.width ?? 400,
        height: guardada?.height ?? 300,
        ...(guardada ? { x: guardada.x, y: guardada.y } : {}),   //  sin posición previa, Electron la centra
        minWidth: 280,
        minHeight: 180,      //  por debajo del alto pedido: si no, Electron ignora height
        resizable: true,
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

    avisarEstadoTablet();   //  ya está abierta: el botón de Jarvis pasa a "Quitar tablet"

    //  En desarrollo, consola aparte para esta ventana. Sin ella los console.log
    //  de TabletScreen no se ven en ningún sitio: la flotante no tiene forma de
    //  abrir las herramientas por su cuenta.
    if (!app.isPackaged) tabletWindow.webContents.openDevTools({ mode: 'detach' });


    //  Cada vez que la muevan o la estiren, se apunta dónde quedó.
    tabletWindow.on('moved', guardarPosicion);
    tabletWindow.on('resized', guardarPosicion);

    //  Y una última vez antes de cerrarse: 'close' llega mientras la ventana
    //  todavía existe, así que aún se le pueden leer las medidas. En 'closed'
    //  ya no, y se perdería el último movimiento.
    tabletWindow.on('close', () => {
        if (guardarPendiente) clearTimeout(guardarPendiente);
        guardarPendiente = null;
        try {
            const { x, y, width, height } = tabletWindow.getBounds();
            writeFileSync(ARCHIVO_VENTANA(), JSON.stringify({ x, y, width, height }));
        }
        catch (error) {
            console.log('No se pudo guardar la posición de la tablet:', error.message);
        }
    });


    tabletWindow.on('closed', () => {
        if (keepOnTopTimer) clearInterval(keepOnTopTimer);
        tabletWindow = null;
        avisarEstadoTablet();   //  se cerró (por el botón o por su X): el de Jarvis vuelve a "Sacar tablet"
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

    //  Abrir y cerrar la ventana flotante de TabletScreen cuando el renderer lo pida
    ipcMain.on('tablet:open', openTabletWindow);
    ipcMain.on('tablet:close', closeTabletWindow);

    //  Jarvis pregunta al arrancar cómo está la flotante (por si ya estaba abierta)
    ipcMain.on('tablet:preguntarEstado', avisarEstadoTablet);

    //  CARTERO DE TICKETS: la ventana flotante lee la pantalla de la tablet y manda
    //  aquí lo que encontró; el proceso principal se lo entrega a la ventana de Jarvis.
    //  Las dos ventanas no pueden hablarse directamente — todo pasa por acá.
    ipcMain.on('tablet:tickets', (event, tickets) => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        mainWindow.webContents.send('tablet:tickets', tickets);
    });

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