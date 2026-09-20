const { contextBridge, ipcRenderer } = require('electron');

// Exposes a single, narrow function to the dashboard page: "save the current
// page as a PDF, suggesting this filename". No other Node/Electron API is
// exposed - the renderer still runs with nodeIntegration disabled.
contextBridge.exposeInMainWorld('electronAPI', {
  printToPDF: (suggestedFileName) => ipcRenderer.invoke('print-to-pdf', suggestedFileName)
});
