import { debugLog } from './debugLog';

export function packageKind(app) {
  if (app.kind === 'apt' || app.kind === 'flatpak') return app.kind;
  const type = (app.packageType || '').toLowerCase();
  if (type.includes('apt')) return 'apt';
  return type.includes('flatpak') || app.flathub === true ? 'flatpak' : 'apt';
}

async function execute(action, app, onLog) {
  const kind = packageKind(app);
  onLog?.(`[${kind.toUpperCase()}] ${action === 'install' ? 'Instalando' : action === 'uninstall' ? 'Removendo' : 'Abrindo'} ${app.name} (${app.id})...`);
  debugLog('info', 'packageManager', action, { id: app.id, kind });
  try {
    const response = await fetch(`/api/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: app.id, packageType: kind })
    });
    let result;
    try { result = await response.json(); } catch {
      throw new Error(`Resposta inválida do serviço de pacotes (HTTP ${response.status}).`);
    }
    if (!response.ok || result?.success !== true || result.simulated) {
      throw new Error(result?.error || result?.output || `Operação recusada (HTTP ${response.status}).`);
    }
    if (result.output) onLog?.(`[${kind.toUpperCase()}] ${result.output}`);
    return result;
  } catch (err) {
    const error = String(err?.message || err);
    debugLog('error', 'packageManager', action, { id: app.id, error });
    onLog?.(`[ERRO] ${error}`);
    return { success: false, error, output: error };
  }
}

export const executeInstall = (app, onLog) => execute('install', app, onLog);
export const executeUninstall = (app, onLog) => execute('uninstall', app, onLog);
export const executeLaunch = (app, onLog) => execute('launch', app, onLog);
