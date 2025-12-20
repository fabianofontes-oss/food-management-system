import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Slugs reservados que não podem ser usados como subdomínio de loja
const RESERVED_SLUGS = new Set([
  'app', 'admin', 'api', 'www', 'meu', 'conta', 'login', 'signin', 'signup', 'register',
  'checkout', 'cart', 'pagamento', 'payment', 'billing', 'static', 'assets', 'cdn',
  'docs', 'blog', 'suporte', 'help', 'robots', 'sitemap', 'status', 'store', 'shop', 'loja',
  'driver', 'entregou', 'pensou', 'test', 'demo', 'staging', 'dev', 'preview'
])

function stripPort(host: string): string {
  return host.split(':')[0].toLowerCase()
}

function isSubdomain(host: string, root: string): boolean {
  const h = stripPort(host)
  return h !== root && h.endsWith('.' + root)
}

function getSubdomain(host: string, root: string): string | null {
  const h = stripPort(host)
  const rootParts = root.split('.')
  const hostParts = h.split('.')
  if (hostParts.length <= rootParts.length) return null
  return hostParts.slice(0, hostParts.length - rootParts.length).join('.')
}

export async function middleware(request: NextRequest) {
  // Endpoint de ping público (não bloquear)
  if (request.nextUrl.pathname.startsWith('/api/ping')) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  const host = stripPort(request.headers.get('host') || '')

  // =====================================================
  // ROTEAMENTO POR HOST
  // =====================================================

  // admin.pediu.food → /admin
  if (host === 'admin.pediu.food') {
    if (url.pathname === '/') {
      url.pathname = '/admin'
      return NextResponse.rewrite(url)
    }
    if (!url.pathname.startsWith('/admin')) {
      url.pathname = '/admin' + url.pathname
      return NextResponse.rewrite(url)
    }
    return await updateSession(request)
  }

  // app.pediu.food → passthrough (dashboard principal)
  if (host === 'app.pediu.food') {
    return await updateSession(request)
  }

  // *.pediu.food → /s/{slug} (cardápio público da loja)
  if (isSubdomain(host, 'pediu.food')) {
    const sub = getSubdomain(host, 'pediu.food')
    if (sub && !RESERVED_SLUGS.has(sub)) {
      url.pathname = `/s/${sub}${url.pathname}`
      return NextResponse.rewrite(url)
    }
    return await updateSession(request)
  }

  // driver.entregou.food → /driver
  if (host === 'driver.entregou.food') {
    if (url.pathname === '/') {
      url.pathname = '/driver/dashboard'
      return NextResponse.rewrite(url)
    }
    if (!url.pathname.startsWith('/driver')) {
      url.pathname = '/driver' + url.pathname
      return NextResponse.rewrite(url)
    }
    return await updateSession(request)
  }

  // entregou.food → passthrough
  if (host === 'entregou.food') {
    return await updateSession(request)
  }

  // pensou.food → passthrough (futuro: /discover)
  if (host === 'pensou.food') {
    // Opcional: rewrite para /discover quando existir
    // if (url.pathname === '/') {
    //   url.pathname = '/discover'
    //   return NextResponse.rewrite(url)
    // }
    return await updateSession(request)
  }

  // pediu.food (root) → passthrough
  if (host === 'pediu.food') {
    return await updateSession(request)
  }

  // =====================================================
  // COMPORTAMENTO PADRÃO (localhost, outros hosts)
  // =====================================================

  // Redirect /landing to / (canonical URL)
  if (request.nextUrl.pathname === '/landing') {
    return NextResponse.redirect(new URL('/', request.url), 308)
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
