import { create } from 'zustand';
import { Device, DeviceEvent } from '../../shared/types/device';
import { RouterStatusSummary, RouterCredentials } from '../../shared/types/router';
import { AppSettings, BlockOptions } from '../../shared/types/ipc';

export type ViewName = 'dashboard' | 'devices' | 'blocked' | 'trusted' | 'history' | 'router' | 'settings' | 'tutorial';

interface AppState {
  currentView: ViewName;
  devices: Device[];
  events: DeviceEvent[];
  routerStatus: RouterStatusSummary | null;
  hostMacs: string[];
  settings: AppSettings | null;
  selectedDevice: Device | null;
  deviceToBlock: Device | null;
  isLoginModalOpen: boolean;
  isTutorialModalOpen: boolean;
  isMobileDrawerOpen: boolean;
  isSyncing: boolean;
  searchQuery: string;
  filterTab: 'all' | '2.4GHz' | '5GHz' | 'trusted' | 'unknown' | 'blocked';

  setCurrentView: (view: ViewName) => void;
  setSelectedDevice: (device: Device | null) => void;
  setDeviceToBlock: (device: Device | null) => void;
  setIsLoginModalOpen: (open: boolean) => void;
  setIsTutorialModalOpen: (open: boolean) => void;
  setIsMobileDrawerOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFilterTab: (tab: 'all' | '2.4GHz' | '5GHz' | 'trusted' | 'unknown' | 'blocked') => void;

  init: () => Promise<void>;
  syncDevices: () => Promise<void>;
  trustDevice: (id: string, trusted: boolean) => Promise<void>;
  renameDevice: (id: string, name: string) => Promise<void>;
  blockDevice: (id: string, options?: BlockOptions) => Promise<void>;
  unblockDevice: (id: string) => Promise<void>;
  loadHistory: (deviceId?: string) => Promise<void>;
  loginRouter: (creds: RouterCredentials) => Promise<{ success: boolean; message: string }>;
  logoutRouter: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
}

const shouldShowTutorialInitial = (): boolean => {
  try {
    return localStorage.getItem('wifiguard_has_seen_tutorial') !== 'true';
  } catch {
    return false;
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'dashboard',
  devices: [],
  events: [],
  routerStatus: null,
  hostMacs: [],
  settings: null,
  selectedDevice: null,
  deviceToBlock: null,
  isLoginModalOpen: false,
  isTutorialModalOpen: shouldShowTutorialInitial(),
  isMobileDrawerOpen: false,
  isSyncing: false,
  searchQuery: '',
  filterTab: 'all',

  setCurrentView: (view) => set({ currentView: view, isMobileDrawerOpen: false }),
  setSelectedDevice: (device) => set({ selectedDevice: device }),
  setDeviceToBlock: (device) => set({ deviceToBlock: device }),
  setIsLoginModalOpen: (open) => set({ isLoginModalOpen: open }),
  setIsTutorialModalOpen: (open) => set({ isTutorialModalOpen: open }),
  setIsMobileDrawerOpen: (open) => set({ isMobileDrawerOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterTab: (tab) => set({ filterTab: tab }),

  init: async () => {
    try {
      const [settings, devices, routerStatus, hostMacs, history] = await Promise.all([
        window.wifiGuard.settings.get(),
        window.wifiGuard.devices.getAll(),
        window.wifiGuard.router.getStatus(),
        window.wifiGuard.devices.getHostMacs(),
        window.wifiGuard.devices.getHistory()
      ]);

      set({ settings, devices, routerStatus, hostMacs, events: history });

      // Listen for background streaming updates
      window.wifiGuard.on('devices:updated', (updatedDevices: Device[]) => {
        set({ devices: updatedDevices });
        // Also refresh summary
        window.wifiGuard.router.getStatus().then(status => set({ routerStatus: status }));
      });
    } catch (err) {
      console.error('Failed to initialize app state:', err);
    }
  },

  syncDevices: async () => {
    set({ isSyncing: true });
    try {
      const devices = await window.wifiGuard.devices.refresh();
      const [routerStatus, history] = await Promise.all([
        window.wifiGuard.router.getStatus(),
        window.wifiGuard.devices.getHistory()
      ]);
      set({ devices, routerStatus, events: history });
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      set({ isSyncing: false });
    }
  },

  trustDevice: async (id: string, trusted: boolean) => {
    await window.wifiGuard.devices.trust(id, trusted);
    const devices = await window.wifiGuard.devices.getAll();
    const routerStatus = await window.wifiGuard.router.getStatus();
    set({ devices, routerStatus });
    if (get().selectedDevice?.id === id) {
      const updated = devices.find(d => d.id === id) || null;
      set({ selectedDevice: updated });
    }
  },

  renameDevice: async (id: string, name: string) => {
    await window.wifiGuard.devices.rename(id, name);
    const devices = await window.wifiGuard.devices.getAll();
    set({ devices });
    if (get().selectedDevice?.id === id) {
      const updated = devices.find(d => d.id === id) || null;
      set({ selectedDevice: updated });
    }
  },

  blockDevice: async (id: string, options?: BlockOptions) => {
    await window.wifiGuard.devices.block(id, options);
    const devices = await window.wifiGuard.devices.getAll();
    const routerStatus = await window.wifiGuard.router.getStatus();
    const history = await window.wifiGuard.devices.getHistory();
    set({ devices, routerStatus, events: history, deviceToBlock: null });
    if (get().selectedDevice?.id === id) {
      const updated = devices.find(d => d.id === id) || null;
      set({ selectedDevice: updated });
    }
  },

  unblockDevice: async (id: string) => {
    await window.wifiGuard.devices.unblock(id);
    const devices = await window.wifiGuard.devices.getAll();
    const routerStatus = await window.wifiGuard.router.getStatus();
    const history = await window.wifiGuard.devices.getHistory();
    set({ devices, routerStatus, events: history });
    if (get().selectedDevice?.id === id) {
      const updated = devices.find(d => d.id === id) || null;
      set({ selectedDevice: updated });
    }
  },

  loadHistory: async (deviceId?: string) => {
    const events = await window.wifiGuard.devices.getHistory(deviceId);
    set({ events });
  },

  loginRouter: async (creds: RouterCredentials) => {
    const res = await window.wifiGuard.router.login(creds);
    if (res.success) {
      const [routerStatus, devices, history] = await Promise.all([
        window.wifiGuard.router.getStatus(),
        window.wifiGuard.devices.getAll(),
        window.wifiGuard.devices.getHistory()
      ]);
      set({ routerStatus, devices, events: history, isLoginModalOpen: false });
    }
    return res;
  },

  logoutRouter: async () => {
    try {
      await window.wifiGuard.router.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    const routerStatus = await window.wifiGuard.router.getStatus();
    set({ routerStatus, isLoginModalOpen: false });
  },

  updateSettings: async (updates: Partial<AppSettings>) => {
    const newSettings = await window.wifiGuard.settings.update(updates);
    set({ settings: newSettings });
    // If mock toggle was changed, refresh devices
    if (typeof updates.useMockAdapter !== 'undefined') {
      await get().syncDevices();
    }
  }
}));
