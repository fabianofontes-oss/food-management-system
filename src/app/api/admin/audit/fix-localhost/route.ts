import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST() {
  // Verifica se está em produção (Vercel não tem Python)
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      success: false,
      message: 'Correção de código só funciona em ambiente de desenvolvimento local.',
      isProduction: true
    }, { status: 400 })
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

export async function GET() {
  return NextResponse.json({
    message: 'Use POST para executar a correção de URLs localhost'
  })
}
