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

    // Usar admin client para buscar tenants (bypassa RLS)
    const { data: tenants, error } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tenants:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tenants: tenants || [] })
  } catch (error) {
    console.error('Error in tenants API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
