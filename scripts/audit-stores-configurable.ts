/**
 * AUDITORIA: LOJAS CONFIGURÁVEIS PELO LOJISTA
 *
 * O que valida:
 * - Loja existe e está ativa
 * - Tem pelo menos 1 vínculo em store_users (alguém consegue acessar o dashboard)
 * - RLS/policies não dá para validar diretamente via SQL aqui, mas vínculo é pré-requisito
 * - Bucket store-assets existe (necessário para upload banner/logo)
 *
 * Execução:
 *   node scripts/audit-stores-configurable.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, serviceKey)

type StoreRow = {
  id: string
  name: string
  slug: string
  is_active: boolean
}

async function audit() {
  console.log('\n' + '='.repeat(72))
  console.log('🔍 AUDITORIA: LOJAS CONFIGURÁVEIS (DASHBOARD + APARÊNCIA + UPLOAD)')
  console.log('='.repeat(72) + '\n')

  // 1) Buckets
  console.log('1) Verificando Supabase Storage bucket...')
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

  if (bucketsError) {
    console.log('   ❌ Erro ao listar buckets:', bucketsError.message)
  } else {
    const hasStoreAssets = !!buckets?.find(b => b.name === 'store-assets')
    console.log(`   ${hasStoreAssets ? '✅' : '❌'} Bucket store-assets: ${hasStoreAssets ? 'OK' : 'NÃO EXISTE'}`)
  }

  // 2) Lojas
  console.log('\n2) Carregando lojas...')
  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('id, name, slug, is_active')
    .order('name')

  if (storesError || !stores) {
    console.log('   ❌ Erro ao carregar stores:', storesError?.message)
    process.exit(1)
  }

  console.log(`   ✅ Total de lojas: ${stores.length}`)

  // 3) Contar vínculos store_users por loja
  console.log('\n3) Verificando vínculos store_users (pré-requisito para lojista configurar)...')

  const { data: storeUsers, error: storeUsersError } = await supabase
    .from('store_users')
    .select('store_id, user_id')

  if (storeUsersError) {
    console.log('   ❌ Erro ao carregar store_users:', storeUsersError.message)
    process.exit(1)
  }

  const countByStore = new Map<string, number>()
  for (const su of storeUsers || []) {
    countByStore.set(su.store_id, (countByStore.get(su.store_id) || 0) + 1)
  }

  const report = (stores as StoreRow[]).map(s => {
    const members = countByStore.get(s.id) || 0
    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      is_active: s.is_active,
      members,
      configurable: s.is_active && members > 0,
    }
  })

  const ok = report.filter(r => r.configurable)
  const blocked = report.filter(r => !r.configurable)

  console.log(`\n✅ Configuráveis (ativas + com membros): ${ok.length}`)
  console.log(`❌ Bloqueadas (inativa ou sem membros): ${blocked.length}`)

  if (blocked.length) {
    console.log('\n--- BLOQUEADAS ---')
    for (const s of blocked) {
      const reason = !s.is_active ? 'INATIVA' : 'SEM STORE_USERS'
      console.log(`- ${s.slug} | ${s.name} | members=${s.members} | ${reason}`)
    }

    console.log('\nAções recomendadas:')
    console.log('- Se SEM STORE_USERS: criar vínculo do usuário lojista em store_users para essa store')
    console.log('- Se INATIVA: ativar is_active=true (se for para vender/usar)')
  }

  console.log('\n--- AMOSTRA CONFIGURÁVEIS ---')
  ok.slice(0, 10).forEach(s => {
    console.log(`- ${s.slug} | ${s.name} | members=${s.members}`)
  })

  console.log('\n' + '='.repeat(72))
  console.log('✅ Auditoria concluída')
  console.log('='.repeat(72) + '\n')
}

audit().catch((e) => {
  console.error('Falha na auditoria:', e)
  process.exit(1)
})
