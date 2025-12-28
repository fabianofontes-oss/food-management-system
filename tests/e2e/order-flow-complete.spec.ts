import { test, expect } from '@playwright/test'

test.describe('Fluxo Completo de Pedido', () => {
  const storeSlug = 'demo-test-store'
  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

  test('Cliente faz pedido completo com PIX', async ({ page }) => {
    // 1. Acessar minisite da loja
    await page.goto(`${baseURL}/${storeSlug}`)
    await expect(page).toHaveTitle(/.*/)
    
    // 2. Verificar se cardápio carregou
    await expect(page.locator('text=Cardápio')).toBeVisible({ timeout: 10000 })
    
    // 3. Adicionar primeiro produto ao carrinho
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.click()
    
    // Aguardar modal de produto abrir
    await expect(page.locator('[data-testid="product-modal"]')).toBeVisible({ timeout: 5000 })
    
    // Adicionar ao carrinho
    await page.locator('button:has-text("Adicionar ao carrinho")').click()
    await page.waitForTimeout(1000)
    
    // 4. Adicionar segundo produto
    await page.locator('[data-testid="product-card"]').nth(1).click()
    await expect(page.locator('[data-testid="product-modal"]')).toBeVisible()
    await page.locator('button:has-text("Adicionar ao carrinho")').click()
    await page.waitForTimeout(1000)
    
    // 5. Adicionar terceiro produto
    await page.locator('[data-testid="product-card"]').nth(2).click()
    await expect(page.locator('[data-testid="product-modal"]')).toBeVisible()
    await page.locator('button:has-text("Adicionar ao carrinho")').click()
    await page.waitForTimeout(1000)
    
    // 6. Ir para carrinho
    await page.locator('[data-testid="cart-button"]').click()
    await expect(page).toHaveURL(new RegExp(`${storeSlug}/cart`))
    
    // Verificar itens no carrinho
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(3)
    
    // 7. Ir para checkout
    await page.locator('button:has-text("Finalizar pedido")').click()
    await expect(page).toHaveURL(new RegExp(`${storeSlug}/checkout`))
    
    // 8. Preencher dados do cliente
    await page.fill('[name="customer_name"]', 'Cliente Teste E2E')
    await page.fill('[name="customer_phone"]', '11999999999')
    await page.fill('[name="customer_email"]', 'teste-e2e@example.com')
    
    // 9. Selecionar delivery e preencher endereço
    await page.locator('input[value="DELIVERY"]').check()
    
    await page.fill('[name="street"]', 'Rua Teste E2E')
    await page.fill('[name="number"]', '123')
    await page.fill('[name="district"]', 'Centro')
    await page.fill('[name="city"]', 'São Paulo')
    await page.fill('[name="state"]', 'SP')
    await page.fill('[name="zip_code"]', '01234-567')
    
    // 10. Selecionar PIX como método de pagamento
    await page.locator('input[value="pix"]').check()
    
    // 11. Finalizar pedido
    await page.locator('button:has-text("Confirmar pedido")').click()
    
    // 12. Verificar QR Code PIX
    await expect(page.locator('text=Pagamento via PIX')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('img[alt="QR Code PIX"]')).toBeVisible()
    
    // 13. Verificar código PIX
    await expect(page.locator('text=Copiar código PIX')).toBeVisible()
    
    // 14. Simular pagamento (aguardar 30s ou clicar em "Já paguei")
    // Como é teste, vamos apenas verificar que a página está correta
    await expect(page.locator('text=Aguardando confirmação')).toBeVisible()
    
    console.log('✅ Teste de fluxo completo de pedido passou!')
  })

  test('Cliente tenta fazer pedido sem preencher dados obrigatórios', async ({ page }) => {
    await page.goto(`${baseURL}/${storeSlug}`)
    
    // Adicionar produto
    await page.locator('[data-testid="product-card"]').first().click()
    await page.locator('button:has-text("Adicionar ao carrinho")').click()
    await page.waitForTimeout(1000)
    
    // Ir para checkout
    await page.locator('[data-testid="cart-button"]').click()
    await page.locator('button:has-text("Finalizar pedido")').click()
    
    // Tentar confirmar sem preencher dados
    await page.locator('button:has-text("Confirmar pedido")').click()
    
    // Verificar mensagens de erro de validação
    await expect(page.locator('text=obrigatório')).toBeVisible({ timeout: 5000 })
    
    console.log('✅ Teste de validação passou!')
  })
})
