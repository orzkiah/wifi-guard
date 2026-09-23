import { describe, it, expect } from 'vitest';
import { SelfBlockService } from '../src/main/services/SelfBlockService';
import { SelfBlockError } from '../src/shared/types/router';

describe('SelfBlockService Lockout Protection', () => {
  it('should detect local host MAC addresses', () => {
    const hostMacs = SelfBlockService.getHostMacAddresses();
    expect(Array.isArray(hostMacs)).toBe(true);
    // On any real machine connected to network, hostMacs has at least 1 adapter
    expect(hostMacs.length).toBeGreaterThan(0);
  });

  it('should recognize host MAC and prevent self-lockout', () => {
    const hostMacs = SelfBlockService.getHostMacAddresses();
    const primaryHostMac = hostMacs[0];

    expect(SelfBlockService.isHost(primaryHostMac)).toBe(true);
    expect(() => SelfBlockService.assertNotHost(primaryHostMac)).toThrow(SelfBlockError);
  });

  it('should allow external MAC addresses that do not belong to host', () => {
    const externalMac = 'FE:55:51:FF:46:E2'; // Galaxy-M30s test sample
    const hostMacs = SelfBlockService.getHostMacAddresses();

    if (!hostMacs.includes(externalMac)) {
      expect(SelfBlockService.isHost(externalMac)).toBe(false);
      expect(() => SelfBlockService.assertNotHost(externalMac)).not.toThrow();
    }
  });
});
