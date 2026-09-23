import { FiberHomeHG6145D2Adapter } from '../src/main/router/FiberHomeHG6145D2Adapter';
import { MacService } from '../src/main/services/MacService';
import { resolveCredentials, promptText } from './common';
import { initDatabaseAsync, EventRepository } from '../src/main/database/db';

async function runUnblockTest() {
  const targetMacArg = process.argv[2] || process.env.TEST_TARGET_MAC;

  if (!targetMacArg) {
    console.error('\nUsage: npm run router:unblock-test <TARGET_MAC>\nOr set TEST_TARGET_MAC in environment.\n');
    console.error('Example: npm run router:unblock-test 3C:9C:0F:4A:17:8A\n');
    process.exit(1);
  }

  if (!MacService.isValid(targetMacArg)) {
    console.error(`Error: Invalid MAC address format: "${targetMacArg}"`);
    process.exit(1);
  }

  const targetMac = MacService.normalize(targetMacArg);
  const creds = await resolveCredentials();
  const adapter = new FiberHomeHG6145D2Adapter(creds.ipAddress);

  console.log(`\nConnecting to ${creds.ipAddress}...`);
  const loginResult = await adapter.login(creds);
  if (!loginResult.success) {
    console.error(`Authentication failed: ${loginResult.message}`);
    process.exit(1);
  }

  console.log('\n=============================================');
  console.log('REAL ROUTER UNBLOCK TEST\n');
  console.log('Target MAC: ' + targetMac);
  console.log('Action: REMOVE FROM BLACKLIST');
  console.log('=============================================\n');

  console.log('To confirm removing this device from the router blacklist,');
  console.log('type the exact phrase: UNBLOCK MY TEST DEVICE\n');

  const confirmation = await promptText('Type confirmation phrase: ');

  if (confirmation !== 'UNBLOCK MY TEST DEVICE') {
    console.log('\n[ABORTED] Confirmation phrase did not match. Operation cancelled. No changes made.\n');
    process.exit(0);
  }

  console.log('\nRemoving device rule from router...');
  try {
    await adapter.removeBlockedDevice(targetMac);
    console.log('SUCCESS: Target device MAC has been removed from router blacklist.\n');

    // Audit Logging
    try {
      await initDatabaseAsync();
      EventRepository.create({
        routerId: adapter.model,
        eventType: 'DEVICE_UNBLOCKED',
        metadataJson: JSON.stringify({
          action: 'CLI_UNBLOCK_TEST',
          mac: targetMac,
          result: 'SUCCESS'
        })
      });
      console.log('Audit log recorded in local database.\n');
    } catch {
      // Ignore DB audit error in standalone test
    }
  } catch (err: any) {
    console.error(`\n[FAILED] Unblock operation failed: ${err.message}\n`);
    process.exit(1);
  }
}

runUnblockTest().catch((err) => {
  console.error('Unblock test error:', err.message);
  process.exit(1);
});
