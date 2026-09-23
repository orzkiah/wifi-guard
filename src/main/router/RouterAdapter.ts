import {
  RouterInfo,
  WifiClient,
  DhcpClient,
  MacFilterConfig,
  BlockedDevice,
  ConnectionResult,
  RouterCredentials
} from '../../shared/types/router';

export interface RouterAdapter {
  readonly vendor: string;
  readonly model: string;
  readonly ipAddress: string;

  /**
   * Tests connectivity and returns basic router info without altering state.
   */
  testConnection(): Promise<ConnectionResult>;

  /**
   * Authenticates with the router using provided credentials.
   */
  login(credentials: RouterCredentials): Promise<ConnectionResult>;

  /**
   * Terminates active session.
   */
  logout(): Promise<void>;

  /**
   * Retrieves high-level hardware/firmware router information.
   */
  getDeviceInfo(): Promise<RouterInfo>;

  /**
   * Retrieves list of currently associated Wi-Fi stations (2.4 GHz and 5 GHz).
   */
  getWifiClients(): Promise<WifiClient[]>;

  /**
   * Retrieves list of active DHCP leases.
   */
  getDhcpClients(): Promise<DhcpClient[]>;

  /**
   * Reads MAC filtering status and configured rules.
   */
  getMacFilterConfig(): Promise<MacFilterConfig>;

  /**
   * Retrieves currently blocked devices in blacklist mode.
   */
  getBlockedDevices(): Promise<BlockedDevice[]>;

  /**
   * Adds device MAC to router's blacklist. Requires explicit user action.
   */
  addBlockedDevice(mac: string, comment?: string, options?: { timeStart?: string; timeStop?: string }): Promise<void>;

  /**
   * Removes device MAC from router's blacklist.
   */
  removeBlockedDevice(mac: string): Promise<void>;
}
