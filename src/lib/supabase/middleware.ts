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

  // 3. Definição das Rotas
  const path = request.nextUrl.pathname
  const isAdminRoute = path.startsWith('/admin')
  const isDashboard = path.startsWith('/dashboard') || path.includes('/dashboard')
  const isAuthPage = path.startsWith('/auth') || path === '/login' || path === '/register'
  
  // REGRA 0 (CRÍTICA): PROTEÇÃO DO SUPER ADMIN
  // TEMPORARIAMENTE RELAXADO PARA DEBUG
  if (isAdminRoute) {
    console.log('[DEBUG] Acesso admin:', path, '| User:', user?.email || 'não logado')
    console.log('[DEBUG] isSuperAdmin:', user?.email ? isSuperAdmin(user.email) : false)
    
    // TEMPORÁRIO: Apenas loga, não bloqueia
    if (!user) {
      console.log('[DEBUG] Usuário não logado tentando acessar admin - redirecionando para login')
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', path)
      return NextResponse.redirect(url)
    }
    
    // TEMPORÁRIO: Não bloqueia não-admins, apenas loga
    if (!isSuperAdmin(user.email)) {
      console.warn(`[DEBUG] Usuário ${user.email} não é Super Admin, mas permitindo acesso temporariamente`)
      // NÃO BLOQUEIA - apenas loga
    }
  }

  // REGRA 1: Se tentar acessar Dashboard sem estar logado -> Manda pro Login
  // EXCEÇÃO: loja-demo é pública para demonstração
  const isLojaDemo = path.startsWith('/loja-demo')
  if (isDashboard && !user && !isLojaDemo) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', path)
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
