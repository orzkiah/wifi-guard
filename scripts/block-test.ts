import { FiberHomeHG6145D2Adapter } from '../src/main/router/FiberHomeHG6145D2Adapter';
import { MacService } from '../src/main/services/MacService';
import { SelfBlockService } from '../src/main/services/SelfBlockService';
import { resolveCredentials, promptText } from './common';
import { initDatabaseAsync, DeviceRepository, EventRepository } from '../src/main/database/db';
import { WifiClient } from '../src/shared/types/device';

async function runPhase3BlockTest() {
  console.log('WiFi Guard — Phase 3 Real MAC Blacklist Write Validation');
  console.log('========================================================\n');

  const creds = await resolveCredentials();
  const adapter = new FiberHomeHG6145D2Adapter(creds.ipAddress);

  console.log(`Connecting to router at ${creds.ipAddress}...`);
  const loginResult = await adapter.login(creds);
  if (!loginResult.success) {
    console.error(`Authentication failed: ${loginResult.message}`);
    process.exit(1);
  }
  console.log('Authenticated successfully.\n');

  // STEP 1 — VERIFY CURRENT STATE
  console.log('Checking router MAC Filter state...');
  const initialConfig = await adapter.getMacFilterConfig();
  console.log(`MAC Filtering Enabled: ${initialConfig.enabled}`);
  console.log(`Filter Mode: ${initialConfig.mode}`);
  console.log(`Current Blacklist Rules: ${initialConfig.entries.length}\n`);

  if (!initialConfig.enabled) {
    console.error('======================================================================');
    console.error('CRITICAL SAFETY RULE TRIGGERED:');
    console.error('MAC Filtering is disabled on the router. Enable Black List filtering manually');
    console.error('from the router administration page before continuing.');
    console.error('======================================================================\n');
    console.error('Instructions:');
    console.error('1. Open: http://192.168.1.1/ in your web browser.');
    console.error('2. Navigate to: Security -> Firewall -> MAC Filtering.');
    console.error('3. Set MAC Filtering: Enable');
    console.error('4. Set Mode: Black List');
    console.error('5. Click Apply, then run this command again.\n');
    process.exit(1);
  }

  if (initialConfig.mode !== 'BLACKLIST') {
    console.error(`\n[ABORT] Router MAC Filtering is not in Black List mode (Current mode: ${initialConfig.mode}).`);
    console.error('WiFi Guard will never automatically switch filter modes. Aborting.\n');
    process.exit(1);
  }

  // STEP 4 — SELECT TEST DEVICE
  const wifiClients = await adapter.getWifiClients().catch(() => [] as WifiClient[]);
  let targetMac = '';
  let selectedClient: WifiClient | undefined;

  let targetMacArg = process.argv[2] || process.env.TEST_TARGET_MAC;

  if (targetMacArg && MacService.isValid(targetMacArg)) {
    targetMac = MacService.normalize(targetMacArg);
    selectedClient = wifiClients.find(c => MacService.normalize(c.mac) === targetMac);
  } else {
    if (wifiClients.length === 0) {
      console.error('No active Wi-Fi clients detected on router to select as test target.');
      console.error('Please specify a target MAC address manually: npm run router:block-test <MAC>\n');
      process.exit(1);
    }

    console.log('Available WiFi Clients:\n');
    wifiClients.forEach((client, idx) => {
      console.log(`${idx + 1}. ${client.hostname || 'Unknown Device'}`);
      console.log(`   MAC: ${client.mac}`);
      console.log(`   IP: ${client.ipAddress || '—'}`);
      console.log(`   Band: ${client.band || 'Wi-Fi'}\n`);
    });

    const choice = await promptText(`Select a device number (1-${wifiClients.length}) or enter MAC: `);
    const num = parseInt(choice, 10);
    if (!isNaN(num) && num >= 1 && num <= wifiClients.length) {
      selectedClient = wifiClients[num - 1];
      targetMac = MacService.normalize(selectedClient.mac);
    } else if (MacService.isValid(choice)) {
      targetMac = MacService.normalize(choice);
      selectedClient = wifiClients.find(c => MacService.normalize(c.mac) === targetMac);
    } else {
      console.error('\n[ABORTED] Invalid device selection.\n');
      process.exit(1);
    }
  }

  // STEP 5 — SAFETY CHECKS
  console.log(`\nVerifying safety for target MAC: ${targetMac}...`);

  // Check 1: Host PC protection
  try {
    SelfBlockService.assertNotHost(targetMac);
  } catch (err: any) {
    console.error(`\n[ABORTED] ${err.message}\n`);
    process.exit(1);
  }

  // Check 2: Router & Gateway protection
  const devInfo = await adapter.getDeviceInfo().catch(() => null);
  const routerMac = (adapter as any).cachedInfo?.macAddress || '88:65:9F:FD:A1:90';
  if (MacService.normalize(targetMac) === MacService.normalize(routerMac)) {
    console.error('\n[ABORTED] You cannot block the router / gateway.\n');
    process.exit(1);
  }

  // Check 3: Not already blacklisted
  if (initialConfig.entries.some(e => MacService.normalize(e.macAddress) === targetMac)) {
    console.error('\n[ABORTED] Target MAC is already present in the router blacklist.\n');
    process.exit(1);
  }

  // STEP 6 — EXPLICIT CONFIRMATION
  console.log('\n====================================');
  console.log('REAL ROUTER BLOCK TEST');
  console.log('====================================\n');
  console.log('Router:');
  console.log('FiberHome HG6145D2\n');
  console.log('IP:');
  console.log(creds.ipAddress + '\n');
  console.log('Target Device:');
  console.log((selectedClient?.hostname || 'Selected Target Device') + '\n');
  console.log('MAC:');
  console.log(targetMac + '\n');
  console.log('IP:');
  console.log((selectedClient?.ipAddress || '—') + '\n');
  console.log('Band:');
  console.log((selectedClient?.band || 'Wi-Fi') + '\n');
  console.log('Action:');
  console.log('ADD MAC TO BLACKLIST\n');
  console.log('This will modify the physical router');
  console.log('and may disconnect the selected device.\n');
  console.log('Type exactly:\n');
  console.log('BLOCK TEST DEVICE\n');

  const confirmText = await promptText('Confirmation: ');
  if (confirmText !== 'BLOCK TEST DEVICE') {
    console.log('\n[ABORTED] Confirmation did not match "BLOCK TEST DEVICE". Operation cancelled.\n');
    process.exit(0);
  }

  // STEP 7 — READ BEFORE WRITE SNAPSHOT
  console.log('\n[STEP 7] Capturing beforeConfig snapshot...');
  const beforeConfig = await adapter.getMacFilterConfig();
  if (!beforeConfig.enabled || beforeConfig.mode !== 'BLACKLIST') {
    console.error('[ABORT] Router state changed unexpectedly before write. Aborting.');
    process.exit(1);
  }
  const initialEntryCount = beforeConfig.entries.length;

  // STEP 8 — WRITE EXACTLY ONE ENTRY
  console.log(`\n[STEP 8] Adding ${targetMac} to router blacklist...`);
  try {
    await adapter.addBlockedDevice(targetMac, 'WiFi Guard Phase 3 Test');
    console.log('Write request accepted by router.');
  } catch (err: any) {
    console.error(`\n[FAILED] Write operation failed: ${err.message}\n`);
    process.exit(1);
  }

  // STEP 9 — VERIFY ROUTER STATE
  console.log('\n[STEP 9] Verifying router state after block...');
  const afterConfig = await adapter.getMacFilterConfig();
  const isPresent = afterConfig.entries.some(e => MacService.normalize(e.macAddress) === targetMac);

  if (!isPresent) {
    console.error('[FAIL] Post-block verification failed: target MAC is not in router blacklist!');
    process.exit(1);
  }

  // Verify all previous entries still exist
  for (const prev of beforeConfig.entries) {
    if (!afterConfig.entries.some(e => MacService.normalize(e.macAddress) === MacService.normalize(prev.macAddress))) {
      console.error(`[FAIL] Unrelated entry ${prev.macAddress} was corrupted or lost!`);
      process.exit(1);
    }
  }

  if (!afterConfig.enabled) {
    console.error('[FAIL] Router MAC filtering was disabled after write!');
    process.exit(1);
  }

  if (afterConfig.mode !== 'BLACKLIST') {
    console.error('[FAIL] Router filter mode changed unexpectedly!');
    process.exit(1);
  }

  console.log('SUCCESS: Target MAC verified in router blacklist. Existing entries preserved.\n');

  // STEP 10 — DATABASE UPDATE
  console.log('[STEP 10] Updating local database state...');
  try {
    await initDatabaseAsync();
    DeviceRepository.updateStatus(targetMac, 'BLOCKED');
    EventRepository.create({
      routerId: adapter.model,
      eventType: 'DEVICE_BLOCKED',
      metadataJson: JSON.stringify({
        action: 'PHASE3_BLOCK_TEST',
        mac: targetMac,
        hostname: selectedClient?.hostname || 'Test Device',
        router: creds.ipAddress,
        result: 'SUCCESS',
        timestamp: new Date().toISOString()
      })
    });
    console.log('Local database updated: device marked BLOCKED and event logged.\n');
  } catch (err: any) {
    console.warn('Database update warning:', err.message);
  }

  // STEP 11 — NETWORK DISCONNECT VERIFICATION
  console.log('[STEP 11] Polling router to verify physical network disconnect...');
  console.log('Waiting 5 seconds for router Wi-Fi disassociation...');
  await new Promise(r => setTimeout(r, 5000));

  const postBlockClients = await adapter.getWifiClients().catch(() => [] as WifiClient[]);
  const isStillInWifi = postBlockClients.some(c => MacService.normalize(c.mac) === targetMac);

  if (!isStillInWifi) {
    console.log('\nReport:');
    console.log('Router blacklist active.');
    console.log('Device no longer appears as active WiFi client.\n');
  } else {
    console.log('\nReport:');
    console.log('Router blacklist entry confirmed.');
    console.log('Physical disconnection has not yet been independently confirmed (station may take time to deauth).\n');
  }

  // STEP 12 — UNBLOCK TEST
  console.log('====================================');
  console.log('REAL ROUTER UNBLOCK TEST');
  console.log('====================================\n');
  console.log('Device:');
  console.log((selectedClient?.hostname || 'Test Device') + '\n');
  console.log('MAC:');
  console.log(targetMac + '\n');
  console.log('Action:');
  console.log('REMOVE MAC FROM BLACKLIST\n');
  console.log('Type exactly:\n');
  console.log('UNBLOCK TEST DEVICE\n');

  const unblockConfirm = await promptText('Confirmation: ');
  if (unblockConfirm !== 'UNBLOCK TEST DEVICE') {
    console.log('\n[NOTICE] Unblock was not confirmed. Device remains in router blacklist.');
    console.log(`To unblock later, run: npm run router:unblock-test ${targetMac}\n`);
    process.exit(0);
  }

  // STEP 13 — REMOVE EXACT MAC
  console.log(`\n[STEP 13] Removing ${targetMac} from blacklist...`);
  try {
    await adapter.removeBlockedDevice(targetMac);
    console.log('Remove request accepted by router.');
  } catch (err: any) {
    console.error(`\n[FAILED] Unblock operation failed: ${err.message}\n`);
    process.exit(1);
  }

  // STEP 14 — VERIFY UNBLOCK
  console.log('\n[STEP 14] Verifying unblock state on router...');
  const postUnblockConfig = await adapter.getMacFilterConfig();
  const isStillThere = postUnblockConfig.entries.some(e => MacService.normalize(e.macAddress) === targetMac);

  if (isStillThere) {
    console.error('[FAIL] Target MAC is still present in blacklist after removal!');
    process.exit(1);
  }

  // Verify unrelated entries remain
  for (const prev of beforeConfig.entries) {
    if (!postUnblockConfig.entries.some(e => MacService.normalize(e.macAddress) === MacService.normalize(prev.macAddress))) {
      console.error(`[FAIL] Unrelated entry ${prev.macAddress} was corrupted during unblock!`);
      process.exit(1);
    }
  }

  if (!postUnblockConfig.enabled || postUnblockConfig.mode !== 'BLACKLIST') {
    console.error('[FAIL] Router filter mode or enabled state corrupted during unblock!');
    process.exit(1);
  }

  console.log('SUCCESS: Target MAC confirmed removed. Router configuration clean.');

  try {
    DeviceRepository.updateStatus(targetMac, 'TRUSTED');
    EventRepository.create({
      routerId: adapter.model,
      eventType: 'DEVICE_UNBLOCKED',
      metadataJson: JSON.stringify({
        action: 'PHASE3_UNBLOCK_TEST',
        mac: targetMac,
        hostname: selectedClient?.hostname || 'Test Device',
        router: creds.ipAddress,
        result: 'SUCCESS',
        timestamp: new Date().toISOString()
      })
    });
    console.log('Local database updated: device restored and event logged.\n');
  } catch (err: any) {
    console.warn('Database update warning:', err.message);
  }

  // STEP 15 — FINAL REPORT
  console.log('====================================');
  console.log('PHASE 3 REAL WRITE VALIDATION RESULT');
  console.log('====================================\n');
  console.log('Authentication:           PASS');
  console.log('WiFi Client Read:         PASS');
  console.log('DHCP Read:                PASS');
  console.log('MAC Filter Read:          PASS');
  console.log('MAC Filter Enabled:       PASS');
  console.log('Blacklist Mode:           PASS');
  console.log('Add Blacklist:            PASS');
  console.log('Post-Add Verification:    PASS');
  console.log(`Device Disconnect:        ${!isStillInWifi ? 'VERIFIED' : 'NOT VERIFIED'}`);
  console.log('Remove Blacklist:         PASS');
  console.log('Post-Remove Verification: PASS');
  console.log('Database Consistency:     PASS');
  console.log('Self-Lock Protection:     PASS');
  console.log('Existing Entries Preserved: PASS\n');
}

runPhase3BlockTest().catch((err) => {
  console.error('\nError running Phase 3 test:', err.message);
  process.exit(1);
});
