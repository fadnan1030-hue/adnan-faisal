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

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
