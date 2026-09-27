import { spawn } from 'node:child_process';
import { request } from 'node:http';
import { fileURLToPath } from 'node:url';

// Development and preview use exactly the same API as the packaged launcher.
export function systemPackagePlugin() {
  async function configure(server) {
    const backend = spawn('python3', [fileURLToPath(new URL('./package_backend.py', import.meta.url))], {
      stdio: ['ignore', 'pipe', 'inherit']
    });
    const port = await new Promise((resolve, reject) => {
      let output = '';
      const timer = setTimeout(() => { backend.kill(); reject(new Error('Timeout ao iniciar API de pacotes')); }, 10000);
      backend.once('error', err => { clearTimeout(timer); reject(err); });
      backend.once('exit', () => { clearTimeout(timer); reject(new Error('API de pacotes encerrou')); });
      backend.stdout.on('data', chunk => {
        output += chunk;
        if (output.includes('\n')) {
          clearTimeout(timer);
          try { resolve(JSON.parse(output.split('\n')[0]).port); } catch (err) { reject(err); }
        }
      });
    });
    const stop = () => backend.kill();
    process.once('exit', stop);
    server.httpServer?.once('close', () => {
      process.removeListener('exit', stop);
      stop();
    });
    server.middlewares.use((req, res, next) => {
      if (!req.url.startsWith('/api/')) return next();
      if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Acesso apenas local.' }));
        return;
      }
      const proxy = request({ hostname: '127.0.0.1', port, path: req.url, method: req.method, headers: req.headers }, response => {
        res.writeHead(response.statusCode, response.headers);
        response.pipe(res);
      });
      proxy.on('error', () => {
        if (!res.headersSent) res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'API de pacotes indisponível.' }));
      });
      req.pipe(proxy);
    });
  }
  return { name: 'system-package-api', configureServer: configure, configurePreviewServer: configure };
}
