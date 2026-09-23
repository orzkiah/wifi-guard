import { defineConfig } from 'vite';
import path from 'node:path';
import electron from 'vite-plugin-electron/simple';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'src/main/index.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['better-sqlite3', 'sql.js']
            }
          }
        }
      },
      preload: {
        input: path.join(__dirname, 'src/preload/index.ts'),
      },
      renderer: {},
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/cgi-bin': {
        target: 'http://192.168.1.1',
        changeOrigin: true,
        secure: false,
      },
      '/login.html': {
        target: 'http://192.168.1.1',
        changeOrigin: true,
        secure: false,
      }
    }
  },
});
