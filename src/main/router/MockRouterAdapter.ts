import { RouterAdapter } from './RouterAdapter';
import {
  RouterInfo,
  WifiClient,
  DhcpClient,
  MacFilterConfig,
  BlockedDevice,
  ConnectionResult,
  RouterCredentials
} from '../../shared/types/router';
import { MacService } from '../services/MacService';

export class MockRouterAdapter implements RouterAdapter {
  readonly vendor = 'FiberHome';
  readonly model = 'HG6145D2 (Mock)';
  readonly ipAddress: string;

  private authenticated = true;
  private blockedDevicesList: BlockedDevice[] = [];
  private macFilteringEnabled = false;

  constructor(ipAddress = '192.168.1.1') {
    this.ipAddress = ipAddress;
  }

  async testConnection(): Promise<ConnectionResult> {
    await new Promise(r => setTimeout(r, 60));
    return {
      success: true,
      message: 'Connection to Mock FiberHome HG6145D2 successful.',
      latencyMs: 12,
      routerInfo: await this.getDeviceInfo()
    };
  }

  async login(credentials: RouterCredentials): Promise<ConnectionResult> {
    await new Promise(r => setTimeout(r, 100));
    if (credentials.username === 'invalid') {
      return { success: false, message: 'Invalid credentials.' };
    }
    this.authenticated = true;
    return {
      success: true,
      message: 'Authenticated successfully.',
      routerInfo: await this.getDeviceInfo()
    };
  }

  async logout(): Promise<void> {
    this.authenticated = false;
  }

  async getDeviceInfo(): Promise<RouterInfo> {
    return {
      id: 'mock-fiberhome-hg6145d2',
      name: 'FiberHome GPON Gateway',
      vendor: 'FiberHome',
      model: 'HG6145D2',
      firmware: 'RP3478',
      hardwareVersion: 'WKE2.094.443A11',
      ipAddress: this.ipAddress,
      subnetMask: '255.255.255.0',
      macAddress: '3C:9C:0F:00:11:22',
      operatorName: 'IDN_IMI',
      uptime: '14 days, 6 hours',
      connected: true,
      lastSync: new Date().toISOString(),
      latencyMs: 15
    };
  }

  async getWifiClients(): Promise<WifiClient[]> {
    // Return sample devices from user prompt (excluding any that are currently blocked)
    const blockedMacs = new Set(this.blockedDevicesList.map(b => MacService.normalize(b.mac)));

    const clients: WifiClient[] = [
      {
        ssid: 'Home_2.4G',
        hostname: 'Orzkiah',
        mac: '3C:9C:0F:4A:17:8A',
        ipAddress: '192.168.1.15',
        receivingRate: '57M',
        band: '2.4GHz'
      },
      {
        ssid: 'Home_5G',
        hostname: 'Redmi-13',
        mac: 'BA:02:F6:D8:64:73',
        ipAddress: '192.168.1.5',
        receivingRate: '260M',
        band: '5GHz'
      },
      {
        ssid: 'Home_5G',
        hostname: 'Galaxy-M30s',
        mac: 'FE:55:51:FF:46:E2',
        ipAddress: '192.168.1.10',
        receivingRate: '433M',
        band: '5GHz'
      },
      {
        ssid: 'Home_5G',
        hostname: 'A55-milik-putri',
        mac: '3A:AB:E8:3A:ED:56',
        ipAddress: '192.168.1.9',
        receivingRate: '260M',
        band: '5GHz'
      },
      {
        ssid: 'Home_5G',
        hostname: 'Infinix-HOT-11S-NFC',
        mac: 'A6:0E:FB:84:78:0E',
        ipAddress: '192.168.1.18',
        receivingRate: '130M',
        band: '5GHz'
      }
    ];

    return clients.filter(c => !blockedMacs.has(MacService.normalize(c.mac)));
  }

  async getDhcpClients(): Promise<DhcpClient[]> {
    return [
      { hostname: 'Orzkiah', mac: '3C:9C:0F:4A:17:8A', ipAddress: '192.168.1.15', expiresIn: '12h' },
      { hostname: 'Redmi-13', mac: 'BA:02:F6:D8:64:73', ipAddress: '192.168.1.5', expiresIn: '23h' },
      { hostname: 'Galaxy-M30s', mac: 'FE:55:51:FF:46:E2', ipAddress: '192.168.1.10', expiresIn: '18h' },
      { hostname: 'A55-milik-putri', mac: '3A:AB:E8:3A:ED:56', ipAddress: '192.168.1.9', expiresIn: '21h' },
      { hostname: 'Infinix-HOT-11S-NFC', mac: 'A6:0E:FB:84:78:0E', ipAddress: '192.168.1.18', expiresIn: '20h' },
      { hostname: 'Desktop-Workstation', mac: '00:E0:4C:68:01:23', ipAddress: '192.168.1.100', expiresIn: '24h' }
    ];
  }

  async getMacFilterConfig(): Promise<MacFilterConfig> {
    return {
      enabled: this.macFilteringEnabled,
      mode: 'BLACKLIST',
      entries: [...this.blockedDevicesList]
    };
  }

  async getBlockedDevices(): Promise<BlockedDevice[]> {
    return [...this.blockedDevicesList];
  }

  async addBlockedDevice(
    mac: string,
    comment = 'Blocked via WiFi Guard',
    options?: { timeStart?: string; timeStop?: string }
  ): Promise<void> {
    const norm = MacService.normalize(mac);
    if (!this.blockedDevicesList.some(b => MacService.normalize(b.macAddress || b.mac || '') === norm)) {
      this.blockedDevicesList.push({
        id: `rule-${this.blockedDevicesList.length + 1}`,
        macAddress: norm,
        mac: norm,
        comment,
        time: options?.timeStart ? `${options.timeStart}-${options.timeStop || '23:59'}` : undefined,
        addedAt: new Date().toISOString(),
        enabled: true
      });
      // When blocking, enable MAC filtering if user confirmed
      this.macFilteringEnabled = true;
    }
  }

  async removeBlockedDevice(mac: string): Promise<void> {
    const norm = MacService.normalize(mac);
    this.blockedDevicesList = this.blockedDevicesList.filter(b => MacService.normalize(b.macAddress || b.mac || '') !== norm);
  }
}
