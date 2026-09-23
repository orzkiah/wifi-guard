import os from 'node:os';
import { MacService } from './MacService';
import { SelfBlockError } from '../../shared/types/router';

export const SelfBlockService = {
  /**
   * Retrieves all normalized MAC addresses associated with the local host system.
   */
  getHostMacAddresses(): string[] {
    const interfaces = os.networkInterfaces();
    const macs = new Set<string>();

    for (const name of Object.keys(interfaces)) {
      const ifaceList = interfaces[name];
      if (!ifaceList) continue;

      for (const iface of ifaceList) {
        if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
          try {
            macs.add(MacService.normalize(iface.mac));
          } catch {
            // Ignore malformed
          }
        }
      }
    }

    return Array.from(macs);
  },

  /**
   * Checks whether the target MAC matches the machine currently running WiFi Guard.
   * Throws SelfBlockError if matching to prevent accidental lockout.
   */
  assertNotHost(targetMac: string): void {
    if (!targetMac) return;
    const normalizedTarget = MacService.normalize(targetMac);
    const hostMacs = this.getHostMacAddresses();

    if (hostMacs.includes(normalizedTarget)) {
      throw new SelfBlockError('You cannot block the computer running WiFi Guard.');
    }
  },

  assertNotRouter(targetMac: string, routerMac?: string): void {
    if (!targetMac || !routerMac) return;
    if (MacService.normalize(targetMac) === MacService.normalize(routerMac)) {
      throw new SelfBlockError('You cannot block the router.');
    }
  },

  assertNotGateway(targetMac: string, gatewayMac?: string): void {
    if (!targetMac || !gatewayMac) return;
    if (MacService.normalize(targetMac) === MacService.normalize(gatewayMac)) {
      throw new SelfBlockError('You cannot block the gateway.');
    }
  },

  isHost(targetMac: string): boolean {
    if (!targetMac) return false;
    try {
      const normalizedTarget = MacService.normalize(targetMac);
      return this.getHostMacAddresses().includes(normalizedTarget);
    } catch {
      return false;
    }
  }
};
