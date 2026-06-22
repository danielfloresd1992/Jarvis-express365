import { ipcMain, BrowserWindow } from 'electron';


//  Registra los controles de ventana (minimizar / maximizar / cerrar)
//  que dispara la barra de título desde el renderer.
export function registerWindowControls() {

    ipcMain.on('window:minimize', (e) => {
        BrowserWindow.fromWebContents(e.sender)?.minimize();
    });

    ipcMain.on('window:maximize', (e) => {
        const win = BrowserWindow.fromWebContents(e.sender);
        if (!win) return;
        if (win.isMaximized()) win.unmaximize();
        else win.maximize();
    });

    ipcMain.on('window:close', (e) => {
        BrowserWindow.fromWebContents(e.sender)?.close();
    });
}




//  Avisa al renderer cuando la ventana cambia entre maximizada / restaurada
//  (para alternar el ícono del botón de maximizar).
export function trackMaximizeState(win) {
    win.on('maximize', () => win.webContents.send('window:maximizeChange', true));
    win.on('unmaximize', () => win.webContents.send('window:maximizeChange', false));
}