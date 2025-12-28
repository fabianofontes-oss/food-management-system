import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const checks = {
    database: false,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  }

  try {
    // Verificar conexão com Supabase
    const supabase = await createClient()
    const { error } = await supabase.from('stores').select('id').limit(1)
    
    checks.database = !error

    const allHealthy = checks.database
    const status = allHealthy ? 'healthy' : 'degraded'

    return NextResponse.json({
      status,
      checks,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }, {
      status: allHealthy ? 200 : 503
    })
  } catch (error) {
    console.error('[Health Check] Error:', error)
    
    return NextResponse.json({
      status: 'down',
      checks,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 503
    })
  }
}
