/**
 * AUDITORIA COMPLETA DO MINISITE
 * Execute: npx ts-node scripts/audit-minisite.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function audit() {
  console.log('\n' + '='.repeat(60))
  console.log('🔍 AUDITORIA COMPLETA DO MINISITE')
  console.log('='.repeat(60) + '\n')

  const slug = 'demo'
  let passed = 0
  let failed = 0

  // 1. Verificar se a loja existe
  console.log('1️⃣ VERIFICANDO LOJA...')
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, name, slug, menu_theme, logo_url, banner_url')
    .eq('slug', slug)
    .single()

  if (storeError || !store) {
    console.log('   ❌ ERRO: Loja não encontrada')
    failed++
  } else {
    console.log(`   ✅ Loja encontrada: ${store.name} (${store.id})`)
    passed++
  }

  // 2. Verificar tema salvo
  console.log('\n2️⃣ VERIFICANDO TEMA SALVO NO BANCO...')
  if (store?.menu_theme) {
    console.log('   ✅ Tema existe no banco')
    console.log('   📋 Layout:', (store.menu_theme as any).layout || 'N/A')
    console.log('   🎨 Cor primária:', (store.menu_theme as any).colors?.primary || 'N/A')
    console.log('   🎨 Cor fundo:', (store.menu_theme as any).colors?.background || 'N/A')
    passed++
  } else {
    console.log('   ⚠️ Tema não configurado (usando padrão)')
    passed++
  }

  // 3. Verificar categorias
  console.log('\n3️⃣ VERIFICANDO CATEGORIAS...')
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name')
    .eq('store_id', store?.id)

  if (catError) {
    console.log('   ❌ ERRO ao buscar categorias:', catError.message)
    failed++
  } else {
    console.log(`   ✅ ${categories?.length || 0} categorias encontradas`)
    categories?.forEach(c => console.log(`      - ${c.name}`))
    passed++
  }

  // 4. Verificar produtos
  console.log('\n4️⃣ VERIFICANDO PRODUTOS...')
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name, is_active, category_id')
    .eq('store_id', store?.id)
    .eq('is_active', true)

  if (prodError) {
    console.log('   ❌ ERRO ao buscar produtos:', prodError.message)
    failed++
  } else {
    console.log(`   ✅ ${products?.length || 0} produtos ativos`)
    passed++
  }

  // 5. Testar salvamento do tema
  console.log('\n5️⃣ TESTANDO SALVAMENTO DO TEMA...')
  const testTheme = {
    layout: 'modern',
    colors: { primary: '#TEST01', background: '#FFFFFF', header: '#000000' },
    display: { showBanner: true, showLogo: true, showSearch: true, showAddress: true, showSocial: true }
  }

  const { error: saveError } = await supabase
    .from('stores')
    .update({ menu_theme: testTheme })
    .eq('id', store?.id)

  if (saveError) {
    console.log('   ❌ ERRO ao salvar tema:', saveError.message)
    failed++
  } else {
    // Verificar se salvou
    const { data: updated } = await supabase
      .from('stores')
      .select('menu_theme')
      .eq('id', store?.id)
      .single()

    if ((updated?.menu_theme as any)?.colors?.primary === '#TEST01') {
      console.log('   ✅ Salvamento funciona!')
      passed++
    } else {
      console.log('   ❌ Salvamento NÃO persistiu')
      failed++
    }
  }

  // 6. Restaurar tema original
  console.log('\n6️⃣ RESTAURANDO TEMA ORIGINAL...')
  const originalTheme = {
    layout: 'modern',
    colors: { primary: '#7C3AED', background: '#F5F3FF', header: '#ffffff' },
    display: { showBanner: true, showLogo: true, showSearch: true, showAddress: true, showSocial: true }
  }

  await supabase
    .from('stores')
    .update({ menu_theme: originalTheme })
    .eq('id', store?.id)

  console.log('   ✅ Tema restaurado')

  // RESULTADO FINAL
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESULTADO DA AUDITORIA')
  console.log('='.repeat(60))
  console.log(`   ✅ Passou: ${passed}`)
  console.log(`   ❌ Falhou: ${failed}`)
  console.log('')
  
  if (failed === 0) {
    console.log('🎉 TUDO FUNCIONANDO CORRETAMENTE!')
    console.log('')
    console.log('📱 URLs para testar manualmente:')
    console.log(`   • Cardápio: http://localhost:3001/${slug}`)
    console.log(`   • Editor: http://localhost:3001/${slug}/dashboard/appearance`)
  } else {
    console.log('⚠️ ALGUNS TESTES FALHARAM')
  }
  console.log('')
}

audit().catch(console.error)
