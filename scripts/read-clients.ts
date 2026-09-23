import { FiberHomeHG6145D2Adapter } from '../src/main/router/FiberHomeHG6145D2Adapter';
import { resolveCredentials } from './common';

async function runReadClients() {
  console.log('WiFi Guard — Live Client & MAC Filter Read');
  console.log('==========================================\n');

  const creds = await resolveCredentials();
  const adapter = new FiberHomeHG6145D2Adapter(creds.ipAddress);

  console.log(`Connecting to ${creds.ipAddress}...`);
  const loginResult = await adapter.login(creds);
  if (!loginResult.success) {
    console.error(`Authentication failed: ${loginResult.message}`);
    process.exit(1);
  }
  console.log('Authenticated successfully.\n');

  // 1. Wi-Fi Clients
  console.log('--- Active Wi-Fi Clients ---');
  const wifiClients = await adapter.getWifiClients();
  if (wifiClients.length === 0) {
    console.log('No Wi-Fi clients currently reported by router.');
  } else {
    for (const c of wifiClients) {
      console.log(`[${c.band}] Host: ${c.hostname || 'Unknown'} | MAC: ${c.mac} | IP: ${c.ipAddress || '—'} | SSID: ${c.ssid} | Rate: ${c.receivingRate || '—'}`);
    }
  }
  console.log(`Total Wi-Fi stations: ${wifiClients.length}\n`);

  // 2. DHCP Leases
  console.log('--- DHCP Lease Clients ---');
  const dhcpClients = await adapter.getDhcpClients();
  if (dhcpClients.length === 0) {
    console.log('No active DHCP leases reported.');
  } else {
    for (const d of dhcpClients) {
      console.log(`Host: ${d.hostname || 'Unknown'} | MAC: ${d.mac} | IP: ${d.ipAddress}`);
    }
  }
  console.log(`Total DHCP clients: ${dhcpClients.length}\n`);

  // 3. MAC Filtering Status
  console.log('--- MAC Filtering Configuration ---');
  const macConfig = await adapter.getMacFilterConfig();
  console.log(`Enabled: ${macConfig.enabled}`);
  console.log(`Mode: ${macConfig.mode}`);
  console.log(`Blacklist entries count: ${macConfig.entries.length}`);
  if (macConfig.entries.length > 0) {
    for (const e of macConfig.entries) {
      console.log(` - MAC: ${e.macAddress} | Comment: ${e.comment || '—'}`);
    }
  }
  console.log('');
}

runReadClients().catch((err) => {
  console.error('Read error:', err.message);
  process.exit(1);
});
