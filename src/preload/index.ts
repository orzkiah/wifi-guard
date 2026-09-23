import { contextBridge, ipcRenderer } from 'electron';
import { WiFiGuardAPI } from '../shared/types/ipc';

const api: WiFiGuardAPI = {
  router: {
    detectGateway: () => ipcRenderer.invoke('router:detect-gateway'),
    getInfo: () => ipcRenderer.invoke('router:get-info'),
    testConnection: (ip?: string) => ipcRenderer.invoke('router:test-connection', ip),
    login: (creds) => ipcRenderer.invoke('router:login', creds),
    logout: () => ipcRenderer.invoke('router:logout'),
    getStatus: () => ipcRenderer.invoke('router:get-status'),
    getMacFilterConfig: () => ipcRenderer.invoke('router:get-mac-filter-config'),
  },
  devices: {
    getAll: () => ipcRenderer.invoke('devices:get-all'),
    getById: (id: string) => ipcRenderer.invoke('devices:get-by-id', id),
    refresh: () => ipcRenderer.invoke('devices:refresh'),
    trust: (id: string, trusted: boolean) => ipcRenderer.invoke('devices:trust', id, trusted),
    rename: (id: string, name: string) => ipcRenderer.invoke('devices:rename', id, name),
    block: (id: string) => ipcRenderer.invoke('devices:block', id),
    unblock: (id: string) => ipcRenderer.invoke('devices:unblock', id),
    getHistory: (deviceId?: string) => ipcRenderer.invoke('devices:get-history', deviceId),
    getHostMacs: () => ipcRenderer.invoke('devices:get-host-macs'),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (settings) => ipcRenderer.invoke('settings:update', settings),
  },
  on: (channel: string, listener: (...args: any[]) => void) => {
    const subscription = (_event: any, ...args: any[]) => listener(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  }
};

contextBridge.exposeInMainWorld('wifiGuard', api);
