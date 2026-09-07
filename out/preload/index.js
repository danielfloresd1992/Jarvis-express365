"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  isElectron: true,
  //  CONTROLES DE VENTANA
  minimize: () => electron.ipcRenderer.send("window:minimize"),
  maximize: () => electron.ipcRenderer.send("window:maximize"),
  close: () => electron.ipcRenderer.send("window:close"),
  //  Abre y cierra TabletScreen como ventana flotante del sistema
  openTabletWindow: () => electron.ipcRenderer.send("tablet:open"),
  closeTabletWindow: () => electron.ipcRenderer.send("tablet:close"),
  //  Saber si la flotante está abierta, para que el botón diga lo correcto.
  //  'preguntarEstado' se llama al montar; 'onTabletState' escucha los cambios.
  preguntarEstadoTablet: () => electron.ipcRenderer.send("tablet:preguntarEstado"),
  onTabletState: (callback) => {
    const handler = (e, abierta) => callback(abierta);
    electron.ipcRenderer.on("tablet:estado", handler);
    return () => electron.ipcRenderer.removeListener("tablet:estado", handler);
  },
  //  TICKETS — la ventana flotante los manda, la de Jarvis los escucha.
  //  Mismo patrón que onSystemStats: 'send' para mandar, 'on' para recibir.
  enviarTickets: (tickets) => electron.ipcRenderer.send("tablet:tickets", tickets),
  onTickets: (callback) => {
    const handler = (e, tickets) => callback(tickets);
    electron.ipcRenderer.on("tablet:tickets", handler);
    return () => electron.ipcRenderer.removeListener("tablet:tickets", handler);
  },
  //  Suscripción al cambio maximizado/restaurado (devuelve función para desuscribir)
  onMaximizeChange: (callback) => {
    const handler = (e, isMax) => callback(isMax);
    electron.ipcRenderer.on("window:maximizeChange", handler);
    return () => electron.ipcRenderer.removeListener("window:maximizeChange", handler);
  },
  //  Suscripción a las estadísticas de CPU/RAM en tiempo real
  onSystemStats: (callback) => {
    const handler = (e, stats) => callback(stats);
    electron.ipcRenderer.on("system:stats", handler);
    return () => electron.ipcRenderer.removeListener("system:stats", handler);
  }
});
