const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const net = require('net');
const { spawn } = require('child_process');
const fs = require('fs');

app.disableHardwareAcceleration();

let mainWindow;
let backendProcess;
let backendPort;

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

async function createWindow() {
  backendPort = await getFreePort();
  console.log(`[electron] Starting backend on port ${backendPort}`);

  const isDev = !app.isPackaged;
  let backendPath;
  if (isDev) {
    backendPath = path.join(__dirname, '../dist_backend', 'backend.exe');
  } else {
    // electron-builder will copy dist_backend into resources/backend
    backendPath = path.join(process.resourcesPath, 'backend', 'backend.exe');
  }

  if (fs.existsSync(backendPath)) {
      backendProcess = spawn(backendPath, [backendPort.toString()]);
      backendProcess.on('error', (err) => console.error("Failed to start backend:", err));
  } else {
      console.warn("Backend executable not found at:", backendPath);
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    autoHideMenuBar: true
  });

  // Give backend a moment to start
  setTimeout(() => {
    if (isDev && !fs.existsSync(path.join(__dirname, '../dist', 'index.html'))) {
      mainWindow.loadURL(`http://localhost:5173?port=${backendPort}`);
    } else {
      mainWindow.loadFile(path.join(__dirname, '../dist', 'index.html'), { search: `port=${backendPort}` });
    }
  }, 1500);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  app.quit();
});

ipcMain.on('get-backend-port-sync', (event) => {
  event.returnValue = backendPort;
});

ipcMain.handle('export-to-pdf', async (event) => {
  try {
    const pdfData = await mainWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4'
    });
    
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Dashboard as PDF',
      defaultPath: 'Vahan_Dashboard.pdf',
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });

    if (filePath) {
      fs.writeFileSync(filePath, pdfData);
      return { success: true, filePath };
    }
    return { success: false, cancelled: true };
  } catch (error) {
    console.error('Failed to export PDF', error);
    return { success: false, error: error.message };
  }
});
