# Auditoria de QA e Testes

**Data:** 12 de Dezembro de 2025  
**Versão:** 1.0  
**Status:** Completo

---

## 📊 Resumo Executivo

- **Testes Unitários:** ❌ 0%
- **Testes de Integração:** ❌ 0%
- **Testes E2E:** ❌ 0%
- **Type Coverage:** ✅ ~90%
- **Linting:** ✅ Configurado
- **CI/CD:** ❌ Não configurado
- **Status Geral:** 🔴 **CRÍTICO** (10% de cobertura)

---

## 🧪 Testes

### Status Atual

**Implementação:** ❌ Nenhum teste

**Problema:**
- Sem testes automatizados
- Sem garantia de qualidade
- Regressões não detectadas
- Deploy arriscado
- Refatoração perigosa

---

## 📝 Type Checking

### TypeScript

**Status:** ✅ Configurado

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Comando:**
```bash
npm run type-check
```

**Findings:**
- ✅ TypeScript strict mode habilitado
- ✅ Tipos gerados do Supabase
- ✅ ~90% de cobertura de tipos
- ⚠️ **MEDIUM**: Alguns `any` ainda presentes
- ⚠️ **LOW**: Falta validação em CI

**Prazo para CI:** 1 dia

---

## 🎨 Linting

### ESLint

**Status:** ✅ Configurado

```json
// .eslintrc.json
{
  "extends": "next/core-web-vitals"
}
```

**Comando:**
```bash
npm run lint
```

**Findings:**
- ✅ ESLint configurado
- ✅ Next.js rules
- ⚠️ **LOW**: Falta rules customizadas
- ⚠️ **LOW**: Falta validação em CI

**Regras Recomendadas:**
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

**Prazo:** 1 dia

---

## 🏗️ Build

### Next.js Build

**Comando:**
```bash
npm run build
```

**Findings:**
- ✅ Build funciona
- ✅ Sem erros de TypeScript
- ⚠️ **MEDIUM**: Não valida em CI
- ⚠️ **LOW**: Não mede bundle size

**Prazo para CI:** 1 dia

---

## 🧪 Testes Unitários

### Status Atual

**Implementação:** ❌ Nenhum

**Problema:**
- Funções críticas sem testes
- Lógica de negócio não validada
- Bugs não detectados

---

### Solução Recomendada

#### 1. Configurar Jest + React Testing Library

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

**Prazo:** 1 dia

---

#### 2. Testes Prioritários

**Lógica de Cupons:**
```typescript
// src/lib/coupons/__tests__/utils.test.ts
import { calculateDiscount, isCouponValid } from '../utils'

describe('calculateDiscount', () => {
  it('calcula desconto percentual corretamente', () => {
    const result = calculateDiscount({
      type: 'percent',
      value: 10,
      subtotal: 100
    })
    expect(result).toBe(10)
  })

  it('calcula desconto fixo corretamente', () => {
    const result = calculateDiscount({
      type: 'fixed',
      value: 15,
      subtotal: 100
    })
    expect(result).toBe(15)
  })

  it('não permite desconto maior que subtotal', () => {
    const result = calculateDiscount({
      type: 'fixed',
      value: 150,
      subtotal: 100
    })
    expect(result).toBe(100)
  })
})

describe('isCouponValid', () => {
  it('valida cupom ativo', () => {
    const coupon = {
      is_active: true,
      starts_at: null,
      ends_at: null,
      max_uses: null,
      uses_count: 0
    }
    expect(isCouponValid(coupon)).toBe(true)
  })

  it('invalida cupom inativo', () => {
    const coupon = {
      is_active: false,
      starts_at: null,
      ends_at: null,
      max_uses: null,
      uses_count: 0
    }
    expect(isCouponValid(coupon)).toBe(false)
  })

  it('invalida cupom expirado', () => {
    const coupon = {
      is_active: true,
      starts_at: null,
      ends_at: new Date('2020-01-01'),
      max_uses: null,
      uses_count: 0
    }
    expect(isCouponValid(coupon)).toBe(false)
  })
})
```

**Prazo:** 2 dias

---

**Cálculo de Total:**
```typescript
// src/lib/orders/__tests__/calculate-total.test.ts
import { calculateOrderTotal } from '../calculate-total'

describe('calculateOrderTotal', () => {
  it('calcula total sem desconto nem taxa', () => {
    const result = calculateOrderTotal({
      subtotal: 100,
      discount: 0,
      deliveryFee: 0
    })
    expect(result).toBe(100)
  })

  it('calcula total com desconto', () => {
    const result = calculateOrderTotal({
      subtotal: 100,
      discount: 10,
      deliveryFee: 0
    })
    expect(result).toBe(90)
  })

  it('calcula total com taxa de entrega', () => {
    const result = calculateOrderTotal({
      subtotal: 100,
      discount: 0,
      deliveryFee: 5
    })
    expect(result).toBe(105)
  })

  it('calcula total completo', () => {
    const result = calculateOrderTotal({
      subtotal: 100,
      discount: 10,
      deliveryFee: 5
    })
    expect(result).toBe(95)
  })
})
```

**Prazo:** 1 dia

---

**Validações:**
```typescript
// src/lib/validations/__tests__/settings.test.ts
import { settingsFormSchema } from '../settings'

describe('settingsFormSchema', () => {
  it('valida configurações válidas', () => {
    const data = {
      enablePOS: true,
      enableKitchen: true,
      enableDelivery: true,
      // ...
    }
    expect(() => settingsFormSchema.parse(data)).not.toThrow()
  })

  it('invalida PIX sem chave', () => {
    const data = {
      pix: {
        enabled: true,
        keyType: undefined,
        keyValue: undefined
      }
    }
    expect(() => settingsFormSchema.parse(data)).toThrow()
  })
})
```

**Prazo:** 1 dia

---

#### 3. Cobertura Mínima

**Meta:** 70% de cobertura

**Prioridades:**
1. 🔴 Lógica de cupons (100%)
2. 🔴 Cálculo de totais (100%)
3. 🔴 Validações (100%)
4. ⚠️ Helpers e utils (80%)
5. 🟡 Componentes UI (50%)

**Prazo:** 1 semana

---

## 🔗 Testes de Integração

### Status Atual

**Implementação:** ❌ Nenhum

**Problema:**
- Não testa fluxos completos
- Não valida integração com Supabase
- Não detecta problemas de RLS

---

### Solução Recomendada

#### 1. Configurar Vitest

```bash
npm install -D vitest @vitejs/plugin-react
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

**Prazo:** 1 dia

---

#### 2. Testes de Server Actions

```typescript
// src/lib/actions/__tests__/products.test.ts
import { createProduct, updateProduct } from '../products'
import { createClient } from '@/lib/supabase/server'

describe('Product Actions', () => {
  let storeId: string
  let userId: string

  beforeAll(async () => {
    // Setup test data
    const supabase = await createClient()
    // Create test store and user
  })

  it('cria produto com sucesso', async () => {
    const product = {
      name: 'Test Product',
      price: 10.00,
      store_id: storeId
    }
    
    const result = await createProduct(product)
    
    expect(result.success).toBe(true)
    expect(result.data.name).toBe('Test Product')
  })

  it('não permite criar produto sem permissão', async () => {
    // Mock user sem acesso
    const result = await createProduct({
      name: 'Test',
      price: 10,
      store_id: 'other-store-id'
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('permission')
  })
})
```

**Prazo:** 3 dias

---

## 🎭 Testes E2E

### Status Atual

**Implementação:** ❌ Nenhum

**Problema:**
- Não testa fluxo completo do usuário
- Não valida UI
- Não detecta problemas de UX

---

### Solução Recomendada

#### 1. Configurar Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})
```

**Prazo:** 1 dia

---

#### 2. Testes Críticos

**Fluxo de Pedido:**
```typescript
// e2e/order-flow.spec.ts
import { test, expect } from '@playwright/test'

test('cliente pode fazer pedido completo', async ({ page }) => {
  // 1. Acessar menu
  await page.goto('/minha-loja')
  await expect(page.locator('h1')).toContainText('Menu')

  // 2. Adicionar produto ao carrinho
  await page.click('[data-testid="product-card"]:first-child')
  await page.click('[data-testid="add-to-cart"]')
  await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')

  // 3. Ir para checkout
  await page.click('[data-testid="cart-button"]')
  await page.click('[data-testid="checkout-button"]')

  // 4. Preencher dados
  await page.fill('[name="customer_name"]', 'Test User')
  await page.fill('[name="customer_phone"]', '11999999999')
  await page.fill('[name="customer_address"]', 'Test Address')

  // 5. Selecionar pagamento
  await page.click('[data-testid="payment-pix"]')

  // 6. Finalizar pedido
  await page.click('[data-testid="place-order"]')

  // 7. Verificar sucesso
  await expect(page.locator('[data-testid="order-success"]')).toBeVisible()
})
```

**Prazo:** 2 dias

---

**Fluxo de Cupom:**
```typescript
// e2e/coupon-flow.spec.ts
test('cliente pode aplicar cupom', async ({ page }) => {
  // 1. Adicionar produto
  await page.goto('/minha-loja')
  await page.click('[data-testid="add-to-cart"]:first-child')

  // 2. Ir para checkout
  await page.click('[data-testid="cart-button"]')
  await page.click('[data-testid="checkout-button"]')

  // 3. Aplicar cupom
  await page.fill('[data-testid="coupon-input"]', 'DESCONTO10')
  await page.click('[data-testid="apply-coupon"]')

  // 4. Verificar desconto aplicado
  await expect(page.locator('[data-testid="discount-amount"]')).toContainText('R$ 10,00')
  await expect(page.locator('[data-testid="total"]')).toContainText('R$ 90,00')
})
```

**Prazo:** 1 dia

---

**Fluxo Admin:**
```typescript
// e2e/admin-product.spec.ts
test('admin pode criar produto', async ({ page }) => {
  // 1. Login
  await page.goto('/login')
  await page.fill('[name="email"]', 'admin@test.com')
  await page.fill('[name="password"]', 'password')
  await page.click('[type="submit"]')

  // 2. Ir para produtos
  await page.goto('/minha-loja/dashboard/products')

  // 3. Criar produto
  await page.click('[data-testid="new-product"]')
  await page.fill('[name="name"]', 'Test Product')
  await page.fill('[name="price"]', '10.00')
  await page.click('[data-testid="save-product"]')

  // 4. Verificar produto criado
  await expect(page.locator('[data-testid="product-list"]')).toContainText('Test Product')
})
```

**Prazo:** 2 dias

---

## 🔄 CI/CD

### Status Atual

**Implementação:** ❌ Nenhum

**Problema:**
- Deploy manual
- Sem validação automática
- Sem testes antes de deploy
- Risco de quebrar produção

---

### Solução Recomendada

#### 1. GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Unit tests
        run: npm run test
      
      - name: Build
        run: npm run build
      
      - name: E2E tests
        run: npx playwright test
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

**Prazo:** 2 dias

---

#### 2. Deploy Automático

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

**Prazo:** 1 dia

---

## 🚨 Findings Consolidados

### 🔴 BLOCKER (1)

1. **Sem testes automatizados**
   - **Impacto:** Deploy arriscado, bugs não detectados
   - **Risco:** Quebrar produção
   - **Fix:** Implementar testes unitários + E2E
   - **Prazo:** 2 semanas

### 🔴 HIGH (4)

2. **Sem CI/CD**
   - **Impacto:** Deploy manual, sem validação
   - **Fix:** Configurar GitHub Actions
   - **Prazo:** 3 dias

3. **Sem testes de lógica crítica**
   - **Impacto:** Bugs em cupons, cálculos
   - **Fix:** Testes unitários prioritários
   - **Prazo:** 1 semana

4. **Sem testes E2E**
   - **Impacto:** Fluxos não validados
   - **Fix:** Playwright com fluxos críticos
   - **Prazo:** 1 semana

5. **Type check não roda em CI**
   - **Impacto:** Erros de tipo em produção
   - **Fix:** Adicionar ao CI
   - **Prazo:** 1 dia

### ⚠️ MEDIUM (2)

6. **Alguns `any` ainda presentes**
   - **Impacto:** Type safety reduzida
   - **Fix:** Remover `any` e tipar corretamente
   - **Prazo:** 3 dias

7. **Lint não roda em CI**
   - **Impacto:** Code style inconsistente
   - **Fix:** Adicionar ao CI
   - **Prazo:** 1 dia

---

## 🎯 Plano de Ação

### Semana 1

**Dia 1:**
- ✅ Configurar Jest (#3)
- ✅ Configurar GitHub Actions (#2)
- ✅ Adicionar type-check e lint ao CI (#5, #7)

**Dias 2-3:**
- ✅ Testes de cupons (#3)
- ✅ Testes de cálculo de total (#3)

**Dias 4-5:**
- ✅ Testes de validações (#3)
- ✅ Configurar Playwright (#4)

### Semana 2

**Dias 8-9:**
- ✅ Testes E2E de pedido (#4)
- ✅ Testes E2E de cupom (#4)

**Dias 10-11:**
- ✅ Testes E2E admin (#4)
- ✅ Testes de integração (#3)

**Dias 12-14:**
- ✅ Remover `any` (#6)
- ✅ Configurar deploy automático (#2)
- ✅ Documentação de testes

---

## 📊 Métricas de Qualidade

### Antes

| Métrica | Valor | Status |
|---------|-------|--------|
| Testes Unitários | 0% | 🔴 |
| Testes Integração | 0% | 🔴 |
| Testes E2E | 0% | 🔴 |
| Type Coverage | 90% | 🟢 |
| Lint Errors | 0 | 🟢 |
| CI/CD | ❌ | 🔴 |
| Deploy Automático | ❌ | 🔴 |

### Depois (Esperado)

| Métrica | Valor | Status |
|---------|-------|--------|
| Testes Unitários | 70% | 🟢 |
| Testes Integração | 50% | 🟢 |
| Testes E2E | 80% | 🟢 |
| Type Coverage | 95% | 🟢 |
| Lint Errors | 0 | 🟢 |
| CI/CD | ✅ | 🟢 |
| Deploy Automático | ✅ | 🟢 |

---

## ✅ Conclusão

O sistema tem **ZERO testes**, o que é **CRÍTICO** para produção.

**Prioridades:**
1. 🔴 Implementar testes unitários (lógica crítica)
2. 🔴 Configurar CI/CD
3. 🔴 Implementar testes E2E (fluxos principais)
4. 🔴 Adicionar validações ao CI

**Não pode ir para produção sem:**
- ✅ Testes de lógica crítica (cupons, cálculos)
- ✅ CI/CD configurado
- ✅ Testes E2E de fluxos principais
- ✅ Type check e lint no CI

**Status Geral:** 🔴 **CRÍTICO** (10% de qualidade)  
**Após Correções:** 🟢 **BOM** (80% esperado)  
**Prazo Mínimo:** 2 semanas
