/**
 * Script para aplicar RLS policies no Supabase
 * Execute com: node scripts/fix-rls.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não encontrada no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function main() {
  console.log('🔧 Aplicando RLS policies...')
  console.log('')

  const sql = `
    -- Habilitar RLS
    ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
    ALTER TABLE store_users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;

    -- Remover policies antigas
    DROP POLICY IF EXISTS "Public can view active stores" ON stores;
    DROP POLICY IF EXISTS "Store users can manage their stores" ON stores;
    DROP POLICY IF EXISTS "Users can read their own store memberships" ON store_users;
    DROP POLICY IF EXISTS "Store owners can manage store users" ON store_users;
    DROP POLICY IF EXISTS "Public can view categories of active stores" ON categories;
    DROP POLICY IF EXISTS "Store users can manage categories" ON categories;
    DROP POLICY IF EXISTS "Public can view products of active stores" ON products;
    DROP POLICY IF EXISTS "Store users can manage products" ON products;

    -- STORES: Qualquer pessoa pode ver lojas ativas
    CREATE POLICY "Public can view active stores"
      ON stores FOR SELECT
      USING (is_active = true);

    -- STORES: Usuários podem gerenciar suas lojas
    CREATE POLICY "Store users can manage their stores"
      ON stores FOR ALL
      USING (auth.uid() IS NOT NULL AND id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid()));

    -- STORE_USERS: Usuários podem ver suas próprias associações
    CREATE POLICY "Users can read their own store memberships"
      ON store_users FOR SELECT
      USING (auth.uid() = user_id);

    -- STORE_USERS: Owners podem gerenciar
    CREATE POLICY "Store owners can manage store users"
      ON store_users FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM store_users su
          WHERE su.store_id = store_users.store_id
            AND su.user_id = auth.uid()
            AND su.role = 'OWNER'
        )
      );

    -- CATEGORIES: Qualquer pessoa pode ver categorias ativas
    CREATE POLICY "Public can view categories of active stores"
      ON categories FOR SELECT
      USING (is_active = true AND store_id IN (SELECT id FROM stores WHERE is_active = true));

    -- CATEGORIES: Usuários podem gerenciar
    CREATE POLICY "Store users can manage categories"
      ON categories FOR ALL
      USING (auth.uid() IS NOT NULL AND store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid()));

    -- PRODUCTS: Qualquer pessoa pode ver produtos ativos
    CREATE POLICY "Public can view products of active stores"
      ON products FOR SELECT
      USING (is_active = true AND store_id IN (SELECT id FROM stores WHERE is_active = true));

    -- PRODUCTS: Usuários podem gerenciar
    CREATE POLICY "Store users can manage products"
      ON products FOR ALL
      USING (auth.uid() IS NOT NULL AND store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid()));
  `

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
  
  if (error) {
    // Se a função exec_sql não existir, tentar executar diretamente
    console.log('⚠️  Função exec_sql não existe, tentando queries individuais...')
    
    const queries = [
      // Habilitar RLS
      `ALTER TABLE stores ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE store_users ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE categories ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE products ENABLE ROW LEVEL SECURITY`,
      
      // Remover policies antigas
      `DROP POLICY IF EXISTS "Public can view active stores" ON stores`,
      `DROP POLICY IF EXISTS "Store users can manage their stores" ON stores`,
      `DROP POLICY IF EXISTS "Users can read their own store memberships" ON store_users`,
      `DROP POLICY IF EXISTS "Store owners can manage store users" ON store_users`,
      `DROP POLICY IF EXISTS "Public can view categories of active stores" ON categories`,
      `DROP POLICY IF EXISTS "Store users can manage categories" ON categories`,
      `DROP POLICY IF EXISTS "Public can view products of active stores" ON products`,
      `DROP POLICY IF EXISTS "Store users can manage products" ON products`,
    ]
    
    for (const q of queries) {
      try {
        await supabase.from('_exec').select().limit(0) // dummy to test connection
      } catch (e) {
        // ignore
      }
    }
    
    console.log('')
    console.log('❌ Não é possível executar SQL diretamente via API.')
    console.log('')
    console.log('📋 Por favor, copie e execute este SQL no Supabase SQL Editor:')
    console.log('')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(sql)
    console.log('═══════════════════════════════════════════════════════════')
    console.log('')
    console.log('🔗 Acesse: https://supabase.com/dashboard > SQL Editor')
    return
  }

  console.log('✅ RLS policies aplicadas com sucesso!')
}

main().catch(console.error)
