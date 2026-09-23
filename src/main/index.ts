import { app, BrowserWindow, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDatabaseAsync, closeDatabase, SettingsRepository } from './database/db';
import { DeviceDiscoveryService } from './services/DeviceDiscoveryService';
import { MockRouterAdapter } from './router/MockRouterAdapter';
import { FiberHomeHG6145D2Adapter } from './router/FiberHomeHG6145D2Adapter';
import { setupIpcHandlers } from './ipc/handlers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let discoveryService: DeviceDiscoveryService | null = null;

// Ensure single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'WiFi Guard',
    width: 1280,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0f172a',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Load URL or local build
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Setup services & IPC
  const settings = SettingsRepository.get();
  const initialAdapter = settings.useMockAdapter
    ? new MockRouterAdapter(settings.routerIp)
    : new FiberHomeHG6145D2Adapter(settings.routerIp);

  discoveryService = new DeviceDiscoveryService(initialAdapter);
  setupIpcHandlers(discoveryService, mainWindow);

  // Initial polling if credentials or mock adapter enabled
  if (settings.useMockAdapter || settings.rememberCredentials) {
    discoveryService.startPolling(settings.autoRefreshInterval);
  }
}

app.whenReady().then(async () => {
  await initDatabaseAsync();
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  discoveryService?.stopPolling();
  closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
