import crypto from 'node:crypto';
import { RouterAdapter } from './RouterAdapter';
import {
  RouterInfo,
  WifiClient,
  DhcpClient,
  MacFilterConfig,
  BlockedDevice,
  ConnectionResult,
  RouterCredentials,
  RouterConnectionError,
  RouterAuthenticationError,
  RouterSessionExpiredError,
  MacFilteringError
} from '../../shared/types/router';
import { MacService } from '../services/MacService';
import { SelfBlockService } from '../services/SelfBlockService';

export class FiberHomeHG6145D2Adapter implements RouterAdapter {
  readonly vendor = 'FiberHome';
  readonly model = 'HG6145D2';
  readonly ipAddress: string;

  private sessionId = '';
  private sessionCookies: string[] = [];
  private cachedInfo: RouterInfo | null = null;

  constructor(ipAddress = '192.168.1.1') {
    this.ipAddress = ipAddress.trim();
  }

  private get baseUrl(): string {
    return `http://${this.ipAddress}`;
  }

  /**
   * Helper to perform HTTP GET to router's /cgi-bin/ajax?ajaxmethod=...
   */
  private async getCgi(ajaxmethod: string, extraParams: Record<string, string> = {}): Promise<any> {
    const url = new URL(`${this.baseUrl}/cgi-bin/ajax`);
    url.searchParams.set('ajaxmethod', ajaxmethod);
    url.searchParams.set('_', String(Math.random()));
    for (const [k, v] of Object.entries(extraParams)) {
      url.searchParams.set(k, v);
    }

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Referer': `${this.baseUrl}/html/login_inter.html`,
      'X-Requested-With': 'XMLHttpRequest'
    };

    if (this.sessionCookies.length > 0) {
      headers['Cookie'] = this.sessionCookies.join('; ');
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(6000)
      });

      if (!response.ok) {
        throw new RouterConnectionError(`Router returned HTTP ${response.status}`);
      }

      this.captureCookies(response);
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (err: any) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        throw new RouterConnectionError(`Router at ${this.ipAddress} did not respond within timeout.`);
      }
      throw new RouterConnectionError(err.message || 'Unable to communicate with router.');
    }
  }

  /**
   * Helper to perform HTTP POST to router's /cgi-bin/ajax with form URL encoded
   */
  private async postCgi(ajaxmethod: string, data: Record<string, any>): Promise<any> {
    const url = `${this.baseUrl}/cgi-bin/ajax`;
    const params = new URLSearchParams();
    params.set('ajaxmethod', ajaxmethod);
    params.set('_', String(Math.random()));

    for (const [key, value] of Object.entries(data)) {
      params.set(key, String(value));
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': `${this.baseUrl}/html/login_inter.html`,
      'X-Requested-With': 'XMLHttpRequest'
    };

    if (this.sessionCookies.length > 0) {
      headers['Cookie'] = this.sessionCookies.join('; ');
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: params.toString(),
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        throw new RouterConnectionError(`Router returned HTTP ${response.status}`);
      }

      this.captureCookies(response);
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (err: any) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        throw new RouterConnectionError(`Request to router timed out.`);
      }
      throw err;
    }
  }

  /**
   * Fetches an HTML page (e.g. wifi_list_inter.html) with session cookies
   */
  private async getPageHtml(pageName: string): Promise<string> {
    const url = `${this.baseUrl}/html/${pageName}?_=${Math.random()}`;
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Referer': `${this.baseUrl}/html/main_inter.html`
    };

    if (this.sessionCookies.length > 0) {
      headers['Cookie'] = this.sessionCookies.join('; ');
    }

    const res = await fetch(url, { headers, signal: AbortSignal.timeout(6000) });
    const html = await res.text();
    if (html.includes('RequestUnauthorized')) {
      throw new RouterSessionExpiredError('Session expired or unauthorized.');
    }
    return html;
  }

  private captureCookies(response: Response): void {
    const raw = response.headers.get('set-cookie');
    if (raw) {
      const parts = raw.split(',').map(s => s.trim().split(';')[0]);
      for (const p of parts) {
        if (!this.sessionCookies.includes(p)) {
          this.sessionCookies.push(p);
        }
      }
    }
  }

  /**
   * Encrypts password using the FiberHome HG6145D2 AES cipher protocol
   */
  private encryptPassword(password: string, acsRandom: string): string {
    if (!acsRandom || acsRandom.length < 14) {
      throw new Error('Invalid acsRandom received from router');
    }
    // As reverse engineered from aes.js:
    // acs_random.substring(6).slice(0, -7) yields the 16-byte key and IV
    const keyStr = acsRandom.substring(6).slice(0, -7);
    if (keyStr.length !== 16) {
      throw new Error(`Invalid extracted AES key length: ${keyStr.length}`);
    }

    const key = Buffer.from(keyStr, 'utf8');
    const iv = Buffer.from(keyStr, 'utf8');

    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    cipher.setAutoPadding(true); // PKCS7
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted.toUpperCase();
  }

  async testConnection(): Promise<ConnectionResult> {
    const startTime = Date.now();
    try {
      const devNameData = await this.getCgi('get_device_name');
      const latencyMs = Date.now() - startTime;

      if (!devNameData || (!devNameData.ModelName && !devNameData.sessionid)) {
        return {
          success: false,
          message: 'Target device responded, but did not match FiberHome signature.',
          latencyMs
        };
      }

      const operatorData = await this.getCgi('get_operator').catch(() => ({}));
      const info: RouterInfo = {
        id: `fh-${this.ipAddress.replace(/\./g, '-')}`,
        name: `FiberHome ${devNameData.ModelName || 'HG6145D2'}`,
        vendor: 'FiberHome',
        model: devNameData.ModelName || 'HG6145D2',
        firmware: 'RP3478',
        ipAddress: this.ipAddress,
        operatorName: operatorData.operator_name || 'IDN_IMI',
        connected: true,
        lastSync: new Date().toISOString(),
        latencyMs
      };

      this.cachedInfo = info;
      return {
        success: true,
        message: `Connected to FiberHome ${info.model}`,
        routerInfo: info,
        latencyMs
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || `Unable to reach router at ${this.ipAddress}`,
        latencyMs: Date.now() - startTime
      };
    }
  }

  async login(credentials: RouterCredentials): Promise<ConnectionResult> {
    try {
      // Step 1: get acs_random and sessionid
      const acsData = await this.getCgi('get_acs_random');
      if (!acsData || !acsData.sessionid || !acsData.acsRandom) {
        throw new RouterAuthenticationError('Failed to initialize session with router.');
      }

      this.sessionId = acsData.sessionid;
      if (!this.sessionCookies.some(c => c.startsWith('sessionid='))) {
        this.sessionCookies.push(`sessionid=${this.sessionId}`);
      }

      // Step 2: Encrypt password
      const encryptedPassword = this.encryptPassword(credentials.password || '', acsData.acsRandom);

      // Step 3: Send do_login
      const loginPayload = {
        username: credentials.username,
        loginpd: encryptedPassword,
        port: 0,
        sessionid: this.sessionId
      };

      const loginResult = await this.postCgi('do_login', loginPayload);
      if (loginResult && loginResult.login_result === 0) {
        // Success
        const info = await this.getDeviceInfo();
        return {
          success: true,
          message: `Connected to FiberHome ${this.model}`,
          routerInfo: info
        };
      } else if (loginResult && loginResult.login_result === 1) {
        return {
          success: false,
          message: 'Another administrator is currently logged in to the router.'
        };
      } else {
        return {
          success: false,
          message: `Unable to authenticate with router. Check username and password. (Router code: ${JSON.stringify(loginResult)})`
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Authentication error.'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.postCgi('do_logout', { sessionid: this.sessionId }).catch(() => {});
    } finally {
      this.sessionId = '';
      this.sessionCookies = [];
    }
  }

  async getDeviceInfo(): Promise<RouterInfo> {
    if (this.cachedInfo) return this.cachedInfo;
    const test = await this.testConnection();
    if (test.routerInfo) {
      this.cachedInfo = test.routerInfo;
      return test.routerInfo;
    }

    return {
      id: `fh-${this.ipAddress.replace(/\./g, '-')}`,
      name: 'FiberHome HG6145D2',
      vendor: 'FiberHome',
      model: 'HG6145D2',
      firmware: 'RP3478',
      hardwareVersion: 'WKE2.094.443A11',
      ipAddress: this.ipAddress,
      connected: true,
      lastSync: new Date().toISOString()
    };
  }

  /**
   * Retrieves active Wi-Fi clients (2.4 GHz and 5 GHz)
   */
  async getWifiClients(): Promise<WifiClient[]> {
    const clients: WifiClient[] = [];

    // Query official get_lan_status CGI endpoint
    try {
      const res = await this.getCgi('get_lan_status');
      const list = res?.lan_status?.data;
      if (Array.isArray(list)) {
        for (const item of list) {
          const isWifi = item.InterfaceType === '802.11' || item.AccessType === '2.4G' || item.AccessType === '5G';
          if (isWifi && item.Active === '1' && item.MACAddress && MacService.isValid(item.MACAddress)) {
            const rawIp = (item.IPAddress || '').replace(/_point_/g, '.');
            const band: '2.4GHz' | '5GHz' = item.AccessType === '5G' ? '5GHz' : '2.4GHz';
            clients.push({
              ssid: item.HostName || (band === '5GHz' ? '5GHz Wireless' : '2.4GHz Wireless'),
              hostname: item.HostName || 'Unknown Device',
              mac: MacService.normalize(item.MACAddress),
              ipAddress: rawIp,
              receivingRate: item.Tx_rate ? `${item.Tx_rate} Kbps` : '',
              band
            });
          }
        }
        return clients;
      }
    } catch {
      // Fallback to HTML parsing if CGI unavailable
    }

    // Fallback: Parse wifi_list_inter.html
    try {
      const html = await this.getPageHtml('wifi_list_inter.html');
      return this.parseWifiListHtml(html);
    } catch {
      return clients;
    }
  }

  private parseWifiListHtml(html: string): WifiClient[] {
    const clients: WifiClient[] = [];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let currentBand: '2.4GHz' | '5GHz' = '2.4GHz';

    let match;
    while ((match = rowRegex.exec(html)) !== null) {
      const rowContent = match[1];
      if (rowContent.includes('5G') || rowContent.includes('user_5glist')) {
        currentBand = '5GHz';
      }

      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells: string[] = [];
      let tdMatch;
      while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
        cells.push(tdMatch[1].replace(/<[^>]+>/g, '').trim());
      }

      if (cells.length >= 5) {
        const mac = cells[2];
        if (MacService.isValid(mac)) {
          clients.push({
            ssid: cells[0],
            hostname: cells[1],
            mac: MacService.normalize(mac),
            ipAddress: cells[3].replace(/_point_/g, '.'),
            receivingRate: cells[4],
            band: currentBand
          });
        }
      }
    }

    return clients;
  }

  /**
   * Retrieves active DHCP clients
   */
  async getDhcpClients(): Promise<DhcpClient[]> {
    const clients: DhcpClient[] = [];

    try {
      const res = await this.getCgi('get_lan_status');
      const list = res?.lan_status?.data;
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item.AddressSource === 'DHCP' && item.Active === '1' && item.MACAddress && MacService.isValid(item.MACAddress)) {
            const rawIp = (item.IPAddress || '').replace(/_point_/g, '.');
            clients.push({
              hostname: item.HostName || 'DHCP-Client',
              mac: MacService.normalize(item.MACAddress),
              ipAddress: rawIp,
              expiresIn: item.LeaseTimeRemaining ? `${item.LeaseTimeRemaining}s` : ''
            });
          }
        }
        return clients;
      }
    } catch {
      // Fallback
    }

    return clients;
  }

  /**
   * Reads current MAC filtering configuration
   */
  async getMacFilterConfig(): Promise<MacFilterConfig> {
    // 1. Try official get_ipv4_mac_filter_info CGI endpoint
    try {
      const res = await this.getCgi('get_ipv4_mac_filter_info');
      const info = res?.ipv4_mac_filter_info;
      if (info && typeof info.MACFEnable !== 'undefined') {
        const isEnabled = String(info.MACFEnable) === '1';
        let mode: MacFilterMode = 'BLACKLIST';
        const rawMode = String(info.MACFMode || '').toLowerCase();
        if (rawMode === 'white' || rawMode === '0') {
          mode = 'WHITELIST';
        } else if (rawMode === 'timelimit' || rawMode === '2') {
          mode = 'TIMELIMIT';
        } else {
          mode = 'BLACKLIST';
        }

        const entries: BlockedDevice[] = [];
        if (Array.isArray(info.mac_filter_data)) {
          for (const item of info.mac_filter_data) {
            const rawMac = item.MAC || item.mac;
            if (rawMac && MacService.isValid(rawMac)) {
              const norm = MacService.normalize(rawMac);
              entries.push({
                id: String(item.ipv4_mac_filter_index || entries.length + 1),
                macAddress: norm,
                mac: norm,
                time: item.TimeStart ? `${item.TimeStart}-${item.TimeStop}` : '',
                enabled: String(item.Enable) === '1',
                comment: 'Blocked Device',
                addedAt: new Date().toISOString()
              });
            }
          }
        }

        return {
          enabled: isEnabled,
          mode,
          entries
        };
      }
    } catch {
      // Fallback
    }

    return {
      enabled: false,
      mode: 'BLACKLIST',
      entries: []
    };
  }

  async getBlockedDevices(): Promise<BlockedDevice[]> {
    const config = await this.getMacFilterConfig();
    return config.entries;
  }

  /**
   * Adds device to MAC blacklist.
   * STRICT SAFETY CHECKS:
   * 1. Self-block check: throws if host MAC.
   * 2. Checks if MAC filtering is enabled on router (stops if false).
   * 3. Checks if mode is BLACKLIST (stops if not).
   * 4. Checks if MAC already exists in blacklist (stops if duplicate).
   * 5. Checks ROUTER_WRITE_DRY_RUN: prints sanitized plan and halts if true.
   * 6. Posts configuration to router.
   * 7. Post-write verification: re-reads router MAC filter to confirm entry exists.
   */
  async addBlockedDevice(
    mac: string,
    comment = 'WiFi Guard Block',
    options?: { timeStart?: string; timeStop?: string }
  ): Promise<void> {
    const normalized = MacService.normalize(mac);
    SelfBlockService.assertNotHost(normalized);
    if (this.cachedInfo?.macAddress) {
      SelfBlockService.assertNotRouter(normalized, this.cachedInfo.macAddress);
    }

    // Read current router configuration
    const currentConfig = await this.getMacFilterConfig();

    // Safety Rule #12: Never enable blacklist silently
    if (!currentConfig.enabled) {
      throw new MacFilteringError('MAC Filtering is disabled on the router. Enable Black List filtering manually from the router administration page before continuing.');
    }

    // Safety Rule #12: Never proceed if mode is not BLACKLIST
    if (currentConfig.mode !== 'BLACKLIST') {
      throw new MacFilteringError('Router MAC Filtering is not in Black List mode.');
    }

    // Safety Rule #13: Ensure MAC is not already present
    if (currentConfig.entries.some(e => MacService.normalize(e.macAddress) === normalized)) {
      throw new MacFilteringError('Device is already in the router blacklist.');
    }

    // Safety Rule #9: Dry Run Mode
    if (process.env.ROUTER_WRITE_DRY_RUN === 'true') {
      console.log('\nDRY RUN');
      console.log('Operation:');
      console.log('ADD BLACKLIST ENTRY');
      console.log('MAC:');
      console.log(normalized);
      console.log('TimeStart:');
      console.log(options?.timeStart || '00:00');
      console.log('TimeStop:');
      console.log(options?.timeStop || '23:59');
      console.log('Current blacklist entries:');
      console.log(currentConfig.entries.length);
      console.log('Result:');
      console.log('Would add 1 entry');
      console.log('No router changes made.\n');
      return;
    }

    // Execute official CGI MAC filter add
    const payload = {
      action: 'add',
      MAC: normalized,
      MACFmode: 'whiteorblack',
      TimeStart: options?.timeStart || '00:00',
      TimeStop: options?.timeStop || '23:59',
      TimeLimit: '23:59',
      Enable: '1'
    };

    const res = await this.postCgi('set_ipv4_mac_filter_info', payload);
    if (res && res.result !== 0 && res.result !== 'success' && res.result !== undefined && res.login_result === undefined) {
      throw new MacFilteringError(`Failed to add MAC to router blacklist: ${JSON.stringify(res)}`);
    }

    // Safety Rule #15: Post-Block Verification
    const verifiedConfig = await this.getMacFilterConfig();
    const isPresent = verifiedConfig.entries.some(e => MacService.normalize(e.macAddress) === normalized);
    if (!isPresent) {
      throw new MacFilteringError('The router did not confirm the requested change.');
    }
  }

  /**
   * Removes device from MAC blacklist.
   * STRICT SAFETY CHECKS:
   * 1. Validates MAC format.
   * 2. Checks if MAC exists in router blacklist.
   * 3. Checks ROUTER_WRITE_DRY_RUN.
   * 4. Deletes exact single entry (never Delete All).
   * 5. Post-write verification: re-reads router MAC filter to confirm entry is absent.
   */
  async removeBlockedDevice(mac: string): Promise<void> {
    const normalized = MacService.normalize(mac);

    const currentConfig = await this.getMacFilterConfig();
    const entry = currentConfig.entries.find(e => MacService.normalize(e.macAddress) === normalized);

    if (!entry) {
      throw new MacFilteringError('Device is not in the router blacklist.');
    }

    // Dry Run check
    if (process.env.ROUTER_WRITE_DRY_RUN === 'true') {
      console.log('\nDRY RUN');
      console.log('Operation:');
      console.log('REMOVE BLACKLIST ENTRY');
      console.log('MAC:');
      console.log(normalized);
      console.log('Current blacklist entries:');
      console.log(currentConfig.entries.length);
      console.log('Result:');
      console.log('Would remove 1 entry');
      console.log('No router changes made.\n');
      return;
    }

    // Delete exact target entry using its ipv4_mac_filter_index
    const payload = {
      action: 'delete',
      ipv4_mac_filter_index: entry.id
    };

    const res = await this.postCgi('set_ipv4_mac_filter_info', payload);
    if (res && res.result !== 0 && res.result !== 'success' && res.result !== undefined && res.login_result === undefined) {
      throw new MacFilteringError(`Failed to remove MAC from router blacklist: ${JSON.stringify(res)}`);
    }

    // Safety Rule #15: Post-Unblock Verification
    const verifiedConfig = await this.getMacFilterConfig();
    const isStillPresent = verifiedConfig.entries.some(e => MacService.normalize(e.macAddress) === normalized);
    if (isStillPresent) {
      throw new MacFilteringError('The router did not confirm removal of the requested device.');
    }
  }
}
