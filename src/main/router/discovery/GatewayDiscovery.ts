import { exec } from 'node:child_process';
import util from 'node:util';

const execAsync = util.promisify(exec);

export const GatewayDiscovery = {
  /**
   * Discovers the default gateway IP address on the operating system.
   */
  async detectGateway(): Promise<string> {
    // Windows routing table check
    if (process.platform === 'win32') {
      try {
        const { stdout } = await execAsync(
          'powershell -NoProfile -Command "(Get-NetRoute -DestinationPrefix \'0.0.0.0/0\' | Select-Object -First 1).NextHop"'
        );
        const ip = stdout.trim();
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip) && ip !== '0.0.0.0') {
          return ip;
        }
      } catch {
        // Fallback to route print
        try {
          const { stdout } = await execAsync('route print 0.0.0.0');
          const lines = stdout.split('\n');
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts[0] === '0.0.0.0' && parts[1] === '0.0.0.0' && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parts[2])) {
              return parts[2];
            }
          }
        } catch {
          // Ignore
        }
      }
    }

    // Unix / macOS fallback
    if (process.platform === 'darwin' || process.platform === 'linux') {
      try {
        const { stdout } = await execAsync("ip route show default | awk '{print $3}'");
        const ip = stdout.trim();
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
          return ip;
        }
      } catch {
        // Ignore
      }
    }

    return '192.168.1.1';
  }
};
