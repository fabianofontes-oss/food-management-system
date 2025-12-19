/**
 * Script de Auditoria de Lojas e Cardápios
 * Executa: npx tsx scripts/audit-stores.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function auditStores() {
  console.log('\n========================================')
  console.log('🔍 AUDITORIA DE LOJAS E CARDÁPIOS')
  console.log('========================================\n')

  // 1. Buscar todas as lojas
  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('id, name, slug, tenant_id, menu_theme, banner_url, logo_url, created_at')
    .order('name')

  if (storesError) {
    console.error('Erro ao buscar lojas:', storesError)
    return
  }

  console.log(`📊 Total de lojas: ${stores?.length || 0}\n`)

  // 2. Para cada loja, contar categorias e produtos
  for (const store of stores || []) {
    const { count: catCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', store.id)

    const { count: prodCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', store.id)

    const theme = store.menu_theme as any
    const layout = theme?.layout || 'default'
    const primaryColor = theme?.colors?.primary || '#ea1d2c'

    console.log('────────────────────────────────────────')
    console.log(`🏪 ${store.name}`)
    console.log(`   Slug: ${store.slug}`)
    console.log(`   ID: ${store.id}`)
    console.log(`   Tenant: ${store.tenant_id || 'N/A'}`)
    console.log(`   📁 Categorias: ${catCount || 0}`)
    console.log(`   📦 Produtos: ${prodCount || 0}`)
    console.log(`   🎨 Layout: ${layout}`)
    console.log(`   🎨 Cor: ${primaryColor}`)
    console.log(`   🖼️ Banner: ${store.banner_url ? '✅' : '❌'}`)
    console.log(`   🖼️ Logo: ${store.logo_url ? '✅' : '❌'}`)
    console.log(`   📅 Criada: ${new Date(store.created_at).toLocaleDateString('pt-BR')}`)
  }

  // 3. Verificar produtos órfãos (sem loja válida)
  console.log('\n========================================')
  console.log('🔎 VERIFICANDO PRODUTOS ÓRFÃOS')
  console.log('========================================\n')

  const storeIds = stores?.map(s => s.id) || []
  
  const { data: orphanProducts, error: orphanError } = await supabase
    .from('products')
    .select('id, name, store_id')
    .not('store_id', 'in', `(${storeIds.join(',')})`)

  if (orphanError) {
    console.log('Erro ao verificar produtos órfãos:', orphanError.message)
  } else if (orphanProducts && orphanProducts.length > 0) {
    console.log(`⚠️ Encontrados ${orphanProducts.length} produtos órfãos:`)
    orphanProducts.forEach(p => {
      console.log(`   - ${p.name} (store_id: ${p.store_id})`)
    })
  } else {
    console.log('✅ Nenhum produto órfão encontrado')
  }

  // 4. Verificar categorias órfãs
  console.log('\n========================================')
  console.log('🔎 VERIFICANDO CATEGORIAS ÓRFÃS')
  console.log('========================================\n')

  const { data: orphanCategories, error: orphanCatError } = await supabase
    .from('categories')
    .select('id, name, store_id')
    .not('store_id', 'in', `(${storeIds.join(',')})`)

  if (orphanCatError) {
    console.log('Erro ao verificar categorias órfãs:', orphanCatError.message)
  } else if (orphanCategories && orphanCategories.length > 0) {
    console.log(`⚠️ Encontradas ${orphanCategories.length} categorias órfãs:`)
    orphanCategories.forEach(c => {
      console.log(`   - ${c.name} (store_id: ${c.store_id})`)
    })
  } else {
    console.log('✅ Nenhuma categoria órfã encontrada')
  }

  // 5. Resumo
  console.log('\n========================================')
  console.log('📋 RESUMO')
  console.log('========================================\n')

  const storesWithProducts = stores?.filter(async s => {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', s.id)
    return (count || 0) > 0
  })

  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  const { count: totalCategories } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })

  console.log(`🏪 Total de lojas: ${stores?.length || 0}`)
  console.log(`📁 Total de categorias: ${totalCategories || 0}`)
  console.log(`📦 Total de produtos: ${totalProducts || 0}`)
  console.log('\n✅ Auditoria concluída!')
}

auditStores().catch(console.error)
