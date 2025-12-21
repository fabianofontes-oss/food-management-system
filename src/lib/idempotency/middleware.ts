/**
 * Idempotency Middleware
 * 
 * Previne operações duplicadas usando idempotency keys.
 * Para usar em rotas críticas (checkout, pagamentos, webhooks).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export interface IdempotencyOptions {
  /**
   * TTL da key em segundos (padrão: 24 horas)
   */
  ttl?: number
  
  /**
   * Se true, gera key automaticamente se não fornecida
   */
  autoGenerate?: boolean
  
  /**
   * Nome do header (padrão: Idempotency-Key)
   */
  headerName?: string
}

/**
 * Wrapper para adicionar idempotência a uma rota
 * 
 * @example
 * export const POST = withIdempotency(async (req) => {
 *   // Sua lógica aqui
 *   return NextResponse.json({ success: true })
 * })
 */
export function withIdempotency(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: IdempotencyOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const {
      ttl = 86400, // 24 horas
      autoGenerate = false,
      headerName = 'Idempotency-Key',
    } = options

    // Apenas para métodos que modificam dados
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return handler(req)
    }

    try {
      const supabase = await createClient()
      
      // Buscar tenant_id do usuário autenticado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return handler(req) // Sem autenticação, prosseguir normalmente
      }

      const { data: storeUser } = await supabase
        .from('store_users')
        .select('store_id, stores!inner(tenant_id)')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (!storeUser) {
        return handler(req) // Sem tenant, prosseguir normalmente
      }

      const tenantId = (storeUser as any).stores?.tenant_id
      if (!tenantId) {
        return handler(req)
      }

      // Buscar idempotency key do header
      let idempotencyKey = req.headers.get(headerName)

      // Se não fornecida e autoGenerate está ativo, gerar
      if (!idempotencyKey && autoGenerate) {
        idempotencyKey = crypto.randomUUID()
      }

      // Se não tem key, prosseguir normalmente
      if (!idempotencyKey) {
        return handler(req)
      }

      // Validar formato da key (deve ser UUID v4)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(idempotencyKey)) {
        return NextResponse.json(
          { error: 'Invalid Idempotency-Key format. Must be UUID v4.' },
          { status: 400 }
        )
      }

      // Calcular hash do request body
      const body = await req.text()
      const requestHash = crypto
        .createHash('sha256')
        .update(body)
        .digest('hex')

      // Verificar se key já existe
      const { data: existingKey } = await supabase
        .from('idempotency_keys')
        .select('response, status_code, request_hash')
        .eq('key', idempotencyKey)
        .eq('tenant_id', tenantId)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (existingKey) {
        // Key encontrada - verificar se request é idêntico
        if (existingKey.request_hash !== requestHash) {
          return NextResponse.json(
            { error: 'Idempotency-Key already used with different request body' },
            { status: 409 }
          )
        }

        // Retornar resposta cacheada
        return NextResponse.json(
          existingKey.response,
          { 
            status: existingKey.status_code,
            headers: {
              'X-Idempotency-Replay': 'true',
            }
          }
        )
      }

      // Key não existe - processar request normalmente
      const response = await handler(req)

      // Salvar resposta para futuras requisições
      if (response.ok) {
        const responseBody = await response.clone().json()
        
        await supabase.from('idempotency_keys').insert({
          key: idempotencyKey,
          tenant_id: tenantId,
          request_hash: requestHash,
          response: responseBody,
          status_code: response.status,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + ttl * 1000).toISOString(),
        })
      }

      return response

    } catch (error) {
      console.error('[Idempotency] Erro:', error)
      // Em caso de erro, prosseguir normalmente
      return handler(req)
    }
  }
}

/**
 * Gera uma idempotency key válida (UUID v4)
 */
export function generateIdempotencyKey(): string {
  return crypto.randomUUID()
}

/**
 * Valida se uma string é uma idempotency key válida
 */
export function isValidIdempotencyKey(key: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(key)
}

/**
 * Limpa idempotency keys expiradas (executar via cron)
 */
export async function cleanupExpiredKeys(): Promise<number> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.rpc('cleanup_expired_idempotency_keys')
    
    if (error) {
      console.error('[Idempotency] Erro ao limpar keys:', error)
      return 0
    }
    
    return data || 0
  } catch (error) {
    console.error('[Idempotency] Erro ao limpar keys:', error)
    return 0
  }
}
