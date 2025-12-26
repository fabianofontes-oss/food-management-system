import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPER_ADMIN_EMAILS = [
  'fabianobraga@me.com',
  ...(process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS?.split(',').map(e => e.trim()) || [])
]

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/landing',
  '/login',
  '/signup',
  '/reset-password',
  '/update-password',
  '/unauthorized'
]

function getSubdomainSlug(host: string | null): string | null {
  if (!host) return null

  const hostname = host.split(':')[0]
  
  // Domínios suportados em produção
  // pediu.food = URLs curtas para lojas (slug.pediu.food)
  // pediufood.com = Site principal (inglês)
  // pediufood.com.br = Site em português
  // entregou.food = Plataforma de motoristas
  const baseDomains = [
    'pediu.food',           // Lojas dos clientes
    'pediufood.com',        // Principal
    'pediufood.com.br',     // PT-BR
    'entregou.food'         // Motoristas
  ]

  // Localhost puro: não tenta resolver subdomínio
  if (hostname === 'localhost' || hostname === '127.0.0.1') return null

  // Dev: permitir demo.localhost
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.slice(0, -'.localhost'.length)
    return sub || null
  }

  // Dev: permitir demo.127.0.0.1.nip.io (ou variações nip.io)
  if (hostname.endsWith('.nip.io')) {
    const parts = hostname.split('.')
    // slug + 127 + 0 + 0 + 1 + nip + io
    if (parts.length >= 7) {
      const sub = parts[0]
      return sub || null
    }
  }

  // Verificar todos os domínios base
  for (const baseDomain of baseDomains) {
    // Ex: slug.pediu.food, slug.pediufood.com.br, slug.pediufood.com
    if (hostname.endsWith(`.${baseDomain}`)) {
      const sub = hostname.slice(0, -1 * (baseDomain.length + 1))
      if (!sub) continue

      // Evitar subdomínios reservados
      const reserved = new Set(['www', 'admin', 'app', 'api', 'driver'])
      if (reserved.has(sub)) continue
      
      return sub
    }
  }

  return null
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const host = request.headers.get('host')
  const hostname = host?.split(':')[0] || ''
  const pathname = request.nextUrl.pathname

  // === ROTEAMENTO ESPECIAL PARA entregou.food ===
  
  // driver.entregou.food → /driver/dashboard
  if (hostname === 'driver.entregou.food') {
    const url = request.nextUrl.clone()
    if (pathname === '/') {
      url.pathname = '/driver/dashboard'
      return NextResponse.rewrite(url)
    }
    // Outras rotas passam direto
  }

  // entregou.food (root) → /para-motoristas
  if (hostname === 'entregou.food' || hostname === 'www.entregou.food') {
    const url = request.nextUrl.clone()
    if (pathname === '/') {
      url.pathname = '/para-motoristas'
      return NextResponse.rewrite(url)
    }
    // Outras rotas passam direto
  }

  // *.entregou.food (wildcard) → /motorista-publico/[slug]
  if (hostname.endsWith('.entregou.food') && hostname !== 'www.entregou.food' && hostname !== 'driver.entregou.food') {
    const driverSlug = hostname.slice(0, -'.entregou.food'.length)
    if (driverSlug && !['www', 'admin', 'app', 'api', 'driver'].includes(driverSlug)) {
      const url = request.nextUrl.clone()
      url.pathname = `/motorista-publico/${driverSlug}${pathname === '/' ? '' : pathname}`
      return NextResponse.rewrite(url)
    }
  }

  // === ROTEAMENTO PADRÃO PARA OUTROS DOMÍNIOS ===

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Suporte a subdomínio: {slug}.pediu.food => /{slug}
  // (Não reescreve /api, /_next, assets e nem /admin)
  const slugFromSubdomain = getSubdomainSlug(host)

  const isExcludedPath =
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/admin') ||
    pathname === '/favicon.ico'

  // Se estiver na raiz do subdomínio (/) ou em rotas públicas do minisite,
  // reescreve para /{slug}/...
  let currentPathname = pathname
  if (slugFromSubdomain && !isExcludedPath) {
    const url = request.nextUrl.clone()
    url.pathname = `/${slugFromSubdomain}${pathname === '/' ? '' : pathname}`
    response = NextResponse.rewrite(url)
    currentPathname = url.pathname
  }

  const { data: { session } } = await supabase.auth.getSession()
  const isPublicRoute = PUBLIC_ROUTES.some(route => currentPathname === route || currentPathname.startsWith(route))
  
  // Check if it's a public store menu route (e.g., /store-slug, /store-slug/cart, /store-slug/checkout)
  const isPublicStoreRoute = pathname.match(/^\/[^\/]+\/(cart|checkout|order)/) || 
                             (pathname.match(/^\/[^\/]+$/) && !pathname.includes('/dashboard'))

  // Allow public routes and public store routes
  if (isPublicRoute || isPublicStoreRoute) {
    return response
  }

  // Protect /admin/* routes
  if (currentPathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if user is super admin
    const userEmail = session.user.email || ''
    if (!SUPER_ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    return response
  }

  // Protect /:slug/dashboard/* routes
  const dashboardMatch = currentPathname.match(/^\/([^\/]+)\/dashboard/)
  if (dashboardMatch) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const slug = dashboardMatch[1]

    // Get store by slug
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .single()

    if (storeError || !store) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Check if user has access to this store
    const { data: storeUser, error: accessError } = await supabase
      .from('store_users')
      .select('id')
      .eq('store_id', store.id)
      .eq('user_id', session.user.id)
      .single()

    if (accessError || !storeUser) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    return response
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
