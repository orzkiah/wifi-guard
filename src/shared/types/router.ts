export interface RouterInfo {
  id: string;
  name: string;
  vendor: string;
  model: string;
  firmware: string;
  hardwareVersion?: string;
  ipAddress: string;
  subnetMask?: string;
  macAddress?: string;
  uptime?: string;
  operatorName?: string;
  connected: boolean;
  lastSync?: string;
  latencyMs?: number;
}

export interface WifiClient {
  ssid: string;
  hostname: string;
  mac: string;
  ipAddress: string;
  receivingRate: string;
  band: '2.4GHz' | '5GHz' | 'UNKNOWN';
}

export interface DhcpClient {
  hostname: string;
  mac: string;
  ipAddress: string;
  expiresIn?: string;
}

export type MacFilterMode = 'WHITELIST' | 'TIMELIMIT' | 'BLACKLIST';

export interface BlockedDevice {
  id?: string;
  macAddress: string;
  mac?: string; // alias for backwards compatibility
  time?: string;
  enabled?: boolean;
  comment?: string;
  addedAt?: string;
}

export interface MacFilterConfig {
  enabled: boolean;
  mode: MacFilterMode;
  entries: BlockedDevice[];
}

export interface ConnectionResult {
  success: boolean;
  message: string;
  routerInfo?: RouterInfo;
  latencyMs?: number;
}

export interface RouterCredentials {
  ipAddress: string;
  username: string;
  password?: string;
  remember?: boolean;
}

export interface RouterStatusSummary {
  connected: boolean;
  routerInfo?: RouterInfo;
  totalDevices: number;
  onlineDevices: number;
  trustedDevices: number;
  unknownDevices: number;
  blockedDevices: number;
  lastSync: string;
  latencyMs: number;
  error?: string;
}

// Typed Errors
export class RouterConnectionError extends Error {
  constructor(message = 'Unable to connect to router.') {
    super(message);
    this.name = 'RouterConnectionError';
  }
}

export class RouterAuthenticationError extends Error {
  constructor(message = 'Unable to authenticate with router.') {
    super(message);
    this.name = 'RouterAuthenticationError';
  }
}

export class RouterSessionExpiredError extends Error {
  constructor(message = 'Router session expired.') {
    super(message);
    this.name = 'RouterSessionExpiredError';
  }
}

export class RouterUnsupportedError extends Error {
  constructor(message = 'Unsupported router model or feature.') {
    super(message);
    this.name = 'RouterUnsupportedError';
  }
}

export class RouterRequestError extends Error {
  constructor(message = 'Router request failed.') {
    super(message);
    this.name = 'RouterRequestError';
  }
}

export class RouterParseError extends Error {
  constructor(message = 'Failed to parse response from router.') {
    super(message);
    this.name = 'RouterParseError';
  }
}

export class MacFilteringError extends Error {
  constructor(message = 'MAC filtering operation failed.') {
    super(message);
    this.name = 'MacFilteringError';
  }
}

export class DeviceNotFoundError extends Error {
  constructor(message = 'Device not found.') {
    super(message);
    this.name = 'DeviceNotFoundError';
  }
}

export class SelfBlockError extends Error {
  constructor(message = 'You cannot block the device currently running WiFi Guard.') {
    super(message);
    this.name = 'SelfBlockError';
  }
}
