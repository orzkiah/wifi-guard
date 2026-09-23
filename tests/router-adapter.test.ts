import { describe, it, expect } from 'vitest';
import { MockRouterAdapter } from '../src/main/router/MockRouterAdapter';

describe('MockRouterAdapter Operations', () => {
  it('should test connection and return router hardware info', async () => {
    const adapter = new MockRouterAdapter('192.168.1.1');
    const result = await adapter.testConnection();

    expect(result.success).toBe(true);
    expect(result.routerInfo?.model).toBe('HG6145D2');
    expect(result.routerInfo?.firmware).toBe('RP3478');
    expect(result.routerInfo?.vendor).toBe('FiberHome');
  });

  it('should manage blocked devices in MAC filtering blacklist', async () => {
    const adapter = new MockRouterAdapter('192.168.1.1');

    const targetMac = 'FE:55:51:FF:46:E2'; // Galaxy-M30s
    await adapter.addBlockedDevice(targetMac, 'Test Block');

    const blockedList = await adapter.getBlockedDevices();
    expect(blockedList.some(b => b.mac === targetMac)).toBe(true);

    const filterConfig = await adapter.getMacFilterConfig();
    expect(filterConfig.enabled).toBe(true);
    expect(filterConfig.mode).toBe('BLACKLIST');

    // Remove from blacklist
    await adapter.removeBlockedDevice(targetMac);
    const updatedBlockedList = await adapter.getBlockedDevices();
    expect(updatedBlockedList.some(b => b.mac === targetMac)).toBe(false);
  });
});
