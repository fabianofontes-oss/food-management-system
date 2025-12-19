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
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'pediu.food'

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

  // Ex: slug.pediu.food
  if (hostname.endsWith(`.${baseDomain}`)) {
    const sub = hostname.slice(0, -1 * (baseDomain.length + 1))
    if (!sub) return null

    // Evitar subdomínios reservados
    const reserved = new Set(['www', 'admin', 'app'])
    if (reserved.has(sub)) return null
    return sub
  }

  return null
}

export async function middleware(request: NextRequest) {
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
  const host = request.headers.get('host')
  const slugFromSubdomain = getSubdomainSlug(host)

  let pathname = request.nextUrl.pathname
  const isExcludedPath =
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/admin') ||
    pathname === '/favicon.ico'

  // Se estiver na raiz do subdomínio (/) ou em rotas públicas do minisite,
  // reescreve para /{slug}/...
  if (slugFromSubdomain && !isExcludedPath) {
    const url = request.nextUrl.clone()
    url.pathname = `/${slugFromSubdomain}${pathname === '/' ? '' : pathname}`
    response = NextResponse.rewrite(url)
    pathname = url.pathname
  }

  const { data: { session } } = await supabase.auth.getSession()
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route))
  
  // Check if it's a public store menu route (e.g., /store-slug, /store-slug/cart, /store-slug/checkout)
  const isPublicStoreRoute = pathname.match(/^\/[^\/]+\/(cart|checkout|order)/) || 
                             (pathname.match(/^\/[^\/]+$/) && !pathname.includes('/dashboard'))

  // Allow public routes and public store routes
  if (isPublicRoute || isPublicStoreRoute) {
    return response
  }

  // Protect /admin/* routes
  if (pathname.startsWith('/admin')) {
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
  const dashboardMatch = pathname.match(/^\/([^\/]+)\/dashboard/)
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
