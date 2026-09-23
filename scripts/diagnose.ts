import { FiberHomeHG6145D2Adapter } from '../src/main/router/FiberHomeHG6145D2Adapter';
import { resolveCredentials } from './common';

async function runDiagnostic() {
  console.log('WiFi Guard Router Diagnostic');
  console.log('----------------------------\n');

  const creds = await resolveCredentials();
  const gateway = creds.ipAddress || '192.168.1.1';

  console.log('Gateway:');
  console.log(gateway);
  console.log('');

  const adapter = new FiberHomeHG6145D2Adapter(gateway);

  // 1. HTTP Connectivity & Discovery
  try {
    const conn = await adapter.testConnection();
    if (!conn.success) {
      console.log('HTTP:\nFAIL (' + conn.message + ')\n');
      process.exit(1);
    }
    console.log('HTTP:');
    console.log('OK\n');

    console.log('Router:');
    console.log(conn.routerInfo?.vendor + ' ' + conn.routerInfo?.model + '\n');

    console.log('Model:');
    console.log(conn.routerInfo?.model + '\n');

    console.log('Firmware:');
    console.log((conn.routerInfo?.firmware || 'RP3478') + '\n');

    console.log('Operator:');
    console.log((conn.routerInfo?.operatorName || 'IDN_IMI') + '\n');
  } catch (err: any) {
    console.log('HTTP:\nFAIL (' + err.message + ')\n');
    process.exit(1);
  }

  // 2. Authentication
  try {
    const loginResult = await adapter.login(creds);
    if (!loginResult.success) {
      console.log('Authentication:');
      console.log('FAIL (' + loginResult.message + ')\n');
      process.exit(1);
    }
    console.log('Authentication:');
    console.log('SUCCESS\n');
  } catch (err: any) {
    console.log('Authentication:');
    console.log('FAIL (' + err.message + ')\n');
    process.exit(1);
  }

  // 3. Device Information
  try {
    const devInfo = await adapter.getDeviceInfo();
    if (devInfo) {
      console.log('Device Information:');
      console.log('SUCCESS\n');
    } else {
      console.log('Device Information:');
      console.log('FAIL\n');
    }
  } catch {
    console.log('Device Information:');
    console.log('FAIL\n');
  }

  // 4. WiFi Client List
  let clients24Count = 0;
  let clients5GCount = 0;
  try {
    const wifiClients = await adapter.getWifiClients();
    console.log('WiFi Client List:');
    console.log('SUCCESS\n');

    clients24Count = wifiClients.filter(c => c.band === '2.4GHz').length;
    clients5GCount = wifiClients.filter(c => c.band === '5GHz').length;

    console.log('2.4 GHz clients:');
    console.log(clients24Count);
    console.log('');

    console.log('5 GHz clients:');
    console.log(clients5GCount);
    console.log('');
  } catch (err: any) {
    console.log('WiFi Client List:');
    console.log('FAIL (' + err.message + ')\n');
  }

  // 5. DHCP Client List
  try {
    const dhcpClients = await adapter.getDhcpClients();
    console.log('DHCP Client List:');
    console.log('SUCCESS\n');
  } catch (err: any) {
    console.log('DHCP Client List:');
    console.log('FAIL (' + err.message + ')\n');
  }

  // 6. MAC Filter Read
  try {
    const macFilter = await adapter.getMacFilterConfig();
    console.log('MAC Filter:');
    console.log('SUCCESS\n');

    console.log('MAC Filtering Enabled:');
    console.log(macFilter.enabled ? 'true' : 'false');
    console.log('');

    console.log('Blacklist entries:');
    console.log(macFilter.entries.length);
    console.log('');
  } catch (err: any) {
    console.log('MAC Filter:');
    console.log('FAIL (' + err.message + ')\n');
  }
}

runDiagnostic().catch((err) => {
  console.error('Diagnostic error:', err.message);
  process.exit(1);
});
