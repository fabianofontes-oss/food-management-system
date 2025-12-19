import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { requireInternalAuth, blockInProduction } from '@/lib/security/internal-auth'

const execAsync = promisify(exec)

export async function POST(request: Request) {
  // SECURITY: Bloquear em produção (executa código Python)
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
    const { stdout, stderr } = await execAsync('python scripts/auditor_funcional.py', {
      cwd: process.cwd(),
      timeout: 60000, // 60 segundos timeout
    })

    return NextResponse.json({
      success: true,
      message: 'Auditoria concluída com sucesso!',
      output: stdout,
      errors: stderr || null
    })
  } catch (error: any) {
    console.error('Erro ao executar auditoria:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Erro ao executar auditoria',
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
    message: 'Use POST para executar a auditoria',
    note: 'Endpoint disponível apenas em desenvolvimento'
  })
}
