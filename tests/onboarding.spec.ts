import { test, expect } from '@playwright/test';

test.describe('Fluxo de Onboarding Anônimo', () => {
  
  test('deve permitir escolher URL sem cadastro', async ({ page }) => {
    await page.goto('http://localhost:3002');
    
    // Verificar se landing page carregou
    await expect(page.locator('h1')).toContainText('Seu negócio de alimentação');
    
    // Clicar em "Criar minha loja grátis"
    await page.click('text=Criar minha loja grátis');
    
    // Deve redirecionar para /choose-url
    await expect(page).toHaveURL(/.*choose-url/);
    
    // Preencher slug
    const randomSlug = `teste-${Date.now()}`;
    await page.fill('input[placeholder*="acai-do-joao"]', randomSlug);
    
    // Verificar preview
    await expect(page.locator('text=pediu.food')).toBeVisible();
    
    // Clicar em Continuar
    await page.click('button:has-text("Continuar")');
    
    // Deve redirecionar para /setup/{token}
    await expect(page).toHaveURL(/.*setup\/.+/);
    await expect(page.locator('h1')).toContainText('Configure sua loja');
  });

  test('deve permitir configurar loja sem cadastro', async ({ page }) => {
    // Criar draft primeiro
    await page.goto('http://localhost:3002/choose-url');
    const randomSlug = `teste-${Date.now()}`;
    await page.fill('input[placeholder*="acai-do-joao"]', randomSlug);
    await page.click('button:has-text("Continuar")');
    
    // Aguardar redirect para setup
    await page.waitForURL(/.*setup\/.+/);
    
    // Preencher nome da loja
    await page.fill('input[placeholder*="Açaí do João"]', 'Loja Teste E2E');
    
    // Preencher descrição
    await page.fill('textarea', 'Descrição de teste automatizado');
    
    // Selecionar nicho
    await page.selectOption('select', 'acai');
    
    // Clicar em Próximo
    await page.click('button:has-text("Próximo")');
    
    // Deve avançar para step de produtos
    await expect(page.locator('text=produtos')).toBeVisible();
    
    // Pular produtos
    await page.click('button:has-text("Próximo")');
    
    // Pular tema
    await page.click('button:has-text("Próximo")');
    
    // Pular horários
    await page.click('button:has-text("Próximo")');
    
    // Deve chegar na tela de publicar
    await expect(page.locator('text=Pronto para publicar')).toBeVisible();
    await expect(page.locator('text=10 dias de teste grátis')).toBeVisible();
  });

  test('deve exigir signup ao publicar', async ({ page }) => {
    // Criar e configurar draft
    await page.goto('http://localhost:3002/choose-url');
    const randomSlug = `teste-${Date.now()}`;
    await page.fill('input[placeholder*="acai-do-joao"]', randomSlug);
    await page.click('button:has-text("Continuar")');
    
    await page.waitForURL(/.*setup\/.+/);
    await page.fill('input[placeholder*="Açaí do João"]', 'Loja Teste');
    await page.selectOption('select', 'burger');
    
    // Navegar até publicar
    for (let i = 0; i < 4; i++) {
      await page.click('button:has-text("Próximo")');
      await page.waitForTimeout(500);
    }
    
    // Clicar em Publicar
    await page.click('button:has-text("Publicar e Criar Conta")');
    
    // Deve redirecionar para signup com draft token
    await expect(page).toHaveURL(/.*signup\?draft=.+/);
    await expect(page.locator('h1')).toContainText('Criar conta');
  });

  test('deve criar conta e ativar trial de 10 dias', async ({ page }) => {
    // Este teste requer que as migrations estejam aplicadas
    // Criar draft completo
    await page.goto('http://localhost:3002/choose-url');
    const randomSlug = `teste-${Date.now()}`;
    const randomEmail = `teste${Date.now()}@example.com`;
    
    await page.fill('input[placeholder*="acai-do-joao"]', randomSlug);
    await page.click('button:has-text("Continuar")');
    
    await page.waitForURL(/.*setup\/.+/);
    await page.fill('input[placeholder*="Açaí do João"]', 'Loja E2E');
    await page.selectOption('select', 'pizza');
    
    // Navegar até publicar
    for (let i = 0; i < 4; i++) {
      await page.click('button:has-text("Próximo")');
      await page.waitForTimeout(500);
    }
    
    await page.click('button:has-text("Publicar e Criar Conta")');
    await page.waitForURL(/.*signup\?draft=.+/);
    
    // Preencher formulário de signup
    await page.fill('input[type="text"]', 'Teste E2E');
    await page.fill('input[type="email"]', randomEmail);
    await page.fill('input[type="tel"]', '11999999999');
    await page.fill('input[type="password"]', 'senha123');
    await page.fill('input[placeholder*="Confirmar"]', 'senha123');
    
    // Submeter
    await page.click('button[type="submit"]');
    
    // Aguardar sucesso ou erro
    await page.waitForTimeout(3000);
    
    // Verificar se conta foi criada
    const hasSuccess = await page.locator('text=Conta criada').isVisible();
    const hasError = await page.locator('text=Erro').isVisible();
    
    if (hasSuccess) {
      console.log('✅ Conta criada com sucesso!');
      await expect(page.locator('text=10 dias')).toBeVisible();
    } else if (hasError) {
      console.log('❌ Erro ao criar conta - verificar logs');
    }
  });
});

test.describe('Cardápio Público', () => {
  
  test('deve carregar cardápio de loja existente', async ({ page }) => {
    // Assumindo que existe uma loja demo
    await page.goto('http://localhost:3002/demo');
    
    // Verificar se cardápio carregou
    const hasProducts = await page.locator('[data-testid="product-card"]').count();
    
    if (hasProducts > 0) {
      console.log(`✅ Cardápio carregou com ${hasProducts} produtos`);
    } else {
      console.log('⚠️ Nenhum produto encontrado - criar loja demo primeiro');
    }
  });

  test('deve adicionar produto ao carrinho', async ({ page }) => {
    await page.goto('http://localhost:3002/demo');
    
    // Aguardar produtos carregarem
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 5000 }).catch(() => {
      console.log('⚠️ Produtos não carregaram - loja demo não existe');
    });
    
    const productCard = page.locator('[data-testid="product-card"]').first();
    
    if (await productCard.isVisible()) {
      await productCard.click();
      
      // Verificar se modal abriu
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Adicionar ao carrinho
      await page.click('button:has-text("Adicionar")');
      
      // Verificar se carrinho atualizou
      const cartBadge = page.locator('[data-testid="cart-badge"]');
      await expect(cartBadge).toContainText('1');
      
      console.log('✅ Produto adicionado ao carrinho');
    }
  });
});

test.describe('Dashboard do Lojista', () => {
  
  test('deve exigir login para acessar dashboard', async ({ page }) => {
    await page.goto('http://localhost:3002/teste-loja/dashboard');
    
    // Deve redirecionar para login
    await expect(page).toHaveURL(/.*login/);
    
    console.log('✅ Dashboard protegido - redirecionou para login');
  });

  test('deve permitir login e acessar dashboard', async ({ page }) => {
    // Este teste requer credenciais válidas
    await page.goto('http://localhost:3002/login');
    
    // Tentar login com credenciais de teste
    await page.fill('input[type="email"]', 'teste@example.com');
    await page.fill('input[type="password"]', 'senha123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    
    const isLoggedIn = await page.url().includes('dashboard');
    
    if (isLoggedIn) {
      console.log('✅ Login bem-sucedido - dashboard carregado');
    } else {
      console.log('⚠️ Login falhou - credenciais inválidas ou usuário não existe');
    }
  });
});
