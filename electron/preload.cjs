const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getBackendPortSync: () => ipcRenderer.sendSync('get-backend-port-sync'),
  exportToPDF: () => ipcRenderer.invoke('export-to-pdf')
});
