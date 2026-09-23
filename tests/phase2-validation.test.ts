import { describe, it, expect } from 'vitest';
import { MacService } from '../src/main/services/MacService';
import { SelfBlockService } from '../src/main/services/SelfBlockService';
import { FiberHomeHG6145D2Adapter } from '../src/main/router/FiberHomeHG6145D2Adapter';
import { MacFilteringError, SelfBlockError } from '../src/shared/types/router';

describe('Phase 2 Safety & Validation Unit Tests', () => {
  it('should validate MAC normalization and formatting', () => {
    expect(MacService.normalize('3c:9c:0f:4a:17:8a')).toBe('3C:9C:0F:4A:17:8A');
    expect(MacService.normalize('BA-02-F6-D8-64-73')).toBe('BA:02:F6:D8:64:73');
    expect(MacService.isValid('3C:9C:0F:4A:17:8A')).toBe(true);
    expect(MacService.isValid('invalid-mac')).toBe(false);
  });

  it('should prevent self-blocking of host computer network adapters', () => {
    const hostMacs = SelfBlockService.getHostMacAddresses();
    expect(hostMacs.length).toBeGreaterThan(0);
    expect(() => SelfBlockService.assertNotHost(hostMacs[0])).toThrow(SelfBlockError);
  });

  it('should reject blocking if MAC filtering is disabled on the router', async () => {
    const adapter = new FiberHomeHG6145D2Adapter('192.168.1.1');

    // Mock getMacFilterConfig to return disabled state
    (adapter as any).getMacFilterConfig = async () => ({
      enabled: false,
      mode: 'BLACKLIST',
      entries: []
    });

    await expect(
      adapter.addBlockedDevice('BA:02:F6:D8:64:73')
    ).rejects.toThrow('MAC Filtering is disabled on the router');
  });

  it('should reject blocking if router is not in BLACKLIST mode', async () => {
    const adapter = new FiberHomeHG6145D2Adapter('192.168.1.1');

    // Mock getMacFilterConfig to return WHITELIST mode
    (adapter as any).getMacFilterConfig = async () => ({
      enabled: true,
      mode: 'WHITELIST',
      entries: []
    });

    await expect(
      adapter.addBlockedDevice('BA:02:F6:D8:64:73')
    ).rejects.toThrow('Router MAC Filtering is not in Black List mode.');
  });

  it('should reject duplicate entry if device is already in blacklist', async () => {
    const adapter = new FiberHomeHG6145D2Adapter('192.168.1.1');

    (adapter as any).getMacFilterConfig = async () => ({
      enabled: true,
      mode: 'BLACKLIST',
      entries: [{ macAddress: 'BA:02:F6:D8:64:73' }]
    });

    await expect(
      adapter.addBlockedDevice('ba:02:f6:d8:64:73')
    ).rejects.toThrow('Device is already in the router blacklist.');
  });

  it('should respect ROUTER_WRITE_DRY_RUN mode and make no router changes', async () => {
    process.env.ROUTER_WRITE_DRY_RUN = 'true';
    const adapter = new FiberHomeHG6145D2Adapter('192.168.1.1');

    (adapter as any).getMacFilterConfig = async () => ({
      enabled: true,
      mode: 'BLACKLIST',
      entries: []
    });

    let postCalled = false;
    (adapter as any).postCgi = async () => {
      postCalled = true;
      return { result: 0 };
    };

    await adapter.addBlockedDevice('BA:02:F6:D8:64:73');
    expect(postCalled).toBe(false);
    delete process.env.ROUTER_WRITE_DRY_RUN;
  });

  it('should fail if post-block verification does not confirm the MAC was added', async () => {
    const adapter = new FiberHomeHG6145D2Adapter('192.168.1.1');

    let callCount = 0;
    (adapter as any).getMacFilterConfig = async () => {
      callCount++;
      return {
        enabled: true,
        mode: 'BLACKLIST',
        entries: [] // Never includes the new device even after post
      };
    };

    (adapter as any).postCgi = async () => ({ result: 0 });

    await expect(
      adapter.addBlockedDevice('BA:02:F6:D8:64:73')
    ).rejects.toThrow('The router did not confirm the requested change.');
  });

  it('should fail if post-unblock verification still detects the MAC in blacklist', async () => {
    const adapter = new FiberHomeHG6145D2Adapter('192.168.1.1');

    (adapter as any).getMacFilterConfig = async () => ({
      enabled: true,
      mode: 'BLACKLIST',
      entries: [{ id: 'rule-1', macAddress: 'BA:02:F6:D8:64:73' }]
    });

    (adapter as any).postCgi = async () => ({ result: 0 });

    await expect(
      adapter.removeBlockedDevice('BA:02:F6:D8:64:73')
    ).rejects.toThrow('The router did not confirm removal of the requested device.');
  });
});
