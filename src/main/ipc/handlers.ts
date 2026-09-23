import { ipcMain, BrowserWindow } from 'electron';
import { DeviceRepository, EventRepository, SettingsRepository } from '../database/db';
import { DeviceDiscoveryService } from '../services/DeviceDiscoveryService';
import { SelfBlockService } from '../services/SelfBlockService';
import { MacService } from '../services/MacService';
import { GatewayDiscovery } from '../router/discovery/GatewayDiscovery';
import { MockRouterAdapter } from '../router/MockRouterAdapter';
import { FiberHomeHG6145D2Adapter } from '../router/FiberHomeHG6145D2Adapter';
import { SecurityService } from '../services/SecurityService';
import { RouterCredentials, RouterStatusSummary } from '../../shared/types/router';
import { AppSettings, BlockOptions } from '../../shared/types/ipc';

export function setupIpcHandlers(
  discoveryService: DeviceDiscoveryService,
  mainWindow: BrowserWindow
): void {
  // ROUTER HANDLERS
  ipcMain.handle('router:detect-gateway', async () => {
    return GatewayDiscovery.detectGateway();
  });

  ipcMain.handle('router:get-info', async () => {
    try {
      return await discoveryService.getAdapter().getDeviceInfo();
    } catch {
      return null;
    }
  });

  ipcMain.handle('router:test-connection', async (_event, ip?: string) => {
    const targetIp = ip || SettingsRepository.get().routerIp || '192.168.1.1';
    const settings = SettingsRepository.get();

    if (settings.useMockAdapter) {
      const mock = new MockRouterAdapter(targetIp);
      return mock.testConnection();
    }

    const adapter = new FiberHomeHG6145D2Adapter(targetIp);
    return adapter.testConnection();
  });

  ipcMain.handle('router:login', async (_event, creds: RouterCredentials) => {
    const settings = SettingsRepository.get();
    let adapter = discoveryService.getAdapter();

    // If target IP or mock mode changed, instantiate appropriate adapter
    if (settings.useMockAdapter) {
      adapter = new MockRouterAdapter(creds.ipAddress);
    } else {
      adapter = new FiberHomeHG6145D2Adapter(creds.ipAddress);
    }

    discoveryService.setAdapter(adapter);
    const result = await adapter.login(creds);

    if (result.success) {
      if (creds.remember) {
        SecurityService.savePassword(creds.password || '');
        SettingsRepository.update({
          routerIp: creds.ipAddress,
          routerUsername: creds.username,
          rememberCredentials: true
        });
      } else {
        SecurityService.clearCredentials();
        SettingsRepository.update({ rememberCredentials: false });
      }

      // Record router connection event
      EventRepository.create({
        routerId: adapter.model,
        eventType: 'ROUTER_CONNECTED',
        metadataJson: JSON.stringify({ ip: creds.ipAddress })
      });

      // Start device discovery loop
      discoveryService.startPolling(settings.autoRefreshInterval);
    }

    return result;
  });

  ipcMain.handle('router:logout', async () => {
    const adapter = discoveryService.getAdapter();
    await adapter.logout();
    discoveryService.stopPolling();
    EventRepository.create({
      routerId: adapter.model,
      eventType: 'ROUTER_DISCONNECTED',
      metadataJson: '{}'
    });
  });

  ipcMain.handle('router:get-status', async (): Promise<RouterStatusSummary> => {
    const devices = DeviceRepository.getAll();
    const adapter = discoveryService.getAdapter();
    let info = undefined;
    let connected = false;
    let latencyMs = 0;
    let error = undefined;

    try {
      const test = await adapter.testConnection();
      connected = test.success;
      info = test.routerInfo;
      latencyMs = test.latencyMs || 0;
    } catch (err: any) {
      connected = false;
      error = err.message;
    }

    return {
      connected,
      routerInfo: info,
      totalDevices: devices.length,
      onlineDevices: devices.filter(d => d.status === 'ONLINE').length,
      trustedDevices: devices.filter(d => d.trusted).length,
      unknownDevices: devices.filter(d => !d.trusted && d.status === 'ONLINE').length,
      blockedDevices: devices.filter(d => d.blocked).length,
      lastSync: new Date().toISOString(),
      latencyMs,
      error
    };
  });

  ipcMain.handle('router:get-mac-filter-config', async () => {
    return discoveryService.getAdapter().getMacFilterConfig();
  });

  // DEVICE HANDLERS
  ipcMain.handle('devices:get-all', async () => {
    return DeviceRepository.getAll();
  });

  ipcMain.handle('devices:get-by-id', async (_event, id: string) => {
    return DeviceRepository.getById(id);
  });

  ipcMain.handle('devices:refresh', async () => {
    return discoveryService.syncDevices();
  });

  ipcMain.handle('devices:trust', async (_event, id: string, trusted: boolean) => {
    DeviceRepository.setTrusted(id, trusted);
    const dev = DeviceRepository.getById(id);
    if (dev) {
      EventRepository.create({
        deviceId: id,
        eventType: trusted ? 'DEVICE_TRUSTED' : 'DEVICE_UNTRUSTED',
        metadataJson: JSON.stringify({ mac: dev.macAddress, name: dev.customName || dev.hostname })
      });
    }
  });

  ipcMain.handle('devices:rename', async (_event, id: string, name: string) => {
    DeviceRepository.setCustomName(id, name);
    const dev = DeviceRepository.getById(id);
    if (dev) {
      EventRepository.create({
        deviceId: id,
        eventType: 'DEVICE_RENAMED',
        metadataJson: JSON.stringify({ customName: name, previous: dev.hostname })
      });
    }
  });

  ipcMain.handle('devices:block', async (_event, id: string, options?: BlockOptions) => {
    const dev = DeviceRepository.getById(id);
    if (!dev) throw new Error('Device not found');

    // Self-lockout check
    SelfBlockService.assertNotHost(dev.macAddress);

    let unblockAt: string | undefined;
    let blockSchedule: { timeStart: string; timeStop: string } | undefined;
    let adapterOptions: { timeStart?: string; timeStop?: string } | undefined;

    if (options?.mode === 'DURATION' && options.durationMinutes && options.durationMinutes > 0) {
      const expiry = new Date(Date.now() + options.durationMinutes * 60 * 1000);
      unblockAt = expiry.toISOString();
    } else if (options?.mode === 'SCHEDULE' && options.timeStart && options.timeStop) {
      blockSchedule = {
        timeStart: options.timeStart,
        timeStop: options.timeStop
      };
      adapterOptions = {
        timeStart: options.timeStart,
        timeStop: options.timeStop
      };
    }

    // Call adapter
    await discoveryService.getAdapter().addBlockedDevice(
      dev.macAddress,
      `Blocked: ${dev.customName || dev.hostname}`,
      adapterOptions
    );

    // Update DB
    DeviceRepository.setBlocked(id, true, unblockAt || null, blockSchedule || null);
    DeviceRepository.upsert({
      ...dev,
      blocked: true,
      status: 'BLOCKED',
      unblockAt,
      blockSchedule
    });

    // Log Event
    EventRepository.create({
      deviceId: id,
      eventType: 'DEVICE_BLOCKED',
      metadataJson: JSON.stringify({
        mac: dev.macAddress,
        hostname: dev.hostname,
        mode: options?.mode || 'PERMANENT',
        unblockAt,
        blockSchedule
      })
    });

    // Refresh active devices
    await discoveryService.syncDevices();
  });

  ipcMain.handle('devices:unblock', async (_event, id: string) => {
    const dev = DeviceRepository.getById(id);
    if (!dev) throw new Error('Device not found');

    await discoveryService.getAdapter().removeBlockedDevice(dev.macAddress);

    DeviceRepository.setBlocked(id, false, null, null);
    DeviceRepository.upsert({
      ...dev,
      blocked: false,
      status: 'ONLINE',
      unblockAt: undefined,
      blockSchedule: undefined
    });

    EventRepository.create({
      deviceId: id,
      eventType: 'DEVICE_UNBLOCKED',
      metadataJson: JSON.stringify({ mac: dev.macAddress })
    });

    await discoveryService.syncDevices();
  });

  ipcMain.handle('devices:get-history', async (_event, deviceId?: string) => {
    return EventRepository.getRecent(deviceId, 100);
  });

  ipcMain.handle('devices:get-host-macs', async () => {
    return SelfBlockService.getHostMacAddresses();
  });

  // SETTINGS HANDLERS
  ipcMain.handle('settings:get', async () => {
    const s = SettingsRepository.get();
    if (s.rememberCredentials && !s.routerUsername) {
      s.routerUsername = 'admin';
    }
    return s;
  });

  ipcMain.handle('settings:update', async (_event, updates: Partial<AppSettings>) => {
    const updated = SettingsRepository.update(updates);

    // If mock toggle was changed, update active adapter
    if (typeof updates.useMockAdapter !== 'undefined') {
      if (updates.useMockAdapter) {
        discoveryService.setAdapter(new MockRouterAdapter(updated.routerIp));
      } else {
        discoveryService.setAdapter(new FiberHomeHG6145D2Adapter(updated.routerIp));
      }
    }

    // If refresh interval changed, restart polling
    if (typeof updates.autoRefreshInterval !== 'undefined') {
      discoveryService.startPolling(updates.autoRefreshInterval);
    }

    return updated;
  });

  // Stream device updates to renderer
  discoveryService.onUpdate(devices => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('devices:updated', devices);
    }
  });
}
