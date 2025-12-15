import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  // 3. Definição das Rotas
  const path = request.nextUrl.pathname
  const isDashboard = path.startsWith('/dashboard') || path.includes('/admin')
  const isAuthPage = path.startsWith('/auth') || path === '/login' || path === '/register'
  
  // REGRA 1: Se tentar acessar Dashboard sem estar logado -> Manda pro Login
  if (isDashboard && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', path) // Para voltar depois de logar
    return NextResponse.redirect(url)
  }

  // REGRA 2: Se já estiver logado e tentar acessar Login -> Manda pro Dashboard
  // (Você precisará ajustar para onde mandar: dashboard geral ou da loja específica)
  if (isAuthPage && user) {
    // Por enquanto, vamos mandar para a raiz, ou você pode definir uma rota default
    const url = request.nextUrl.clone()
    url.pathname = '/' 
    return NextResponse.redirect(url)
  }

  return response
}
