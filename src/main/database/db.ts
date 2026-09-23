import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'node:path';
import fs from 'node:fs';
import { Device, DeviceEvent } from '../../shared/types/device';
import { RouterInfo } from '../../shared/types/router';
import { AppSettings } from '../../shared/types/ipc';

let dbInstance: SqlJsDatabase | null = null;
let currentDbPath: string = '';

function getElectronApp(): any {
  if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('electron').app;
    } catch {
      return null;
    }
  }
  return null;
}

export function getDatabasePath(): string {
  try {
    const electronApp = getElectronApp();
    if (electronApp && electronApp.getPath) {
      const userDataDir = electronApp.getPath('userData');
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
      }
      return path.join(userDataDir, 'wifiguard.db');
    }
  } catch {
    // Fallback
  }
  const localDir = path.resolve(process.cwd(), '.data');
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  return path.join(localDir, 'wifiguard.db');
}

function persistDatabase(): void {
  if (dbInstance && currentDbPath && currentDbPath !== ':memory:') {
    try {
      const dir = path.dirname(currentDbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = dbInstance.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(currentDbPath, buffer);
    } catch (err) {
      console.error('Failed to persist SQLite database to disk:', err);
    }
  }
}

export async function initDatabaseAsync(customPath?: string): Promise<SqlJsDatabase> {
  if (dbInstance) return dbInstance;

  currentDbPath = customPath || getDatabasePath();
  const SQL = await initSqlJs();

  if (fs.existsSync(currentDbPath)) {
    try {
      const fileBuffer = fs.readFileSync(currentDbPath);
      dbInstance = new SQL.Database(fileBuffer);
    } catch {
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Initialize SQLite schema
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS routers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      vendor TEXT NOT NULL,
      model TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      firmware TEXT,
      last_connected_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      router_id TEXT NOT NULL,
      mac_address TEXT UNIQUE NOT NULL,
      ip_address TEXT NOT NULL,
      hostname TEXT,
      vendor TEXT,
      ssid TEXT,
      band TEXT,
      receiving_rate TEXT,
      custom_name TEXT,
      trusted INTEGER NOT NULL DEFAULT 0,
      blocked INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'ONLINE',
      source TEXT NOT NULL DEFAULT 'WIFI_CLIENT_LIST',
      unblock_at TEXT,
      block_schedule TEXT,
      first_seen TEXT NOT NULL,
      last_seen TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS device_events (
      id TEXT PRIMARY KEY,
      device_id TEXT,
      router_id TEXT,
      event_type TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      metadata_json TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Migrations for existing databases
  try {
    dbInstance.run('ALTER TABLE devices ADD COLUMN unblock_at TEXT;');
  } catch {
    // Column already exists
  }
  try {
    dbInstance.run('ALTER TABLE devices ADD COLUMN block_schedule TEXT;');
  } catch {
    // Column already exists
  }

  persistDatabase();
  return dbInstance;
}

export function initDatabaseSync(customPath?: string): SqlJsDatabase {
  if (dbInstance) return dbInstance;
  throw new Error('Call await initDatabaseAsync() before accessing synchronous helpers.');
}

export function closeDatabase(): void {
  if (dbInstance) {
    persistDatabase();
    dbInstance.close();
    dbInstance = null;
  }
}

// Helpers to query with objects
function queryAll(sql: string, params: any[] = []): any[] {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql: string, params: any[] = []): any | null {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function execute(sql: string, params: any[] = []): void {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, params);
  persistDatabase();
}

function mapRowToDevice(r: any): Device {
  let blockSchedule: { timeStart: string; timeStop: string } | undefined;
  if (r.block_schedule) {
    try {
      blockSchedule = JSON.parse(r.block_schedule);
    } catch {
      // ignore JSON parse error
    }
  }

  return {
    id: r.id,
    routerId: r.router_id,
    macAddress: r.mac_address,
    ipAddress: r.ip_address,
    hostname: r.hostname || '',
    vendor: r.vendor || 'Unknown',
    ssid: r.ssid || '',
    band: r.band || 'UNKNOWN',
    receivingRate: r.receiving_rate || '',
    customName: r.custom_name || '',
    trusted: Boolean(r.trusted),
    blocked: Boolean(r.blocked),
    status: r.status,
    source: r.source,
    unblockAt: r.unblock_at || undefined,
    blockSchedule,
    firstSeen: r.first_seen,
    lastSeen: r.last_seen,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

// Device Database Queries
export const DeviceRepository = {
  getAll(): Device[] {
    const rows = queryAll('SELECT * FROM devices ORDER BY last_seen DESC');
    return rows.map(mapRowToDevice);
  },

  getByMac(mac: string): Device | null {
    const r = queryOne('SELECT * FROM devices WHERE mac_address = ?', [mac]);
    return r ? mapRowToDevice(r) : null;
  },

  getById(id: string): Device | null {
    const r = queryOne('SELECT * FROM devices WHERE id = ?', [id]);
    return r ? mapRowToDevice(r) : null;
  },

  getExpiredBlockedDevices(nowIso: string): Device[] {
    const rows = queryAll(
      'SELECT * FROM devices WHERE blocked = 1 AND unblock_at IS NOT NULL AND unblock_at <= ?',
      [nowIso]
    );
    return rows.map(mapRowToDevice);
  },

  upsert(device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Device {
    const existing = this.getByMac(device.macAddress);
    const now = new Date().toISOString();

    const unblockAt = device.unblockAt !== undefined ? device.unblockAt : existing?.unblockAt;
    const blockSchedule = device.blockSchedule !== undefined ? device.blockSchedule : existing?.blockSchedule;
    const scheduleStr = blockSchedule ? JSON.stringify(blockSchedule) : null;

    if (existing) {
      const updated: Device = {
        ...existing,
        ipAddress: device.ipAddress || existing.ipAddress,
        hostname: device.hostname || existing.hostname,
        vendor: (device.vendor && device.vendor !== 'Unknown') ? device.vendor : existing.vendor,
        ssid: device.ssid || existing.ssid,
        band: device.band !== 'UNKNOWN' ? device.band : existing.band,
        receivingRate: device.receivingRate || existing.receivingRate,
        blocked: device.blocked !== undefined ? Boolean(device.blocked) : existing.blocked,
        status: device.status || existing.status,
        unblockAt,
        blockSchedule,
        lastSeen: device.lastSeen || now,
        updatedAt: now
      };

      execute(
        `UPDATE devices
         SET ip_address = ?, hostname = ?, vendor = ?, ssid = ?, band = ?,
             receiving_rate = ?, status = ?, blocked = ?, unblock_at = ?, block_schedule = ?,
             last_seen = ?, updated_at = ?
         WHERE id = ?`,
        [
          updated.ipAddress,
          updated.hostname,
          updated.vendor,
          updated.ssid,
          updated.band,
          updated.receivingRate,
          updated.status,
          updated.blocked ? 1 : 0,
          unblockAt || null,
          scheduleStr,
          updated.lastSeen,
          updated.updatedAt,
          updated.id
        ]
      );

      return updated;
    } else {
      const id = device.id || crypto.randomUUID();
      const firstSeen = device.firstSeen || now;
      const lastSeen = device.lastSeen || now;

      execute(
        `INSERT INTO devices (
          id, router_id, mac_address, ip_address, hostname, vendor,
          ssid, band, receiving_rate, custom_name, trusted, blocked,
          status, source, unblock_at, block_schedule, first_seen, last_seen, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          device.routerId,
          device.macAddress,
          device.ipAddress,
          device.hostname,
          device.vendor,
          device.ssid,
          device.band,
          device.receivingRate,
          device.customName || '',
          device.trusted ? 1 : 0,
          device.blocked ? 1 : 0,
          device.status,
          device.source,
          unblockAt || null,
          scheduleStr,
          firstSeen,
          lastSeen,
          now,
          now
        ]
      );

      return {
        id,
        ...device,
        customName: device.customName || '',
        trusted: Boolean(device.trusted),
        blocked: Boolean(device.blocked),
        unblockAt,
        blockSchedule,
        firstSeen,
        lastSeen,
        createdAt: now,
        updatedAt: now
      };
    }
  },

  setTrusted(id: string, trusted: boolean): void {
    const now = new Date().toISOString();
    execute('UPDATE devices SET trusted = ?, updated_at = ? WHERE id = ?', [trusted ? 1 : 0, now, id]);
  },

  setBlocked(id: string, blocked: boolean, unblockAt: string | null = null, blockSchedule: any = null): void {
    const now = new Date().toISOString();
    const status = blocked ? 'BLOCKED' : 'ONLINE';
    const scheduleStr = blockSchedule ? JSON.stringify(blockSchedule) : null;
    execute(
      'UPDATE devices SET blocked = ?, status = ?, unblock_at = ?, block_schedule = ?, updated_at = ? WHERE id = ?',
      [blocked ? 1 : 0, status, unblockAt, scheduleStr, now, id]
    );
  },

  setBlockedByMac(mac: string, blocked: boolean): void {
    const now = new Date().toISOString();
    const status = blocked ? 'BLOCKED' : 'ONLINE';
    execute('UPDATE devices SET blocked = ?, status = ?, unblock_at = NULL, block_schedule = NULL, updated_at = ? WHERE mac_address = ?', [blocked ? 1 : 0, status, now, mac]);
  },

  updateStatus(mac: string, status: any): void {
    const now = new Date().toISOString();
    const blocked = status === 'BLOCKED' ? 1 : 0;
    execute('UPDATE devices SET status = ?, blocked = ?, updated_at = ? WHERE mac_address = ?', [status, blocked, now, mac]);
  },

  setCustomName(id: string, name: string): void {
    const now = new Date().toISOString();
    execute('UPDATE devices SET custom_name = ?, updated_at = ? WHERE id = ?', [name, now, id]);
  },

  markAllOffline(exceptMacs: string[] = []): void {
    const now = new Date().toISOString();
    if (exceptMacs.length === 0) {
      execute("UPDATE devices SET status = 'OFFLINE', updated_at = ? WHERE status != 'OFFLINE'", [now]);
    } else {
      const placeholders = exceptMacs.map(() => '?').join(',');
      execute(
        `UPDATE devices SET status = 'OFFLINE', updated_at = ? WHERE mac_address NOT IN (${placeholders}) AND status != 'OFFLINE'`,
        [now, ...exceptMacs]
      );
    }
  }
};

// Events Repository
export const EventRepository = {
  create(event: Omit<DeviceEvent, 'id' | 'timestamp'> & { timestamp?: string }): DeviceEvent {
    const id = crypto.randomUUID();
    const timestamp = event.timestamp || new Date().toISOString();

    execute(
      `INSERT INTO device_events (id, device_id, router_id, event_type, timestamp, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, event.deviceId || null, event.routerId || null, event.eventType, timestamp, event.metadataJson || '{}']
    );

    return {
      id,
      deviceId: event.deviceId,
      routerId: event.routerId,
      eventType: event.eventType,
      timestamp,
      metadataJson: event.metadataJson || '{}'
    };
  },

  getRecent(deviceId?: string, limit = 100): DeviceEvent[] {
    let rows: any[];
    if (deviceId) {
      rows = queryAll(
        'SELECT * FROM device_events WHERE device_id = ? ORDER BY timestamp DESC LIMIT ?',
        [deviceId, limit]
      );
    } else {
      rows = queryAll(
        'SELECT * FROM device_events ORDER BY timestamp DESC LIMIT ?',
        [limit]
      );
    }

    return rows.map(r => ({
      id: r.id,
      deviceId: r.device_id,
      routerId: r.router_id,
      eventType: r.event_type,
      timestamp: r.timestamp,
      metadataJson: r.metadata_json || '{}'
    }));
  }
};

// Settings Repository
export const SettingsRepository = {
  get(): AppSettings {
    const defaultSettings: AppSettings = {
      autoRefreshInterval: 5,
      startWithWindows: false,
      minimizeToTray: false,
      notificationsEnabled: true,
      unknownDeviceAlert: true,
      theme: 'dark',
      routerIp: '192.168.1.1',
      routerUsername: 'admin',
      rememberCredentials: true,
      useMockAdapter: false
    };

    if (!dbInstance) return defaultSettings;

    const rows = queryAll('SELECT key, value FROM settings');
    const result: any = { ...defaultSettings };

    for (const row of rows) {
      try {
        result[row.key] = JSON.parse(row.value);
      } catch {
        result[row.key] = row.value;
      }
    }

    return result;
  },

  update(settings: Partial<AppSettings>): AppSettings {
    for (const [k, v] of Object.entries(settings)) {
      execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [k, JSON.stringify(v)]);
    }
    return this.get();
  }
};

// Router Repository
export const RouterRepository = {
  save(info: RouterInfo): void {
    const now = new Date().toISOString();
    execute(
      `INSERT OR REPLACE INTO routers (id, name, vendor, model, ip_address, firmware, last_connected_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [info.id, info.name, info.vendor, info.model, info.ipAddress, info.firmware || '', now, now, now]
    );
  },

  get(id: string): RouterInfo | null {
    const r = queryOne('SELECT * FROM routers WHERE id = ?', [id]);
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      vendor: r.vendor,
      model: r.model,
      ipAddress: r.ip_address,
      firmware: r.firmware,
      connected: true,
      lastSync: r.last_connected_at
    };
  }
};
