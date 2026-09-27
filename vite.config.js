import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { systemPackagePlugin } from './scripts/vitePackageApi.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lê versão do package.json e expõe como VITE_APP_VERSION no build
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
  base: './',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version)
  },
  plugins: [react(), systemPackagePlugin()],
  server: {
    port: 3000,
    host: '127.0.0.1'
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
            return 'vendor';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          if (id.includes('initialApps.js')) {
            return 'catalog';
          }
        }
      }
    }
  }
});
