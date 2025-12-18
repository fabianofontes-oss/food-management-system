import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST() {
  try {
    // O script faxineiro.py precisa de confirmação, então vamos criar uma versão
    // que aceita "s" automaticamente via stdin
    const { stdout, stderr } = await execAsync(
      'echo s | python scripts/faxineiro.py',
      {
        cwd: process.cwd(),
        timeout: 120000, // 2 minutos timeout
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Faxina concluída com sucesso!',
      output: stdout,
      errors: stderr || null
    })
  } catch (error: any) {
    console.error('Erro ao executar faxina:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Erro ao executar faxina',
      error: error.message,
      output: error.stdout || null,
      errors: error.stderr || null
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST para executar a faxina automática'
  })
}
