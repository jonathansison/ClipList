const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

ipcMain.on('get-user-data-path', (event) => {
  event.returnValue = app.getPath('userData');
});

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 520,
    minHeight: 380,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});