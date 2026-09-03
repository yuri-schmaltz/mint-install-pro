import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn, exec } from 'child_process';

// Validações rigorosas de identificadores de pacotes (prevenção de Command/Argument Injection)
const APT_PKG_REGEX = /^[a-z0-9][a-z0-9+\.\-]{1,63}$/;
const FLATPAK_ID_REGEX = /^[a-zA-Z0-9_\-]+(\.[a-zA-Z0-9_\-]+)+$/;

let isProcessingPackage = false;

function systemPackagePlugin() {
  return {
    name: 'system-package-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Validação de segurança: apenas chamadas originadas de loopback local
        const remoteIp = req.socket?.remoteAddress || '';
        const isLoopback = remoteIp === '127.0.0.1' || remoteIp === '::1' || remoteIp === '::ffff:127.0.0.1';
        
        if (req.url.startsWith('/api/') && !isLoopback) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Acesso negado: apenas chamadas locais permitidas.' }));
          return;
        }

        // Prevenção de CSRF: verificar Origin se presente
        const origin = req.headers['origin'];
        if (req.url.startsWith('/api/') && origin) {
          try {
            const originHost = new URL(origin).hostname;
            if (originHost !== 'localhost' && originHost !== '127.0.0.1') {
              res.statusCode = 403;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Origem não autorizada.' }));
              return;
            }
          } catch {
            res.statusCode = 400;
            res.end();
            return;
          }
        }

        if (req.url === '/api/installed' && req.method === 'GET') {
          exec('flatpak list --app --columns=application', (err, stdout) => {
            const flatpaks = err ? [] : stdout.trim().split('\n').filter(Boolean);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ flatpaks }));
          });
          return;
        }

        if ((req.url === '/api/install' || req.url === '/api/uninstall') && req.method === 'POST') {
          if (isProcessingPackage) {
            res.statusCode = 429;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Outra transação de pacote já está em andamento.' }));
            return;
          }

          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              const appId = String(data.id || '').trim();
              const isFlatpak = data.packageType === 'flatpak' || (appId && appId.includes('.'));
              const isInstall = req.url === '/api/install';

              // Validação contra injeção de parâmetros/argumentos CLI
              if (!appId || appId.startsWith('-')) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Identificador de pacote inválido.' }));
                return;
              }

              if (isFlatpak && !FLATPAK_ID_REGEX.test(appId)) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Formato de identificador Flatpak inválido.' }));
                return;
              }

              if (!isFlatpak && !APT_PKG_REGEX.test(appId)) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Formato de pacote APT inválido.' }));
                return;
              }

              isProcessingPackage = true;

              let cmd, args;
              if (isFlatpak) {
                if (isInstall) {
                  cmd = 'flatpak';
                  args = ['install', '--user', '-y', '--noninteractive', 'flathub', '--', appId];
                } else {
                  cmd = 'flatpak';
                  args = ['uninstall', '--user', '-y', '--noninteractive', '--', appId];
                }
              } else {
                if (isInstall) {
                  cmd = 'pkexec';
                  args = ['apt-get', 'install', '-y', '--', appId];
                } else {
                  cmd = 'pkexec';
                  args = ['apt-get', 'remove', '-y', '--', appId];
                }
              }

              console.log(`[API] Executando comando seguro: ${cmd} ${args.join(' ')}`);
              const child = spawn(cmd, args, {
                env: { ...process.env, DEBIAN_FRONTEND: 'noninteractive' }
              });
              let output = '';

              child.stdout?.on('data', d => { output += d.toString(); });
              child.stderr?.on('data', d => { output += d.toString(); });

              const timeout = setTimeout(() => {
                child.kill('SIGTERM');
              }, 300000); // 5 minutos de timeout

              child.on('close', code => {
                clearTimeout(timeout);
                isProcessingPackage = false;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: code === 0,
                  code,
                  output: output.slice(-1000)
                }));
              });

              child.on('error', err => {
                clearTimeout(timeout);
                isProcessingPackage = false;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  error: err.message,
                  output
                }));
              });
            } catch (err) {
              isProcessingPackage = false;
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Payload JSON inválido.' }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  base: './',
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
