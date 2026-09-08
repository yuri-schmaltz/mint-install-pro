// Setup global dos testes vitest. Mock de fetch + matchers do jest-dom.
import '@testing-library/jest-dom';

// Mock de fetch global (alguns testes não precisam, mas evita warnings)
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = () => Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({})
  });
}
