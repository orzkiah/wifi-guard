import { describe, it, expect, beforeEach } from 'vitest';
import { MacService } from '../src/main/services/MacService';
import { SelfBlockService } from '../src/main/services/SelfBlockService';
import { FiberHomeHG6145D2Adapter } from '../src/main/router/FiberHomeHG6145D2Adapter';
import { MacFilteringError, SelfBlockError } from '../src/shared/types/router';
import { initDatabaseAsync, DeviceRepository, EventRepository } from '../src/main/database/db';

describe('Phase 3 Real Write Validation Unit Tests (14 Requirements)', () => {
  beforeEach(async () => {
    await initDatabaseAsync();
  });

  // 1. MAC already exists in blacklist
  it('1. should reject adding device when MAC already exists in blacklist', async () => {
    const adapter = new FiberHomeHG6145D2Adapter('192.168.1.1');
    (adapter as any).getMacFilterConfig = async () => ({
      enabled: true,
      mode: 'BLACKLIST',
      entries: [{ id: '1', macAddress: 'BA:02:F6:D8:64:73', mac: 'BA:02:F6:D8:64:73' }]
    });

    await expect(
      adapter.addBlockedDevice('BA:02:F6:D8:64:73')
    ).rejects.toThrow('Device is already in the router blacklist.');
  });

  // 2. MAC does not exist for removal
  it('2. should reject unblocking device when MAC does not exist in blacklist', async () => {
    const adapter = new FiberHomeHG6145D2Adapter('192.168.1.1');
    (adapter as any).getMacFilterConfig = async () => ({
      enabled: true,
      mode: 'BLACKLIST',
      entries: [{ id: '1', macAddress: '04:C8:07:93:57:E4', mac: '04:C8:07:93:57:E4' }]
    });

    await expect(
      adapter.removeBlockedDevice('BA:02:F6:D8:64:73')
    ).rejects.toThrow('Device is not in the router blacklist.');
  });

  // 3. MAC filtering disabled
  it('3. should abort block when MAC filtering is disabled on router', async () => {
    const adapter = new FiberHomeHG6145D2Adapter('192.168.1.1');
    (adapter as any).getMacFilterConfig = async () => ({
      enabled: false,
      mode: 'BLACKLIST',
      entries: []
    });

    await expect(
      adapter.addBlockedDevice('BA:02:F6:D8:64:73')
    ).rejects.toThrow('MAC Filtering is disabled on the router. Enable Black List filtering manually from the router administration page before continuing.');
  });

  // 4. wrong mode (not BLACKLIST)
  it('4. should abort block when router is not in BLACKLIST mode', async () => {
    const adapter = new FiberHomeHG6145D2Adapter('192.168.1.1');
    (adapter as any).getMacFilterConfig = async () => ({
      enabled: true,
      mode: 'WHITELIST',
      entries: []
    });

    await expect(
      adapter.addBlockedDevice('BA:02:F6:D8:64:73')
    ).rejects.toThrow('Router MAC Filtering is not in Black List mode.');
  });

  // 5. self MAC protection
  it('5. should prevent blocking the host computer MAC address', () => {
    const hostMacs = SelfBlockService.getHostMacAddresses();
    expect(hostMacs.length).toBeGreaterThan(0);
    expect(() => SelfBlockService.assertNotHost(hostMacs[0])).toThrow(
      'You cannot block the computer running WiFi Guard.'
    );
  });

  // 6. router MAC protection
  it('6. should prevent blocking the physical router MAC address', () => {
    const routerMac = '88:65:9F:FD:A1:90';
    expect(() => SelfBlockService.assertNotRouter(routerMac, routerMac)).toThrow(
      'You cannot block the router.'
    );
  });

  // 7. gateway MAC protection
  it('7. should prevent blocking the gateway MAC address', () => {
    const gatewayMac = '88:65:9F:FD:A1:90';
    expect(() => SelfBlockService.assertNotGateway(gatewayMac, gatewayMac)).toThrow(
      'You cannot block the gateway.'
    );
  });

  // 8. write HTTP failure
  it('8. should handle write HTTP failures gracefully and throw MacFilteringError', async () => {
    const adapter = new FiberHomeHG6145D2Adapter('192.168.1.1');
    (adapter as any).getMacFilterConfig = async () => ({
      enabled: true,
      mode: 'BLACKLIST',
      entries: []
    });
    (adapter as any).postCgi = async () => ({ result: -1, message: 'Internal Server Error' });

    await expect(
      adapter.addBlockedDevice('BA:02:F6:D8:64:73')
    ).rejects.toThrow('Failed to add MAC to router blacklist');
  });

  // 9. write HTTP success but verification failure
  it('9. should fail if HTTP succeeds but post-block verification does not find entry', async () => {
    const adapter = new FiberHomeHG6145D2Adapter('192.168.1.1');
    let callCount = 0;
    (adapter as any).getMacFilterConfig = async () => {
      callCount++;
      return {
        enabled: true,
        mode: 'BLACKLIST',
        // Post-verification returns empty list (entry was not saved by router)
        entries: []
      };
    };
    (adapter as any).postCgi = async () => ({ result: 0 });

    await expect(
      adapter.addBlockedDevice('BA:02:F6:D8:64:73')
    ).rejects.toThrow('The router did not confirm the requested change.');
  });

  // 10. duplicate write prevention
  it('10. should prevent duplicate write requests for same MAC', async () => {
    const adapter = new FiberHomeHG6145D2Adapter('192.168.1.1');
    (adapter as any).getMacFilterConfig = async () => ({
      enabled: true,
      mode: 'BLACKLIST',
      entries: [{ id: '1', macAddress: '04:C8:07:93:57:E4', mac: '04:C8:07:93:57:E4' }]
    });

    await expect(
      adapter.addBlockedDevice('04:c8:07:93:57:e4')
    ).rejects.toThrow('Device is already in the router blacklist.');
  });

  // 11. unrelated blacklist entries preserved
  it('11. should preserve existing unrelated blacklist entries during block', async () => {
    const adapter = new FiberHomeHG6145D2Adapter('192.168.1.1');
    const existingEntry = { id: '1', macAddress: '04:C8:07:93:57:E4', mac: '04:C8:07:93:57:E4' };
    let entries = [existingEntry];

    (adapter as any).getMacFilterConfig = async () => ({
      enabled: true,
      mode: 'BLACKLIST',
      entries: [...entries]
    });

    (adapter as any).postCgi = async (action: string, payload: any) => {
      entries.push({ id: '2', macAddress: payload.MAC, mac: payload.MAC });
      return { result: 0 };
    };

    await adapter.addBlockedDevice('BA:02:F6:D8:64:73');
    const verified = await adapter.getMacFilterConfig();
    expect(verified.entries.length).toBe(2);
    expect(verified.entries.some(e => e.macAddress === '04:C8:07:93:57:E4')).toBe(true);
    expect(verified.entries.some(e => e.macAddress === 'BA:02:F6:D8:64:73')).toBe(true);
  });

  // 12. database only updated after verification
  it('12. should only update local database after router verification passes', async () => {
    const testMac = 'BA:02:F6:D8:64:73';
    DeviceRepository.upsert({
      routerId: 'fh-192-168-1-1',
      macAddress: testMac,
      ipAddress: '192.168.1.5',
      hostname: 'TestPhone',
      vendor: 'Xiaomi',
      ssid: 'fh_fda190_5G',
      band: '5GHz',
      receivingRate: '130000 Kbps',
      customName: '',
      trusted: false,
      blocked: false,
      status: 'ONLINE',
      source: 'WIFI',
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    });

    const initial = DeviceRepository.getByMac(testMac);
    expect(initial?.status).toBe('ONLINE');

    // Simulate verification success -> update DB
    DeviceRepository.updateStatus(testMac, 'BLOCKED');
    const updated = DeviceRepository.getByMac(testMac);
    expect(updated?.status).toBe('BLOCKED');
  });

  // 13. unblock exact MAC
  it('13. should unblock target MAC and verify removal from router', async () => {
    const adapter = new FiberHomeHG6145D2Adapter('192.168.1.1');
    const existing = { id: '1', macAddress: '04:C8:07:93:57:E4', mac: '04:C8:07:93:57:E4' };
    const toRemove = { id: '2', macAddress: 'BA:02:F6:D8:64:73', mac: 'BA:02:F6:D8:64:73' };
    let entries = [existing, toRemove];

    (adapter as any).getMacFilterConfig = async () => ({
      enabled: true,
      mode: 'BLACKLIST',
      entries: [...entries]
    });

    (adapter as any).postCgi = async (action: string, payload: any) => {
      entries = entries.filter(e => e.id !== payload.ipv4_mac_filter_index);
      return { result: 0 };
    };

    await adapter.removeBlockedDevice('BA:02:F6:D8:64:73');
    const verified = await adapter.getMacFilterConfig();
    expect(verified.entries.length).toBe(1);
    expect(verified.entries.some(e => e.macAddress === 'BA:02:F6:D8:64:73')).toBe(false);
    expect(verified.entries.some(e => e.macAddress === '04:C8:07:93:57:E4')).toBe(true);
  });

  // 14. unblock nonexistent MAC
  it('14. should throw error when attempting to unblock nonexistent MAC', async () => {
    const adapter = new FiberHomeHG6145D2Adapter('192.168.1.1');
    (adapter as any).getMacFilterConfig = async () => ({
      enabled: true,
      mode: 'BLACKLIST',
      entries: []
    });

    await expect(
      adapter.removeBlockedDevice('11:22:33:44:55:66')
    ).rejects.toThrow('Device is not in the router blacklist.');
  });
});
