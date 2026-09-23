import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initDatabaseAsync, closeDatabase, DeviceRepository } from '../src/main/database/db';
import { DeviceDiscoveryService } from '../src/main/services/DeviceDiscoveryService';
import { MockRouterAdapter } from '../src/main/router/MockRouterAdapter';
import { FiberHomeHG6145D2Adapter } from '../src/main/router/FiberHomeHG6145D2Adapter';

describe('Scheduled Block & Automatic Unblock Tests', () => {
  beforeEach(async () => {
    // In-memory or clean test db
    await initDatabaseAsync(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  it('should store unblockAt and blockSchedule in DeviceRepository', () => {
    const unblockTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const schedule = { timeStart: '22:00', timeStop: '06:00' };

    const dev = DeviceRepository.upsert({
      routerId: 'test-router',
      macAddress: 'BA:02:F6:D8:64:73',
      ipAddress: '192.168.1.5',
      hostname: 'Redmi-13',
      vendor: 'Xiaomi',
      ssid: 'MyWiFi',
      band: '5GHz',
      receivingRate: '130M',
      customName: 'Adik Phone',
      trusted: false,
      blocked: true,
      status: 'BLOCKED',
      source: 'WIFI_CLIENT_LIST',
      unblockAt: unblockTime,
      blockSchedule: schedule,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    });

    expect(dev.unblockAt).toBe(unblockTime);
    expect(dev.blockSchedule).toEqual(schedule);

    const fetched = DeviceRepository.getByMac('BA:02:F6:D8:64:73');
    expect(fetched).not.toBeNull();
    expect(fetched?.blocked).toBe(true);
    expect(fetched?.unblockAt).toBe(unblockTime);
    expect(fetched?.blockSchedule?.timeStart).toBe('22:00');
    expect(fetched?.blockSchedule?.timeStop).toBe('06:00');
  });

  it('should identify expired blocked devices using getExpiredBlockedDevices', () => {
    const pastTime = new Date(Date.now() - 5000).toISOString();
    const futureTime = new Date(Date.now() + 60000).toISOString();

    // Expired device
    DeviceRepository.upsert({
      routerId: 'test-router',
      macAddress: 'AA:BB:CC:DD:EE:01',
      ipAddress: '192.168.1.101',
      hostname: 'Expired-Device',
      vendor: 'VendorA',
      ssid: 'MyWiFi',
      band: '2.4GHz',
      receivingRate: '54M',
      customName: '',
      trusted: false,
      blocked: true,
      status: 'BLOCKED',
      source: 'WIFI_CLIENT_LIST',
      unblockAt: pastTime,
      firstSeen: pastTime,
      lastSeen: pastTime
    });

    // Still blocked device (not expired)
    DeviceRepository.upsert({
      routerId: 'test-router',
      macAddress: 'AA:BB:CC:DD:EE:02',
      ipAddress: '192.168.1.102',
      hostname: 'Active-Block-Device',
      vendor: 'VendorB',
      ssid: 'MyWiFi',
      band: '2.4GHz',
      receivingRate: '54M',
      customName: '',
      trusted: false,
      blocked: true,
      status: 'BLOCKED',
      source: 'WIFI_CLIENT_LIST',
      unblockAt: futureTime,
      firstSeen: pastTime,
      lastSeen: pastTime
    });

    const now = new Date().toISOString();
    const expiredList = DeviceRepository.getExpiredBlockedDevices(now);

    expect(expiredList.length).toBe(1);
    expect(expiredList[0].macAddress).toBe('AA:BB:CC:DD:EE:01');
  });

  it('should automatically remove block from router and set device ONLINE when timer expires in syncDevices', async () => {
    const adapter = new MockRouterAdapter();
    const discovery = new DeviceDiscoveryService(adapter);

    const pastTime = new Date(Date.now() - 1000).toISOString();
    const testMac = 'AA:BB:CC:DD:EE:99';

    // Seed blocked device on router
    await adapter.addBlockedDevice(testMac, 'Test Block');
    expect((await adapter.getBlockedDevices()).length).toBe(1);

    // Seed expired blocked device in SQLite
    const dev = DeviceRepository.upsert({
      routerId: 'mock-router',
      macAddress: testMac,
      ipAddress: '192.168.1.99',
      hostname: 'Timer-Device',
      vendor: 'TestVendor',
      ssid: 'MyWiFi',
      band: '5GHz',
      receivingRate: '100M',
      customName: 'Testing Auto Unblock',
      trusted: false,
      blocked: true,
      status: 'BLOCKED',
      source: 'WIFI_CLIENT_LIST',
      unblockAt: pastTime,
      firstSeen: pastTime,
      lastSeen: pastTime
    });

    // Run syncDevices cycle
    await discovery.syncDevices();

    // Verify adapter had block removed
    const routerBlocked = await adapter.getBlockedDevices();
    expect(routerBlocked.some(b => b.macAddress === testMac)).toBe(false);

    // Verify device in DB is unblocked and online
    const updated = DeviceRepository.getById(dev.id);
    expect(updated?.blocked).toBe(false);
    expect(updated?.unblockAt).toBeUndefined();
  });

  it('should pass TimeStart and TimeStop options to router adapter', async () => {
    const adapter = new MockRouterAdapter();
    const testMac = 'BB:02:F6:D8:64:73';

    await adapter.addBlockedDevice(testMac, 'Nightly Block', {
      timeStart: '22:00',
      timeStop: '06:00'
    });

    const entries = await adapter.getBlockedDevices();
    const entry = entries.find(e => e.macAddress === testMac);
    expect(entry).toBeDefined();
    expect(entry?.time).toBe('22:00-06:00');
  });
});
