import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Slugs reservados que não podem ser usados como subdomínio de loja
const RESERVED_SLUGS = new Set([
  'app', 'admin', 'api', 'www', 'meu', 'conta', 'login', 'signin', 'signup', 'register',
  'checkout', 'cart', 'pagamento', 'payment', 'billing', 'static', 'assets', 'cdn',
  'docs', 'blog', 'suporte', 'help', 'robots', 'sitemap', 'status', 'store', 'shop', 'loja',
  'driver', 'entregou', 'pensou', 'test', 'demo', 'staging', 'dev', 'preview', 'marketplace'
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
  const pathname = request.nextUrl.pathname

  // =====================================================
  // REDIRECTS PERMANENTES (308)
  // =====================================================

  // pediufood.com.br → pediufood.com (domínio canônico)
  if (host === 'pediufood.com.br' || host === 'www.pediufood.com.br') {
    return NextResponse.redirect(
      new URL(pathname + request.nextUrl.search, 'https://pediufood.com'),
      308
    )
  }

  // pensou.food → marketplace
  if (host === 'pensou.food' || host === 'www.pensou.food') {
    return NextResponse.redirect(
      new URL('/marketplace', 'https://pediufood.com'),
      308
    )
  }

  // pediu.food (root) → pediufood.com
  if (host === 'pediu.food' || host === 'www.pediu.food') {
    // Exceção: rotas de app/admin continuam funcionando
    if (pathname.startsWith('/admin') || pathname.startsWith('/api') || pathname.startsWith('/login') || pathname.startsWith('/signup')) {
      return await updateSession(request)
    }
    return NextResponse.redirect(
      new URL(pathname + request.nextUrl.search, 'https://pediufood.com'),
      308
    )
  }

  // =====================================================
  // ROTEAMENTO POR HOST
  // =====================================================

  // pediufood.com → Landing/Marketing/Blog
  if (host === 'pediufood.com' || host === 'www.pediufood.com') {
    // Rotas de marketing:
    // /, /criar-loja, /blog, /marketplace, /para-motoristas, /para-garcons
    // /[slug] → cardápio público (URL alternativa)
    return await updateSession(request)
  }

  // admin.pediu.food → Super Admin
  if (host === 'admin.pediu.food') {
    if (pathname === '/') {
      url.pathname = '/admin'
      return NextResponse.rewrite(url)
    }
    if (!pathname.startsWith('/admin')) {
      url.pathname = '/admin' + pathname
      return NextResponse.rewrite(url)
    }
    return await updateSession(request)
  }

  // app.pediu.food → Dashboard multi-loja
  if (host === 'app.pediu.food') {
    return await updateSession(request)
  }

  // *.pediu.food → Cardápio white-label (wildcard)
  if (isSubdomain(host, 'pediu.food')) {
    const subdomain = getSubdomain(host, 'pediu.food')
    if (subdomain && !RESERVED_SLUGS.has(subdomain)) {
      // Rewrite: pizzaria.pediu.food → /s/pizzaria
      url.pathname = `/s/${subdomain}${pathname}`
      return NextResponse.rewrite(url)
    }
    return await updateSession(request)
  }

  // *.entregou.food → Perfil público do motorista (wildcard)
  if (isSubdomain(host, 'entregou.food')) {
    const driverSlug = getSubdomain(host, 'entregou.food')
    if (driverSlug && !RESERVED_SLUGS.has(driverSlug)) {
      // Rewrite: joao.entregou.food → /motorista-publico/joao
      url.pathname = `/motorista-publico/${driverSlug}${pathname}`
      return NextResponse.rewrite(url)
    }
    return await updateSession(request)
  }

  // driver.entregou.food → Dashboard global de motoristas
  if (host === 'driver.entregou.food') {
    if (pathname === '/') {
      url.pathname = '/driver/dashboard'
      return NextResponse.rewrite(url)
    }
    if (!pathname.startsWith('/driver')) {
      url.pathname = '/driver' + pathname
      return NextResponse.rewrite(url)
    }
    return await updateSession(request)
  }

  // entregou.food (root) → Landing para motoristas
  if (host === 'entregou.food' || host === 'www.entregou.food') {
    // Redireciona / para /para-motoristas
    if (pathname === '/') {
      url.pathname = '/para-motoristas'
      return NextResponse.rewrite(url)
    }
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
