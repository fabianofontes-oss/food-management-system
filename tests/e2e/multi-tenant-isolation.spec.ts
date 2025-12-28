import { test, expect } from '@playwright/test'

test.describe('Isolamento Multi-Tenant', () => {
  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'
  const timestamp = Date.now()
  
  const storeA = {
    email: `loja-a-${timestamp}@e2e.local`,
    password: 'Teste123456!',
    slug: `loja-a-${timestamp}`,
    name: `Loja A ${timestamp}`,
    productName: 'Produto Exclusivo Loja A'
  }
  
  const storeB = {
    email: `loja-b-${timestamp}@e2e.local`,
    password: 'Teste123456!',
    slug: `loja-b-${timestamp}`,
    name: `Loja B ${timestamp}`,
    productName: 'Produto Exclusivo Loja B'
  }

  test('Criar duas lojas e verificar isolamento completo', async ({ browser }) => {
    // Criar contextos separados para cada loja
    const contextA = await browser.newContext()
    const contextB = await browser.newContext()
    
    const pageA = await contextA.newPage()
    const pageB = await contextB.newPage()
    
    try {
      // === LOJA A ===
      console.log('Criando Loja A...')
      await pageA.goto(`${baseURL}/signup`)
      await pageA.fill('[name="email"]', storeA.email)
      await pageA.fill('[name="password"]', storeA.password)
      await pageA.fill('[name="confirmPassword"]', storeA.password)
      await pageA.locator('button[type="submit"]').click()
      await pageA.waitForTimeout(3000)
      
      // Criar produto na Loja A
      await pageA.goto(`${baseURL}/${storeA.slug}/dashboard/products`)
      await pageA.locator('button:has-text("Novo produto")').click()
      await pageA.fill('[name="name"]', storeA.productName)
      await pageA.fill('[name="price"]', '19.90')
      await pageA.locator('button:has-text("Salvar")').click()
      await pageA.waitForTimeout(2000)
      
      // === LOJA B ===
      console.log('Criando Loja B...')
      await pageB.goto(`${baseURL}/signup`)
      await pageB.fill('[name="email"]', storeB.email)
      await pageB.fill('[name="password"]', storeB.password)
      await pageB.fill('[name="confirmPassword"]', storeB.password)
      await pageB.locator('button[type="submit"]').click()
      await pageB.waitForTimeout(3000)
      
      // Criar produto na Loja B
      await pageB.goto(`${baseURL}/${storeB.slug}/dashboard/products`)
      await pageB.locator('button:has-text("Novo produto")').click()
      await pageB.fill('[name="name"]', storeB.productName)
      await pageB.fill('[name="price"]', '29.90')
      await pageB.locator('button:has-text("Salvar")').click()
      await pageB.waitForTimeout(2000)
      
      // === VERIFICAR ISOLAMENTO ===
      console.log('Verificando isolamento...')
      
      // 1. Loja A não deve ver produtos da Loja B
      await pageA.goto(`${baseURL}/${storeA.slug}/dashboard/products`)
      await expect(pageA.locator(`text=${storeA.productName}`)).toBeVisible()
      await expect(pageA.locator(`text=${storeB.productName}`)).not.toBeVisible()
      
      // 2. Loja B não deve ver produtos da Loja A
      await pageB.goto(`${baseURL}/${storeB.slug}/dashboard/products`)
      await expect(pageB.locator(`text=${storeB.productName}`)).toBeVisible()
      await expect(pageB.locator(`text=${storeA.productName}`)).not.toBeVisible()
      
      // 3. Minisites devem ser isolados
      await pageA.goto(`${baseURL}/${storeA.slug}`)
      await expect(pageA.locator(`text=${storeA.productName}`)).toBeVisible()
      await expect(pageA.locator(`text=${storeB.productName}`)).not.toBeVisible()
      
      await pageB.goto(`${baseURL}/${storeB.slug}`)
      await expect(pageB.locator(`text=${storeB.productName}`)).toBeVisible()
      await expect(pageB.locator(`text=${storeA.productName}`)).not.toBeVisible()
      
      // 4. Loja A não deve conseguir acessar dashboard da Loja B
      await pageA.goto(`${baseURL}/${storeB.slug}/dashboard`)
      await expect(pageA).toHaveURL(/unauthorized|login/, { timeout: 10000 })
      
      // 5. Loja B não deve conseguir acessar dashboard da Loja A
      await pageB.goto(`${baseURL}/${storeA.slug}/dashboard`)
      await expect(pageB).toHaveURL(/unauthorized|login/, { timeout: 10000 })
      
      console.log('✅ Teste de isolamento multi-tenant passou!')
      
    } finally {
      await contextA.close()
      await contextB.close()
    }
  })
  
  test('Pedidos devem ser isolados entre lojas', async ({ browser }) => {
    const contextA = await browser.newContext()
    const contextB = await browser.newContext()
    
    const pageA = await contextA.newPage()
    const pageB = await contextB.newPage()
    
    try {
      // Fazer pedido na Loja A
      await pageA.goto(`${baseURL}/${storeA.slug}`)
      await pageA.locator('[data-testid="product-card"]').first().click()
      await pageA.locator('button:has-text("Adicionar ao carrinho")').click()
      await pageA.waitForTimeout(1000)
      
      // Fazer pedido na Loja B
      await pageB.goto(`${baseURL}/${storeB.slug}`)
      await pageB.locator('[data-testid="product-card"]').first().click()
      await pageB.locator('button:has-text("Adicionar ao carrinho")').click()
      await pageB.waitForTimeout(1000)
      
      // Verificar que carrinhos são independentes
      await pageA.locator('[data-testid="cart-button"]').click()
      const cartItemsA = await pageA.locator('[data-testid="cart-item"]').count()
      
      await pageB.locator('[data-testid="cart-button"]').click()
      const cartItemsB = await pageB.locator('[data-testid="cart-item"]').count()
      
      expect(cartItemsA).toBeGreaterThan(0)
      expect(cartItemsB).toBeGreaterThan(0)
      
      console.log('✅ Teste de isolamento de pedidos passou!')
      
    } finally {
      await contextA.close()
      await contextB.close()
    }
  })
})
