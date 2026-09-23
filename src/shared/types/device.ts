export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'UNKNOWN' | 'BLOCKED' | 'TRUSTED';

export type DeviceBand = '2.4GHz' | '5GHz' | 'ETHERNET' | 'UNKNOWN';

export type DeviceSource = 'WIFI_CLIENT_LIST' | 'DHCP_CLIENT_LIST' | 'LAN_SCAN' | 'MANUAL';

export interface Device {
  id: string;
  routerId: string;
  macAddress: string;
  ipAddress: string;
  hostname: string;
  vendor: string;
  ssid: string;
  band: DeviceBand;
  receivingRate: string;
  firstSeen: string;
  lastSeen: string;
  status: DeviceStatus;
  trusted: boolean;
  blocked: boolean;
  customName: string;
  source: DeviceSource;
  unblockAt?: string;
  blockSchedule?: {
    timeStart: string;
    timeStop: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type DeviceEventType =
  | 'DEVICE_CONNECTED'
  | 'DEVICE_DISCONNECTED'
  | 'DEVICE_FIRST_SEEN'
  | 'DEVICE_BLOCKED'
  | 'DEVICE_UNBLOCKED'
  | 'DEVICE_TRUSTED'
  | 'DEVICE_UNTRUSTED'
  | 'DEVICE_RENAMED'
  | 'ROUTER_CONNECTED'
  | 'ROUTER_DISCONNECTED';

export interface DeviceEvent {
  id: string;
  deviceId?: string;
  routerId?: string;
  eventType: DeviceEventType;
  timestamp: string;
  metadataJson: string;
}

export interface NetworkInterfaceInfo {
  name: string;
  mac: string;
  ip: string;
  isHost: boolean;
}
