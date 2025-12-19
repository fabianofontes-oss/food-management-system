/**
 * Verifica se o bucket store-assets existe e tem as permissões corretas
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkStorage() {
  console.log('\n========================================')
  console.log('🔍 VERIFICANDO SUPABASE STORAGE')
  console.log('========================================\n')

  // 1. Listar buckets
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

  if (bucketsError) {
    console.error('❌ Erro ao listar buckets:', bucketsError.message)
    return
  }

  console.log('📦 Buckets encontrados:')
  buckets?.forEach(b => {
    console.log(`   - ${b.name} (public: ${b.public})`)
  })

  // 2. Verificar se store-assets existe
  const storeAssets = buckets?.find(b => b.name === 'store-assets')
  
  if (!storeAssets) {
    console.log('\n⚠️ Bucket "store-assets" NÃO existe!')
    console.log('   → Criando bucket...')
    
    const { error: createError } = await supabase.storage.createBucket('store-assets', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    })

    if (createError) {
      console.error('❌ Erro ao criar bucket:', createError.message)
    } else {
      console.log('✅ Bucket "store-assets" criado com sucesso!')
    }
  } else {
    console.log(`\n✅ Bucket "store-assets" existe (public: ${storeAssets.public})`)
  }

  // 3. Verificar bucket product-images
  const productImages = buckets?.find(b => b.name === 'product-images')
  
  if (!productImages) {
    console.log('\n⚠️ Bucket "product-images" NÃO existe!')
    console.log('   → Criando bucket...')
    
    const { error: createError } = await supabase.storage.createBucket('product-images', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    })

    if (createError) {
      console.error('❌ Erro ao criar bucket:', createError.message)
    } else {
      console.log('✅ Bucket "product-images" criado com sucesso!')
    }
  } else {
    console.log(`✅ Bucket "product-images" existe (public: ${productImages.public})`)
  }

  console.log('\n✅ Verificação concluída!')
}

checkStorage().catch(console.error)
