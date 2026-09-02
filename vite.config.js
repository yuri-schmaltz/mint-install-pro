import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn, exec } from 'child_process';

function systemPackagePlugin() {
  return {
    name: 'system-package-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/installed' && req.method === 'GET') {
          exec('flatpak list --app --columns=application', (err, stdout) => {
            const flatpaks = err ? [] : stdout.trim().split('\n').filter(Boolean);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ flatpaks }));
          });
          return;
        }

        if ((req.url === '/api/install' || req.url === '/api/uninstall') && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              const appId = data.id;
              const isFlatpak = data.packageType === 'flatpak' || (appId && appId.includes('.'));
              const isInstall = req.url === '/api/install';

              let cmd, args;
              if (isFlatpak) {
                if (isInstall) {
                  cmd = 'flatpak';
                  args = ['install', '--user', '-y', '--noninteractive', 'flathub', appId];
                } else {
                  cmd = 'flatpak';
                  args = ['uninstall', '--user', '-y', '--noninteractive', appId];
                }
              } else {
                if (isInstall) {
                  cmd = 'pkexec';
                  args = ['apt-get', 'install', '-y', appId];
                } else {
                  cmd = 'pkexec';
                  args = ['apt-get', 'remove', '-y', appId];
                }
              }

              console.log(`[API] Executando comando real: ${cmd} ${args.join(' ')}`);
              const child = spawn(cmd, args);
              let output = '';

              child.stdout?.on('data', d => { output += d.toString(); });
              child.stderr?.on('data', d => { output += d.toString(); });

              child.on('close', code => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: code === 0,
                  code,
                  output: output.slice(-1000)
                }));
              });

              child.on('error', err => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  error: err.message,
                  output
                }));
              });
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
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
    host: true
  }
});
