import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Singleton para evitar múltiplas instâncias do GoTrueClient
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return browserClient as any
}
