// Configuração mínima do vitest. Resolve o "testes unitários que
// exercitam componentes React" — débitos de cobertura do gauntlet loop.

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    setupFiles: ['./src/test/setup.js'],
    // Foco em testes rápidos; CI roda com --reporter=verbose
    reporters: process.env.CI ? ['default'] : ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/test/**',
        'src/main.jsx',
        'src/data/**',
        'src/services/catalogIndex.js'
      ]
    }
  }
});
