import { test, expect } from '@playwright/test'

test.describe('Criação de Loja Completa', () => {
  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'
  const timestamp = Date.now()
  const testEmail = `teste-${timestamp}@e2e.local`
  const testPassword = 'Teste123456!'
  const storeSlug = `loja-teste-${timestamp}`

  test('Usuário cria conta, completa onboarding e cria loja', async ({ page }) => {
    // 1. Acessar página de signup
    await page.goto(`${baseURL}/signup`)
    await expect(page).toHaveTitle(/.*/)
    
    // 2. Preencher formulário de cadastro
    await page.fill('[name="email"]', testEmail)
    await page.fill('[name="password"]', testPassword)
    await page.fill('[name="confirmPassword"]', testPassword)
    
    // 3. Submeter formulário
    await page.locator('button[type="submit"]').click()
    
    // 4. Aguardar redirecionamento para onboarding ou dashboard
    await page.waitForURL(/\/(onboarding|choose-url|dashboard)/, { timeout: 15000 })
    
    // 5. Se foi para escolha de URL, preencher
    if (page.url().includes('choose-url')) {
      await page.fill('[name="slug"]', storeSlug)
      await page.locator('button:has-text("Continuar")').click()
      await page.waitForTimeout(2000)
    }
    
    // 6. Se foi para onboarding, completar
    if (page.url().includes('onboarding')) {
      // Preencher nome da loja
      await page.fill('[name="store_name"]', `Loja Teste E2E ${timestamp}`)
      
      // Preencher telefone
      await page.fill('[name="phone"]', '11999999999')
      
      // Preencher endereço
      await page.fill('[name="street"]', 'Rua Teste')
      await page.fill('[name="number"]', '123')
      await page.fill('[name="city"]', 'São Paulo')
      await page.fill('[name="state"]', 'SP')
      await page.fill('[name="zip_code"]', '01234-567')
      
      // Submeter
      await page.locator('button:has-text("Criar loja")').click()
      await page.waitForTimeout(3000)
    }
    
    // 7. Verificar que chegou no dashboard
    await expect(page).toHaveURL(new RegExp('/dashboard'), { timeout: 15000 })
    
    // 8. Adicionar primeiro produto
    await page.goto(`${baseURL}/${storeSlug}/dashboard/products`)
    await page.locator('button:has-text("Novo produto")').click()
    
    await page.fill('[name="name"]', 'Produto Teste E2E')
    await page.fill('[name="price"]', '29.90')
    await page.fill('[name="description"]', 'Descrição do produto de teste')
    
    await page.locator('button:has-text("Salvar")').click()
    await page.waitForTimeout(2000)
    
    // 9. Verificar que produto foi criado
    await expect(page.locator('text=Produto Teste E2E')).toBeVisible()
    
    // 10. Ativar loja
    await page.goto(`${baseURL}/${storeSlug}/dashboard/settings`)
    
    const activeToggle = page.locator('[data-testid="store-active-toggle"]')
    if (await activeToggle.isVisible()) {
      await activeToggle.check()
      await page.waitForTimeout(1000)
    }
    
    // 11. Verificar que minisite está acessível
    await page.goto(`${baseURL}/${storeSlug}`)
    await expect(page.locator('text=Produto Teste E2E')).toBeVisible({ timeout: 10000 })
    
    console.log('✅ Teste de criação de loja completo passou!')
  })
})
