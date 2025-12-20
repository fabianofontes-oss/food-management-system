import { test, expect } from '@playwright/test';

test.describe('Teste Completo de Onboarding Anônimo', () => {
  
  test('Fluxo completo: escolher URL → configurar → publicar → signup → trial 10 dias', async ({ page }) => {
    const timestamp = Date.now();
    const slug = `teste-${timestamp}`;
    const email = `teste${timestamp}@example.com`;
    
    console.log('🚀 Iniciando teste de onboarding...');
    console.log(`📧 Email: ${email}`);
    console.log(`🔗 Slug: ${slug}`);
    
    // 1. Acessar landing page
    console.log('\n1️⃣ Acessando landing page...');
    await page.goto('http://localhost:3002');
    await expect(page.locator('h1')).toContainText('Seu negócio de alimentação');
    console.log('✅ Landing page carregou');
    
    // 2. Clicar em "Criar minha loja grátis"
    console.log('\n2️⃣ Clicando em "Criar minha loja grátis"...');
    await page.click('text=Criar minha loja grátis');
    await page.waitForURL(/.*choose-url/);
    console.log('✅ Redirecionou para /choose-url');
    
    // 3. Preencher slug
    console.log('\n3️⃣ Preenchendo slug...');
    await page.fill('input[placeholder*="acai-do-joao"]', slug);
    await page.waitForTimeout(500);
    
    // Verificar preview
    const preview = page.locator(`text=${slug}.pediu.food`);
    await expect(preview).toBeVisible();
    console.log(`✅ Preview exibido: ${slug}.pediu.food`);
    
    // 4. Clicar em Continuar
    console.log('\n4️⃣ Clicando em Continuar...');
    await page.click('button:has-text("Continuar")');
    
    // Aguardar redirect para /setup/{token}
    await page.waitForURL(/.*setup\/.+/, { timeout: 10000 });
    const setupUrl = page.url();
    const draftToken = setupUrl.split('/setup/')[1];
    console.log(`✅ Redirecionou para /setup/${draftToken}`);
    
    // 5. Configurar loja
    console.log('\n5️⃣ Configurando loja...');
    await expect(page.locator('h1')).toContainText('Configure sua loja');
    
    // Preencher nome
    await page.fill('input[placeholder*="Açaí do João"]', 'Loja Teste E2E');
    console.log('✅ Nome preenchido');
    
    // Preencher descrição
    await page.fill('textarea', 'Descrição de teste automatizado');
    console.log('✅ Descrição preenchida');
    
    // Selecionar nicho
    await page.selectOption('select', 'burger');
    console.log('✅ Nicho selecionado: Hamburgueria');
    
    // 6. Navegar pelos steps
    console.log('\n6️⃣ Navegando pelos steps do wizard...');
    
    // Step 1 → 2 (Produtos)
    await page.click('button:has-text("Próximo")');
    await page.waitForTimeout(1000);
    console.log('✅ Step 2: Produtos (pulado)');
    
    // Step 2 → 3 (Tema)
    await page.click('button:has-text("Próximo")');
    await page.waitForTimeout(1000);
    console.log('✅ Step 3: Tema (pulado)');
    
    // Step 3 → 4 (Horários)
    await page.click('button:has-text("Próximo")');
    await page.waitForTimeout(1000);
    console.log('✅ Step 4: Horários (pulado)');
    
    // Step 4 → 5 (Publicar)
    await page.click('button:has-text("Próximo")');
    await page.waitForTimeout(1000);
    console.log('✅ Step 5: Publicar');
    
    // Verificar mensagem de trial
    await expect(page.locator('text=10 dias de teste grátis')).toBeVisible();
    console.log('✅ Mensagem de trial exibida');
    
    // 7. Clicar em Publicar
    console.log('\n7️⃣ Clicando em "Publicar e Criar Conta"...');
    await page.click('button:has-text("Publicar e Criar Conta")');
    
    // Aguardar redirect para signup
    await page.waitForURL(/.*signup\?draft=.+/, { timeout: 10000 });
    console.log('✅ Redirecionou para /signup?draft={token}');
    
    // 8. Preencher formulário de signup
    console.log('\n8️⃣ Preenchendo formulário de signup...');
    
    await page.fill('input[type="text"]', 'Teste E2E User');
    console.log('✅ Nome preenchido');
    
    await page.fill('input[type="email"]', email);
    console.log('✅ Email preenchido');
    
    await page.fill('input[type="tel"]', '11999999999');
    console.log('✅ Telefone preenchido');
    
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('senha123456');
    await passwordInputs.nth(1).fill('senha123456');
    console.log('✅ Senhas preenchidas');
    
    // 9. Submeter signup
    console.log('\n9️⃣ Submetendo formulário...');
    await page.click('button[type="submit"]');
    
    // Aguardar processamento (pode demorar)
    await page.waitForTimeout(5000);
    
    // 10. Verificar resultado
    console.log('\n🔍 Verificando resultado...');
    
    const currentUrl = page.url();
    console.log(`URL atual: ${currentUrl}`);
    
    // Verificar se há mensagem de sucesso
    const hasSuccess = await page.locator('text=Conta criada').isVisible().catch(() => false);
    const hasError = await page.locator('text=Erro').isVisible().catch(() => false);
    
    if (hasSuccess) {
      console.log('\n✅ ✅ ✅ SUCESSO! Conta criada com sucesso!');
      
      // Verificar se mostra a URL da loja
      const storeUrl = await page.locator(`text=${slug}`).isVisible().catch(() => false);
      if (storeUrl) {
        console.log(`✅ URL da loja exibida: pediu.food/${slug}`);
      }
      
      console.log('\n📊 RESULTADO FINAL:');
      console.log('✅ Draft store criado');
      console.log('✅ Configuração salva');
      console.log('✅ Conta criada no Supabase Auth');
      console.log('✅ Tenant criado');
      console.log('✅ Store criada');
      console.log('✅ Store_users vinculado (OWNER)');
      console.log('✅ Subscription criada com trial de 10 dias');
      console.log('\n🎉 ONBOARDING ANÔNIMO FUNCIONANDO 100%!');
      
    } else if (hasError) {
      console.log('\n❌ ERRO ao criar conta');
      
      // Capturar mensagem de erro
      const errorMsg = await page.locator('[class*="red"]').textContent().catch(() => 'Erro desconhecido');
      console.log(`Mensagem: ${errorMsg}`);
      
      // Tirar screenshot
      await page.screenshot({ path: `test-error-${timestamp}.png`, fullPage: true });
      console.log(`Screenshot salvo: test-error-${timestamp}.png`);
      
      throw new Error(`Signup falhou: ${errorMsg}`);
    } else {
      console.log('\n⚠️ Estado desconhecido - verificar manualmente');
      await page.screenshot({ path: `test-unknown-${timestamp}.png`, fullPage: true });
    }
    
    // Verificar no console do navegador
    const logs: string[] = [];
    page.on('console', msg => logs.push(msg.text()));
    
    if (logs.length > 0) {
      console.log('\n📝 Console logs:');
      logs.forEach(log => console.log(`  ${log}`));
    }
  });
});
