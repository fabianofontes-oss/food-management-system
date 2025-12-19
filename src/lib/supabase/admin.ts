import 'server-only'

/**
 * Supabase Admin Client
 * 
 * SECURITY: Este arquivo usa 'server-only' para garantir que NUNCA será
 * incluído no bundle do cliente. Qualquer tentativa de importar este arquivo
 * em um client component resultará em erro de build.
 * 
 * USO: Apenas em:
 * - API Route Handlers (src/app/api/**)
 * - Server Actions (arquivos com 'use server')
 * - Server Components (sem 'use client')
 * - Repositories server-only
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
}

if (!serviceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
}

/**
 * Supabase Admin Client (Singleton)
 * 
 * Usa SERVICE_ROLE_KEY que bypassa Row Level Security (RLS).
 * Use com EXTREMO CUIDADO.
 * 
 * IMPORTANTE:
 * - Sempre valide autenticação/autorização antes de usar
 * - Nunca exponha dados sensíveis sem verificação
 * - Prefira usar createClient() do server.ts quando possível
 */
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * Cria uma nova instância do Admin Client
 * 
 * Use esta função se precisar de configurações customizadas.
 * Na maioria dos casos, use `supabaseAdmin` diretamente.
 */
export function createAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL and Service Role Key are required')
  }
  
  return createClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
