import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { requireInternalAuth, blockInProduction } from '@/lib/security/internal-auth'

const execAsync = promisify(exec)

export async function POST(request: Request) {
  // SECURITY: Bloquear em produção (modifica código-fonte)
  try {
    blockInProduction()
    requireInternalAuth(request)
  } catch (error) {
    if (error instanceof Response) {
      return error
    }
    throw error
  }

  try {
    const { stdout, stderr } = await execAsync('python scripts/fix_localhost.py', {
      cwd: process.cwd(),
      timeout: 60000,
    })

    return NextResponse.json({
      success: true,
      message: 'URLs localhost corrigidas com sucesso!',
      output: stdout,
      errors: stderr || null
    })
  } catch (error: any) {
    console.error('Erro ao corrigir localhost:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Erro ao corrigir URLs',
      error: error.message,
      output: error.stdout || null,
      errors: error.stderr || null
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  // SECURITY: Proteger endpoint
  try {
    requireInternalAuth(request)
  } catch (error) {
    if (error instanceof Response) {
      return error
    }
    throw error
  }

  return NextResponse.json({
    message: 'Use POST para executar a correção de URLs localhost',
    note: 'Endpoint disponível apenas em desenvolvimento'
  })
}
