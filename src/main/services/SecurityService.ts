import fs from 'node:fs';
import path from 'node:path';

function getElectronModules(): { safeStorage: any; app: any } {
  if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const electron = require('electron');
      return { safeStorage: electron.safeStorage, app: electron.app };
    } catch {
      //
    }
  }
  return { safeStorage: null, app: null };
}

export const SecurityService = {
  getCredsPath(): string {
    try {
      const { app } = getElectronModules();
      if (app && app.getPath) {
        return path.join(app.getPath('userData'), 'secure_creds.bin');
      }
    } catch {
      // Fallback
    }
    return path.resolve(process.cwd(), '.data', 'secure_creds.bin');
  },

  /**
   * Securely saves password using OS keychain / Electron safeStorage
   */
  savePassword(password: string): void {
    if (!password) return;
    try {
      const credsPath = this.getCredsPath();
      const dir = path.dirname(credsPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const { safeStorage } = getElectronModules();
      if (safeStorage && safeStorage.isEncryptionAvailable && safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(password);
        fs.writeFileSync(credsPath, encrypted);
      } else {
        // Fallback: obfuscated base64 buffer for environments where safeStorage is not initialized
        const buf = Buffer.from(password, 'utf8').toString('base64');
        fs.writeFileSync(credsPath, buf, 'utf8');
      }
    } catch (err) {
      console.error('Failed to securely save password');
    }
  },

  /**
   * Retrieves password securely
   */
  getPassword(): string {
    try {
      const credsPath = this.getCredsPath();
      if (!fs.existsSync(credsPath)) return '';

      const { safeStorage } = getElectronModules();
      if (safeStorage && safeStorage.isEncryptionAvailable && safeStorage.isEncryptionAvailable()) {
        const buffer = fs.readFileSync(credsPath);
        return safeStorage.decryptString(buffer);
      } else {
        const content = fs.readFileSync(credsPath, 'utf8');
        return Buffer.from(content, 'base64').toString('utf8');
      }
    } catch {
      return '';
    }
  },

  clearCredentials(): void {
    try {
      const credsPath = this.getCredsPath();
      if (fs.existsSync(credsPath)) {
        fs.unlinkSync(credsPath);
      }
    } catch {
      // Ignore
    }
  }
};
