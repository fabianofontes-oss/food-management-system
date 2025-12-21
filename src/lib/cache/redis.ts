/**
 * Redis Cache Client
 * 
 * Sistema de cache para otimizar performance de queries frequentes.
 * Em desenvolvimento usa memória, em produção usa Upstash Redis.
 */

// Cache em memória para desenvolvimento
class MemoryCache {
  private cache: Map<string, { value: any; expires: number }> = new Map()

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.value as T
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    this.cache.set(key, {
      value,
      expires: Date.now() + (ttlSeconds * 1000)
    })
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'))
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  async flush(): Promise<void> {
    this.cache.clear()
  }
}

// Cliente Redis (Upstash para produção)
let redisClient: MemoryCache | any = null

function getRedisClient() {
  if (redisClient) return redisClient

  // Em produção, usar Upstash Redis
  if (process.env.UPSTASH_REDIS_URL && process.env.NODE_ENV === 'production') {
    try {
      // Lazy import do ioredis apenas em produção
      const Redis = require('ioredis')
      redisClient = new Redis(process.env.UPSTASH_REDIS_URL)
      console.log('✅ Redis conectado (Upstash)')
    } catch (error) {
      console.warn('⚠️ Erro ao conectar Redis, usando cache em memória:', error)
      redisClient = new MemoryCache()
    }
  } else {
    // Desenvolvimento: cache em memória
    redisClient = new MemoryCache()
    console.log('✅ Cache em memória ativado (desenvolvimento)')
  }

  return redisClient
}

/**
 * Cache helper com tipagem
 */
export const cache = {
  /**
   * Busca valor do cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = getRedisClient()
      const value = await client.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  },

  /**
   * Salva valor no cache
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      const client = getRedisClient()
      await client.set(key, JSON.stringify(value), ttlSeconds)
    } catch (error) {
      console.error('Cache set error:', error)
    }
  },

  /**
   * Remove valor do cache
   */
  async del(key: string): Promise<void> {
    try {
      const client = getRedisClient()
      await client.del(key)
    } catch (error) {
      console.error('Cache del error:', error)
    }
  },

  /**
   * Remove múltiplas chaves por padrão
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const client = getRedisClient()
      await client.delPattern(pattern)
    } catch (error) {
      console.error('Cache delPattern error:', error)
    }
  },

  /**
   * Limpa todo o cache
   */
  async flush(): Promise<void> {
    try {
      const client = getRedisClient()
      await client.flush()
    } catch (error) {
      console.error('Cache flush error:', error)
    }
  },

  /**
   * Wrapper para cache-aside pattern
   * 
   * @example
   * const products = await cache.wrap(
   *   `products:${storeId}`,
   *   () => fetchProductsFromDB(storeId),
   *   300 // 5 minutos
   * )
   */
  async wrap<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    // Tentar buscar do cache
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Cache miss: buscar do banco
    const value = await fetchFn()
    
    // Salvar no cache
    await this.set(key, value, ttlSeconds)
    
    return value
  }
}

/**
 * Chaves de cache padronizadas
 */
export const cacheKeys = {
  // Configurações de loja (TTL: 5min)
  storeSettings: (storeId: string) => `store:${storeId}:settings`,
  
  // Menu público (TTL: 15min)
  publicMenu: (slug: string) => `menu:${slug}:public`,
  
  // Categorias (TTL: 30min)
  categories: (storeId: string) => `categories:${storeId}`,
  
  // Produtos (TTL: 15min)
  products: (storeId: string) => `products:${storeId}`,
  
  // Dados do tenant (TTL: 1h)
  tenant: (tenantId: string) => `tenant:${tenantId}`,
  
  // Subscription (TTL: 5min)
  subscription: (tenantId: string) => `subscription:${tenantId}`,
  
  // Padrões para invalidação
  patterns: {
    store: (storeId: string) => `*:${storeId}:*`,
    menu: (slug: string) => `menu:${slug}:*`,
    tenant: (tenantId: string) => `tenant:${tenantId}:*`,
  }
}

/**
 * Helpers para invalidação de cache
 */
export const cacheInvalidation = {
  /**
   * Invalida cache de uma loja
   */
  async invalidateStore(storeId: string): Promise<void> {
    await cache.delPattern(cacheKeys.patterns.store(storeId))
  },

  /**
   * Invalida cache do menu público
   */
  async invalidateMenu(slug: string): Promise<void> {
    await cache.delPattern(cacheKeys.patterns.menu(slug))
  },

  /**
   * Invalida cache de um tenant
   */
  async invalidateTenant(tenantId: string): Promise<void> {
    await cache.delPattern(cacheKeys.patterns.tenant(tenantId))
  },

  /**
   * Invalida cache quando produtos mudam
   */
  async onProductsChange(storeId: string, slug: string): Promise<void> {
    await Promise.all([
      cache.del(cacheKeys.products(storeId)),
      cache.del(cacheKeys.publicMenu(slug)),
    ])
  },

  /**
   * Invalida cache quando categorias mudam
   */
  async onCategoriesChange(storeId: string, slug: string): Promise<void> {
    await Promise.all([
      cache.del(cacheKeys.categories(storeId)),
      cache.del(cacheKeys.publicMenu(slug)),
    ])
  },

  /**
   * Invalida cache quando settings mudam
   */
  async onSettingsChange(storeId: string): Promise<void> {
    await cache.del(cacheKeys.storeSettings(storeId))
  }
}
