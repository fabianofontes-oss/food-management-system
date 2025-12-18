import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST() {
  // Verifica se está em produção (Vercel não tem Python)
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      success: false,
      message: 'Scripts Python só funcionam em ambiente de desenvolvimento local.',
      isProduction: true
    }, { status: 400 })
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

export async function GET() {
  return NextResponse.json({
    message: 'Use POST para executar a auditoria'
  })
}
