"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  isElectron: true,
  //  CONTROLES DE VENTANA
  minimize: () => electron.ipcRenderer.send("window:minimize"),
  maximize: () => electron.ipcRenderer.send("window:maximize"),
  close: () => electron.ipcRenderer.send("window:close"),
  //  Abre TabletScreen como ventana flotante del sistema
  openTabletWindow: () => electron.ipcRenderer.send("tablet:open"),
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
