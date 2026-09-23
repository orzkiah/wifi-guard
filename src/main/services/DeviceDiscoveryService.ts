import { Notification } from 'electron';
import { Device, DeviceBand } from '../../shared/types/device';
import { RouterAdapter } from '../router/RouterAdapter';
import { DeviceRepository, EventRepository, SettingsRepository } from '../database/db';
import { MacService } from './MacService';
import { SelfBlockService } from './SelfBlockService';

export class DeviceDiscoveryService {
  private adapter: RouterAdapter;
  private pollingTimer: NodeJS.Timeout | null = null;
  private isPolling = false;
  private consecutiveFailures = 0;
  private onUpdateCallback?: (devices: Device[]) => void;

  constructor(adapter: RouterAdapter) {
    this.adapter = adapter;
  }

  setAdapter(adapter: RouterAdapter): void {
    this.adapter = adapter;
  }

  getAdapter(): RouterAdapter {
    return this.adapter;
  }

  onUpdate(cb: (devices: Device[]) => void): void {
    this.onUpdateCallback = cb;
  }

  /**
   * Performs a single synchronization cycle:
   * 1. Fetches Wi-Fi clients & DHCP clients from adapter
   * 2. Merges by normalized MAC address
   * 3. Detects new devices and alerts
   * 4. Updates SQLite database
   * 5. Emits updated list
   */
  async syncDevices(): Promise<Device[]> {
    if (this.isPolling) return DeviceRepository.getAll();
    this.isPolling = true;

    try {
      const now = new Date().toISOString();

      // Check and execute automatic unblock for expired timers
      const expiredDevices = DeviceRepository.getExpiredBlockedDevices(now);
      for (const exp of expiredDevices) {
        try {
          await this.adapter.removeBlockedDevice(exp.macAddress);
          DeviceRepository.setBlocked(exp.id, false, null, null);
          DeviceRepository.upsert({
            ...exp,
            blocked: false,
            status: 'ONLINE',
            unblockAt: undefined,
            blockSchedule: undefined
          });
          EventRepository.create({
            deviceId: exp.id,
            routerId: this.adapter.model || 'router',
            eventType: 'DEVICE_UNBLOCKED',
            metadataJson: JSON.stringify({
              mac: exp.macAddress,
              reason: 'Scheduled auto-unblock timer expired'
            })
          });

          // Show Notification
          const settings = SettingsRepository.get();
          if (settings.notificationsEnabled) {
            try {
              if (Notification.isSupported()) {
                const notif = new Notification({
                  title: 'WiFi Guard: Blokir Selesai',
                  body: `Akses internet untuk ${exp.customName || exp.hostname || exp.macAddress} telah dibuka kembali secara otomatis.`,
                  urgency: 'normal'
                });
                notif.show();
              }
            } catch {
              // ignore
            }
          }
        } catch (unblockErr) {
          console.error(`Failed to auto-unblock expired device ${exp.macAddress}:`, unblockErr);
        }
      }

      const [wifiClients, dhcpClients, blockedEntries] = await Promise.all([
        this.adapter.getWifiClients().catch(() => []),
        this.adapter.getDhcpClients().catch(() => []),
        this.adapter.getBlockedDevices().catch(() => [])
      ]);

      const blockedMacs = new Set(blockedEntries.map(b => MacService.normalize(b.mac)));
      const hostMacs = new Set(SelfBlockService.getHostMacAddresses());

      // Map to merge by MAC
      const deviceMap = new Map<string, {
        mac: string;
        ip: string;
        hostname: string;
        ssid: string;
        band: DeviceBand;
        rate: string;
        source: 'WIFI_CLIENT_LIST' | 'DHCP_CLIENT_LIST';
      }>();

      // 1. Process Wi-Fi clients
      for (const w of wifiClients) {
        if (!MacService.isValid(w.mac)) continue;
        const mac = MacService.normalize(w.mac);
        deviceMap.set(mac, {
          mac,
          ip: w.ipAddress,
          hostname: w.hostname,
          ssid: w.ssid,
          band: w.band === '5GHz' ? '5GHz' : '2.4GHz',
          rate: w.receivingRate,
          source: 'WIFI_CLIENT_LIST'
        });
      }

      // 2. Process & merge DHCP clients
      for (const d of dhcpClients) {
        if (!MacService.isValid(d.mac)) continue;
        const mac = MacService.normalize(d.mac);
        const existing = deviceMap.get(mac);

        if (existing) {
          // Merge: enrich hostname or IP if Wi-Fi was missing them
          if (!existing.hostname && d.hostname) {
            existing.hostname = d.hostname;
          }
          if (!existing.ip && d.ipAddress) {
            existing.ip = d.ipAddress;
          }
        } else {
          // Device active in DHCP but not in Wi-Fi list (e.g. Ethernet / wired or dormant)
          deviceMap.set(mac, {
            mac,
            ip: d.ipAddress,
            hostname: d.hostname,
            ssid: '',
            band: 'ETHERNET',
            rate: '',
            source: 'DHCP_CLIENT_LIST'
          });
        }
      }

      const activeMacs: string[] = [];
      const currentRouterId = this.adapter.model || 'router';

      // 3. Update SQLite and trigger events
      for (const [mac, data] of deviceMap.entries()) {
        activeMacs.push(mac);
        const existingInDb = DeviceRepository.getByMac(mac);
        const isBlocked = blockedMacs.has(mac);
        const vendor = MacService.getVendor(mac, data.hostname);

        if (!existingInDb) {
          // NEW DEVICE DETECTED!
          const newDevice = DeviceRepository.upsert({
            routerId: currentRouterId,
            macAddress: mac,
            ipAddress: data.ip,
            hostname: data.hostname,
            vendor,
            ssid: data.ssid,
            band: data.band,
            receivingRate: data.rate,
            customName: hostMacs.has(mac) ? 'This Computer' : '',
            trusted: hostMacs.has(mac), // Automatically trust host PC
            blocked: isBlocked,
            status: isBlocked ? 'BLOCKED' : 'ONLINE',
            source: data.source,
            firstSeen: now,
            lastSeen: now
          });

          // Log History Event
          EventRepository.create({
            deviceId: newDevice.id,
            routerId: currentRouterId,
            eventType: 'DEVICE_FIRST_SEEN',
            metadataJson: JSON.stringify({
              hostname: data.hostname,
              ip: data.ip,
              mac,
              vendor,
              band: data.band
            })
          });

          // Trigger OS Notification
          const settings = SettingsRepository.get();
          if (settings.notificationsEnabled && settings.unknownDeviceAlert && !hostMacs.has(mac)) {
            try {
              if (Notification.isSupported()) {
                const notif = new Notification({
                  title: 'WiFi Guard: New Device Detected',
                  body: `${data.hostname || vendor || 'Unknown Device'} (${data.ip || mac}) connected to your network.`,
                  urgency: 'normal'
                });
                notif.show();
              }
            } catch {
              // Ignore notification errors in test environments
            }
          }
        } else {
          // Existing device: update status and check connection transitions
          const wasOffline = existingInDb.status === 'OFFLINE';

          DeviceRepository.upsert({
            ...existingInDb,
            ipAddress: data.ip || existingInDb.ipAddress,
            hostname: data.hostname || existingInDb.hostname,
            vendor: vendor !== 'Unknown Vendor' ? vendor : existingInDb.vendor,
            ssid: data.ssid || existingInDb.ssid,
            band: data.band !== 'UNKNOWN' ? data.band : existingInDb.band,
            receivingRate: data.rate || existingInDb.receivingRate,
            blocked: isBlocked,
            status: isBlocked ? 'BLOCKED' : 'ONLINE',
            lastSeen: now
          });

          if (wasOffline) {
            EventRepository.create({
              deviceId: existingInDb.id,
              routerId: currentRouterId,
              eventType: 'DEVICE_CONNECTED',
              metadataJson: JSON.stringify({ ip: data.ip, rate: data.rate })
            });
          }
        }
      }

      // 4. Mark devices not seen in this cycle as OFFLINE
      DeviceRepository.markAllOffline(activeMacs);

      this.consecutiveFailures = 0;
      const allDevices = DeviceRepository.getAll();
      this.onUpdateCallback?.(allDevices);
      return allDevices;
    } catch (err) {
      this.consecutiveFailures++;
      throw err;
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Starts periodic polling based on user setting (5s, 10s, 30s, etc.)
   * Includes exponential backoff upon router failure.
   */
  startPolling(intervalSec = 5): void {
    this.stopPolling();
    if (intervalSec <= 0) return; // Manual refresh mode

    const runLoop = async () => {
      try {
        await this.syncDevices();
      } catch {
        // Router offline or unreachable
      }

      // Compute next delay with exponential backoff if failing
      let nextDelayMs = intervalSec * 1000;
      if (this.consecutiveFailures > 0) {
        nextDelayMs = Math.min(intervalSec * 1000 * Math.pow(1.5, this.consecutiveFailures), 30000);
      }

      this.pollingTimer = setTimeout(runLoop, nextDelayMs);
    };

    // Run first sync immediately
    runLoop();
  }

  stopPolling(): void {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = null;
    }
  }
}
