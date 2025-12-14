/**
 * Script para criar usuário e associar à loja
 * Execute com: node scripts/setup-user.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas!')
  console.log('')
  console.log('Você precisa adicionar SUPABASE_SERVICE_ROLE_KEY no arquivo .env.local')
  console.log('Encontre essa chave em: Supabase Dashboard > Settings > API > service_role key')
  console.log('')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  const email = 'fabianobraga@me.com'
  const password = '123456'
  const name = 'Fabiano Braga'
  const storeSlug = 'acai-sabor-real'

  console.log('🚀 Iniciando setup do usuário...')
  console.log('')

  // 1. Verificar se usuário já existe
  console.log('1️⃣ Verificando se usuário existe...')
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(u => u.email === email)

  let userId

  if (existingUser) {
    console.log(`   ✅ Usuário já existe: ${existingUser.id}`)
    userId = existingUser.id
  } else {
    // 2. Criar usuário no auth.users
    console.log('2️⃣ Criando usuário no Supabase Auth...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    })

    if (authError) {
      console.error('   ❌ Erro ao criar usuário:', authError.message)
      process.exit(1)
    }

    userId = authData.user.id
    console.log(`   ✅ Usuário criado: ${userId}`)
  }

  // 3. Inserir na tabela users
  console.log('3️⃣ Inserindo na tabela users...')
  const { error: userError } = await supabase
    .from('users')
    .upsert({ id: userId, name, email }, { onConflict: 'id' })

  if (userError) {
    console.error('   ❌ Erro ao inserir em users:', userError.message)
  } else {
    console.log('   ✅ Usuário inserido na tabela users')
  }

  // 4. Buscar store_id
  console.log('4️⃣ Buscando loja...')
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, name')
    .eq('slug', storeSlug)
    .single()

  if (storeError || !store) {
    console.error('   ❌ Loja não encontrada:', storeSlug)
    process.exit(1)
  }

  console.log(`   ✅ Loja encontrada: ${store.name} (${store.id})`)

  // 5. Associar usuário à loja
  console.log('5️⃣ Associando usuário à loja como OWNER...')
  const { error: storeUserError } = await supabase
    .from('store_users')
    .upsert(
      { store_id: store.id, user_id: userId, role: 'OWNER' },
      { onConflict: 'store_id,user_id' }
    )

  if (storeUserError) {
    console.error('   ❌ Erro ao associar:', storeUserError.message)
  } else {
    console.log('   ✅ Usuário associado à loja como OWNER')
  }

  console.log('')
  console.log('═══════════════════════════════════════════')
  console.log('✅ SETUP CONCLUÍDO!')
  console.log('═══════════════════════════════════════════')
  console.log('')
  console.log(`📧 Email: ${email}`)
  console.log(`🔑 Senha: ${password}`)
  console.log(`🏪 Loja: ${store.name}`)
  console.log('')
  console.log('Agora faça login em:')
  console.log('https://food-management-system-ochre.vercel.app/login')
  console.log('')
}

main().catch(console.error)
