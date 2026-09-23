import { FiberHomeHG6145D2Adapter } from '../src/main/router/FiberHomeHG6145D2Adapter';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const adapter = new FiberHomeHG6145D2Adapter(process.env.ROUTER_IP || '192.168.1.1');
  const loginRes = await adapter.login({
    username: process.env.ROUTER_USERNAME || 'user',
    password: process.env.ROUTER_PASSWORD || 'user1234'
  });
  console.log('LOGIN:', loginRes.success ? 'OK' : 'FAILED');

  const raw = await (adapter as any).getCgi('get_ipv4_mac_filter_info');
  console.log('RAW_FILTER_INFO:', JSON.stringify(raw, null, 2));

  const filter = await adapter.getMacFilterConfig();
  console.log('FILTER_ENABLED:', filter.enabled);
  console.log('FILTER_MODE:', filter.mode);
  console.log('FILTER_ENTRIES:', JSON.stringify(filter.entries, null, 2));

  const wifi = await adapter.getWifiClients();
  console.log('ACTIVE_WIFI_CLIENTS:', wifi.length);
  for (const c of wifi) {
    console.log(`- ${c.hostname} | MAC: ${c.mac} | IP: ${c.ipAddress} | Band: ${c.band}`);
  }
}

main().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
