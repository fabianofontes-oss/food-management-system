#!/usr/bin/env node

import { config } from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, '..', '.env.local') })

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'
const INTERNAL_TOKEN = process.env.E2E_INTERNAL_TOKEN || ''

async function seedE2E() {
  console.log('🌱 Iniciando seed E2E...')
  console.log(`📍 Base URL: ${BASE_URL}`)

  try {
    const response = await fetch(`${BASE_URL}/api/internal/e2e/seed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_TOKEN,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Seed failed: ${response.status} - ${error}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(`Seed failed: ${result.error}`)
    }

    console.log('✅ Seed E2E concluído com sucesso!')
    console.log(`📁 Fixtures salvas em: ${result.fixturesPath}`)
    console.log('\n📊 Dados criados:')
    console.log(`  - Tenant A: ${result.fixtures.tenantA.name} (${result.fixtures.tenantA.id})`)
    console.log(`  - Tenant B: ${result.fixtures.tenantB.name} (${result.fixtures.tenantB.id})`)
    console.log(`  - Store A: ${result.fixtures.storeA.name} (${result.fixtures.storeA.slug})`)
    console.log(`  - Store B: ${result.fixtures.storeB.name} (${result.fixtures.storeB.slug})`)
    console.log(`  - User A: ${result.fixtures.userA.email}`)
    console.log(`  - User B: ${result.fixtures.userB.email}`)
    console.log('\n🧪 Pronto para executar testes E2E!')
    console.log('   Execute: npm run test:e2e')

    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao executar seed E2E:', error.message)
    process.exit(1)
  }
}

seedE2E()
