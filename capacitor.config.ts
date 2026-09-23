import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wifiguard.app',
  appName: 'WiFi Guard',
  webDir: 'dist',
  server: {
    cleartext: true,
    androidScheme: 'http'
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
