import { contextBridge, ipcRenderer } from 'electron';


//  Puente seguro: expone lo nativo a tu app React (window.electronAPI)
contextBridge.exposeInMainWorld('electronAPI', {

    platform: process.platform,
    isElectron: true,

    //  CONTROLES DE VENTANA
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close:    () => ipcRenderer.send('window:close'),

    //  Abre TabletScreen como ventana flotante del sistema
    openTabletWindow: () => ipcRenderer.send('tablet:open'),

    //  Suscripción al cambio maximizado/restaurado (devuelve función para desuscribir)
    onMaximizeChange: (callback) => {
        const handler = (e, isMax) => callback(isMax);
        ipcRenderer.on('window:maximizeChange', handler);
        return () => ipcRenderer.removeListener('window:maximizeChange', handler);
    },

    //  Suscripción a las estadísticas de CPU/RAM en tiempo real
    onSystemStats: (callback) => {
        const handler = (e, stats) => callback(stats);
        ipcRenderer.on('system:stats', handler);
        return () => ipcRenderer.removeListener('system:stats', handler);
    },
});