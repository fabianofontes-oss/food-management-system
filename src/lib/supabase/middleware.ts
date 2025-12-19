import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isSuperAdmin } from '../auth/super-admin'
import { enforceBillingInMiddleware } from '../billing/enforcement'

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
  
  // Rotas de billing (evitar loop de redirect)
  const isBillingRoute = path.startsWith('/billing/')
  
  // Rotas de cardápio público (/{slug}, /{slug}/cart, /{slug}/checkout, /{slug}/order)
  const isPublicStoreRoute = path.match(/^\/[^\/]+\/(cart|checkout|order)/) || 
                             (path.match(/^\/[^\/]+$/) && !path.includes('/dashboard'))

  // Permitir rotas públicas e rotas de billing (evitar loop)
  if (isPublicRoute || isPublicStoreRoute || isBillingRoute) {
    return response
  }

  // Rotas do dashboard requerem autenticação
  const dashboardMatch = path.match(/^\/([^\/]+)\/dashboard/)
  if (dashboardMatch) {
    const slug = dashboardMatch[1]

    // DEMO MODE: slug "demo" sempre liberado sem autenticação
    if (slug === 'demo') {
      console.log(`[Middleware] DEMO MODE: allowing public access to /demo/dashboard`)
      return response
    }

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

    // Modo DEMO via settings: permite acesso sem login se a loja tem isDemo: true
    const settings = store.settings as any
    if (settings?.isDemo === true) {
      console.log(`[Middleware] DEMO MODE (settings): allowing access to ${slug}`)
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

    // ETAPA 5 P0: Billing Enforcement (tempo real)
    // Buscar tenant_id da store
    const { data: storeWithTenant } = await supabase
      .from('stores')
      .select('tenant_id')
      .eq('id', store.id)
      .single()

    if (storeWithTenant?.tenant_id) {
      const billingCheck = await enforceBillingInMiddleware(storeWithTenant.tenant_id, request)
      
      // BLOCK: redirecionar para página de billing
      if (billingCheck.mode === 'BLOCK' && billingCheck.redirectTo) {
        const reason = billingCheck.decision?.mode === 'BLOCK' ? billingCheck.decision.reason : 'UNKNOWN'
        console.log(`[Middleware] BILLING BLOCKED: tenant=${storeWithTenant.tenant_id} reason=${reason}`)
        return NextResponse.redirect(new URL(billingCheck.redirectTo, request.url))
      }

      // READ_ONLY: permitir acesso mas marcar header para UI mostrar banner
      if (billingCheck.mode === 'READ_ONLY') {
        console.warn(`[Middleware] BILLING READ_ONLY: tenant=${storeWithTenant.tenant_id} (grace period: ${billingCheck.graceDaysRemaining} dias)`)
        response.headers.set('x-billing-mode', 'read-only')
        response.headers.set('x-billing-grace-days', String(billingCheck.graceDaysRemaining || 0))
      }
    }
  }

  return response
}
