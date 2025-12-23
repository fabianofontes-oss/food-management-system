import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const SUPER_ADMIN_EMAILS = [
  'fabianobraga@me.com',
  ...(process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS?.split(',').map(e => e.trim()) || [])
]

export async function GET(request: Request) {
  try {
    // Verificar autenticação
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || !SUPER_ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10

    // Usar admin client para buscar lojas (bypassa RLS)
    const { data: stores, error } = await supabaseAdmin
      .from('stores')
      .select(`
        *,
        tenant:tenants(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching stores:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ stores: stores || [] })
  } catch (error) {
    console.error('Error in stores API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
