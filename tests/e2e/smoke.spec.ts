import { test, expect } from '@playwright/test'

/**
 * Testes de Smoke - Verificam se o sistema está funcionando
 * Estes testes rodam contra o sistema real (produção ou local)
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://food-management-system-ochre.vercel.app'

test.describe('Smoke Tests - Sistema Online', () => {
  
  test('Landing page carrega corretamente', async ({ page }) => {
    await page.goto('/')
    
    // Verificar título
    await expect(page).toHaveTitle(/Pediu|Food Management/)
    
    // Verificar elementos principais da landing
    const heroSection = page.locator('h1, h2').first()
    await expect(heroSection).toBeVisible()
    
    // Verificar que há conteúdo
    const body = page.locator('body')
    await expect(body).not.toBeEmpty()
  })

  test('Página de login carrega', async ({ page }) => {
    await page.goto('/login')
    
    // Verificar formulário de login
    await expect(page.locator('form')).toBeVisible()
    
    // Verificar campos de email e senha
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    const passwordInput = page.locator('input[type="password"], input[name="password"]')
    
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    
    // Verificar botão de submit
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
  })

  test('Página de cadastro carrega', async ({ page }) => {
    await page.goto('/signup')
    
    // Verificar formulário de cadastro
    await expect(page.locator('form')).toBeVisible()
    
    // Verificar campos básicos
    const hasInputs = await page.locator('input').count()
    expect(hasInputs).toBeGreaterThan(0)
  })

  test('Página de reset de senha carrega', async ({ page }) => {
    await page.goto('/reset-password')
    
    // Verificar que a página carrega sem erro 404
    await expect(page).not.toHaveURL(/404|not-found/)
    
    // Verificar presença de formulário ou conteúdo
    const body = page.locator('body')
    await expect(body).not.toBeEmpty()
  })

  test('Painel admin carrega (sem autenticação)', async ({ page }) => {
    await page.goto('/admin')
    
    // Pode redirecionar para login ou mostrar painel
    // Verificar que não dá erro 500
    const hasContent = await page.locator('body').textContent()
    expect(hasContent).toBeTruthy()
  })

  test('Links de navegação funcionam', async ({ page }) => {
    await page.goto('/')
    
    // Verificar link para login
    const loginLink = page.locator('a[href*="login"]').first()
    if (await loginLink.isVisible()) {
      await loginLink.click()
      await expect(page).toHaveURL(/login/)
    }
  })

  test('Site é responsivo (mobile)', async ({ page }) => {
    // Definir viewport mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Verificar que carrega sem problemas
    await expect(page.locator('body')).toBeVisible()
    
    // Verificar que não há overflow horizontal
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(375 + 50) // margem de tolerância
  })

  test('Favicon e meta tags existem', async ({ page }) => {
    await page.goto('/')
    
    // Verificar meta description
    const metaDescription = page.locator('meta[name="description"]')
    const hasDescription = await metaDescription.count() > 0
    
    // Verificar og:title
    const ogTitle = page.locator('meta[property="og:title"]')
    const hasOgTitle = await ogTitle.count() > 0
    
    // Pelo menos um deve existir
    expect(hasDescription || hasOgTitle).toBeTruthy()
  })
})

test.describe('Performance Básica', () => {
  
  test('Landing page carrega em menos de 5 segundos', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(5000)
  })

  test('Não há erros JavaScript no console', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Filtrar erros conhecidos/aceitáveis
    const criticalErrors = errors.filter(e => 
      !e.includes('ResizeObserver') && 
      !e.includes('third-party')
    )
    
    expect(criticalErrors.length).toBe(0)
  })
})
