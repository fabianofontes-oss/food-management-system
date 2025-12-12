import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPER_ADMIN_EMAILS = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS?.split(',').map(e => e.trim()) || []

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

  const { data: { session } } = await supabase.auth.getSession()
  const pathname = request.nextUrl.pathname

  // Check if route is public
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
