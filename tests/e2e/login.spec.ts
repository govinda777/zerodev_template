import { test, expect } from '@playwright/test';

test.describe('Fluxo de Login', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar mocks
    await mockPrivyLogin(page);
    // Navegar para página de login
    await page.goto('/login');
  });

  test('deve permitir login com Metamask', async ({ page }) => {
    // Clicar no botão de Metamask
    await page.click('text=Login com Metamask');
    
    // Esperar e confirmar o login na Metamask
    await page.waitForSelector('text=Confirm');
    await page.click('text=Confirm');

    // Verificar se foi redirecionado para o dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('deve permitir login com Google', async ({ page }) => {
    // Clicar no botão de Google
    await page.click('text=Login com Google');
    
    // Esperar e confirmar o login no Google
    await page.waitForSelector('text=Continue with Google');
    await page.click('text=Continue with Google');

    // Verificar se foi redirecionado para o dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('deve mostrar erro quando login falha', async ({ page }) => {
    // Mock de erro no login
    await page.route('**/login', route => {
      route.fulfill({
        status: 401,
        body: JSON.stringify({ error: 'Invalid credentials' })
      });
    });

    // Tentar login com Twitter
    await page.click('text=Login com Twitter');

    // Verificar se mensagem de erro aparece
    await expect(page).toHaveText('Erro: Invalid credentials');
  });
});

// Função auxiliar para mock do Privy
async function mockPrivyLogin(page) {
  await page.route('**/privy/login', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        success: true,
        user: {
          id: 'user123',
          email: 'test@example.com'
        }
      })
    });
  });
}
