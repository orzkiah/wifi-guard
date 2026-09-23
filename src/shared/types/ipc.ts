import { Device, DeviceEvent } from './device';
import {
  RouterInfo,
  RouterCredentials,
  ConnectionResult,
  MacFilterConfig,
  RouterStatusSummary
} from './router';

export interface AppSettings {
  autoRefreshInterval: number; // in seconds (5, 10, 30, 60, 0 = manual)
  startWithWindows: boolean;
  minimizeToTray: boolean;
  notificationsEnabled: boolean;
  unknownDeviceAlert: boolean;
  theme: 'system' | 'light' | 'dark';
  routerIp: string;
  routerUsername: string;
  rememberCredentials: boolean;
  useMockAdapter: boolean;
}

export interface BlockOptions {
  mode: 'PERMANENT' | 'DURATION' | 'SCHEDULE';
  durationMinutes?: number;
  timeStart?: string;
  timeStop?: string;
}

export interface WiFiGuardAPI {
  router: {
    detectGateway: () => Promise<string>;
    getInfo: () => Promise<RouterInfo | null>;
    testConnection: (ip?: string) => Promise<ConnectionResult>;
    login: (credentials: RouterCredentials) => Promise<ConnectionResult>;
    logout: () => Promise<void>;
    getStatus: () => Promise<RouterStatusSummary>;
    getMacFilterConfig: () => Promise<MacFilterConfig>;
  };
  devices: {
    getAll: () => Promise<Device[]>;
    getById: (id: string) => Promise<Device | null>;
    refresh: () => Promise<Device[]>;
    trust: (id: string, trusted: boolean) => Promise<void>;
    rename: (id: string, name: string) => Promise<void>;
    block: (id: string, options?: BlockOptions) => Promise<void>;
    unblock: (id: string) => Promise<void>;
    getHistory: (deviceId?: string) => Promise<DeviceEvent[]>;
    getHostMacs: () => Promise<string[]>;
  };
  settings: {
    get: () => Promise<AppSettings>;
    update: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  };
  on: (channel: string, listener: (...args: any[]) => void) => () => void;
}

declare global {
  interface Window {
    wifiGuard: WiFiGuardAPI;
  }
}
