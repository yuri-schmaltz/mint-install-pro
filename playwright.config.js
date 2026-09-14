// playwright.config.js — E2E tests com Playwright.
// Roda contra `vite dev server` na porta 3000.
// Estes testes complementam vitest (jsdom) exercitando interações reais
// do navegador, especialmente importantes para reproduzir o bug
// "tela cinza ao clicar Executar Ações" (não reprodutível em jsdom).

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html']] : 'list',

  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Bind estrito loopback — reflete vite.config.js (servidor de dev)
    actionTimeout: 10_000,
    navigationTimeout: 15_000
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
    // Futuras adições: firefox, webkit (especialmente webkit pra simular GTK WebView)
  ],

  webServer: {
    command: 'npm run dev -- --port 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
});