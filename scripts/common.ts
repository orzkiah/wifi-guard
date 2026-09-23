import readline from 'node:readline';
import { FiberHomeHG6145D2Adapter } from '../src/main/router/FiberHomeHG6145D2Adapter';
import { RouterCredentials } from '../src/shared/types/router';
import { initDatabaseAsync, SettingsRepository } from '../src/main/database/db';
import { SecurityService } from '../src/main/services/SecurityService';

export async function promptHidden(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    // Mute stdout for password
    const stdin = process.stdin;
    process.stdout.write(query);

    let password = '';
    const onData = (chunk: Buffer) => {
      const char = chunk.toString();
      if (char === '\n' || char === '\r' || char === '\u0004') {
        stdin.removeListener('data', onData);
        rl.close();
        process.stdout.write('\n');
        resolve(password.trim());
      } else if (char === '\u0008' || char === '\x7f') {
        if (password.length > 0) {
          password = password.slice(0, -1);
        }
      } else {
        password += char;
      }
    };

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', onData);
    } else {
      rl.question('', (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    }
  });
}

export async function promptText(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

import fs from 'node:fs';
import path from 'node:path';

// Try loading .env if it exists
try {
  if (typeof process.loadEnvFile === 'function') {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      process.loadEnvFile(envPath);
    }
  }
} catch {
  // Ignore error loading .env
}

export async function resolveCredentials(): Promise<RouterCredentials> {
  const routerIp = process.env.ROUTER_IP || '192.168.1.1';

  let username = process.env.ROUTER_USERNAME || '';
  let password = process.env.ROUTER_PASSWORD || '';

  if (!username || !password) {
    try {
      await initDatabaseAsync();
      const settings = SettingsRepository.get();
      if (!username && settings.routerUsername) {
        username = settings.routerUsername;
      }
      if (!password && settings.rememberCredentials) {
        const storedPwd = SecurityService.getPassword();
        if (storedPwd) {
          password = storedPwd;
        }
      }
    } catch {
      // Ignore
    }
  }

  if (!username) {
    if (!process.stdin.isTTY) {
      throw new Error(
        'Router credentials not provided and terminal is non-interactive.\n' +
        'Please set ROUTER_USERNAME and ROUTER_PASSWORD environment variables or create a .env file.'
      );
    }
    username = await promptText('Router Username (default: admin): ') || 'admin';
  }

  if (!password) {
    if (!process.stdin.isTTY) {
      throw new Error(
        'Router password not provided and terminal is non-interactive.\n' +
        'Please set ROUTER_PASSWORD environment variable or create a .env file.'
      );
    }
    password = await promptHidden('Router Password: ');
  }

  return {
    ipAddress: routerIp,
    username,
    password
  };
}
