import { describe, it, expect, vi, afterEach } from 'vitest';
import { executeInstall, executeUninstall, executeLaunch, packageKind } from './packageManager';

const app = { id: 'docker.io', name: 'Docker', kind: 'apt' };
afterEach(() => vi.unstubAllGlobals());
for (const [action, execute] of [['install', executeInstall], ['uninstall', executeUninstall], ['launch', executeLaunch]]) {
  describe(action, () => {
    it('usa o tipo explícito e retorna apenas sucesso confirmado', async () => {
      const fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ success: true, output: 'ok' }) }));
      vi.stubGlobal('fetch', fetch);
      const log = vi.fn();
      expect((await execute(app, log)).success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(`/api/${action}`, expect.objectContaining({ body: JSON.stringify({ id: 'docker.io', packageType: 'apt' }) }));
      expect(log).toHaveBeenCalledWith('[APT] ok');
    });
    it.each([400, 403, 429, 500, 503, 504])('HTTP %i nunca vira sucesso', async status => {
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status, json: async () => ({ error: 'recusado' }) })));
      expect(await execute(app)).toMatchObject({ success: false, error: 'recusado' });
    });
    it.each([{ success: false, output: 'erro do comando' }, {}, { success: true, simulated: true }])('rejeita resposta sem sucesso real: %j', async result => {
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => result })));
      expect((await execute(app)).success).toBe(false);
    });
    it('erro de rede é falha explícita', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
      expect(await execute(app)).toMatchObject({ success: false, error: 'offline' });
    });
    it('resposta inválida é falha explícita', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => { throw new Error('HTML'); } })));
      expect((await execute(app)).success).toBe(false);
    });
  });
}
it('classifica pelo metadado, nunca pelo ponto no nome', () => {
  expect(packageKind({ id: 'dotnet-sdk-8.0', packageType: 'APT' })).toBe('apt');
  expect(packageKind({ id: 'org.test.App', kind: 'flatpak' })).toBe('flatpak');
  expect(packageKind({ id: 'org.test.App', packageType: 'Flatpak (Flathub)' })).toBe('flatpak');
});
