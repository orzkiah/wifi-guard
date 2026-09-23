export const app = {
  getPath: (name: string) => {
    return process.cwd() + '/.data';
  },
  requestSingleInstanceLock: () => true,
  on: () => {},
  whenReady: () => Promise.resolve(),
  quit: () => {}
};

export const Notification = {
  isSupported: () => false
};

export const safeStorage = {
  isEncryptionAvailable: () => false,
  encryptString: (s: string) => Buffer.from(s),
  decryptString: (b: Buffer) => b.toString()
};

export const ipcMain = {
  handle: () => {}
};

export const contextBridge = {
  exposeInMainWorld: () => {}
};

export const ipcRenderer = {
  invoke: () => Promise.resolve(),
  on: () => {},
  removeListener: () => {}
};

export const BrowserWindow = class {
  static getAllWindows = () => [];
};

export const shell = {
  openExternal: () => {}
};
