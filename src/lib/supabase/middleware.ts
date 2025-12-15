import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isSuperAdmin } from '../auth/super-admin'

type CookieToSet = { name: string; value: string; options: CookieOptions }

export async function updateSession(request: NextRequest) {
  // 1. Criar resposta inicial
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 2. Verificar o usuário
  // IMPORTANTE: getUser valida o token no servidor do Supabase (seguro)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ============================================
  // MODO DEBUG: TODOS OS BLOQUEIOS REMOVIDOS
  // ============================================
  // TODO: Reimplementar segurança após estabilização
  
  const path = request.nextUrl.pathname
  console.log('[DEBUG MODE] Acesso livre:', path, '| User:', user?.email || 'anônimo')

  // NENHUM BLOQUEIO - SISTEMA ABERTO PARA DEBUG
  // Apenas atualiza sessão e deixa passar

  return response
}
