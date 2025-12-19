/**
 * Rate Limiting simples usando Map em memória
 * Para produção, usar Upstash Redis (ver PLANO-DE-CORRECAO.md)
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Map em memória (funciona para single instance)
// Para multi-instance, usar Redis
const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpar entradas expiradas a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const rateLimitConfigs = {
  // API geral: 60 requests por minuto
  api: { maxRequests: 60, windowMs: 60 * 1000 },
  
  // Signup: 3 tentativas por hora
  signup: { maxRequests: 3, windowMs: 60 * 60 * 1000 },
  
  // Draft store: 10 por hora
  draftStore: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  
  // Checkout: 20 por hora
  checkout: { maxRequests: 20, windowMs: 60 * 60 * 1000 },
};

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  
  let entry = rateLimitStore.get(key);
  
  // Se não existe ou expirou, criar nova
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
    
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt: entry.resetAt,
    };
  }
  
  // Incrementar contador
  entry.count++;
  
  // Verificar se excedeu limite
  if (entry.count > config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }
  
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

export function getClientIdentifier(req: Request): string {
  // Tentar pegar IP real
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}
