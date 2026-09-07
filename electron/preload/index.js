import { contextBridge, ipcRenderer } from 'electron';


//  Puente seguro: expone lo nativo a tu app React (window.electronAPI)
contextBridge.exposeInMainWorld('electronAPI', {

    platform: process.platform,
    isElectron: true,

    //  CONTROLES DE VENTANA
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close:    () => ipcRenderer.send('window:close'),

    //  Abre y cierra TabletScreen como ventana flotante del sistema
    openTabletWindow:  () => ipcRenderer.send('tablet:open'),
    closeTabletWindow: () => ipcRenderer.send('tablet:close'),

    //  Saber si la flotante está abierta, para que el botón diga lo correcto.
    //  'preguntarEstado' se llama al montar; 'onTabletState' escucha los cambios.
    preguntarEstadoTablet: () => ipcRenderer.send('tablet:preguntarEstado'),

    onTabletState: (callback) => {
        const handler = (e, abierta) => callback(abierta);
        ipcRenderer.on('tablet:estado', handler);
        return () => ipcRenderer.removeListener('tablet:estado', handler);
    },

    //  TICKETS — la ventana flotante los manda, la de Jarvis los escucha.
    //  Mismo patrón que onSystemStats: 'send' para mandar, 'on' para recibir.
    enviarTickets: (tickets) => ipcRenderer.send('tablet:tickets', tickets),

    onTickets: (callback) => {
        const handler = (e, tickets) => callback(tickets);
        ipcRenderer.on('tablet:tickets', handler);
        return () => ipcRenderer.removeListener('tablet:tickets', handler);
    },

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