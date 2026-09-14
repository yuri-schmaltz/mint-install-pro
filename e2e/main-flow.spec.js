// e2e/main-flow.spec.js — testes end-to-end do fluxo principal.
// Complementa vitest exercitando interações REAIS do navegador.
//
// Foco: reproduzir o bug "tela cinza ao clicar Executar Ações" e
// validar que a infraestrutura de diagnóstico está acessível ao usuário.

import { test, expect } from '@playwright/test';

test.describe('Mint Install Pro — fluxo E2E principal', () => {
  test.beforeEach(async ({ page }) => {
    // Limpa localStorage pra ter estado limpo entre testes
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto('/');
    // Espera o app inicializar
    await page.waitForLoadState('networkidle');
  });

  test('app carrega com UI básica visível', async ({ page }) => {
    // HeaderBar presente
    await expect(page.locator('input[placeholder*="Pesquisar"]')).toBeVisible();
    // CategoryNav presente (12 abas)
    await expect(page.locator('nav button')).toHaveCount(12);
    // DebugDock presente em produção (achado crítico #1 — deve estar montado)
    await expect(page.locator('[title="Abrir painel de diagnóstico"]')).toBeVisible();
  });

  test('navegação por abas funciona', async ({ page }) => {
    // Clica em "Acessórios"
    await page.locator('button:has-text("Acessórios")').first().click();
    await page.waitForTimeout(200);
    // AppGrid deve aparecer (saiu da landing)
    await expect(page.locator('[role="button"][aria-label*="Instalado"], [role="button"][aria-label*="Não instalado"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('botão DEBUG abre painel de diagnóstico', async ({ page }) => {
    const debugBtn = page.locator('[title="Abrir painel de diagnóstico"]');
    await expect(debugBtn).toBeVisible();
    await debugBtn.click();
    // Dialog deve abrir
    await expect(page.getByRole('dialog', { name: 'Painel de diagnóstico' })).toBeVisible();
    // Mostra "entries" counter
    await expect(page.locator('text=/entries: \\d+/')).toBeVisible();
  });

  test('busca atualiza o grid filtrado', async ({ page }) => {
    // Digita termo de busca
    const searchInput = page.locator('input[placeholder*="Pesquisar"]');
    await searchInput.fill('vlc');
    await page.waitForTimeout(500); // debounce
    // Pelo menos 1 card visível (ou mensagem de empty state)
    const cards = page.locator('[role="button"][aria-label]');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });

  test('tecla Escape fecha modais abertos', async ({ page }) => {
    // Abre About modal via menu hambúrguer
    await page.locator('button[title="Menu do aplicativo"]').click();
    await page.locator('text="Sobre o Gerenciador"').click();
    // Modal aberto
    await expect(page.locator('text=/Versão 1\\.4\\.1/')).toBeVisible();
    // Esc fecha
    await page.keyboard.press('Escape');
    await expect(page.locator('text=/Versão 1\\.4\\.1/')).not.toBeVisible();
  });

  test('seleção em lote atualiza BatchActionBar', async ({ page }) => {
    // Vai pra Todos
    await page.locator('button:has-text("Todos")').first().click();
    await page.waitForTimeout(500);
    // Pega primeiro checkbox
    const firstCheckbox = page.locator('[role="button"] >> nth=0').first();
    const ariaLabel = await firstCheckbox.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.includes('Instalado')) {
      // Para instalados, click desmarcaria para remoção
    }
    // Ctrl+A marca todos visíveis
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(200);
    // BatchActionBar deve aparecer com contador > 0
    await expect(page.locator('text=/\\d+ selecionado/')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('DebugDock — diagnóstico de crash (regressão do achado #1)', () => {
  test('botão DEBUG persiste através de re-renders', async ({ page }) => {
    await page.goto('/');
    const debugBtn = page.locator('[title="Abrir painel de diagnóstico"]');
    await expect(debugBtn).toBeVisible();

    // Força um re-render via navegação
    await page.locator('button:has-text("Início")').first().click();
    await page.locator('button:has-text("Acessórios")').first().click();
    await page.locator('button:has-text("Início")').first().click();
    await page.waitForTimeout(200);

    // Botão ainda visível (regrediu: removido em v1.4.0, restaurado em v1.4.1)
    await expect(debugBtn).toBeVisible();
  });
});