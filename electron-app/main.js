const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const DASHBOARD_FILENAME = 'Descon AP-AMC Progress & KPIs monitoring.html';

function getDashboardPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, DASHBOARD_FILENAME);
  }
  return path.join(__dirname, '..', DASHBOARD_FILENAME);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    title: 'Descon AP-AMC Progress & KPIs Monitoring',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  Menu.setApplicationMenu(null);
  win.webContents.on('did-fail-load', (_e, code, desc) => {
    dialog.showErrorBox(
      'Could not open the dashboard',
      `The dashboard file could not be loaded (${desc}, code ${code}).\n\nExpected at:\n${getDashboardPath()}`
    );
  });
  win.loadFile(getDashboardPath());
}

// Electron's window.print() dialog can't show a print preview and routes
// through the OS print pipeline, which is confusing ("This app doesn't
// support print preview") even though it can still work. Save straight to a
// PDF file instead: printToPDF renders the page using the same print media
// styles as window.print() (so the existing @media print rules still hide
// the dashboard chrome correctly), then a native Save dialog lets the user
// pick where to put it, defaulting to the report's own meaningful filename.
ipcMain.handle('print-to-pdf', async (event, suggestedFileName) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return { ok: false, error: 'No window' };
  try {
    const pdfBuffer = await win.webContents.printToPDF({ printBackground: true, pageSize: 'A4' });
    const safeName = (suggestedFileName || 'Report').replace(/[\\/:*?"<>|]+/g, '_');
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Save PDF',
      defaultPath: `${safeName}.pdf`,
      filters: [{ name: 'PDF files', extensions: ['pdf'] }]
    });
    if (canceled || !filePath) return { ok: false, canceled: true };
    fs.writeFileSync(filePath, pdfBuffer);
    return { ok: true, filePath };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// Only one copy of this app may run at a time. Without this, a second launch
// (e.g. double-clicking the exe again before the first one has fully quit)
// fights the first instance for its storage cache and silently runs with no
// persistent storage at all - anything entered in that second window is lost
// the moment it closes, even though nothing looked wrong on screen.
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const existing = BrowserWindow.getAllWindows()[0];
    if (existing) {
      if (existing.isMinimized()) existing.restore();
      existing.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
