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

  const path = request.nextUrl.pathname

  // Rotas públicas que não requerem autenticação
  const publicRoutes = ['/', '/login', '/signup', '/reset-password', '/update-password', '/unauthorized', '/landing']
  const isPublicRoute = publicRoutes.some(route => path === route)
  
  // Rotas de cardápio público (/{slug}, /{slug}/cart, /{slug}/checkout, /{slug}/order)
  const isPublicStoreRoute = path.match(/^\/[^\/]+\/(cart|checkout|order)/) || 
                             (path.match(/^\/[^\/]+$/) && !path.includes('/dashboard'))

  // Permitir rotas públicas
  if (isPublicRoute || isPublicStoreRoute) {
    return response
  }

  // Rotas do dashboard requerem autenticação
  const dashboardMatch = path.match(/^\/([^\/]+)\/dashboard/)
  if (dashboardMatch) {
    const slug = dashboardMatch[1]

    // Buscar store pelo slug
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, settings')
      .eq('slug', slug)
      .single()

    if (storeError || !store) {
      console.log(`[Middleware] Store not found: ${slug}`)
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Modo DEMO: permite acesso sem login se a loja tem isDemo: true
    const settings = store.settings as any
    if (settings?.isDemo === true) {
      console.log(`[Middleware] DEMO MODE: allowing access to ${slug}`)
      return response
    }

    // Autenticação normal para lojas não-demo
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verificar se usuário tem acesso à loja
    const { data: storeUser, error: accessError } = await supabase
      .from('store_users')
      .select('id')
      .eq('store_id', store.id)
      .eq('user_id', user.id)
      .single()

    if (accessError || !storeUser) {
      console.log(`[Middleware] ACCESS DENIED: user=${user.id} store=${store.id}`)
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return response
}
