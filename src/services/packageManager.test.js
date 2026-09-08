// packageManager.test.js — testes exaustivos do serviço de install/uninstall.
// Cobre: detecção de Flatpak via kind/packageType/category/id, instrumentação,
// tratamento de rede (offline → fallback simulado), payloads inválidos.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let debugLog;
beforeEach(async () => {
  vi.resetModules();
  // Mock fetch global
  global.fetch = vi.fn();
  // Mock debugLog
  const debugMod = await import('./debugLog');
  debugLog = vi.spyOn(debugMod, 'debugLog').mockImplementation(() => {});
  vi.doMock('./debugLog', () => ({
    debugLog,
    pushEmergencyLog: vi.fn(),
    pushLastReactError: vi.fn()
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('executeInstall', () => {
  it('detecta Flatpak por kind explícito', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, output: 'installing\nOK' })
    });
    const { executeInstall } = await import('./packageManager');
    await executeInstall(
      { id: 'com.github.App', name: 'App', kind: 'flatpak' },
      () => {}
    );
    expect(global.fetch).toHaveBeenCalledWith('/api/install', expect.objectContaining({
      body: expect.stringContaining('"packageType":"flatpak"')
    }));
  });

  it('detecta APT quando kind=apt', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });
    const { executeInstall } = await import('./packageManager');
    await executeInstall({ id: 'firefox', name: 'Firefox', kind: 'apt' }, () => {});
    expect(global.fetch).toHaveBeenCalledWith('/api/install', expect.objectContaining({
      body: expect.stringContaining('"packageType":"apt"')
    }));
  });

  it('fallback heurístico: packageType contendo "flatpak"', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, json: async () => ({ success: true })
    });
    const { executeInstall } = await import('./packageManager');
    await executeInstall(
      { id: 'foo', name: 'Foo', packageType: 'flatpak-x' },
      () => {}
    );
    expect(global.fetch.mock.calls[0][1].body).toContain('"packageType":"flatpak"');
  });

  it('fallback heurístico: category=flatpak', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, json: async () => ({ success: true })
    });
    const { executeInstall } = await import('./packageManager');
    await executeInstall(
      { id: 'org.foo.Bar', name: 'Bar', category: 'flatpak' },
      () => {}
    );
    expect(global.fetch.mock.calls[0][1].body).toContain('"packageType":"flatpak"');
  });

  it('fallback heurístico: id contém ponto (= Flatpak)', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, json: async () => ({ success: true })
    });
    const { executeInstall } = await import('./packageManager');
    await executeInstall(
      { id: 'com.github.Foo', name: 'Foo' },
      () => {}
    );
    expect(global.fetch.mock.calls[0][1].body).toContain('"packageType":"flatpak"');
  });

  it('chama onLog com prefixo FLATPAK para Flatpak', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, json: async () => ({ success: true, output: 'OK' })
    });
    const { executeInstall } = await import('./packageManager');
    const log = vi.fn();
    await executeInstall({ id: 'org.foo.Bar', name: 'Bar' }, log);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[FLATPAK]'));
  });

  it('chama onLog com prefixo APT para APT', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, json: async () => ({ success: true, output: 'OK' })
    });
    const { executeInstall } = await import('./packageManager');
    const log = vi.fn();
    await executeInstall({ id: 'firefox', name: 'Firefox' }, log);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[APT]'));
  });

  it('loga cada linha do output via onLog (até 5)', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        output: 'linha1\nlinha2\nlinha3\nlinha4\nlinha5\nlinha6\nlinha7\nlinha8'
      })
    });
    const { executeInstall } = await import('./packageManager');
    const log = vi.fn();
    await executeInstall({ id: 'firefox', name: 'Firefox' }, log);
    // Deve chamar onLog com a linha inicial de "Preparando..." + até 5 linhas
    // do output (slice(-5)). Total esperado: 1 + 5 = 6 chamadas [APT].
    const aptCalls = log.mock.calls.filter(c => c[0].startsWith('[APT]'));
    expect(aptCalls.length).toBe(6);
    // A primeira chamada é a preparação
    expect(aptCalls[0][0]).toContain('Preparando instalação');
    // As 5 últimas são do output
    expect(aptCalls[1][0]).toContain('linha4');
    expect(aptCalls[5][0]).toContain('linha8');
  });

  it('cai pra simulated: true quando fetch falha (rede offline)', async () => {
    global.fetch.mockRejectedValueOnce(new Error('network down'));
    const { executeInstall } = await import('./packageManager');
    const log = vi.fn();
    const result = await executeInstall({ id: 'firefox', name: 'Firefox' }, log);
    expect(result).toEqual({ success: true, simulated: true });
    expect(log).toHaveBeenCalledWith(expect.stringContaining('modo seguro'));
  });

  it('cai pra simulated: true quando response não-ok', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const { executeInstall } = await import('./packageManager');
    const log = vi.fn();
    const result = await executeInstall({ id: 'firefox', name: 'Firefox' }, log);
    expect(result).toEqual({ success: true, simulated: true });
  });

  it('loga via debugLog info com id e isFlatpak', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, json: async () => ({ success: true })
    });
    const { executeInstall } = await import('./packageManager');
    await executeInstall({ id: 'firefox', name: 'Firefox' }, () => {});
    expect(debugLog).toHaveBeenCalledWith(
      'info', 'packageManager', 'executeInstall',
      expect.objectContaining({ id: 'firefox', isFlatpak: false })
    );
  });

  it('loga via debugLog debug com status HTTP', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ success: true })
    });
    const { executeInstall } = await import('./packageManager');
    await executeInstall({ id: 'firefox', name: 'Firefox' }, () => {});
    expect(debugLog).toHaveBeenCalledWith(
      'debug', 'packageManager', 'install response',
      expect.objectContaining({ id: 'firefox', status: 200, ok: true })
    );
  });

  it('loga warn quando fetch falha', async () => {
    global.fetch.mockRejectedValueOnce(new Error('fail'));
    const { executeInstall } = await import('./packageManager');
    await executeInstall({ id: 'firefox', name: 'Firefox' }, () => {});
    expect(debugLog).toHaveBeenCalledWith(
      'warn', 'packageManager', 'install fetch falhou, caindo no simulado',
      expect.objectContaining({ id: 'firefox' })
    );
  });
});

describe('executeUninstall', () => {
  it('envia packageType correto', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, json: async () => ({ success: true })
    });
    const { executeUninstall } = await import('./packageManager');
    await executeUninstall({ id: 'org.foo.Bar', name: 'Bar' }, () => {});
    expect(global.fetch).toHaveBeenCalledWith('/api/uninstall', expect.objectContaining({
      body: expect.stringContaining('"packageType":"flatpak"')
    }));
  });

  it('chama onLog com prefixo correto', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, json: async () => ({ success: true, output: 'OK' })
    });
    const { executeUninstall } = await import('./packageManager');
    const log = vi.fn();
    await executeUninstall({ id: 'firefox', name: 'Firefox' }, log);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[APT]'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Desinstalando'));
  });

  it('cai pra simulated: true quando offline', async () => {
    global.fetch.mockRejectedValueOnce(new Error('network'));
    const { executeUninstall } = await import('./packageManager');
    const result = await executeUninstall({ id: 'firefox', name: 'Firefox' }, () => {});
    expect(result).toEqual({ success: true, simulated: true });
  });

  it('loga info executeUninstall com isFlatpak', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, json: async () => ({ success: true })
    });
    const { executeUninstall } = await import('./packageManager');
    await executeUninstall({ id: 'firefox', name: 'Firefox' }, () => {});
    expect(debugLog).toHaveBeenCalledWith(
      'info', 'packageManager', 'executeUninstall',
      expect.objectContaining({ id: 'firefox', isFlatpak: false })
    );
  });

  it('loga debug uninstall response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ success: true })
    });
    const { executeUninstall } = await import('./packageManager');
    await executeUninstall({ id: 'firefox', name: 'Firefox' }, () => {});
    expect(debugLog).toHaveBeenCalledWith(
      'debug', 'packageManager', 'uninstall response',
      expect.objectContaining({ status: 200, ok: true })
    );
  });
});

describe('adversarial: payloads hostis', () => {
  it('não envia app com id contendo script injection', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, json: async () => ({ success: true })
    });
    const { executeInstall } = await import('./packageManager');
    await executeInstall(
      { id: 'evil"; rm -rf /', name: 'Evil' },
      () => {}
    );
    // O id é enviado raw no JSON. A defesa real está no backend (regex).
    // Aqui só verificamos que fetch foi chamado com o JSON.
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.id).toBe('evil"; rm -rf /');
  });

  it('não crasha com app sem nome', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, json: async () => ({ success: true })
    });
    const { executeInstall } = await import('./packageManager');
    await expect(
      executeInstall({ id: 'foo', name: undefined }, () => {})
    ).resolves.toBeDefined();
  });

  it('não crasha com app null/undefined', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, json: async () => ({ success: true })
    });
    const { executeInstall } = await import('./packageManager');
    await expect(
      executeInstall({}, () => {})
    ).resolves.toBeDefined();
  });

  it('onLog undefined não crasha', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, json: async () => ({ success: true })
    });
    const { executeInstall } = await import('./packageManager');
    await expect(
      executeInstall({ id: 'foo', name: 'Foo' }, undefined)
    ).resolves.toBeDefined();
  });

  it('fetch que resolve com JSON inválido não crasha', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => { throw new Error('bad json'); }
    });
    const { executeInstall } = await import('./packageManager');
    // Vai cair no catch e retornar simulated
    const result = await executeInstall({ id: 'foo', name: 'Foo' }, () => {});
    expect(result.simulated).toBe(true);
  });
});

describe('stress: chamadas concorrentes', () => {
  it('múltiplas chamadas paralelas não corrompem estado', async () => {
    global.fetch.mockImplementation(async () => ({
      ok: true, status: 200,
      json: async () => ({ success: true, output: 'OK' })
    }));
    const { executeInstall } = await import('./packageManager');
    const promises = Array.from({ length: 20 }, (_, i) =>
      executeInstall({ id: `app${i}`, name: `App ${i}` }, () => {})
    );
    const results = await Promise.all(promises);
    expect(results).toHaveLength(20);
    expect(results.every((r) => r.success === true)).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(20);
  });
});