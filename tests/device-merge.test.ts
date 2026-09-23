import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DeviceDiscoveryService } from '../src/main/services/DeviceDiscoveryService';
import { MockRouterAdapter } from '../src/main/router/MockRouterAdapter';
import { initDatabaseAsync, closeDatabase, DeviceRepository } from '../src/main/database/db';
import path from 'node:path';
import fs from 'node:fs';

describe('DeviceDiscoveryService Merging & Sync', () => {
  const testDbPath = path.resolve(process.cwd(), '.data', 'test_wifiguard.db');

  beforeEach(async () => {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    await initDatabaseAsync(testDbPath);
  });

  afterEach(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  });

  it('should merge Wi-Fi stations and DHCP leases correctly by normalized MAC', async () => {
    const mockAdapter = new MockRouterAdapter('192.168.1.1');
    const service = new DeviceDiscoveryService(mockAdapter);

    const devices = await service.syncDevices();

    expect(devices.length).toBeGreaterThanOrEqual(5);

    // Verify Redmi-13 from sample
    const redmi = devices.find(d => d.macAddress === 'BA:02:F6:D8:64:73');
    expect(redmi).toBeDefined();
    expect(redmi?.hostname).toBe('Redmi-13');
    expect(redmi?.ipAddress).toBe('192.168.1.5');
    expect(redmi?.band).toBe('5GHz');
    expect(redmi?.receivingRate).toBe('260M');
    expect(redmi?.vendor).toContain('Xiaomi');

    // Verify Orzkiah 2.4GHz
    const orzkiah = devices.find(d => d.macAddress === '3C:9C:0F:4A:17:8A');
    expect(orzkiah).toBeDefined();
    expect(orzkiah?.hostname).toBe('Orzkiah');
    expect(orzkiah?.band).toBe('2.4GHz');
    expect(orzkiah?.receivingRate).toBe('57M');
  });

  it('should persist trusted status across multiple syncs', async () => {
    const mockAdapter = new MockRouterAdapter('192.168.1.1');
    const service = new DeviceDiscoveryService(mockAdapter);

    let devices = await service.syncDevices();
    const redmi = devices.find(d => d.macAddress === 'BA:02:F6:D8:64:73')!;

    // Mark trusted and rename
    DeviceRepository.setTrusted(redmi.id, true);
    DeviceRepository.setCustomName(redmi.id, 'HP Redmi Rizki');

    // Re-sync
    devices = await service.syncDevices();
    const updatedRedmi = devices.find(d => d.macAddress === 'BA:02:F6:D8:64:73')!;

    expect(updatedRedmi.trusted).toBe(true);
    expect(updatedRedmi.customName).toBe('HP Redmi Rizki');
  });
});
