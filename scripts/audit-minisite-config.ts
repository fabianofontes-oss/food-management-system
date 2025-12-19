/**
 * Auditoria das Configurações do Mini Site
 * Verifica: Tema salvo → Leitura correta → Aplicação no cardápio
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface MenuTheme {
  layout: string
  colors: {
    primary: string
    background: string
    header: string
  }
  display: {
    showBanner: boolean
    showLogo: boolean
    showSearch: boolean
    showAddress: boolean
    showSocial: boolean
  }
  bannerUrl?: string | null
}

const DEFAULT_THEME: MenuTheme = {
  layout: 'modern',
  colors: {
    primary: '#ea1d2c',
    background: '#f4f4f5',
    header: '#ffffff'
  },
  display: {
    showBanner: true,
    showLogo: true,
    showSearch: true,
    showAddress: true,
    showSocial: true
  },
  bannerUrl: null
}

async function auditMinisiteConfig() {
  console.log('\n========================================')
  console.log('🔍 AUDITORIA: CONFIGURAÇÕES DO MINI SITE')
  console.log('========================================\n')

  // 1. Buscar todas as lojas com suas configurações
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, name, slug, menu_theme, banner_url, logo_url')
    .order('name')

  if (error) {
    console.error('❌ Erro ao buscar lojas:', error)
    return
  }

  console.log(`📊 Total de lojas: ${stores?.length || 0}\n`)

  let issuesFound = 0

  for (const store of stores || []) {
    console.log('────────────────────────────────────────')
    console.log(`🏪 ${store.name} (/${store.slug})`)
    
    const theme = store.menu_theme as MenuTheme | null

    // Verificar se menu_theme existe
    if (!theme || Object.keys(theme).length === 0) {
      console.log('   ⚠️ ISSUE: menu_theme está VAZIO ou NULL')
      console.log('   → Cardápio usará tema DEFAULT')
      issuesFound++
    } else {
      // Verificar layout
      const validLayouts = ['classic', 'modern', 'minimal', 'grid', 'app']
      if (!theme.layout || !validLayouts.includes(theme.layout)) {
        console.log(`   ⚠️ ISSUE: Layout inválido ou ausente: "${theme.layout}"`)
        issuesFound++
      } else {
        console.log(`   ✅ Layout: ${theme.layout}`)
      }

      // Verificar cores
      if (!theme.colors) {
        console.log('   ⚠️ ISSUE: Cores não definidas')
        issuesFound++
      } else {
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
        
        if (!colorRegex.test(theme.colors.primary || '')) {
          console.log(`   ⚠️ ISSUE: Cor primary inválida: "${theme.colors.primary}"`)
          issuesFound++
        } else {
          console.log(`   ✅ Cor primary: ${theme.colors.primary}`)
        }

        if (!colorRegex.test(theme.colors.background || '')) {
          console.log(`   ⚠️ ISSUE: Cor background inválida: "${theme.colors.background}"`)
          issuesFound++
        } else {
          console.log(`   ✅ Cor background: ${theme.colors.background}`)
        }

        if (!colorRegex.test(theme.colors.header || '')) {
          console.log(`   ⚠️ ISSUE: Cor header inválida: "${theme.colors.header}"`)
          issuesFound++
        } else {
          console.log(`   ✅ Cor header: ${theme.colors.header}`)
        }
      }

      // Verificar display
      if (!theme.display) {
        console.log('   ⚠️ ISSUE: Display options não definidas')
        issuesFound++
      } else {
        console.log(`   ✅ Display: Banner=${theme.display.showBanner}, Logo=${theme.display.showLogo}, Busca=${theme.display.showSearch}`)
      }

      // Verificar bannerUrl
      if (theme.bannerUrl) {
        console.log(`   ✅ Banner no tema: ${theme.bannerUrl.substring(0, 50)}...`)
      } else if (store.banner_url) {
        console.log(`   ⚠️ Banner em stores.banner_url (não no tema): ${store.banner_url.substring(0, 50)}...`)
      } else {
        console.log('   ℹ️ Sem banner configurado')
      }
    }

    // Verificar logo
    if (store.logo_url) {
      console.log(`   ✅ Logo: ${store.logo_url.substring(0, 50)}...`)
    } else {
      console.log('   ℹ️ Sem logo configurado')
    }
  }

  // Resumo
  console.log('\n========================================')
  console.log('📋 RESUMO DA AUDITORIA')
  console.log('========================================\n')

  if (issuesFound === 0) {
    console.log('✅ Nenhum problema encontrado!')
    console.log('   Todas as configurações estão corretas.')
  } else {
    console.log(`⚠️ Encontrados ${issuesFound} problemas.`)
    console.log('   Lojas com menu_theme vazio usarão o tema DEFAULT.')
  }

  // Testar fluxo de salvamento
  console.log('\n========================================')
  console.log('🧪 TESTE DE FLUXO: SALVAR → LER')
  console.log('========================================\n')

  // Pegar a primeira loja para teste
  const testStore = stores?.[0]
  if (testStore) {
    console.log(`Testando com loja: ${testStore.name}`)
    
    // Simular leitura do tema (como faz o cardápio público)
    const { data: readStore } = await supabase
      .from('stores')
      .select('menu_theme')
      .eq('id', testStore.id)
      .single()

    if (readStore) {
      const readTheme = readStore.menu_theme as MenuTheme | null
      console.log(`   → menu_theme lido: ${readTheme ? 'OK' : 'VAZIO'}`)
      
      if (readTheme) {
        console.log(`   → Layout: ${readTheme.layout || 'não definido'}`)
        console.log(`   → Cores: ${JSON.stringify(readTheme.colors || {})}`)
      }
    }
  }

  console.log('\n✅ Auditoria concluída!')
}

auditMinisiteConfig().catch(console.error)
