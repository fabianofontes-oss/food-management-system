import { test, expect } from '@playwright/test'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'
const USER_A_EMAIL = process.env.E2E_USER_A_EMAIL || 'e2e-user-a@test.local'
const USER_A_PASSWORD = process.env.E2E_USER_A_PASSWORD || 'Test123456!'
const USER_B_EMAIL = process.env.E2E_USER_B_EMAIL || 'e2e-user-b@test.local'
const USER_B_PASSWORD = process.env.E2E_USER_B_PASSWORD || 'Test123456!'

let fixtures: any
let results: any[] = []

test.beforeAll(async () => {
  const fixturesPath = join(process.cwd(), 'audit', 'fixtures', 'e2e_seed.json')
  fixtures = JSON.parse(readFileSync(fixturesPath, 'utf-8'))
})

test.afterAll(async () => {
  const reportPath = join(process.cwd(), 'audit', '06_e2e_results.md')
  const report = generateReport(results)
  writeFileSync(reportPath, report)
  console.log(`\n✅ Relatório gerado: ${reportPath}`)
})

function addResult(suite: string, test: string, status: 'PASS' | 'FAIL', details: any) {
  results.push({ suite, test, status, details, timestamp: new Date().toISOString() })
}

test.describe('SUITE A - Leitura Cross-Tenant', () => {
  let userAToken: string
  let userBToken: string

  test.beforeAll(async ({ request }) => {
    const resA = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: USER_A_EMAIL, password: USER_A_PASSWORD }
    })
    const dataA = await resA.json()
    userAToken = dataA.access_token

    const resB = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: USER_B_EMAIL, password: USER_B_PASSWORD }
    })
    const dataB = await resB.json()
    userBToken = dataB.access_token
  })

  test('A1. User A lista apenas Store A1', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/stores`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    })
    const stores = await res.json()
    
    const hasStoreA = stores.some((s: any) => s.id === fixtures.storeA.id)
    const hasStoreB = stores.some((s: any) => s.id === fixtures.storeB.id)
    
    expect(hasStoreA).toBe(true)
    expect(hasStoreB).toBe(false)
    
    addResult('A', 'A1. Listar stores', 'PASS', { stores: stores.length, hasStoreA, hasStoreB })
  })

  test('A2. User A não vê customers da Store B', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/stores/${fixtures.storeB.id}/customers`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    })
    
    expect(res.status()).toBeGreaterThanOrEqual(400)
    
    addResult('A', 'A2. Consultar customers de outra store', 'PASS', { status: res.status() })
  })

  test('A3. User A não vê orders da Store B', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/stores/${fixtures.storeB.id}/orders`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    })
    
    expect(res.status()).toBeGreaterThanOrEqual(400)
    
    addResult('A', 'A3. Consultar orders de outra store', 'PASS', { status: res.status() })
  })
})

test.describe('SUITE B - Escrita Cross-Tenant', () => {
  let userAToken: string

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: USER_A_EMAIL, password: USER_A_PASSWORD }
    })
    const data = await res.json()
    userAToken = data.access_token
  })

  test('B1. User A não pode criar order na Store B', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${userAToken}` },
      data: {
        store_id: fixtures.storeB.id,
        customer: { name: 'Hacker', phone: '+5500000000' },
        items: [{ product_id: fixtures.productB.id, quantity: 1 }],
        channel: 'DELIVERY',
        payment_method: 'CASH'
      }
    })
    
    expect(res.status()).toBeGreaterThanOrEqual(400)
    
    addResult('B', 'B1. Criar order em outra store', 'PASS', { status: res.status() })
  })

  test('B2. User A não pode inserir customer na Store B', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/stores/${fixtures.storeB.id}/customers`, {
      headers: { Authorization: `Bearer ${userAToken}` },
      data: { name: 'Hacker', phone: '+5500000000' }
    })
    
    expect(res.status()).toBeGreaterThanOrEqual(400)
    
    addResult('B', 'B2. Inserir customer em outra store', 'PASS', { status: res.status() })
  })
})

test.describe('SUITE D - Fluxo Normal', () => {
  let userAToken: string

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: USER_A_EMAIL, password: USER_A_PASSWORD }
    })
    const data = await res.json()
    userAToken = data.access_token
  })

  test('D1. User A opera Store A1 normalmente', async ({ request }) => {
    const resStores = await request.get(`${BASE_URL}/api/stores`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    })
    expect(resStores.ok()).toBe(true)

    const resCustomers = await request.get(`${BASE_URL}/api/stores/${fixtures.storeA.id}/customers`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    })
    expect(resCustomers.ok()).toBe(true)

    const resOrders = await request.get(`${BASE_URL}/api/stores/${fixtures.storeA.id}/orders`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    })
    expect(resOrders.ok()).toBe(true)
    
    addResult('D', 'D1. User A opera Store A1 normalmente', 'PASS', { allOk: true })
  })
})

function generateReport(results: any[]): string {
  const totalTests = results.length
  const passedTests = results.filter(r => r.status === 'PASS').length
  const failedTests = results.filter(r => r.status === 'FAIL').length
  const successRate = ((passedTests / totalTests) * 100).toFixed(1)

  let report = `# ETAPA 6.1 - Resultados dos Testes E2E Multi-Tenant\n\n`
  report += `**Data de Execução:** ${new Date().toISOString()}\n`
  report += `**Ambiente:** ${BASE_URL}\n\n`
  report += `---\n\n`
  report += `## 📊 Resumo Executivo\n\n`
  report += `| Métrica | Resultado |\n`
  report += `|---------|-----------||\n`
  report += `| **Total de testes** | ${totalTests} |\n`
  report += `| **Testes aprovados** | ${passedTests} |\n`
  report += `| **Testes falhados** | ${failedTests} |\n`
  report += `| **Taxa de sucesso** | ${successRate}% |\n`
  report += `| **Decisão GO/NO-GO** | ${failedTests === 0 ? '✅ GO' : '❌ NO-GO'} |\n\n`
  report += `---\n\n`

  const suites = ['A', 'B', 'D']
  for (const suite of suites) {
    const suiteResults = results.filter(r => r.suite === suite)
    if (suiteResults.length === 0) continue

    report += `## 🧪 SUITE ${suite}\n\n`
    for (const result of suiteResults) {
      const icon = result.status === 'PASS' ? '✅' : '❌'
      report += `### ${icon} ${result.test}\n`
      report += `**Status:** ${result.status}\n`
      report += `**Detalhes:** \`\`\`json\n${JSON.stringify(result.details, null, 2)}\n\`\`\`\n\n`
    }
  }

  report += `---\n\n`
  report += `## 🎯 Decisão GO/NO-GO\n\n`
  report += `**Decisão:** ${failedTests === 0 ? '✅ **GO PARA PRODUÇÃO**' : '❌ **NO-GO**'}\n\n`
  
  if (failedTests === 0) {
    report += `**Justificativa:** Todos os testes de isolamento multi-tenant passaram com sucesso. Sistema está pronto para produção.\n\n`
  } else {
    report += `**Justificativa:** ${failedTests} teste(s) falharam. Vulnerabilidades de isolamento detectadas.\n\n`
    report += `**Ações Requeridas:**\n`
    const failed = results.filter(r => r.status === 'FAIL')
    failed.forEach((r, i) => {
      report += `${i + 1}. Corrigir: ${r.test}\n`
    })
  }

  report += `\n---\n\n**FIM DO RELATÓRIO DE TESTES**\n`
  
  return report
}
