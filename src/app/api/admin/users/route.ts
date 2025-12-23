import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const SUPER_ADMIN_EMAILS = [
  'fabianobraga@me.com',
  ...(process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS?.split(',').map(e => e.trim()) || [])
]

export async function GET() {
  try {
    // Verificar autenticação
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || !SUPER_ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar usuários do Supabase Auth (admin)
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error('Error fetching auth users:', authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Buscar associações store_users
    const { data: storeUsers } = await supabaseAdmin
      .from('store_users')
      .select(`
        *,
        store:stores(id, name, slug)
      `)

    // Mapear usuários com suas lojas
    const usersWithStores = authUsers.users.map((authUser: any) => {
      const userStores = storeUsers?.filter((su: any) => su.user_id === authUser.id) || []
      return {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        stores: userStores.map((su: any) => su.store)
      }
    })

    return NextResponse.json({ users: usersWithStores })
  } catch (error) {
    console.error('Error in users API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
