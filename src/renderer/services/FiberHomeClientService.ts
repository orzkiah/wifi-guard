import { Capacitor } from '@capacitor/core';
import CryptoJS from 'crypto-js';
import {
  RouterCredentials,
  RouterInfo,
  ConnectionResult,
  WifiClient,
  DhcpClient,
  MacFilterConfig,
  BlockedDevice
} from '../../shared/types/router';
import { BlockOptions } from '../../shared/types/ipc';

export class FiberHomeClientService {
  private routerIp: string = '192.168.1.1';
  private sessionId: string | null = null;
  private cachedInfo: RouterInfo | null = null;

  constructor(ip = '192.168.1.1') {
    this.routerIp = ip;
  }

  setRouterIp(ip: string) {
    this.routerIp = ip;
  }

  getRouterIp(): string {
    return this.routerIp;
  }

  private getBaseUrl(): string {
    if (Capacitor.isNativePlatform()) {
      return `http://${this.routerIp}`;
    }
    if (typeof window !== 'undefined' && window.location) {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        return '';
      }
    }
    return `http://${this.routerIp}`;
  }

  private isAutoAuthenticating = false;
  private isLoggedOutExplicitly = false;

  isAuthenticated(): boolean {
    return this.sessionId !== null;
  }

  async ensureSession(): Promise<boolean> {
    if (this.isLoggedOutExplicitly) return false;
    if (this.isAutoAuthenticating) return false;
    this.isAutoAuthenticating = true;
    try {
      const res = await this.login({
        ipAddress: this.routerIp,
        username: 'user',
        password: 'user1234'
      });
      return res.success;
    } catch {
      return false;
    } finally {
      this.isAutoAuthenticating = false;
    }
  }

  /**
   * Helper for AJAX GET request to FiberHome router
   */
  async getCgi(method: string): Promise<any> {
    const url = `${this.getBaseUrl()}/cgi-bin/ajax?ajaxmethod=${encodeURIComponent(method)}&_=${Date.now()}`;
    const headers: Record<string, string> = {
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest'
    };
    if (this.sessionId) {
      headers['Cookie'] = `sessionid=${this.sessionId}`;
    }

    const res = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    if (!res.ok) {
      throw new Error(`Router request failed with HTTP ${res.status}`);
    }

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (data.sessionid) {
        this.sessionId = data.sessionid;
      }
      if (data.session_valid === 0 && method !== 'get_acs_random' && method !== 'do_login') {
        const ok = await this.ensureSession();
        if (ok) {
          return await this.getCgi(method);
        }
      }
      return data;
    } catch {
      return text;
    }
  }

  /**
   * Helper for AJAX POST request to FiberHome router
   */
  async postCgi(method: string, bodyParams: Record<string, any>): Promise<any> {
    const url = `${this.getBaseUrl()}/cgi-bin/ajax`;
    const form = new URLSearchParams();
    form.append('ajaxmethod', method);
    if (this.sessionId) {
      form.append('sessionid', this.sessionId);
    }
    for (const [key, value] of Object.entries(bodyParams)) {
      form.append(key, String(value));
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest'
    };
    if (this.sessionId) {
      headers['Cookie'] = `sessionid=${this.sessionId}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: form.toString(),
      credentials: 'include'
    });

    if (!res.ok) {
      throw new Error(`Router POST failed with HTTP ${res.status}`);
    }

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (data.sessionid) {
        this.sessionId = data.sessionid;
      }
      if (data.session_valid === 0 && method !== 'do_login' && method !== 'get_acs_random') {
        const ok = await this.ensureSession();
        if (ok) {
          return await this.postCgi(method, bodyParams);
        }
      }
      return data;
    } catch {
      return text;
    }
  }

  /**
   * Tests connectivity to router
   */
  async testConnection(ip?: string): Promise<ConnectionResult> {
    if (ip) this.routerIp = ip;
    const start = Date.now();
    try {
      const data = await this.getCgi('get_device_name');
      const latencyMs = Date.now() - start;
      if (data && (data.ModelName || data.sessionid)) {
        return {
          success: true,
          message: `Connected to FiberHome ${data.ModelName || 'HG6145D2'} at ${this.routerIp}`,
          latencyMs
        };
      }
      return {
        success: false,
        message: `Router responded, but device signature did not match.`
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Cannot reach router at ${this.routerIp}. Pastikan terhubung ke Wi-Fi router: ${err.message || 'Network unreachable'}`
      };
    }
  }

  /**
   * Performs dynamic key extraction and AES-128-CBC login
   */
  async login(creds: RouterCredentials): Promise<ConnectionResult> {
    try {
      // 1. Fetch dynamic acsRandom and sessionid from CGI
      const acsData = await this.getCgi('get_acs_random');
      if (!acsData || !acsData.sessionid || !acsData.acsRandom) {
        throw new Error('Gagal mengambil session token dari router.');
      }

      this.sessionId = acsData.sessionid;
      const acsRandom: string = acsData.acsRandom;

      // Key derivation: acsRandom.substring(6).slice(0, -7)
      const keyStr = acsRandom.substring(6).slice(0, -7);
      const keyUtf8 = CryptoJS.enc.Utf8.parse(keyStr);
      const ivUtf8 = CryptoJS.enc.Utf8.parse(keyStr);

      const encrypted = CryptoJS.AES.encrypt(creds.password || '', keyUtf8, {
        iv: ivUtf8,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      const ciphertextHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();

      // 2. Submit credentials via do_login
      const loginRes = await this.postCgi('do_login', {
        username: creds.username,
        loginpd: ciphertextHex,
        port: 0,
        sessionid: this.sessionId
      });

      if (loginRes && loginRes.login_result === 0) {
        this.isLoggedOutExplicitly = false;
        return {
          success: true,
          message: 'Berhasil terhubung ke router FiberHome'
        };
      } else if (loginRes && loginRes.login_result === 1) {
        return {
          success: false,
          message: 'Sesi router sedang digunakan oleh administrator lain.'
        };
      }

      return {
        success: false,
        message: 'Username atau password router salah.'
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Login error: ${err.message}`
      };
    }
  }

  async logout(): Promise<void> {
    this.isLoggedOutExplicitly = true;
    try {
      if (this.sessionId) {
        await this.postCgi('do_logout', { sessionid: this.sessionId });
      }
    } catch {
      // ignore
    } finally {
      this.sessionId = null;
    }
  }

  async getDeviceInfo(): Promise<RouterInfo> {
    if (this.cachedInfo) return this.cachedInfo;
    try {
      const res = await this.getCgi('get_device_info');
      const dev = res?.device_info || {};
      const info: RouterInfo = {
        id: `fh-${this.routerIp.replace(/\./g, '-')}`,
        name: dev.DeviceModel || 'FiberHome HG6145D2',
        vendor: 'FiberHome',
        model: dev.DeviceModel || 'HG6145D2',
        firmware: dev.SoftwareVersion || 'RP3478',
        operatorName: dev.OperatorName || 'IDN_IMI',
        ipAddress: this.routerIp,
        macAddress: dev.BaseMac || '88:65:9F:FD:A1:90',
        connected: true,
        lastSync: new Date().toISOString()
      };
      this.cachedInfo = info;
      return info;
    } catch {
      return {
        id: `fh-${this.routerIp.replace(/\./g, '-')}`,
        name: 'FiberHome HG6145D2',
        vendor: 'FiberHome',
        model: 'HG6145D2',
        firmware: 'RP3478',
        operatorName: 'IDN_IMI',
        ipAddress: this.routerIp,
        macAddress: '88:65:9F:FD:A1:90',
        connected: true,
        lastSync: new Date().toISOString()
      };
    }
  }

  private cleanIp(raw: string): string {
    if (!raw) return '';
    return raw.replace(/_point_/g, '.').trim();
  }

  private cleanMac(raw: string): string {
    if (!raw) return '';
    return raw.replace(/-/g, ':').toUpperCase().trim();
  }

  async getWifiClients(): Promise<WifiClient[]> {
    const res = await this.getCgi('get_lan_status');
    const list = res?.lan_status?.data;
    if (!Array.isArray(list)) return [];

    const clients: WifiClient[] = [];
    for (const item of list) {
      const isWifi = item.InterfaceType === '802.11' || item.AccessType === '2.4G' || item.AccessType === '5G';
      const mac = this.cleanMac(item.MACAddress || item.MAC || item.mac);
      if (isWifi && item.Active === '1' && mac) {
        const band: '2.4GHz' | '5GHz' = item.AccessType === '5G' ? '5GHz' : '2.4GHz';
        clients.push({
          mac,
          ipAddress: this.cleanIp(item.IPAddress || item.IP || item.ip),
          hostname: item.HostName || item.hostname || 'Wi-Fi Device',
          ssid: item.SSID || item.HostName || (band === '5GHz' ? '5GHz Wi-Fi' : '2.4GHz Wi-Fi'),
          band,
          receivingRate: item.Tx_rate ? `${item.Tx_rate} Kbps` : ''
        });
      }
    }
    return clients;
  }

  async getDhcpClients(): Promise<DhcpClient[]> {
    const res = await this.getCgi('get_lan_status');
    const list = res?.lan_status?.data;
    if (!Array.isArray(list)) return [];

    const clients: DhcpClient[] = [];
    for (const item of list) {
      const mac = this.cleanMac(item.MACAddress || item.MAC || item.mac);
      if (item.Active === '1' && mac) {
        clients.push({
          mac,
          ipAddress: this.cleanIp(item.IPAddress || item.IP || item.ip),
          hostname: item.HostName || item.hostname || 'Network Client',
          expiresIn: item.LeaseTimeRemaining ? `${item.LeaseTimeRemaining}s` : '24h'
        });
      }
    }
    return clients;
  }

  async getMacFilterConfig(): Promise<MacFilterConfig> {
    try {
      const res = await this.getCgi('get_ipv4_mac_filter_info');
      const info = res?.ipv4_mac_filter_info;
      if (info) {
        const entries: BlockedDevice[] = [];
        if (Array.isArray(info.mac_filter_data)) {
          for (const item of info.mac_filter_data) {
            const mac = this.cleanMac(item.MAC || item.mac);
            if (mac) {
              entries.push({
                id: String(item.ipv4_mac_filter_index || entries.length + 1),
                macAddress: mac,
                mac,
                enabled: String(item.Enable) === '1',
                time: item.TimeStart ? `${item.TimeStart}-${item.TimeStop}` : undefined,
                comment: 'Blocked via WiFi Guard',
                addedAt: new Date().toISOString()
              });
            }
          }
        }
        return {
          enabled: String(info.MACFEnable) === '1',
          mode: 'BLACKLIST',
          entries
        };
      }
    } catch {
      // ignore
    }
    return {
      enabled: true,
      mode: 'BLACKLIST',
      entries: []
    };
  }

  async addBlockedDevice(mac: string, options?: BlockOptions): Promise<void> {
    const norm = this.cleanMac(mac);
    const payload = {
      action: 'add',
      MAC: norm,
      MACFmode: 'whiteorblack',
      TimeStart: options?.timeStart || '00:00',
      TimeStop: options?.timeStop || '23:59',
      TimeLimit: '23:59',
      Enable: '1'
    };

    const res = await this.postCgi('set_ipv4_mac_filter_info', payload);
    if (res && res.result !== 0 && res.result !== 'success' && res.result !== undefined && res.login_result === undefined) {
      throw new Error(`Router rejected block request: ${JSON.stringify(res)}`);
    }
  }

  async removeBlockedDevice(mac: string): Promise<void> {
    const norm = this.cleanMac(mac);
    const config = await this.getMacFilterConfig();
    const entry = config.entries.find(e => this.cleanMac(e.macAddress) === norm);
    if (!entry) {
      throw new Error('Device not found in router blacklist.');
    }

    const payload = {
      action: 'delete',
      ipv4_mac_filter_index: entry.id
    };

    const res = await this.postCgi('set_ipv4_mac_filter_info', payload);
    if (res && res.result !== 0 && res.result !== 'success' && res.result !== undefined && res.login_result === undefined) {
      throw new Error(`Router rejected unblock request: ${JSON.stringify(res)}`);
    }
  }
}
