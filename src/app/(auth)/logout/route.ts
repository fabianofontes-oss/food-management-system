import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function getBaseUrl(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  return `${protocol}://${host}`
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  await supabase.auth.signOut()
  
  const baseUrl = getBaseUrl(request)
  return NextResponse.redirect(new URL('/login', baseUrl))
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  await supabase.auth.signOut()
  
  const baseUrl = getBaseUrl(request)
  return NextResponse.redirect(new URL('/login', baseUrl))
}
