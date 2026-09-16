const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');

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
      sandbox: false
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
