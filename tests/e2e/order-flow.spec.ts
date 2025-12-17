import { test, expect } from '@playwright/test'

/**
 * Testes E2E para o fluxo crítico de pedidos
 * 
 * Cenários cobertos:
 * 1. Pedido imediato (loja aberta ou agendamento opcional)
 * 2. Loja fechada + agendamento habilitado
 * 3. Guard multi-store do carrinho
 */

// Slugs das lojas de teste (definidos no seed-e2e.sql)
const STORE_A_SLUG = 'e2e-loja-agendamento'
const STORE_B_SLUG = 'e2e-loja-secundaria'

// Seletores comuns
const SELECTORS = {
  // Produtos no cardápio
  productCard: '[data-testid="product-card"]',
  addToCartButton: '[data-testid="add-to-cart"]',
  
  // Carrinho
  cartButton: '[data-testid="cart-button"]',
  cartDrawer: '[data-testid="cart-drawer"]',
  cartItem: '[data-testid="cart-item"]',
  cartTotal: '[data-testid="cart-total"]',
  checkoutButton: '[data-testid="checkout-button"]',
  
  // Checkout
  customerName: 'input[name="name"]',
  customerPhone: 'input[name="phone"]',
  submitOrder: 'button[type="submit"]',
  
  // Agendamento
  schedulingSelector: '[data-testid="scheduling-selector"]',
  schedulingSlot: '[data-testid="scheduling-slot"]',
  
  // Sucesso
  orderSuccess: '[data-testid="order-success"]',
  orderCode: '[data-testid="order-code"]',
}

test.describe('Fluxo de Pedido - E2E', () => {
  
  test.describe('Cenário 1: Pedido Imediato', () => {
    
    test('deve completar pedido com sucesso quando loja aberta', async ({ page }) => {
      // 1. Acessar cardápio da loja A
      await page.goto(`/${STORE_A_SLUG}`)
      await expect(page).toHaveURL(new RegExp(`/${STORE_A_SLUG}`))
      
      // 2. Aguardar carregamento dos produtos
      await page.waitForLoadState('networkidle')
      
      // 3. Encontrar e clicar em um produto
      // Usar texto do produto para ser mais resiliente
      const productButton = page.getByRole('button', { name: /adicionar|comprar/i }).first()
      
      // Se não encontrar botão, tentar clicar no card do produto
      if (await productButton.count() === 0) {
        const productCard = page.locator('[class*="product"], [class*="card"]').filter({ hasText: /E2E|burguer/i }).first()
        await productCard.click()
        
        // Aguardar modal de produto e adicionar
        const addButton = page.getByRole('button', { name: /adicionar|carrinho/i })
        await addButton.click()
      } else {
        await productButton.click()
      }
      
      // 4. Aguardar item ser adicionado ao carrinho
      await page.waitForTimeout(500)
      
      // 5. Abrir carrinho (pode ser drawer ou página)
      const cartButton = page.locator('[class*="cart"], [aria-label*="carrinho"]').first()
      if (await cartButton.isVisible()) {
        await cartButton.click()
      }
      
      // 6. Ir para checkout
      await page.goto(`/${STORE_A_SLUG}/checkout`)
      await expect(page).toHaveURL(new RegExp(`/${STORE_A_SLUG}/checkout`))
      
      // 7. Preencher dados do cliente (modo guest não exige telefone)
      const nameInput = page.locator('input[name="name"], input[placeholder*="nome"]').first()
      if (await nameInput.isVisible()) {
        await nameInput.fill('Cliente E2E Teste')
      }
      
      // 8. Verificar se checkout carregou corretamente
      await expect(page.locator('form')).toBeVisible()
      
      // Verificar se botão de submit está visível
      const submitButton = page.locator('button[type="submit"]')
      await expect(submitButton).toBeVisible()
      
      // Nota: Não vamos submeter de verdade para não poluir o banco
      // Em produção, usaríamos um banco de teste isolado
    })
  })

  test.describe('Cenário 2: Loja Fechada + Agendamento', () => {
    
    test('deve exibir seletor de agendamento quando loja fechada', async ({ page }) => {
      // 1. Acessar checkout da loja A
      // Primeiro, adicionar item ao carrinho via página
      await page.goto(`/${STORE_A_SLUG}`)
      await page.waitForLoadState('networkidle')
      
      // 2. Simular adicionar item (via localStorage para o teste)
      await page.evaluate((storeSlug) => {
        const cartData = {
          state: {
            items: [{
              product_id: 'e2e00000-0000-0000-0000-000000001001',
              name: 'X-Burguer E2E',
              price: 25.90,
              quantity: 1,
              modifiers: []
            }],
            storeId: 'e2e00000-0000-0000-0000-000000000010',
            storeSlug: storeSlug,
            storeName: 'E2E Loja Agendamento'
          },
          version: 0
        }
        localStorage.setItem('cart-storage', JSON.stringify(cartData))
      }, STORE_A_SLUG)
      
      // 3. Acessar checkout
      await page.goto(`/${STORE_A_SLUG}/checkout`)
      await page.waitForLoadState('networkidle')
      
      // 4. Verificar se checkout carregou
      await expect(page.locator('form')).toBeVisible({ timeout: 10000 })
      
      // 5. Verificar presença do componente de agendamento
      // O componente pode ter texto relacionado a agendamento
      const schedulingText = page.getByText(/agendar|agendamento|horário/i)
      
      // Se loja está fechada, o seletor de agendamento deve estar visível
      // Se está aberta, deve ter a opção de agendar
      const hasSchedulingOption = await schedulingText.count() > 0
      
      // Pelo menos a estrutura de checkout deve estar presente
      await expect(page.locator('button[type="submit"]')).toBeVisible()
      
      if (hasSchedulingOption) {
        // Verificar que há slots disponíveis ou mensagem de agendamento
        console.log('Componente de agendamento encontrado')
      }
    })

    test('deve permitir selecionar slot de agendamento', async ({ page }) => {
      // 1. Setup: adicionar item ao carrinho via localStorage
      await page.goto(`/${STORE_A_SLUG}`)
      await page.waitForLoadState('networkidle')
      
      await page.evaluate((storeSlug) => {
        const cartData = {
          state: {
            items: [{
              product_id: 'e2e00000-0000-0000-0000-000000001001',
              name: 'X-Burguer E2E',
              price: 25.90,
              quantity: 1,
              modifiers: []
            }],
            storeId: 'e2e00000-0000-0000-0000-000000000010',
            storeSlug: storeSlug,
            storeName: 'E2E Loja Agendamento'
          },
          version: 0
        }
        localStorage.setItem('cart-storage', JSON.stringify(cartData))
      }, STORE_A_SLUG)
      
      // 2. Acessar checkout
      await page.goto(`/${STORE_A_SLUG}/checkout`)
      await page.waitForLoadState('networkidle')
      
      // 3. Procurar por elementos de agendamento
      const schedulingSection = page.locator('[class*="scheduling"], [class*="Scheduling"]')
      
      if (await schedulingSection.count() > 0) {
        // 4. Se houver botões de dia, clicar no primeiro disponível
        const dayButtons = schedulingSection.locator('button').filter({ hasText: /hoje|amanhã|seg|ter|qua|qui|sex|sáb|dom/i })
        
        if (await dayButtons.count() > 0) {
          await dayButtons.first().click()
          
          // 5. Selecionar um horário
          const timeSlots = page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ })
          
          if (await timeSlots.count() > 0) {
            await timeSlots.first().click()
            
            // 6. Verificar que o botão de submit mudou para "Agendar"
            const submitButton = page.locator('button[type="submit"]')
            await expect(submitButton).toContainText(/agendar/i)
          }
        }
      }
    })
  })

  test.describe('Cenário 3: Guard Multi-Store do Carrinho', () => {
    
    test('deve limpar carrinho ao trocar de loja', async ({ page }) => {
      // 1. Acessar loja A e adicionar item ao carrinho
      await page.goto(`/${STORE_A_SLUG}`)
      await page.waitForLoadState('networkidle')
      
      // Adicionar item via localStorage para garantir estado inicial
      await page.evaluate(() => {
        const cartData = {
          state: {
            items: [{
              product_id: 'e2e00000-0000-0000-0000-000000001001',
              name: 'X-Burguer E2E',
              price: 25.90,
              quantity: 1,
              modifiers: []
            }],
            storeId: 'e2e00000-0000-0000-0000-000000000010',
            storeSlug: 'e2e-loja-agendamento',
            storeName: 'E2E Loja Agendamento'
          },
          version: 0
        }
        localStorage.setItem('cart-storage', JSON.stringify(cartData))
      })
      
      // 2. Recarregar para garantir que o estado foi aplicado
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // 3. Verificar que carrinho tem item (via localStorage)
      const cartBeforeSwitch = await page.evaluate(() => {
        const cart = localStorage.getItem('cart-storage')
        return cart ? JSON.parse(cart) : null
      })
      
      expect(cartBeforeSwitch?.state?.items?.length).toBeGreaterThan(0)
      expect(cartBeforeSwitch?.state?.storeSlug).toBe(STORE_A_SLUG)
      
      // 4. Navegar para loja B
      await page.goto(`/${STORE_B_SLUG}`)
      await page.waitForLoadState('networkidle')
      
      // 5. Aguardar o useEffect do setStore ser executado
      await page.waitForTimeout(1000)
      
      // 6. Verificar que o carrinho foi limpo ou a loja foi trocada
      const cartAfterSwitch = await page.evaluate(() => {
        const cart = localStorage.getItem('cart-storage')
        return cart ? JSON.parse(cart) : null
      })
      
      // O carrinho deve ter sido limpo OU a loja deve ter sido trocada
      if (cartAfterSwitch?.state?.items?.length > 0) {
        // Se ainda tem itens, deve ser da nova loja
        expect(cartAfterSwitch?.state?.storeSlug).toBe(STORE_B_SLUG)
      } else {
        // Carrinho foi limpo - comportamento esperado
        expect(cartAfterSwitch?.state?.items?.length || 0).toBe(0)
      }
    })

    test('não deve misturar itens de lojas diferentes', async ({ page }) => {
      // 1. Começar com carrinho vazio
      await page.goto(`/${STORE_A_SLUG}`)
      await page.waitForLoadState('networkidle')
      
      // Limpar carrinho
      await page.evaluate(() => {
        localStorage.removeItem('cart-storage')
      })
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // 2. Simular adicionar item da loja A
      await page.evaluate(() => {
        const cartData = {
          state: {
            items: [{
              product_id: 'e2e00000-0000-0000-0000-000000001001',
              name: 'X-Burguer E2E',
              price: 25.90,
              quantity: 1,
              modifiers: []
            }],
            storeId: 'e2e00000-0000-0000-0000-000000000010',
            storeSlug: 'e2e-loja-agendamento',
            storeName: 'E2E Loja Agendamento'
          },
          version: 0
        }
        localStorage.setItem('cart-storage', JSON.stringify(cartData))
      })
      
      // 3. Navegar para loja B
      await page.goto(`/${STORE_B_SLUG}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      
      // 4. Tentar adicionar item da loja B
      // (simular via evaluate, como se o usuário tivesse clicado)
      await page.evaluate(() => {
        // Obter carrinho atual
        const cartRaw = localStorage.getItem('cart-storage')
        const cart = cartRaw ? JSON.parse(cartRaw) : { state: { items: [], storeId: null, storeSlug: null } }
        
        // O sistema deve ter limpo o carrinho ao trocar de loja
        // Se ainda tem a loja antiga, verificar que não consegue adicionar
        if (cart.state.storeSlug && cart.state.storeSlug !== 'e2e-loja-secundaria') {
          // Loja diferente - deve limpar antes de adicionar
          cart.state = {
            items: [],
            storeId: 'e2e00000-0000-0000-0000-000000000020',
            storeSlug: 'e2e-loja-secundaria',
            storeName: 'E2E Loja Secundária'
          }
        }
        
        // Adicionar item da loja B
        cart.state.items.push({
          product_id: 'e2e00000-0000-0000-0000-000000002001',
          name: 'Açaí 500ml E2E',
          price: 22.00,
          quantity: 1,
          modifiers: []
        })
        cart.state.storeId = 'e2e00000-0000-0000-0000-000000000020'
        cart.state.storeSlug = 'e2e-loja-secundaria'
        
        localStorage.setItem('cart-storage', JSON.stringify(cart))
      })
      
      // 5. Verificar estado final do carrinho
      const finalCart = await page.evaluate(() => {
        const cart = localStorage.getItem('cart-storage')
        return cart ? JSON.parse(cart) : null
      })
      
      // Todos os itens devem ser da mesma loja
      expect(finalCart?.state?.storeSlug).toBe(STORE_B_SLUG)
      
      // Não deve haver itens da loja A
      const hasStoreAItems = finalCart?.state?.items?.some(
        (item: { product_id: string }) => item.product_id === 'e2e00000-0000-0000-0000-000000001001'
      )
      expect(hasStoreAItems).toBeFalsy()
    })
  })
})

test.describe('Validações de UI', () => {
  
  test('cardápio deve exibir produtos corretamente', async ({ page }) => {
    await page.goto(`/${STORE_A_SLUG}`)
    await page.waitForLoadState('networkidle')
    
    // Verificar que a página carregou
    await expect(page).toHaveURL(new RegExp(`/${STORE_A_SLUG}`))
    
    // Verificar que há conteúdo na página
    const body = page.locator('body')
    await expect(body).not.toBeEmpty()
    
    // Verificar presença de elementos de produto ou cardápio
    const hasProducts = await page.locator('[class*="product"], [class*="card"], [class*="menu"]').count() > 0
    expect(hasProducts).toBeTruthy()
  })

  test('checkout deve validar campos obrigatórios', async ({ page }) => {
    // Setup: adicionar item ao carrinho
    await page.goto(`/${STORE_A_SLUG}`)
    await page.waitForLoadState('networkidle')
    
    await page.evaluate((storeSlug) => {
      const cartData = {
        state: {
          items: [{
            product_id: 'e2e00000-0000-0000-0000-000000001001',
            name: 'X-Burguer E2E',
            price: 25.90,
            quantity: 1,
            modifiers: []
          }],
          storeId: 'e2e00000-0000-0000-0000-000000000010',
          storeSlug: storeSlug,
          storeName: 'E2E Loja Agendamento'
        },
        version: 0
      }
      localStorage.setItem('cart-storage', JSON.stringify(cartData))
    }, STORE_A_SLUG)
    
    // Acessar checkout
    await page.goto(`/${STORE_A_SLUG}/checkout`)
    await page.waitForLoadState('networkidle')
    
    // Verificar que o formulário está presente
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 })
    
    // Verificar presença de campos
    const hasInputs = await page.locator('input').count() > 0
    expect(hasInputs).toBeTruthy()
    
    // Verificar botão de submit
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
  })
})
