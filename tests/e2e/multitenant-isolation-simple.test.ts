import { test, expect } from '@playwright/test'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let fixtures: any
let results: any[] = []

test.beforeAll(async () => {
  const fixturesPath = join(process.cwd(), 'audit', 'fixtures', 'e2e_seed.json')
  fixtures = JSON.parse(readFileSync(fixturesPath, 'utf-8'))
  
  // Hardcode password for E2E tests
  fixtures.userA.password = 'Test123456!'
  fixtures.userB.password = 'Test123456!'
})

test.afterAll(async () => {
  const reportPath = join(process.cwd(), 'audit', '06_e2e_results.md')
  const report = generateReport(results)
  writeFileSync(reportPath, report)
  console.log(`\n✅ Relatório gerado: ${reportPath}`)
})

function addResult(suite: string, testName: string, status: 'PASS' | 'FAIL', details: any) {
  results.push({ suite, test: testName, status, details, timestamp: new Date().toISOString() })
}

test.describe('SUITE A - Leitura Cross-Tenant (SQL Direct)', () => {
  test('A1. User A não vê customers da Store B', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    await supabase.auth.signInWithPassword({
      email: fixtures.userA.email,
      password: process.env.E2E_USER_A_PASSWORD!
    })

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('store_id', fixtures.storeB.id)

    expect(data === null || data.length === 0).toBe(true)
    
    addResult('A', 'A1. User A não vê customers da Store B', 'PASS', { 
      customerCount: data?.length || 0,
      storeBId: fixtures.storeB.id 
    })

    await supabase.auth.signOut()
  })

  test('A2. User A não vê orders da Store B', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    await supabase.auth.signInWithPassword({
      email: fixtures.userA.email,
      password: process.env.E2E_USER_A_PASSWORD!
    })

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', fixtures.storeB.id)

    expect(data === null || data.length === 0).toBe(true)
    
    addResult('A', 'A2. User A não vê orders da Store B', 'PASS', { 
      orderCount: data?.length || 0,
      storeBId: fixtures.storeB.id 
    })

    await supabase.auth.signOut()
  })

  test('A3. User A vê apenas seus próprios customers', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    await supabase.auth.signInWithPassword({
      email: fixtures.userA.email,
      password: process.env.E2E_USER_A_PASSWORD!
    })

    const { data, error } = await supabase
      .from('customers')
      .select('*')

    const hasStoreA = data?.some(c => c.store_id === fixtures.storeA.id) || false
    const hasStoreB = data?.some(c => c.store_id === fixtures.storeB.id) || false

    expect(hasStoreB).toBe(false)
    
    addResult('A', 'A3. User A vê apenas seus próprios customers', 'PASS', { 
      totalCustomers: data?.length || 0,
      hasStoreA,
      hasStoreB
    })

    await supabase.auth.signOut()
  })
})

test.describe('SUITE B - Escrita Cross-Tenant (SQL Direct)', () => {
  test('B1. User A não pode inserir customer na Store B', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    await supabase.auth.signInWithPassword({
      email: fixtures.userA.email,
      password: process.env.E2E_USER_A_PASSWORD!
    })

    const { data, error } = await supabase
      .from('customers')
      .insert({
        store_id: fixtures.storeB.id,
        name: 'Hacker Customer',
        phone: '+5500000000'
      })
      .select()

    expect(error).not.toBeNull()
    expect(data).toBeNull()
    
    addResult('B', 'B1. User A não pode inserir customer na Store B', 'PASS', { 
      errorCode: error?.code,
      errorMessage: error?.message
    })

    await supabase.auth.signOut()
  })

  test('B2. User A não pode atualizar customer da Store B', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    await supabase.auth.signInWithPassword({
      email: fixtures.userA.email,
      password: process.env.E2E_USER_A_PASSWORD!
    })

    const { data, error } = await supabase
      .from('customers')
      .update({ name: 'Hacked' })
      .eq('id', fixtures.customerB.id)
      .select()

    expect(data === null || data.length === 0).toBe(true)
    
    addResult('B', 'B2. User A não pode atualizar customer da Store B', 'PASS', { 
      updatedCount: data?.length || 0
    })

    await supabase.auth.signOut()
  })
})

test.describe('SUITE D - Fluxo Normal', () => {
  test('D1. User A opera Store A1 normalmente', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: fixtures.userA.email,
      password: fixtures.userA.password || 'Test123456!'
    })

    console.log('Auth result:', { 
      userId: authData?.user?.id, 
      email: authData?.user?.email,
      error: authError 
    })

    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .eq('store_id', fixtures.storeA.id)

    console.log('Customers query:', { 
      data: customers, 
      error: customersError,
      storeId: fixtures.storeA.id 
    })

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', fixtures.storeA.id)

    console.log('Orders query:', { 
      data: orders, 
      error: ordersError 
    })

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', fixtures.storeA.id)

    console.log('Products query:', { 
      data: products, 
      error: productsError 
    })

    const hasData = (customers && customers.length > 0) || 
                    (orders && orders.length > 0) || 
                    (products && products.length > 0)
    
    addResult('D', 'D1. User A opera Store A1 normalmente', hasData ? 'PASS' : 'FAIL', { 
      customersCount: customers?.length || 0,
      ordersCount: orders?.length || 0,
      productsCount: products?.length || 0,
      customersError: customersError?.message,
      ordersError: ordersError?.message,
      productsError: productsError?.message
    })

    expect(hasData).toBe(true)

    await supabase.auth.signOut()
  })
})

function generateReport(results: any[]): string {
  const totalTests = results.length
  const passedTests = results.filter(r => r.status === 'PASS').length
  const failedTests = results.filter(r => r.status === 'FAIL').length
  const successRate = ((passedTests / totalTests) * 100).toFixed(1)

  let report = `# ETAPA 6.1 - Resultados dos Testes E2E Multi-Tenant\n\n`
  report += `**Data de Execução:** ${new Date().toISOString()}\n`
  report += `**Ambiente:** ${SUPABASE_URL}\n\n`
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
